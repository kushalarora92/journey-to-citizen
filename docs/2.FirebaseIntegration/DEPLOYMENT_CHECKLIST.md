# Deployment Checklist

## ✅ Completed

- [x] Firebase project initialized (`journey-to-citizen`)
- [x] Functions created with TypeScript
- [x] Firestore configured with security rules
- [x] Emulators working locally
- [x] Frontend wired to Firebase (Functions + Firestore)
- [x] Generic template (no journey-specific code)
- [x] Documentation organized
- [x] Helper scripts created (`dev.sh`)
- [x] Functions build successfully
- [x] ESLint warnings fixed
- [x] **Upgraded to Blaze plan** ✅
- [x] **Functions deployed to production** ✅
- [x] **Firestore rules deployed** ✅
- [x] **Production functions tested** ✅

## 🎯 Next: Test & Implement

### 1. ✅ Upgrade Firebase Plan
**Status**: COMPLETE ✅

### 2. ✅ Deploy Functions
**Status**: COMPLETE ✅

All 3 functions deployed:
- `helloWorld` - https://us-central1-journey-to-citizen.cloudfunctions.net/helloWorld
- `getUserInfo` - Callable function
- `updateUserProfile` - Callable function

### 3. ✅ Deploy Firestore Rules
**Status**: COMPLETE ✅

Security rules active - users can only access their own data.

### 4. 🔲 Test Production Functions
**Action Required**: Test from frontend
```bash
# Update .env in frontend:
EXPO_PUBLIC_USE_FIREBASE_EMULATOR=false

# Restart frontend and test:
# - Login
# - Call getUserInfo
# - Call updateUserProfile
```

### 5. Update Frontend Environment
Make sure these are set in `.env`:
```bash
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
EXPO_PUBLIC_FIREBASE_PROJECT_ID=journey-to-citizen
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## 🔲 Post-Deployment

### Verify Deployment
- [ ] Check Firebase Console → Functions tab
- [ ] View function logs
- [ ] Test functions from frontend
- [ ] Verify Firestore security rules are active

### Monitor
- [ ] Set up Firebase Crashlytics (optional)
- [ ] Set up Performance Monitoring (optional)
- [ ] Check usage in Firebase Console

### Documentation
- [ ] Update team on new backend architecture
- [ ] Document any custom fields added to profile
- [ ] Update API documentation if needed

## Quick Commands

```bash
# Deploy everything
firebase deploy

# Deploy only functions
firebase deploy --only functions

# Deploy only Firestore rules
firebase deploy --only firestore:rules

# View logs
firebase functions:log

# Test locally first
firebase emulators:start
```

## Troubleshooting

### If deployment fails:
1. Check Firebase project is on Blaze plan
2. Ensure all functions build: `cd apps/functions/functions && pnpm build`
3. Check Firebase CLI is up to date: `npm install -g firebase-tools@latest`
4. Verify you're logged in: `firebase login`
5. Check you're using correct project: `firebase use journey-to-citizen`

### If functions return errors:
1. Check Firebase Console logs
2. Verify user is authenticated
3. Check Firestore security rules
4. Test with emulators first

## Support

- **Documentation**: `docs/2.FirebaseIntegration/`
- **Functions Guide**: `apps/functions/README.md`
- **Firebase Console**: https://console.firebase.google.com/project/journey-to-citizen
- **Emulator UI**: http://localhost:4000 (when running)

---

**Next Step**: Upgrade to Blaze plan and deploy! 🚀
