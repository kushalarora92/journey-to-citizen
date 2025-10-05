# @journey-to-citizen/types

Shared TypeScript types used across the entire monorepo.

## Usage

### In Frontend

```typescript
import { UserProfile, UpdateProfileData } from '@journey-to-citizen/types';

const profile: UserProfile = {
  uid: '123',
  email: 'user@example.com',
  displayName: 'John Doe',
  status: 'active'
};
```

### In Cloud Functions

```typescript
import { UserProfile, UpdateProfileData } from '@journey-to-citizen/types';

export const getUserInfo = onCall(async (request): Promise<UserProfile> => {
  // Implementation
});
```

## Available Types

- `UserProfile` - User profile data structure
- `UpdateProfileData` - Profile update request data
- `ApiResponse<T>` - Generic API response wrapper

## Development

```bash
# Build types
pnpm build

# Watch mode
pnpm dev
```
