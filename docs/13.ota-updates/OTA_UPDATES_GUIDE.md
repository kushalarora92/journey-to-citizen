# EAS OTA Updates Guide

## Overview
EAS Updates allows you to push JavaScript/TypeScript changes to production apps without rebuilding or resubmitting to app stores.

## What Can Be Updated OTA
✅ **Can update:**
- JavaScript/TypeScript code
- Assets (images, fonts)
- UI changes
- Bug fixes
- New features (JS only)

❌ **Cannot update (requires new build):**
- Native code changes (iOS/Android)
- New native dependencies
- Changes to app.config.js affecting native code
- Permissions changes
- Version number changes

## Configuration
Your app is configured with:
- **Production channel**: `production` (for App Store/Play Store releases)
- **Preview channel**: `preview` (for internal testing)
- **Runtime version**: Based on Expo SDK version (`sdkVersion` policy)
  - All apps on Expo SDK 54 receive same updates
  - Works across all app versions (1.0.0, 1.0.1, 1.0.2, etc.)
  - Updates only when you upgrade Expo SDK (e.g., 54 → 55)

## Publishing Updates

### To Production (Live Users)
```bash
cd apps/frontend
npm run update:production "Fix: Updated eligibility calculation"
```

### To Preview (Internal Testing)
```bash
cd apps/frontend
npm run update:preview "Test: New travel log feature"
```

## How It Works

1. **User opens app** → App checks for updates
2. **Update available** → Downloads in background
3. **Next app restart** → User sees updated version

## Update Flow

```
Code Change → Publish OTA Update → User Opens App → Downloads Update → Restarts App → New Version Live
```

## Testing OTA Updates

### On Your Test Device
1. **Make a code change** (e.g., change text in Dashboard)
2. **Publish update**:
   ```bash
   npm run update:production "Test OTA update"
   ```
3. **On device**: Close and reopen the app
4. **Verify**: You should see the change

## Monitoring Updates

View updates in EAS dashboard:
```bash
eas update:list --branch production
eas update:list --branch preview
```

## Rollback
If an update causes issues:
```bash
eas update:republish --branch production --group <previous-group-id>
```

## Best Practices

1. **Test first**: Always publish to `preview` branch first
2. **Descriptive messages**: Use clear commit-style messages
3. **Small updates**: Push incremental changes, not massive rewrites
4. **Monitor**: Check EAS dashboard for update adoption
5. **Native changes**: If you change native code, you MUST rebuild and resubmit

## Important Notes

- Updates only work on apps installed from App Store/Play Store (or EAS builds)
- Development builds don't receive OTA updates
- Users must restart the app to see updates
- Updates are cached, so users get them even offline (next time)
- **Runtime version based on Expo SDK**: All users on SDK 54 get updates, regardless of app version (1.0.0, 1.0.1, etc.)

## Common Issues

### Update not showing
- **Check Expo SDK version**: Runtime is tied to SDK, not app version
- **Restart app**: Updates apply on restart
- **Check channel**: Ensure device is on correct channel

### "No updates available"
- Build might be on different runtime version
- Update might not be published yet
- Check with: `eas update:list --branch production`

## Quick Commands

```bash
# Publish to production
npm run update:production "Your message here"

# Publish to preview
npm run update:preview "Your message here"

# List all updates
eas update:list --branch production

# View update details
eas update:view <update-id>

# Delete update (if needed)
eas update:delete <update-id>
```

## Next Steps

1. Make a small change (e.g., update welcome text)
2. Publish OTA update to production
3. Close and reopen app on your test device
4. Verify the change appears

---

**Documentation Date**: December 29, 2025
