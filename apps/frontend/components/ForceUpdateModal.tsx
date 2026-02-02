import React from 'react';
import { Linking, Platform } from 'react-native';
import {
  Box,
  VStack,
  Heading,
  Text,
  Button,
  ButtonText,
  Icon,
} from '@gluestack-ui/themed';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';

interface UpdateModalProps {
  message?: string;
  storeUrl?: string;
  isForceUpdate?: boolean;
  onDismiss?: () => void;
}

/**
 * Modal that prompts user to update the app
 * Can be either force update (blocking) or soft update (dismissable)
 */
export default function UpdateModal({
  message = 'A new version of the app is available with important updates. Please update to continue using the app.',
  storeUrl,
  isForceUpdate = true,
  onDismiss,
}: UpdateModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  const handleUpdatePress = async () => {
    if (storeUrl) {
      const canOpen = await Linking.canOpenURL(storeUrl);
      if (canOpen) {
        await Linking.openURL(storeUrl);
      } else {
        // Fallback: try opening anyway
        await Linking.openURL(storeUrl);
      }
    }
  };

  const getStoreName = () => {
    if (Platform.OS === 'ios') return 'App Store';
    if (Platform.OS === 'android') return 'Play Store';
    return 'Store';
  };

  return (
    <Box
      flex={1}
      bg={colors.background}
      justifyContent="center"
      alignItems="center"
      px="$6"
    >
      <VStack space="xl" alignItems="center" maxWidth={400}>
        {/* Update Icon */}
        <Box
          bg="$primary100"
          borderRadius="$full"
          p="$6"
          sx={{
            _dark: {
              bg: '$primary900',
            },
          }}
        >
          <FontAwesome 
            name="refresh" 
            size={48} 
            color={colors.tint} 
          />
        </Box>

        {/* Title */}
        <Heading
          size="xl"
          textAlign="center"
          color={colors.text}
        >
          {isForceUpdate ? 'Update Required' : 'Update Available'}
        </Heading>

        {/* Message */}
        <Text
          size="md"
          textAlign="center"
          color="$textLight600"
          sx={{
            _dark: {
              color: '$textDark400',
            },
          }}
        >
          {message}
        </Text>

        {/* Update Button */}
        <Button
          size="lg"
          action="primary"
          onPress={handleUpdatePress}
          w="$full"
          mt="$4"
        >
            <ButtonText textAlign="center" w="$full">
              Update on {getStoreName()}
            </ButtonText>
        </Button>

        {/* Dismiss Button (soft update only) */}
        {!isForceUpdate && onDismiss && (
          <Button
            size="lg"
            action="secondary"
            variant="outline"
            onPress={onDismiss}
            w="$full"
          >
            <ButtonText textAlign="center" w="$full">
              Maybe Later
            </ButtonText>
          </Button>
        )}

        {/* Disclaimer */}
        <Text
          size="xs"
          textAlign="center"
          color="$textLight400"
          sx={{
            _dark: {
              color: '$textDark500',
            },
          }}
        >
          {isForceUpdate 
            ? "We've made important changes to improve your experience. The app will not function correctly without this update."
            : "We recommend updating to get the latest features and improvements."}
        </Text>
      </VStack>
    </Box>
  );
}

// Export as ForceUpdateModal for backward compatibility
export { UpdateModal as ForceUpdateModal };
