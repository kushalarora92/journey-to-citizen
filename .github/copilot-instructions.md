# Journey to Citizen
One platform from the day you land in Canada till your passport 🎉

## Overview
Journey to Citizen is a comprehensive platform designed to assist newcomers to Canada in navigating the various stages of their journey, from arrival to citizenship. 

## MVP Features

- **User Authentication**: Secure sign-up and login functionality to create and manage user accounts.

- **Profile Creation**: Users can create and manage their profiles, including status (e.g., visitor, student, worker, permanent resident), PR Landing / entry date, and other relevant information to compute eligibility date to apply for citizenship.

- **Absence / travel log**: A feature that allows users to log their absences from Canada, which is crucial for meeting residency requirements for citizenship.

- **Ongoing count / dashboard**: A dashboard that provides users with real-time updates on their eligibility status, including countdowns to important dates.

- **Document Checklist**: A feature that helps users keep track of the documents they need to submit for their citizenship application.

- **Reminders & notifications**: Automated reminders for important dates and deadlines related to the citizenship application process.

- **Disclaimers, rule summary** : Clear explanations of the rules and requirements for Canadian citizenship, including any disclaimers about the information provided.

- **Export or print summary**: Users can export or print a summary of their profile, absences, and eligibility status for their records.

- **Privacy / security measures**: Ensuring that user data is protected and secure, with clear privacy policies in place.


## Coding Guidelines

### General Principles
- Follow best practices for code quality, readability, and maintainability.
- This is a React Native application. It supports both iOS and Android platforms.
- In addition, it will also use React Native Web for web support.
- Use TypeScript for type safety and better developer experience.
- Use functional components and React hooks.
- App is built using Expo with tabs navigation template.
- App supports both dark and light mode.
- Prioritize creating reusable components wherever possible (preferably themed components).
- Ensure the app is responsive and works well on various screen sizes and orientations.
- Write unit tests for critical components and functionalities.

### UI & Styling
- **!!IMPORTANT!!** ALWAYS use gluestack-ui components as the PRIMARY component library
  - Use `@gluestack-ui/themed` for all UI components (Box, VStack, HStack, Button, Input, etc.)
  - Use gluestack's theme tokens for colors: `$background`, `$textLight600`, `$primary500`, etc.
  - Leverage GluestackUIProvider for automatic dark/light mode support
- **IF** a component is not available in gluestack-ui, THEN use NativeWind and Tailwind CSS
- **AVOID** using React Native StyleSheet - unless component is very custom and cannot be achieved with gluestack or NativeWind
- Avoid inline styles unless absolutely necessary
- Maintain a consistent design language throughout the app using gluestack's design tokens
- **Icons**: Use `@expo/vector-icons/FontAwesome` for all icons - avoid emojis for consistency and cross-platform compatibility

