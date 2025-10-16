# Web Deployment - Quick Reference

**Last Updated:** October 16, 2025  
**Deployment URL:** https://journey-to-citizen.web.app

## Quick Deploy Commands

### From Project Root
```bash
# Build and deploy web app
pnpm run deploy:web

# Deploy functions only
pnpm run deploy:functions

# Deploy everything (web + functions)
pnpm run deploy:all
```

### Manual Steps
```bash
# Build
cd apps/frontend
pnpm run build:web

# Deploy
cd ../..
firebase deploy --only hosting
```

## Build Output
- **Location:** `apps/frontend/web-build/`
- **Bundle Size:** ~4.05 MB (minified JS)
- **Build Time:** ~5 seconds
- **Routes:** 14 static routes

## Known Issues & Solutions

### ✅ Icons Not Displaying (RESOLVED)
**Error:** `OTS parsing error: invalid sfntVersion`

**Fix:** FontAwesome font copied to assets folder and loaded from there instead of node_modules.

**Files:**
- `apps/frontend/assets/fonts/FontAwesome.ttf`
- Updated: `apps/frontend/app/_layout.tsx`

### ✅ Webpack Export Error (RESOLVED)
**Error:** `expo export:web can only be used with Webpack`

**Fix:** Use `expo export --platform web` instead (Expo SDK 50+ uses Metro).

## Configuration Files

### firebase.json
```json
{
  "hosting": {
    "public": "apps/frontend/web-build",
    "rewrites": [{ "source": "**", "destination": "/index.html" }],
    "headers": [
      {
        "source": "**/*.@(ttf|otf|woff|woff2)",
        "headers": [
          { "key": "Access-Control-Allow-Origin", "value": "*" },
          { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
        ]
      }
    ]
  }
}
```

### app.config.js (Web Section)
```javascript
{
  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './assets/images/favicon.png',
  }
}
```

## Testing

### Local Testing
```bash
# Test with Expo dev server
cd apps/frontend
pnpm run web

# Test with Firebase emulator
firebase emulators:start --only hosting
```

### Production Checklist
- [ ] Build completes without errors
- [ ] Icons display correctly
- [ ] Auth sign-in/sign-up works
- [ ] Tab navigation works
- [ ] Dark/light mode toggle works
- [ ] No console errors
- [ ] Fonts load successfully

## Deployment History

### October 16, 2025
- ✅ Initial Firebase Hosting setup
- ✅ Fixed icon loading issue (OTS parsing error)
- ✅ Added CORS headers for fonts
- ✅ Deployed to production

## Environment Variables
All `EXPO_PUBLIC_*` variables are automatically included in web builds:
- Firebase API keys
- Project IDs
- App IDs

⚠️ **Note:** These are public client keys - safe to include in web builds.

## Resources
- [Firebase Console](https://console.firebase.google.com/project/journey-to-citizen/overview)
- [Hosting Dashboard](https://console.firebase.google.com/project/journey-to-citizen/hosting)
- [Detailed Setup Guide](./2025-10-16_firebase-hosting-setup.md)
- [Icon Issue Resolution](./2025-10-16_icon-loading-issue.md)
