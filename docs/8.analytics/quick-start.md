# Analytics Quick Start

## ✅ What's Implemented

Firebase Analytics is now **fully cross-platform**:
- ✅ **Web** - Firebase JS SDK
- ✅ **iOS** - React Native Firebase
- ✅ **Android** - React Native Firebase

## 📦 Packages Installed

```json
{
  "firebase": "^12.3.0",  // Web analytics
  "@react-native-firebase/analytics": "^23.4.1"  // Native analytics
}
```

## 🚀 How to Use

### Track Events

```typescript
import { useAnalytics } from '@/hooks/useAnalytics';

const { trackEvent } = useAnalytics();

// Track user action
trackEvent('add_trip', {
  destination: 'USA',
  duration_days: 7,
});
```

### Track Screen Views

```typescript
import { useScreenTracking } from '@/hooks/useAnalytics';

export default function DashboardScreen() {
  useScreenTracking('Dashboard');  // Auto-tracks on mount
  
  return <View>...</View>;
}
```

### Set User Properties

```typescript
const { setAnalyticsUserProperties } = useAnalytics();

setAnalyticsUserProperties({
  immigration_status: 'permanent_resident',
  has_pr: true,
});
```

## 📊 Currently Tracked

- ✅ Sign ups (`sign_up` event)
- ✅ Logins (`login` event)
- ✅ Profile Setup screen views
- ✅ User IDs (after authentication)

## 📝 Next Steps

### Add to Remaining Screens

```typescript
// app/(tabs)/index.tsx
useScreenTracking('Dashboard');

// app/(tabs)/absences.tsx
useScreenTracking('Travel Absences');
trackEvent('add_trip', { destination, duration_days });

// app/(tabs)/profile.tsx
useScreenTracking('Profile');
trackEvent('add_presence', { purpose, duration_days });
```

## 🔍 View Analytics

- **Firebase Console**: https://console.firebase.google.com/project/journey-to-citizen/analytics
- **DebugView**: Real-time event monitoring (development)
- **Events**: All tracked events and parameters
- **Users**: Active users, retention, demographics

## 🛠️ Testing

### Web
```bash
# Enable debug mode
https://localhost:8081?debug_analytics=1

# Check console
✓ Firebase Analytics initialized
```

### Native (iOS/Android)
Analytics automatically enabled. View events in:
- Firebase Console → Analytics → DebugView
- Enable debug mode: [See native docs]

## 📚 Full Documentation

See `docs/8.analytics/analytics-implementation.md` for:
- Complete event tracking guide
- User properties reference
- Privacy & compliance
- Troubleshooting
- Advanced features
