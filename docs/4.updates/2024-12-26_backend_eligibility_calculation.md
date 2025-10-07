# Backend Eligibility Calculation Refactor

**Date:** 2024-12-26
**Issue:** Refactor to calculate earliest eligibility date in backend/function

## Overview

This document describes the refactoring of citizenship eligibility calculations from frontend to backend (Firebase Functions). The calculation now happens server-side whenever a user profile is updated, ensuring consistency and reducing client-side computation.

## Changes Made

### 1. Shared Types Package (`packages/types/src/index.ts`)

**Added:**
- `EligibilityCalculation` interface with fields:
  - `daysInCanadaAsPR`: Number of days in Canada as a permanent resident
  - `preDaysCredit`: Credit for days before PR (max 365, at 0.5 days each)
  - `totalAbsenceDays`: Total days absent from Canada
  - `totalEligibleDays`: Total eligible days for citizenship
  - `daysRequired`: Required days (1095)
  - `daysRemaining`: Days remaining to meet requirement
  - `isEligible`: Boolean indicating if eligible
  - `earliestApplicationDate`: Firestore Timestamp of earliest application date
  - `progress`: Percentage progress (0-100)
  - `calculatedAt`: Firestore Timestamp of when calculation was performed

**Updated:**
- `UserProfile` interface now includes optional `eligibility?: EligibilityCalculation` field

### 2. Firebase Functions

#### Created: `apps/functions/functions/src/utils/eligibilityCalculator.ts`

This utility function replicates the frontend calculation logic but runs on the backend:

```typescript
export function calculateEligibility(profile: ProfileData): EligibilityCalculation
```

**Calculation Rules:**
- Must be physically present in Canada for 1095 days (3 years) in last 5 years
- Each day before PR counts as 0.5 days (max 365 days credit)
- Only full days outside Canada count as absences
- Day of departure and return count as days IN Canada

**Key Features:**
- Handles Firestore Timestamps properly
- Returns Firestore-compatible timestamps for storage
- Includes server timestamp for when calculation was performed

#### Updated: `apps/functions/functions/src/index.ts`

Modified `updateUserProfile` function to:
1. Calculate eligibility automatically when profile has `prDate`
2. Store eligibility result in user's Firestore document
3. Log calculation results for debugging

```typescript
if (profileData.prDate) {
  const eligibility = calculateEligibility({
    prDate: profileData.prDate,
    presenceInCanada: profileData.presenceInCanada,
    travelAbsences: profileData.travelAbsences,
  });
  userData.eligibility = eligibility;
}
```

### 3. Workspace Configuration

**Updated:** `pnpm-workspace.yaml`
- Added explicit path for `apps/functions/functions` to ensure proper dependency resolution in monorepo

### 4. Frontend Changes

#### Updated: `apps/frontend/app/(tabs)/index.tsx`

- **Removed:** Direct call to `calculateEligibility()`
- **Changed:** Now reads `userProfile.eligibility` from stored profile data
- **Added:** Default eligibility object if not yet calculated
- Import changed from local calculation to type import:
  ```typescript
  import { EligibilityCalculation } from '@journey-to-citizen/types';
  ```

#### Updated: `apps/frontend/utils/eligibilityCalculations.ts`

- **Removed:** Entire `calculateEligibility()` function (~110 lines)
- **Removed:** Local `EligibilityCalculation` interface (now in shared types)
- **Kept:** Display helper functions:
  - `getUpcomingTrips()` - Counts future travel plans
  - `formatDate()` - Updated to handle Firestore Timestamps
  - `formatDaysRemaining()` - Formats days in human-readable format

**Enhanced `formatDate()` function:**
```typescript
// Now handles both Date objects and Firestore Timestamps
if (date.toDate && typeof date.toDate === 'function') {
  date = date.toDate();
}
```

## Benefits

1. **Single Source of Truth**: Calculation happens in one place (backend)
2. **Consistency**: All clients see the same calculated values
3. **Performance**: Frontend doesn't recalculate on every render
4. **Auditability**: `calculatedAt` timestamp shows when calculation was performed
5. **Maintainability**: Business logic centralized in backend

## Data Flow

```
User updates profile
    ↓
Frontend calls updateUserProfile(profileData)
    ↓
Firebase Function validates and processes
    ↓
calculateEligibility() runs if prDate exists
    ↓
Eligibility data stored in Firestore
    ↓
getUserInfo() returns profile with eligibility
    ↓
Frontend displays stored calculation
```

## Firestore Document Structure

After this change, user documents in Firestore have this structure:

```typescript
{
  uid: string,
  email: string,
  displayName: string,
  prDate: Timestamp,
  presenceInCanada: [...],
  travelAbsences: [...],
  eligibility: {
    daysInCanadaAsPR: 730,
    preDaysCredit: 365,
    totalAbsenceDays: 45,
    totalEligibleDays: 1050,
    daysRequired: 1095,
    daysRemaining: 45,
    isEligible: false,
    earliestApplicationDate: Timestamp,
    progress: 95.89,
    calculatedAt: Timestamp
  },
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

## Testing Recommendations

1. **Test profile creation** with PR date - eligibility should be calculated
2. **Test profile update** - eligibility should be recalculated
3. **Test absence addition** - eligibility should update automatically
4. **Test pre-PR presence** - credit should be applied correctly
5. **Test edge cases**:
   - Profile without PR date (no calculation)
   - Multiple absences
   - Future absences (shouldn't affect current eligibility)
   - Pre-PR credit exceeding 365 days

## Migration Notes

- Existing profiles will not have `eligibility` field initially
- They will get calculated on next profile update
- Frontend gracefully handles missing eligibility with default values
- No data migration required - calculations happen naturally as users update profiles

## Backwards Compatibility

The frontend is fully backward compatible:
- If `userProfile.eligibility` doesn't exist, defaults are used
- Display shows "N/A" for missing dates
- Progress bar shows 0% for incomplete profiles

## Future Enhancements

1. Add scheduled function to recalculate all profiles daily
2. Add notification system when eligibility status changes
3. Cache calculation result with TTL for performance
4. Add historical tracking of eligibility changes

## Related Files

- `packages/types/src/index.ts`
- `apps/functions/functions/src/index.ts`
- `apps/functions/functions/src/utils/eligibilityCalculator.ts`
- `apps/frontend/app/(tabs)/index.tsx`
- `apps/frontend/utils/eligibilityCalculations.ts`
- `pnpm-workspace.yaml`
