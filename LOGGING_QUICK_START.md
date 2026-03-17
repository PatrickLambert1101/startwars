# 🚀 Quick Start: Logging & Debugging

## ✅ What's Already Done

Your app now has **production-grade logging** with Sentry integration:

### 🔍 Every Action is Logged

```
✅ [DB:query] organizations - Found 3 records in 45ms
🔐 [Auth:login] user@example.com - Success
🔄 [Sync:full-sync] Completed - Pulled 45, Pushed 12 in 2.3s
❌ [Auth:login] bad@email.com - Error: Invalid login credentials
⚠️  [DB:reset] RESETTING DATABASE
```

### 📊 Rich Context for Every Error

When something goes wrong, you'll see:
- Exact user email & ID
- Current organization
- Database operation details
- Full breadcrumb trail
- Performance metrics

## 🎯 To Enable Sentry (Production Logging)

### 1. Get Your Sentry DSN
```bash
# Sign up at https://sentry.io
# Create React Native project
# Copy your DSN
```

### 2. Add to Your .env
```bash
EXPO_PUBLIC_SENTRY_DSN=https://your-actual-dsn@sentry.io/123456
```

### 3. Rebuild for TestFlight
```bash
eas build --platform ios --profile production
```

That's it! Every error, database operation, and sync will be tracked.

## 📱 View Logs in Development

### Option 1: Console.app (Mac)
1. Open **Console.app**
2. Connect iPhone via USB
3. Select your device
4. Filter by "HerdTrackr"

### Option 2: Xcode Console
```bash
xcrun simctl spawn booted log stream --predicate 'process == "HerdTrackr"'
```

### Option 3: React Native
```bash
npm run ios
# Logs appear in terminal automatically
```

## 🔍 What Gets Logged

### Database Operations
```typescript
// Automatically logged:
- database.query() → [DB:query] table_name - Found X records in Yms
- database.create() → [DB:create] table_name - Created record
- database.update() → [DB:update] table_name - Updated record
- database.delete() → [DB:delete] table_name - Deleted record
```

### Auth Events
```typescript
// Automatically logged:
- signIn() → [Auth:login] email - Success/Error
- signUp() → [Auth:signup] email
- logout() → [Auth:logout]
```

### Sync Operations
```typescript
// Automatically logged:
- syncDatabase() → [Sync:full-sync] Pulled X, Pushed Y in Zms
```

## 🆘 Debugging Login Issues

When login fails in TestFlight, check Sentry for:

1. **Error Message**: Exact Supabase error
2. **Email Validation**: Was email valid?
3. **Network Info**: Did request reach server?
4. **Auth Context**: What was auth state before?

Example breadcrumbs you'll see:
```
1. [Auth:session-refresh] No session found
2. [LoginScreen] handleSubmit - email valid, password length 8
3. [Auth:login] user@test.com - Error: Invalid login credentials
4. [Sentry] Exception captured with context
```

## 📝 Files to Check

- **SENTRY_SETUP.md** - Full documentation
- **app/services/sentry.ts** - All logging utilities
- **Console.app** or Sentry dashboard - See actual logs

## 💡 Pro Tips

1. **Use emojis to scan logs**: ✅ success, ❌ error, 🔄 sync, 🔐 auth
2. **Check breadcrumbs**: Shows what happened BEFORE the error
3. **Performance traces**: See which DB queries are slow
4. **Filter by component**: `[Auth]`, `[DB]`, `[Sync]`

---

**You're all set! Every operation is now being tracked with rich context. 🎉**

For detailed info, see: **SENTRY_SETUP.md**
