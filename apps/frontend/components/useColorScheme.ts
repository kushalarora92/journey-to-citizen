// Force light mode for MVP launch
// TODO: Re-enable dark mode support by uncommenting line below
// export { useColorScheme } from 'react-native';
export function useColorScheme() {
  return 'light' as 'light' | 'dark';
}
