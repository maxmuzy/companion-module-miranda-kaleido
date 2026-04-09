// ============================================================
//  companion-module-miranda-kaleido — index.js
//  Kaleido Remote Control Protocol (Gateway)
//  Platform target: Kaleido-Alto / Quad / Quad-Dual (AQ)
//  TCP port: 13000
// ============================================================

import { InstanceBase, InstanceStatus, runEntrypoint, TCPHelper } from '@companion-module/base'

import { ConfigFields }            from './config.js'
import { getActionDefinitions }    from './actions.js'
import { getFeedbackDefinitions }  from './feedbacks.js'
import { getVariableDefinitions }  from './variables.js'

class KaleidoInstance extends InstanceBase {

	// ── Constructor ───────────────────────────────────────────

	constructor(internal) {
		super(internal)

		// Internal device state — populated by the TCP response parser.
		// Feedbacks and variables are always derived from this object.
		this.state = {
			session_open:      false,
			current_layout:    '',
			layout_list:       '',
			last_alarm_id:     '',
			last_alarm_status: '',
			dynamic_text:      '',
			audio_out_type:    '',
			audio_out_input:   '',
			audio_out_group:   '',
			audio_out_aes:     '',
			audio_out_volume:  '',
			audio_out_mode:    '',
			last_response:     '',
			last_ack:          '',
		}

		// TCP receive buffer — accumulates partial XML frames
		this._tcpBuffer  = ''
		this._pendingOpen = false
	}

	// ── Lifecycle ─────────────────────────────────────────────

	/**
	 * Called once when the module is first loaded.
	 * Registers definitions, then delegates to configUpdated()
	 * for the TCP socket — same pattern as the upstream module.
	 */
	async init(config) {
		this.config = config

		this.setVariableDefinitions(getVariableDefinitions())
		this.setActionDefinitions(getActionDefinitions(this))
		this.setFeedbackDefinitions(getFeedbackDefinitions(this))

		// Seed all variables with empty strings on first load
		const initVars = {}
		for (const def of getVariableDefinitions()) {
			initVars[def.variableId] = ''
		}
		this.setVariableValues(initVars)

		await this.configUpdated(config)
	}

	/**
	 * Called on first load (via init) and when the user saves
	 * new settings. Tears down the old socket and reconnects.
	 */
	async configUpdated(config) {
		this.config = config

		if (this.socket) {
			this.socket.destroy()
			delete this.socket
		}

		this._tcpBuffer   = ''
		this._pendingOpen = false
		this._initTCP()
	}

	async destroy() {
		if (this.socket) {
			this.socket.destroy()
			delete this.socket
		} else {
			this.updateStatus(InstanceStatus.Disconnected)
		}
	}

	// Required by Companion — returns config field definitions
	getConfigFields() {
		return ConfigFields
	}

	// ── TCP connection ─────────────────────────────────────────

	_initTCP() {
		if (!this.config.host) {
			this.updateStatus(InstanceStatus.BadConfig, 'No host configured')
			return
		}

		const port = this.config.port || 13000

		this.updateStatus(InstanceStatus.Connecting)

		this.socket = new TCPHelper(this.config.host, port)

		// TCPHelper uses 'status_change' — NOT 'connect' or 'disconnect'
		this.socket.on('status_change', (status, message) => {
			this.updateStatus(status, message)

			if (
				status === InstanceStatus.Disconnected ||
				status === InstanceStatus.ConnectionFailure
			) {
				this._updateState({ session_open: false })
				this._tcpBuffer   = ''
				this._pendingOpen = false
			}
		})

		this.socket.on('error', (err) => {
			this.updateStatus(InstanceStatus.ConnectionFailure, err.message)
			this.log('error', `[Kaleido] TCP error: ${err.message}`)
		})

		this.socket.on('data', (data) => {
			this._handleData(data.toString('utf8'))
		})
	}

	// ── TCP data parser ────────────────────────────────────────

	/**
	 * The Kaleido streams XML back over TCP.
	 * Responses may arrive split across data events, so we
	 * accumulate in a buffer and extract complete elements only.
	 */
	_handleData(chunk) {
		this._tcpBuffer += chunk

		// Match:  <tag/>   OR   <tag>…</tag>
		const tagRegex = /<([a-zA-Z][a-zA-Z0-9]*)(?:\s[^>]*)?>[\s\S]*?<\/\1>|<[a-zA-Z][a-zA-Z0-9]*(?:\s[^>]*)?\s*\/>/g
		let match

		while ((match = tagRegex.exec(this._tcpBuffer)) !== null) {
			this._parseKaleidoResponse(match[0].trim())
		}

		this._tcpBuffer = this._tcpBuffer.replace(tagRegex, '')

		// Safety: prevent unbounded buffer growth from garbage data
		if (this._tcpBuffer.length > 4096) {
			this.log('warn', '[Kaleido] Receive buffer overflow — flushing.')
			this._tcpBuffer = ''
		}
	}

