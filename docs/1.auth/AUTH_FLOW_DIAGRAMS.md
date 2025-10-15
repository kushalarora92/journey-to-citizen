# Authentication Flow Diagram

## Overall System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         User Device                         │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              Journey to Citizen App                   │  │
│  │                                                       │  │
│  │  ┌──────────────────────────────────────────────┐   │  │
│  │  │          AuthContext Provider               │   │  │
│  │  │  - Manages auth state                       │   │  │
│  │  │  - Provides auth methods                    │   │  │
│  │  │  - Handles user session                     │   │  │
│  │  └──────────────────────────────────────────────┘   │  │
│  │                        ↕                            │  │
│  │  ┌──────────────────────────────────────────────┐   │  │
│  │  │         Navigation System                   │   │  │
│  │  │  - Protected routes                         │   │  │
│  │  │  - Auto redirects                           │   │  │
│  │  └──────────────────────────────────────────────┘   │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              ↕
                     ┌────────────────┐
                     │  Firebase Auth │
                     │   (Backend)    │
                     └────────────────┘
```

## Sign Up Flow

```
┌──────────┐
│  User    │
└─────┬────┘
      │
      │ 1. Enters email & password
      ↓
┌─────────────────┐
│  Sign Up Screen │
└────────┬────────┘
         │
         │ 2. Validates input
         │    - Email format
         │    - Password length (min 6)
         │    - Passwords match
         ↓
    ┌────────┐
    │ Valid? │
    └───┬────┘
        │ No
        ↓
    Show error alert
        │ Yes
        ↓
┌──────────────────┐
│  AuthContext     │
│  signUp()        │
└────────┬─────────┘
         │
         │ 3. Calls Firebase
         ↓
┌─────────────────┐
│  Firebase Auth  │
└────────┬────────┘
         │
         │ 4. Creates account
         │    Sends verification email
         ↓
    ┌─────────┐
    │ Success?│
    └────┬────┘
         │ No → Show error
         │
         │ Yes
         ↓
┌──────────────────┐
│  Show success    │
│  message         │
└────────┬─────────┘
         │
         │ 5. Navigate to Sign In
         ↓
┌──────────────────┐
│  Sign In Screen  │
└──────────────────┘
```

## Sign In Flow

```
┌──────────┐
│  User    │
└─────┬────┘
      │
      │ 1. Enters credentials
      ↓
┌─────────────────┐
│  Sign In Screen │
└────────┬────────┘
         │
         │ 2. Validates input
         ↓
┌──────────────────┐
│  AuthContext     │
│  signIn()        │
└────────┬─────────┘
         │
         │ 3. Calls Firebase
         ↓
┌─────────────────┐
│  Firebase Auth  │
└────────┬────────┘
         │
         │ 4. Authenticates
         ↓
    ┌─────────┐
    │ Valid?  │
    └────┬────┘
         │ No → Show error
         │
         │ Yes
         ↓
┌──────────────────┐
│  Update auth     │
│  state in        │
│  Context         │
└────────┬─────────┘
         │
         │ 5. Trigger useEffect
         ↓
┌──────────────────┐
│  Root Layout     │
│  detects user    │
└────────┬─────────┘
         │
         │ 6. Auto navigate
         ↓
┌──────────────────┐
│  Dashboard       │
│  (Protected)     │
└──────────────────┘
```

## Protected Route Flow

```
┌──────────┐
│  User    │
│ navigates│
└─────┬────┘
      │
      ↓
┌─────────────────┐
│  Root Layout    │
│  _layout.tsx    │
└────────┬────────┘
         │
         │ Checks auth state
         ↓
┌────────────────────┐
│  useAuth()         │
│  { user, loading } │
└────────┬───────────┘
         │
         ↓
    ┌─────────┐
    │ loading?│
    └────┬────┘
         │ Yes → Show nothing/splash
         │
         │ No
         ↓
    ┌─────────┐
    │  user?  │
    └────┬────┘
         │
         ├─── No ────┐
         │           ↓
         │      Is in auth group?
         │           │
         │      ├─ Yes → Allow
         │      └─ No  → Redirect to /auth/sign-in
         │
         └─── Yes ───┐
                     ↓
                Is in auth group?
                     │
                ├─ Yes → Redirect to /(tabs)
                └─ No  → Allow (show tabs)
```

## Password Reset Flow

```
┌──────────┐
│  User    │
└─────┬────┘
      │
      │ 1. Clicks "Forgot password?"
      ↓
┌────────────────────┐
│  Forgot Password   │
│  Screen            │
└────────┬───────────┘
         │
         │ 2. Enters email
         ↓
┌──────────────────┐
│  AuthContext     │
│  resetPassword() │
└────────┬─────────┘
         │
         │ 3. Calls Firebase
         ↓
┌─────────────────┐
│  Firebase Auth  │
└────────┬────────┘
         │
         │ 4. Sends reset email
         ↓
    ┌─────────┐
    │ Success?│
    └────┬────┘
         │ No → Show error
         │
         │ Yes
         ↓
┌──────────────────┐
│  Show success    │
│  "Check email"   │
└────────┬─────────┘
         │
         │ User clicks email link
         ↓
┌─────────────────┐
│  Firebase Web   │
│  Password Reset │
└────────┬────────┘
         │
         │ User sets new password
         ↓
┌──────────────────┐
│  Password reset  │
│  complete        │
└────────┬─────────┘
         │
         │ User returns to app
         ↓
┌──────────────────┐
│  Sign In Screen  │
└──────────────────┘
```

## Logout Flow

```
┌──────────┐
│  User    │
└─────┬────┘
      │
      │ 1. Clicks logout button
      ↓
┌─────────────────┐
│  Tab Layout     │
└────────┬────────┘
         │
         │ 2. Shows confirmation
         ↓
