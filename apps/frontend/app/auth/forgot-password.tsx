import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useAuth } from '@/context/AuthContext';
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
  Link,
  LinkText,
} from '@gluestack-ui/themed';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState('');
  const { resetPassword } = useAuth();

  const handleResetPassword = async () => {
    setError('');

    if (!email) {
      setError('Please enter your email');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email);
      setEmailSent(true);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to send reset email';
      setError(errorMessage);
      
      if (Platform.OS !== 'web') {
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <Box flex={1} bg="$background" p="$6" justifyContent="center">
        <VStack space="lg" maxWidth={400} width="100%" alignSelf="center">
          <VStack space="md" alignItems="center">
            <Text fontSize={48}>✉️</Text>
            <Heading size="2xl" textAlign="center">Check Your Email</Heading>
            <Text size="md" color="$textLight600" textAlign="center">
              We've sent a password reset link to {email}
            </Text>
            <Text size="sm" color="$textLight500" textAlign="center">
              Please check your inbox and follow the instructions to reset your password.
            </Text>
          </VStack>

          <Button
            size="lg"
            onPress={() => router.back()}
          >
            <ButtonText>Back to Sign In</ButtonText>
          </Button>
        </VStack>
      </Box>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <Box flex={1} bg="$background" p="$6" justifyContent="center">
          <VStack space="lg" maxWidth={400} width="100%" alignSelf="center">
            <VStack space="md">
              <Heading size="2xl">Reset Password</Heading>
              <Text size="md" color="$textLight600">
                Enter your email address and we'll send you a link to reset your password
              </Text>
            </VStack>

            <VStack space="xl">
              <FormControl isInvalid={!!error}>
                <FormControlLabel>
                  <FormControlLabelText>Email</FormControlLabelText>
                </FormControlLabel>
                <Input>
                  <InputField
                    placeholder="Enter your email"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                  />
                </Input>
              </FormControl>

              <Button
                size="lg"
                onPress={handleResetPassword}
                isDisabled={loading}
              >
                <ButtonText>{loading ? 'Sending...' : 'Send Reset Link'}</ButtonText>
              </Button>

              <Link
                onPress={() => router.back()}
                alignSelf="center"
              >
                <LinkText size="sm">Back to Sign In</LinkText>
              </Link>
            </VStack>
          </VStack>
        </Box>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
