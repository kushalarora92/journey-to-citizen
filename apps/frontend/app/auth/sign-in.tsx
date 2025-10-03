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

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn } = useAuth();

  const handleSignIn = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await signIn(email, password);
      console.log('Sign in successful');
      // Navigation is handled by _layout.tsx
    } catch (err: any) {
      console.error('Sign in error:', err);
      
      let errorMessage = 'Failed to sign in';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        errorMessage = 'Invalid email or password';
      } else if (err.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email';
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      }
      
      setError(errorMessage);
      
      // Show alert on mobile
      if (Platform.OS !== 'web') {
        Alert.alert('Sign In Error', errorMessage);
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
              <Heading size="2xl">Welcome Back</Heading>
              <Text size="md" color="$textLight600">
                Sign in to continue your citizenship journey
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
                {error && (
                  <FormControlError>
                    <FormControlErrorText>{error}</FormControlErrorText>
                  </FormControlError>
                )}
              </FormControl>

              <Button
                size="lg"
                onPress={handleSignIn}
                isDisabled={loading}
              >
                <ButtonText>{loading ? 'Signing In...' : 'Sign In'}</ButtonText>
              </Button>

              <Link
                onPress={() => router.push('/auth/forgot-password' as any)}
                alignSelf="center"
              >
                <LinkText size="sm">Forgot Password?</LinkText>
              </Link>

              <Box flexDirection="row" justifyContent="center" gap="$2">
                <Text size="sm" color="$textLight600">
                  Don't have an account?
                </Text>
                <Link onPress={() => router.push('/auth/sign-up' as any)}>
                  <LinkText size="sm">Sign Up</LinkText>
                </Link>
              </Box>
            </VStack>
          </VStack>
        </Box>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
