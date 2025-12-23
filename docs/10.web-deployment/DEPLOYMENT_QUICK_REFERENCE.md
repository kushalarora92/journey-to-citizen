# Deployment Quick Reference

**Last Updated:** December 16, 2025

## ✅ Deployed URLs

### Production Website
```
https://journey-to-citizen.web.app
```

### Public Pages (No Auth Required)
```
https://journey-to-citizen.web.app/privacy
https://journey-to-citizen.web.app/support
```

### App Routes
- `/` - Landing page (redirects to sign-in if not authenticated)
- `/auth/sign-in` - Sign in page
- `/auth/sign-up` - Sign up page
- `/auth/forgot-password` - Password reset
- `/auth/verify-email` - Email verification
- `/profile-setup` - Profile setup (after sign up)
- `/(tabs)` - Main app dashboard (authenticated users only)
- `/(tabs)/profile` - Profile management
- `/(tabs)/absences` - Travel absences tracker

---

## 🚀 Deployment Commands

### Build Web Version
```bash
cd apps/frontend
npx expo export --platform web
```

### Move Build to Firebase Directory
```bash
rm -rf web-build && mv dist web-build
```

### Deploy to Firebase Hosting
```bash
cd ../..  # Back to root
firebase deploy --only hosting
```

### One-Liner (Build + Deploy)
```bash
cd apps/frontend && \
npx expo export --platform web && \
rm -rf web-build && \
mv dist web-build && \
cd ../.. && \
firebase deploy --only hosting
```

---

## 📧 Email Setup (ImprovMX)

### Configured Emails
- `support@journeytocitizen.com` → Your personal email
- `privacy@journeytocitizen.com` → Your personal email
- `noreply@journeytocitizen.com` → Firebase (for auth emails)

### Test Email Forwarding
```bash
# Send test email to support@journeytocitizen.com
# Check your personal inbox
```

---

## 📱 App Store Submission URLs

Use these exact URLs for App Store Connect and Google Play Console:

### Support URL
```
https://journey-to-citizen.web.app/support
```

### Privacy Policy URL
```
https://journey-to-citizen.web.app/privacy
```

### Marketing URL (Optional)
```
https://journey-to-citizen.web.app
```

---

## 🔒 Public Routes Configuration

The following routes are accessible WITHOUT authentication:

1. `/privacy` - Privacy policy page
2. `/support` - Support and FAQ page
3. `/auth/*` - All authentication routes (sign-in, sign-up, etc.)

**Implementation:** Updated `app/_layout.tsx` to check for public pages:
```typescript
const inPublicPage = segments[0] === 'privacy' || segments[0] === 'support';
```

---

## ✅ Verification Checklist

Test these URLs in a **private/incognito browser window** (to ensure no auth required):

- [ ] https://journey-to-citizen.web.app/privacy loads without authentication
- [ ] https://journey-to-citizen.web.app/support loads without authentication
- [ ] Privacy policy displays all sections correctly
- [ ] Support page shows FAQ and contact information
- [ ] Email links work (opens mail client)
- [ ] External links to IRCC work
- [ ] Page is mobile-responsive
- [ ] Dark mode works correctly
- [ ] No console errors

---

## 🔧 Troubleshooting

### Build Issues
```bash
# Clear cache and rebuild
cd apps/frontend
rm -rf .expo node_modules web-build dist
pnpm install
npx expo export --platform web
```

### Deployment Issues
```bash
# Check Firebase login
firebase login

# Check current project
firebase projects:list

# Use correct project
firebase use journey-to-citizen
```

### Route Not Found (404)
- Check that the file exists in `app/` directory
- Rebuild the web version
- Deploy again
- Clear browser cache

---

## 📊 Analytics

Firebase Analytics is enabled on web. Track these events:
- Page views (privacy, support)
- Email link clicks
- External link clicks (IRCC, etc.)

---

## 🎯 Next Steps for App Submission

1. ✅ Email forwarding setup (ImprovMX)
2. ✅ Privacy policy deployed
3. ✅ Support page deployed
4. ✅ Public access enabled
5. ⏳ Create app screenshots
6. ⏳ Build iOS app with EAS
7. ⏳ Build Android app with EAS
8. ⏳ Submit to App Store Connect
9. ⏳ Submit to Google Play Console

---

## 📝 Package.json Scripts

Add these helpful scripts to `apps/frontend/package.json`:

```json
{
  "scripts": {
    "build:web": "expo export --platform web",
    "deploy:web": "pnpm build:web && rm -rf web-build && mv dist web-build && cd ../.. && firebase deploy --only hosting",
    "preview:web": "npx serve web-build"
  }
}
```

---

## 🌐 Firebase Hosting Config

Located in `/firebase.json`:

```json
{
  "hosting": {
    "public": "apps/frontend/web-build",
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

This SPA configuration ensures all routes work correctly.

---

## 📞 Support Information

**For App Store/Play Store Submission:**
- Support Email: support@journeytocitizen.com
- Privacy Email: privacy@journeytocitizen.com
- Support URL: https://journey-to-citizen.web.app/support
- Privacy URL: https://journey-to-citizen.web.app/privacy

---

**Deployment Status:** ✅ Live and working!
**Last Deployed:** December 16, 2025
**Version:** 1.0.0
