import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

export type ButtonProps = {
  title: string;
  onPress?: () => void;
};

export function Button({ title, onPress }: ButtonProps) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.btn}>
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#2563eb',
  },
  text: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
  }
});
