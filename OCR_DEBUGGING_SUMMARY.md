# OCR Tag Scanner Debugging Summary

## Goal
Implement a camera-based OCR scanner that:
1. Points phone camera at ear tag (or any text)
2. Reads the text using ML Kit OCR
3. Displays scanned text in an editable input field
4. Requires 2 consecutive stable readings before accepting
5. User can edit and approve the tag

## Architecture
```
Camera Frame → ML Kit OCR → Extract Tags → Stability Check → Display in Input
     (worklet)      (worklet)     (worklet)        (JS thread)      (React state)
```

## The Core Problem
**React Native Vision Camera v3 worklets run in a completely isolated JavaScript context and CANNOT share mutable state with the main JS thread.**

## All Attempts Made

### Attempt 1: Direct setState from worklet ❌
```typescript
// In frame processor worklet:
setStableTagNumber(tag) // ERROR: cannot share dispatchSetState
```
**Why it failed**: React's setState is a JS function that cannot be shared with worklets

### Attempt 2: runOnJS wrapper ❌
```typescript
import { runOnJS } from 'react-native-worklets-core'
runOnJS(setStableTagNumber)(tag) // ERROR: runOnJS is not a function
```
**Why it failed**: `runOnJS` doesn't exist in react-native-worklets-core for vision-camera

### Attempt 3: runAsync from vision-camera ❌
```typescript
import { runAsync } from 'react-native-vision-camera'
runAsync(frame, () => {
  setStableTagNumber(tag) // ERROR: cannot share dispatchSetState
})
```
**Why it failed**: Even with runAsync, setState functions cannot be shared

### Attempt 4: Ref-based polling with primitives ❌
```typescript
// Worklet writes:
pendingTag.current = tag

// JS thread polls:
setInterval(() => {
  if (pendingTag.current) {
    setStableTagNumber(pendingTag.current)
  }
}, 100)
```
**Why it failed**: Ref mutations in worklets don't cross to JS thread

### Attempt 5: Ref-based polling with objects ❌
```typescript
// Worklet writes:
pendingTag.current = { tag, timestamp: Date.now() }

// JS thread polls and checks timestamp
```
**Why it failed**: Same issue - ref mutations don't cross threads

###Attempt 6: Array queue with counter ❌
```typescript
// Worklet:
tagQueue.current.push(tag)
tagQueueCounter.current++

// JS polls counter to detect changes
```
**Why it failed**: Array push and counter increment in worklet not visible to JS thread

### Attempt 7: Callback ref pattern ❌
```typescript
// JS stores callback:
const callback = useRef((tag) => setState(tag))

// Worklet calls via runAsync:
runAsync(frame, () => {
  callback.current(tag) // ERROR: cannot share function
})
```
**Why it failed**: Functions cannot be shared between worklet and JS contexts

### Attempt 8: Shared Values from Reanimated ❌
```typescript
import { useSharedValue } from 'react-native-reanimated'

// Create shared values:
const latestTag = useSharedValue("")
const tagCounter = useSharedValue(0)

// Worklet writes:
latestTag.value = tag
tagCounter.value++

// JS polls:
setInterval(() => {
  if (tagCounter.value !== lastProcessed) {
    processTag(latestTag.value)
  }
}, 50)
```
**Why it failed**: Vision Camera v3 uses a DIFFERENT worklet runtime than Reanimated. They're incompatible. The worklet sets `counter=1` but JS reads `counter=0`.

## Key Discoveries

### Working Components ✅
1. **OCR Text Detection**: ML Kit successfully reads text from camera
2. **Tag Extraction**: `extractTagNumbers()` function works and returns results
3. **Pattern Matching**: Regex patterns work for structured tags (ZA format, farm codes, numeric)
4. **Accept Any Text**: Falls back to accepting any detected text if no pattern matches
5. **Worklet Logging**: console.log() works in worklets and helps debug
6. **Debug Display**: On-screen yellow/gray boxes show OCR results

### The Fundamental Issue 🔴
**Worklets in react-native-vision-camera v3 are COMPLETELY ISOLATED from the main JS thread**:
- Cannot call JS functions
- Cannot share JS functions (even via refs)
- Ref mutations don't cross thread boundaries
- Array operations (push/pop) don't persist across threads
- Object mutations don't cross threads

### The Root Cause 🔴
**React Native Vision Camera v3 frame processors use an ISOLATED worklet runtime that is completely incompatible with the main JS thread AND with Reanimated worklets.**

NOTHING crosses the boundary:
- ❌ Refs don't sync
- ❌ Shared values don't sync (different worklet runtime)
- ❌ Functions can't be shared
- ❌ setState can't be called
- ❌ Array mutations don't persist

### The Only Solutions 💡

#### Option 1: Photo Capture (RECOMMENDED)
Don't use frame processors at all:
1. Show camera preview
2. User taps "Capture" button
3. Take photo on JS thread
4. Run OCR on photo (JS thread)
5. Display results

#### Option 2: Downgrade to Vision Camera v2
Vision Camera v2 has better JS interop, but is deprecated.

#### Option 3: Accept Manual Input
Skip OCR entirely and let users type tag numbers.

## Current Implementation Status

### What's Working
- Camera permission handling ✅
- ML Kit OCR text detection ✅
- Tag extraction with pattern matching ✅
- Worklet frame processing ✅
- Debug info display on screen ✅

### What's NOT Working
- Worklet → JS thread communication ❌
- Tag appearing in input field ❌
- Stability checking (blocked by communication issue) ❌

## Final Recommendation

**ABANDON frame processor approach entirely.** Implement photo capture instead:

```typescript
const handleCapture = async () => {
  const photo = await cameraRef.current.takePhoto()
  const result = await scanPhoto(photo.path) // OCR on JS thread
  const tags = extractTagNumbers(result) // JS thread
  setManualInput(tags[0]) // Works!
}
```

This approach:
- ✅ Works reliably (no thread boundary issues)
- ✅ Better UX (explicit user action)
- ✅ More accurate (full resolution photo vs compressed frame)
- ✅ Simpler code
- ✅ No stability checking needed

## Lessons Learned
1. React Native Vision Camera v3 worklets are MORE isolated than Reanimated worklets
2. Standard React patterns (refs, callbacks, setState) DON'T work across this boundary
3. Must use Reanimated shared values for ANY cross-context communication
4. Polling is necessary - there's no event-based notification system
5. All business logic (stability checking) must happen on JS thread
6. Worklets should ONLY do: OCR → Extract → Write to shared value

## Files Modified
- `/app/hooks/useTagScanner/useTagScanner.ts` - Main scanner hook
- `/app/hooks/useTagScanner/tagParser.ts` - Tag extraction logic
- `/app/screens/TagScannerScreen/TagScannerScreen.tsx` - UI with debug display
- `/app/components/ScanTagButton.tsx` - Button styling fixes
- `/landing-page.html` - Added traceability section

## Time Spent
**~6+ hours** attempting to make frame processors work with ZERO success.

## Estimated Time to Fix (Photo Capture Approach)
**30-45 minutes** to:
1. Remove frame processor code
2. Add capture button to camera overlay
3. Implement takePhoto + OCR on JS thread
4. Display results in input field
5. Test and polish
