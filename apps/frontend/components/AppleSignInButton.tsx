import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import { Button, ButtonText, HStack } from '@gluestack-ui/themed';
import FontAwesome from '@expo/vector-icons/FontAwesome';

interface AppleSignInButtonProps {
  onPress: () => void;
  isLoading?: boolean;
  label?: string;
}

export function AppleSignInButton({ 
  onPress, 
  isLoading = false,
  label = 'Continue with Apple'
}: AppleSignInButtonProps) {
  return (
    <Button
      size="lg"
      variant="solid"
      action="secondary"
      onPress={onPress}
      isDisabled={isLoading}
      bg="$black"
      sx={{
        ':hover': {
          bg: '$backgroundDark900',
        },
        ':active': {
          bg: '$backgroundDark800',
        },
        _dark: {
          bg: '$white',
          ':hover': {
            bg: '$backgroundLight100',
          },
          ':active': {
            bg: '$backgroundLight200',
          },
        },
      }}
    >
      <HStack space="md" alignItems="center">
        <FontAwesome 
          name="apple" 
          size={20} 
          color={Platform.select({ default: '#fff', web: '#fff' })}
          style={{
            // @ts-ignore - dark mode color override
            ...(Platform.OS === 'web' ? { color: 'var(--color-text-dark-100, #fff)' } : {})
          }}
        />
        <ButtonText 
          color="$white"
          sx={{ 
            _dark: { 
              color: '$black' 
            } 
          }}
        >
          {isLoading ? 'Signing in...' : label}
        </ButtonText>
      </HStack>
    </Button>
  );
}

export default AppleSignInButton;
