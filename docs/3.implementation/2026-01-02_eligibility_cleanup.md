# Future Cleanup: Eligibility Calculation Refactor

**Date**: January 2, 2026  
**Status**: Pending (after app review completes)

## Summary

We created a shared `@journey-to-citizen/calculations` package and updated frontend to calculate eligibility on-the-fly. This document tracks the cleanup tasks needed to remove legacy/stale code.

## Final Architecture Decision

After discussion, the **current architecture is optimal**:

| Component | Role |
|-----------|------|
| **Shared Package** | Single source of truth for calculation logic |
| **Backend** | Calculates & stores `earliestEligibilityDate` (for efficient notification queries) |
| **Frontend** | Calculates on-the-fly for display (using shared package) |

**Why store `earliestEligibilityDate`?**
- Enables efficient queries for notifications: `WHERE earliestEligibilityDate == TODAY`
- Avoids scanning entire user base for scheduled jobs
- Essential for push notifications, email alerts, etc.

## Current State

- ✅ Shared package created: `packages/calculations/`
- ✅ Frontend now calculates eligibility on-the-fly via `getEligibility()`
- ✅ Non-PR projections use `calculateProjection()` from shared package
- ⏳ Backend still writes `staticEligibility` to Firestore (unnecessary now)
- ⏳ Legacy code and types still exist

## Cleanup Tasks

### 1. Backend (Cloud Functions)

**File**: `apps/functions/functions/src/index.ts`

- [ ] Remove `staticEligibility` calculation and storage in `updateUserProfile`
- [ ] Remove `hasEligibilityFieldsChanged()` usage (no longer needed)
- [ ] Remove eligibility recalculation logic from profile updates
- [ ] Keep using shared package for any server-side validation if needed

### 2. Frontend

**File**: `apps/frontend/utils/eligibilityCalculations.ts`

- [ ] Remove deprecated `calculateEligibility()` function
- [ ] Clean up any references to `profile.staticEligibility`

**File**: `apps/frontend/app/(tabs)/index.tsx`

- [ ] Verify no direct references to `staticEligibility` remain
- [ ] Remove any legacy fallback code

### 3. Types Package

**File**: `packages/types/src/index.ts`

- [ ] Remove `StaticEligibilityData` interface (or mark as deprecated)
- [ ] Remove `staticEligibility` field from `UserProfile` interface
- [ ] Update any related type exports

### 4. Firestore Data Model

**Collection**: `users/{userId}`

- [ ] `staticEligibility` field is now unused - can be removed from existing documents
- [ ] Consider a migration script or let it naturally phase out
- [ ] Update Firestore rules if any reference this field

### 5. Documentation

- [ ] Update `docs/2.FirebaseIntegration/` files to reflect new architecture
- [ ] Update any API documentation

## Why This Cleanup Matters

1. **Reduced Firestore writes** - No longer writing eligibility data on every profile update
2. **Simpler architecture** - Single source of truth (shared package)
3. **Smaller data footprint** - Less data stored per user
4. **Easier maintenance** - One calculation implementation to maintain

## Backend Simplification

After cleanup, backend still calculates eligibility but can be simplified:

| Keep | Remove |
|------|--------|
| `earliestEligibilityDate` calculation & storage | Detailed breakdown storage (daysAsPR, etc.) |
| Shared package import | `hasEligibilityFieldsChanged()` complexity |

**Why keep `earliestEligibilityDate` in backend:**
- Required for notification queries (can't query computed values)
- Scheduled jobs need indexed field to find eligible users
- Push notifications, email alerts depend on this

## Migration Notes

- Existing `staticEligibility` data in Firestore is harmless (just unused)
- No breaking changes for users - calculations remain the same
- Can be cleaned up gradually without urgency

## Related Files

- `packages/calculations/src/eligibility.ts` - Shared calculation functions
- `packages/calculations/src/index.ts` - Package exports
- `apps/frontend/utils/eligibilityCalculations.ts` - Frontend helper
- `apps/functions/functions/src/index.ts` - Cloud Functions
- `packages/types/src/index.ts` - Type definitions
