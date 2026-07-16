# HerdTrackr Icons

React Native SVG icons for HerdTrackr. The source icons use a 24×24 grid, a 2 px rounded outline, and accept a `size`, `color`, and `strokeWidth` prop.

## Install

This package expects `react-native-svg`, which is included in most Ignite projects. If it is not already installed:

```sh
npx expo install react-native-svg
```

## Use

```tsx
import { BarnIcon, CowHeadIcon, RfidTagIcon } from "./base/icons"

<CowHeadIcon size={32} color="#13212B" />
<RfidTagIcon color="#6B8F3E" />
<BarnIcon />
```

All icons are single-colour by design so they work in light mode, dark mode, and status contexts.

## Preview them in Ignite

Copy `preview/IconGallery.tsx` into your Ignite project's screens folder, then temporarily render it from your app entry point:

```tsx
import { IconGallery } from "./app/screens/IconGallery"

export function App() {
  return <IconGallery />
}
```

Run your normal development build and scroll through the complete icon set. The gallery imports the icon barrel automatically, so newly added icons appear without editing the screen.
