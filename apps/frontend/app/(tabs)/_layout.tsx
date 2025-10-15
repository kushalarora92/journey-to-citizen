import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs, usePathname, useRouter } from 'expo-router';
import { Pressable, Alert, Platform, Image, TouchableOpacity } from 'react-native';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import { useAuth } from '@/context/AuthContext';
import { useAnalytics } from '@/hooks/useAnalytics';
import WebNavigationBar from '@/components/WebNavigationBar';

// You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}

// Custom header logo component for headerLeft
function HeaderLogo() {
  const router = useRouter();
  const pathname = usePathname();
  const { trackEvent } = useAnalytics();
  
  const handleLogoPress = () => {
    trackEvent('header_logo_click', {
      current_tab: pathname,
    });
    router.push('/(tabs)');
  };
  
  return (
    <TouchableOpacity onPress={handleLogoPress}>
      <Image
        source={require('../../assets/images/logo.png')}
        style={{ width: 70, height: 40 }}
        resizeMode="contain"
      />
    </TouchableOpacity>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { logout } = useAuth();
  const pathname = usePathname();
  const { trackEvent } = useAnalytics();

  const handleLogout = () => {
    trackEvent('logout_button_click', {
      current_tab: pathname,
    });
    
    if (Platform.OS === 'web') {
      // Use window.confirm for web
      if (window.confirm('Are you sure you want to logout?')) {
        logout().catch(() => {
          alert('Failed to logout');
        });
      }
    } else {
      // Use Alert.alert for mobile
      Alert.alert(
        'Logout',
        'Are you sure you want to logout?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Logout', 
            style: 'destructive',
            onPress: async () => {
              try {
                await logout();
              } catch (error) {
                Alert.alert('Error', 'Failed to logout');
              }
            }
          },
        ]
      );
    }
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        // Disable the static render of the header on web
        // to prevent a hydration error in React Navigation v6.
        headerShown: useClientOnlyValue(false, true),
        headerTitleAlign: 'center',
        // Hide tab bar on web (navigation is in header instead)
        // Add subtle shadow/elevation to bottom tabs on native
        tabBarStyle: Platform.OS === 'web' 
          ? { display: 'none' } 
          : {
              shadowColor: Colors[colorScheme ?? 'light'].text,
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: 0.1,
              shadowRadius: 3,
              elevation: 8,
              borderTopWidth: 0,
            },
        
        // Show logo on left side of header on native
        headerLeft: () => <HeaderLogo />,
        // Custom header title component for web (shows navigation)
        headerTitle: Platform.OS === 'web' ? () => <WebNavigationBar /> : undefined,

        // Add logout button on right side of header
        headerRight: () => (
            <Pressable onPress={handleLogout}>
              {({ pressed }) => (
                <FontAwesome
                  name="sign-out"
                  size={25}
                  color={Colors[colorScheme ?? 'light'].text}
                  style={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }}
                />
              )}
            </Pressable>
          ),
        // Add subtle shadow/elevation to header
        headerStyle: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 3,
          elevation: 4,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="absences"
        options={{
          title: 'Travel',
          tabBarIcon: ({ color }) => <TabBarIcon name="plane" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color} />,
        }}
        />
      </Tabs>
  );
}
