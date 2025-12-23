# iOS App Store Submission Guide

## Quick Reference for EAS Submit

### What You'll Need:
1. **Apple ID** with access to App Store Connect
2. **App-Specific Password** (generated from appleid.apple.com)
   - Go to https://appleid.apple.com/account/manage
   - Sign in
   - Go to "Security" → "App-Specific Passwords"
   - Generate a new password for "EAS Submit"
   - Copy and save it temporarily (you'll need it during submission)

### The Submission Process:

```bash
# Navigate to frontend directory
cd apps/frontend

# Submit the latest production build
npx eas submit --platform=ios --latest

# OR submit a specific build by ID
npx eas submit --platform=ios --id=<build_id>
```

### What EAS Will Ask You:

1. **Authentication Method**: Choose "Apple ID and App-Specific Password"
2. **Apple ID**: Your Apple developer account email
3. **App-Specific Password**: The password you generated above
4. **ASC App ID**: Your App Store Connect app identifier (looks like: 1234567890)

### Finding Your ASC App ID:
1. Go to https://appstoreconnect.apple.com
2. Click on your app "Journey to Citizen"
3. Go to "App Information"
4. Look for "Apple ID" under "General Information"

### Important Notes:
- ✅ Credentials are stored locally in `~/.expo` (NOT in git)
- ✅ You can save credentials for future submissions
- ✅ The submission usually takes 5-10 minutes
- ✅ You'll get an email when it's uploaded to App Store Connect
- ⚠️ This only uploads the binary - you still need to submit for review in App Store Connect

### After Upload:
1. Go to App Store Connect
2. Select your app
3. Go to the version you're submitting
4. Click "Submit for Review"
5. Answer the compliance questions
6. Submit!

### Troubleshooting:
- If authentication fails, regenerate the app-specific password
- If ASC App ID is not found, make sure the bundle ID matches in App Store Connect
- Your bundle ID: `com.kodianlabs.journeytocitizen`

---
**Current Build to Submit:**
- Build ID: `<build_id>`
- Version: 1.0.0
- Build Number: 14
- Built on: December 16, 2025


## iOS App Store Submission Checklist (Concise)

## 1. Prepare App Store Connect
- Create app in App Store Connect (add name, bundle ID, description, screenshots, privacy/support URLs)
- Set primary category (e.g. Productivity), age rating, content rights, pricing ($0 for free), and availability (all countries recommended)

## 2. Privacy Policy & Support URL
- Host privacy policy (e.g. on Firebase Hosting or GitHub Pages)
- Add privacy and support URLs in App Store Connect

## 3. Build & Submit with Expo
- Build iOS app with EAS: `npx eas build --platform=ios --profile=production`
- Submit build: `npx eas submit --platform=ios --latest`
- Use App Store Connect API Key (recommended) or Apple ID + app-specific password for authentication
- Expo uploads the .ipa file to App Store Connect (does not submit for review)

## 4. Complete App Store Connect Submission
- Link uploaded build to app version
- Fill out privacy questionnaire (select data types: Email Address, User ID, Product Interaction, Other User Content)
- Set age rating (answer all questions truthfully; most answers are "None" or "No")
- Set pricing ($0 for free) and availability (all countries recommended)
- Review all info, then click "Submit for Review"

## 5. After Submission
- App status changes to "Waiting for Review"
- Apple reviews app (1–3 days typical)
- Respond to any feedback or required changes
- App goes live when approved

---
**Tip:** Keep this checklist for future submissions. Update screenshots, privacy/support URLs, and app info as needed for each new version.
