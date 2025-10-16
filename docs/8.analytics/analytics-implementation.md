# Firebase Analytics Implementation Guide

**Date:** January 15, 2025  
**Status:** ✅ Implemented  
**Platform:** ✅ Web + iOS + Android (Cross-platform)

---

## Overview

Firebase Analytics is integrated into the Journey to Citizen app to track user behavior, measure engagement, and inform product decisions. Analytics helps us understand:

- User acquisition and retention
- Feature adoption and usage patterns
- Conversion funnels (sign-up → profile setup → active usage)
- User drop-off points

**Cross-platform Support:**
- ✅ **Web**: Firebase JS SDK (`firebase/analytics`)
- ✅ **iOS**: React Native Firebase (`@react-native-firebase/analytics`)
- ✅ **Android**: React Native Firebase (`@react-native-firebase/analytics`)

---

## Implementation Details

### 1. Configuration

#### Web Configuration
**Location:** `apps/frontend/config/firebase.ts`

```typescript
import { getAnalytics, Analytics, isSupported } from 'firebase/analytics';

let analytics: Analytics | null = null;
if (Platform.OS === 'web') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}
```

#### Native Configuration
**Package:** `@react-native-firebase/analytics` (v23.4.1)

Native analytics is automatically initialized when the app starts. No additional configuration needed beyond installing the package.

**Environment Variables:**
```env
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID="YOUR_MEASUREMENT_ID"  # Web only - get from Firebase Console
```

**Key Features:**
- ✅ Works on all platforms (web, iOS, Android)
- ✅ Automatic crash reporting integration (native)
- ✅ Offline event queuing (native)
- ✅ Better performance tracking (native)
- ✅ Gracefully degrades if blocked (web)

---

### 2. Custom Hook: `useAnalytics` (Cross-platform)

**Location:** `apps/frontend/hooks/useAnalytics.ts`

A unified React hook that works on both web and native platforms:

```typescript
const { trackEvent, trackScreenView, setAnalyticsUserId, setAnalyticsUserProperties } = useAnalytics();
```

**Platform Detection:**
- **Web**: Uses Firebase JS SDK (`firebase/analytics`)
- **Native (iOS/Android)**: Uses React Native Firebase (`@react-native-firebase/analytics`)

**Methods:**

#### `trackEvent(eventName, params?)`
Track custom user actions:
```typescript
trackEvent('add_trip', {
  destination: 'USA',
  duration_days: 7,
});
```

#### `trackScreenView(screenName, params?)`
Track page/screen views:
```typescript
trackScreenView('Dashboard', {
  user_has_pr: true,
});
```

#### `setAnalyticsUserId(userId)`
Associate analytics data with a user:
```typescript
setAnalyticsUserId(user.uid);
```

#### `setAnalyticsUserProperties(properties)`
Set user attributes for segmentation:
```typescript
setAnalyticsUserProperties({
  immigration_status: 'permanent_resident',
  has_pr: true,
});
```

---

### 3. Automatic Screen Tracking

**Hook:** `useScreenTracking(screenName)`

Automatically tracks screen views when components mount:

```typescript
export default function DashboardScreen() {
  useScreenTracking('Dashboard');
  
  return <View>...</View>;
}
```

---

## Tracked Events

### Automatic Events (Firebase Default)
- `page_view` - Every screen/page visit
- `first_visit` - User's first app visit
- `session_start` - Beginning of user session
- `user_engagement` - Active usage time

### Custom Events

| Event Name | Description | Parameters | Location |
|------------|-------------|------------|----------|
| `sign_up` | User creates account | `method: 'email'` | AuthContext |
| `login` | User signs in | `method: 'email'` | AuthContext |
| `profile_complete` | User completes profile setup | `immigration_status`, `has_pr` | profile-setup.tsx (TODO) |
| `add_trip` | User adds travel absence | `destination`, `duration_days` | absences.tsx (TODO) |
| `add_presence` | User adds pre-PR presence | `purpose`, `duration_days` | profile.tsx (TODO) |
| `view_eligibility` | User checks eligibility date | `days_remaining` | Dashboard (TODO) |

---

## Screen Tracking

| Screen Name | File | Status |
|-------------|------|--------|
| Profile Setup | `app/profile-setup.tsx` | ✅ Implemented |
| Dashboard | `app/(tabs)/index.tsx` | 📝 TODO |
| Travel Absences | `app/(tabs)/absences.tsx` | 📝 TODO |
| Profile | `app/(tabs)/profile.tsx` | 📝 TODO |
| Sign In | `app/auth/sign-in.tsx` | 📝 TODO |
| Sign Up | `app/auth/sign-up.tsx` | 📝 TODO |
| Verify Email | `app/auth/verify-email.tsx` | 📝 TODO |

