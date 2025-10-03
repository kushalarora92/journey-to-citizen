import React, { useState, useEffect } from 'react';
import { Alert, Platform } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { router } from 'expo-router';
import {
  Box,
  VStack,
  Heading,
  Text,
  Button,
  ButtonText,
  Link,
  LinkText,
} from '@gluestack-ui/themed';

export default function VerifyEmailScreen() {
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [lastSentTime, setLastSentTime] = useState<number | null>(null);
  const { user, sendVerificationEmail, logout } = useAuth();

  // Debug logging
  console.log('VerifyEmailScreen - user:', user?.email, 'verified:', user?.emailVerified);

  // Cooldown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleResendEmail = async () => {
    // Check if user is in cooldown period
    if (cooldown > 0) {
      const message = `You can resend the verification email in ${cooldown} seconds.`;
      if (Platform.OS === 'web') {
        alert(message);
      } else {
        Alert.alert('Please Wait', message);
      }
      return;
    }

    // Additional check: prevent resending within 60 seconds
    if (lastSentTime && Date.now() - lastSentTime < 60000) {
      const remainingSeconds = Math.ceil((60000 - (Date.now() - lastSentTime)) / 1000);
      const message = `Please wait ${remainingSeconds} more seconds before requesting another email.`;
      if (Platform.OS === 'web') {
        alert(message);
      } else {
        Alert.alert('Too Soon', message);
      }
      return;
    }

    setLoading(true);
    try {
      await sendVerificationEmail();
      setLastSentTime(Date.now());
      setCooldown(60); // 60 second cooldown
      
      const message = 'Verification email sent! Please check your inbox and spam folder.';
      if (Platform.OS === 'web') {
        alert(message);
      } else {
        Alert.alert('Success', message);
      }
    } catch (error: any) {
      console.error('Resend verification error:', error);
      
      let errorMessage = 'Failed to send verification email';
      
      if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many requests. Please try again later (after a few minutes).';
        setCooldown(120); // 2 minute cooldown on rate limit
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      if (Platform.OS === 'web') {
        alert(errorMessage);
      } else {
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBackToSignIn = async () => {
    setLoading(true);
    try {
      await logout();
      // Use setTimeout to avoid the update warning
      setTimeout(() => {
        router.replace('/auth/sign-in');
      }, 0);
    } catch (error) {
      setLoading(false);
      const message = 'Failed to sign out';
      if (Platform.OS === 'web') {
        alert(message);
      } else {
        Alert.alert('Error', message);
      }
    }
  };

  // If no user, redirect to sign in (using useEffect to avoid warning)
  useEffect(() => {
    if (!user) {
      router.replace('/auth/sign-in');
    }
  }, [user]);

  if (!user) {
    return null;
  }

  return (
    <Box flex={1} bg="$background" p="$6" justifyContent="center">
      <VStack space="lg" maxWidth={400} width="100%" alignSelf="center">
        <VStack space="md" alignItems="center">
          <Box
            w={80}
            h={80}
            borderRadius="$full"
            bg="$blue100"
            justifyContent="center"
            alignItems="center"
            mb="$4"
          >
            <Text fontSize={40}>✉️</Text>
          </Box>

          <Heading size="2xl" textAlign="center">Verify Your Email</Heading>
          <Text size="md" color="$textLight600" textAlign="center">
            We've sent a verification email to:
          </Text>
          <Text size="md" fontWeight="$semibold" color="$primary500" textAlign="center">
            {user?.email}
          </Text>
        </VStack>

        <Box bg="$backgroundLight100" p="$4" borderRadius="$lg" w="100%">
          <Text size="md" fontWeight="$semibold" mb="$3">Next Steps:</Text>
          <Text size="sm" color="$textLight600" mb="$2">1. Check your email inbox</Text>
          <Text size="sm" color="$textLight600" mb="$2">2. Click the verification link</Text>
          <Text size="sm" color="$textLight600">3. Return to the app and sign in</Text>
        </Box>

        <Text size="sm" color="$textLight600" textAlign="center">
          Didn't receive the email? Check your spam folder or request a new one.
        </Text>

        <Button
          size="lg"
          onPress={handleResendEmail}
          isDisabled={loading || cooldown > 0}
        >
          <ButtonText>
            {loading
              ? 'Sending...'
              : cooldown > 0
              ? `Wait ${cooldown}s`
              : 'Resend Verification Email'}
          </ButtonText>
        </Button>

        <Link
          onPress={handleBackToSignIn}
          isDisabled={loading}
          alignSelf="center"
        >
          <LinkText size="md">Back to Sign In</LinkText>
        </Link>
      </VStack>
    </Box>
  );
}
