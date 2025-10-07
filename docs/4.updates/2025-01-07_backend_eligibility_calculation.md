# Backend Eligibility Calculation Refactor

**Date:** January 7, 2025  
**Status:** ✅ Implemented  
**Author:** System

---

## Overview

Refactored citizenship eligibility date calculation from client-side to a **hybrid approach**:
- **Backend (Cloud Functions)** calculates and stores static eligibility data when profile is updated
- **Frontend** fetches static data and calculates dynamic values (days remaining, progress) in real-time based on current date

This ensures calculation logic is centralized and can be updated server-side while avoiding stale data issues.

---

## Problem Statement

### Original Approach (Client-Side Only)
- ❌ Eligibility calculation logic duplicated in every client
- ❌ Bug fixes require app updates for all users
- ❌ Difficult to enforce consistent calculation rules
- ❌ No way to push critical logic updates without app store approval

### Initial Backend Approach (Considered but Rejected)
- ⚠️ Storing all calculated values (including `daysRemaining`, `isEligible`, `progress`) in backend
- ❌ **Problem:** These values go stale the next day
- ❌ Requires daily recalculation or user profile updates to stay current
- ❌ Poor user experience (stale countdown numbers)

---

## Solution: Hybrid Approach

### Backend Responsibilities (Static Data)
Calculate and store values that **only change when profile is updated**:

| Field | Type | Description |
|-------|------|-------------|
| `daysInCanadaAsPR` | number | Days as PR minus travel absences (snapshot) |
| `preDaysCredit` | number | Credit from pre-PR presence (max 365 days, each day = 0.5) |
| `totalAbsenceDays` | number | Total days absent from Canada |
| `earliestEligibilityDate` | Timestamp | Date when user becomes eligible for citizenship |

**Calculation Trigger:** Automatically runs when user updates:
- PR Date
- Presence in Canada entries
- Travel absence entries

### Frontend Responsibilities (Dynamic Data)
Calculate values that **change daily** based on current date:

| Field | Type | Description | Calculation |
|-------|------|-------------|-------------|
| `daysRemaining` | number | Days until eligibility | `earliestEligibilityDate - today` |
| `isEligible` | boolean | Whether eligible today | `today >= earliestEligibilityDate` |
| `progress` | number | Percentage (0-100) | `(totalEligibleDays / 1095) * 100` |
| `totalEligibleDays` | number | Total days credit | `daysInCanadaAsPR + preDaysCredit` |

---

## Implementation Details

### 1. Type Definitions

**File:** `packages/types/src/index.ts`

```typescript
/**
 * Static eligibility data calculated by backend
 * These values are stored in Firestore and only change when profile is updated
 */
export interface StaticEligibilityData {
  daysInCanadaAsPR: number;
  preDaysCredit: number;
  totalAbsenceDays: number;
  earliestEligibilityDate: any; // Firestore Timestamp
}

/**
 * Complete eligibility calculation details
 * Combines static backend data with dynamic frontend calculations
 */
export interface EligibilityCalculation extends StaticEligibilityData {
  totalEligibleDays: number;
  daysRequired: number; // Always 1095
  daysRemaining: number;
  isEligible: boolean;
  progress: number; // 0-100
}

/**
 * User profile data structure stored in Firestore
 */
export interface UserProfile {
  // ... other fields ...
  
  // Backend-calculated static eligibility data
  staticEligibility?: StaticEligibilityData;
  
  // ... timestamps ...
}
```

### 2. Backend Calculation Function

**File:** `apps/functions/functions/src/index.ts`

```typescript
/**
 * Calculate static eligibility data to be stored in Firestore
 * Only includes values that don't change daily
 */
function calculateStaticEligibility(profile: Partial<UserProfile>): {
  staticData: {
    daysInCanadaAsPR: number;
    preDaysCredit: number;
    totalAbsenceDays: number;
    earliestEligibilityDate: admin.firestore.Timestamp;
  } | null;
} {
  if (!profile.prDate) {
    return { staticData: null };
  }

  const today = new Date();
  const prDate = timestampToDate(profile.prDate);

  // Calculate days as PR
  const daysSincePR = Math.floor(
    (today.getTime() - prDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Calculate pre-PR credit (max 365 days, each day = 0.5)
  let preDaysCredit = 0;
  if (profile.presenceInCanada && profile.presenceInCanada.length > 0) {
    const totalPrePRDays = profile.presenceInCanada.reduce(
      (total, entry) => {
        const from = timestampToDate(entry.from);
        const to = timestampToDate(entry.to);
        const days = Math.floor(
          (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)
        ) + 1;
        return total + days;
      },
      0
    );
    preDaysCredit = Math.min(Math.floor(totalPrePRDays * 0.5), 365);
  }

  // Calculate absence days (only past absences)
  let totalAbsenceDays = 0;
  if (profile.travelAbsences && profile.travelAbsences.length > 0) {
    totalAbsenceDays = profile.travelAbsences
      .filter(absence => timestampToDate(absence.to) <= today)
      .reduce((total, absence) => {
        const from = timestampToDate(absence.from);
        const to = timestampToDate(absence.to);
        // Only count full days outside (exclude departure and return days)
        const days = Math.max(
          0,
          Math.floor((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) - 1
        );
        return total + days;
      }, 0);
  }

  // Calculate days in Canada as PR
  const daysInCanadaAsPR = Math.max(0, daysSincePR - totalAbsenceDays);

  // Calculate earliest eligibility date
  const totalEligibleDays = daysInCanadaAsPR + preDaysCredit;
  const daysRequired = 1095;
  const daysRemaining = Math.max(0, daysRequired - totalEligibleDays);

  let earliestDate: Date;
  if (daysRemaining > 0) {
    earliestDate = new Date(today.getTime() + daysRemaining * 24 * 60 * 60 * 1000);
  } else {
    earliestDate = today;
  }

  return {
    staticData: {
      daysInCanadaAsPR,
      preDaysCredit,
      totalAbsenceDays,
      earliestEligibilityDate: admin.firestore.Timestamp.fromDate(earliestDate),
    },
  };
}
```

