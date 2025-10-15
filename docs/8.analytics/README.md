# Analytics Implementation Summary

Complete overview of Firebase Analytics integration for Journey to Citizen app.

---

## ✅ What's Implemented

### Cross-Platform Analytics
- **Web:** Firebase JS SDK (`firebase@12.3.0`)
- **iOS:** React Native Firebase (`@react-native-firebase/analytics@23.4.1`)
- **Android:** React Native Firebase (`@react-native-firebase/analytics@23.4.1`)

### Core Features
1. **Screen Tracking:** Automatic page/screen view tracking
2. **Event Tracking:** Custom events across all user interactions
3. **User Tracking:** User ID and properties on authentication
4. **Platform Detection:** Automatic platform identification (web/ios/android)

### Screens with Analytics
- ✅ Dashboard (`/(tabs)/index.tsx`)
- ✅ Travel Absences (`/(tabs)/absences.tsx`)
- ✅ Profile (`/(tabs)/profile.tsx`)
- ✅ Profile Setup (`/profile-setup.tsx`)
- ✅ Authentication flows (via `AuthContext`)
- ✅ Navigation (tabs and web nav bar)

---

## 📊 Event Categories

### 1. Authentication Events (3 events)
- `sign_up`
- `login`
- User ID tracking

### 2. Navigation Events (3 events)
- `header_logo_click`
- `navigation_click`
- `logout_button_click`

### 3. Dashboard Events (13 events)
- Screen tracking
- Greeting section click
- Email verification warning click
- Eligibility status card click
- Progress card click
- 3× Stat card clicks (Days as PR, Pre-PR Credit, Absence Days)
- Calculation card click
- Upcoming trips alert
- Complete profile button
- 2× Quick actions
- Disclaimer click

### 4. Travel Absences Events (13+ events)
- Screen tracking
- Important Rules click
- 4× Filter buttons (Past/Current/Upcoming/Total)
- Tip section click
- Add trip: attempt, success, error, cancelled, confirmed despite overlap
- Edit trip: attempt, success, error
- Delete trip: attempt, success, error

### 5. Profile Events (25+ events)
- Screen tracking
- Name edit: click, attempt, success, error
- Immigration status edit: attempt, success, error
- PR date edit: click, attempt, success, error
- Presence entries: add/edit/delete (attempt, success, error, cancelled, confirmed)
- 2× Helper text clicks

**Total: 54+ unique tracked interactions**

---

## 🎯 Platform Tracking

### Automatic Platform Parameters
Every event includes:
```typescript
{
  platform: 'web' | 'ios' | 'android',
  platform_version: string,
  // ... your custom params
}
```

### Firebase Console Filtering
You can filter events by:
1. **Built-in:** Platform dimension (iOS/Android/Web)
2. **Custom:** `platform` parameter
3. **Custom:** `platform_version` parameter

### Example Usage
```
Firebase Console → Analytics → Events → absences_action
└─ Filter by platform = 'ios'
   Shows: Only iOS users' trip management events
```

---

## 📁 File Structure

```
apps/frontend/
├── hooks/
│   └── useAnalytics.ts              # Main hook (cross-platform)
├── context/
│   └── AuthContext.tsx              # Auth events
├── components/
│   └── WebNavigationBar.tsx         # Web nav tracking
├── app/
│   ├── (tabs)/
│   │   ├── _layout.tsx              # Tab nav tracking
│   │   ├── index.tsx                # Dashboard events
│   │   ├── absences.tsx             # Travel events
│   │   └── profile.tsx              # Profile events
│   └── profile-setup.tsx            # Setup screen tracking
└── config/
    └── firebase.ts                  # Analytics init (web)
```

---

## 🔧 Key Files

### `useAnalytics.ts` - Core Hook
```typescript
export const useAnalytics = () => {
  trackEvent(eventName, params)      // Log custom event
  trackScreenView(screenName)        // Log screen view
  setAnalyticsUserId(userId)         // Set user ID
  setAnalyticsUserProperties(props)  // Set user properties
}

export const useScreenTracking = (screenName) => {
  // Automatically tracks screen on mount
}
```

