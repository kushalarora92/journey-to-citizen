# Google Sign-In Implementation (2026-01-02)

## Overview
This document details the implementation of Google Sign-In for the Journey to Citizen app, covering both web and native (iOS/Android) platforms. It includes technical decisions, configuration, error handling, and UX considerations.

---

## 1. Feature Summary
- Added Google Sign-In as an authentication option alongside email/password.
- Supports web (Firebase Auth popup) and native (using `@react-native-google-signin/google-signin`).
- Handles account linking and error cases (e.g., email already registered).
- Uses official Google logo for UI consistency.
- All configuration (client IDs) is managed via environment variables.

---

## 2. Key Implementation Details

### a. Web
- Uses Firebase Auth's `signInWithPopup` and `GoogleAuthProvider`.
- The OAuth client ID is set via `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` in `.env`.
- The Google Sign-In button uses the official multi-color "G" SVG logo.

### b. Native (iOS/Android)
- Uses `@react-native-google-signin/google-signin` for Google auth.
- The `webClientId` is configured from the same environment variable.
- Handles Expo Go gracefully (shows error if native module is missing).
- Requires a development or production build (not supported in Expo Go).

### c. Error Handling
- If a user tries to sign in with Google but already has an email/password account, shows a clear error: "An account already exists with this email. Please sign in with your email and password instead."
- Handles Google Play Services errors, user cancellation, and other edge cases.

### d. UX Decisions
- Google Sign-In button is present on both sign-in and sign-up screens.
- Divider with "or" separates Google and email options.
- Button is disabled and shows loading state during sign-in.

---

## 3. Configuration & Security
- The Google OAuth client ID is **not secret** and is safe to expose in the client bundle.
- All config is managed via `.env` using the `EXPO_PUBLIC_` prefix for Expo compatibility.
- No sensitive secrets are exposed in the client.

---

## 4. OAuth Consent Screen & Branding
- To customize the Google popup (app name, logo, domain), update the OAuth consent screen in Google Cloud Console.
- The domain shown in the popup is determined by Google, not by Firebase authorized domains.

---

## 5. Account Linking (Firebase Setting)
- By default, Firebase will throw an error if a user tries to sign in with Google and the email is already registered with another provider.
- You can enable automatic account linking in Firebase Console → Authentication → Settings → User account linking.
- This project currently shows a user-friendly error and does not auto-link accounts.

---

## 6. Testing & Build Notes
- **Web**: Works out of the box (`npm run web`).
- **Native**: Requires a development or production build (not Expo Go).
- Use `npx expo run:ios` or `npx expo run:android` for local dev, or EAS Build for cloud builds.

---

## 7. File Changes
- `context/AuthContext.tsx`: All logic for Google Sign-In, error handling, and config.
- `components/GoogleSignInButton.tsx`: Official Google logo, button UI.
- `.env`: Added `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`.

---

## 8. Decisions & Rationale
- **Environment variable for client ID**: For maintainability and multi-env support, not for secrecy.
- **Error handling for account linking**: To avoid user confusion and provide clear next steps.
- **SVG logo**: For brand compliance and cross-platform consistency.

---

## 9. References
- [Firebase Auth Google Sign-In Docs](https://firebase.google.com/docs/auth/web/google-signin)
- [@react-native-google-signin/google-signin](https://github.com/react-native-google-signin/google-signin)
- [Expo EAS Build](https://docs.expo.dev/build/introduction/)

---