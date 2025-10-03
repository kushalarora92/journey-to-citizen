# Navigation Troubleshooting Guide

## Issue: Not Navigating to Verify Email Screen

If users are stuck after sign up or sign in and not seeing the verify email screen, follow these debugging steps:

### 1. Check Console Logs

Open the browser console (F12) or React Native debugger and look for:

```
Navigation check: {
  hasUser: true/false,
  email: "user@example.com",
  emailVerified: true/false,
  inAuthGroup: true/false,
  inVerifyEmailScreen: true/false,
  segments: [...],
}
```

This will tell you:
- If the user is authenticated
- If their email is verified
- What segment/route they're on

### 2. Common Issues

#### Issue: User object is null after signup
**Symptom**: Console shows `hasUser: false` after signup
**Cause**: Firebase auth state not updating fast enough
**Solution**: The sign-up now explicitly navigates with `router.replace('/auth/verify-email' as any)`

#### Issue: emailVerified is undefined
**Symptom**: Console shows `emailVerified: undefined`
**Cause**: User object hasn't loaded completely
**Solution**: Wait for auth state to sync, or refresh the user object

#### Issue: Segments are incorrect
**Symptom**: Navigation logic doesn't match current screen
**Cause**: Expo Router segments not updating
**Solution**: The navigation logic now checks both auth group and specific screen

### 3. Testing Steps

#### Test Sign Up Navigation:
1. Open app in browser with console open (F12)
2. Click "Sign Up"
3. Fill in email/password
4. Click "Sign Up" button
5. Watch console logs
6. Should see: "Redirecting to verify-email (unverified user)" or direct navigation from sign-up
7. Should land on verify-email screen

#### Test Sign In with Unverified Account:
1. Sign in with an account that hasn't verified email
2. Watch console logs
3. Should see: "Redirecting to verify-email (unverified user)"
4. Should land on verify-email screen (not dashboard)

### 4. Force Navigation

If navigation seems stuck, you can manually force it in the console:

```javascript
// Force navigate to verify email
window.Expo.Linking.openURL('exp://localhost:8081/auth/verify-email')

// Or in React Native Debugger
router.replace('/auth/verify-email')
```

### 5. Check Firebase Auth State

In console, check the current Firebase auth state:

```javascript
import { auth } from '@/config/firebase';

// Check current user
console.log('Current user:', auth.currentUser);
console.log('Email verified:', auth.currentUser?.emailVerified);

// Manually reload user
auth.currentUser?.reload().then(() => {
  console.log('User reloaded, verified:', auth.currentUser?.emailVerified);
});
```

### 6. Clear Cache and Restart

If nothing works:

```bash
# Stop the dev server (Ctrl+C)

# Clear metro cache
pnpm start --clear

# Or for web
rm -rf .expo
pnpm web
```

### 7. Verify Route Registration

Check that verify-email route is properly registered:

```typescript
// app/auth/_layout.tsx should have:
<Stack.Screen name="verify-email" />
```

### 8. Check for TypeScript Errors

The `as any` cast is used to bypass Expo Router's typed routes temporarily. If you see TypeScript errors about route types, they can be ignored - the routes work at runtime.

### 9. Debug Navigation Flow

Add this to any screen to see navigation state:

```typescript
import { useSegments, useRouter } from 'expo-router';

const segments = useSegments();
const router = useRouter();
console.log('Current segments:', segments);
console.log('Current route:', router);
```

### 10. Verify Environment

Make sure Firebase is properly configured:

```bash
# Check .env file exists
ls -la .env

# Check Firebase config is loaded
# Should not show "undefined"
```

## Expected Flow

### Sign Up Flow:
```
1. User clicks "Sign Up" button
   → State: loading = true
2. Firebase creates account
   → State: user exists, emailVerified = false
3. Verification email sent automatically
4. Sign-up screen explicitly calls: router.replace('/auth/verify-email')
   → Navigate to verify-email screen
5. Root layout useEffect sees unverified user
   → Confirms staying on verify-email screen
```

### Sign In with Unverified Account Flow:
```
1. User enters credentials and clicks "Sign In"
   → State: loading = true
2. Firebase authenticates user
   → State: user exists, emailVerified = false
3. AuthContext updates user state
4. Root layout useEffect triggers
5. Checks: user exists && !emailVerified && !on verify-email screen
   → Redirects: router.replace('/auth/verify-email')
6. User sees verify-email screen
```

## Still Having Issues?

1. Check that all files are saved
2. Restart the dev server
3. Clear browser cache
4. Try in incognito/private mode
5. Check Firebase Console for user status
6. Verify email verification is enabled in Firebase
7. Check for any JavaScript errors in console

## Contact

If issues persist:
1. Copy console logs
2. Note what actions were taken
3. Include screenshots
4. Check docs/1.auth/UPDATES.md for latest changes
