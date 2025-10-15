# Authentication Implementation

This document describes the authentication implementation for the Journey to Citizen app.

## Overview

The app uses Firebase Authentication for user management, providing secure sign-up, sign-in, password reset, and email verification features.

## Features Implemented

### 1. User Authentication
- ✅ Email/Password Sign-up
- ✅ Email/Password Sign-in
- ✅ Password Reset
- ✅ Email Verification
- ✅ Automatic Sign-out

### 2. Navigation Protection
- ✅ Protected routes (tabs require authentication)
- ✅ Automatic redirection based on auth state
- ✅ Auth screens for unauthenticated users

### 3. User Interface
- ✅ Sign In screen
- ✅ Sign Up screen
- ✅ Forgot Password screen
- ✅ User Dashboard
- ✅ Profile screen with user information
- ✅ Logout functionality

## File Structure

```
apps/frontend/
├── config/
│   └── firebase.ts              # Firebase configuration
├── context/
│   └── AuthContext.tsx          # Authentication context and hooks
├── app/
│   ├── _layout.tsx              # Root layout with auth protection
│   ├── auth/
│   │   ├── _layout.tsx          # Auth screens layout
│   │   ├── sign-in.tsx          # Sign in screen
│   │   ├── sign-up.tsx          # Sign up screen
│   │   └── forgot-password.tsx  # Password reset screen
│   └── (tabs)/
│       ├── _layout.tsx          # Tabs layout with logout
│       ├── index.tsx            # Dashboard
│       └── two.tsx              # Profile screen
└── .env                         # Environment variables
```

## Setup Instructions

### 1. Configure Firebase

1. Create a Firebase project at https://console.firebase.google.com
2. Enable Email/Password authentication in Authentication > Sign-in method
3. Get your Firebase configuration from Project Settings

### 2. Environment Variables

Update the `.env` file with your Firebase credentials:

```env
FIREBASE_API_KEY="your-api-key"
FIREBASE_AUTH_DOMAIN="your-auth-domain"
FIREBASE_PROJECT_ID="your-project-id"
FIREBASE_STORAGE_BUCKET="your-storage-bucket"
FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
FIREBASE_APP_ID="your-app-id"
```

### 3. Install Dependencies

```bash
cd apps/frontend
pnpm install
```

### 4. Run the App

```bash
# For iOS
pnpm ios

# For Android
pnpm android

# For Web
pnpm web
```

## Usage

### Authentication Context

The `AuthContext` provides authentication state and methods throughout the app:

```tsx
import { useAuth } from '@/context/AuthContext';

function MyComponent() {
  const { user, loading, signIn, signUp, logout, resetPassword } = useAuth();
  
  // Use authentication methods
}
```

### Protected Routes

The root layout (`app/_layout.tsx`) automatically handles navigation based on authentication state:

- Unauthenticated users are redirected to `/auth/sign-in`
- Authenticated users are redirected to `/(tabs)`

## Security Features

1. **Password Requirements**: Minimum 6 characters
2. **Email Verification**: Users receive a verification email upon sign-up
3. **Password Reset**: Secure password reset via email
4. **Session Management**: Automatic session handling with Firebase
5. **Protected Routes**: Navigation guards prevent unauthorized access

## User Flow

### Sign Up Flow
1. User enters email and password
2. Account is created
3. Verification email is sent
4. User is redirected to sign-in
5. User verifies email and signs in

### Sign In Flow
1. User enters credentials
2. Authentication is verified
3. User is redirected to dashboard
4. If email is not verified, a warning is shown

### Password Reset Flow
1. User clicks "Forgot password?"
2. User enters email
3. Reset link is sent to email
4. User follows link to reset password

## Testing

To test the authentication:

1. **Sign Up**: Create a new account with email/password
2. **Email Verification**: Check email for verification link
3. **Sign In**: Log in with created credentials
4. **Password Reset**: Test forgot password flow
5. **Logout**: Verify logout functionality

## Troubleshooting

### Common Issues

1. **Firebase not initialized**: Ensure environment variables are set correctly
2. **Email not sent**: Check Firebase Authentication settings and email templates
3. **Navigation issues**: Clear app cache and restart

### Error Handling

The app includes comprehensive error handling:
- Invalid credentials
- Weak passwords
- Email already in use
- Network errors

All errors are displayed to users via alerts with clear messages.

## Next Steps

Future enhancements:
- Social authentication (Google, Apple, etc.)
- Multi-factor authentication
- Biometric authentication
- Profile picture upload
- Account deletion

## Support

For issues or questions:
- Check Firebase console for authentication logs
- Review app logs for errors
- Ensure all dependencies are installed correctly
