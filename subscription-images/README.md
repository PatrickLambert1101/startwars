# HerdTrackr Subscription Images (1024x1024)

These are on-brand promotional images for App Store Connect subscription setup.

## How to Create 1024x1024 Screenshots

### Method 1: Using Browser Screenshot (Recommended)

1. Open each HTML file in Safari or Chrome
2. Press `Cmd + Option + I` to open Developer Tools
3. Press `Cmd + Shift + M` to toggle device toolbar (responsive mode)
4. Set dimensions to **1024 x 1024** in the top bar
5. Press `Cmd + Shift + P` (Chrome) or right-click → "Capture Screenshot"
6. Save as:
   - `farm-plan-1024.png`
   - `commercial-plan-1024.png`

### Method 2: Using macOS Screenshot

1. Open each HTML file in browser
2. Press `Cmd + Shift + 5` to open Screenshot tool
3. Select "Capture Selected Portion"
4. Drag to select exactly the colored square (use pixel counter)
5. Save files

### Method 3: Quick Script (Fastest)

Run this command in Terminal:
```bash
cd /Users/pat/Documents/startwars/subscription-images
open farm-plan.html
open commercial-plan.html
```

Then use Chrome DevTools to capture at 1024x1024.

## Design Details

### Farm Plan
- **Colors**:
  - Primary Green: #4A8C3F (HerdTrackr brand)
  - Accent Gold: #F5AD1C
- **Icon**: 🐄 Cow emoji
- **Badge**: "MOST POPULAR"
- **Price**: R249,99/mo

### Commercial Plan
- **Colors**:
  - Dark Background: #1E1A16 to #3D3832 gradient
  - Gold Accents: #F5AD1C to #FFC94D
- **Icon**: 🏢 Building emoji
- **Badge**: "ENTERPRISE"
- **Price**: R999/mo

## Upload to App Store Connect

1. Go to App Store Connect
2. Navigate to your subscription
3. Click "Add Subscription Image"
4. Upload the 1024x1024 PNG files
5. Done!
