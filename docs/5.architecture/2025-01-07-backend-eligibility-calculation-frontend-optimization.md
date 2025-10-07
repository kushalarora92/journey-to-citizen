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

Reduced Firestore operations and improved data accuracy.

### Complete Data Response

To ensure the frontend receives complete and accurate profile data (including resolved server timestamps), the backend reads the document after writing:

```typescript
await userRef.set(userData, {merge: true});
const updatedDoc = await userRef.get();  // Strongly consistent read
return { success: true, data: updatedDoc.data() };
```

**Why this is safe:**
- Firestore provides **strong consistency by default** for all reads
- Per [Firestore documentation](https://firebase.google.com/docs/firestore/understand-reads-writes-scale): "Cloud Firestore reads are strongly consistent. This means that a Cloud Firestore read returns the latest version of the data that reflects all writes that have been committed up until the start of the read."
- Reading from the same DocumentReference immediately after writing guarantees we get the complete, merged data with resolved timestamps

**Operations:** 2 reads + 1 write per update

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
- **10 Firestore reads eliminated** across the application (frontend no longer re-fetches)
- **No race condition** - Backend returns complete data, frontend uses it directly
- **Strong consistency guaranteed** - Firestore's default behavior ensures latest data
- **Faster UI updates** - No network roundtrip delay for re-fetching
- **Lower costs** - Eliminated redundant reads from frontend

## Consequences

### Positive
- ✅ Centralized eligibility logic - easier to maintain and update
- ✅ No app store updates needed for eligibility rule changes
- ✅ Eliminated 10 unnecessary Firestore reads from frontend
- ✅ Strong consistency guaranteed by Firestore's default behavior
- ✅ Complete and accurate data (including resolved timestamps)
- ✅ Faster UI response - frontend uses returned data directly
- ✅ Lower Firebase costs overall

### Negative
- ⚠️ Slightly more complex architecture (hybrid calculation)
- ⚠️ Requires coordination between backend types and frontend calculations
- ⚠️ Frontend must handle result.data from all update operations
- ⚠️ Additional read per update (2 reads + 1 write instead of 1 read + 1 write)

### Mitigation
- Shared types package (`@journey-to-citizen/types`) ensures type safety between backend and frontend
- Frontend utility functions (`calculateEligibility.ts`) centralize dynamic calculations
- Added `updateLocalProfile()` helper to AuthContext for consistent pattern
- Extra read in backend is justified by data accuracy and elimination of 10 frontend reads

## Firestore Consistency Guarantees

### Strong Consistency by Default

Per [Firebase documentation](https://firebase.google.com/docs/firestore/understand-reads-writes-scale):

> "By default, Cloud Firestore reads are strongly consistent. This strong consistency means that a Cloud Firestore read returns the latest version of the data that reflects all writes that have been committed up until the start of the read."

**What this means for our implementation:**
- ✅ Reading immediately after writing **always** returns the latest data
- ✅ No eventual consistency issues within a single Cloud Function execution
- ✅ Server timestamps are resolved and accurate in the read
- ✅ All merged fields are present and correct

### Why Extra Read is Necessary

**Problem with spreading objects:**
```typescript
// ❌ WRONG: Missing fields and unresolved timestamps
return {
  ...existingData,
  ...userData,  // Contains FieldValue.serverTimestamp() - not actual timestamp
};
```

**Solution with post-write read:**
```typescript
// ✅ CORRECT: Complete data with resolved timestamps
await userRef.set(userData, {merge: true});
const updatedDoc = await userRef.get();  // Strongly consistent
return updatedDoc.data();
```

**Benefits:**
- Server timestamps are resolved to actual Timestamp objects
- All fields (existing + new) are present in response
- Guaranteed to match what's stored in Firestore
- No data loss or missing fields in frontend state

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

**Backend per profile update:**
- **Before optimization:** 3 reads + 1 write = 4 operations
  - Read 1: Check existing data
  - Read 2: Duplicate check (bug)
  - Read 3: Another duplicate (bug)
  - Write 1: Save updates
- **After optimization:** 2 reads + 1 write = 3 operations
  - Read 1: Check existing data
  - Write 1: Save updates
  - Read 2: Get complete data with resolved timestamps
- **Backend improvement:** 25% reduction (4→3 operations)

**Frontend per profile update:**
- **Before optimization:** 1 Firestore read (via refreshProfile)
- **After optimization:** 0 Firestore reads (uses returned data)
- **Frontend improvement:** 100% reduction in redundant reads

**Total system per update:**
- **Before:** 4 backend + 1 frontend = 5 operations
- **After:** 3 backend + 0 frontend = 3 operations
- **Overall improvement:** 40% reduction in Firestore operations

**Across 10 update locations in app:**
- **Before:** 50 total operations (10 × 5)
- **After:** 30 total operations (10 × 3)
- **Total savings:** 20 Firestore operations eliminated

## References
- Firebase Cloud Functions: `apps/functions/functions/src/index.ts`
- Shared Types: `packages/types/src/index.ts`
- Frontend Utilities: `apps/frontend/utils/calculateEligibility.ts`
- Documentation: `docs/4.updates/` folder
