import React, { useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, Platform, Alert, Linking } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import WebDateInput from '@/components/WebDateInput';
import { useColorScheme } from '@/components/useColorScheme';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { 
  View, 
  Text, 
  Input, 
  InputField,
  Button,
  ButtonText,
  Heading,
  VStack,
  HStack,
  Radio,
  RadioGroup,
  RadioIndicator,
  RadioIcon,
  RadioLabel,
  CircleIcon,
  Checkbox,
  CheckboxIndicator,
  CheckboxIcon,
  CheckboxLabel,
  CheckIcon,
  Link,
} from '@gluestack-ui/themed';
import { useAuth } from '@/context/AuthContext';
import { useFirebaseFunctions } from '@/hooks/useFirebaseFunctions';
import { useScreenTracking } from '@/hooks/useAnalytics';
import { StatusType, STATUS_TYPE_LABELS } from '@journey-to-citizen/types';

// Status options with colors for visual distinction
const STATUS_OPTIONS: { value: StatusType; label: string; description: string; color: string }[] = [
  { value: 'permanent_resident', label: 'Permanent Resident', description: 'I have PR status', color: '#ec4899' },
  { value: 'work_permit', label: 'Work Permit', description: 'Working in Canada', color: '#22c55e' },
  { value: 'study_permit', label: 'Study Permit', description: 'Studying in Canada', color: '#3b82f6' },
  { value: 'visitor', label: 'Visitor', description: 'Visiting Canada', color: '#f59e0b' },
  { value: 'protected_person', label: 'Protected Person', description: 'Refugee or protected status', color: '#a855f7' },
];