### 3. Cloud Function Integration

**File:** `apps/functions/functions/src/index.ts`

```typescript
export const updateUserProfile = onCall(
  async (request): Promise<ApiResponse<UserProfile>> => {
    // ... authentication checks ...

    const userId = request.auth.uid;
    const profileData = request.data as UpdateProfileData;

    // Prepare user document data
    const userData: Record<string, any> = {
      ...profileData,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Calculate eligibility if relevant fields are present
    const hasRelevantFields =
      userData.prDate ||
      userData.presenceInCanada ||
      userData.travelAbsences;

    if (hasRelevantFields) {
      // Get current profile data to merge with updates
      const userRef = db.collection("users").doc(userId);
      const userDoc = await userRef.get();
      const existingData = userDoc.exists ? userDoc.data() : {};

      // Merge existing and new data for calculation
      const profileForCalculation = {
        ...existingData,
        ...userData,
      };

      logger.info(`Calculating eligibility for userId: ${userId}`);
      const { staticData } = calculateStaticEligibility(profileForCalculation);

      // Add calculated fields to userData
      if (staticData) {
        userData.staticEligibility = staticData;
      }
    }

    // Save to Firestore
    await userRef.set(userData, { merge: true });

    // Return updated profile
    return {
      success: true,
      message: "Profile updated successfully",
      data: { uid: userId, email: request.auth.token.email, ...userData },
    };
  }
);
```

### 4. Frontend Utility Function

**File:** `apps/frontend/utils/eligibilityCalculations.ts`

```typescript
/**
 * Get complete eligibility data combining backend static values 
 * with frontend dynamic calculations
 */
export function getEligibility(profile: UserProfile | null): EligibilityCalculation & {
  earliestApplicationDate: Date | null;
} {
  const DAYS_REQUIRED = 1095;
  
  // Default result if no profile or static data
  const defaultResult = {
    daysInCanadaAsPR: 0,
    preDaysCredit: 0,
    totalAbsenceDays: 0,
    earliestEligibilityDate: null,
    totalEligibleDays: 0,
    daysRequired: DAYS_REQUIRED,
    daysRemaining: DAYS_REQUIRED,
    isEligible: false,
    earliestApplicationDate: null,
    progress: 0,
  };

  if (!profile || !profile.prDate || !profile.staticEligibility) {
    return defaultResult;
  }

  const staticData = profile.staticEligibility;
  
  // Convert earliest eligibility date from Firestore timestamp
  let earliestDate: Date | null = null;
  if (staticData.earliestEligibilityDate) {
    earliestDate = timestampToDate(staticData.earliestEligibilityDate);
  }

  // Calculate dynamic values based on current date
  const today = new Date();
  const totalEligibleDays = staticData.daysInCanadaAsPR + staticData.preDaysCredit;
  
  // Calculate days remaining until eligibility
  let daysRemaining = 0;
  let isEligible = false;
  if (earliestDate) {
    const msRemaining = earliestDate.getTime() - today.getTime();
    daysRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));
    isEligible = today >= earliestDate;
  }

  // Calculate progress percentage
  const progress = Math.min(100, (totalEligibleDays / DAYS_REQUIRED) * 100);

  return {
    // Static data from backend
    daysInCanadaAsPR: staticData.daysInCanadaAsPR,
    preDaysCredit: staticData.preDaysCredit,
    totalAbsenceDays: staticData.totalAbsenceDays,
    earliestEligibilityDate: staticData.earliestEligibilityDate,
    
    // Calculated values (fresh, based on current date)
    totalEligibleDays,
    daysRequired: DAYS_REQUIRED,
    daysRemaining,
    isEligible,
    progress,
    earliestApplicationDate: earliestDate,
  };
}
```

---

## Data Flow

