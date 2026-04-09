// ============================================================
//  Kaleido Remote Control Protocol (Gateway) — variables.js
//  Define all module variables that will be exposed in Companion.
//  Values are updated by the TCP response parser in index.js
//  whenever the Kaleido sends back data.
// ============================================================

export function getVariableDefinitions() {
	return [
		// ── Session ───────────────────────────────────────────
		{
			variableId: 'session_open',
			name: 'Session: Is Open (true/false)',
		},

		// ── Layout ────────────────────────────────────────────
		{
			variableId: 'current_layout',
			name: 'Layout: Name of the currently loaded layout',
		},
		{
			variableId: 'layout_list',
			name: 'Layout: Full list of available layouts (comma-separated)',
		},

		// ── Alarm / Status ────────────────────────────────────
		{
			variableId: 'last_alarm_id',
			name: 'Alarm: ID of the last alarm set via setKStatusMessage',
		},
		{
			variableId: 'last_alarm_status',
			name: 'Alarm: Status of the last alarm (NORMAL/MINOR/MAJOR/CRITICAL/DISABLE)',
		},

		// ── Dynamic Text ──────────────────────────────────────
		{
			variableId: 'dynamic_text',
			name: 'Text: Last dynamic text retrieved (getKDynamicText response)',
		},

		// ── Audio ─────────────────────────────────────────────
		{
			variableId: 'audio_out_type',
			name: 'Audio: Current output type (EMBEDDED / AUDIOCARD / NONE)',
		},
		{
			variableId: 'audio_out_input',
			name: 'Audio: Current output input number',
		},
		{
			variableId: 'audio_out_group',
			name: 'Audio: Current embedded group (1–4)',
		},
		{
			variableId: 'audio_out_aes',
			name: 'Audio: Current embedded AES (1 or 2)',
		},
		{
			variableId: 'audio_out_volume',
			name: 'Audio: Current monitoring volume (dB)',
		},
		{
			variableId: 'audio_out_mode',
			name: 'Audio: Current monitoring mode (NORMAL / MUTE / -20 dB)',
		},

		// ── Gateway raw response ──────────────────────────────
		{
			variableId: 'last_response',
			name: 'Gateway: Raw last response received from the Kaleido',
		},
		{
			variableId: 'last_ack',
			name: 'Gateway: Last command result (ack / nack)',
		},
	]
}
