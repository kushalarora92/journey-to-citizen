import React from 'react';
import { StyleSheet } from 'react-native';
import { View } from '@gluestack-ui/themed';

interface WebContainerProps {
  children: React.ReactNode;
  maxWidth?: number;
}

/**
 * Container component that limits width on large screens (web, tablets, etc.)
 * This provides a consistent, centered layout across all platforms
 */
export default function WebContainer({ children, maxWidth = 800 }: WebContainerProps) {
  return (
    <View style={styles.container}>
      <View id="web-container" style={[styles.content, { maxWidth }]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    width: '100%',
    // Subtle shadow on left and right for visual separation
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderLeftColor: 'rgba(0, 0, 0, 0.05)',
    borderRightColor: 'rgba(0, 0, 0, 0.05)',
  },
});