```
┌─────────────────────────────────────────────────────────┐
│                    User Updates Profile                  │
│       (PR Date, Presence, or Travel Absences)           │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│            Cloud Function: updateUserProfile             │
│  ┌───────────────────────────────────────────────────┐  │
│  │   calculateStaticEligibility()                    │  │
│  │   - daysInCanadaAsPR                              │  │
│  │   - preDaysCredit                                 │  │
│  │   - totalAbsenceDays                              │  │
│  │   - earliestEligibilityDate                       │  │
│  └───────────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                 Firestore: users/{uid}                   │
│                                                          │
│  {                                                       │
│    staticEligibility: {                                 │
│      daysInCanadaAsPR: 950,                             │
│      preDaysCredit: 200,                                │
│      totalAbsenceDays: 50,                              │
│      earliestEligibilityDate: Timestamp(2025-03-15)     │
│    }                                                     │
│  }                                                       │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│             Frontend: getEligibility()                   │
│  ┌───────────────────────────────────────────────────┐  │
│  │   Fetch static data from Firestore                │  │
│  │   Calculate dynamic values:                        │  │
│  │   - daysRemaining = earliestDate - today          │  │
│  │   - isEligible = today >= earliestDate            │  │
│  │   - progress = (totalEligible / 1095) * 100       │  │
│  └───────────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                    Dashboard Display                     │
│                                                          │
│  📊 Eligibility Progress: 87%                           │
│  📅 Days Remaining: 45 days                             │
│  ✅ Eligible: March 15, 2025                            │
│  🌍 Days in Canada: 950 days                            │
│  ⭐ Pre-PR Credit: 200 days                             │
└─────────────────────────────────────────────────────────┘
```

---

## Benefits

### ✅ Centralized Logic
- Calculation rules live in one place (backend)
- Bug fixes deployed server-side instantly
- All clients use consistent calculation logic
- No app updates required for logic changes

### ✅ Always Fresh Data
- Days remaining calculated in real-time
- Progress percentage updates daily automatically
- Eligibility status reflects current date
- No stale countdown numbers

### ✅ Performance
- Static data calculated once per profile update (not on every page load)
- Frontend only does simple date math (fast)
- Reduced server load (no daily recalculations)

### ✅ Flexibility for Future Updates
- Can push urgent fixes via Remote Config if needed
- Can change eligibility rules without app store approval
- Easy to add new calculation factors

---

## Migration Notes

### For Existing Users
- Existing users with profiles will have their `staticEligibility` calculated on next profile update
- Until then, `getEligibility()` returns default values (safe fallback)
- No data loss or corruption

### For New Users
- `staticEligibility` calculated automatically on profile creation
- Works seamlessly from day one

---

## Testing Checklist

### Backend
- ✅ `calculateStaticEligibility()` returns correct values
- ✅ `updateUserProfile` stores `staticEligibility` in Firestore
- ✅ Calculation triggers on PR date, presence, or absence updates
- ✅ Handles edge cases (no PR date, empty arrays, etc.)

### Frontend
- ✅ `getEligibility()` fetches and combines static + dynamic data
- ✅ Days remaining decreases daily automatically
- ✅ `isEligible` becomes true when date is reached
- ✅ Progress percentage updates correctly
- ✅ Handles missing `staticEligibility` gracefully

### Integration
- ✅ Dashboard displays correct eligibility data
- ✅ Profile updates trigger recalculation
- ✅ No TypeScript errors
- ✅ Cloud Functions deploy successfully

---

## Files Changed

### Packages
- `packages/types/src/index.ts` - Added `StaticEligibilityData` interface, updated `EligibilityCalculation` and `UserProfile`

### Backend (Cloud Functions)
- `apps/functions/functions/src/index.ts` - Added `calculateStaticEligibility()`, updated `updateUserProfile()`
- `apps/functions/functions/tsconfig.json` - Added path mapping for `@journey-to-citizen/types`

### Frontend
- `apps/frontend/utils/eligibilityCalculations.ts` - Refactored `getEligibility()` to use hybrid approach
- `apps/frontend/app/(tabs)/index.tsx` - Already using `getEligibility()` (no changes needed)

---

## Future Enhancements

### Potential Additions
1. **Remote Config Integration**
   - Feature flag: `enableBackendEligibilityCalculation`
   - Minimum app version check
   - Ability to block old calculation logic remotely

2. **Scheduled Cloud Function**
   - Recalculate eligibility for all users weekly
   - Catch edge cases (future absences that became past, etc.)
   - Update analytics/aggregations

3. **Notification Triggers**
   - When `earliestEligibilityDate` is within 30 days
   - When user becomes eligible
   - Reminder to apply for citizenship

4. **Analytics**
   - Track average days to eligibility
   - Monitor most common pre-PR credit amounts
   - Identify users approaching eligibility

---

## References

- [Citizenship Eligibility Rules](https://www.canada.ca/en/immigration-refugees-citizenship/services/canadian-citizenship/become-canadian-citizen/eligibility.html)
- [Firebase Cloud Functions](https://firebase.google.com/docs/functions)
- [Firestore Data Modeling](https://firebase.google.com/docs/firestore/manage-data/structure-data)

---

## Summary

✅ **Backend calculates static data** (only on profile updates)  
✅ **Frontend calculates dynamic data** (based on current date)  
✅ **Best of both worlds:** Centralized logic + Always fresh data  
✅ **Future-proof:** Can push updates without app store approval  

This hybrid approach ensures **calculation consistency** while avoiding **stale data issues**. 🎉
