# Quick Start Guide - Journey to Citizen

## 🚀 Running the App

### Start Development Server
```bash
cd apps/frontend
pnpm dev
```

### Run on Device
- **iOS:** Press `i` in the terminal
- **Android:** Press `a` in the terminal  
- **Web:** Press `w` in the terminal

---

## 📱 User Flow

### 1. Sign Up
1. Navigate to Sign Up screen
2. Enter email and password
3. Verify email from inbox
4. Sign in

### 2. Complete Profile
1. Enter your name
2. Select if you have PR
   - **Yes:** Select PR landing date
   - **No:** Select current status (visitor/student/worker)
3. Answer about pre-PR presence
4. Answer about travel absences
5. Submit

### 3. Use Dashboard
- View eligibility status
- Check progress toward citizenship
- See days remaining
- View statistics

### 4. Manage Profile
- Edit name
- Add pre-PR presence entries (if PR)
- View immigration status and PR date

### 5. Track Travel
- Add past trips
- Add future trips
- Edit/delete entries
- View statistics

---

## 🔧 Key Components

### DateRangeList
Reusable component for date range entries.

**Props:**
- `entries` - Array of date range entries
- `onAdd` - Handler for adding entry
- `onEdit` - Handler for editing entry
- `onDelete` - Handler for deleting entry
- `title` - Section title
- `emptyMessage` - Message when no entries
- `fields` - Additional fields configuration
- `allowFutureDates` - Allow future dates

### Eligibility Calculations
Located in `utils/eligibilityCalculations.ts`

**Functions:**
- `calculateEligibility(profile)` - Calculate citizenship eligibility
- `getUpcomingTrips(profile)` - Count future trips
- `formatDate(date)` - Format date for display
- `formatDaysRemaining(days)` - Format days in human-readable format

---

## 📊 Data Structure

### UserProfile
```typescript
{
  uid: string;
  email: string | null;
  displayName?: string;
  immigrationStatus?: 'visitor' | 'student' | 'worker' | 'permanent_resident';
  profileComplete?: boolean;
  prDate?: Date;
  presenceInCanada?: PresenceEntry[];
  travelAbsences?: AbsenceEntry[];
}
```

### PresenceEntry
```typescript
{
  id: string;
  from: Date;
  to: Date;
  purpose: 'visitor' | 'study_permit' | 'work_permit' | 
           'protected_person' | 'business' | 'no_legal_status';
}
```

### AbsenceEntry
```typescript
{
  id: string;
  from: Date;
  to: Date;
  place?: string;
}
```

---

## 🧮 Eligibility Rules

### Requirements
- 1095 days (3 years) physical presence in Canada
- Within last 5 years before application
- Must be a Permanent Resident

### Pre-PR Credit
- Each day before PR counts as 0.5 days
- Maximum 365 days credit (730 actual days)
- Must have been physically present in Canada

### Absence Calculation
- Day of departure counts as IN Canada
- Day of return counts as IN Canada
- Only full days outside count as absences
- Include all trips (even day trips to US)

### Formula
```
Days as PR = (Today - PR Date) - Absence Days
Pre-PR Credit = min(Pre-PR Days × 0.5, 365)
Total Eligible = Days as PR + Pre-PR Credit
Eligible if Total ≥ 1095
```

---

## 🎨 Design Tokens

### Colors
```typescript
Primary: '#3b82f6'  // Blue
Success: '#10b981'  // Green
Warning: '#f59e0b'  // Yellow
Error: '#ef4444'    // Red
Gray: '#64748b'     // Neutral
```

### Spacing
```typescript
xs: 4px
sm: 8px
md: 12px
lg: 16px
xl: 20px
2xl: 24px
```

### Border Radius
```typescript
sm: 8px
md: 12px
lg: 16px
```

---

## 🔥 Firebase Functions

### getUserInfo
Fetches user profile from Firestore.

**Returns:** `UserProfile`

### updateUserProfile
Updates user profile in Firestore.

**Params:** `UpdateProfileData`  
**Returns:** `ApiResponse<UserProfile>`

---

## 📝 Common Tasks

### Add a New Field to Profile
1. Update `UserProfile` in `packages/types/src/index.ts`
2. Update Firestore structure if needed
3. Update Profile Setup form
4. Update Profile Tab display
5. Rebuild types: `cd packages/types && pnpm build`

### Modify Eligibility Calculation
1. Edit `utils/eligibilityCalculations.ts`
2. Update `calculateEligibility()` function
3. Test with various scenarios
4. Update Dashboard display if needed

### Add a New Tab
1. Create file in `app/(tabs)/`
2. Add to `_layout.tsx` navigation
3. Add icon and title
4. Implement tab content

---

## 🐛 Troubleshooting

### Types Not Found
```bash
cd packages/types
pnpm build
cd ../..
pnpm install
```

### Date Picker Not Showing
- iOS: Modal shows automatically
- Android: Check date picker is imported
- Web: May need alternative date input

### Firebase Functions Not Working
- Check emulator is running (if in dev)
- Verify environment variables
- Check network connection
- Review Firebase console logs

### Profile Not Refreshing
- Call `refreshProfile()` after updates
- Check AuthContext is providing profile
- Verify Firestore rules allow read

---

## 📚 Resources

### Official Documentation
- [React Native](https://reactnative.dev/)
- [Expo](https://docs.expo.dev/)
- [Firebase](https://firebase.google.com/docs)
- [Gluestack UI](https://ui.gluestack.io/)

### Citizenship Resources
- [IRCC - Apply for Citizenship](https://www.canada.ca/en/immigration-refugees-citizenship/services/canadian-citizenship/become-canadian-citizen.html)
- [Physical Presence Calculator](https://eservices.cic.gc.ca/rescalc/resCalcStartNew.do)

---

## ✅ Checklist for Testing

- [ ] Sign up new user
- [ ] Verify email
- [ ] Complete profile setup
- [ ] View dashboard (incomplete profile)
- [ ] Add PR date
- [ ] View dashboard (with eligibility)
- [ ] Add presence entry
- [ ] Edit presence entry
- [ ] Delete presence entry
- [ ] Add travel absence
- [ ] Add future trip
- [ ] View upcoming trip alert
- [ ] Edit travel absence
- [ ] Delete travel absence
- [ ] Check eligibility calculation
- [ ] Verify progress bar
- [ ] Test navigation between tabs
- [ ] Edit profile name
- [ ] Logout and login again

---

## 🎯 Quick Tips

1. **Always call `refreshProfile()`** after updating profile
2. **Use `formatDate()`** for consistent date display
3. **Validate dates** before saving (from < to)
4. **Check for null** when accessing userProfile fields
5. **Use TypeScript types** from shared package
6. **Test on all platforms** (iOS, Android, Web)
7. **Read error messages** in console for debugging
8. **Check Firestore rules** if data access fails
9. **Use emulators** for local development
10. **Keep types package built** when developing

---

**Happy Coding! 🚀**
