import { useState } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Alert, Platform, TextInput } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import EditScreenInfo from '@/components/EditScreenInfo';
import { Text, View } from '@/components/Themed';
import { useAuth } from '@/context/AuthContext';
import { useFirebaseFunctions } from '@/hooks/useFirebaseFunctions';

export default function TabTwoScreen() {
  const { user, userProfile, profileLoading, sendVerificationEmail, refreshProfile } = useAuth();
  const { updateUserProfile } = useFirebaseFunctions();
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleEditPress = () => {
    setEditedName(userProfile?.displayName || '');
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedName('');
  };

  const handleSaveProfile = async () => {
    if (!editedName.trim()) {
      const message = 'Please enter a valid name';
      if (Platform.OS === 'web') {
        alert(message);
      } else {
        Alert.alert('Error', message);
      }
      return;
    }

    setIsSaving(true);
    try {
      await updateUserProfile({
        displayName: editedName.trim(),
        status: 'active', // Keep status active
      });

      await refreshProfile();

      const successMessage = 'Profile updated successfully!';
      if (Platform.OS === 'web') {
        alert(successMessage);
      } else {
        Alert.alert('Success', successMessage);
      }

      setIsEditing(false);
      setEditedName('');
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to update profile';
      if (Platform.OS === 'web') {
        alert(`Error: ${errorMessage}`);
      } else {
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleResendVerification = async () => {
    try {
      await sendVerificationEmail();
      const message = 'Verification email sent! Please check your inbox.';
      if (Platform.OS === 'web') {
        alert(message);
      } else {
        Alert.alert('Success', message);
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to send verification email';
      if (Platform.OS === 'web') {
        alert(`Error: ${errorMessage}`);
      } else {
        Alert.alert('Error', errorMessage);
      }
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.title}>Profile</Text>
        
        {/* Display Name Section */}
        {!isEditing ? (
          <View style={styles.infoBox}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Name</Text>
              <TouchableOpacity
                onPress={handleEditPress}
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
                onPress={handleCancelEdit}
                disabled={isSaving}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleSaveProfile}
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
        </View>

        {/* Email Verified Section */}
        <View style={styles.infoBox}>
          <Text style={styles.label}>Email Verified</Text>
          <Text style={styles.value}>{user?.emailVerified ? '✓ Yes' : '✗ No'}</Text>
        </View>
        {!user?.emailVerified && (
          <TouchableOpacity
            style={[styles.button, styles.verifyButton]}
            onPress={handleResendVerification}
          >
            <Text style={styles.buttonText}>Resend Verification Email</Text>
          </TouchableOpacity>
        )}

        {/* Account Created Section */}
        <View style={styles.infoBox}>
          <Text style={styles.label}>Account Created</Text>
          <Text style={styles.value}>
            {user?.metadata.creationTime
              ? new Date(user.metadata.creationTime).toLocaleDateString()
              : 'N/A'}
          </Text>
        </View>
      </View>
      <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
      <EditScreenInfo path="app/(tabs)/two.tsx" />
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
  verifyButton: {
    backgroundColor: '#3b82f6',
    marginTop: 8,
    marginBottom: 16,
  },
  buttonText: {
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
});
