# Backend Eligibility Calculation - Quick Reference

## What Changed?

### Before (Client-Side Only)
```typescript
// Frontend calculated everything
const eligibility = calculateEligibility(profile);
// Problem: Logic duplicated, can't push updates, difficult to maintain
```

### After (Hybrid Approach)
```typescript
// Backend calculates static data (on profile updates)
staticEligibility: {
  daysInCanadaAsPR: 950,
  preDaysCredit: 200,
  totalAbsenceDays: 50,
  earliestEligibilityDate: "2025-03-15"
}

// Frontend calculates dynamic data (real-time)
const eligibility = getEligibility(profile);
// Returns: daysRemaining, isEligible, progress (always fresh!)
```

---

## Data Storage (Firestore)

### User Document Structure
```json
{
  "uid": "abc123",
  "email": "user@example.com",
  "prDate": Timestamp,
  "presenceInCanada": [...],
  "travelAbsences": [...],
  
  "staticEligibility": {
    "daysInCanadaAsPR": 950,
    "preDaysCredit": 200,
    "totalAbsenceDays": 50,
    "earliestEligibilityDate": Timestamp
  }
}
```

**When is `staticEligibility` calculated?**
- ✅ On profile creation (if PR date is set)
- ✅ When user updates PR date
- ✅ When user adds/edits presence in Canada entries
- ✅ When user adds/edits travel absences

---

## API Usage

### Cloud Function: `updateUserProfile`

**Request:**
```typescript
const functions = getFunctions();
const updateProfile = httpsCallable(functions, 'updateUserProfile');

await updateProfile({
  prDate: new Date('2022-01-01'),
  presenceInCanada: [...],
  travelAbsences: [...]
});
```

**Response:**
```typescript
{
  success: true,
  message: "Profile updated successfully",
  data: {
    uid: "abc123",
    email: "user@example.com",
    staticEligibility: {
      daysInCanadaAsPR: 950,
      preDaysCredit: 200,
      totalAbsenceDays: 50,
      earliestEligibilityDate: Timestamp
    }
  }
}
```

---

## Frontend Usage

### Get Eligibility Data

```typescript
import { getEligibility } from '@/utils/eligibilityCalculations';

const eligibility = getEligibility(userProfile);

console.log(eligibility);
// Output:
{
  // Static (from backend)
  daysInCanadaAsPR: 950,
  preDaysCredit: 200,
  totalAbsenceDays: 50,
  earliestEligibilityDate: Timestamp,
  
  // Dynamic (calculated by frontend)
  totalEligibleDays: 1150,
  daysRequired: 1095,
  daysRemaining: 0,
  isEligible: true,
  progress: 105,
  earliestApplicationDate: Date('2025-03-15')
}
```

### Display in UI

```typescript
const { daysRemaining, isEligible, progress, earliestApplicationDate } = 
  getEligibility(userProfile);

return (
  <View>
    <Text>Days Remaining: {daysRemaining}</Text>
    <Text>Eligible: {isEligible ? 'Yes' : 'No'}</Text>
    <Text>Progress: {progress}%</Text>
    <Text>Eligible Date: {earliestApplicationDate?.toLocaleDateString()}</Text>
  </View>
);
```

---

## Deployment

### Deploy Cloud Functions
```bash
cd apps/functions
firebase deploy --only functions
```

### Frontend (No Changes Needed)
Frontend automatically uses new backend calculations when available. No deployment needed - it's backward compatible!

---

## Testing

### Test Backend Calculation
```bash
# Use Firebase Emulator
cd apps/functions
firebase emulators:start

# In another terminal, test the function
curl -X POST http://localhost:5001/YOUR_PROJECT/us-central1/updateUserProfile \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"prDate": "2022-01-01"}'
```

### Test Frontend
```bash
cd apps/frontend
pnpm run ios  # or pnpm run android

# Update profile in the app
# Check if staticEligibility is populated in Firestore
# Verify days remaining, progress, etc. update daily
```

---

## Troubleshooting

### `staticEligibility` is null/undefined
**Cause:** User hasn't updated their profile since the refactor  
**Solution:** Update PR date, presence, or absences to trigger calculation

### Days remaining not updating
**Cause:** Frontend not calculating dynamic values  
**Solution:** Check `getEligibility()` function is being called

### TypeScript errors in Cloud Functions
**Cause:** Types package not built or paths not configured  
**Solution:**
```bash
cd /path/to/journey-to-citizen
pnpm build --filter @journey-to-citizen/types
cd apps/functions/functions
pnpm build
```

---

## Key Files

| File | Purpose |
|------|---------|
| `packages/types/src/index.ts` | Type definitions (`StaticEligibilityData`, `EligibilityCalculation`) |
| `apps/functions/functions/src/index.ts` | Backend calculation (`calculateStaticEligibility()`) |
| `apps/frontend/utils/eligibilityCalculations.ts` | Frontend utility (`getEligibility()`) |
| `apps/frontend/app/(tabs)/index.tsx` | Dashboard (uses `getEligibility()`) |

---

## Benefits Summary

✅ **Centralized Logic** - Fix bugs server-side, no app updates needed  
✅ **Always Fresh** - Days remaining calculated in real-time  
✅ **Performance** - Static data calculated once per update  
✅ **Flexibility** - Can push logic changes via Remote Config  
✅ **Backward Compatible** - Existing code works with new system  

---

## Next Steps

1. ✅ Deploy Cloud Functions: `firebase deploy --only functions`
2. ✅ Test with a user profile update
3. ✅ Verify `staticEligibility` is populated in Firestore
4. ✅ Check dashboard displays correct data
5. 🔜 Consider adding Remote Config for feature flags
6. 🔜 Add scheduled function to recalculate eligibility weekly
7. 🔜 Implement push notifications for eligibility milestones

---

**Questions?** Check the full documentation:  
`docs/4.updates/2025-01-07_backend_eligibility_calculation.md`
