import { useState } from 'react';
import { Platform, Alert } from 'react-native';
import { router } from 'expo-router';
import { 
  Box, 
  VStack, 
  Heading, 
  Text, 
  Button, 
  ButtonText,
  Input,
  InputField,
  FormControl,
  FormControlLabel,
  FormControlLabelText,
  FormControlError,
  FormControlErrorText,
  FormControlErrorIcon,
  AlertCircleIcon,
} from '@gluestack-ui/themed';
import { useAuth } from '@/context/AuthContext';
import { useFirebaseFunctions } from '@/hooks/useFirebaseFunctions';

export default function ProfileSetupScreen() {
  const { refreshProfile, user } = useAuth();
  const { updateUserProfile } = useFirebaseFunctions();
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    // Validate input
    if (!displayName.trim()) {
      setError('Please enter your name');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('📝 Updating profile with displayName:', displayName);
      
      // Update profile with active status
      await updateUserProfile({
        displayName: displayName.trim(),
        status: 'active',
      });

      console.log('✅ Profile updated successfully');

      // Refresh profile to update AuthContext
      await refreshProfile();

      console.log('✅ Profile refreshed');

      // Show success message
      if (Platform.OS === 'web') {
        alert('Profile setup complete! Welcome aboard!');
      } else {
        Alert.alert('Success', 'Profile setup complete! Welcome aboard!');
      }

      // Navigation will happen automatically via root layout checking needsProfileSetup
      // But we can also manually route if needed
      router.replace('/(tabs)');
      
    } catch (err: any) {
      console.error('❌ Error updating profile:', err);
      const errorMessage = err.message || 'Failed to update profile. Please try again.';
      setError(errorMessage);
      
      if (Platform.OS === 'web') {
        alert(`Error: ${errorMessage}`);
      } else {
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box flex={1} bg="$background" px="$6" justifyContent="center">
      <VStack space="lg" maxWidth={400} width="$full" mx="auto">
        {/* Header */}
        <VStack space="sm">
          <Heading size="2xl" color="$textLight900" $dark-color="$textDark50">
            Complete Your Profile
          </Heading>
          <Text size="md" color="$textLight600" $dark-color="$textDark400">
            We need a bit more information to get you started
          </Text>
        </VStack>

        {/* User Email Display */}
        <Box 
          bg="$backgroundLight100" 
          $dark-bg="$backgroundDark800" 
          p="$3" 
          borderRadius="$md"
        >
          <Text size="sm" color="$textLight500" $dark-color="$textDark500">
            Signed in as:
          </Text>
          <Text size="md" color="$textLight900" $dark-color="$textDark50" bold>
            {user?.email}
          </Text>
        </Box>

        {/* Form */}
        <VStack space="md">
          <FormControl isInvalid={!!error} isRequired>
            <FormControlLabel>
              <FormControlLabelText>Display Name</FormControlLabelText>
            </FormControlLabel>
            <Input>
              <InputField
                placeholder="Enter your full name"
                value={displayName}
                onChangeText={(text) => {
                  setDisplayName(text);
                  setError(''); // Clear error on input
                }}
                autoFocus
                editable={!loading}
              />
            </Input>
            {error && (
              <FormControlError>
                <FormControlErrorIcon as={AlertCircleIcon} />
                <FormControlErrorText>{error}</FormControlErrorText>
              </FormControlError>
            )}
          </FormControl>

          <Button
            size="lg"
            onPress={handleSubmit}
            isDisabled={loading || !displayName.trim()}
            bg="$primary500"
            $dark-bg="$primary600"
          >
            <ButtonText>
              {loading ? 'Setting up...' : 'Complete Setup'}
            </ButtonText>
          </Button>
        </VStack>

        {/* Help Text */}
        <Text 
          size="xs" 
          color="$textLight500" 
          $dark-color="$textDark500"
          textAlign="center"
        >
          You can update this information later in your profile settings
        </Text>
      </VStack>
    </Box>
  );
}
