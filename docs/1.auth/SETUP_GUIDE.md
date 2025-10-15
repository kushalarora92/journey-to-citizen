# Authentication Setup Guide

## Quick Start

Follow these steps to set up authentication in the Journey to Citizen app.

## Prerequisites

- Node.js 20+ installed
- pnpm installed (`npm install -g pnpm`)
- Firebase account (free tier is sufficient)

## Step 1: Firebase Project Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Add project" or select an existing project
3. Follow the setup wizard to create your project
4. Once created, click on the web icon (</>) to add a web app
5. Register your app with a nickname (e.g., "Journey to Citizen")
6. Copy the Firebase configuration values

## Step 2: Enable Authentication

1. In Firebase Console, go to **Authentication** → **Sign-in method**
2. Click on **Email/Password**
3. Enable it and click **Save**

## Step 3: Configure Email Templates (Optional)

1. Go to **Authentication** → **Templates**
2. Customize:
   - Email verification template
   - Password reset template
3. Add your app name and customize the messages

## Step 4: Environment Configuration

1. Navigate to the frontend directory:
   ```bash
   cd apps/frontend
   ```

2. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

3. Open `.env` and fill in your Firebase credentials:
   ```env
   FIREBASE_API_KEY="your-api-key"
   FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
   FIREBASE_PROJECT_ID="your-project-id"
   FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
   FIREBASE_MESSAGING_SENDER_ID="123456789"
   FIREBASE_APP_ID="1:123456789:web:abc123"
   ```

## Step 5: Install Dependencies

If you haven't already installed dependencies:

```bash
cd /Users/kushalarora/Documents/code/journey-to-citizen
pnpm install
```

## Step 6: Run the App

### For Web Development
```bash
cd apps/frontend
pnpm web
```

### For iOS Development
```bash
cd apps/frontend
pnpm ios
```

### For Android Development
```bash
cd apps/frontend
pnpm android
```

## Testing Authentication

### Test Sign Up
1. Launch the app
2. You should see the Sign In screen
3. Click "Sign Up"
4. Enter a valid email and password (min 6 characters)
5. Click "Sign Up"
6. Check your email for verification link

### Test Sign In
1. On the Sign In screen
2. Enter your credentials
3. Click "Sign In"
4. You should be redirected to the Dashboard

### Test Password Reset
1. On the Sign In screen
2. Click "Forgot password?"
3. Enter your email
4. Click "Send Reset Link"
5. Check your email for the reset link

### Test Logout
1. Once signed in, go to the Dashboard
2. Click the logout icon in the top right
3. Confirm logout
4. You should be redirected to Sign In

## Troubleshooting

### Firebase not initialized
- **Problem**: Error about Firebase not being initialized
- **Solution**: 
  - Check that `.env` file exists and has correct values
  - Restart the development server
  - Clear Metro cache: `pnpm start --clear`

### Email not received
- **Problem**: Not receiving verification or reset emails
- **Solution**:
  - Check spam folder
  - Verify email templates are enabled in Firebase Console
  - Check Firebase Console → Authentication → Users to see if user was created

### Navigation errors
- **Problem**: App crashes or doesn't navigate properly
- **Solution**:
  - Clear app cache
  - Restart development server
  - Check that all dependencies are installed

### TypeScript errors
- **Problem**: TypeScript compilation errors
- **Solution**:
  - Run `pnpm install` again
  - Restart TypeScript server in VS Code
  - Check that all imports are correct

## Project Structure

```
apps/frontend/
├── config/
│   └── firebase.ts              # Firebase initialization
├── context/
│   └── AuthContext.tsx          # Auth state management
├── app/
│   ├── _layout.tsx              # Root with auth protection
│   ├── auth/                    # Auth screens
│   │   ├── _layout.tsx
│   │   ├── sign-in.tsx
│   │   ├── sign-up.tsx
│   │   └── forgot-password.tsx
│   └── (tabs)/                  # Protected tabs
│       ├── _layout.tsx
│       ├── index.tsx            # Dashboard
│       └── two.tsx              # Profile
├── .env                         # Environment variables (not in git)
└── .env.example                 # Template for environment variables
```

## Security Notes

1. **Never commit `.env` file** - It's already in `.gitignore`
2. **Use environment variables** for all sensitive data
3. **Enable email verification** for production
4. **Configure Firebase security rules** before deploying
5. **Use strong password requirements** (consider increasing minimum length)

## Next Steps

After authentication is working:

1. **Test on all platforms** (iOS, Android, Web)
2. **Customize UI** to match your brand
3. **Add social auth** (Google, Apple) if needed
4. **Implement profile features**
5. **Add multi-factor authentication**
6. **Set up analytics** in Firebase

## Additional Resources

- [Firebase Authentication Docs](https://firebase.google.com/docs/auth)
- [Expo Router Docs](https://docs.expo.dev/router/introduction/)
- [React Native Firebase](https://rnfirebase.io/)

## Support

If you encounter issues:
1. Check the Firebase Console for error logs
2. Review the app logs in your terminal
3. Ensure all dependencies are up to date
4. Check that your Firebase project is properly configured

## Production Checklist

Before deploying to production:

- [ ] Set up proper Firebase security rules
- [ ] Configure custom email domain for auth emails
- [ ] Enable reCAPTCHA for web
- [ ] Set up proper error tracking (e.g., Sentry)
- [ ] Implement rate limiting
- [ ] Add proper logging
- [ ] Test on all target platforms
- [ ] Set up continuous integration/deployment
- [ ] Configure app signing for iOS/Android
- [ ] Review and update privacy policy
