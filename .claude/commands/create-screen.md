# Create New Screen

Create a new screen for the HerdTrackr app following the established patterns.

Steps:
1. Create screen directory: `app/screens/[ScreenName]/`
2. Create main file: `[ScreenName].tsx`
3. Create index: `index.ts`
4. Add to navigation types in `app/navigators/navigationTypes.ts`
5. Add route to `app/navigators/AppNavigator.tsx`

## Template Structure

```typescript
// app/screens/[ScreenName]/[ScreenName].tsx
import React, { useState } from "react"
import { View, ViewStyle, TextStyle } from "react-native"
import { Screen, Text, Button } from "@/components"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import { AppStackScreenProps } from "@/navigators"

interface [ScreenName]Props extends AppStackScreenProps<"[ScreenName]"> {}

export function [ScreenName]Screen({ navigation }: [ScreenName]Props) {
  const { themed } = useAppTheme()

  return (
    <Screen preset="scroll" contentContainerStyle={themed($container)}>
      <Text preset="heading" text="[Screen Name]" />
      {/* Add your content here */}
    </Screen>
  )
}

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  paddingHorizontal: spacing.lg,
})
```

## Using ThemedStyle

Always use the function call syntax:
- ✅ `themed($style)`
- ❌ `themed.$style`

## Navigation Types

Add to `AppStackParamList`:
```typescript
export type AppStackParamList = {
  [ScreenName]: undefined // or { param1: string; param2?: number }
  // ... other screens
}
```

## Import in Navigator

```typescript
import { [ScreenName]Screen } from "@/screens/[ScreenName]"

// In the stack:
<Stack.Screen name="[ScreenName]" component={[ScreenName]Screen} />
```
