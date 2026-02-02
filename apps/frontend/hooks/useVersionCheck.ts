import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { APP_VERSION_CONFIG } from '@/config/appVersion';

interface UseVersionCheckResult {
  /** Whether version check is in progress */
  loading: boolean;
  /** Whether an update is required */
  updateRequired: boolean;
  /** Whether this is a force update (blocks app) */
  forceUpdate: boolean;
  /** Message to display to user */
  message?: string;
  /** URL to the app store */
  storeUrl?: string;
  /** Current app version */
  currentVersion: string;
  /** Minimum required version */
  minVersion: string;
}

/**
 * Get the current app version from expo-constants
 */
function getAppVersion(): string {
  const version =
    Constants.expoConfig?.version ||
    (Constants.manifest as any)?.version ||
    Constants.manifest2?.extra?.expoClient?.version ||
    '1.0.0';
  return version;
}

/**
 * Compare two semantic versions
 * @returns -1 if v1 < v2, 0 if equal, 1 if v1 > v2
 */
function compareVersions(version1: string, version2: string): number {
  const v1Parts = version1.split('.').map(Number);
  const v2Parts = version2.split('.').map(Number);

  const maxLength = Math.max(v1Parts.length, v2Parts.length);
  while (v1Parts.length < maxLength) v1Parts.push(0);
  while (v2Parts.length < maxLength) v2Parts.push(0);

  for (let i = 0; i < maxLength; i++) {
    if (v1Parts[i] < v2Parts[i]) return -1;
    if (v1Parts[i] > v2Parts[i]) return 1;
  }

  return 0;
}

/**
 * Hook to check if the app version requires an update.
 * 
 * This uses locally bundled config (no network call).
 * Config is updated via OTA updates when needed.
 */
export function useVersionCheck(): UseVersionCheckResult {
  const [state, setState] = useState<UseVersionCheckResult>({
    loading: true,
    updateRequired: false,
    forceUpdate: false,
    currentVersion: '1.0.0',
    minVersion: APP_VERSION_CONFIG.minVersion,
  });

  useEffect(() => {
    // Web doesn't need version checks (always latest)
    if (Platform.OS === 'web') {
      setState({
        loading: false,
        updateRequired: false,
        forceUpdate: false,
        currentVersion: getAppVersion(),
        minVersion: APP_VERSION_CONFIG.minVersion,
      });
      return;
    }

    const appVersion = getAppVersion();
    const { minVersion, forceUpdate, updateMessage, storeUrls } = APP_VERSION_CONFIG;
    const platform = Platform.OS as 'ios' | 'android';

    // Compare versions
    const comparison = compareVersions(appVersion, minVersion);
    const updateRequired = comparison < 0;

    console.log(`Version check: app=${appVersion}, min=${minVersion}, updateRequired=${updateRequired}`);

    setState({
      loading: false,
      updateRequired,
      forceUpdate: updateRequired && forceUpdate,
      message: updateRequired ? updateMessage : undefined,
      storeUrl: storeUrls[platform],
      currentVersion: appVersion,
      minVersion,
    });
  }, []);

  return state;
}

export default useVersionCheck;
