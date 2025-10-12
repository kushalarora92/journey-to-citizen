# Bug Fix: Date Picker Closes Immediately After Each Selection (iOS)

**Date:** October 11, 2025  
**Issue:** Date picker UX problem on iOS  
**Severity:** Medium - UX annoyance  
**Status:** ✅ Fixed

---

## Problem Description

On iOS, when using the date picker in spinner mode, the picker would close immediately after changing any single component (month, day, or year). This created a frustrating user experience where users had to:

1. Tap to open the picker
2. Change the month → picker closes
3. Tap to reopen the picker
4. Change the day → picker closes
5. Tap to reopen the picker
6. Change the year → picker closes

This resulted in **3-6 taps** to select a complete date, making the experience tedious.

---

## Root Cause

React Native's `DateTimePicker` component behaves differently across platforms:

### iOS (spinner mode):
- The `onChange` event fires **continuously** as the user scrolls through values
- When `event.type === 'set'`, our code was immediately closing the picker
- This is different from native iOS behavior, where pickers typically stay open until a "Done" button is pressed

### Android (default calendar):
- The `onChange` event fires **once** when the user confirms the selection
- The picker is modal and closes automatically after selection
- This is the expected behavior on Android

### Web:
- Uses browser's native date input
- No spinner involved

---

## Solution

Implemented **platform-specific behavior** to match native expectations:

### iOS:
1. **Keep picker open** while user adjusts date components
2. **Add "Done" button** to close the picker when finished
3. **Update state immediately** as user scrolls (live preview)

```typescript
onChange={(event, date) => {
  if (Platform.OS === 'ios') {
    // On iOS, update state but keep picker open
    if (date) setFromDate(date);
  } else {
    // On Android, close after selection
    if (event.type === 'set' && date) {
      setFromDate(date);
      setShowFromPicker(false);
    } else if (event.type === 'dismissed') {
      setShowFromPicker(false);
    }
  }
}}

{/* iOS-specific Done button */}
{Platform.OS === 'ios' && (
  <Button onPress={() => setShowFromPicker(false)}>
    <ButtonText>Done</ButtonText>
  </Button>
)}
```

### Android:
- Kept existing behavior (close immediately after selection)
- No Done button needed (picker is modal)

---

## Files Modified

1. **`apps/frontend/components/DateRangeList.tsx`**
   - Updated "From Date" picker with iOS Done button
   - Updated "To Date" picker with iOS Done button
   
2. **`apps/frontend/app/(tabs)/two.tsx`**
   - Updated PR date picker with iOS Done button

---

## User Experience After Fix

### iOS:
```
1. Tap date field
2. Scroll to change month ✅
3. Scroll to change day ✅
4. Scroll to change year ✅
5. Tap "Done" button ✅
```

**Result:** Only **2 taps** total (open + done) instead of 3-6 taps

### Android:
- No change (already worked well)

---

## Testing Checklist

- [x] iOS: Date picker stays open while scrolling
- [x] iOS: Done button appears and closes picker
- [x] iOS: Date updates live as you scroll
- [x] Android: Picker closes after selection (existing behavior)
- [x] Travel absences: From and To date pickers work correctly
- [x] Pre-PR presence: Date pickers work correctly
- [x] Profile: PR date picker works correctly
- [x] TypeScript compilation passes

---

## Technical Notes

### Why iOS Behaves This Way

The `@react-native-community/datetimepicker` component wraps native pickers:
- **iOS:** Uses `UIDatePicker` in spinner mode
- **Android:** Uses native Material date picker dialog

The iOS `UIDatePicker` is designed to be embedded in a view with explicit confirmation, while Android's picker is modal with built-in confirmation. Our fix aligns React Native behavior with these platform conventions.

### Alternative Solutions Considered

1. **Use `inline` mode on iOS 14+**
   - Shows calendar view instead of spinner
   - Different UX from spinner, less compact
   - Not chosen: Users might prefer the traditional spinner

2. **Custom modal with confirm/cancel**
   - More control over UX
   - More code to maintain
   - Not chosen: Platform-native behavior is simpler and more familiar

3. **Use web-style date input**
   - Would work cross-platform
   - Not chosen: Doesn't feel native on mobile

---

## Impact

- ✅ Improved UX on iOS (fewer taps required)
- ✅ Matches native iOS date picker behavior
- ✅ No impact on Android (already worked well)
- ✅ No breaking changes

---

## Related Issues

- This is a common issue with React Native date pickers
- Similar to native iOS calendar/reminder apps that have "Done" buttons
- Follows iOS Human Interface Guidelines for picker components
