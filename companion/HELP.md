# Miranda Kaleido Gateway Module

Controls **Kaleido-Alto**, **Kaleido-Quad** and **Kaleido-Quad-Dual** multi-viewers via the Gateway XML protocol over TCP/IP.

## Connection Setup

| Field | Value |
|---|---|
| **Host** | IP address of the Kaleido frame |
| **Port** | `13000` (default — do not change unless required) |

## Session Management

The Kaleido Gateway requires an explicit session open before commands are accepted. Always add an **openID** action first.

### Recommended button sequence

1. **Session: Open (openID)** — IP with dots replaced by underscores, e.g. `192_168_1_10`
2. Your layout / channel / audio actions
3. **Session: Close (closeID)** — same IP format

> The session can stay open indefinitely. You do not need to open/close for every command.

## Available Actions

| Category | Action |
|---|---|
| Session | Open (openID), Close (closeID) |
| Layout | Get Current Layout, Load Layout, Get Layout List, Save Current Layout |
| Source | Assign Channel to Monitor |
| Alarm | Set Gateway Alarm Status |
| Text | Set Dynamic Text (UMD/Label) |
| Timer | Configure Countdown Timer, Start/Stop/Reset Timer |
| Action | Fire Action |
| Audio | Select Embedded / Audio Card / None (Mute) source |
| Audio | Get/Set Volume, Get/Set Mode |
| Display (AQ) | Set Vertical Offset |
| iControl (AQ) | Set Color-Key Mode, Set Mouse Colors A/B/C |

## Variables

| Variable | Description |
|---|---|
| `$(miranda-kaleido:current_layout)` | Name of the currently loaded layout |
| `$(miranda-kaleido:audio_out_type)` | Current audio source type (EMBEDDED/AUDIOCARD/NONE) |
| `$(miranda-kaleido:audio_out_volume)` | Current monitoring volume in dB |
| `$(miranda-kaleido:audio_out_mode)` | Current mode (NORMAL/MUTE/-20 dB) |
| `$(miranda-kaleido:last_ack)` | Result of last command (ack/nack) |
| `$(miranda-kaleido:session_open)` | Whether a Gateway session is open (true/false) |

## Feedbacks

| Feedback | Triggers when... |
|---|---|
| Session: Is Session Open | Session is active |
| Layout: Current Layout Matches | Named layout is loaded |
| Audio: Monitoring Mode Matches | Mode is NORMAL / MUTE / –20 dB |
| Audio: Is Muted | Audio is muted |
| Audio: Source Type Matches | Source type matches selection |
| Alarm: Last Alarm Status Matches | Alarm has specific status (and optional ID) |
| Gateway: Last Command was ACK | Last command succeeded |
| Gateway: Last Command was NACK | Last command failed |

## Notes

- All gateway commands must end with `\n` — this is handled automatically.
- The `setKDynamicText` address and `setKStatusMessage` ID must be **numeric values 0–1024** on Kaleido-Alto/Quad/Quad-Dual.
- Audio streaming sources are **not supported** on Kaleido-Alto/Quad/Quad-Dual.