export default function ProfileSetupScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const { userProfile, updateLocalProfile } = useAuth();
  const { updateUserProfile } = useFirebaseFunctions();
  
  // Track screen view
  useScreenTracking('Profile Setup');
  
  // Form state - simplified timeline approach
  const [displayName, setDisplayName] = useState('');
  const [currentStatus, setCurrentStatus] = useState<StatusType>('work_permit');
  const [statusStartDate, setStatusStartDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [hasTravelAbsences, setHasTravelAbsences] = useState<'yes' | 'no'>('no');
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setStatusStartDate(selectedDate);
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

    if (!statusStartDate) {
      const message = 'Please select when your current status started';
      Platform.OS === 'web'
        ? alert(message)
        : Alert.alert('Required', message);
      return;
    }

    if (!agreedToPrivacy) {
      const message = 'Please agree to the Terms of Service and Privacy Policy to continue';
      Platform.OS === 'web'
        ? alert(message)
        : Alert.alert('Required', message);
      return;
    }

    setIsSubmitting(true);
    try {
      const statusStartDateStr = statusStartDate.toISOString().split('T')[0];
      
      // Create the initial status entry for the timeline
      const statusEntry = {
        id: `initial-${Date.now()}`,
        status: currentStatus,
        from: statusStartDateStr,
        to: undefined, // Current/ongoing status
      };

      // Build profile data with both new and legacy formats for backward compatibility
      const profileData: any = {
        displayName: displayName.trim(),
        profileComplete: true,
        // NEW: Timeline-based status history
        statusHistory: [statusEntry],
        // LEGACY: Keep for backward compatibility during migration
        immigrationStatus: currentStatus === 'study_permit' ? 'student' 
          : currentStatus === 'work_permit' ? 'worker'
          : currentStatus === 'permanent_resident' ? 'permanent_resident'
          : 'visitor',
        // Set prDate if PR status
        prDate: currentStatus === 'permanent_resident' ? statusStartDateStr : undefined,
        // Initialize empty arrays
        presenceInCanada: [],
        travelAbsences: [],
      };

      const result = await updateUserProfile(profileData);

      // Update local profile with returned data
      if (result.data) {
        updateLocalProfile(result.data);
      }

      // Root layout will automatically redirect to dashboard
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

  const isPR = currentStatus === 'permanent_resident';

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

          {/* Current Status Selection */}
          <VStack space="sm">
            <Text size="sm" fontWeight="$medium">What's your current status in Canada? *</Text>
            <Text size="xs" color="$textLight600">
              Select the immigration status you currently hold
            </Text>
            <View style={styles.statusGrid}>
              {STATUS_OPTIONS.map((option) => {
                const isSelected = currentStatus === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.statusCard,
                      isSelected && { 
                        borderColor: option.color, 
                        backgroundColor: `${option.color}10` 
                      }
                    ]}
                    onPress={() => setCurrentStatus(option.value)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.statusCardContent}>
                      <View style={[
                        styles.statusIndicator,
                        { backgroundColor: isSelected ? option.color : '#e5e7eb' }
                      ]}>
                        {isSelected && (
                          <FontAwesome name="check" size={12} color="#fff" />
                        )}
                      </View>
                      <View style={styles.statusTextContainer}>
                        <Text style={[
                          styles.statusLabel,
                          isSelected && { color: option.color }
                        ]}>
                          {option.label}
                        </Text>
                        <Text style={styles.statusDescription}>
                          {option.description}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </VStack>

          {/* Status Start Date */}
          <VStack space="sm">
            <Text size="sm" fontWeight="$medium">
              {isPR ? 'When did you receive your PR? *' : 'When did this status start? *'}
            </Text>
            <Text size="xs" color="$textLight600" mb="$2">
              {isPR 
                ? 'Refer to the back of your PR Card or Confirmation of PR document'
                : 'The date you entered Canada with this status or when it was issued'}
            </Text>
            {Platform.OS === 'web' ? (
              <WebDateInput
                value={statusStartDate}
                onChange={(date) => date && setStatusStartDate(date)}
                max={new Date().toISOString().split('T')[0]}
              />
            ) : (
              <>
                <TouchableOpacity
                  onPress={() => setShowDatePicker(true)}
                  style={styles.dateButton}
                >
                  <Text style={styles.dateButtonText}>
                    {statusStartDate.toLocaleDateString('en-CA')}
                  </Text>
                  <FontAwesome name="calendar" size={16} color="#64748b" />
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={statusStartDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    themeVariant={colorScheme}
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
              </>
            )}
          </VStack>

          {/* Info box about pre-PR time */}
          {isPR && (
            <View style={styles.infoBox}>
              <FontAwesome name="info-circle" size={16} color="#3b82f6" />
              <Text style={styles.infoText}>
                If you were in Canada before getting PR (on work/study permit), you can add those periods later in your Profile. Days before PR count as half-days toward citizenship (max 365 days credit).
              </Text>
            </View>
          )}

          {/* Info box for non-PR users with countable status (work/study permit, protected person) */}
          {!isPR && currentStatus && currentStatus !== 'visitor' && (
            <View style={styles.infoBoxGreen}>
              <FontAwesome name="star" size={16} color="#16a34a" />
              <Text style={styles.infoTextGreen}>
                Great news! Your days in Canada on {STATUS_TYPE_LABELS[currentStatus]} will count toward citizenship when you get PR (as half-days, max 365 days credit).
              </Text>
            </View>
          )}

          {/* Info box for visitors - days don't count */}
          {!isPR && currentStatus === 'visitor' && (
            <View style={styles.infoBox}>
              <FontAwesome name="info-circle" size={16} color="#3b82f6" />
              <Text style={styles.infoText}>
                As a visitor, your days don't count toward citizenship yet. When you get a work permit, study permit, or PR, your journey to citizenship begins!
              </Text>
            </View>
          )}

          {/* Travel Absences */}
          <VStack space="sm">
            <Text size="sm" fontWeight="$medium">
              Have you traveled outside Canada in the last 5 years?
            </Text>
            <Text size="xs" color="$textLight600">
              Include all trips, even day trips to the US. You can add details later.
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

          {/* Privacy Policy Agreement */}
          <VStack space="md" bg="$backgroundLight100" p="$4" borderRadius="$lg" borderWidth={1} borderColor="$borderLight200">
            <Checkbox 
              value="agreed" 
              isChecked={agreedToPrivacy}
              onChange={setAgreedToPrivacy}
              size="md"
            >
              <CheckboxIndicator mr="$2">
                <CheckboxIcon as={CheckIcon} />
              </CheckboxIndicator>
              <CheckboxLabel flex={1}>
                <Text size="sm">
                  By continuing, I acknowledge that I have read and agree to the{' '}
                  <Text 
                    color="$primary500" 
                    fontWeight="$bold"
                    onPress={() => {
                      if (Platform.OS === 'web') {
                        window.open('/terms', '_blank');
                      } else {
                        Linking.openURL('https://journeytocitizen.com/terms');
                      }
                    }}
                    style={{ textDecorationLine: 'underline' }}
                  >
                    Terms of Service
                  </Text>
                  {' and '}
                  <Text 
                    color="$primary500" 
                    fontWeight="$bold"
                    onPress={() => {
                      if (Platform.OS === 'web') {
                        window.open('/privacy', '_blank');
                      } else {
                        Linking.openURL('https://journeytocitizen.com/privacy');
                      }
                    }}
                    style={{ textDecorationLine: 'underline' }}
                  >
                    Privacy Policy
                  </Text>
                  {'. '}
                  I understand this is a side project provided \"as is\" with no warranties, 
                  and I will verify all information with official IRCC sources.
                </Text>
              </CheckboxLabel>
            </Checkbox>
          </VStack>

          {/* Submit Button */}
          <Button
            size="lg"
            onPress={handleSubmit}
            isDisabled={isSubmitting || !agreedToPrivacy}
            bg="$primary500"
            opacity={!agreedToPrivacy ? 0.5 : 1}
          >
            <ButtonText>
              {isSubmitting ? 'Setting up...' : 'Complete Profile'}
            </ButtonText>
          </Button>

          <Text size="xs" color="$textLight500" textAlign="center">
            You can update these details and add previous statuses anytime from your Profile
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
  statusGrid: {
    marginTop: 8,
    gap: 10,
  },
  statusCard: {
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 14,
    backgroundColor: '#fff',
  },
  statusCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusTextContainer: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
  },
  statusDescription: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 14,
    backgroundColor: '#fff',
  },
  dateButtonText: {
    fontSize: 15,
    color: '#1f2937',
  },
  infoBox: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    backgroundColor: '#eff6ff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#1e40af',
    lineHeight: 18,
  },
  infoBoxGreen: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    backgroundColor: '#f0fdf4',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  infoTextGreen: {
    flex: 1,
    fontSize: 13,
    color: '#166534',
    lineHeight: 18,
  },
});
