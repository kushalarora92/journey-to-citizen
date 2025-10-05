# Firebase Setup Quick Start Guide

This guide will help you get Firebase Functions and Firestore up and running quickly.

## Prerequisites

- Node.js 20+ installed
- Firebase CLI installed (`npm install -g firebase-tools`)
- A Firebase project (free tier is fine)

## Project Status

✅ **Already Completed:**
- Firebase project linked (`journey-to-citizen`)
- Functions initialized with TypeScript
- Firestore initialized with security rules
- Firebase emulators configured
- Sample functions created (`helloWorld`, `getUserInfo`, `updateUserProfile`)

## Quick Commands

### 1. Install Dependencies

```bash
cd apps/functions/functions
pnpm install
```

### 2. Build Functions

```bash
cd apps/functions/functions
pnpm build
```

### 3. Start Emulators (Local Development)

From the root of the project:

```bash
firebase emulators:start
```

This starts:
- **Functions**: http://localhost:5001
- **Firestore**: http://localhost:8080
- **Auth**: http://localhost:9099
- **Emulator UI**: http://localhost:4000

### 4. Deploy to Production

```bash
# Deploy everything
firebase deploy

# Or deploy only functions
firebase deploy --only functions

# Or deploy only firestore rules
firebase deploy --only firestore:rules
```

## Testing the Functions

### Using the Emulator UI

1. Start emulators: `firebase emulators:start`
2. Open http://localhost:4000
3. Go to Functions tab
4. Test the `helloWorld` function

### Using curl (HTTP Function)

```bash
curl http://localhost:5001/journey-to-citizen/us-central1/helloWorld
```

### From Frontend App

```typescript
import { getFunctions, httpsCallable, connectFunctionsEmulator } from 'firebase/functions';

const functions = getFunctions();

// Connect to emulator in development
if (__DEV__) {
  connectFunctionsEmulator(functions, 'localhost', 5001);
}

// Call the function
const getUserInfo = httpsCallable(functions, 'getUserInfo');
const result = await getUserInfo();
console.log(result.data);
```

## Available Functions

### 1. `helloWorld`
- **Type**: HTTP Function
- **Auth**: Not required
- **Purpose**: Test function
- **URL**: `http://localhost:5001/journey-to-citizen/us-central1/helloWorld`

### 2. `getUserInfo`
- **Type**: Callable Function
- **Auth**: Required
- **Purpose**: Get user profile from Firestore
- **Returns**: User data or basic auth info if profile doesn't exist

### 3. `updateUserProfile`
- **Type**: Callable Function
- **Auth**: Required
- **Purpose**: Create or update user profile in Firestore
- **Parameters**: Profile data object

## Firestore Structure

### Users Collection

**Path**: `users/{userId}`

```typescript
{
  displayName?: string;
  status?: 'visitor' | 'student' | 'worker' | 'permanent_resident';
  prLandingDate?: string; // ISO date
  profileComplete?: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Security Rules

- Users can only read/write their own data
- Document ID must match authenticated user's UID
- Delete operations are disabled (use functions)

## Connecting Frontend to Emulators

In your frontend (`apps/frontend/config/firebase.ts`):

```typescript
import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app);

// Connect to emulators in development
if (__DEV__) {
  connectAuthEmulator(auth, 'http://localhost:9099');
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectFunctionsEmulator(functions, 'localhost', 5001);
}

export { auth, db, functions };
```

## Development Workflow

1. **Start Emulators** (in one terminal):
   ```bash
   firebase emulators:start
   ```

2. **Start Frontend** (in another terminal):
   ```bash
   cd apps/frontend
   pnpm start
   ```

3. **Watch Functions** (optional, in another terminal):
   ```bash
   cd apps/functions/functions
   pnpm dev
   ```

## Troubleshooting

### Functions won't build
- Check Node.js version: `node --version` (should be 20+)
- Clear node_modules: `rm -rf node_modules && pnpm install`
- Check for TypeScript errors: `pnpm build`

### Emulators won't start
- Check ports aren't in use: `lsof -i :5001` (or 8080, 9099, 4000)
- Kill processes using those ports: `kill -9 <PID>`
- Restart Firebase CLI: `firebase logout && firebase login`

### Functions not appearing in emulator
- Make sure functions are exported in `src/index.ts`
- Rebuild functions: `pnpm build`
- Check emulator logs for errors

### Permission denied in Firestore
- Check security rules in `firestore.rules`
- Make sure user is authenticated
- Verify document path matches `users/{userId}` pattern

## Next Steps

1. ✅ Firebase Functions setup complete
2. ✅ Firestore database configured
3. ✅ Security rules in place
4. ✅ Sample functions created
5. 🔲 Connect frontend to call functions
6. 🔲 Implement profile management UI
7. 🔲 Add more business logic functions
8. 🔲 Set up CI/CD for automatic deployment

## Useful Links

- [Firebase Console](https://console.firebase.google.com/project/journey-to-citizen)
- [Functions Logs](https://console.firebase.google.com/project/journey-to-citizen/functions/logs)
- [Firestore Database](https://console.firebase.google.com/project/journey-to-citizen/firestore)
- [Emulator UI](http://localhost:4000) (when running locally)

## Cost Monitoring

Firebase Functions on Blaze plan includes:
- **2M invocations/month** (free)
- **400,000 GB-seconds** (free)
- **200,000 CPU-seconds** (free)

Monitor usage in [Firebase Console → Usage](https://console.firebase.google.com/project/journey-to-citizen/usage).

---

**Need Help?** Check the [Functions README](apps/functions/README.md) for more detailed documentation.
