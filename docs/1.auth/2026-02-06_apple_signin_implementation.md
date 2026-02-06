# Apple Sign-in Implementation

**Date:** February 6, 2026  
**Status:** ✅ Code Complete - Awaiting Firebase Configuration & Testing

## Overview

Implemented Sign in with Apple to comply with Apple App Store Review Guideline 4.8, which requires apps using third-party authentication (Google, Firebase, etc.) to also offer Sign in with Apple as an equivalent login option.

## Why This Was Required

Apple rejected the app (v1.1.0) because:
- App uses Firebase Email/Password authentication (considered "third-party")
- App has Google Sign-in enabled
- No Sign in with Apple option was provided

**Apple Guideline 4.8 Requirements:**
When using third-party login, you must offer another login service that:
1. Limits data collection to name and email only
2. Allows users to keep email private
3. Does not collect interactions for advertising without consent

**Sign in with Apple meets all requirements** ✅

## Implementation Details

### Frontend Changes

#### 1. **New Component: `AppleSignInButton.tsx`**
```tsx
Location: apps/frontend/components/AppleSignInButton.tsx
```
- Black button with Apple logo (white logo in light mode, black logo in dark mode)
- Follows same pattern as GoogleSignInButton
- Uses FontAwesome apple icon
- Responsive loading state

#### 2. **AuthContext Updates**
```tsx
Location: apps/frontend/context/AuthContext.tsx
```
**Imports Added:**
- `OAuthProvider` from Firebase Auth (for Apple provider)
- `expo-crypto` for nonce generation (iOS security requirement)
- `expo-apple-authentication` (conditional, iOS only)

**New Method: `signInWithApple()`**
- **Web Implementation:**
  - Uses Firebase `signInWithPopup` with `OAuthProvider('apple.com')`
  - Requests email and name scopes
  - Handles account-exists errors

- **Native iOS Implementation:**
  - Uses `expo-apple-authentication`
  - Generates cryptographic nonce for security
  - Requests FULL_NAME and EMAIL scopes
  - Creates Firebase credential with ID token and nonce
  - Signs in with `signInWithCredential`

- **Android/Other:**
  - Shows error: "Apple Sign-In only available on iOS devices"
  - Note: Apple Sign-in on Android via web flow is possible but not implemented

**Error Handling:**
- User cancellation (ERR_REQUEST_CANCELED)
- Account exists with different credential
- Missing native module (Expo Go detection)

#### 3. **Auth Screens Updated**

**sign-in.tsx:**
- Added `appleLoading` state
- Added `handleAppleSignIn` function
- Added AppleSignInButton above Google button
- Updated button disable logic to include `appleLoading`

**sign-up.tsx:**
- Same changes as sign-in.tsx
- Button labels: "Sign up with Apple" / "Sign up with Google"

**Button Order (Top to Bottom):**
1. Email/Password form
2. Divider ("or")
3. **Sign in with Apple** (Black button)
4. **Sign in with Google** (White outlined button)

### Configuration Changes

#### 4. **app.config.js**
```javascript
ios: {
  usesAppleSignIn: true, // ← Enables Apple Sign-in capability
},
plugins: [
  'expo-router',
  '@react-native-firebase/app',
  '@react-native-google-signin/google-signin',
  'expo-apple-authentication', // ← New plugin
  // ... other plugins
],
```

#### 5. **package.json**
```json
{
  "expo-apple-authentication": "~9.0.0",
  "expo-crypto": "~15.0.2"
}
```

## Firebase Console Setup (REQUIRED)

### Step 1: Enable Apple as Sign-in Provider

1. **Go to Firebase Console:**
   - Navigate to: https://console.firebase.google.com
   - Select your project (e.g., `journey-to-citizen`)

2. **Enable Apple Provider:**
   - Go to **Authentication** → **Sign-in method**
   - Click **Add new provider**
   - Select **Apple**
   - Toggle **Enable**

3. **Configure Apple Provider:**
   
   You'll need to fill in these fields (get values from Apple Developer Portal first):
   
   - **Services ID:** Your Apple Services ID (e.g., `com.kodianlabs.journeytocitizen.signin`)
   - **Apple Team ID:** Your 10-character Apple Developer Team ID
   - **Key ID:** Your 10-character Apple Sign-in Key ID
   - **Private Key:** Contents of your `.p8` file (including BEGIN/END lines)

   **Note:** Firebase requires a Services ID when OAuth code flow is enabled (which is needed for web sign-in)

4. **Click Save**

