# ADR: Backend Eligibility Calculation & Frontend Optimization

**Date:** January 7, 2025  
**Status:** Implemented  
**Decision Makers:** Development Team

## Context

The application calculates Canadian citizenship eligibility based on user profile data (PR date, presence in Canada, travel absences). Initially, this calculation was performed entirely on the frontend, which created several issues:

1. **Logic duplication risk** - Complex eligibility rules would need to be updated in multiple places
2. **Updateability** - Changes to eligibility rules required app store updates
3. **Inefficient data fetching** - Frontend was calling `refreshProfile()` after every profile update, causing:
   - 10 unnecessary Firestore reads across the application
   - Race condition risk (eventual consistency - read might execute before write propagates)
   - Higher latency (network roundtrip for data we already have)
   - Increased costs (double Firestore operations)

## Decision

### Backend Refactor: Hybrid Calculation Architecture

We moved eligibility calculation to backend Cloud Functions with a **hybrid approach**:

**Backend (Cloud Functions)** stores *static* values that only change when profile is updated:
- `daysInCanadaAsPR` - Days accumulated as permanent resident
- `preDaysCredit` - Credit for days before PR (capped at 365)
- `totalAbsenceDays` - Total days absent from Canada
- `earliestEligibilityDate` - Calculated earliest date user can apply

**Frontend** calculates *dynamic* values based on current date:
- `daysRemaining` - Days until eligibility
- `isEligible` - Whether user is currently eligible
- `progress` - Percentage progress toward eligibility

**Benefits:**
- Centralized business logic in backend
- No app store update needed for eligibility rule changes
- Frontend gets real-time calculations without extra API calls
- Reduced payload size (static data only)

### Backend Optimization: Smart Recalculation

Implemented intelligent change detection to avoid unnecessary recalculations:

```typescript
// Only recalculate when relevant fields actually change
function hasEligibilityFieldsChanged(userData, existingData, isNewUser): boolean {
  if (isNewUser) return true;
  
  // Check if PR date, presence, or absences changed
  return (
    JSON.stringify(userData.prDate) !== JSON.stringify(existingData.prDate) ||
    JSON.stringify(userData.presenceInCanada) !== JSON.stringify(existingData.presenceInCanada) ||
    JSON.stringify(userData.travelAbsences) !== JSON.stringify(existingData.travelAbsences)
  );
}
```

Reduced Firestore operations from **4 operations** (3 reads + 1 write) to **2 operations** (1 read + 1 write).

### Frontend Optimization: Use Returned Data

Refactored all profile update operations to use data returned from Cloud Functions instead of re-fetching:

**Before (wasteful + race condition risk):**
```typescript
await updateUserProfile(data);
await refreshProfile(); // Extra Firestore read!
```

**After (efficient + no race condition):**
```typescript
const result = await updateUserProfile(data);
if (result.data) updateLocalProfile(result.data);
```

**Benefits:**
- **10 Firestore reads eliminated** across the application
- **No race condition** - Use guaranteed consistent data from write operation
- **Faster UI updates** - No network roundtrip delay
- **Lower costs** - 50% reduction in Firestore operations for profile updates

## Consequences

### Positive
- ✅ Centralized eligibility logic - easier to maintain and update
- ✅ No app store updates needed for eligibility rule changes
- ✅ 50% reduction in Firestore operations for profile updates
- ✅ Eliminated race condition risk from eventual consistency
- ✅ Faster UI response - no network delay for re-fetching
- ✅ Lower Firebase costs

### Negative
- ⚠️ Slightly more complex architecture (hybrid calculation)
- ⚠️ Requires coordination between backend types and frontend calculations
- ⚠️ Frontend must handle result.data from all update operations

### Mitigation
- Shared types package (`@journey-to-citizen/types`) ensures type safety between backend and frontend
- Frontend utility functions (`calculateEligibility.ts`) centralize dynamic calculations
- Added `updateLocalProfile()` helper to AuthContext for consistent pattern

## Implementation Details

### Files Modified

**Backend:**
- `apps/functions/functions/src/index.ts`
  - Added `hasEligibilityFieldsChanged()` helper
  - Added `updateEligibilityData()` helper
  - Optimized `updateUserProfile()` function

**Types:**
- `packages/types/src/index.ts`
  - Added `StaticEligibilityData` interface
  - Updated `UserProfile` with `staticEligibility` field

**Frontend:**
- `apps/frontend/context/AuthContext.tsx` - Added `updateLocalProfile()`
- `apps/frontend/app/profile-setup.tsx` - Refactored to use returned data
- `apps/frontend/app/(tabs)/two.tsx` - Refactored 6 update operations
- `apps/frontend/app/(tabs)/absences.tsx` - Refactored 3 update operations

### Performance Metrics
- **Before:** 4 Firestore operations per profile update (3 reads + 1 write)
- **After:** 2 Firestore operations per profile update (1 read + 1 write)
- **Improvement:** 50% reduction in Firestore operations

## References
- Firebase Cloud Functions: `apps/functions/functions/src/index.ts`
- Shared Types: `packages/types/src/index.ts`
- Frontend Utilities: `apps/frontend/utils/calculateEligibility.ts`
- Documentation: `docs/4.updates/` folder
