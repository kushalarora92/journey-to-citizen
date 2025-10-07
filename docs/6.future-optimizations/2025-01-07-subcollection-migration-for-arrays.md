# Future Optimization: Migrate Arrays to Subcollections

**Date:** January 7, 2025  
**Status:** TODO - Future Optimization  
**Priority:** Medium (becomes High if users have 50+ absences/presence entries)

## Current Implementation

### Data Structure
All user data is stored in a single document: `users/{userId}`

```typescript
{
  uid: string,
  email: string,
  displayName: string,
  prDate: Timestamp,
  immigrationStatus: string,
  presenceInCanada: PresenceEntry[],  // Array of entries
  travelAbsences: AbsenceEntry[],      // Array of entries
  staticEligibility: { ... },
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Current Update Pattern
When adding/editing/deleting a single absence or presence entry:

1. **Frontend:** Fetches entire array from local state
2. **Frontend:** Modifies array (add/edit/delete)
3. **Frontend:** Sends entire array to backend
4. **Backend:** Receives entire array
5. **Backend:** Writes entire array to Firestore
6. **Backend:** Returns complete profile with entire array

**Example:** User has 100 absences, adds 1 new absence:
- Frontend sends all 101 absences
- Backend writes all 101 absences
- Network payload: ~10-20KB+ (depending on data)

## Problems with Current Approach

### 1. Network Overhead
- **Problem:** Sending 100 absences when only 1 is new = ~100x more data than needed
- **Impact:** 
  - Slower on mobile/poor connections
  - Higher data usage for users
  - Increased latency
- **Scenario:** User with 100 absences editing 1 entry sends entire 100-item array

### 2. Firestore Write Size
- **Problem:** Writing large arrays repeatedly
- **Impact:**
  - More bandwidth to Firestore
  - Approaching document size limits (1MB max per document)
  - Higher write costs (charged per document write, not per field)
- **Limit:** Firestore document max = 1MB
  - Each absence ~100-200 bytes
  - Theoretical limit: ~5,000-10,000 absences per user
  - Practical limit: ~500-1,000 before performance degrades

### 3. Race Conditions
- **Problem:** Concurrent updates from multiple devices
- **Impact:** Data loss
- **Scenario:**
  ```
  Device A reads: 100 absences
  Device B reads: 100 absences
  Device A adds absence #101, writes all 101
  Device B adds absence #102, writes all 101 (different item)
  Result: Device A's absence lost! Only 101 total (B's version)
  ```

### 4. Memory & Performance
- **Problem:** Loading/processing large arrays
- **Impact:**
  - Memory usage on client
  - Serialization/deserialization overhead
  - UI lag with large lists
- **Scenario:** User with 200 absences loads profile = parsing 200 entries every time

### 5. Query Limitations
- **Problem:** Cannot efficiently query array contents
- **Impact:** 
  - Cannot get "absences in 2024" without loading all absences
  - Cannot paginate (must load all or nothing)
  - Cannot sort efficiently
- **Scenario:** User wants to see only trips from last year = must load all trips

## Proposed Solution: Subcollections

### New Data Structure

**Main Profile Document:** `users/{userId}`
```typescript
{
  uid: string,
  email: string,
  displayName: string,
  prDate: Timestamp,
  immigrationStatus: string,
  staticEligibility: { ... },
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

**Presence Subcollection:** `users/{userId}/presenceInCanada/{entryId}`
```typescript
{
  id: string,
  from: Timestamp,
  to: Timestamp,
  purpose: string,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

**Absences Subcollection:** `users/{userId}/travelAbsences/{absenceId}`
```typescript
{
  id: string,
  from: Timestamp,
  to: Timestamp,
  place: string,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### New Update Pattern

**Adding an absence:**
```typescript
// Frontend
const newAbsence = { from, to, place };
const result = await addTravelAbsence(newAbsence);

// Backend (Cloud Function)
const absenceRef = db
  .collection('users')
  .doc(userId)
  .collection('travelAbsences')
  .doc(); // Auto-generated ID

await absenceRef.set({
  id: absenceRef.id,
  ...newAbsence,
  createdAt: admin.firestore.FieldValue.serverTimestamp(),
  updatedAt: admin.firestore.FieldValue.serverTimestamp(),
});

// Only returns the new absence, not all 101
return { success: true, data: { id: absenceRef.id, ...newAbsence } };
```

**Network payload:** ~100-200 bytes (single absence) instead of 10KB+ (all absences)

## Benefits of Subcollections

### 1. Atomic Operations
✅ Add/edit/delete single entries without affecting others  
✅ No race conditions - each entry is independent  
✅ Firestore handles concurrency automatically

### 2. Network Efficiency
✅ Only send/receive changed data  
✅ 100x smaller payloads for single operations  
✅ Faster response times

### 3. Scalability
✅ No document size limits (subcollections are unlimited)  
✅ Can have 10,000+ absences per user  
✅ Performance doesn't degrade with data size

### 4. Query Flexibility
✅ Can query: "Get absences from 2024"  
✅ Can paginate: "Get 20 absences at a time"  
✅ Can sort: "Get absences ordered by date"  
✅ Can filter: "Get only past/future trips"

Example queries:
```typescript
// Get absences from 2024
const absences2024 = await db
  .collection('users')
  .doc(userId)
  .collection('travelAbsences')
  .where('from', '>=', new Date('2024-01-01'))
  .where('from', '<', new Date('2025-01-01'))
  .get();

// Paginate (first 20)
const firstPage = await db
  .collection('users')
  .doc(userId)
  .collection('travelAbsences')
  .orderBy('from', 'desc')
  .limit(20)
  .get();
```

### 5. Cost Efficiency
✅ Read only what you need  
✅ Write only what changed  
✅ Lower Firestore costs at scale

## Migration Strategy

### Phase 1: Create New Cloud Functions (Backward Compatible)
Add new functions alongside existing:
- `addTravelAbsence(absence)` - Add single absence
- `updateTravelAbsence(id, updates)` - Update single absence
- `deleteTravelAbsence(id)` - Delete single absence
- `getTravelAbsences(userId, options?)` - Get all/paginated absences
- Same for `presenceInCanada`

Keep existing `updateUserProfile()` working with arrays.

### Phase 2: Update Frontend (Gradual)
Update frontend to use new functions:
- Change `handleAddAbsence` to call `addTravelAbsence()`
- Change `handleEditAbsence` to call `updateTravelAbsence()`
- Change `handleDeleteAbsence` to call `deleteTravelAbsence()`
- Update data fetching to use `getTravelAbsences()`

### Phase 3: Migrate Existing Data
One-time migration script:
```typescript
// For each user
const users = await db.collection('users').get();

for (const userDoc of users.docs) {
  const userData = userDoc.data();
  const userId = userDoc.id;
  
  // Migrate absences
  if (userData.travelAbsences) {
    for (const absence of userData.travelAbsences) {
      await db
        .collection('users')
        .doc(userId)
        .collection('travelAbsences')
        .doc(absence.id)
        .set({
          ...absence,
          createdAt: userData.createdAt,
          updatedAt: userData.updatedAt,
        });
    }
    
    // Remove array field
    await db.collection('users').doc(userId).update({
      travelAbsences: admin.firestore.FieldValue.delete()
    });
  }
  
  // Migrate presence entries (same pattern)
}
```

### Phase 4: Remove Legacy Code
- Remove array-based logic from `updateUserProfile()`
- Remove old frontend handlers
- Clean up types

## Impact on Eligibility Calculation

**Current:**
```typescript
// Backend already has arrays in existingData
const absences = existingData.travelAbsences || [];
const totalAbsenceDays = calculateDays(absences);
```

**After Subcollections:**
```typescript
// Need to fetch subcollection for calculation
const absencesSnapshot = await db
  .collection('users')
  .doc(userId)
  .collection('travelAbsences')
  .get();

const absences = absencesSnapshot.docs.map(doc => doc.data());
const totalAbsenceDays = calculateDays(absences);
```

**Optimization:** Cache total counts in main profile:
```typescript
{
  staticEligibility: {
    daysInCanadaAsPR: 500,
    preDaysCredit: 180,
    totalAbsenceDays: 45,  // Cached value
    earliestEligibilityDate: Timestamp,
  },
  absenceCount: 15,  // For quick reference
  lastAbsenceUpdate: Timestamp  // To know when to recalculate
}
```

## Cost Analysis

### Current (Array-based)
**User with 100 absences, adds 1:**
- 1 read (get user doc)
- 1 write (update user doc with 101 absences)
- Network: ~15KB
- **Total Firestore cost:** 1 read + 1 write

### With Subcollections
**User with 100 absences, adds 1:**
- 1 write (add new absence doc)
- Network: ~200 bytes
- **Total Firestore cost:** 1 write (no read needed!)

**However, loading all absences:**
- Current: 1 read (everything in user doc)
- Subcollections: 1 read + N reads (1 per absence)
- **Trade-off:** More reads when fetching all, fewer writes when updating

**Mitigation:** 
- Cache absences in frontend (refresh only when needed)
- Use real-time listeners (Firestore optimizes these)
- Paginate (only load what's visible)

## When to Implement

### Immediate (Now) - If:
- ❌ Users expected to have 50+ entries
- ❌ Multi-device sync is critical
- ❌ Real-time collaboration needed
- ❌ Query/filter features planned

### Later (After MVP) - If:
- ✅ Users typically have < 20 entries
- ✅ Single device usage
- ✅ Simple list display only
- ✅ Performance is acceptable

## Recommendation

**For MVP:** Keep current array-based approach
- Simpler code
- Faster to develop
- Sufficient for typical usage (10-30 absences)
- Can optimize later without breaking changes

**Post-MVP:** Migrate to subcollections when:
- User base grows and we see 50+ entry patterns
- Performance issues reported
- Multi-device sync needed
- Advanced filtering/search requested

**Monitor:**
- Average number of absences/presence per user
- 95th percentile (how many heavy users have)
- User complaints about performance
- Firestore costs (reads/writes trending up)

## Implementation Checklist

When ready to implement:

- [ ] Create new Cloud Functions for subcollection operations
- [ ] Update types package with new interfaces
- [ ] Update frontend to use new functions (gradual rollout)
- [ ] Write migration script for existing data
- [ ] Test migration with test data
- [ ] Run migration on production
- [ ] Monitor errors and rollback plan
- [ ] Remove legacy array-based code
- [ ] Update documentation
- [ ] Update ADR with migration decision

## Related Files

- `apps/functions/functions/src/index.ts` - Current implementation
- `apps/frontend/app/(tabs)/absences.tsx` - Frontend absence management
- `apps/frontend/app/(tabs)/two.tsx` - Frontend presence management
- `packages/types/src/index.ts` - Type definitions
- `docs/5.architecture/2025-01-07-backend-eligibility-calculation-frontend-optimization.md` - Current architecture

## References

- [Firestore Subcollections](https://firebase.google.com/docs/firestore/data-model#subcollections)
- [Firestore Document Size Limits](https://firebase.google.com/docs/firestore/quotas)
- [Firestore Best Practices](https://firebase.google.com/docs/firestore/best-practices)
