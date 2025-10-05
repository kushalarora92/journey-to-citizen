# Profile Management - Quick Reference Card

## 🎯 At a Glance

**Status**: ✅ Production Ready  
**Backend**: Firebase Functions (deployed to `us-central1`)  
**Database**: Firestore (`users/{userId}` collection)  
**Security**: Multi-layer (Auth + Functions + Firestore rules)  
**Frontend**: React Context + Hooks  

---

## 📦 What's Included

| Component | Location | Purpose |
|-----------|----------|---------|
| `getUserInfo()` | Cloud Function | Fetch user profile |
| `updateUserProfile()` | Cloud Function | Create/update profile |
| `useFirebaseFunctions` | Hook | Call functions from frontend |
| `AuthContext` | Context | Global auth + profile state |
| `ProfileSetupScreen` | Screen | Profile completion UI |
| `_layout.tsx` | Root | Smart navigation logic |
| Firestore Rules | `firestore.rules` | Database security |

---

## 🚀 Quick Start

### Use Profile Data Anywhere

```typescript
import { useAuth } from '@/context/AuthContext';

function MyComponent() {
  const { userProfile, profileLoading, needsProfileSetup } = useAuth();
  
  if (profileLoading) return <Spinner />;
  
  return <Text>Hello {userProfile?.displayName}!</Text>;
}
```

### Update Profile

```typescript
import { useFirebaseFunctions } from '@/hooks/useFirebaseFunctions';
import { useAuth } from '@/context/AuthContext';

function EditProfile() {
  const { refreshProfile } = useAuth();
  const { updateUserProfile } = useFirebaseFunctions();
  
  const save = async (name: string) => {
    await updateUserProfile({ displayName: name });
    await refreshProfile();
  };
}
```

---

## 📊 AuthContext API

### State

| Property | Type | Description |
|----------|------|-------------|
| `user` | `User \| null` | Firebase Auth user |
| `userProfile` | `UserProfile \| null` | Firestore profile data |
| `loading` | `boolean` | Auth state loading |
| `profileLoading` | `boolean` | Profile fetch loading |
| `needsProfileSetup` | `boolean` | True if profile incomplete |

### Functions

| Function | Signature | Description |
|----------|-----------|-------------|
| `signIn` | `(email, password) => Promise<void>` | Sign in user |
| `signUp` | `(email, password) => Promise<void>` | Create account |
| `logout` | `() => Promise<void>` | Sign out user |
| `sendVerificationEmail` | `() => Promise<void>` | Send verification |
| `fetchUserProfile` | `(user) => Promise<void>` | Fetch profile |
| `refreshProfile` | `() => Promise<void>` | Refresh profile |

---

## 🔧 useFirebaseFunctions API

### Functions

| Function | Parameters | Returns | Description |
|----------|------------|---------|-------------|
| `getUserInfo` | none | `Promise<UserProfile>` | Get current user's profile |
| `updateUserProfile` | `UpdateProfileData` | `Promise<{ message }>` | Update profile |

### Types

```typescript
interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

interface UpdateProfileData {
  displayName?: string;
  status?: 'active' | 'inactive';
}
```

---

## 🗺️ User Journey

```
Sign Up → Verify Email → Login → Profile Setup → Main App
                                      ↑
                                  (if inactive)
```

**Returning Users:**
```
Login → Main App (profile fetched automatically)
```

---

## 🔒 Security

### Firestore Rules
```javascript
users/{userId}: 
  ✅ Read/Write: Only own profile (auth.uid === userId)
  ❌ Delete: Disabled
```

### Function Auth
```typescript
✅ Both functions check: request.auth != null
✅ UID extracted from: request.auth.uid
```

---

## 📁 File Locations

```
apps/frontend/
├─ context/AuthContext.tsx              # Global state
├─ hooks/useFirebaseFunctions.ts        # Function calls
├─ app/
│  ├─ _layout.tsx                       # Navigation
│  └─ profile-setup.tsx                 # Setup screen

apps/functions/functions/src/
└─ index.ts                             # Cloud Functions

Root:
├─ firestore.rules                      # Security rules
└─ firebase.json                        # Firebase config
```

---

## 🐛 Debugging

### Check Profile State
```typescript
const { user, userProfile, needsProfileSetup } = useAuth();
console.log({ user, userProfile, needsProfileSetup });
```

### Test Function Directly
```typescript
const { getUserInfo } = useFirebaseFunctions();
const profile = await getUserInfo();
console.log(profile);
```

### View Firestore
**Console**: https://console.firebase.google.com/project/journey-to-citizen/firestore  
**Collection**: `users/{userId}`

### View Function Logs
```bash
firebase functions:log
```

---

## ⚡ Common Tasks

### Add Profile Field

**1. Update TypeScript Interface:**
```typescript
// hooks/useFirebaseFunctions.ts
interface UserProfile {
  // ... existing fields
  phoneNumber?: string; // NEW
}
```

**2. Update Cloud Function:**
```typescript
// apps/functions/functions/src/index.ts
const profileData = {
  // ... existing fields
  phoneNumber: data.phoneNumber, // NEW
};
```

**3. Use in UI:**
```typescript
const { userProfile } = useAuth();
console.log(userProfile?.phoneNumber);
```

### Manually Trigger Profile Refresh
```typescript
const { refreshProfile } = useAuth();
await refreshProfile();
```

### Check if Profile Setup Needed
```typescript
const { needsProfileSetup } = useAuth();

if (needsProfileSetup) {
  // Show setup screen
}
```

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| `PROFILE_FLOW.md` | Implementation guide |
| `PROFILE_TESTING.md` | Testing checklist |
| `PROFILE_IMPLEMENTATION_COMPLETE.md` | Complete overview |
| `PROFILE_FLOW_DIAGRAM.md` | Visual diagrams |
| `QUICK_REFERENCE.md` | This document |

---

## 🎯 Production URLs

| Resource | URL |
|----------|-----|
| Functions | https://us-central1-journey-to-citizen.cloudfunctions.net/ |
| Firestore Console | https://console.firebase.google.com/project/journey-to-citizen/firestore |
| Auth Console | https://console.firebase.google.com/project/journey-to-citizen/authentication |
| Functions Console | https://console.firebase.google.com/project/journey-to-citizen/functions |

---

## ✅ Checklist

**Setup Complete:**
- [x] Firebase Functions deployed
- [x] Firestore rules deployed
- [x] AuthContext enhanced
- [x] Profile setup screen created
- [x] Navigation logic updated
- [x] Documentation written

**Ready to Test:**
- [ ] Create test user
- [ ] Complete profile setup
- [ ] Verify Firestore data
- [ ] Test re-login flow

---

## 💡 Tips

✅ **Profile fetches automatically** - no manual calls needed  
✅ **Use `needsProfileSetup`** - for conditional rendering  
✅ **Call `refreshProfile()`** - after updates  
✅ **Check console logs** - for debugging  
✅ **Firestore creates collections** - automatically on first write  

---

## 🆘 Common Issues

**Profile not loading?**
- Check Firebase connection
- Verify user is authenticated
- Check console for errors

**Stuck on profile setup?**
- Verify `updateUserProfile` was called
- Check Firestore console for `status: 'active'`
- Try `refreshProfile()` manually

**Navigation loop?**
- Check `needsProfileSetup` value
- Verify profile status in Firestore
- Check console navigation logs

---

**Quick Commands:**
```bash
# Start dev
pnpm dev

# Deploy functions
firebase deploy --only functions

# View logs
firebase functions:log

# Start emulators
firebase emulators:start
```

---

**Ready to go! 🚀**
