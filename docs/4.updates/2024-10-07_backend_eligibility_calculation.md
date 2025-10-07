# Backend Eligibility Date Calculation

**Date:** October 7, 2024  
**Feature:** Refactor eligibility calculation from client to server-side  
**Status:** ✅ Implemented

---

## Overview

Moved citizenship eligibility date calculation from client-side (frontend) to server-side (Cloud Functions). This ensures:
- ✅ **Single source of truth** - Calculations happen once, server-side
- ✅ **Instant updates** - Can fix bugs or change logic without app updates
- ✅ **Version control** - Old app versions get correct calculations
- ✅ **Security** - Business logic not exposed in client code
- ✅ **Performance** - Frontend only reads pre-calculated values

---

## What Changed

### 1. **Added New Fields to UserProfile**

**File:** `packages/types/src/index.ts`

```typescript
export interface UserProfile {
  // ... existing fields ...
  
  // NEW: Backend-calculated fields
  earliestEligibilityDate?: any; // Firestore Timestamp - calculated date
  eligibilityCalculation?: EligibilityCalculation; // Detailed breakdown
}

export interface EligibilityCalculation {
  daysInCanadaAsPR: number;
  preDaysCredit: number;
  totalAbsenceDays: number;
  totalEligibleDays: number;
  daysRequired: number;
  daysRemaining: number;
  isEligible: boolean;
  progress: number; // Percentage 0-100
}
```

**What this stores:**
- `earliestEligibilityDate` - The earliest date user can apply for citizenship
- `eligibilityCalculation` - Full breakdown of the calculation (days, credit, absences, etc.)

---

### 2. **Cloud Function Now Calculates Eligibility**

**File:** `apps/functions/functions/src/index.ts`

**Added:**
- `calculateEligibility()` helper function
- Automatic calculation on every profile update
- Stores calculated values in Firestore

**Logic:**
```typescript
// When user updates profile with relevant fields:
// - prDate
// - presenceInCanada
// - travelAbsences

// Backend automatically:
1. Calculates days in Canada as PR
2. Calculates pre-PR credit (0.5 days each, max 365)
3. Calculates total absence days
4. Computes earliest eligibility date
5. Stores in Firestore (earliestEligibilityDate + eligibilityCalculation)
```

**Trigger:** Runs automatically when `updateUserProfile` is called with:
- PR date
- Presence in Canada entries
- Travel absences

---

### 3. **Frontend Now Reads Pre-Calculated Values**

**File:** `apps/frontend/utils/eligibilityCalculations.ts`

**Before:**
```typescript
calculateEligibility(profile) // Calculated client-side every time
```

**After:**
```typescript
getEligibility(profile) // Reads pre-calculated backend values
```

**Benefits:**
- No calculation overhead on client
- Always uses latest server-side logic
- Instant display (no computation delay)

---

## Calculation Rules

The backend calculates eligibility based on Canadian citizenship requirements:

### Requirements
1. **1095 days physically present in Canada** (3 years out of last 5)
2. **Pre-PR credit:** Each day before becoming PR counts as 0.5 days (max 365 days total credit)
3. **Absences:** Only count full days outside Canada
4. **Departure/return days:** Count as days IN Canada (not absences)

### Example Calculation

**Scenario:**
- PR Date: January 1, 2023
- Days since PR: 650 days
- Pre-PR presence: 400 days → Credit: 200 days (400 × 0.5)
- Travel absences: 50 full days outside Canada

**Calculation:**
```
Days in Canada as PR = 650 - 50 = 600 days
Pre-PR credit = min(400 × 0.5, 365) = 200 days
Total eligible days = 600 + 200 = 800 days

Days required = 1095 days
Days remaining = 1095 - 800 = 295 days
Is eligible = false (need 295 more days)

Earliest date = Today + 295 days
```

---

## API Behavior

### `updateUserProfile` Cloud Function

**When to calculate:**
```typescript
// Calculation triggers when updating:
- prDate
- presenceInCanada[]
- travelAbsences[]
```

**What gets stored:**
```typescript
{
  // ... user's profile data ...
  
  earliestEligibilityDate: Timestamp, // e.g., March 15, 2026
  eligibilityCalculation: {
    daysInCanadaAsPR: 600,
    preDaysCredit: 200,
    totalAbsenceDays: 50,
    totalEligibleDays: 800,
    daysRequired: 1095,
    daysRemaining: 295,
    isEligible: false,
    progress: 73.06 // percentage
  }
}
```

**When it runs:**
- ✅ Every time profile is updated with relevant fields
- ✅ Automatically merges existing + new data
- ✅ Recalculates from scratch (no stale data)
- ✅ Stores result immediately in Firestore

---

## Frontend Integration

### Dashboard (Home Tab)

**File:** `apps/frontend/app/(tabs)/index.tsx`

**Old code:**
```typescript
const eligibility = calculateEligibility(userProfile);
```

**New code:**
```typescript
const eligibility = getEligibility(userProfile);
```

**What changed:**
- No longer calculates client-side
- Reads `userProfile.eligibilityCalculation` from backend
- Converts `userProfile.earliestEligibilityDate` (Timestamp → Date)
- Falls back gracefully if backend hasn't calculated yet

---

## Migration Strategy

### For Existing Users

**Problem:** Existing users already have profiles, but no `earliestEligibilityDate` field.

**Solution:** Automatic calculation on next update
1. User updates any profile field (PR date, absences, etc.)
2. Backend detects relevant fields
3. Calculates and stores eligibility
4. Frontend immediately shows calculated values

**Manual migration (if needed):**
```typescript
// Call updateUserProfile for all existing users to trigger calculation
// Can be done via Firebase Console or admin script
```