### Step 2: Add Apple Sign-in Capability in Apple Developer Portal

1. **Go to Apple Developer:**
   - Navigate to: https://developer.apple.com/account/resources/identifiers/list
   - Select your App ID: `com.kodianlabs.journeytocitizen`

2. **Enable Sign in with Apple:**
### Step 2: Configure Apple Developer Portal

#### Part A: Get Your Apple Team ID

1. **Go to Membership:**
   - Navigate to: https://developer.apple.com/account
   - Click **Membership** in left sidebar

2. **Copy Team ID:**
   - Find **Team ID** (10-character code like `ABC1234DEF`)
   - Save this - you'll need it for Firebase

#### Part B: Enable Sign in with Apple Capability on App ID

1. **Go to Identifiers:**
   - Navigate to: https://developer.apple.com/account/resources/identifiers/list
   - Find and click your App ID (e.g., `com.kodianlabs.journeytocitizen`)

2. **Enable Sign in with Apple:**
   - Scroll to **Capabilities** section
   - Check **Sign in with Apple** capability
   - Click **Edit** next to "Sign in with Apple"
   - Select **"Enable as a primary App ID"** (first radio button)
   - Leave Server-to-Server Notification Endpoint empty (optional)
   - Click **Save**

3. **Save App ID Changes:**
   - Click **Continue** at the top
   - Click **Save** to commit changes

**Important:** You must save these changes before creating the authentication key, otherwise the key creation page won't see your App ID.

#### Part C: Create Apple Services ID (Required for Web Sign-in)

**Why needed:** Firebase requires a Services ID for OAuth code flow (web-based Apple Sign-in)

1. **Create New Identifier:**
   - Navigate to: https://developer.apple.com/account/resources/identifiers/list
   - Click **+** button (create new identifier)
   - Select **Services IDs** (not App IDs)
   - Click **Continue**

2. **Register Services ID:**
   - **Description:** Name for the service (e.g., `Journey to Citizen Sign in with Apple`)
   - **Identifier:** Unique reverse-domain ID (e.g., `com.kodianlabs.journeytocitizen.signin`)
     - Must be different from your App ID
     - This is just an identifier, NOT your domain name
   - Click **Continue** → **Register**

3. **Configure Services ID for Web:**
   - After registration, check **Sign in with Apple**
   - Click **Configure** next to it

