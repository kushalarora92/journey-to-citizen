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
  },
});
