# Firebase Cloud Functions

This directory contains Firebase Cloud Functions for the Journey to Citizen app.

## Directory Structure

```
apps/functions/
├── functions/              # Firebase Functions code
│   ├── src/
│   │   └── index.ts       # Main functions file
│   ├── package.json
│   ├── tsconfig.json
│   └── .eslintrc.js
├── firebase.json          # Firebase configuration
└── .firebaserc           # Firebase project aliases
```

## Prerequisites

- Node.js 20 or higher
- Firebase CLI: `npm install -g firebase-tools`
- Firebase project with Blaze (pay-as-you-go) plan for Cloud Functions

## Setup

1. Install dependencies:
```bash
cd apps/functions/functions
pnpm install
```

2. Login to Firebase (if not already logged in):
```bash
firebase login
```

3. The project is already initialized with:
   - Firebase Functions (TypeScript)
   - Firestore Database
   - Firebase Emulators

## Development

### Build Functions
```bash
cd apps/functions/functions
pnpm build
```

### Watch Mode (auto-compile on changes)
```bash
cd apps/functions/functions
pnpm dev
```

### Run Functions Locally (Emulator)
From the root of the project:
```bash
firebase emulators:start
```

This will start:
- **Functions Emulator**: http://localhost:5001
- **Firestore Emulator**: http://localhost:8080
- **Auth Emulator**: http://localhost:9099
- **Emulator UI**: http://localhost:4000

### Test Functions Locally
```bash
cd apps/functions/functions
pnpm shell
```

## Available Functions

### 1. `helloWorld` (HTTP Function)
A simple HTTP function for testing.

**Type:** HTTP Request Function

**Endpoint:** 
- Production: `https://YOUR_REGION-YOUR_PROJECT_ID.cloudfunctions.net/helloWorld`
- Emulator: `http://localhost:5001/journey-to-citizen/us-central1/helloWorld`

**Usage:**
```bash
# Production
curl https://YOUR_REGION-YOUR_PROJECT_ID.cloudfunctions.net/helloWorld

# Emulator
curl http://localhost:5001/journey-to-citizen/us-central1/helloWorld
```

**Response:**
```json
"Hello from Firebase!"
```

### 2. `getUserInfo` (Callable Function)
Fetches user information from Firestore. Requires authentication.

**Type:** Callable Function (HTTPS)

**Authentication:** Required

**Usage in Frontend:**
```typescript
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const getUserInfo = httpsCallable(functions, 'getUserInfo');

try {
  const result = await getUserInfo();
  console.log(result.data);
} catch (error) {
  console.error('Error:', error);
}
```

**Usage with Emulator:**
```typescript
import { getFunctions, httpsCallable, connectFunctionsEmulator } from 'firebase/functions';

const functions = getFunctions();
// Connect to emulator in development
if (__DEV__) {
  connectFunctionsEmulator(functions, 'localhost', 5001);
}

const getUserInfo = httpsCallable(functions, 'getUserInfo');
const result = await getUserInfo();
```

**Response:**
```json
{
  "uid": "user-firebase-uid",
  "email": "user@example.com",
  "displayName": "John Doe",
  "status": "active",
  "createdAt": { "_seconds": 1234567890, "_nanoseconds": 0 },
  "updatedAt": { "_seconds": 1234567890, "_nanoseconds": 0 }
}
```

**If profile doesn't exist:**
```json
{
  "uid": "user-firebase-uid",
  "email": "user@example.com",
  "displayName": null,
  "status": "inactive"
}
```

**Errors:**
- `unauthenticated`: User must be logged in
- `internal`: Server error occurred

### 3. `updateUserProfile` (Callable Function)
Creates or updates user profile in Firestore. Requires authentication.

**Type:** Callable Function (HTTPS)

**Authentication:** Required

**Parameters:**
```typescript
{
  displayName?: string;
  status?: 'active' | 'inactive';
  // Any other profile fields you need
}
```

**Usage in Frontend:**
```typescript
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const updateUserProfile = httpsCallable(functions, 'updateUserProfile');

try {
  const result = await updateUserProfile({
    displayName: 'John Doe',
    status: 'active'
  });
  
  console.log(result.data);
} catch (error) {
  console.error('Error:', error);
}
```

