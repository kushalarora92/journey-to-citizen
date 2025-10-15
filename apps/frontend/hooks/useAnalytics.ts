import { useEffect } from 'react';
import { Platform } from 'react-native';

// Web analytics (Firebase JS SDK)
import { logEvent as webLogEvent, setUserId as webSetUserId, setUserProperties as webSetUserProperties } from 'firebase/analytics';
import { analytics as webAnalytics } from '@/config/firebase';

// Native analytics (React Native Firebase)
let nativeAnalytics: any = null;
if (Platform.OS !== 'web') {
  try {
    nativeAnalytics = require('@react-native-firebase/analytics').default();
  } catch (e) {
    console.log('Native analytics not available');
  }
}

/**
 * Custom hook for Firebase Analytics (Cross-platform)
 * 
 * Provides methods to track user events, screen views, and user properties
 * Works on both web (Firebase JS SDK) and native (React Native Firebase)
 */
export const useAnalytics = () => {
  /**
   * Track a custom event
   * @param eventName - Name of the event (e.g., 'sign_up', 'add_trip')
   * @param params - Optional parameters for the event
   */
  const trackEvent = (eventName: string, params?: Record<string, any>) => {
    try {
      // Add platform information to all events for easier filtering in Firebase Console
      const enrichedParams = {
        ...params,
        platform: Platform.OS, // 'web', 'ios', or 'android'
        platform_version: Platform.Version?.toString() || 'unknown',
      };

      if (Platform.OS === 'web' && webAnalytics) {
        webLogEvent(webAnalytics, eventName, enrichedParams);
      } else if (nativeAnalytics) {
        nativeAnalytics.logEvent(eventName, enrichedParams);
      }
    } catch (error) {
      console.error('Analytics trackEvent error:', error);
    }
  };

  /**
   * Track a screen/page view
   * @param screenName - Name of the screen/page
   * @param params - Optional additional parameters
   */
  const trackScreenView = (screenName: string, params?: Record<string, any>) => {
    try {
      // Add platform information to screen views
      const enrichedParams = {
        ...params,
        platform: Platform.OS,
        platform_version: Platform.Version?.toString() || 'unknown',
      };

      if (Platform.OS === 'web' && webAnalytics) {
        webLogEvent(webAnalytics, 'page_view', {
          page_title: screenName,
          page_location: window.location.href,
          page_path: window.location.pathname,
          ...enrichedParams,
        });
      } else if (nativeAnalytics) {
        nativeAnalytics.logScreenView({
          screen_name: screenName,
          screen_class: screenName,
          ...enrichedParams,
        });
      }
    } catch (error) {
      console.error('Analytics trackScreenView error:', error);
    }
  };

  /**
   * Set user ID for analytics
   * @param userId - Unique user identifier (Firebase Auth UID)
   */
  const setAnalyticsUserId = async (userId: string | null) => {
    try {
      if (Platform.OS === 'web' && webAnalytics) {
        webSetUserId(webAnalytics, userId);
      } else if (nativeAnalytics) {
        await nativeAnalytics.setUserId(userId);
      }
    } catch (error) {
      console.error('Analytics setUserId error:', error);
    }
  };

  /**
   * Set user properties for analytics
   * @param properties - Key-value pairs of user properties
   */
  const setAnalyticsUserProperties = async (properties: Record<string, any>) => {
    try {
      if (Platform.OS === 'web' && webAnalytics) {
        webSetUserProperties(webAnalytics, properties);
      } else if (nativeAnalytics) {
        // Native: Set properties one by one
        for (const [key, value] of Object.entries(properties)) {
          await nativeAnalytics.setUserProperty(key, String(value));
        }
      }
    } catch (error) {
      console.error('Analytics setUserProperties error:', error);
    }
  };

  return {
    trackEvent,
    trackScreenView,
    setAnalyticsUserId,
    setAnalyticsUserProperties,
  };
};

/**
 * Hook to automatically track screen views
 * @param screenName - Name of the current screen
 */
export const useScreenTracking = (screenName: string) => {
  const { trackScreenView } = useAnalytics();

  useEffect(() => {
    trackScreenView(screenName);
  }, [screenName]);
};