### Event Naming Convention
```
{category}_{subcategory}
  └─ dashboard_action
  └─ absences_action
  └─ profile_action
  └─ header_logo_click
  └─ navigation_click
```

### Action Parameter Pattern
```typescript
trackEvent('category_name', {
  action: 'specific_action',  // What happened
  ...additionalContext,       // Why/how/what
});
```

---

## 🚀 Usage Examples

### Track Screen View
```typescript
import { useScreenTracking } from '@/hooks/useAnalytics';

function MyScreen() {
  useScreenTracking('My Screen Name');
  // That's it! Auto-tracked on mount
}
```

### Track Button Click
```typescript
import { useAnalytics } from '@/hooks/useAnalytics';

function MyComponent() {
  const { trackEvent } = useAnalytics();
  
  const handleClick = () => {
    trackEvent('button_click', {
      button_name: 'submit',
      has_data: true,
    });
  };
}
```

### Track Feature Usage
```typescript
const handleSave = async () => {
  trackEvent('feature_action', { action: 'save_attempt' });
  
  try {
    await saveData();
    trackEvent('feature_action', { action: 'save_success' });
  } catch (error) {
    trackEvent('feature_action', { 
      action: 'save_error',
      error: error.message,
    });
  }
};
```

---

## 📊 Testing

### Enable Debug Mode

**Web:**
```
Add to URL: ?analytics_debug=true
Or use: Chrome extension "Google Analytics Debugger"
```

**iOS:**
```bash
# Add to Xcode scheme arguments
-FIRDebugEnabled
```

**Android:**
```bash
adb shell setprop debug.firebase.analytics.app com.kushalarora.journeytocitizen
```

### View Debug Events
1. Firebase Console → Analytics → DebugView
2. Select your device/browser
3. Perform actions in app
4. See real-time events with parameters

### Test Checklist
- [ ] Sign up flow (track `sign_up`, user ID set)
- [ ] Login flow (track `login`)
- [ ] Navigate between tabs (track `navigation_click`)
- [ ] Add travel absence (track all add events)
- [ ] Edit profile (track all edit events)
- [ ] Check platform parameter in all events
- [ ] Verify events appear in Firebase Console

---

## 📈 Key Metrics to Monitor

### User Engagement
- **Screen views per session:** How many screens do users visit?
- **Session duration:** How long do users stay?
- **Feature usage:** Which features are most used?

### Conversion Funnels
```
1. Sign up → Profile Setup → Dashboard
   └─ Track drop-off rates

2. Dashboard → Add Trip → Success
   └─ Track completion rates

3. Incomplete Profile → Edit Profile → Complete
   └─ Track profile completion
```

### Platform Comparison
- **Active users by platform:** Which platform is most popular?
- **Feature adoption by platform:** Do mobile users behave differently?
- **Error rates by platform:** Which platform has most issues?

### Error Tracking
- **Count of *_error events:** How many errors occur?
- **Error types:** What are common failure points?
- **Platform-specific errors:** Do certain platforms fail more?

---

## 🎓 Best Practices

### 1. Consistent Naming
✅ **Do:**
```typescript
trackEvent('dashboard_action', { action: 'button_click' })
trackEvent('absences_action', { action: 'add_trip_success' })
```

❌ **Don't:**
```typescript
trackEvent('dashboardButtonClick')
trackEvent('AddTripSuccess')
```

### 2. Meaningful Parameters
✅ **Do:**
```typescript
trackEvent('add_trip_success', {
  has_destination: true,
  trip_duration_days: 5,
  is_future_trip: false,
})
```

❌ **Don't:**
```typescript
trackEvent('add_trip_success') // No context
```

### 3. Track Outcomes, Not Just Attempts
✅ **Do:**
```typescript
// Track attempt
trackEvent('feature_action', { action: 'attempt' });

// Track result
if (success) {
  trackEvent('feature_action', { action: 'success' });
} else {
  trackEvent('feature_action', { action: 'error', error: message });
}
```

### 4. Add Context
✅ **Do:**
```typescript
trackEvent('stat_card_click', {
  stat_type: 'days_as_pr',
  value: 450,
  is_eligible: false,
})
```

