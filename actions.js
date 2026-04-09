// ============================================================
//  Kaleido Remote Control Protocol (Gateway) — actions.js
//  Targeted platform: Kaleido-Alto / Quad / Quad-Dual  (AQ)
//  Protocol: TCP/IP  Port: 13000
//  All commands must be terminated with \n per the spec.
// ============================================================

// --------------- Shared choice lists -------------------------

const CHOICES_ALARM_STATUS = [
	{ id: 'NORMAL',   label: 'NORMAL (OK)'         },
	{ id: 'MINOR',    label: 'MINOR (WARNING)'      },
	{ id: 'MAJOR',    label: 'MAJOR'                },
	{ id: 'CRITICAL', label: 'CRITICAL (ERROR)'     },
	{ id: 'DISABLE',  label: 'DISABLE'              },
]

const CHOICES_TIMER_DIRECTION = [
	{ id: 'UP',   label: 'Count Up'   },
	{ id: 'DOWN', label: 'Count Down' },
]

const CHOICES_TIMER_LOOP = [
	{ id: 'ON',  label: 'ON  – Loop continuously' },
	{ id: 'OFF', label: 'OFF – Stop at end'       },
]

const CHOICES_TIMER_TRIGGER = [
	{ id: 'START', label: 'START' },
	{ id: 'STOP',  label: 'STOP'  },
	{ id: 'RESET', label: 'RESET' },
]

const CHOICES_AUDIO_MODE = [
	{ id: 'NORMAL', label: 'NORMAL'   },
	{ id: 'MUTE',   label: 'MUTE'     },
	{ id: '-20 dB', label: '–20 dB'   },
]

const CHOICES_AUDIO_TYPE = [
	{ id: 'EMBEDDED',  label: 'Embedded (SDI)'   },
	{ id: 'AUDIOCARD', label: 'Audio Card Input'  },
	{ id: 'NONE',      label: 'None (Mute)'       },
]

const CHOICES_ICONTROL_MODE = [
	{ id: '0', label: '0 – Color not keyed' },
	{ id: '1', label: '1 – Color key enabled' },
]

// --------------- Helper: send TCP command --------------------

/**
 * Delegates to self.sendCommand() which lives in index.js.
 * Keeps actions.js decoupled from raw socket access.
 * Pass isOpenID=true for openID so session state is tracked.
 */
function sendCommand(self, cmd, isOpenID = false) {
	self.sendCommand(cmd, isOpenID)
}

// --------------- Action definitions --------------------------

