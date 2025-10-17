import { useState, useEffect } from 'react';
import { Platform, Dimensions } from 'react-native';

// Breakpoints for responsive design
export const BREAKPOINTS = {
  sm: 640,   // Small devices (phones)
  md: 768,   // Medium devices (tablets)
  lg: 1024,  // Large devices (laptops)
  xl: 1280,  // Extra large devices (desktops)
  '2xl': 1536, // 2X large devices (large desktops)
} as const;

/**
 * Hook to detect if screen width is above a certain breakpoint
 * @param breakpoint - The breakpoint to check (default: 'md' for 768px)
 * @returns boolean indicating if screen is at or above the breakpoint
 */
export function useIsDesktop(breakpoint: keyof typeof BREAKPOINTS = 'md'): boolean {
  const [isDesktop, setIsDesktop] = useState(() => {
    if (Platform.OS === 'web') {
      return Dimensions.get('window').width >= BREAKPOINTS[breakpoint];
    }
    return false;
  });

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const handleResize = () => {
      setIsDesktop(Dimensions.get('window').width >= BREAKPOINTS[breakpoint]);
    };

    const subscription = Dimensions.addEventListener('change', handleResize);
    return () => subscription?.remove();
  }, [breakpoint]);

  return isDesktop;
}

/**
 * Get current screen width
 * @returns number - Current window width
 */
export function getScreenWidth(): number {
  return Dimensions.get('window').width;
}

/**
 * Get current screen height
 * @returns number - Current window height
 */
export function getScreenHeight(): number {
  return Dimensions.get('window').height;
}

/**
 * Check if platform is web
 * @returns boolean
 */
export function isWeb(): boolean {
  return Platform.OS === 'web';
}

/**
 * Check if platform is iOS
 * @returns boolean
 */
export function isIOS(): boolean {
  return Platform.OS === 'ios';
}

/**
 * Check if platform is Android
 * @returns boolean
 */
export function isAndroid(): boolean {
  return Platform.OS === 'android';
}

/**
 * Check if platform is native (iOS or Android)
 * @returns boolean
 */
export function isNative(): boolean {
  return Platform.OS === 'ios' || Platform.OS === 'android';
}
