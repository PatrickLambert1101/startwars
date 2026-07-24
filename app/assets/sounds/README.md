# Sound Assets for HerdTracker

This directory contains audio feedback sounds for the RFID scanner and UI interactions.

## Required Sound Files

You need to add the following MP3 files to this directory:

### 1. `beep_neutral.mp3`
- **Usage:** RFID scanner initialization success
- **Description:** Short, neutral beep (around 200-300ms)
- **Suggested tone:** Single medium-pitched beep (440 Hz)
- **Volume:** Moderate

### 2. `beep_success.mp3`
- **Usage:** Successful RFID tag scan or operation completed
- **Description:** Short, pleasant confirmation sound (around 200-300ms)
- **Suggested tone:** Two ascending tones (C5 → E5) or single high beep (880 Hz)
- **Volume:** Moderate to loud

### 3. `beep_error.mp3`
- **Usage:** Failed operation, initialization error, or invalid scan
- **Description:** Short, distinct error sound (around 300-400ms)
- **Suggested tone:** Two descending tones (E5 → C4) or lower pitched buzz
- **Volume:** Moderate

## How to Create These Sounds

### Option 1: Use Online Tone Generators
1. Visit [OnlineSequencer.net](https://onlinesequencer.net/) or [ToneGenerator.net](https://www.tonegenerator.net/)
2. Generate simple beep tones at the suggested frequencies
3. Export as MP3, keep files under 50KB each

### Option 2: Use Audacity (Free Software)
1. Download [Audacity](https://www.audacityteam.org/)
2. Generate → Tone → Select frequency and duration
3. Apply fade in/out for smoother sound
4. Export as MP3

### Option 3: Use Pre-made Sound Libraries
- [Freesound.org](https://freesound.org/) - Search for "beep" or "UI sound"
- [Zapsplat.com](https://www.zapsplat.com/) - UI sound effects section
- Ensure sounds are royalty-free for commercial use

### Option 4: Use System Sounds
You can also use system notification sounds:
- iOS: `/System/Library/Audio/UISounds/` (access via Xcode)
- Android: `/system/media/audio/ui/` (various beep sounds)

## File Specifications

- **Format:** MP3 (preferred) or WAV
- **Bitrate:** 128 kbps or lower (these are simple tones)
- **Sample rate:** 44.1 kHz
- **Channels:** Mono (stereo not necessary for beeps)
- **Duration:** 100-500ms (keep them short)
- **File size:** < 50KB each

## Testing

After adding the sound files, you can test them with:

```typescript
import { SoundFeedback } from '@/services'

// Test neutral beep
await SoundFeedback.neutral()

// Test success beep
await SoundFeedback.success()

// Test error beep
await SoundFeedback.error()
```

## Notes

- The sound service is initialized automatically when the app starts
- Sounds are preloaded for instant playback
- Volume levels are pre-configured (neutral: 50%, success: 70%, error: 60%)
- Sounds will play even when the device is in silent mode (iOS) or Do Not Disturb (Android)

## Current Files

Real beep tones are checked in (generated with ffmpeg, valid MPEG layer III):

- `beep_neutral.mp3` — 440 Hz single tone, ~220ms
- `beep_success.mp3` — ascending C5 → E5, ~260ms
- `beep_error.mp3` — descending E5 → C4, ~360ms

To regenerate, e.g. the neutral beep:

```bash
ffmpeg -y -f lavfi -i "sine=frequency=440:duration=0.22" \
  -af "afade=t=in:st=0:d=0.01,afade=t=out:st=0.20:d=0.02" \
  -ac 1 -ar 44100 -codec:a libmp3lame -b:a 96k beep_neutral.mp3
```

Note: the files must contain real MPEG audio frames. An MP3 with only an ID3
header and no frames will fail to load on-device with
`UnrecognizedInputFormatException` (ExoPlayer / expo-av).
