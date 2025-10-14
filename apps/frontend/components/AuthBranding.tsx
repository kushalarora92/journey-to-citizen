import React from 'react';
import { Image } from 'react-native';
import { VStack, Text, Heading } from '@gluestack-ui/themed';

interface AuthBrandingProps {
  showTitle?: boolean;
  showTagline?: boolean;
}

export function AuthBranding({ showTitle = false, showTagline = false }: AuthBrandingProps) {
  return (
    <VStack space="sm" alignItems="center" gap="0">
      <Image
        source={require('../assets/images/logo.png')}
        style={{ width: 150, height: 150 }}
        resizeMode="contain"
      />
      {showTitle && (
        <Heading size="2xl" style={{ marginBottom: 0 }}>
          Journey to Citizen
        </Heading>
      )}
      {showTagline && (
        <Text size="sm" color="$textLight600" textAlign="center">
          From landing in Canada to your passport 🎉
        </Text>
      )}
    </VStack>
  );
}
