# journey-to-citizen

A Turborepo monorepo with Expo (React Native) and NestJS.

## Project Structure

```
.
├── apps
│   ├── frontend    # Expo app (React Native + Web)
│   └── api         # NestJS API
├── packages
│   ├── ui          # Shared UI components
│   ├── types       # Shared TypeScript types
│   └── utils       # Shared utilities
└── turbo.json      # Turborepo configuration
```

## Getting Started

### Development

Start all dev servers:

```bash
pnpm dev
```

This will start:
- Expo dev server (frontend)
- NestJS dev server (backend)
- UI package watcher

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
- **Backend**: NestJS
- **Language**: TypeScript

## Organization

Shared packages use the organization name: `@journey-to-citizen`

## Next Steps

- [ ] Add Prisma for database management
- [ ] Set up Firebase Auth
- [ ] Configure GitHub Actions for CI/CD
- [ ] Add shared types package
- [ ] Add shared utils package
- [ ] Add more shared UI components

