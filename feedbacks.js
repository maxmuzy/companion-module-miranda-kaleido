// ============================================================
//  Kaleido Remote Control Protocol (Gateway) — feedbacks.js
//  Feedbacks read from self.state (populated by the TCP parser
//  in index.js) and allow buttons to change colour/style based
//  on the live state of the Kaleido device.
// ============================================================

import { combineRgb } from '@companion-module/base'

export function getFeedbackDefinitions(self) {
	return {

		// ── Session ───────────────────────────────────────────

		session_open: {
			type: 'boolean',
			name: 'Session: Is Session Open?',
			description: 'Active when a Gateway session is currently open (last openID received an <ack/>).',
			defaultStyle: {
				bgcolor: combineRgb(0, 180, 0),
				color:   combineRgb(255, 255, 255),
			},
			options: [],
			callback: (_feedback) => {
				return self.state.session_open === true
			},
		},

		// ── Layout ────────────────────────────────────────────

		layout_is: {
			type: 'boolean',
			name: 'Layout: Current Layout Matches',
			description: 'Active when the currently loaded layout matches the specified name.',
			defaultStyle: {
				bgcolor: combineRgb(0, 100, 200),
				color:   combineRgb(255, 255, 255),
			},
			options: [
				{
					type: 'textinput',
					id: 'layout',
					label: 'Layout name (e.g. Main.xml)',
					default: 'Main.xml',
					useVariables: true,
				},
			],
			callback: async (feedback, context) => {
				const expected = (await context.parseVariablesInString(feedback.options.layout)).trim()
				const current  = (self.state.current_layout || '').trim()
				// Allow matching with or without .xml extension
				return current === expected || current === expected.replace(/\.xml$/i, '')
			},
		},

		// ── Audio mode ────────────────────────────────────────

		audio_mode_is: {
			type: 'boolean',
			name: 'Audio: Monitoring Mode Matches',
			description: 'Active when the current audio monitoring mode matches the selection.',
			defaultStyle: {
				bgcolor: combineRgb(200, 100, 0),
				color:   combineRgb(255, 255, 255),
			},
			options: [
				{
					type: 'dropdown',
					id: 'mode',
					label: 'Expected Mode',
					default: 'NORMAL',
					choices: [
						{ id: 'NORMAL', label: 'NORMAL'  },
						{ id: 'MUTE',   label: 'MUTE'    },
						{ id: '-20 dB', label: '–20 dB'  },
					],
				},
			],
			callback: (feedback) => {
				return (self.state.audio_out_mode || '') === feedback.options.mode
			},
		},

		audio_muted: {
			type: 'boolean',
			name: 'Audio: Is Muted?',
			description: 'Active when the audio monitoring is muted (mode=MUTE or type=NONE).',
			defaultStyle: {
				bgcolor: combineRgb(180, 0, 0),
				color:   combineRgb(255, 255, 255),
			},
			options: [],
			callback: (_feedback) => {
				return (
					self.state.audio_out_mode === 'MUTE' ||
					self.state.audio_out_type === 'NONE'
				)
			},
		},

		audio_source_type_is: {
			type: 'boolean',
			name: 'Audio: Source Type Matches',
			description: 'Active when the currently monitored audio source type matches.',
			defaultStyle: {
				bgcolor: combineRgb(0, 120, 180),
				color:   combineRgb(255, 255, 255),
			},
			options: [
				{
					type: 'dropdown',
					id: 'type',
					label: 'Source Type',
					default: 'EMBEDDED',
					choices: [
						{ id: 'EMBEDDED',  label: 'Embedded (SDI)' },
						{ id: 'AUDIOCARD', label: 'Audio Card'     },
						{ id: 'NONE',      label: 'None (muted)'   },
					],
				},
			],
			callback: (feedback) => {
				return (self.state.audio_out_type || '') === feedback.options.type
			},
		},

		// ── Alarm Status ──────────────────────────────────────

		alarm_status_is: {
			type: 'boolean',
			name: 'Alarm: Last Alarm Status Matches',
			description: 'Active when the last alarm status set/received matches the selection.',
			defaultStyle: {
				bgcolor: combineRgb(200, 0, 0),
				color:   combineRgb(255, 255, 255),
			},
			options: [
				{
					type: 'dropdown',
					id: 'status',
					label: 'Expected Status',
					default: 'CRITICAL',
					choices: [
						{ id: 'NORMAL',   label: 'NORMAL'   },
						{ id: 'MINOR',    label: 'MINOR'    },
						{ id: 'MAJOR',    label: 'MAJOR'    },
						{ id: 'CRITICAL', label: 'CRITICAL' },
						{ id: 'DISABLE',  label: 'DISABLE'  },
					],
				},
				{
					type: 'textinput',
					id: 'id',
					label: 'Alarm ID (leave blank to match any)',
					default: '',
					useVariables: true,
				},
			],
			callback: async (feedback, context) => {
				const expectedStatus = feedback.options.status
				const expectedId     = (await context.parseVariablesInString(feedback.options.id)).trim()

				const statusMatch = (self.state.last_alarm_status || '') === expectedStatus
				const idMatch     = expectedId === '' || (self.state.last_alarm_id || '') === expectedId

				return statusMatch && idMatch
			},
		},

		// ── Last command ACK/NACK ─────────────────────────────

		last_command_ack: {
			type: 'boolean',
			name: 'Gateway: Last Command was ACK',
			description: 'Active when the last Gateway response was <ack/> (command succeeded).',
			defaultStyle: {
				bgcolor: combineRgb(0, 180, 0),
				color:   combineRgb(0, 0, 0),
			},
			options: [],
			callback: (_feedback) => {
				return self.state.last_ack === 'ack'
			},
		},

		last_command_nack: {
			type: 'boolean',
			name: 'Gateway: Last Command was NACK',
			description: 'Active when the last Gateway response was <nack/> (command failed).',
			defaultStyle: {
				bgcolor: combineRgb(200, 0, 0),
				color:   combineRgb(255, 255, 255),
			},
			options: [],
			callback: (_feedback) => {
				return self.state.last_ack === 'nack'
			},
		},

	}
}
