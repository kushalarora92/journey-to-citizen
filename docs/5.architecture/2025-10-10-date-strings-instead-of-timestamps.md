# ADR: Use Date Strings Instead of Firestore Timestamps for Date-Only Fields

**Date:** October 10, 2025
**Status:** Implemented  
**Decision Makers:** Development Team

## Context

The application tracks various dates related to Canadian immigration and citizenship:
- PR landing date (`prDate`)
- Presence in Canada periods (`presenceInCanada[].from`, `presenceInCanada[].to`)
- Travel absences (`travelAbsences[].from`, `travelAbsences[].to`)
- Earliest eligibility date (`staticEligibility.earliestEligibilityDate`)

These fields were initially implemented using Firestore `Timestamp` objects, which store full datetime information including timezone. However, our use case only requires **calendar dates**, not specific moments in time.

## Problem

Using Firestore Timestamps for date-only data created several issues:

1. **Semantic mismatch**: We track "days" not "moments in time"
   - "I left Canada on 2024-12-25" is a calendar date concept, not a timestamp
   - Timezone information is irrelevant and potentially confusing

2. **Timezone complications**: 
   - A timestamp can represent different calendar dates in different timezones
   - Example: `2024-12-25T05:00:00.000Z` is Dec 24 in Pacific Time, Dec 25 in UTC
   - Users thinking about calendar dates, not UTC timestamps

3. **Business logic alignment**:
   - Canadian citizenship rules operate on **calendar dates**: "days in last 5 years"
   - IRCC physical presence calculator uses dates, not timestamps
   - Our 5-year eligibility window should be date-based, not timestamp-based

4. **Data clarity**:
   - Timestamps in Firestore console show as: `October 10, 2025 at 12:00:00 AM UTC`
   - Date strings would show as: `"2025-10-10"` (much clearer)

## Decision

**We will store all date-only fields as ISO 8601 date strings (YYYY-MM-DD format) instead of Firestore Timestamps.**

### Format Specification
- **Storage format**: `"YYYY-MM-DD"` (e.g., `"2025-01-10"`)
- **Standard**: ISO 8601 date format
- **Type**: String in Firestore, TypeScript `string` type
- **Timezone**: Implicit UTC (no time component)

### Fields Changed
```typescript
// Before (Timestamps)
prDate: Timestamp
presenceInCanada[].from: Timestamp
presenceInCanada[].to: Timestamp
travelAbsences[].from: Timestamp
travelAbsences[].to: Timestamp
staticEligibility.earliestEligibilityDate: Timestamp

// After (Date Strings)
prDate: string // "2025-01-10"
presenceInCanada[].from: string // "2024-06-15"
presenceInCanada[].to: string // "2024-09-20"
travelAbsences[].from: string // "2024-12-01"
travelAbsences[].to: string // "2024-12-15"
staticEligibility.earliestEligibilityDate: string // "2026-03-15"
```

### Conversion Functions

**Backend (Firebase Functions):**
```typescript
// Parse date string to Date object
function parseDate(dateString: string): Date {
  return new Date(dateString + "T00:00:00.000Z");
}

// Format Date object to date string
function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}
```

**Frontend (React Native):**
```typescript
// Parse date string to Date object
function parseDate(dateString: string): Date {
  return new Date(dateString + 'T00:00:00.000Z');
}

// Save dates as strings
const dateString = date.toISOString().split('T')[0]; // "2025-01-10"
```

### Migration Strategy
- **No automatic migration** - Users instructed to clear and re-enter data
- New data will be stored as date strings
- Old timestamp data will cause TypeScript errors (forcing manual cleanup)

## Consequences

### Positive
- ✅ **Semantic correctness**: Stores dates as dates, not timestamps
- ✅ **Timezone elimination**: No timezone confusion for date-only operations
- ✅ **Business logic alignment**: Matches Canadian citizenship rules (date-based)
- ✅ **Smaller payload**: `"2025-01-10"` vs `{"_seconds":1736467200,"_nanoseconds":0}`
- ✅ **Readability**: Firestore console shows human-readable dates
- ✅ **Sorting**: ISO format sorts correctly as strings (`"2025-01-10" < "2025-12-25"`)
- ✅ **Validation**: Easier to validate date format (regex: `^\d{4}-\d{2}-\d{2}$`)
- ✅ **Portability**: Standard format works across systems

### Negative
- ⚠️ **Not native Firestore type**: Stored as string, not `Timestamp`
- ⚠️ **Manual parsing**: Need to convert to `Date` objects for calculations
- ⚠️ **No automatic validation**: Firestore won't validate date format
- ⚠️ **Migration required**: Users must re-enter existing data