4. **Configure Web Authentication:**
   - **Primary App ID:** Select your main App ID (e.g., `com.kodianlabs.journeytocitizen`)
   
   - **Domains and Subdomains:** Add all domains where your web app is hosted
     - Your custom domain (e.g., `journeytocitizen.com`)
     - Your Firebase hosting domain (e.g., `journey-to-citizen.firebaseapp.com`)
   
   - **Return URLs:** Add callback URLs for authentication (Firebase's OAuth callback endpoint)
     ```
     https://yourdomain.com/__/auth/handler
     https://your-project.firebaseapp.com/__/auth/handler
     ```
     
     Example:
     ```
     https://journeytocitizen.com/__/auth/handler
     https://journey-to-citizen.firebaseapp.com/__/auth/handler
     ```

5. **Save Configuration:**
   - Click **Next** → **Done**
   - Click **Continue** → **Save** to commit changes

#### Part D: Create Authentication Key

1. **Go to Keys:**
   - Navigate to: https://developer.apple.com/account/resources/authkeys/list
   - Click **+** button to create a new key

   **Troubleshooting:** If "Sign in with Apple" option is disabled with message "There are no identifiers available", go back and ensure you saved the App ID changes in Part B.

2. **Configure Key:**
   - **Key Name:** Descriptive name (e.g., `Firebase Apple Sign-in`)
   - Check **Sign in with Apple**
   - Click **Configure** next to it
   - Select your App ID from dropdown
   - Click **Save**

3. **Register & Download:**
   - Click **Continue**
   - Click **Register**
   - **CRITICAL:** Download the `.p8` file **immediately**
     - You can only download this ONCE
     - Cannot be retrieved later if lost
   - Note the **Key ID** displayed (10-character code like `8QAJR5L562`)
   - Store both the Key ID and `.p8` file securely

### Step 3: Complete Firebase Configuration

Now go back to Firebase Console with the credentials from Apple Developer Portal:

1. **Return to Firebase Authentication:**
   - Go to Firebase Console → Authentication → Sign-in method
   - Find Apple provider and click **Edit** (pencil icon)

2. **Fill in the credentials:**
   - **Services ID:** Your Apple Services ID (e.g., `com.kodianlabs.journeytocitizen.signin`)
   - **Apple Team ID:** Your 10-character Team ID from Part A
   - **Key ID:** Your 10-character Key ID from Part D (e.g., `8QAJR5L562`)
   - **Private Key:** 
     - Open the `.p8` file you downloaded in a text editor
     - Copy the **entire contents** including the header and footer:
       ```
       -----BEGIN PRIVATE KEY-----
       [key content here]
       -----END PRIVATE KEY-----
       ```
     - Paste into the Private Key field

3. **Save:**
   - Click **Save**
   - Apple Sign-in is now configured!

### Step 4: Test Configuration

**iOS Native:**
```bash
cd apps/frontend
pnpm install
npx expo prebuild --clean
npx expo run:ios
```

**Web:**
```bash
cd apps/frontend
pnpm web
```

## Installation Instructions

Run from workspace root:

```bash
# Install dependencies
cd apps/frontend
pnpm install

# For iOS native testing (requires Mac)
npx expo prebuild --clean
npx expo run:ios

# For web testing
pnpm web
```

## Testing Checklist

### Pre-Firebase Configuration
- [x] Code compiles without errors
- [x] AppleSignInButton renders correctly
- [x] Button appears on sign-in and sign-up screens
- [x] Button styling matches design (black with Apple logo)

### Post-Firebase Configuration (TODO)
- [ ] **iOS Native:**
  - [ ] Apple Sign-in button appears
  - [ ] Tapping button shows Apple authentication sheet
  - [ ] Can sign in with existing Apple ID
  - [ ] Email and name are retrieved correctly
  - [ ] User profile is created in Firestore
  - [ ] Subsequent sign-ins work (returning users)
  - [ ] "Hide My Email" option works
  - [ ] Error handling for cancellation works
  
- [ ] **Web:**
  - [ ] Apple Sign-in button appears
  - [ ] Clicking button opens Apple popup
  - [ ] Can sign in with Apple ID
  - [ ] Email and name are retrieved correctly
  - [ ] User profile is created in Firestore
  - [ ] Popup blocker handling works

- [ ] **Android:**
  - [ ] Apple button shows appropriate message/behavior
  - [ ] (Optional) Implement web-based Apple Sign-in for Android

- [ ] **Account Linking:**
  - [ ] Test signing in with same email via different methods
  - [ ] Verify Firebase account linking settings work correctly
  - [ ] Test error message for account-exists scenarios

- [ ] **Edge Cases:**
  - [ ] User cancels Apple Sign-in
  - [ ] Network error during sign-in
  - [ ] User revokes Apple Sign-in permission
  - [ ] Expired Apple credentials
  - [ ] Email address not provided by Apple

## Platform Support

| Platform | Status | Implementation |
|----------|--------|----------------|
| iOS Native | ✅ Ready | `expo-apple-authentication` |
| iOS Web | ✅ Ready | Firebase `signInWithPopup` |
| Android Native | ⚠️ Limited | Shows error message |
| Android Web | ✅ Ready | Firebase `signInWithPopup` |
| Web (Desktop) | ✅ Ready | Firebase `signInWithPopup` |

**Note on Android:** Apple Sign-in on Android is possible via web flow (Firebase popup), but native implementation is not standard. Currently shows error. Can be enhanced if needed.

## Security Considerations

### Nonce Generation
- Uses `expo-crypto` to generate SHA-256 hashed nonce
- Prevents replay attacks
- Required by Apple for native iOS implementation

### Privacy Features
- **Hide My Email:** Users can use Apple's relay email addresses
- **Minimal Data:** Only requests name and email (no additional scopes)
- **No Tracking:** Apple Sign-in does not track user behavior

### Firebase Security
- Apple credentials validated by Firebase before creating user
- Firestore security rules still apply (user can only access own data)
- No additional server-side validation needed

## Deployment Steps

### For App Store Submission

1. **Install Dependencies:**
   ```bash
   cd apps/frontend
   pnpm install
   ```

2. **Update Version:**
   ```javascript
   // app.config.js
   version: '1.2.0', // Increment from 1.1.0
   ios: { version: '1.2' }
   ```

3. **Build for Production:**
   ```bash
   eas build --platform ios --profile production
   ```

4. **Submit to App Store:**
   - App should now pass Guideline 4.8 review
   - Apple reviewers will test Sign in with Apple functionality
   - Ensure Firebase Apple provider is enabled before submission

## Firebase Console Configuration Guide

### Detailed Steps with Screenshots Context

**1. Authentication → Sign-in method:**
```
Click: Add new provider
Select: Apple
Enable toggle: ON
```

**2. Configure Apple (Web Configuration):**
```
Services ID: (Optional - for web only)
OAuth code flow configuration:
  - Callback URL: Auto-generated by Firebase
```

**3. Configure Apple (iOS App Configuration):**
```
Bundle IDs: com.kodianlabs.journeytocitizen
```

**4. Advanced Configuration:**
```
Team ID: [Your Apple Developer Team ID - 10 characters]
Key ID: [Your Apple Sign-in Key ID - 10 characters]
Private Key: [Paste contents of .p8 file from Apple]
```

### How to Get Team ID
```
1. Go to: https://developer.apple.com/account
2. Click on "Membership" in sidebar
3. Copy "Team ID" (looks like: ABC1234DEF)
```

### How to Get Key ID & Private Key
```
1. Go to: https://developer.apple.com/account/resources/authkeys/list
2. Click "+" to create a new key
3. Name: "Firebase Apple Sign-in" (or any name)
4. Check: "Sign in with Apple"
5. Click "Continue" → "Register"
6. Download the .p8 file immediately (can't download again!)
7. Copy the Key ID shown (looks like: ABC1234567)
8. Open the .p8 file in a text editor
9. Copy the entire contents (including headers)
10. Paste into Firebase "Private Key" field
```

## Troubleshooting

### Common Issues

**1. "Apple Authentication not available on this platform"**
- **Cause:** Running in Expo Go or on non-iOS platform
- **Solution:** 
  - Build development build: `eas build --profile development --platform ios`
  - Or test on web: `pnpm web`

**2. "Invalid Apple credentials"**
- **Cause:** Firebase Apple provider not configured correctly
- **Solution:** 
  - Verify Team ID, Key ID, and Private Key in Firebase Console
  - Ensure .p8 file contents are complete (including headers)
  - Check bundle ID matches exactly

**3. "Sign in with Apple failed"**
- **Cause:** Apple Sign-in capability not enabled in App ID
- **Solution:**
  - Go to developer.apple.com
  - Edit App ID
  - Enable "Sign in with Apple" capability
  - Regenerate provisioning profiles

**4. User sees "Account exists with different credential"**
- **Cause:** User previously signed up with email/password or Google
- **Expected Behavior:** Firebase account linking settings determine behavior
- **Solution:** 
  - Check Firebase Console → Authentication → Settings → Account Linking
  - Choose: "Create multiple accounts for each identity provider" (easier)
  - Or: "Prevent creation of multiple accounts with same email" (stricter)

**5. Web popup blocked**
- **Cause:** Browser popup blocker
- **Solution:** User needs to allow popups for your domain

## Files Changed

### New Files
- `apps/frontend/components/AppleSignInButton.tsx`
- `docs/1.auth/2026-02-06_apple_signin_implementation.md`

### Modified Files
- `apps/frontend/context/AuthContext.tsx`
- `apps/frontend/app/auth/sign-in.tsx`
- `apps/frontend/app/auth/sign-up.tsx`
- `apps/frontend/app.config.js`
- `apps/frontend/package.json`

## Next Steps

1. ✅ **Code Complete** - All frontend code implemented
2. ⏳ **Configure Firebase Console** - Enable Apple provider (see guide above)
3. ⏳ **Configure Apple Developer** - Enable Sign in with Apple capability
4. ⏳ **Test on iOS Device** - Build and test native flow
5. ⏳ **Test on Web** - Test Firebase popup flow
6. ⏳ **Increment Version** - Update to 1.2.0 for resubmission
7. ⏳ **EAS Build** - Create production build
8. ⏳ **Submit to App Store** - Resubmit with Apple Sign-in enabled

## Resources

- [Apple Sign in with Apple Documentation](https://developer.apple.com/sign-in-with-apple/)
- [Firebase Apple Authentication](https://firebase.google.com/docs/auth/ios/apple)
- [Expo Apple Authentication](https://docs.expo.dev/versions/latest/sdk/apple-authentication/)
- [App Store Review Guidelines 4.8](https://developer.apple.com/app-store/review/guidelines/#sign-in-with-apple)

## Support

For issues or questions:
1. Check Firebase Console logs
2. Check Xcode console (iOS native)
3. Check browser console (web)
4. Review this documentation
5. Check Apple Developer account for capability status

---

**Implementation Status:** ✅ Code Complete  
**Next Action:** Configure Firebase Console & Apple Developer Portal  
**Estimated Time:** 15-20 minutes for configuration + testing