### 5. Keep Parameters Simple
- Use primitives: strings, numbers, booleans
- Avoid nested objects (Firebase flattens them)
- Limit to 25 parameters per event
- Keep parameter names short (< 40 chars)

---

## 📚 Documentation

1. **[analytics-implementation.md](./1. analytics-implementation.md)**
   - Full implementation guide
   - Setup instructions
   - Code examples

2. **[analytics-events.md](./2. analytics-events.md)**
   - Implementation status checklist
   - What's tracked, what's not

3. **[analytics-events-reference.md](./3. analytics-events-reference.md)**
   - Complete event catalog
   - All parameters documented
   - Testing instructions

4. **[platform-tracking-guide.md](./4. platform-tracking-guide.md)**
   - Cross-platform details
   - Platform filtering in Firebase
   - Platform-specific testing

5. **[quick-start.md](./quick-start.md)**
   - Quick reference for developers
   - Common patterns
   - Troubleshooting

---

## ✅ Ready to Deploy

### Pre-deployment Checklist
- [x] Analytics installed (web + native)
- [x] Environment variables configured
- [x] All screens tracked
- [x] All interactions tracked
- [x] Platform detection working
- [x] Cross-platform tested
- [x] Documentation complete

### Post-deployment Tasks
1. **Enable Analytics in Firebase Console**
   - Verify data is flowing
   - Set up custom reports
   - Create conversion funnels

2. **Monitor First 48 Hours**
   - Check event volumes
   - Verify platform distribution
   - Watch for errors

3. **Set Up Alerts**
   - High error rates
   - Drop in active users
   - Platform-specific issues

4. **Create Dashboards**
   - Weekly active users
   - Feature adoption rates
   - Conversion funnels

---

## 🎉 What You Can Do Now

### In Firebase Console
1. **See real-time user activity** (DebugView)
2. **Filter events by platform** (iOS, Android, Web)
3. **Track conversion funnels** (sign up → profile → active usage)
4. **Monitor feature adoption** (who's using travel absences?)
5. **Identify drop-off points** (where do users leave?)
6. **Compare platform behavior** (iOS vs Android vs Web)
7. **Debug issues** (error events with context)
8. **Understand user journey** (screen flow, session duration)

### Data-Driven Decisions
- **"iOS users add more trips"** → Optimize mobile UX
- **"50% drop-off at profile setup"** → Simplify onboarding
- **"Web users click calculation card 3x more"** → Add expandable details
- **"Android has 2x error rate"** → Investigate platform-specific issues

---

## 🔮 Future Enhancements (Not Implemented Yet)

### Phase 2: Error Monitoring
- [ ] Integrate Sentry for detailed error tracking
- [ ] Add performance monitoring
- [ ] Set up crash reporting

### Phase 3: Advanced Analytics
- [ ] A/B testing framework
- [ ] User segmentation
- [ ] Cohort analysis

### Phase 4: Business Intelligence
- [ ] Export to BigQuery
- [ ] Custom ML models
- [ ] Predictive analytics

---

## 🆘 Troubleshooting

### Events not showing in Firebase Console
1. Wait 24 hours for data processing
2. Check DebugView for real-time events
3. Verify environment variables set
4. Check browser console for errors (web)
5. Check device logs (iOS/Android)

### Platform not detected
- Check `Platform.OS` in code
- Verify `platform` parameter in events
- Ensure Firebase SDK initialized correctly

### Web analytics not working
- Check if analytics blocked by ad blocker
- Verify `EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID` set
- Check `isSupported()` returns true

### Mobile analytics not working (iOS/Android)
- Verify `google-services.json` / `GoogleService-Info.plist` present
- Run `npx pod-install` (iOS)
- Rebuild app after adding Firebase config
- Check device/simulator logs

---

## 📞 Support

For questions or issues:
1. Check documentation in `docs/8.analytics/`
2. Review Firebase Console documentation
3. Check React Native Firebase docs: https://rnfirebase.io
4. Review implementation in codebase

---

**Status:** ✅ Fully Implemented and Ready for Production

**Last Updated:** January 7, 2025

**Version:** 1.0.0
