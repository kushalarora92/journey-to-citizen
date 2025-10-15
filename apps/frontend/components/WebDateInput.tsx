import React from 'react';

interface WebDateInputProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
  max?: string;
  style?: React.CSSProperties;
}

/**
 * WebDateInput - A reusable HTML5 date input component for web platform
 * 
 * This component provides a native browser date picker on web.
 * Should only be used when Platform.OS === 'web'.
 * 
 * @param value - The date value (or null)
 * @param onChange - Callback when date changes
 * @param max - Maximum date in YYYY-MM-DD format (optional)
 * @param style - Additional inline styles (optional)
 */
export default function WebDateInput({ value, onChange, max, style }: WebDateInputProps) {
  return (
    <input
      type="date"
      style={{
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#fff',
        borderStyle: 'solid',
        ...style,
      }}
      value={value ? value.toISOString().split('T')[0] : ''}
      onChange={(e: any) => {
        const inputValue = e.target.value;
        if (inputValue) {
          onChange(new Date(inputValue + 'T00:00:00.000Z'));
        } else {
          onChange(null);
        }
      }}
      max={max}
    />
  );
}
