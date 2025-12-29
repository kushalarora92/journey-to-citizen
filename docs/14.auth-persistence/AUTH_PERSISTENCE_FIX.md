# Firebase Auth Persistence Fix

## Problem
Users were logged out when swiping the app away on Android (and iOS). This happened because Firebase Auth was using in-memory persistence on React Native instead of persistent storage.

## Root Cause
The web Firebase SDK (`firebase/auth`) defaults to:
- **Web**: `localStorage` (persists indefinitely) ✅
- **React Native**: In-memory storage (lost when app closes) ❌

## Solution
Configured Firebase Auth to use `AsyncStorage` for React Native platforms.

## Changes Made

### `/config/firebase.ts`
- Added `initializeAuth` and `getReactNativePersistence` imports
- Added `AsyncStorage` from `@react-native-async-storage/async-storage`
- Platform-specific auth initialization:
  - **Web**: Uses `getAuth` + `browserLocalPersistence`
  - **React Native**: Uses `initializeAuth` + `getReactNativePersistence(AsyncStorage)`

## How It Works Now

### Web
```
User logs in → Token stored in localStorage → Persists indefinitely → Auto-refreshes every hour
```

### React Native (iOS/Android)
```
User logs in → Token stored in AsyncStorage → Persists indefinitely → Auto-refreshes every hour
```

## Token Expiration
- **Firebase ID Token**: Expires after 1 hour
- **Refresh Token**: Valid indefinitely (until revoked)
- **Auto-refresh**: Firebase SDK automatically refreshes tokens in background
- **Session**: Never expires unless user logs out or clears app data

## Testing

### Before Fix
1. Log in to app
2. Swipe away app
3. Reopen app
4. ❌ User must log in again

### After Fix
1. Log in to app
2. Swipe away app
3. Reopen app
4. ✅ User still logged in

## Important Notes

- This fix requires **rebuilding the app** (native code change via package dependency)
- Existing installed apps won't benefit until they download new version
- Users who are logged in before the fix will need to log in once more
- After that, persistence works indefinitely

## Next Steps (Optional)

Consider adding biometric authentication for extra security:
- Install `expo-local-authentication`
- Prompt for Face ID/Touch ID when app opens
- User stays logged in but must authenticate to access app

## Related Files
- `/config/firebase.ts` - Auth initialization
- `/context/AuthContext.tsx` - Auth state management
- `package.json` - AsyncStorage dependency

---

**Date Fixed**: December 29, 2025