**Response:**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "displayName": "John Doe",
    "status": "active",
    "updatedAt": { "_seconds": 1234567890, "_nanoseconds": 0 }
  }
}
```

**Errors:**
- `unauthenticated`: User must be logged in
- `internal`: Server error occurred

## Firestore Collections

### `users` Collection
Stores user profile information.

**Document ID:** User's Firebase Auth UID

**Document Structure:**
```typescript
{
  displayName?: string;
  status?: 'active' | 'inactive';
  // Add your custom fields here
  createdAt: Timestamp; // Auto-generated on first create
  updatedAt: Timestamp; // Auto-updated on every update
}
```

## Firestore Security Rules

Located in `/firestore.rules`:

```javascript
// Users can only read/write their own data
match /users/{userId} {
  allow read: if request.auth != null && request.auth.uid == userId;
  allow create, update: if request.auth != null && request.auth.uid == userId;
  allow delete: if false; // Use Cloud Functions for deletion
}
```

## Deployment

### Deploy All Functions
From the root of the project:
```bash
firebase deploy --only functions
```

### Deploy Specific Function
```bash
firebase deploy --only functions:getUserInfo
```

### Deploy Functions and Firestore Rules
```bash
firebase deploy --only functions,firestore:rules
```

### View Logs
```bash
firebase functions:log
```

Or for specific function:
```bash
firebase functions:log --only getUserInfo
```

## Environment Variables

### For Functions
Set environment variables using Firebase CLI:

```bash
firebase functions:config:set someservice.key="THE API KEY"
```

Access in code:
```typescript
import * as functions from 'firebase-functions';
const apiKey = functions.config().someservice.key;
```

### For v2 Functions (Params)
```typescript
import { defineString } from 'firebase-functions/params';
const apiKey = defineString('SOMESERVICE_KEY');
```

## Testing

### Using Emulators
1. Start emulators:
```bash
firebase emulators:start
```

2. Connect your frontend to emulators:
```typescript
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';

const functions = getFunctions();
const db = getFirestore();
const auth = getAuth();

// Only in development
if (__DEV__) {
  connectFunctionsEmulator(functions, 'localhost', 5001);
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectAuthEmulator(auth, 'http://localhost:9099');
}
```

3. Test your functions through the frontend app

### Manual Testing
Use the Firebase Emulator UI at http://localhost:4000 to:
- View function logs
- Inspect Firestore data
- Test authentication
- Manually trigger functions

## Cost Considerations

Cloud Functions pricing is based on:
- **Invocations**: Number of times your functions are executed
- **Compute time**: CPU/Memory usage during execution
- **Network egress**: Data sent from your functions

**Tips to minimize costs:**
- Set appropriate `maxInstances` to limit concurrent executions
- Optimize function code for faster execution
- Use appropriate memory settings (default is usually fine)
- Monitor usage in Firebase Console

## Troubleshooting

### Functions not deploying
- Ensure Node.js version is 20+: `node --version`
- Update Firebase CLI: `npm install -g firebase-tools@latest`
- Check that billing is enabled on your Firebase project
- Run `pnpm build` to check for TypeScript errors

### Functions timing out
- Increase timeout: Add `timeoutSeconds: 60` to function options
- Optimize database queries
- Use batch operations for multiple Firestore operations
- Consider background functions for long tasks

### CORS issues (HTTP functions only)
```typescript
import * as cors from 'cors';
const corsHandler = cors({ origin: true });

export const myFunction = onRequest((req, res) => {
  corsHandler(req, res, () => {
    // Your function code
  });
});
```

**Note:** Callable functions handle CORS automatically!

### Emulator connection issues
- Ensure emulators are running: `firebase emulators:start`
- Check that ports are not in use (5001, 8080, 9099, 4000)
- Verify emulator connection in your app code
- Clear app cache and restart

### Permission denied errors
- Check Firestore security rules
- Ensure user is authenticated
- Verify user UID matches document ID in rules

## CI/CD Integration

Example GitHub Actions workflow:

```yaml
name: Deploy to Firebase
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: pnpm install
      - run: cd apps/functions/functions && pnpm build
      - uses: w9jds/firebase-action@master
        with:
          args: deploy --only functions
        env:
          FIREBASE_TOKEN: ${{ secrets.FIREBASE_TOKEN }}
```

## Learn More

- [Firebase Functions Documentation](https://firebase.google.com/docs/functions)
- [Callable Functions Guide](https://firebase.google.com/docs/functions/callable)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Firebase Emulator Suite](https://firebase.google.com/docs/emulator-suite)
- [TypeScript for Cloud Functions](https://firebase.google.com/docs/functions/typescript)
