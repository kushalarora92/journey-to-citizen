/**
 * App Version Configuration Types
 * For force update feature
 */

/**
 * Platform-specific store URLs
 */
export interface StoreUrls {
  ios: string;
  android: string;
  web?: string;
}

/**
 * App version configuration returned by the checkAppVersion function
 */
export interface AppVersionConfig {
  /** Minimum required version (semantic version e.g., "1.1.0") */
  minVersion: string;
  /** Current latest version available */
  currentVersion: string;
  /** Whether to force update (hard block) */
  forceUpdate: boolean;
  /** Optional message to display to users */
  updateMessage?: string;
  /** Store URLs for each platform */
  storeUrls: StoreUrls;
}

/**
 * Request payload for checkAppVersion function
 */
export interface CheckAppVersionRequest {
  /** Current app version (semantic version e.g., "1.0.0") */
  appVersion: string;
  /** Platform: 'ios' | 'android' | 'web' */
  platform: 'ios' | 'android' | 'web';
}

/**
 * Response from checkAppVersion function
 */
export interface CheckAppVersionResponse {
  /** Whether update is required */
  updateRequired: boolean;
  /** Whether this is a force update (blocks app usage) */
  forceUpdate: boolean;
  /** Message to display */
  message?: string;
  /** URL to the appropriate app store */
  storeUrl?: string;
  /** Current latest version */
  currentVersion: string;
}