---

## User Properties

User properties help segment analytics data:

| Property | Type | Description | Example |
|----------|------|-------------|---------|
| `immigration_status` | string | Current status | `'permanent_resident'` |
| `has_pr` | boolean | Has PR or not | `true` |
| `profile_complete` | boolean | Profile setup done | `true` |
| `total_trips` | number | Number of trips logged | `5` |
| `has_pre_pr_presence` | boolean | Pre-PR time tracked | `false` |

---

## Firebase Console

**Access:** [Firebase Console - Analytics](https://console.firebase.google.com/project/journey-to-citizen/analytics)

### Key Reports

1. **Events** - View all tracked events
2. **Conversions** - Track sign-up → profile setup funnel
3. **User Properties** - Segment users by status
4. **Retention** - Track daily/weekly active users
5. **Demographics** - User location, language, device

---

## Privacy & Compliance

### Data Collection
- ✅ Anonymous by default
- ✅ User ID set only after authentication
- ✅ No PII (Personally Identifiable Information) tracked
- ✅ Respects ad blockers and privacy settings

### GDPR/CCPA Compliance
- Analytics can be disabled by users (via browser settings)
- Data retention: 14 months (Firebase default)
- No tracking of sensitive data (travel dates, destinations stored separately)

---

## Testing

### Verify Analytics in Development

1. **Enable Debug Mode (Chrome):**
   ```bash
   # Install Chrome extension: Google Analytics Debugger
   # Or add query parameter:
   https://localhost:8081?debug_analytics=1
   ```

2. **View Events in Real-time:**
   - Open Firebase Console → Analytics → DebugView
   - Perform actions in the app
   - See events appear in real-time

3. **Check Console Logs:**
   ```
   ✓ Firebase Analytics initialized
   ```

### Test Key Flows

- ✅ Sign up → Check `sign_up` event
- ✅ Login → Check `login` event
- ✅ Profile setup → Check `page_view` for "Profile Setup"
- ✅ Add trip → Check `add_trip` event (TODO)

---

## Troubleshooting

### Analytics Not Working?

**Issue:** Events not appearing in Firebase Console

**Possible Causes:**
1. **Ad Blocker** - Disable ad blockers or privacy extensions
2. **Browser Privacy Mode** - Analytics disabled in incognito/private mode
3. **Wrong Environment** - Check `EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID` is set
4. **Platform Check** - Analytics only works on web, not native

**Debug Steps:**
```typescript
// Check if analytics is initialized
import { analytics } from '@/config/firebase';
console.log('Analytics:', analytics); // Should not be null
```

### Common Errors

**Error:** `"analyticsIsSupported is not a function"`
- **Fix:** Update firebase to v9.0.0+

**Error:** `"Analytics instance not initialized"`
- **Fix:** Check Platform.OS === 'web' and analytics support

---

## Next Steps

### Phase 1: Complete Event Tracking (Week 1)
- [ ] Add `trackEvent` to all user actions
- [ ] Add `useScreenTracking` to remaining screens
- [ ] Set user properties after profile setup
- [ ] Test all events in Firebase Console

### Phase 2: Conversion Funnels (Week 2)
- [ ] Mark key events as conversions in Firebase
- [ ] Set up funnel: Sign up → Verify Email → Profile Setup → Add First Trip
- [ ] Monitor drop-off rates

### Phase 3: Advanced Analytics (Month 1)
- [ ] Implement custom dashboards
- [ ] Set up automated reports (weekly email)
- [ ] A/B testing integration (Firebase Remote Config)
- [ ] Predictive analytics (churn prediction)

---

## Resources

- [Firebase Analytics Documentation](https://firebase.google.com/docs/analytics)
- [Firebase Analytics Events Reference](https://firebase.google.com/docs/reference/js/analytics)
- [Google Analytics 4 Best Practices](https://support.google.com/analytics/answer/9267735)

---

## Maintenance

**Owner:** Development Team  
**Review:** Monthly  
**Last Updated:** January 15, 2025  

### Monthly Checklist
- [ ] Review most popular features
- [ ] Check conversion rates
- [ ] Identify and fix drop-off points
- [ ] Update event tracking as features evolve
