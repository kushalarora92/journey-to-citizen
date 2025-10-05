# User Profile Flow - Implementation Guide

## Overview

The app now automatically fetches and manages user profiles using Firebase Functions. Here's how it works:

## Flow Diagram

```
Sign Up
   ↓
Email Verification
   ↓
Login (verified email)
   ↓
AuthContext automatically calls getUserInfo()
   ↓
Check profile status
   ↓
├─ status: 'inactive' → Show Profile Setup Screen
│     ↓
│  User completes profile
│     ↓
│  Call updateUserProfile({ status: 'active', ... })
│     ↓
│  refreshProfile()
│     ↓
└─ status: 'active' → Access App (Tabs)
```

## What's Implemented

### 1. ✅ AuthContext Enhanced
Located: `apps/frontend/context/AuthContext.tsx`

**New Features:**
- `userProfile` - User's Firestore profile data
- `profileLoading` - Loading state for profile fetch
- `refreshProfile()` - Manually refresh profile data
- `needsProfileSetup` - Boolean flag indicating if profile setup is needed

**Automatic Behavior:**
- Fetches profile automatically when user logs in
- Fetches profile automatically if email is verified
- Clears profile on logout

### 2. ✅ Profile State Management

```typescript
import { useAuth } from '@/context/AuthContext';

const { 
  user,           // Firebase Auth user
  userProfile,    // Firestore profile data
  profileLoading, // Is profile being fetched?
  needsProfileSetup, // Does user need to complete profile?
  refreshProfile  // Refresh profile manually
} = useAuth();
```

## Usage Examples

### Check if Profile Setup is Needed

```typescript
import { useAuth } from '@/context/AuthContext';

export default function HomeScreen() {
  const { user, userProfile, needsProfileSetup } = useAuth();

  if (needsProfileSetup) {
    return <ProfileSetupScreen />;
  }

  return <DashboardScreen />;
}
```

### Update Profile

```typescript
import { useAuth } from '@/context/AuthContext';
import { useFirebaseFunctions } from '@/hooks/useFirebaseFunctions';

export default function ProfileSetupScreen() {
  const { refreshProfile } = useAuth();
  const { updateUserProfile } = useFirebaseFunctions();
  const [displayName, setDisplayName] = useState('');

  const handleSubmit = async () => {
    try {
      await updateUserProfile({
        displayName,
        status: 'active', // Mark profile as complete
      });
      
      // Refresh profile to update AuthContext
      await refreshProfile();
      
      // User will now have access to the app
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  return (
    <View>
      <Input value={displayName} onChangeText={setDisplayName} />
      <Button onPress={handleSubmit}>Complete Setup</Button>
    </View>
  );
}
```

### Show Profile Data

```typescript
import { useAuth } from '@/context/AuthContext';

export default function ProfileScreen() {
  const { userProfile, profileLoading } = useAuth();

  if (profileLoading) {
    return <Loading />;
  }

  return (
    <View>
      <Text>Name: {userProfile?.displayName}</Text>
      <Text>Email: {userProfile?.email}</Text>
      <Text>Status: {userProfile?.status}</Text>
    </View>
  );
}
```

## Profile States

### 1. No Profile (First Login)
- `userProfile.status === 'inactive'` 
- Show profile setup screen
- User must complete profile to access app

### 2. Active Profile
- `userProfile.status === 'active'`
- User has full access to app features

### 3. Loading
- `profileLoading === true`
- Show loading indicator

## Next Steps to Implement

### 1. Create Profile Setup Screen
File: `apps/frontend/app/(tabs)/profile-setup.tsx`

```typescript
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useFirebaseFunctions } from '@/hooks/useFirebaseFunctions';
import { Box, VStack, Input, Button, Heading, Text } from '@gluestack-ui/themed';

export default function ProfileSetupScreen() {
  const { refreshProfile } = useAuth();
  const { updateUserProfile } = useFirebaseFunctions();
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!displayName.trim()) {
      setError('Please enter your name');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await updateUserProfile({
        displayName: displayName.trim(),
        status: 'active',
      });

      await refreshProfile();
      // Navigation will happen automatically via needsProfileSetup check
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box flex={1} bg="$background" p="$4">
      <VStack space="md" flex={1} justifyContent="center">
        <Heading size="xl">Complete Your Profile</Heading>
        <Text>Please provide your information to continue</Text>

        <Input
          placeholder="Full Name"
          value={displayName}
          onChangeText={setDisplayName}
        />

        {error && <Text color="$error500">{error}</Text>}

        <Button
          onPress={handleSubmit}
          isDisabled={loading}
        >
          <ButtonText>{loading ? 'Saving...' : 'Continue'}</ButtonText>
        </Button>
      </VStack>
    </Box>
  );
}
```

### 2. Add Profile Check to Root Layout
File: `apps/frontend/app/(tabs)/_layout.tsx`

```typescript
import { useAuth } from '@/context/AuthContext';
import { Redirect } from 'expo-router';

export default function TabLayout() {
  const { needsProfileSetup, loading } = useAuth();

  if (loading) {
    return <Loading />;
  }

  if (needsProfileSetup) {
    return <Redirect href="/profile-setup" />;
  }

  // Show tabs only if profile is complete
  return <Tabs>...</Tabs>;
}
```

### 3. Test the Flow

1. **Sign up a new user**
2. **Verify email**
3. **Login**
4. **Check console**: You should see "✓ User profile loaded: { status: 'inactive', ... }"
5. **needsProfileSetup** should be `true`
6. **Show profile setup screen**
7. **Submit profile** with `status: 'active'`
8. **needsProfileSetup** should become `false`
9. **User can access tabs**

## Debugging

### Check Profile State
```typescript
const { user, userProfile, needsProfileSetup } = useAuth();

console.log('User:', user?.email);
console.log('Profile:', userProfile);
console.log('Needs Setup:', needsProfileSetup);
```

### Manually Test Functions
```typescript
import { useFirebaseFunctions } from '@/hooks/useFirebaseFunctions';

const { getUserInfo, updateUserProfile } = useFirebaseFunctions();

// Get profile
const profile = await getUserInfo();
console.log(profile);

// Update profile
await updateUserProfile({ displayName: 'Test', status: 'active' });
```

### Check Firestore Console
https://console.firebase.google.com/project/journey-to-citizen/firestore

Look for `users/{userId}` collection after first profile update.

## Security

- ✅ Users can only read/write their own profile (Firestore rules)
- ✅ `getUserInfo` requires authentication
- ✅ `updateUserProfile` requires authentication
- ✅ Profile data synced automatically with AuthContext

## Summary

✅ **Profile fetched automatically** on login  
✅ **Profile state managed** in AuthContext  
✅ **Easy to use** with hooks  
✅ **Type-safe** with TypeScript  
✅ **Secure** with Firestore rules  
✅ **Ready to implement** profile UI  

---

**Next**: Create the profile setup screen and add the profile check to your tab layout!
