import { useState } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Alert, Platform, TextInput, Modal, Pressable, Linking } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import DateTimePicker from '@react-native-community/datetimepicker';
import WebDateInput from '@/components/WebDateInput';
import { useColorScheme } from '@/components/useColorScheme';
import { useAnalytics, useScreenTracking } from '@/hooks/useAnalytics';
import { useRouter } from 'expo-router';

import { Text, View } from '@/components/Themed';
import { useAuth } from '@/context/AuthContext';
import { useFirebaseFunctions } from '@/hooks/useFirebaseFunctions';
import DeleteAccountModal from '@/components/DeleteAccountModal';
import { 
  hasPRStatus,
} from '@journey-to-citizen/types';
import { 
  formatDateForDisplay 
} from '@/utils/dateRangeValidation';

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const { user, userProfile, profileLoading, sendVerificationEmail, updateLocalProfile, logout } = useAuth();
  const { updateUserProfile, scheduleAccountDeletion, cancelAccountDeletion } = useFirebaseFunctions();
  const { trackEvent } = useAnalytics();
  
  // Track screen view
  useScreenTracking('Profile');
  
  // Helper function for consistent tracking
  const trackProfileAction = (action: string, params?: Record<string, any>) => {
    trackEvent('profile_action', {
      action,
      screen: 'Profile',
      ...params,
    });
  };
  
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleEditNamePress = () => {
    trackProfileAction('edit_name_click');
    setEditedName(userProfile?.displayName || '');
    setIsEditingName(true);
  };

  const handleCancelNameEdit = () => {
    setIsEditingName(false);
    setEditedName('');
  };

  const handleSaveName = async () => {
    if (!editedName.trim()) {
      trackProfileAction('edit_name_error', { reason: 'empty_name' });
      const message = 'Please enter a valid name';
      Platform.OS === 'web' ? alert(message) : Alert.alert('Error', message);
      return;
    }

    setIsSaving(true);
    try {
      trackProfileAction('edit_name_attempt', { new_name_length: editedName.trim().length });
      const result = await updateUserProfile({ displayName: editedName.trim() });
      if (result.data) {
        updateLocalProfile(result.data);
        trackProfileAction('edit_name_success');
      }
      const successMessage = 'Name updated successfully!';
      Platform.OS === 'web' ? alert(successMessage) : Alert.alert('Success', successMessage);
      setIsEditingName(false);
      setEditedName('');
    } catch (error: any) {
      trackProfileAction('edit_name_error', { error: error.message });
      const errorMessage = error.message || 'Failed to update name';
      Platform.OS === 'web' ? alert(`Error: ${errorMessage}`) : Alert.alert('Error', errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    trackProfileAction('delete_account_confirmed');
    
    try {
      // Schedule account deletion (30-day grace period)
      const result = await scheduleAccountDeletion();
      
      if (result.success && result.data) {
        trackProfileAction('delete_account_scheduled', { 
          deletion_date: result.data.deletionDate 
        });
        
        // Logout user (will redirect to auth screen)
        await logout();
        
        // Show success message
        const successMessage = `Account deletion scheduled for ${result.data.deletionDate}. You have 30 days to cancel by signing in again.`;
        if (Platform.OS === 'web') {
          alert(successMessage);
        } else {
          Alert.alert('Deletion Scheduled', successMessage);
        }
      }
    } catch (error: any) {
      trackProfileAction('delete_account_error', { error: error.message });
      throw error; // Let the modal handle the error display
    }
  };

  const handleResendVerification = async () => {
    try {
      await sendVerificationEmail();
      const message = 'Verification email sent! Please check your inbox.';
      Platform.OS === 'web' ? alert(message) : Alert.alert('Success', message);
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to send verification email';
      Platform.OS === 'web' ? alert(`Error: ${errorMessage}`) : Alert.alert('Error', errorMessage);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.title}>Profile</Text>
        
        {/* Display Name Section */}
        {!isEditingName ? (
          <View style={styles.infoBox}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Name</Text>
              <TouchableOpacity
                onPress={handleEditNamePress}
                disabled={profileLoading}
                style={styles.editIcon}
              >
                <FontAwesome name="pencil" size={14} color="#666" style={styles.pencilIcon} />
              </TouchableOpacity>
            </View>
            <Text style={styles.value}>
              {profileLoading ? 'Loading...' : (userProfile?.displayName || 'Not set')}
            </Text>
          </View>
        ) : (
          <View style={styles.editSection}>
            <Text style={styles.label}>Edit Name</Text>
            <TextInput
              style={styles.input}
              value={editedName}
              onChangeText={setEditedName}
              placeholder="Enter your name"
              placeholderTextColor="#999"
              autoFocus
              editable={!isSaving}
            />
            <View style={styles.editButtons}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleCancelNameEdit}
                disabled={isSaving}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleSaveName}
                disabled={isSaving}
              >
                <Text style={styles.saveButtonText}>
                  {isSaving ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Email Section */}
        <View style={styles.infoBox}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{user?.email}</Text>
          {!user?.emailVerified && (
            <TouchableOpacity
              style={styles.warningBanner}
              onPress={handleResendVerification}
            >
              <FontAwesome name="exclamation-circle" size={16} color="#f59e0b" />
              <Text style={styles.warningText}>Email not verified - Tap to resend</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Account Management Section */}
        <View style={styles.accountManagementSection}>
          <Text style={styles.accountManagementTitle}>Account Management</Text>
          
          {/* Email */}
          <View style={styles.accountManagementItem}>
            <FontAwesome name="envelope" size={18} color="#64748b" />
            <Text style={styles.accountManagementLabel}>Email</Text>
            <Text style={styles.accountManagementValue}>{user?.email}</Text>
          </View>

          {/* Privacy Policy */}
          <TouchableOpacity 
            style={styles.accountManagementItem}
            onPress={() => {
              trackProfileAction('legal_link_click', { page: 'privacy' });
              if (Platform.OS === 'web') {
                window.open('/privacy', '_blank');
              } else {
                router.push('/privacy');
              }
            }}
          >
            <FontAwesome name="shield" size={18} color="#64748b" />
            <Text style={styles.accountManagementLabel}>Privacy Policy</Text>
            <FontAwesome name="chevron-right" size={14} color="#94a3b8" />
          </TouchableOpacity>

          {/* Terms of Service */}
          <TouchableOpacity 
            style={styles.accountManagementItem}
            onPress={() => {
              trackProfileAction('legal_link_click', { page: 'terms' });
              if (Platform.OS === 'web') {
                window.open('/terms', '_blank');
              } else {
                router.push('/terms');
              }
            }}
          >
            <FontAwesome name="file-text" size={18} color="#64748b" />
            <Text style={styles.accountManagementLabel}>Terms of Service</Text>
            <FontAwesome name="chevron-right" size={14} color="#94a3b8" />
          </TouchableOpacity>

          {/* Support & Help */}
          <TouchableOpacity 
            style={[styles.accountManagementItem, styles.accountManagementItemLast]}
            onPress={() => {
              trackProfileAction('legal_link_click', { page: 'support' });
              router.push('/support' as any);
            }}
          >
            <FontAwesome name="question-circle" size={18} color="#64748b" />
            <Text style={styles.accountManagementLabel}>Support & Help</Text>
            <FontAwesome name="chevron-right" size={14} color="#94a3b8" />
          </TouchableOpacity>

          {/* Logout Button - Danger Red */}
          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={() => {
              trackProfileAction('logout_button_click');
              if (Platform.OS === 'web') {
                if (window.confirm('Are you sure you want to logout?')) {
                  logout().catch(() => {
                    alert('Failed to logout');
                  });
                }
              } else {
                Alert.alert(
                  'Logout',
                  'Are you sure you want to logout?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { 
                      text: 'Logout', 
                      style: 'destructive',
                      onPress: async () => {
                        try {
                          await logout();
                        } catch (error) {
                          Alert.alert('Error', 'Failed to logout');
                        }
                      }
                    },
                  ]
                );
              }
            }}
          >
            <FontAwesome name="sign-out" size={18} color="#fff" />
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>

          {/* Delete Account Button - Subtle */}
          <TouchableOpacity 
            style={styles.deleteAccountButton}
            onPress={() => {
              trackProfileAction('delete_account_button_click');
              setShowDeleteModal(true);
            }}
          >
            <Text style={styles.deleteAccountText}>Delete Account</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />

      {/* Delete Account Modal */}
      <DeleteAccountModal
        visible={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteAccount}
        userEmail={user?.email || ''}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  infoBox: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.7,
  },
  editIcon: {
    marginLeft: 8,
    padding: 4,
  },
  pencilIcon: {
    opacity: 0.7,
  },
  value: {
    fontSize: 16,
  },
  helpText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
    fontStyle: 'italic',
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    padding: 8,
    backgroundColor: '#fef3c7',
    borderRadius: 6,
    gap: 8,
  },
  warningText: {
    fontSize: 12,
    color: '#92400e',
    fontWeight: '500',
  },
  editSection: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginTop: 8,
    marginBottom: 12,
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
    marginTop: 8,
    marginBottom: 12,
  },
  dateButtonText: {
    fontSize: 16,
    color: '#111',
  },
  pickerContainer: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  pickerOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  pickerOptionSelected: {
    backgroundColor: '#eff6ff',
  },
  pickerOptionText: {
    fontSize: 16,
    color: '#374151',
  },
  pickerOptionTextSelected: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  editButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#e5e7eb',
  },
  cancelButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#3b82f6',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  separator: {
    marginVertical: 20,
    height: 1,
    width: '90%',
    alignSelf: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 8,
    color: '#1e40af',
  },
  sectionDescription: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 16,
    lineHeight: 18,
  },
  noteBox: {
    flexDirection: 'row',
    marginTop: 12,
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#3b82f6',
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    color: '#64748b',
    marginLeft: 8,
    lineHeight: 16,
  },
  infoCard: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  infoText: {
    fontSize: 14,
    color: '#78350f',
    lineHeight: 20,
  },
  accountManagementSection: {
    marginTop: 32,
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  accountManagementTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    color: '#1e293b',
  },
  accountManagementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  accountManagementItemLast: {
    borderBottomWidth: 0,
  },
  accountManagementLabel: {
    flex: 1,
    fontSize: 14,
    color: '#475569',
    marginLeft: 12,
  },
  accountManagementValue: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '500',
  },
  accountManagementLink: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '500',
  },
  logoutButton: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#dc2626',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
  deleteAccountButton: {
    marginTop: 12,
    padding: 14,
    backgroundColor: 'transparent',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    alignItems: 'center',
  },
  deleteAccountText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },
});
