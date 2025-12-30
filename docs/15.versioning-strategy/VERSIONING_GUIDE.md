# Versioning & Release Strategy

**Last Updated:** December 30, 2025

## Version Convention

We use **semantic versioning** with a clear separation between store versions and OTA updates:

- **Major.Minor** = Store releases (App Store / Play Store)
- **Patch** = OTA (Over-The-Air) updates

### Examples
- `1.0` - Initial store release
- `1.0.1`, `1.0.2`, `1.0.3` - OTA updates (JS-only changes)
- `1.1` - Next store release (new binary)
- `2.0` - Major version bump (breaking changes)

---

## Configuration Setup

Your `app.config.js` is configured as follows:

```javascript
{
  version: '1.0.2',              // Internal tracking (bump for EVERY release)
  ios: {
    version: '1.0',              // What users see in App Store
    // buildNumber: auto-managed by EAS Build ✅
  },
  android: {
    versionName: '1.0',          // What users see in Play Store
    // versionCode: auto-managed by EAS Build ✅
  }
}
```

**Key Points:**
- `version` at root = internal tracking (bump with every OTA or store release)
- `ios.version` and `android.versionName` = user-facing versions in stores
- `ios.buildNumber` and `android.versionCode` = auto-managed by EAS Build

---

## Quick Reference

### 🔄 OTA Update (JS changes only)
```bash
# 1. Update version in app.config.js: 1.0.2 → 1.0.3
# 2. Commit, tag, push
git add .
git commit -m "description"
git push && git tag v1.0.3 && git push origin v1.0.3
# 3. Create GitHub Release
# 4. Publish OTA
cd apps/frontend
pnpm update:production "OTA: v1.0.3"
```

### 📦 Store Release (New binary)
```bash
# 1. Update in app.config.js:
#    - version: '1.1.0'
#    - ios.version: '1.1'
#    - android.versionName: '1.1'
# 2. Commit, tag, push
git add .
git commit -m "Release: v1.1.0 - description"
git push && git tag v1.1.0 && git push origin v1.1.0
# 3. Create GitHub Release
# 4. Build
cd apps/frontend
pnpm build:android:prod
pnpm build:ios:prod
# 5. Upload to stores
```

---

## Detailed Steps

### For OTA Updates (JS/Asset Changes Only)

**When:** Bug fixes, UI tweaks, copy changes, feature toggles

**Steps:**
1. Make your code changes
2. Update version in `app.config.js`:
   ```javascript
   version: '1.0.3'  // Bump patch number
   ```
3. Commit, tag, and push:
   ```bash
   git add .
   git commit -m "description of change"
   git push
   git tag v1.0.3
   git push origin v1.0.3
   ```
4. Create GitHub Release:
   - Go to GitHub → Releases → Create new release
   - Select tag `v1.0.3`
   - Title: `v1.0.3 - OTA Update`
   - Description: Detail the changes
   - Mark as pre-release if testing
5. Publish OTA update:
   ```bash
   cd apps/frontend
   pnpm update:production "OTA Testing: v1.0.3"
   ```

**What users see:**
- App Store: `1.0` (unchanged)
- Play Store: `1.0` (unchanged)
- App receives update automatically on next launch

**Do NOT:**
- ❌ Change `ios.version` or `android.versionName`
- ❌ Build new binaries
- ❌ Upload to stores

---

### For Store Releases (New Binary)

**When:** Native code changes, new dependencies, major features requiring rebuild

**Steps:**
1. Make your code changes
2. Update versions in `app.config.js`:
   ```javascript
   version: '1.1.0',           // Bump major/minor, reset patch to .0
   ios: {
     version: '1.1',           // Update user-facing version
     // ...
   },
   android: {
     versionName: '1.1',       // Update user-facing version
     // ...
   }
   ```
3. Commit, tag, and push:
   ```bash
   git add .
   git commit -m "Release: v1.1.0 - description"
   git push
   git tag v1.1.0
   git push origin v1.1.0
   ```
