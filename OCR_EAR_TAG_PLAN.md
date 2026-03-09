# OCR Ear Tag Scanning — Implementation Plan

## The Problem

Most SA farmers use visual plastic ear tags (numbered, often coloured). Currently the app requires manual tag number entry. Scanning with the phone camera would be much faster in the chute.

## Recommended Architecture

**On-device OCR** (no internet needed — critical for rural farms):

```
Camera (live preview) → Frame Processor → ML Kit Text Recognition → Tag Number Extraction → Animal Lookup
```

## Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| **Camera** | `react-native-vision-camera` v4 | Best RN camera lib, supports frame processors, already Expo compatible |
| **OCR Engine** | Google ML Kit (Android) + Apple Vision (iOS) | On-device, free, fast, works offline |
| **Frame Processor** | `react-native-vision-camera-v3-text-recognition` | Real-time OCR on each camera frame via JSI, no bridge overhead |
| **Tag Parsing** | Custom regex/logic | Extract the tag number from OCR text, filter noise |

## Implementation Phases

### Phase 1 — Camera + Basic OCR (get it working)

1. Install `react-native-vision-camera` + the text recognition frame processor plugin
2. Create a `TagScannerScreen` with live camera preview
3. Add a viewfinder overlay (rectangle guide where farmer holds the tag)
4. Run OCR on each frame, extract all detected text blocks
5. Display recognized text on screen in real-time

### Phase 2 — Smart Tag Number Extraction

SA ear tags typically look like: `ZA 012 345 6789` or just `345` or `B-0472`. The OCR will pick up everything in frame (grass, hands, dirt). Need filtering:

1. Define tag patterns common in SA:
   - Numeric only: 1-8 digits (e.g. `0472`, `12345678`)
   - Alphanumeric prefix: `ZA`, `B-`, farm code + number
   - Ignore short strings (1 char), dates, random text
2. Confidence scoring — ML Kit returns confidence per text block, reject low confidence
3. Bounding box filtering — only accept text detected within the viewfinder rectangle
4. Debounce / stability check — only accept a tag number if the same number is read across 3+ consecutive frames (prevents flicker/misreads)

### Phase 3 — Integration with Existing App Flow

1. Add "Scan Tag" button wherever manual tag entry exists (chute mode, animal form, herd list search)
2. On successful scan → auto-populate the tag field, look up the animal
3. If animal found → navigate to it (same as RFID scan flow)
4. If not found → prompt to register new animal with that tag number
5. Haptic feedback + sound on successful scan

### Phase 4 — Polish

1. Torch/flash toggle (reading tags in dark kraals)
2. Scan history (last 10 scanned tags for quick re-access)
3. Support for reading tag colour (some farmers use colour coding by year)
4. Landscape + portrait support

## Challenges & Mitigations

| Challenge | Mitigation |
|-----------|-----------|
| Dirty/faded tags | Boost contrast in preprocessing; accept partial matches and show "Did you mean...?" |
| Animal moving | Use frame-by-frame processing with stability check — only confirm when 3+ frames agree |
| Sunlight glare | Torch toggle + guide farmer to shade the tag with their hand |
| Multiple numbers visible | Only accept text within the viewfinder box; let farmer tap to confirm |
| Handwritten tags | Won't work well with OCR — fallback to manual entry |

## File Structure

```
app/
  hooks/
    useTagScanner/
      useTagScanner.ts      — camera + OCR hook
      tagParser.ts          — regex patterns, number extraction, validation
      types.ts
  screens/
    TagScannerScreen/
      TagScannerScreen.tsx  — camera view with overlay
      ScanOverlay.tsx       — viewfinder rectangle + detected text display
      index.ts
  components/
    ScanTagButton.tsx       — reusable button that opens scanner
```

## Dependencies to Add

```bash
npx expo install react-native-vision-camera
npm install react-native-vision-camera-v3-text-recognition
```

Plus camera permissions in `app.json`:

```json
{
  "ios": {
    "infoPlist": {
      "NSCameraUsageDescription": "HerdTrackr uses the camera to scan ear tag numbers"
    }
  }
}
```

## Performance Expectations

- ML Kit text recognition runs in ~30-50ms per frame
- At 30fps camera, process every 3rd frame (100ms cycle) — plenty fast
- Typical successful scan: farmer holds tag in viewfinder, number appears in under 1 second
- Works fully offline — no data connection needed

## Hardware Support Strategy

The app should support multiple input methods, auto-detecting what's available:

| Method | Device | Priority |
|--------|--------|----------|
| **Camera OCR** (this plan) | Any phone | Highest — works for everyone |
| **Manual entry** | Any phone | Always available as fallback |
| **Bluetooth RFID** (future) | Phone + BLE reader | Medium — for farms with RFID tags |
| **UHF Native** (existing) | Chafon handheld | Niche — feedlots/large operations |
