# Profile Management - Visual Flow Diagram

## 🎯 Complete User Journey

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                    NEW USER FLOW                          ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

     ┌─────────────┐
     │  App Opens  │
     └──────┬──────┘
            │
            ↓
     ┌──────────────┐
     │  Auth Check  │
     └──────┬───────┘
            │
            ↓
    ╔═══════════════╗
    ║  Not Logged   ║
    ║      In       ║
    ╚═══════╤═══════╝
            │
            ↓
    ┌───────────────┐
    │  Sign Up /    │
    │   Sign In     │
    └───────┬───────┘
            │
            ↓
    ┌───────────────┐
    │ Email Verify  │
    │  (if needed)  │
    └───────┬───────┘
            │
            ↓
    ╔═══════════════╗
    ║   Logged In   ║
    ║   + Verified  ║
    ╚═══════╤═══════╝
            │
            │  AuthContext.fetchUserProfile()
            │         ↓
            │  getUserInfo() Cloud Function
            │         ↓
            ↓
    ┌───────────────┐
    │ Profile Status│
    └───────┬───────┘
            │
       ┌────┴────┐
       │         │
       ↓         ↓
  'inactive' 'active'
       │         │
       ↓         └──────────────┐
┌──────────────┐                │
│Profile Setup │                │
│   Screen     │                │
│              │                │
│ • Enter Name │                │
│ • Submit     │                │
└──────┬───────┘                │
       │                        │
       │ updateUserProfile()    │
       │   { status: 'active' } │
       │                        │
       ↓                        │
  refreshProfile()              │
       │                        │
       └────────┬───────────────┘
                │
                ↓
        ╔═══════════════╗
        ║   Main App    ║
        ║    (Tabs)     ║
        ╚═══════════════╝


┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                  RETURNING USER FLOW                      ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

     ┌─────────────┐
     │  App Opens  │
     └──────┬──────┘
            │
            ↓
     ┌──────────────┐
     │   Sign In    │
     └──────┬───────┘
            │
            ↓
    ╔═══════════════╗
    ║   Logged In   ║
    ║   + Verified  ║
    ╚═══════╤═══════╝
            │
            │  AuthContext.fetchUserProfile()
            │         ↓
            │  getUserInfo() Cloud Function
            │         ↓
            │  Profile { status: 'active' }
            │         ↓
            ↓
        ╔═══════════════╗
        ║   Main App    ║
        ║    (Tabs)     ║
        ╚═══════════════╝
```

## 🔍 Navigation Logic (Root Layout)

```
_layout.tsx useEffect Logic:

┌─────────────────────────────────────────────┐
│          Auth State Changed                 │
└────────────────┬────────────────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
        ↓                 ↓
    Loading?          Not Loading
    │                     │
    └→ Wait          ┌────┴─────┐
                     │          │
                     ↓          ↓
                  No User    Has User
                     │          │
                     ↓          └────┬──────────────────────┐
              ┌──────────┐          │                      │
              │Redirect  │          ↓                      ↓
              │to Auth   │    Email Verified?        Unverified
              └──────────┘          │                      │
                             ┌──────┴──────┐               ↓
                             │             │        ┌──────────┐
                             ↓             ↓        │Redirect  │
                       Profile Loaded  Loading     │to Verify │
                             │                     └──────────┘
                    ┌────────┴────────┐
                    │                 │
                    ↓                 ↓
              needsProfileSetup?  No Setup Needed
                    │                 │
              ┌─────┴─────┐           ↓
              │           │     ┌──────────┐
              ↓           ↓     │Redirect  │
            Yes          No     │to Tabs   │
              │           │     └──────────┘
              ↓           │
        ┌──────────┐      │
        │Redirect  │      │
        │to Setup  │      │
        └──────────┘      │
                          │
                          └→ Same as above
```

## 📊 State Management

```
AuthContext State Tree:

AuthContext
├─ user: User | null
│  ├─ uid: string
│  ├─ email: string
│  ├─ emailVerified: boolean
│  └─ ...other Firebase User fields
│
├─ userProfile: UserProfile | null
│  ├─ uid: string
│  ├─ email: string
│  ├─ displayName: string | undefined
│  ├─ status: 'active' | 'inactive'
│  ├─ createdAt: string (Timestamp)
│  └─ updatedAt: string (Timestamp)
│
├─ loading: boolean (auth state)
├─ profileLoading: boolean (profile fetch state)
│
└─ Computed Properties
   └─ needsProfileSetup: boolean
      = user && emailVerified && profile && status === 'inactive'

Functions Available:
├─ signIn(email, password)
├─ signUp(email, password)
├─ logout()
├─ sendVerificationEmail()
├─ fetchUserProfile()
└─ refreshProfile()
```

## 🔐 Security Flow

```
Security Layers:

1. Firebase Authentication
   ├─ Email/Password
   ├─ Email Verification Required
   └─ Auth State Persistence

