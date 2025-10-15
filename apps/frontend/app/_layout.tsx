import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StatusBar, StyleSheet } from 'react-native';
import 'react-native-reanimated';
import { GluestackUIProvider, View } from '@gluestack-ui/themed';
import { config } from '../gluestack-ui.config';

import { useColorScheme } from '@/components/useColorScheme';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import Colors from '@/constants/Colors';
import WebContainer from '@/components/WebContainer';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { user, loading, needsProfileSetup, profileLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading || profileLoading) return;

    const inAuthGroup = segments[0] === 'auth';
    const inVerifyEmailScreen = segments[1] === 'verify-email';
    const inProfileSetupScreen = segments[0] === 'profile-setup';

    if (!user && !inAuthGroup) {
      // Redirect to sign-in if user is not authenticated
      router.replace('/auth/sign-in' as any);
    } else if (user && !user.emailVerified) {
      // Redirect to verify-email if user is not verified (unless already there)
      if (!inVerifyEmailScreen) {
        router.replace('/auth/verify-email' as any);
      }
    } else if (user && user.emailVerified && needsProfileSetup) {
      // Redirect to profile setup if user needs to complete profile
      if (!inProfileSetupScreen) {
        router.replace('/profile-setup' as any);
      }
    } else if (user && user.emailVerified && !needsProfileSetup && (inAuthGroup || inProfileSetupScreen)) {
      // Redirect to tabs if user is authenticated, verified, and has completed profile
      router.replace('/(tabs)');
    }
  }, [user, loading, needsProfileSetup, profileLoading, segments]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <View style={[styles.rootContainer, { backgroundColor: Colors[colorScheme].background }]}>
        <WebContainer>
          <Stack>
            <Stack.Screen name="auth" options={{ headerShown: false }} />
            <Stack.Screen name="profile-setup" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
          </Stack>
        </WebContainer>
      </View>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <GluestackUIProvider config={config} colorMode={colorScheme === 'dark' ? 'dark' : 'light'}>
      <StatusBar 
        barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} 
        backgroundColor={Colors[colorScheme].background}
      />
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </GluestackUIProvider>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
  },
});
