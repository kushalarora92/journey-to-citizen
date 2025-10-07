import React, { useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, Platform, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { 
  View, 
  Text, 
  Input, 
  InputField,
  Button,
  ButtonText,
  Heading,
  VStack,
  Radio,
  RadioGroup,
  RadioIndicator,
  RadioIcon,
  RadioLabel,
  CircleIcon,
} from '@gluestack-ui/themed';
import { useAuth } from '@/context/AuthContext';
import { useFirebaseFunctions } from '@/hooks/useFirebaseFunctions';

export default function ProfileSetupScreen() {
  const router = useRouter();
  const { userProfile, updateLocalProfile } = useAuth();
  const { updateUserProfile } = useFirebaseFunctions();  // Form state
  const [displayName, setDisplayName] = useState('');
  const [immigrationStatus, setImmigrationStatus] = useState<'visitor' | 'student' | 'worker' | 'permanent_resident'>('permanent_resident');
  const [hasPR, setHasPR] = useState<'yes' | 'no'>('no');
  const [prDate, setPrDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [hadPresenceBeforePR, setHadPresenceBeforePR] = useState<'yes' | 'no'>('no');
  const [hasTravelAbsences, setHasTravelAbsences] = useState<'yes' | 'no'>('no');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setPrDate(selectedDate);
    }
    if (event.type === 'dismissed') {
      setShowDatePicker(false);
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!displayName.trim()) {
      const message = 'Please enter your name';
      Platform.OS === 'web' 
        ? alert(message)
        : Alert.alert('Required', message);
      return;
    }

    if (hasPR === 'yes' && !prDate) {
      const message = 'Please select your PR date';
      Platform.OS === 'web'
        ? alert(message)
        : Alert.alert('Required', message);
      return;
    }

    setIsSubmitting(true);
    try {
      // Determine final immigration status
      const finalStatus = hasPR === 'yes' ? 'permanent_resident' : immigrationStatus;

      const result = await updateUserProfile({
        displayName: displayName.trim(),
        immigrationStatus: finalStatus,
        prDate: prDate ? prDate.toISOString() : null,
        profileComplete: true,
        presenceInCanada: [],
        travelAbsences: [],
      });

      // Update local profile with returned data (no extra Firestore read)
      if (result.data) {
        updateLocalProfile(result.data);
      }

      // Determine where to redirect
      if (hadPresenceBeforePR === 'yes') {
        router.replace('/(tabs)/two'); // Profile tab
      } else if (hasTravelAbsences === 'yes') {
        router.replace('/(tabs)/absences'); // Travel absences tab
      } else {
        router.replace('/(tabs)'); // Dashboard
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      const message = error.message || 'Failed to update profile. Please try again.';
      Platform.OS === 'web'
        ? alert(message)
        : Alert.alert('Error', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Stack.Screen 
        options={{
          title: 'Complete Your Profile',
          headerBackVisible: false,
        }} 
      />
      <ScrollView style={styles.container}>
        <VStack space="2xl" padding="$6">
          <VStack space="md">
            <Heading size="xl">Welcome! 🎉</Heading>
            <Text size="md" color="$textLight600">
              Let's set up your profile to track your journey to Canadian citizenship.
            </Text>
          </VStack>

          {/* Display Name */}
          <VStack space="sm">
            <Text size="sm" fontWeight="$medium">Your Name *</Text>
            <Input variant="outline" size="lg">
              <InputField
                placeholder="Enter your full name"
                value={displayName}
                onChangeText={setDisplayName}
                autoCapitalize="words"
              />
            </Input>
          </VStack>

          {/* PR Status */}
          <VStack space="sm">
            <Text size="sm" fontWeight="$medium">Do you have Permanent Resident status? *</Text>
            <RadioGroup value={hasPR} onChange={setHasPR}>
              <VStack space="sm">
                <Radio value="yes">
                  <RadioIndicator mr="$2">
                    <RadioIcon as={CircleIcon} />
                  </RadioIndicator>
                  <RadioLabel>Yes, I have PR</RadioLabel>
                </Radio>
                <Radio value="no">
                  <RadioIndicator mr="$2">
                    <RadioIcon as={CircleIcon} />
                  </RadioIndicator>
                  <RadioLabel>No, not yet</RadioLabel>
                </Radio>
              </VStack>
            </RadioGroup>
          </VStack>

          {/* Immigration Status (if no PR) */}
          {hasPR === 'no' && (
            <VStack space="sm">
              <Text size="sm" fontWeight="$medium">Current Status in Canada *</Text>
              <RadioGroup value={immigrationStatus} onChange={setImmigrationStatus}>
                <VStack space="sm">
                  <Radio value="visitor">
                    <RadioIndicator mr="$2">
                      <RadioIcon as={CircleIcon} />
                    </RadioIndicator>
                    <RadioLabel>Visitor</RadioLabel>
                  </Radio>
                  <Radio value="student">
                    <RadioIndicator mr="$2">
                      <RadioIcon as={CircleIcon} />
                    </RadioIndicator>
                    <RadioLabel>Student (Study Permit)</RadioLabel>
                  </Radio>
                  <Radio value="worker">
                    <RadioIndicator mr="$2">
                      <RadioIcon as={CircleIcon} />
                    </RadioIndicator>
                    <RadioLabel>Worker (Work Permit)</RadioLabel>
                  </Radio>
                </VStack>
              </RadioGroup>
            </VStack>
          )}

          {/* PR Date Picker */}
          {hasPR === 'yes' && (
            <VStack space="sm">
              <Text size="sm" fontWeight="$medium">PR Date *</Text>
              <Text size="xs" color="$textLight600" mb="$2">
                Refer to the back of your PR Card or Confirmation of PR document
              </Text>
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                style={styles.dateButton}
              >
                <Text size="md" color={prDate ? '$textLight900' : '$textLight400'}>
                  {prDate ? prDate.toLocaleDateString('en-CA') : 'Select PR date'}
                </Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={prDate || new Date()}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleDateChange}
                  maximumDate={new Date()}
                />
              )}
              {Platform.OS === 'ios' && showDatePicker && (
                <Button
                  size="sm"
                  action="primary"
                  onPress={() => setShowDatePicker(false)}
                  mt="$2"
                >
                  <ButtonText>Done</ButtonText>
                </Button>
              )}
            </VStack>
          )}

          {/* Pre-PR Presence (only if has PR) */}
          {hasPR === 'yes' && (
            <VStack space="sm">
              <Text size="sm" fontWeight="$medium">
                Were you physically present in Canada before receiving PR?
              </Text>
              <Text size="xs" color="$textLight600">
                Time spent in Canada before PR may count toward citizenship (up to 365 days)
              </Text>
              <RadioGroup value={hadPresenceBeforePR} onChange={setHadPresenceBeforePR}>
                <VStack space="sm">
                  <Radio value="yes">
                    <RadioIndicator mr="$2">
                      <RadioIcon as={CircleIcon} />
                    </RadioIndicator>
                    <RadioLabel>Yes (I'll add details later)</RadioLabel>
                  </Radio>
                  <Radio value="no">
                    <RadioIndicator mr="$2">
                      <RadioIcon as={CircleIcon} />
                    </RadioIndicator>
                    <RadioLabel>No</RadioLabel>
                  </Radio>
                </VStack>
              </RadioGroup>
            </VStack>
          )}

          {/* Travel Absences */}
          <VStack space="sm">
            <Text size="sm" fontWeight="$medium">
              Have you traveled outside Canada in the last 5 years?
            </Text>
            <Text size="xs" color="$textLight600">
              Include all trips, even day trips to the US
            </Text>
            <RadioGroup value={hasTravelAbsences} onChange={setHasTravelAbsences}>
              <VStack space="sm">
                <Radio value="yes">
                  <RadioIndicator mr="$2">
                    <RadioIcon as={CircleIcon} />
                  </RadioIndicator>
                  <RadioLabel>Yes (I'll add details later)</RadioLabel>
                </Radio>
                <Radio value="no">
                  <RadioIndicator mr="$2">
                    <RadioIcon as={CircleIcon} />
                  </RadioIndicator>
                  <RadioLabel>No</RadioLabel>
                </Radio>
              </VStack>
            </RadioGroup>
          </VStack>

          {/* Submit Button */}
          <Button
            size="lg"
            onPress={handleSubmit}
            isDisabled={isSubmitting}
            bg="$primary500"
          >
            <ButtonText>
              {isSubmitting ? 'Setting up...' : 'Complete Profile'}
            </ButtonText>
          </Button>

          <Text size="xs" color="$textLight500" textAlign="center">
            You can update these details anytime from your profile
          </Text>
        </VStack>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
  },
});
