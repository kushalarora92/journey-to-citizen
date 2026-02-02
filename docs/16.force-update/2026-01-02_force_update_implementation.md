# Force Update Feature

This document describes the force update feature that blocks users from using the app if their version is below the minimum required version.

## Overview

When breaking changes are made to the app (e.g., database schema changes, API changes), users with older app versions may experience issues. The force update feature ensures users update to a compatible version before continuing to use the app.

## Architecture

### Key Design Decision: Local Config + OTA Updates

Instead of making a network call to check version on every app startup, we store the version config **locally in the app bundle**. When you need to bump the minimum version:

1. Update `minVersion` in the config file
2. Push an OTA update via EAS Update
3. Users receive the update instantly and see the force update screen

**Benefits:**
- ✅ No network call on every app startup
- ✅ No Firebase function cold start delays
- ✅ Instant config updates via OTA
- ✅ Works offline (shows cached config)
- ✅ Simpler architecture

### Components

1. **Version Config** (`appVersion.ts`)
   - Location: `apps/frontend/config/appVersion.ts`
   - Contains `minVersion`, store URLs, and update message
   - Updated via OTA when needed

2. **Version Check Hook** (`useVersionCheck`)
   - Location: `apps/frontend/hooks/useVersionCheck.ts`
   - Compares local app version against `minVersion`
   - No network calls - purely local comparison

3. **Update Modal** (`UpdateModal` / `ForceUpdateModal`)
   - Location: `apps/frontend/components/ForceUpdateModal.tsx`
   - Supports both force update (blocking) and soft update (dismissable)
   - Shows update message and store link button
   - Displays "Maybe Later" button for soft updates

## Flow

### Force Update (forceUpdate: true)
```
App Starts
    ↓
[Compare app version vs minVersion] ← Local config (no network)
    ↓
Version OK? ──→ Yes ──→ Normal App Flow
    ↓
    No
    ↓
[Show UpdateModal - Blocking] ← Blocks all app usage
    ↓
User taps "Update" ──→ Opens App Store / Play Store
```

### Soft Update (forceUpdate: false)
```
App Starts
    ↓
[Compare app version vs minVersion] ← Local config (no network)
    ↓
Version OK? ──→ Yes ──→ Normal App Flow
    ↓
    No
    ↓
[Show UpdateModal - Dismissable] ← User can dismiss
    ↓
User chooses ──→ "Update" → Opens App Store / Play Store
              └→ "Maybe Later" → Continue to app (dismissed for session)
```

## Configuration

### Version Config File

Edit `apps/frontend/config/appVersion.ts`:

```typescript
export const APP_VERSION_CONFIG = {
  // Minimum native build version required
  minVersion: '1.1.0',
  
  // Whether to force users to update (hard block)
  // true = blocking modal, false = dismissable "Maybe Later" option
  forceUpdate: true,
  
  // Message displayed to users
  updateMessage: 'A new version of the app is available...',
  
  // Store URLs
  storeUrls: {
    ios: 'https://apps.apple.com/app/journey-to-citizen/id6739988516',
    android: 'https://play.google.com/store/apps/details?id=com.kodianlabs.journeytocitizen',
  },
} as const;
```

### Update Types

**Force Update (`forceUpdate: true`)**
- Blocks all app usage until user updates
- No dismiss option
- Title: "Update Required"
- Used for breaking changes (e.g., API changes, database schema changes)

**Soft Update (`forceUpdate: false`)**
- User can dismiss with "Maybe Later" button
- Dismissed state persists for current app session
- Title: "Update Available"
- Used for recommended updates (e.g., new features, bug fixes)

### Version Comparison

Versions are compared semantically:
- `1.0.0` < `1.0.1` < `1.1.0` < `2.0.0`
- Each part (major.minor.patch) is compared numerically

## Deployment Workflow

### When releasing a breaking change:

1. **Build and submit new native app** to stores:
   ```bash
   cd apps/frontend
   pnpm build:ios:prod
   pnpm build:android:prod
   ```

2. **Wait for app store approval**

3. **Update version config** in `apps/frontend/config/appVersion.ts`:
   ```typescript
   minVersion: '1.2.0',  // New minimum version
   ```

4. **Push OTA update** to force existing users to update:
   ```bash
   cd apps/frontend
   pnpm update:production "Force update to v1.2.0"
   ```

Users on older native builds will:
1. Receive the OTA update (instant)
2. See the ForceUpdateModal
3. Be directed to download the new native build

## Important Notes

### OTA Updates Only Change JS Bundle

OTA updates can only change JavaScript code, not native code. This is perfect for the force update feature because:
- The version config is JS code
- The ForceUpdateModal is JS code
- The comparison logic is JS code

The user's native app version stays the same until they download from the store.

### Web Platform

Web users always get the latest version (no native builds), so the version check returns `updateRequired: false` for web platform.

### Testing Locally

To test the force update flow:

1. Set `minVersion` to a higher version than your app:
   ```typescript
   minVersion: '99.0.0',
   ```

2. Set `forceUpdate` to test different behaviors:
   - `true` for blocking modal (no dismiss)
   - `false` for soft update with "Maybe Later" button

3. Run the app - you should see the UpdateModal

4. Reset to normal after testing

## Store URLs

- **iOS App Store**: https://apps.apple.com/app/journey-to-citizen/id6739988516
- **Google Play Store**: https://play.google.com/store/apps/details?id=com.kodianlabs.journeytocitizen

## Troubleshooting

### Users not seeing update prompt after OTA push

1. Make sure OTA update was published successfully
2. Check EAS Update dashboard for deployment status
3. Users may need to restart the app to receive OTA update

### Update button not working

1. Check if store URL is correct
2. Test URL in browser first
3. Check device permissions for opening external links

### Version comparison not working

1. Ensure version strings are valid semantic versions (e.g., "1.0.0")
2. Check console logs for version comparison output
