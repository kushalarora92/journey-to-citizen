# journey-to-citizen

A Turborepo monorepo with Expo (React Native), Firebase Functions, and Firestore.

## Quick Start

**🎉 Production Ready!** All Firebase Functions are deployed and working. See [docs/2.FirebaseIntegration/PROJECT_COMPLETE.md](docs/2.FirebaseIntegration/PROJECT_COMPLETE.md) for complete details.

**Quick Dev Menu**: Run `./dev.sh` for an interactive development menu with common commands.

## Project Structure

```
.
├── apps
│   ├── frontend    # Expo app (React Native + Web)
│   └── functions   # Firebase Cloud Functions
├── packages
│   ├── ui          # Shared UI components
│   ├── types       # Shared TypeScript types
│   └── utils       # Shared utilities
├── docs            # Documentation
│   └── 2.FirebaseIntegration  # Firebase setup guides
├── firebase.json   # Firebase configuration
├── firestore.rules # Firestore security rules
└── turbo.json      # Turborepo configuration
```

## Getting Started

### Development

#### Start Frontend Dev Server

```bash
pnpm dev
```

This will start:
- Expo dev server (frontend)
- UI package watcher

#### Start Firebase Emulators (for backend development)

```bash
firebase emulators:start
```

This will start:
- Firebase Functions emulator (port 5001)
- Firestore emulator (port 8080)
- Firebase Auth emulator (port 9099)
- Emulator UI (port 4000)

### Using Shared UI Components

The `packages/ui` package contains shared React Native components that can be used in the frontend app.

To use them in your Expo app:

```tsx
import { Button } from '@journey-to-citizen/ui';

function MyScreen() {
  return (
    <Button 
      title="Press me" 
      onPress={() => alert('Pressed!')} 
    />
  );
}
```

### Build

```bash
pnpm build
```

### Lint

```bash
pnpm lint
```

### Test

```bash
pnpm test
```

## Tech Stack

- **Monorepo**: Turborepo
- **Package Manager**: pnpm
- **Frontend**: Expo (React Native + React Native Web)
- **Backend**: Firebase Cloud Functions
- **Database**: Cloud Firestore
- **Authentication**: Firebase Authentication
- **Language**: TypeScript

## Organization

Shared packages use the organization name: `@journey-to-citizen`

## Next Steps

- [x] Set up Firebase Authentication
- [x] Set up Firebase Functions
- [x] Set up Firestore Database
- [x] Wire frontend to Firebase Functions
- [x] **Upgrade to Blaze plan** ✅
- [x] **Deploy functions to production** ✅
- [x] **Deploy Firestore rules** ✅
- [x] **Implement automatic profile fetching** ✅
- [x] **Create profile setup screen** ✅
- [ ] Test complete auth + profile flow
- [ ] Add profile editing UI
- [ ] Configure GitHub Actions for CI/CD
- [ ] Add more shared UI components

## 🚀 Production Status

**All systems operational!** 🟢

- **Functions**: 3 deployed to `us-central1`
- **Test Function**: https://us-central1-journey-to-citizen.cloudfunctions.net/helloWorld
- **Firestore**: Database created with security rules active
- **Frontend**: Ready to connect (see `hooks/useFirebaseFunctions.ts`)

## Documentation

- **🎉 Complete Guide**: [docs/2.FirebaseIntegration/PROJECT_COMPLETE.md](docs/2.FirebaseIntegration/PROJECT_COMPLETE.md)
- **Quick Start**: [docs/2.FirebaseIntegration/QUICK_START.md](docs/2.FirebaseIntegration/QUICK_START.md)
- **Deployment Success**: [docs/2.FirebaseIntegration/DEPLOYMENT_SUCCESS.md](docs/2.FirebaseIntegration/DEPLOYMENT_SUCCESS.md)
- **Functions Guide**: [apps/functions/README.md](apps/functions/README.md)
- **Development**: Run `./dev.sh` for interactive menu

