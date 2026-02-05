# Timeline Tab Implementation

**Date:** February 4, 2026  
**Feature:** Unified Timeline View for Immigration Status and Travel

## Overview

Replaced the separate "Travel" tab with a unified "Timeline" tab that combines both immigration status changes and travel absences in a single chronological view. This simplifies the user experience by providing one consolidated place to track their complete journey in Canada.

## Changes Made

### 1. New Timeline Component
- **File:** `apps/frontend/app/(tabs)/timeline.tsx`
- **Features:**
  - Unified timeline showing both status changes and trips
  - Reverse chronological order (latest first)
  - Color-coded status entries matching Immigration Timeline styling
  - Expandable items for edit/delete actions
  - Separate modals for adding/editing trips vs. status
  - Smart badges: "CURRENT", "UPCOMING", "TODAY"
  - Calculation of absent days for trips
  - Quick action buttons: "Add Trip", "Add Status", "Got PR!"

### 2. Tab Navigation Updates
- **File:** `apps/frontend/app/(tabs)/_layout.tsx`
- Changed tab from `absences` to `timeline`
- Changed tab label from "Travel" to "Timeline"
- Changed icon from `plane` to `history`

### 3. Web Navigation Bar Update
- **File:** `apps/frontend/components/WebNavigationBar.tsx`
- Updated nav items to reflect timeline route and label

### 4. Profile Tab Simplification
- **File:** `apps/frontend/app/(tabs)/profile.tsx`
- Removed "Time in Canada Before PR" section (legacy presenceInCanada)
- Users now manage all statuses through the Timeline tab
- Added link to Timeline tab instead of separate Travel tab reference
- Kept Immigration Timeline section for viewing status history

### 5. Dashboard Updates
- **File:** `apps/frontend/app/(tabs)/index.tsx`
- Updated quick action buttons to "View Timeline" instead of "Manage Travel History"
- Changed icon from `plane` to `history`
- Updated all navigation links from `/(tabs)/absences` to `/(tabs)/timeline`
- Updated tracking events

### 6. Backward Compatibility
- **File:** `apps/frontend/app/(tabs)/absences.tsx`
- Created redirect component to automatically forward old `/absences` routes to `/timeline`
- Ensures bookmarks and deep links continue to work
- Old file backed up as `absences.tsx.backup`

## User Experience Improvements

### Before
- Status changes in Profile tab only
- Travel absences in separate Travel tab
- Users had to switch between tabs to manage their complete journey
- Confusing separation of pre-PR status and post-PR status

### After
- Single Timeline tab shows complete journey
- Status changes and trips interwoven chronologically
- Visual hierarchy: larger dots for status changes, smaller for trips
- Current status automatically inferred from timeline
- Clear temporal relationship between status changes and trips
- Simplified data entry - one place for everything

## Design Inspiration

Took inspiration from the existing Immigration Timeline component in Profile tab:
- Same color scheme for status types
- Similar card-based layout
- Expandable interaction pattern
- Consistent typography and spacing

## Migration Notes

### For Existing Users
- All existing `statusHistory` and `travelAbsences` data preserved
- No data migration required - reads from same Firestore fields
- Old routes automatically redirect to new timeline

### For Future Development
- `presenceInCanada` field now deprecated (use `statusHistory` instead)
- All status management should use `statusHistory` array
- Travel absences remain in `travelAbsences` array
- Backend calculations already support both formats

## Analytics Events

New tracking events added:
- `timeline_action` with various action types:
  - `open_add_trip`, `add_trip_attempt`, `add_trip_success`, `add_trip_error`
  - `open_add_status`, `add_status_attempt`, `add_status_success`, `add_status_error`
  - `open_edit_trip`, `edit_trip_attempt`, `edit_trip_success`, `edit_trip_error`
  - `open_edit_status`, `edit_status_attempt`, `edit_status_success`, `edit_status_error`
  - `delete_trip_attempt`, `delete_trip_success`, `delete_trip_error`
  - `delete_status_attempt`, `delete_status_success`, `delete_status_error`
  - `got_pr_click`

Dashboard events updated:
- `quick_action_view_timeline` (was `quick_action_manage_travel`)

## Next Steps

1. ✅ Timeline component created
2. ✅ Navigation updated
3. ✅ Profile simplified
4. ✅ Dashboard updated
5. ✅ Backward compatibility ensured
6. 📝 Monitor analytics for user adoption
7. 📝 Consider removing `presenceInCanada` field in future major version

## Code Quality

- TypeScript types properly used throughout
- Consistent error handling
- Proper loading states
- Responsive design (works on mobile and web)
- Analytics integrated
- Follows existing patterns and conventions

## Testing Checklist

- [ ] Add new status entry
- [ ] Add new trip entry
- [ ] Edit existing status
- [ ] Edit existing trip
- [ ] Delete status
- [ ] Delete trip
- [ ] "Got PR!" flow
- [ ] Current status inference
- [ ] Badges display correctly (CURRENT, UPCOMING, TODAY)
- [ ] Expand/collapse items
- [ ] Navigation from Dashboard
- [ ] Navigation from Profile
- [ ] Old `/absences` route redirects to `/timeline`
- [ ] Mobile view (iOS & Android)
- [ ] Web view
- [ ] Dark mode
- [ ] Analytics events firing

## Files Modified

1. `apps/frontend/app/(tabs)/timeline.tsx` (NEW)
2. `apps/frontend/app/(tabs)/_layout.tsx`
3. `apps/frontend/components/WebNavigationBar.tsx`
4. `apps/frontend/app/(tabs)/profile.tsx`
5. `apps/frontend/app/(tabs)/index.tsx`
6. `apps/frontend/app/(tabs)/absences.tsx` (redirect only)

## Files Backed Up

- `apps/frontend/app/(tabs)/absences.tsx.backup` (original implementation)