export function getActionDefinitions(self) {
	return {

		// ── Session ──────────────────────────────────────────────

		openID: {
			name: 'Session: Open (openID)',
			description: 'Opens a Gateway session. IP dots must be replaced by underscores (e.g. 192_168_1_10).',
			options: [
				{
					type: 'textinput',
					id: 'ip',
					label: 'Kaleido IP (dots as underscores)',
					default: '192_168_1_10',
					useVariables: true,
					tooltip: 'Use underscores instead of dots. E.g. 10.0.0.5 → 10_0_0_5',
				},
			],
			callback: async (action, context) => {
				const ip = (await context.parseVariablesInString(action.options.ip)).trim()
				sendCommand(self, `<openID>${ip}</openID>`, true)
			},
		},

		closeID: {
			name: 'Session: Close (closeID)',
			description: 'Closes the current Gateway session. IP dots must be replaced by underscores.',
			options: [
				{
					type: 'textinput',
					id: 'ip',
					label: 'Kaleido IP (dots as underscores)',
					default: '192_168_1_10',
					useVariables: true,
					tooltip: 'Use underscores instead of dots. E.g. 10.0.0.5 → 10_0_0_5',
				},
			],
			callback: async (action, context) => {
				const ip = (await context.parseVariablesInString(action.options.ip)).trim()
				sendCommand(self, `<closeID>${ip}</closeID>`)
			},
		},

		// ── Layout ───────────────────────────────────────────────

		getKCurrentLayout: {
			name: 'Layout: Get Current Layout',
			description: 'Requests the name of the layout currently displayed on the Kaleido.',
			options: [],
			callback: async (_action, _context) => {
				sendCommand(self, '<getKCurrentLayout/>')
			},
		},

		setKCurrentLayout: {
			name: 'Layout: Load Layout',
			description: 'Loads the specified layout. The layout must have been exported to the Kaleido beforehand. Extension .xml is added automatically if omitted.',
			options: [
				{
					type: 'textinput',
					id: 'layout',
					label: 'Layout filename (e.g. MyLayout.xml)',
					default: 'MyLayout.xml',
					useVariables: true,
					tooltip: 'For Kaleido-Alto/Quad/Quad-Dual the extension is .xml',
				},
			],
			callback: async (action, context) => {
				let layout = (await context.parseVariablesInString(action.options.layout)).trim()
				// Ensure .xml extension for AQ systems
				if (!layout.toLowerCase().endsWith('.xml') && !layout.includes('.')) {
					layout += '.xml'
				}
				sendCommand(self, `<setKCurrentLayout>set ${layout}</setKCurrentLayout>`)
			},
		},

		getKLayoutList: {
			name: 'Layout: Get Layout List',
			description: 'Requests the list of all available layouts on the Kaleido.',
			options: [],
			callback: async (_action, _context) => {
				sendCommand(self, '<getKLayoutList/>')
			},
		},

		setKSaveLayout: {
			name: 'Layout: Save Current Layout',
			description: 'Saves the layout currently displayed to a file. Do NOT include the file extension (.xml is added automatically).',
			options: [
				{
					type: 'textinput',
					id: 'name',
					label: 'File name (no extension)',
					default: 'SavedLayout',
					useVariables: true,
					tooltip: 'The .xml extension will be added automatically by the Kaleido.',
				},
			],
			callback: async (action, context) => {
				const name = (await context.parseVariablesInString(action.options.name)).trim()
				sendCommand(self, `<setKSaveLayout>set name="${name}"</setKSaveLayout>`)
			},
		},

		// ── Source / Channel ─────────────────────────────────────

		setKChannel: {
			name: 'Source: Assign Channel to Monitor',
			description: 'Assigns a logical source (channel) to the specified monitor in the current layout.',
			options: [
				{
					type: 'textinput',
					id: 'channelname',
					label: 'Channel Name',
					default: 'Channel 1',
					useVariables: true,
					tooltip: 'The name of the logical source to assign.',
				},
				{
					type: 'textinput',
					id: 'monitor',
					label: 'Monitor Number / ID',
					default: 'composite1',
					useVariables: true,
					tooltip: 'The monitor identifier as defined in the layout (XEdit Properties > Assignments > Name).',
				},
			],
			callback: async (action, context) => {
				const ch  = (await context.parseVariablesInString(action.options.channelname)).trim()
				const mon = (await context.parseVariablesInString(action.options.monitor)).trim()
				sendCommand(self, `<setKChannel>set channelname=${ch} monitor=${mon}</setKChannel>`)
			},
		},

		// ── Alarms & Status ──────────────────────────────────────

		setKStatusMessage: {
			name: 'Alarm: Set Gateway Alarm Status',
			description: 'Sets a Gateway alarm to the specified state. ID must be a numeric value 0–1024 for Kaleido-Alto/Quad/Quad-Dual.',
			options: [
				{
					type: 'textinput',
					id: 'id',
					label: 'Alarm ID (numeric 0–1024)',
					default: '1',
					useVariables: true,
					tooltip: 'Must be a number between 0 and 1024.',
				},
				{
					type: 'dropdown',
					id: 'status',
					label: 'Status',
					default: 'NORMAL',
					choices: CHOICES_ALARM_STATUS,
				},
				{
					type: 'textinput',
					id: 'message',
					label: 'Message (reserved — currently ignored)',
					default: '',
					useVariables: false,
				},
			],
			callback: async (action, context) => {
				const id      = (await context.parseVariablesInString(action.options.id)).trim()
				const status  = action.options.status
				const message = action.options.message || ''
				sendCommand(self, `<setKStatusMessage>set id="${id}" status="${status}" message="${message}"</setKStatusMessage>`)
			},
		},

		// ── Dynamic Text / UMD ───────────────────────────────────

		setKDynamicText: {
			name: 'Text: Set Dynamic Text (UMD/Label)',
			description: 'Sends text to a UMD or text-label component configured with Service ID = "Gateway". Address must be numeric 0–1024.',
			options: [
				{
					type: 'textinput',
					id: 'address',
					label: 'Text Address (numeric 0–1024)',
					default: '1',
					useVariables: true,
					tooltip: 'The address configured on the UMD / text label component in KEdit.',
				},
				{
					type: 'textinput',
					id: 'text',
					label: 'Text to display',
					default: 'Hello',
					useVariables: true,
				},
			],
			callback: async (action, context) => {
				const addr = (await context.parseVariablesInString(action.options.address)).trim()
				const text = (await context.parseVariablesInString(action.options.text)).trim()
				sendCommand(self, `<setKDynamicText>set address=${addr} text=${text}</setKDynamicText>`)
			},
		},

		// ── Timers ───────────────────────────────────────────────

		setKTimer: {
			name: 'Timer: Configure Countdown Timer',
			description: 'Configures the specified countdown timer component (preset, direction and loop behaviour).',
			options: [
				{
					type: 'textinput',
					id: 'id',
					label: 'Timer ID',
					default: 'timer1',
					useVariables: true,
				},
				{
					type: 'textinput',
					id: 'preset',
					label: 'Preset time (HH:MM:SS)',
					default: '00:01:00',
					useVariables: true,
					tooltip: 'Format: HH:MM:SS  e.g. 00:05:00 for 5 minutes.',
				},
				{
					type: 'dropdown',
					id: 'direction',
					label: 'Direction',
					default: 'DOWN',
					choices: CHOICES_TIMER_DIRECTION,
				},
				{
					type: 'dropdown',
					id: 'loop',
					label: 'Loop',
					default: 'OFF',
					choices: CHOICES_TIMER_LOOP,
				},
			],
			callback: async (action, context) => {
				const id        = (await context.parseVariablesInString(action.options.id)).trim()
				const preset    = (await context.parseVariablesInString(action.options.preset)).trim()
				const direction = action.options.direction
				const loop      = action.options.loop
				sendCommand(self, `<setKTimer>set id="${id}" preset="${preset}" direction="${direction}" loop="${loop}"</setKTimer>`)
			},
		},

		setKTimerTrigger: {
			name: 'Timer: Start / Stop / Reset Timer',
			description: 'Starts, stops or resets the specified countdown timer component.',
			options: [
				{
					type: 'textinput',
					id: 'id',
					label: 'Timer ID',
					default: 'timer1',
					useVariables: true,
				},
				{
					type: 'dropdown',
					id: 'trigger',
					label: 'Action',
					default: 'START',
					choices: CHOICES_TIMER_TRIGGER,
				},
			],
			callback: async (action, context) => {
				const id      = (await context.parseVariablesInString(action.options.id)).trim()
				const trigger = action.options.trigger
				sendCommand(self, `<setKTimerTrigger>set id="${id}" trigger="${trigger}"</setKTimerTrigger>`)
			},
		},

		// ── Actions (GPI replacement) ────────────────────────────

		setKFireAction: {
			name: 'Action: Fire Action',
			description: 'Fires a named Action on the Kaleido. The action must have been exported to the multi-viewer.',
			options: [
				{
					type: 'textinput',
					id: 'name',
					label: 'Action friendly name',
					default: 'MyAction',
					useVariables: true,
					tooltip: 'The friendly name of the action as defined in KEdit.',
				},
			],
			callback: async (action, context) => {
				const name = (await context.parseVariablesInString(action.options.name)).trim()
				sendCommand(self, `<setKFireAction>set name="${name}"</setKFireAction>`)
			},
		},

		// ── Audio Monitoring ─────────────────────────────────────

		getKAudioOut: {
			name: 'Audio: Get Current Audio Output',
			description: 'Requests which audio source is currently being monitored.',
			options: [],
			callback: async (_action, _context) => {
				sendCommand(self, '<getKAudioOut/>')
			},
		},

		setKAudioOut_embedded: {
			name: 'Audio: Select Embedded (SDI) Source',
			description: 'Routes an embedded SDI audio source to the audio monitoring output.',
			options: [
				{
					type: 'textinput',
					id: 'input',
					label: 'Video Input (e.g. 1)',
					default: '1',
					useVariables: true,
				},
				{
					type: 'textinput',
					id: 'group',
					label: 'Group (1–4)',
					default: '1',
					useVariables: true,
					tooltip: 'Valid values: 1 to 4',
				},
				{
					type: 'dropdown',
					id: 'aes',
					label: 'AES',
					default: '1',
					choices: [
						{ id: '1', label: '1' },
						{ id: '2', label: '2' },
					],
				},
			],
			callback: async (action, context) => {
				const input = (await context.parseVariablesInString(action.options.input)).trim()
				const group = (await context.parseVariablesInString(action.options.group)).trim()
				const aes   = action.options.aes
				sendCommand(self, `<setKAudioOut>set Type="EMBEDDED" Input="${input}" Group="${group}" AES="${aes}"</setKAudioOut>`)
			},
		},

		setKAudioOut_audiocard: {
			name: 'Audio: Select Audio Card Source',
			description: 'Routes an audio card input to the monitoring output.',
			options: [
				{
					type: 'textinput',
					id: 'input',
					label: 'Card Input Number',
					default: '1',
					useVariables: true,
				},
			],
			callback: async (action, context) => {
				const input = (await context.parseVariablesInString(action.options.input)).trim()
				sendCommand(self, `<setKAudioOut>set Type="AUDIOCARD" Input="${input}"</setKAudioOut>`)
			},
		},

		setKAudioOut_none: {
			name: 'Audio: Mute / Stop Monitoring',
			description: 'Stops audio monitoring and mutes the output (Type=NONE).',
			options: [],
			callback: async (_action, _context) => {
				sendCommand(self, '<setKAudioOut>set Type="NONE"</setKAudioOut>')
			},
		},

		getKAudioOutVolume: {
			name: 'Audio: Get Monitoring Volume',
			description: 'Retrieves the current audio monitoring volume (dB).',
			options: [],
			callback: async (_action, _context) => {
				sendCommand(self, '<getKAudioOutVolume/>')
			},
		},

		setKAudioOutVolume: {
			name: 'Audio: Set Monitoring Volume',
			description: 'Sets the audio monitoring output volume. Valid range: –90 dB to 0 dB for Kaleido-Alto/Quad/Quad-Dual.',
			options: [
				{
					type: 'number',
					id: 'volume',
					label: 'Volume (dB, –90 to 0)',
					default: -20,
					min: -90,
					max: 0,
					step: 1,
					tooltip: 'Range –90 to 0 dB. Setting a value will also unmute if muted.',
				},
			],
			callback: async (action, _context) => {
				const vol = action.options.volume
				sendCommand(self, `<setKAudioOutVolume>set volume="${vol}"</setKAudioOutVolume>`)
			},
		},

		getKAudioOutMode: {
			name: 'Audio: Get Monitoring Mode',
			description: 'Retrieves the current audio monitoring mode (NORMAL / MUTE / –20 dB).',
			options: [],
			callback: async (_action, _context) => {
				sendCommand(self, '<getKAudioOutMode/>')
			},
		},

		setKAudioOutMode: {
			name: 'Audio: Set Monitoring Mode',
			description: 'Sets the audio monitoring mode to NORMAL, MUTE, or –20 dB.',
			options: [
				{
					type: 'dropdown',
					id: 'mode',
					label: 'Mode',
					default: 'NORMAL',
					choices: CHOICES_AUDIO_MODE,
				},
			],
			callback: async (action, _context) => {
				const mode = action.options.mode
				sendCommand(self, `<setKAudioOutMode>set mode="${mode}"</setKAudioOutMode>`)
			},
		},

		// ── AQ-only: Graphics / Overlay ──────────────────────────

		setKVerticalOffset: {
			name: 'Display: Set Vertical Offset (AQ only)',
			description: 'Offsets the CPU graphics output vertically within the final DVI output. Range: 0–175 lines.',
			options: [
				{
					type: 'number',
					id: 'offset',
					label: 'Offset (lines, 0–175)',
					default: 0,
					min: 0,
					max: 175,
					step: 1,
				},
			],
			callback: async (action, _context) => {
				const offset = action.options.offset
				sendCommand(self, `<setKVerticalOffset>set offset="${offset}"</setKVerticalOffset>`)
			},
		},

		setKIcontrolMode: {
			name: 'iControl: Set Color-Key Mode (AQ only)',
			description: 'Enables or disables keying of the detected mouse-pointer colors on video.',
			options: [
				{
					type: 'dropdown',
					id: 'mode',
					label: 'Mode',
					default: '0',
					choices: CHOICES_ICONTROL_MODE,
				},
			],
			callback: async (action, _context) => {
				const mode = action.options.mode
				sendCommand(self, `<setKIcontrolMode>set mode="${mode}"</setKIcontrolMode>`)
			},
		},

		setKMouseColorA: {
			name: 'iControl: Set Mouse Color A (AQ only)',
			description: 'Sets color A to be keyed over the video. Format: FFBBGGRR (hex). Example: FFFF00FF = magenta.',
			options: [
				{
					type: 'textinput',
					id: 'color',
					label: 'Color (FFBBGGRR hex)',
					default: 'FFFF00FF',
					useVariables: false,
					tooltip: 'Hex format: FF + BB (blue) + GG (green) + RR (red). E.g. FFFF00FF = magenta.',
				},
			],
			callback: async (action, _context) => {
				const color = action.options.color.trim().toUpperCase()
				sendCommand(self, `<setKMouseColorA>set mouseColorA="${color}"</setKMouseColorA>`)
			},
		},

		setKMouseColorB: {
			name: 'iControl: Set Mouse Color B (AQ only)',
			description: 'Sets color B to be keyed over the video. Format: FFBBGGRR (hex). Example: FFFF00FF = magenta.',
			options: [
				{
					type: 'textinput',
					id: 'color',
					label: 'Color (FFBBGGRR hex)',
					default: 'FF0000FF',
					useVariables: false,
					tooltip: 'Hex format: FF + BB (blue) + GG (green) + RR (red).',
				},
			],
			callback: async (action, _context) => {
				const color = action.options.color.trim().toUpperCase()
				sendCommand(self, `<setKMouseColorB>set mouseColorB="${color}"</setKMouseColorB>`)
			},
		},

		setKMouseColorC: {
			name: 'iControl: Set Mouse Color C (AQ only)',
			description: 'Sets color C to be keyed over the video. Format: FFBBGGRR (hex). Example: FFFF00FF = magenta.',
			options: [
				{
					type: 'textinput',
					id: 'color',
					label: 'Color (FFBBGGRR hex)',
					default: 'FF00FF00',
					useVariables: false,
					tooltip: 'Hex format: FF + BB (blue) + GG (green) + RR (red).',
				},
			],
			callback: async (action, _context) => {
				const color = action.options.color.trim().toUpperCase()
				sendCommand(self, `<setKMouseColorC>set mouseColorC="${color}"</setKMouseColorC>`)
			},
		},

		// ── Raw / Generic (kept from original module) ─────────────

		send: {
			name: 'Raw: Send Text Command',
			description: 'Sends a raw text command directly to the Gateway (legacy / advanced use).',
			options: [
				{
					type: 'textinput',
					id: 'id_send',
					label: 'Command:',
					tooltip: 'The full XML command string to send.',
					default: '',
					useVariables: true,
				},
				{
					type: 'dropdown',
					id: 'id_end',
					label: 'End Character:',
					default: '\n',
					choices: [
						{ id: '\n',   label: 'LF \\n (recommended for Kaleido)' },
						{ id: '\r\n', label: 'CRLF \\r\\n'                       },
						{ id: '\r',   label: 'CR \\r'                            },
						{ id: '',     label: 'None'                              },
					],
				},
			],
			callback: async (action, context) => {
				const cmd = unescape(await context.parseVariablesInString(action.options.id_send))
				if (cmd !== '') {
					const sendBuf = Buffer.from(cmd + action.options.id_end, 'latin1')
					if (self.socket !== undefined && self.socket.isConnected) {
						self.log('debug', 'sending to ' + self.config.host + ': ' + sendBuf.toString())
						self.socket.send(sendBuf)
					} else {
						self.log('debug', 'Socket not connected :(')
					}
				}
			},
		},

	}
}