2. Cloud Functions (Callable)
   ├─ Automatic Auth Check
   │  └─ if (!request.auth) → Error
   ├─ User UID from request.auth.uid
   └─ Type-Safe Responses

3. Firestore Security Rules
   ├─ Read: Only own profile
   │  └─ request.auth.uid == userId
   ├─ Write: Only own profile
   │  └─ request.auth.uid == userId
   └─ Delete: Disabled
      └─ always false

4. Frontend Guards
   ├─ Root Layout Navigation Checks
   ├─ AuthContext State Management
   └─ Screen-Level Guards (needsProfileSetup)
```

## 🚀 Function Call Flow

```
Profile Fetch on Login:

User Signs In
      ↓
onAuthStateChanged Triggered
      ↓
AuthContext.useEffect
      ↓
Check: user && emailVerified
      ↓
fetchUserProfile(user)
      ↓
useFirebaseFunctions.getUserInfo()
      ↓
const functions = getFunctions()
connectFunctionsEmulator() // if dev
      ↓
httpsCallable(functions, 'getUserInfo')
      ↓
    ┌──────────────┐
    │Firebase      │
    │Functions     │
    │(Production)  │
    └──────┬───────┘
           ↓
    Check Auth (automatic)
           ↓
    Extract UID from request.auth.uid
           ↓
    Query Firestore: users/{uid}
           ↓
    ┌─────────┬──────────┐
    │         │          │
    ↓         ↓          ↓
  Found   Not Found   Error
    │         │          │
    ↓         ↓          ↓
  Return  Create New  Throw
  Profile + Return    Error
    │         │          │
    └────┬────┴──────────┘
         ↓
  AuthContext.setUserProfile()
         ↓
  needsProfileSetup computed
         ↓
  Navigation Logic
```

## 📱 Screen Flow

```
App Structure:

app/
├─ _layout.tsx              [Root - Navigation Logic]
│
├─ auth/
│  ├─ _layout.tsx           [Auth Stack]
│  ├─ sign-in.tsx           [Login Screen]
│  ├─ sign-up.tsx           [Register Screen]
│  ├─ verify-email.tsx      [Email Verification]
│  └─ forgot-password.tsx   [Password Reset]
│
├─ profile-setup.tsx        [Profile Setup - NEW!]
│
└─ (tabs)/
   ├─ _layout.tsx           [Tab Navigation]
   ├─ index.tsx             [Dashboard]
   └─ two.tsx               [Profile/Settings]


Navigation Routing:

No User              → /auth/sign-in
User + Unverified    → /auth/verify-email
User + Verified + Incomplete → /profile-setup
User + Verified + Complete   → /(tabs)
```

## 🎨 UI Component Structure

```
ProfileSetupScreen
└─ Box (Container)
   └─ VStack (Column Layout)
      ├─ VStack (Header)
      │  ├─ Heading ("Complete Your Profile")
      │  └─ Text (Description)
      │
      ├─ Box (User Email Display)
      │  ├─ Text ("Signed in as:")
      │  └─ Text (user.email)
      │
      ├─ VStack (Form)
      │  ├─ FormControl
      │  │  ├─ FormControlLabel
      │  │  ├─ Input
      │  │  │  └─ InputField (displayName)
      │  │  └─ FormControlError (if error)
      │  │
      │  └─ Button (Submit)
      │     └─ ButtonText
      │
      └─ Text (Help Text)
```

## 📈 Data Flow

```
Profile Creation/Update:

1. User Input
   └─ displayName: string

2. Frontend Validation
   └─ Check if empty
   └─ Trim whitespace

3. Call Cloud Function
   └─ updateUserProfile({ displayName, status: 'active' })

4. Backend Processing
   ├─ Check Auth
   ├─ Get UID from request.auth.uid
   ├─ Prepare Data:
   │  ├─ uid (from auth)
   │  ├─ email (from auth)
   │  ├─ displayName (from request)
   │  ├─ status (from request)
   │  ├─ createdAt (auto, if new)
   │  └─ updatedAt (auto, always)
   ├─ Write to Firestore: users/{uid}
   └─ Return success

5. Frontend Update
   ├─ Show success message
   ├─ refreshProfile() - fetch updated data
   ├─ needsProfileSetup becomes false
   └─ Navigate to tabs

6. Firestore Document
   └─ users/{uid}
      ├─ uid: "abc123..."
      ├─ email: "user@example.com"
      ├─ displayName: "John Doe"
      ├─ status: "active"
      ├─ createdAt: Timestamp(...)
      └─ updatedAt: Timestamp(...)
```

---

## 🎯 Key Takeaways

✅ **Automatic** - Profile fetches without manual calls  
✅ **Secure** - Multi-layer security (Auth + Functions + Rules)  
✅ **Smart** - Routing based on auth + profile state  
✅ **Type-Safe** - Full TypeScript coverage  
✅ **User-Friendly** - Clean UI with proper error handling  
✅ **Production-Ready** - Deployed and tested  

---

**Happy Coding! 🚀**