	/**
	 * Parse one complete XML element and update internal state.
	 */
	_parseKaleidoResponse(xml) {
		this.log('debug', `[Kaleido] ← ${xml}`)

		const updates = { last_response: xml }

		// ── <ack/> ────────────────────────────────────────────
		if (/<ack\s*\/>/.test(xml)) {
			updates.last_ack = 'ack'
			if (this._pendingOpen) {
				updates.session_open = true
				this._pendingOpen = false
			}
		}

		// ── <nack/> ───────────────────────────────────────────
		else if (/<nack\s*\/>/.test(xml)) {
			updates.last_ack = 'nack'
			if (this._pendingOpen) {
				updates.session_open = false
				this._pendingOpen = false
			}
		}

		// ── <kCurrentLayout> ──────────────────────────────────
		else if (xml.startsWith('<kCurrentLayout>')) {
			const m = xml.match(/<kCurrentLayout>([^<]+)<\/kCurrentLayout>/)
			if (m) updates.current_layout = m[1].trim()
		}

		// ── <kLayoutList> ─────────────────────────────────────
		else if (xml.startsWith('<kLayoutList>')) {
			const m = xml.match(/<kLayoutList>([\s\S]*?)<\/kLayoutList>/)
			if (m) updates.layout_list = m[1].trim().replace(/\s+/g, ', ')
		}

		// ── <kDynamicText> ────────────────────────────────────
		else if (xml.startsWith('<kDynamicText>')) {
			const m = xml.match(/<kDynamicText>([\s\S]*?)<\/kDynamicText>/)
			if (m) updates.dynamic_text = m[1].trim()
		}

		// ── <kAudioOut> ───────────────────────────────────────
		else if (xml.startsWith('<kAudioOut>')) {
			const inner = xml.match(/<kAudioOut>([\s\S]*?)<\/kAudioOut>/)
			if (inner) {
				const body   = inner[1]
				const typeM  = body.match(/Type="([^"]+)"/)
				const inputM = body.match(/Input="([^"]+)"/)
				const groupM = body.match(/Group="([^"]+)"/)
				const aesM   = body.match(/AES="([^"]+)"/)

				updates.audio_out_type  = typeM  ? typeM[1]  : ''
				updates.audio_out_input = inputM ? inputM[1] : ''
				updates.audio_out_group = groupM ? groupM[1] : ''
				updates.audio_out_aes   = aesM   ? aesM[1]   : ''
			}
		}

		// ── <kAudioOutVolume> ─────────────────────────────────
		else if (xml.startsWith('<kAudioOutVolume>')) {
			const m = xml.match(/volume="([^"]+)"/)
			if (m) updates.audio_out_volume = m[1]
		}

		// ── <kAudioOutMode> ───────────────────────────────────
		else if (xml.startsWith('<kAudioOutMode>')) {
			const m = xml.match(/mode="([^"]+)"/)
			if (m) updates.audio_out_mode = m[1]
		}

		this._updateState(updates)
	}

	// ── State management ──────────────────────────────────────

	/**
	 * Merge updates into this.state, push variable values to
	 * Companion and trigger feedback re-evaluation.
	 */
	_updateState(updates) {
		let changed = false

		for (const [key, value] of Object.entries(updates)) {
			if (this.state[key] !== value) {
				this.state[key] = value
				changed = true
			}
		}

		if (!changed) return

		const varUpdates = {}
		for (const key of Object.keys(updates)) {
			const v = this.state[key]
			varUpdates[key] = v === true ? 'true' : v === false ? 'false' : String(v ?? '')
		}
		this.setVariableValues(varUpdates)

		this.checkFeedbacks(
			'session_open',
			'layout_is',
			'audio_mode_is',
			'audio_muted',
			'audio_source_type_is',
			'alarm_status_is',
			'last_command_ack',
			'last_command_nack',
		)
	}

	// ── Public helper (used by actions.js) ───────────────────

	/**
	 * Send one Gateway XML command, terminated with \n as required
	 * by the Kaleido protocol spec. Pass isOpenID=true so the
	 * module knows to watch for the ack and update session state.
	 */
	sendCommand(cmd, isOpenID = false) {
		if (isOpenID) this._pendingOpen = true

		const payload = Buffer.from(cmd + '\n', 'utf8')

		if (this.socket !== undefined && this.socket.isConnected) {
			this.log('debug', `[Kaleido] → ${cmd}`)
			this.socket.send(payload)
		} else {
			this.log('warn', '[Kaleido] Socket not connected — command dropped.')
		}
	}
}

runEntrypoint(KaleidoInstance, [])