┌─────────────────┐
│  Alert Dialog   │
│  "Are you sure?"│
└────────┬────────┘
         │
         ↓
    ┌──────────┐
    │ Confirm? │
    └────┬─────┘
         │ No → Cancel
         │
         │ Yes
         ↓
┌──────────────────┐
│  AuthContext     │
│  logout()        │
└────────┬─────────┘
         │
         │ 3. Calls Firebase
         ↓
┌─────────────────┐
│  Firebase Auth  │
│  signOut()      │
└────────┬────────┘
         │
         │ 4. Clears session
         ↓
┌──────────────────┐
│  Update Context  │
│  user = null     │
└────────┬─────────┘
         │
         │ 5. Trigger useEffect
         ↓
┌──────────────────┐
│  Root Layout     │
│  detects no user │
└────────┬─────────┘
         │
         │ 6. Auto navigate
         ↓
┌──────────────────┐
│  Sign In Screen  │
└──────────────────┘
```

## Component Interaction Diagram

```
┌────────────────────────────────────────────────────────────┐
│                     App Root (_layout.tsx)                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              AuthProvider                            │  │
│  │  ┌────────────────────────────────────────────────┐ │  │
│  │  │          Navigation Logic                      │ │  │
│  │  │  useAuth() → { user, loading }                 │ │  │
│  │  │  useEffect → check segments & redirect         │ │  │
│  │  └────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────┘  │
│                            │                               │
│       ┌────────────────────┴────────────────────┐          │
│       │                                         │          │
│       ↓                                         ↓          │
│  ┌─────────┐                              ┌─────────┐     │
│  │  Auth   │                              │  Tabs   │     │
│  │  Stack  │                              │  Stack  │     │
│  └────┬────┘                              └────┬────┘     │
│       │                                        │          │
│  ┌────┴────┐                            ┌──────┴─────┐    │
│  │         │                            │            │    │
│  ↓         ↓                            ↓            ↓    │
│ Sign In  Sign Up                    Dashboard   Profile   │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

## State Management Flow

```
┌─────────────────────────────────────────────────────┐
│              Firebase Auth                          │
│                                                     │
│  onAuthStateChanged() → fires when auth changes     │
└───────────────────┬─────────────────────────────────┘
                    │
                    │ User state changes
                    ↓
┌─────────────────────────────────────────────────────┐
│            AuthContext                              │
│                                                     │
│  useState(user) → stores current user               │
│  useState(loading) → tracks loading state           │
│                                                     │
│  useEffect → listens to auth changes                │
│    ↓                                                │
│    Sets user state                                  │
│    Sets loading to false                            │
└───────────────────┬─────────────────────────────────┘
                    │
                    │ Context updates
                    ↓
┌─────────────────────────────────────────────────────┐
│          All Components using useAuth()             │
│                                                     │
│  - Root Layout (navigation)                         │
│  - Tab Layout (logout button)                       │
│  - Dashboard (user info)                            │
│  - Profile (user details)                           │
│  - Auth screens (sign in/up)                        │
└─────────────────────────────────────────────────────┘
```

## File Dependency Tree

```
app/
├── _layout.tsx                    [Wraps with AuthProvider]
│   ├── imports AuthContext        
│   └── uses useAuth()
│       └── manages navigation based on user state
│
├── auth/
│   ├── _layout.tsx                [Stack navigator]
│   ├── sign-in.tsx                [Uses useAuth()]
│   ├── sign-up.tsx                [Uses useAuth()]
│   └── forgot-password.tsx        [Uses useAuth()]
│
└── (tabs)/
    ├── _layout.tsx                [Uses useAuth() for logout]
    ├── index.tsx                  [Uses useAuth() for user info]
    └── two.tsx                    [Uses useAuth() for profile]

context/
└── AuthContext.tsx                [Provides auth state & methods]
    └── imports config/firebase.ts

config/
└── firebase.ts                    [Initializes Firebase]
    └── reads from .env
```

## Data Flow Example: Sign In

```
1. User types email/password
   ↓
2. User clicks "Sign In"
   ↓
3. SignInScreen calls useAuth().signIn()
   ↓
4. AuthContext.signIn() calls Firebase signInWithEmailAndPassword()
   ↓
5. Firebase authenticates user
   ↓
6. Firebase triggers onAuthStateChanged()
   ↓
7. AuthContext useEffect catches the change
   ↓
8. AuthContext updates user state
   ↓
9. All components using useAuth() re-render
   ↓
10. Root Layout's useEffect detects user
    ↓
11. Root Layout redirects to /(tabs)
    ↓
12. Dashboard shows user info
```

## Environment Variables Flow

```
.env file
   ↓
   Loaded by Expo
   ↓
app.config.js reads process.env
   ↓
   Exports to expo.extra
   ↓
config/firebase.ts reads Constants.expoConfig.extra
   ↓
   Initializes Firebase with config
   ↓
   Exports auth instance
   ↓
context/AuthContext.tsx imports auth
   ↓
   Uses auth for all operations
```

## Summary

This authentication system follows these key principles:

1. **Centralized State**: Auth state is managed in one place (AuthContext)
2. **Automatic Navigation**: Root layout handles redirects automatically
3. **Firebase Integration**: All auth operations go through Firebase
4. **Type Safety**: TypeScript ensures proper usage
5. **Error Handling**: Try-catch blocks with user-friendly messages
6. **Security**: Environment variables, email verification, password validation
7. **Platform Support**: Works on iOS, Android, and Web

The flow is designed to be:
- **Simple**: Users just sign in/up, everything else is automatic
- **Secure**: Firebase handles all security concerns
- **Reliable**: Error handling at every step
- **Maintainable**: Clear separation of concerns
