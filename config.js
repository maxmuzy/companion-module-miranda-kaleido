// ============================================================
//  companion-module-miranda-kaleido — config.js
//  Exported as a named constant array (ConfigFields),
//  matching the pattern of the upstream generic-tcp-udp module.
// ============================================================

export const ConfigFields = [
	{
		type: 'static-text',
		id: 'info',
		label: 'Information',
		value:
			'Controls a Miranda Kaleido-Alto, Kaleido-Quad or Kaleido-Quad-Dual ' +
			'multi-viewer via the Gateway XML protocol over TCP/IP (port 13000).',
		width: 12,
	},
	{
		type: 'textinput',
		id: 'host',
		label: 'Kaleido IP Address',
		width: 8,
		default: '',
		required: true,
	},
	{
		type: 'number',
		id: 'port',
		label: 'TCP Port',
		width: 4,
		default: 13000,
		min: 1,
		max: 65535,
	},
]