### Environment Variables
- **ALWAYS** use `EXPO_PUBLIC_` prefix for client-side environment variables
- Access via `process.env.EXPO_PUBLIC_*` directly in code (works on iOS, Android, and Web)
- Store sensitive config in `.env` file (not committed to git)
- Example: `EXPO_PUBLIC_FIREBASE_API_KEY`, `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
- **NO NEED** for `extra` object in `app.config.js` or `Constants.expoConfig.extra`

### Authentication Patterns (Firebase)
- Use React Context (`AuthContext`) for global auth state management
- Implement auth state persistence across app restarts
- Use `onAuthStateChanged` listener for real-time auth updates
- Route structure:
  - Unauthenticated users: `/auth/*` routes (sign-in, sign-up, forgot-password, verify-email)
  - Authenticated users: `/(tabs)/*` routes
  - Root layout handles auth state checking and routing
- Platform-specific considerations:
  - Use `Platform.OS === 'web'` checks for web-specific features
  - Use `Alert.alert()` for native, custom modals/toasts for web
- Firebase config in `/config/firebase.ts` using `process.env.EXPO_PUBLIC_*` variables

### Component Patterns
- Always export both named and default exports for consistency
- Use TypeScript interfaces for props
- Implement proper loading and error states
- Use gluestack's built-in variants and sizes for consistency
- Example structure:
  ```tsx
  import { Box, VStack, Button, Heading } from '@gluestack-ui/themed';
  
  export default function MyComponent() {
    return (
      <Box flex={1} bg="$background">
        <VStack space="md">
          <Heading>Title</Heading>
          <Button action="primary">Action</Button>
        </VStack>
      </Box>
    );
  }
  ```

### File Organization
- Auth screens: `app/auth/*.tsx`
- Shared contexts: `context/*.tsx`
- Firebase config: `config/firebase.ts`
- Reusable components: `components/*.tsx`
- Environment variables: `.env` (with `EXPO_PUBLIC_` prefix)
- Cloud Functions: `apps/functions/functions/src/*.ts`
- Firestore rules: `firestore.rules`

### Firebase Functions Patterns
- Use **v2 callable functions** for client-facing APIs that require authentication
- Use **v1 HTTP functions** only for webhooks or public endpoints
- Always check `request.auth` in callable functions for authentication
- Use `firebase-admin` SDK for server-side operations
- Initialize Admin SDK once: `admin.initializeApp()`
- Access Firestore: `const db = admin.firestore()`
- Use `admin.firestore.FieldValue.serverTimestamp()` for timestamps
- Implement proper error handling with `HttpsError`
- Use structured logging: `logger.info()`, `logger.error()`
- Set `maxInstances` globally or per-function for cost control
- Example callable function:
  ```typescript
  export const myFunction = onCall(async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Must be logged in');
    }
    const userId = request.auth.uid;
    // Your logic here
    return { success: true, data: {} };
  });
  ```

### Firestore Patterns
- Use user's Firebase Auth UID as document ID in `users` collection
- Structure: `users/{userId}/...`
- Always include `createdAt` and `updatedAt` timestamps
- Use security rules to enforce user can only access their own data
- Use subcollections for nested data (e.g., `users/{userId}/absences/{absenceId}`)
- Batch operations for multiple writes
- Use transactions for atomic operations
- Example security rule:
  ```javascript
  match /users/{userId} {
    allow read, write: if request.auth != null && request.auth.uid == userId;
  }
  ```

### Development Workflow
- Use Firebase Emulators for local development
- Connect frontend to emulators in development mode
- Test functions through the Emulator UI (http://localhost:4000)
- Deploy functions: `firebase deploy --only functions`
- Deploy rules: `firebase deploy --only firestore:rules`


## Tech Stack

### Core Technologies
- **React Native** - Cross-platform mobile framework
- **TypeScript** - Type safety and better DX
- **Expo** - Development platform and tooling
- **Turborepo** - Monorepo management

### UI & Styling
- **@gluestack-ui/themed** (v1.1.73) - PRIMARY component library
- **@gluestack-ui/config** - Theme configuration
- **NativeWind** - Tailwind CSS for React Native (fallback when gluestack doesn't have the component)
- **react-native-svg** - SVG support for gluestack icons

### Backend & Services
- **Firebase Authentication** - User auth (email/password)
- **Cloud Firestore** - NoSQL database for user data
- **Firebase Cloud Functions** - Serverless backend (in `apps/functions`)
- **Firebase Emulator Suite** - Local development environment

### Development Tools
- **Jest** - Testing framework
- **React Native Web** - Web support
- **VSCode** - Development environment
- **pnpm** - Package manager

### Key Libraries
- **expo-router** - File-based routing
- **expo-constants** - Access to app config
- **React Context API** - State management (AuthContext)

## Project Structure

```
.
├── apps
│   ├── frontend    # Expo app (React Native + Web)
│   └── functions   # Firebase Cloud Functions
│       └── functions/
│           └── src/
│               └── index.ts  # Cloud Functions code
├── packages
│   ├── ui          # Shared UI components
│   ├── types       # Shared TypeScript types
│   └── utils       # Shared utilities
├── docs            # Documentation (organized by feature)
├── firebase.json   # Firebase configuration
├── firestore.rules # Firestore security rules
└── turbo.json      # Turborepo configuration
```

## Documentation Guidelines

### Organization Structure
All project documentation must be organized in the `docs/` folder at the workspace root following this structure:

```
docs/
├── 1.authentication/           # Feature group (numbered)
│   ├── 2024-12-15_auth_flow.md
│   └── 2024-12-20_password_reset.md
├── 2.profile-management/       # Feature group (numbered)
│   ├── 2024-12-18_profile_setup.md
│   └── 2024-12-22_profile_edit.md
├── 3.shared-types/             # Feature group (numbered)
│   └── 2024-12-25_implementation.md
└── README.md                   # Index of all documentation
```

### Naming Conventions
- **Folders**: `{number}.{feature-name}/` (lowercase, hyphenated)
  - Example: `1.authentication/`, `2.profile-management/`, `3.absence-tracking/`
  - Number indicates implementation order or priority
  
- **Files**: `{YYYY-MM-DD}_{descriptive-name}.md`
  - Example: `2024-12-25_firebase_migration.md`
  - Date reflects when the feature/document was created
  - Use lowercase and hyphens for readability

### Documentation Standards
- Every major feature should have its own numbered folder
- Include a README.md in each feature folder summarizing the documents
- Root `docs/README.md` should maintain an index of all feature folders
- Add dates to track documentation chronology
- Group related documents together (setup, implementation, testing, troubleshooting)
- Include code examples, configuration details, and troubleshooting sections
- Keep documentation up-to-date when making code changes

### When to Create Documentation
- New feature implementation (setup, flow, API contracts)
- Architecture decisions (shared types, state management patterns)
- Deployment procedures and production configs
- Troubleshooting guides for common issues
- Integration guides (Firebase, third-party services)
- Testing strategies and checklists


## License
See the LICENSE file for details.