---

## Benefits

### 1. **Logic Updates Without App Updates**

**Before:**
```
Bug in calculation → Need to update app → Wait for users to update → Takes weeks
```

**After:**
```
Bug in calculation → Fix Cloud Function → Deploy → All users get fix instantly ✅
```

### 2. **Version Independence**

- Old app versions (v1.0.0) get correct calculations
- New app versions (v2.0.0) get correct calculations
- No need to force app updates for logic fixes

### 3. **Consistency**

- Same calculation for all users
- No client-side variations (timezone, date parsing, etc.)
- Single source of truth

### 4. **Performance**

- Frontend just displays pre-calculated data
- No CPU-intensive date calculations on device
- Instant load times

### 5. **Security**

- Business logic hidden from client
- Can't be reverse-engineered or tampered with
- Future-proof for compliance/audit requirements

---

## Testing

### Test Scenarios

#### 1. New User Profile
```bash
# Create new profile with PR date
# Expected: earliestEligibilityDate calculated and stored
```

#### 2. Update PR Date
```bash
# Change PR date
# Expected: earliestEligibilityDate recalculated
```

#### 3. Add Travel Absence
```bash
# Add new absence entry
# Expected: earliestEligibilityDate updated (likely pushed forward)
```

#### 4. Add Pre-PR Presence
```bash
# Add presence before PR
# Expected: earliestEligibilityDate updated (likely pulled back)
```

#### 5. Old App Version
```bash
# Use app v1.0.0 (with old calculateEligibility)
# Expected: Still works, shows deprecation warning in console
```

---

## Deployment Checklist

### Backend
- [x] Add EligibilityCalculation type to shared types
- [x] Update UserProfile interface with new fields
- [x] Implement calculateEligibility() in Cloud Functions
- [x] Update updateUserProfile() to call calculation
- [x] Add timestamp conversion helper
- [x] Test calculation logic

### Frontend
- [x] Update eligibilityCalculations.ts
- [x] Replace calculateEligibility() with getEligibility()
- [x] Update dashboard to use new function
- [x] Add deprecation warning for old function
- [x] Test display of calculated values

### Database
- [ ] No migration needed (auto-calculates on next update)
- [ ] Optional: Run batch update for existing users

### Documentation
- [x] Create this document
- [x] Update feature instructions
- [x] Document calculation rules

---

## Future Enhancements

### 1. Remote Config for Rules
Store calculation rules in Firebase Remote Config:
```json
{
  "daysRequired": 1095,
  "preCreditMultiplier": 0.5,
  "maxPreCredit": 365,
  "fiveYearWindow": 1825
}
```

**Benefit:** Change rules instantly without deploying functions

### 2. Historical Calculations
Store calculation history:
```typescript
interface CalculationHistory {
  date: Timestamp;
  calculation: EligibilityCalculation;
  changedFields: string[];
}
```

**Benefit:** Track how eligibility changed over time

### 3. What-If Scenarios
Add function to calculate hypothetical scenarios:
```typescript
calculateWhatIf({
  hypotheticalAbsences: [...],
  futureTrips: [...]
})
```

**Benefit:** Users can plan future travel

### 4. Notification Triggers
Trigger notifications when:
- Eligibility date is reached
- Eligibility date changes significantly
- User is close to eligibility (e.g., 30 days away)

---

## Troubleshooting

### Issue: Frontend shows "N/A" for eligibility date

**Cause:** Backend hasn't calculated yet (new users, migration)

**Solution:**
1. Update any profile field (triggers calculation)
2. Refresh profile data
3. Should see calculated date

### Issue: Calculation seems incorrect

**Check:**
1. User's PR date is correct
2. Travel absences include all trips
3. Pre-PR presence entries are accurate
4. Check Cloud Function logs for calculation details

**Debug:**
```typescript
// In Cloud Functions logs, search for:
"Eligibility calculated for userId: {userId}"
// Check the calculation breakdown in logs
```

### Issue: Old app version still calculating client-side

**Expected behavior:**
- Old versions will continue to work
- They'll show deprecation warning in console
- Backend calculation takes precedence (when profile is re-fetched)

**Fix (optional):**
- Prompt users to update app
- Use Remote Config to show "Update Available" banner

---

## Code References

### Key Files Modified

1. **packages/types/src/index.ts**
   - Added `EligibilityCalculation` interface
   - Updated `UserProfile` with eligibility fields

2. **apps/functions/functions/src/index.ts**
   - Added `calculateEligibility()` function
   - Updated `updateUserProfile()` to calculate on save
   - Added `timestampToDate()` helper

3. **apps/frontend/utils/eligibilityCalculations.ts**
   - Changed `calculateEligibility()` to `getEligibility()`
   - Deprecated old function
   - Reads backend-calculated values

4. **apps/frontend/app/(tabs)/index.tsx**
   - Updated to use `getEligibility()`
   - No logic changes, just reads pre-calculated data

---

## Summary

✅ **Calculation moved to backend**  
✅ **Stored in Firestore (earliestEligibilityDate)**  
✅ **Frontend reads pre-calculated values**  
✅ **Can update logic without app updates**  
✅ **Single source of truth**  
✅ **Backward compatible**  

**Result:** More maintainable, version-independent, and secure eligibility calculation system! 🎉

---

## Related Documentation

- [Features Instructions](/docs/.github/instructions/features.instructions.md)
- [Shared Types Implementation](/docs/SHARED_TYPES_IMPLEMENTATION.md)
- [Firebase Functions Guide](/docs/3.implementation/firebase-functions-guide.md)
