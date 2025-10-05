# Profile Management Testing Checklist

## Overview
Complete end-to-end testing guide for the profile management system.

## Prerequisites

✅ Firebase Functions deployed to production  
✅ Firestore rules deployed  
✅ Frontend app running (`pnpm dev`)  
✅ Test user account with verified email  

## Testing Flow

### 1. Create New User Account

**Steps:**
1. Open app and navigate to sign-up screen
2. Enter email and password
3. Click "Sign Up"
4. Check inbox for verification email
5. Click verification link

**Expected Result:**
- ✅ User account created
- ✅ Verification email received
- ✅ Email verified successfully

**Check Console Logs:**
```
✓ User signed up successfully
✓ Verification email sent
```

---

### 2. First Login - Profile Fetch

**Steps:**
1. Return to app
2. Sign in with verified email
3. Observe behavior

**Expected Result:**
- ✅ Login successful
- ✅ Profile fetched automatically
- ✅ Redirected to profile setup screen (because status = 'inactive')

**Check Console Logs:**
```
✓ User signed in: user@example.com
✓ User profile loaded: { status: 'inactive', ... }
Navigation check: { needsProfileSetup: true }
Redirecting to profile-setup (incomplete profile)
```

**Check AuthContext State:**
```typescript
user: { email: '...', emailVerified: true }
userProfile: { status: 'inactive', email: '...', createdAt: '...' }
needsProfileSetup: true
profileLoading: false
```

---

### 3. Complete Profile Setup

**Steps:**
1. Should be on profile setup screen
2. Verify email is displayed correctly
3. Enter display name (e.g., "John Doe")
4. Click "Complete Setup"

**Expected Result:**
- ✅ Button shows "Setting up..." while loading
- ✅ Profile updated in Firestore
- ✅ Success message shown
- ✅ Redirected to tabs (dashboard)

**Check Console Logs:**
```
📝 Updating profile with displayName: John Doe
✅ Profile updated successfully
✅ Profile refreshed
Navigation check: { needsProfileSetup: false }
Redirecting to tabs (complete profile)
```

**Check Firestore Console:**
```
users/{userId}
  ├─ uid: "..."
  ├─ email: "user@example.com"
  ├─ displayName: "John Doe"
  ├─ status: "active"
  ├─ createdAt: Timestamp
  └─ updatedAt: Timestamp
```

---

### 4. Access Main App

**Steps:**
1. Should be on dashboard (tabs)
2. Verify logout button is present
3. Navigate between tabs

**Expected Result:**
- ✅ Dashboard accessible
- ✅ Profile tab shows user information
- ✅ All tabs work properly
- ✅ No redirects to profile setup

**Check AuthContext State:**
```typescript
user: { email: '...', emailVerified: true }
userProfile: { 
  status: 'active', 
  displayName: 'John Doe',
  email: '...', 
  createdAt: '...',
  updatedAt: '...'
}
needsProfileSetup: false
profileLoading: false
```

---

### 5. Logout and Re-login

**Steps:**
1. Click logout button
2. Sign in again with same account

**Expected Result:**
- ✅ Logout successful
- ✅ Login successful
- ✅ Profile fetched automatically
- ✅ **Directly to tabs** (no profile setup - already completed)

**Check Console Logs:**
```
✓ User signed in: user@example.com
✓ User profile loaded: { status: 'active', displayName: 'John Doe', ... }
Navigation check: { needsProfileSetup: false }
Redirecting to tabs (complete profile)
```

---

### 6. Test Empty Display Name Error

**Steps:**
1. Create another new user
2. Verify email and sign in
3. On profile setup screen, leave name empty
4. Click "Complete Setup"

**Expected Result:**
- ✅ Error message: "Please enter your name"
- ✅ Button remains clickable
- ✅ No navigation

---

### 7. Test Network Error Handling

**Steps:**
1. Disable network or Firebase connection
2. Try to complete profile setup

**Expected Result:**
- ✅ Error message shown
- ✅ User can retry
- ✅ No crash

---

## Manual Firestore Verification

### Check User Document

1. Go to Firebase Console: https://console.firebase.google.com
2. Navigate to Firestore Database
3. Find `users/{userId}` collection
4. Verify document structure:

```javascript
{
  uid: "abc123...",
  email: "user@example.com",
  displayName: "John Doe",
  status: "active",
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Test Security Rules

Try to read another user's profile:
```typescript
// This should FAIL (security rules prevent it)
const db = getFirestore();
const docRef = doc(db, 'users', 'OTHER_USER_ID');
const docSnap = await getDoc(docRef);
// Error: Missing or insufficient permissions
```

---

## Troubleshooting

### Profile Not Fetching

**Issue:** Login successful but no profile loaded

**Checks:**
1. Check console for errors
2. Verify Firebase Functions are accessible
3. Check `EXPO_PUBLIC_USE_FIREBASE_EMULATOR` setting
4. Try calling `getUserInfo()` manually:
   ```typescript
   const { getUserInfo } = useFirebaseFunctions();
   const profile = await getUserInfo();
   console.log(profile);
   ```

### Stuck on Profile Setup

**Issue:** Profile setup doesn't redirect to tabs

**Checks:**
1. Verify `updateUserProfile` was called successfully
2. Check Firestore - is status = 'active'?
3. Check console logs for navigation checks
4. Manually call `refreshProfile()` in console
5. Check `needsProfileSetup` value

### Navigation Loop

**Issue:** App keeps redirecting between screens

**Checks:**
1. Check console navigation logs
2. Verify all conditions in `_layout.tsx`
3. Check `profileLoading` state - might be stuck
4. Verify `needsProfileSetup` calculation

---

## Success Criteria

✅ New user can sign up  
✅ Email verification works  
✅ First login shows profile setup  
✅ Profile setup updates Firestore  
✅ Profile setup redirects to tabs  
✅ Re-login goes directly to tabs  
✅ Profile data accessible via AuthContext  
✅ Logout clears profile state  
✅ Error handling works properly  
✅ Firestore security rules enforced  

---

## Test Commands

### Test getUserInfo directly

```typescript
import { useFirebaseFunctions } from '@/hooks/useFirebaseFunctions';

const { getUserInfo } = useFirebaseFunctions();
const profile = await getUserInfo();
console.log('Profile:', profile);
```

### Test updateUserProfile directly

```typescript
import { useFirebaseFunctions } from '@/hooks/useFirebaseFunctions';

const { updateUserProfile } = useFirebaseFunctions();
await updateUserProfile({
  displayName: 'Test Name',
  status: 'active',
});
console.log('Profile updated!');
```

### Check AuthContext State

```typescript
import { useAuth } from '@/context/AuthContext';

const { 
  user, 
  userProfile, 
  needsProfileSetup, 
  profileLoading 
} = useAuth();

console.log({
  user,
  userProfile,
  needsProfileSetup,
  profileLoading,
});
```

---

## Next Steps After Testing

Once all tests pass:

1. **Add Profile Editing**
   - Create profile edit screen
   - Allow updating displayName
   - Show createdAt date

2. **Enhance Profile Data**
   - Add more fields as needed
   - Update `UserProfile` interface
   - Update Firestore rules if needed

3. **Add Loading States**
   - Show skeleton loaders
   - Improve UX during fetches

4. **Error Boundaries**
   - Add error boundaries for profile components
   - Handle edge cases gracefully

---

**Ready to test!** 🚀

Start with creating a new user account and follow the flow step by step.
