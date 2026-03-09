# Auth Code Flow Update - For Handheld Scanners ✅

## Problem Solved

Handheld scanner devices (Android handhelds) don't have easy email access, making magic links impractical. Workers can't easily click email links on these devices.

## Solution: 6-Digit Auth Code

Instead of magic links, we now use **6-digit codes** sent via email - much easier to manually type on a handheld!

---

## How It Works

### User Flow

1. **Enter Email**
   - User enters their email address
   - Clicks "Send Code"

2. **Get Code**
   - Supabase sends a 6-digit code to their email (e.g., `123456`)
   - User can check email on phone/computer

3. **Enter Code on Device**
   - User types the 6-digit code on the handheld scanner
   - Clicks "Verify Code"
   - Signed in!

### Technical Flow

```typescript
// Step 1: Send OTP
await supabase.auth.signInWithOtp({
  email: "farmer@example.com",
  options: { shouldCreateUser: true }
})
// → Sends 6-digit code to email

// Step 2: Verify OTP
await supabase.auth.verifyOtp({
  email: "farmer@example.com",
  token: "123456",
  type: "email"
})
// → User signed in with session
```

---

## Benefits

### For Handheld Scanners
- ✅ Easy to type on device keyboard
- ✅ No need to access email on the device
- ✅ Works offline after initial sign-in
- ✅ Fast - just 6 digits

### For Regular Users
- ✅ Still no password needed
- ✅ Familiar flow (like WhatsApp, Google, etc.)
- ✅ More secure than magic links
- ✅ Codes expire quickly (default 60 seconds)

---

## Updated Files

### `app/context/AuthContext.tsx`
- Added `signInWithOTP(email)` - sends 6-digit code
- Added `verifyOTP(email, token)` - verifies code and signs in
- Kept `signInWithMagicLink()` for backwards compatibility

### `app/screens/AuthScreen/AuthScreen.tsx`
- Now uses OTP code flow instead of magic link
- Shows code entry screen after sending email
- Number pad keyboard for easy typing
- Auto-focuses on code field
- Shows "Resend" link if code didn't arrive

---

## Code Example

### Auth Flow in Your Component

```typescript
import { useAuth } from "@/context/AuthContext"

function MyAuthComponent() {
  const { signInWithOTP, verifyOTP } = useAuth()
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")

  // Step 1: Send code
  const handleSendCode = async () => {
    const result = await signInWithOTP(email)
    if (result.success) {
      // Show code input
    }
  }

  // Step 2: Verify code
  const handleVerify = async () => {
    const result = await verifyOTP(email, code)
    if (!result.error) {
      // User signed in!
    }
  }
}
```

---

## Supabase Configuration

### Email Template (Recommended)

Go to Supabase Dashboard → Authentication → Email Templates → "Magic Link"

**Subject:** Your HerdTrackr sign-in code

**Body:**
```
Hi there!

Your HerdTrackr sign-in code is:

{{ .Token }}

This code expires in 60 seconds.

If you didn't request this, please ignore this email.

Happy farming!
The HerdTrackr Team
```

### Settings

- **Code expiry**: 60 seconds (default)
- **Rate limiting**: 5 attempts per hour (default)
- **Auto-create users**: Enabled

---

## Testing

### Test the Flow

1. Enter email on AuthScreen
2. Click "Send Code"
3. Check email for 6-digit code
4. Enter code on device
5. Should be signed in immediately

### Error Cases

- **Invalid code**: "Invalid or expired code"
- **Expired code**: "Code has expired" (after 60 seconds)
- **Too many attempts**: "Too many requests, please try again later"
- **Network error**: "Network error, please check your connection"

---

## Security

- Codes expire in **60 seconds** (configurable in Supabase)
- Rate limited to **5 attempts per hour** per email
- Codes are **single-use** only
- Automatically invalidated after successful sign-in
- No password storage needed

---

## Backwards Compatibility

Both flows are still available:

```typescript
// OTP Code Flow (NEW - for handheld scanners)
await signInWithOTP(email)
await verifyOTP(email, code)

// Magic Link Flow (OLD - for computers/phones)
await signInWithMagicLink(email)
```

The AuthScreen now defaults to OTP code flow, but you can easily add a toggle if needed.

---

## Future Enhancements (Optional)

### SMS Support
Add phone number support for workers without email:
```typescript
await supabase.auth.signInWithOtp({
  phone: "+27821234567",
  options: { shouldCreateUser: true }
})
```

### Biometric Auth
Add fingerprint/face ID after initial sign-in:
```typescript
// Use react-native-biometrics
const biometricAuth = async () => {
  const result = await Biometrics.simplePrompt("Sign in to HerdTrackr")
  if (result.success) {
    // Auto sign-in from stored session
  }
}
```

### QR Code Sign-In
Generate QR code with OTP for even faster entry:
```typescript
const qrData = `herdtrackr://auth?email=${email}&code=${code}`
```

---

## Summary

**Before:** Magic link → hard to use on handheld scanners

**After:** 6-digit code → easy to type on any device!

Perfect for farm workers using Android handheld scanners with RFID readers. 🎉

