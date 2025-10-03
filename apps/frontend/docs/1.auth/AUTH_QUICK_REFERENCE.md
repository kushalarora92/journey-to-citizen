# Authentication Quick Reference

## 🚀 Quick Start (5 Minutes)

### 1. Setup Firebase (2 min)
```bash
# 1. Go to https://console.firebase.google.com
# 2. Create/select project
# 3. Enable Email/Password in Authentication
# 4. Copy config from Project Settings
```

### 2. Configure App (1 min)
```bash
cd apps/frontend
cp .env.example .env
# Edit .env with your Firebase credentials
```

### 3. Run (2 min)
```bash
pnpm install
pnpm web  # or pnpm ios / pnpm android
```

## 📖 Using Authentication in Your Code

### Get Auth State
```typescript
import { useAuth } from '@/context/AuthContext';

function MyComponent() {
  const { user, loading } = useAuth();
  
  if (loading) return <LoadingScreen />;
  if (!user) return <SignInPrompt />;
  
  return <AuthenticatedContent user={user} />;
}
```

### Sign Up
```typescript
const { signUp } = useAuth();

await signUp(email, password);
// User receives verification email automatically
```

### Sign In
```typescript
const { signIn } = useAuth();

await signIn(email, password);
// User is automatically redirected to dashboard
```

### Sign Out
```typescript
const { logout } = useAuth();

await logout();
// User is automatically redirected to sign-in
```

### Reset Password
```typescript
const { resetPassword } = useAuth();

await resetPassword(email);
// User receives reset email
```

### Resend Verification
```typescript
const { sendVerificationEmail } = useAuth();

await sendVerificationEmail();
// Sends verification to current user's email
```

## 🎯 Common Patterns

### Protected Component
```typescript
function ProtectedFeature() {
  const { user } = useAuth();
  
  if (!user?.emailVerified) {
    return <Text>Please verify your email first</Text>;
  }
  
  return <FeatureContent />;
}
```

### Conditional Rendering
```typescript
function Header() {
  const { user } = useAuth();
  
  return (
    <View>
      {user ? (
        <Text>Welcome, {user.email}</Text>
      ) : (
        <Link href="/auth/sign-in">Sign In</Link>
      )}
    </View>
  );
}
```

### Loading State
```typescript
function App() {
  const { loading } = useAuth();
  
  if (loading) {
    return <SplashScreen />;
  }
  
  return <MainApp />;
}
```

## 🔐 Auth Context API

```typescript
interface AuthContextType {
  user: User | null;                              // Current user
  loading: boolean;                                // Auth state loading
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
}
```

## 🗺️ Navigation Structure

```
/
├── auth/
│   ├── sign-in          # Sign in screen
│   ├── sign-up          # Sign up screen
│   └── forgot-password  # Password reset
└── (tabs)/              # Protected routes
    ├── index            # Dashboard
    └── two              # Profile
```

## 🎨 Screen Components

### Sign In
- Location: `app/auth/sign-in.tsx`
- Features: Email/password input, forgot password link, sign up link
- Navigates to: Dashboard (on success)

### Sign Up
- Location: `app/auth/sign-up.tsx`
- Features: Email/password input, confirmation, validation
- Sends: Verification email
- Navigates to: Sign in (on success)

### Forgot Password
- Location: `app/auth/forgot-password.tsx`
- Features: Email input, reset link sending
- Sends: Password reset email

### Dashboard
- Location: `app/(tabs)/index.tsx`
- Shows: User email, verification status
- Protected: Yes

### Profile
- Location: `app/(tabs)/two.tsx`
- Shows: User details, account info
- Features: Resend verification
- Protected: Yes

## ⚡ Error Handling

```typescript
try {
  await signIn(email, password);
} catch (error: any) {
  // Firebase error codes
  if (error.code === 'auth/wrong-password') {
    Alert.alert('Error', 'Incorrect password');
  } else if (error.code === 'auth/user-not-found') {
    Alert.alert('Error', 'No account found with this email');
  } else {
    Alert.alert('Error', error.message);
  }
}
```

### Common Firebase Error Codes
- `auth/email-already-in-use` - Email is already registered
- `auth/invalid-email` - Email format is invalid
- `auth/weak-password` - Password is too weak
- `auth/wrong-password` - Incorrect password
- `auth/user-not-found` - No user with this email
- `auth/too-many-requests` - Too many attempts, try later
- `auth/network-request-failed` - Network error

## 🔧 Configuration Files

### `.env`
```env
FIREBASE_API_KEY="..."
FIREBASE_AUTH_DOMAIN="..."
FIREBASE_PROJECT_ID="..."
FIREBASE_STORAGE_BUCKET="..."
FIREBASE_MESSAGING_SENDER_ID="..."
FIREBASE_APP_ID="..."
```

### `app.config.js`
- Loads environment variables
- Configures Expo app
- Sets up Firebase integration

### `config/firebase.ts`
- Initializes Firebase
- Exports auth instance
- Handles platform differences

## 📱 Platform-Specific Notes

### iOS
- Requires `expo-constants` for env vars
- Email verification opens in Safari
- Supports biometric auth (future)

### Android
- Requires `expo-constants` for env vars
- Email verification opens in Chrome
- Supports biometric auth (future)

### Web
- Uses localStorage for persistence
- Email verification opens in same tab
- Supports password managers

## 🧪 Testing Commands

```bash
# Run on web
pnpm web

# Run on iOS simulator
pnpm ios

# Run on Android emulator
pnpm android

# Clear cache
pnpm start --clear
```

## 📝 Common Tasks

### Add a new protected route
```typescript
// app/(tabs)/newscreen.tsx
import { useAuth } from '@/context/AuthContext';

export default function NewScreen() {
  const { user } = useAuth();
  return <View>Protected Content for {user?.email}</View>;
}
```

### Check email verification
```typescript
const { user } = useAuth();

if (user?.emailVerified) {
  // User has verified email
} else {
  // Show verification prompt
}
```

### Custom sign-in logic
```typescript
const handleCustomSignIn = async () => {
  try {
    setLoading(true);
    await signIn(email, password);
    // Custom logic after sign-in
    trackAnalytics('user_signed_in');
    await loadUserData();
  } catch (error) {
    handleError(error);
  } finally {
    setLoading(false);
  }
};
```

## 🎓 Learning Resources

- **Firebase Auth**: https://firebase.google.com/docs/auth
- **Expo Router**: https://docs.expo.dev/router
- **React Native**: https://reactnative.dev
- **TypeScript**: https://www.typescriptlang.org

## 🆘 Troubleshooting

### App crashes on startup
1. Check `.env` file exists with correct values
2. Restart Metro bundler: `pnpm start --clear`
3. Check Firebase configuration in console

### Email not received
1. Check spam folder
2. Verify email templates enabled in Firebase
3. Check Firebase quota limits

### Can't sign in
1. Verify email/password are correct
2. Check Firebase Authentication is enabled
3. Look for error messages in console

### Navigation not working
1. Check user state with console.log
2. Verify routes are properly defined
3. Clear app cache and restart

## 💡 Pro Tips

1. **Test email verification** in a real email client
2. **Use a test Firebase project** during development
3. **Keep .env out of git** (already in .gitignore)
4. **Log errors** for debugging during development
5. **Test on all platforms** before deploying

## 📞 Support

For issues:
1. Check Firebase Console logs
2. Review terminal output
3. Check that all dependencies are installed
4. Refer to SETUP_GUIDE.md for detailed instructions
