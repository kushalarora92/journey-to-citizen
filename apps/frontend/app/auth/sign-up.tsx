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
  FormControlError,
  FormControlErrorText,
  Link,
  LinkText,
} from '@gluestack-ui/themed';

export default function SignUpScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signUp } = useAuth();

  const handleSignUp = async () => {
    setError('');

    if (!email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      await signUp(email, password);
      router.replace('/auth/verify-email' as any);
    } catch (err: any) {
      console.error('Sign up error:', err);
      
      let errorMessage = 'Failed to create account';
      if (err.code === 'auth/email-already-in-use') {
        errorMessage = 'An account with this email already exists';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      } else if (err.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak';
      }
      
      setError(errorMessage);
      
      if (Platform.OS !== 'web') {
        Alert.alert('Sign Up Error', errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

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
              <Heading size="2xl">Create Account</Heading>
              <Text size="md" color="$textLight600">
                Start your journey to Canadian citizenship
              </Text>
            </VStack>

            <VStack space="xl">
              <FormControl isInvalid={!!error && !password && !confirmPassword}>
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

              <FormControl isInvalid={!!error}>
                <FormControlLabel>
                  <FormControlLabelText>Password</FormControlLabelText>
                </FormControlLabel>
                <Input>
                  <InputField
                    placeholder="Enter your password"
                    value={password}
                    onChangeText={setPassword}
                    type="password"
                    autoCapitalize="none"
                  />
                </Input>
              </FormControl>

              <FormControl isInvalid={!!error}>
                <FormControlLabel>
                  <FormControlLabelText>Confirm Password</FormControlLabelText>
                </FormControlLabel>
                <Input>
                  <InputField
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    type="password"
                    autoCapitalize="none"
                  />
                </Input>
                {error && (
                  <FormControlError>
                    <FormControlErrorText>{error}</FormControlErrorText>
                  </FormControlError>
                )}
              </FormControl>

              <Button
                size="lg"
                onPress={handleSignUp}
                isDisabled={loading}
              >
                <ButtonText>{loading ? 'Creating Account...' : 'Sign Up'}</ButtonText>
              </Button>

              <Box flexDirection="row" justifyContent="center" gap="$2">
                <Text size="sm" color="$textLight600">
                  Already have an account?
                </Text>
                <Link onPress={() => router.push('/auth/sign-in' as any)}>
                  <LinkText size="sm">Sign In</LinkText>
                </Link>
              </Box>
            </VStack>
          </VStack>
        </Box>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