### Neutral
- 📝 **createdAt/updatedAt remain Timestamps**: Audit trail fields keep timestamp precision
- 📝 **Frontend already handles**: `new Date("2025-01-10")` parses ISO strings correctly
- 📝 **Type safety**: TypeScript enforces `string` type across backend/frontend

## Implementation Details

### Files Modified

**Types Package:**
- `packages/types/src/index.ts`
  - Changed `prDate`, `from`, `to`, `earliestEligibilityDate` to `string` type

**Backend Functions:**
- `apps/functions/functions/src/index.ts`
  - Added `parseDate()` and `formatDate()` helper functions
  - Updated `calculateStaticEligibility()` to use date strings
  - Removed old `timestampToDate()` function

**Frontend:**
- `apps/frontend/components/DateRangeList.tsx`
  - Changed `.toISOString()` to `.toISOString().split('T')[0]`
- `apps/frontend/app/(tabs)/two.tsx`
  - Updated PR date save to use date string format
- `apps/frontend/app/profile-setup.tsx`
  - Updated initial PR date save to use date string format
- `apps/frontend/utils/eligibilityCalculations.ts`
  - Replaced `timestampToDate()` with `parseDate()` function
  - Updated default `earliestEligibilityDate` to empty string

### Deployment
- **Backend deployed:** January 10, 2025
- **Functions updated:** `updateUserProfile`, `getUserInfo`, `helloWorld`
- **TypeScript compilation:** ✅ Passed (backend & frontend)
- **Lint:** ✅ Passed

## Examples

### Storing a Date
```typescript
// Frontend: User selects date from picker
const selectedDate = new Date(2025, 0, 10); // Jan 10, 2025

// Convert to date string for storage
const dateString = selectedDate.toISOString().split('T')[0]; // "2025-01-10"

// Send to backend
await updateUserProfile({ prDate: dateString });
```

### Reading and Calculating
```typescript
// Backend: Calculate days between dates
const prDate = parseDate(profile.prDate); // "2025-01-10" → Date object
const today = new Date();
const daysSincePR = Math.floor((today - prDate) / (1000*60*60*24));

// Store calculated date as string
const earliestDate = new Date(today.getTime() + daysRemaining * 24*60*60*1000);
staticEligibility.earliestEligibilityDate = formatDate(earliestDate); // "2026-03-15"
```

### Frontend Display
```typescript
// Frontend: Parse date string for display
const prDate = parseDate(profile.prDate); // "2025-01-10" → Date object
const formatted = prDate.toLocaleDateString('en-US', { 
  year: 'numeric', 
  month: 'long', 
  day: 'numeric' 
}); // "January 10, 2025"
```

## Alternative Considered

### Keep Firestore Timestamps
**Pros:**
- Native Firestore type
- Automatic serialization/deserialization
- Timezone information preserved

**Cons:**
- Overkill for date-only data
- Timezone confusion for users
- Semantic mismatch with business domain
- Larger payload size

**Decision:** Rejected because the semantic correctness and business logic alignment with date strings outweighs the convenience of native Firestore types.

## Related Documents
- [Backend Eligibility Calculation ADR](./2025-01-07-backend-eligibility-calculation-frontend-optimization.md)
- [5-Year Window Bug Fix](../7.bug-fixes/2025-01-07-five-year-eligibility-window-fix.md)
- [Shared Types Package](../../packages/types/src/index.ts)

## Future Considerations

1. **Validation**: Add format validation in backend functions
   ```typescript
   const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
   if (!dateRegex.test(dateString)) throw new Error('Invalid date format');
   ```

2. **Range Validation**: Ensure dates are reasonable
   ```typescript
   const date = parseDate(dateString);
   if (date < new Date('1900-01-01') || date > new Date('2100-12-31')) {
     throw new Error('Date out of reasonable range');
   }
   ```

3. **Firestore Rules**: Add validation in `firestore.rules`
   ```javascript
   match /users/{userId} {
     allow write: if request.resource.data.prDate.matches('^\\d{4}-\\d{2}-\\d{2}$');
   }
   ```

4. **Unit Tests**: Add tests for date parsing and formatting
   - Test edge cases (leap years, month boundaries)
   - Test timezone-independent behavior
   - Test sorting and comparison

## Lessons Learned
- **Choose types that match your domain**: Date-only data should be stored as dates, not timestamps
- **Semantic correctness > convenience**: ISO date strings are clearer than timestamps for this use case
- **Business rules drive technical decisions**: Canadian citizenship operates on calendar dates
- **TypeScript helps enforce migration**: Type changes force code updates, preventing mixed formats
