# App Submission Checklist

## Status: 🟡 Ready to Submit (Missing required items)

### ✅ Technical Setup Complete
- [x] EAS Build configured
- [x] Android production build working
- [x] iOS production build working
- [x] Apple Developer account enrolled
- [x] Distribution certificate generated
- [x] Bundle identifier registered

### ❌ Immediate Blockers (Must Complete)

#### Apple App Store
- [ ] **Create app in App Store Connect**
  - Action: Go to appstoreconnect.apple.com → Create New App
  - Need: App Store ID (ascAppId) to add to `eas.json`
  - Time: ~5 minutes

- [ ] **Privacy Policy URL**
  - Action: Create and host privacy policy
  - Options: GitHub Pages, website, or use generator
  - Time: ~1 hour

#### Google Play Store
- [ ] **Register Google Play Developer Account**
  - Action: Go to play.google.com/console
  - Cost: $25 one-time fee
  - Time: ~15 minutes

- [ ] **Create app in Play Console**
  - Action: After account approval, create new app
  - Time: ~10 minutes

- [ ] **Create Service Account Key**
  - Action: Follow guide in `4.app-distribution-setup.md`
  - Need: For automated EAS submissions
  - Time: ~15 minutes

### ⚠️ Should Complete (Recommended)

- [ ] **App Screenshots**
  - iOS: Multiple device sizes
  - Android: Phone and tablet
  - Can be added after first submission

- [ ] **Polish App Icon**
  - Current: Basic icon works
  - Recommended: Professional 1024x1024 design

- [ ] **Store Descriptions**
  - App description
  - Keywords
  - Promotional text

- [ ] **Content Rating**
  - Complete questionnaire
  - Required before production

### 📋 Submission Commands (After completing blockers)

```bash
cd apps/frontend

# iOS Submission
pnpm run build:ios:prod
eas submit -p ios --latest

# Android Submission  
pnpm run build:android:prod
eas submit -p android --latest

# Or both at once
eas build --platform all --profile production
eas submit --platform all --latest
```

### 📝 Files to Update

1. **apps/frontend/eas.json**
   ```json
   "submit": {
     "production": {
       "ios": {
         "ascAppId": "REPLACE_WITH_APP_STORE_ID"
       }
     }
   }
   ```

2. **Create Privacy Policy**
   - Add URL to App Store Connect
   - Add URL to Google Play Console

3. **Save Service Account Key**
   ```bash
   # After creating in Google Cloud Console
   mv ~/Downloads/key.json apps/frontend/pc-api-key.json
   # Already added to .gitignore ✅
   ```

### ⏱️ Time Estimates

| Task | Time | Status |
|------|------|--------|
| App Store Connect app creation | 5 min | ❌ |
| Privacy policy | 1 hour | ❌ |
| Google Play registration | 15 min | ❌ |
| Google Play app creation | 10 min | ❌ |
| Service account setup | 15 min | ❌ |
| First iOS submission | 10 min | 🔒 Blocked |
| First Android submission | 10 min | 🔒 Blocked |
| **TOTAL (minimum)** | **~2 hours** | |

### 🎯 Recommended Path

**Option A: Quick Submit (Internal Testing)**
1. Create App Store Connect app (5 min)
2. Create Play Console app (30 min total)
3. Submit to internal testing (20 min)
4. Complete assets later

**Option B: Full Production Submit**
1. Complete all blockers (2 hours)
2. Prepare all assets (2-4 hours)
3. Submit for review (20 min)
4. Wait for approval (1-2 days)

### 📚 Reference Documents

- **Setup Guide:** `docs/9.eas-build/4.app-distribution-setup.md`
- **Build Success:** `docs/9.eas-build/3.ios-firebase-build-fix.md`
- **EAS Config:** `apps/frontend/eas.json`

### 🔗 Important Links

- [App Store Connect](https://appstoreconnect.apple.com)
- [Google Play Console](https://play.google.com/console)
- [EAS Submit Docs](https://docs.expo.dev/submit/introduction/)
- [Privacy Policy Generator](https://www.freeprivacypolicy.com/)

---

**Next Action:** Create app in App Store Connect and get App Store ID
