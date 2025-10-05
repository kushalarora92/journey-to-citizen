---
applyTo: '**'
---
# Profile Management Instructions
These instructions cover the implementation of user profile features for the app. The profile system allows users to create and manage their account information.

## Requirements
- Fetch user profile data from Firestore via Firebase Functions
- Profile creation is the first step for users to access the platform's features
- When a user logs in for the first time (and profile is not complete), prompt them to complete their profile
- Keep all other tabs disabled until the profile is completed
- Ask user for basic information (display name, status)
- Store profile in Firestore `users/{userId}` collection
- Profile data structure:
  - `displayName`: string (optional)
  - `status`: 'active' | 'inactive'
  - `createdAt`: Timestamp (auto)
  - `updatedAt`: Timestamp (auto)
  - Add any additional fields as needed per app requirements

## Technical Implementation
- Use Firebase Functions `getUserInfo` to fetch profile
- Use Firebase Functions `updateUserProfile` to create/update profile
- Profile state should be managed in React Context
- Use TypeScript for type safety
- Follow existing Firebase patterns in the codebase

## UI Guidelines
- Use gluestack-ui components for consistency
- Simple, clean, and user-friendly interface
- Show loading states while fetching/updating
- Display appropriate error messages
- Validate inputs before submitting

## Notes
- This is a generic profile template
- Customize fields based on specific app requirements
- Keep profile management simple and extendable
- Profile data belongs to the user and follows Firestore security rules