4. Create GitHub Release:
   - Go to GitHub → Releases → Create new release
   - Select tag `v1.1.0`
   - Title: `v1.1.0 - Store Release`
   - Description: Detail the changes, what's new, breaking changes
   - Attach build artifacts if needed
5. Build for production:
   ```bash
   cd apps/frontend
   
   # For Android
   pnpm build:android:prod
   
   # For iOS
   pnpm build:ios:prod
   ```
6. Download builds from EAS and upload to stores:
   - **Android:** Upload `.aab` to Play Console
   - **iOS:** Build is automatically submitted to TestFlight/App Store Connect

**What users see:**
- App Store: `1.1` (updated)
- Play Store: `1.1` (updated)
- Users must update via store

---

## Version Bumping Rules

### OTA Updates (Patch)
```
1.0.2 → 1.0.3 → 1.0.4 → 1.0.5
```

### Store Releases (Minor)
```
1.0.x → 1.1.0 → 1.2.0 → 1.3.0
```

### Major Releases
```
1.x.x → 2.0.0 → 3.0.0
```

---

## Decision Tree

```
┌─────────────────────────────────────┐
│ Do you need to change native code,  │
│ add dependencies, or modify config? │
└──────────────┬──────────────────────┘
               │
       ┌───────┴────────┐
       │                │
      YES              NO
       │                │
       ▼                ▼
Store Release      OTA Update
(Build & Upload)   (Publish OTA)
       │                │
       ▼                ▼
Bump major/minor   Bump patch only
ios.version        Keep ios.version
android.versionName  Keep android.versionName
```

---

## Examples

### Example 1: Fix Dashboard Bug (OTA)
```bash
# Change code
# Update app.config.js: version: '1.0.3'

git add .
git commit -m "OTA: v1.0.3 - Fix dashboard calculation bug"
git push
git tag v1.0.3
git push origin v1.0.3

# Create GitHub Release (v1.0.3 - OTA Update)

cd apps/frontend
pnpm update:production "Fix dashboard calculation bug"
```

**Result:** Users get update automatically, stores still show `1.0`

### Example 2: Add New Native Module (Store Release)
```bash
# Add new package, change native code
# Update app.config.js:
#   version: '1.1.0'
#   ios.version: '1.1'
#   android.versionName: '1.1'

git add .
git commit -m "Release: v1.1.0 - Add biometric authentication"
git push
git tag v1.1.0
git push origin v1.1.0

# Create GitHub Release (v1.1.0 - Store Release)

cd apps/frontend
pnpm build:android:prod
pnpm build:ios:prod

# Upload builds to stores
```

**Result:** Users see `1.1` in stores, must update manually

---

## Current Version History

| Version | Type | Date | Description |
|---------|------|------|-------------|
| 1.0.0 | Store | Dec 2025 | Initial release |
| 1.0.1 | Store | Dec 2025 | Privacy policy update |
| 1.0.2 | OTA | Dec 2025 | Remove maple leaf emoji |

---

## Notes

- **Tags:** Create git tags for ALL releases - both OTA updates (v1.0.1, v1.0.2) and store releases (v1.0.0, v1.1.0)
- **GitHub Releases:** Create a GitHub Release for every tagged version for better tracking and changelog visibility
- **EAS Auto-Management:** Build numbers (`ios.buildNumber`, `android.versionCode`) are automatically incremented by EAS Build
- **OTA Compatibility:** OTA updates only work for apps with matching `runtimeVersion` (using `sdkVersion` policy)
- **Testing:** Always test OTA updates on a device with the store version installed before publishing to production

---

## Troubleshooting

**OTA update not appearing on device:**
- Ensure device has the latest store version installed
- Close and reopen the app completely
- Check that `runtimeVersion` matches (using `sdkVersion`)

**Version mismatch in stores:**
- Store versions come from `ios.version` and `android.versionName`, not root `version`
- Root `version` is for internal tracking only

**Need to rollback an OTA:**
- Publish a new OTA update with the previous working code
- Or, release a new store version with the fix
