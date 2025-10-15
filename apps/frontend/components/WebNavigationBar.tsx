import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Text } from '@gluestack-ui/themed';
import FontAwesome from '@expo/vector-icons/FontAwesome';

interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentProps<typeof FontAwesome>['name'];
}

const navItems: NavItem[] = [
  { path: '/(tabs)', label: 'Dashboard', icon: 'home' },
  { path: '/(tabs)/absences', label: 'Travel', icon: 'plane' },
  { path: '/(tabs)/profile', label: 'Profile', icon: 'user' },
];

/**
 * WebNavigationBar - Top navigation bar for web platform
 * 
 * Displays horizontal navigation links in the header center position.
 * Only used on web - native apps use bottom tabs.
 */
export default function WebNavigationBar() {
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (path: string) => {
    // Exact match for dashboard (root)
    if (path === '/(tabs)') {
      return pathname === '/' || pathname === '/(tabs)';
    }
    // For other tabs, check if pathname starts with the tab path
    const tabPath = path.replace('/(tabs)', '');
    return pathname === tabPath || pathname.startsWith(tabPath + '/');
  };

  return (
    <View style={styles.container}>
      {navItems.map((item) => {
        const active = isActive(item.path);
        return (
          <TouchableOpacity
            key={item.path}
            style={[styles.navItem, active && styles.navItemActive]}
            onPress={() => router.push(item.path as any)}
          >
            <FontAwesome
              name={item.icon}
              size={18}
              color={active ? '#3b82f6' : '#64748b'}
              style={styles.icon}
            />
            <Text
              size="sm"
              style={[
                styles.navText,
                active && styles.navTextActive,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  navItemActive: {
    // backgroundColor: '#eff6ff',
  },
  icon: {
    // Icon styling handled by FontAwesome color prop
  },
  navText: {
    color: '#64748b',
    fontWeight: '500',
  },
  navTextActive: {
    color: '#3b82f6',
    fontWeight: '600',
  },
});
