import { useState } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Alert, Platform, TextInput, Modal } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import DateTimePicker from '@react-native-community/datetimepicker';

import { Text, View } from '@/components/Themed';
import { useAuth } from '@/context/AuthContext';
import { useFirebaseFunctions } from '@/hooks/useFirebaseFunctions';
import DateRangeList, { DateRangeEntry } from '@/components/DateRangeList';
import { PresenceEntry, IMMIGRATION_STATUS_LABELS, PURPOSE_OF_STAY_LABELS } from '@journey-to-citizen/types';

export default function TabTwoScreen() {
  const { user, userProfile, profileLoading, sendVerificationEmail, updateLocalProfile } = useAuth();
  const { updateUserProfile } = useFirebaseFunctions();
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [isEditingPRDate, setIsEditingPRDate] = useState(false);
  const [editedPRDate, setEditedPRDate] = useState<Date | null>(null);
  const [showPRDatePicker, setShowPRDatePicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleEditNamePress = () => {
    setEditedName(userProfile?.displayName || '');
    setIsEditingName(true);
  };

  const handleCancelNameEdit = () => {
    setIsEditingName(false);
    setEditedName('');
  };

  const handleSaveName = async () => {
    if (!editedName.trim()) {
      const message = 'Please enter a valid name';
      Platform.OS === 'web' ? alert(message) : Alert.alert('Error', message);
      return;
    }

    setIsSaving(true);
    try {
      const result = await updateUserProfile({ displayName: editedName.trim() });
      if (result.data) updateLocalProfile(result.data);
      const successMessage = 'Name updated successfully!';
      Platform.OS === 'web' ? alert(successMessage) : Alert.alert('Success', successMessage);
      setIsEditingName(false);
      setEditedName('');
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to update name';
      Platform.OS === 'web' ? alert(`Error: ${errorMessage}`) : Alert.alert('Error', errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveStatus = async (newStatus: string) => {
    setIsSaving(true);
    try {
      const updates: any = { immigrationStatus: newStatus };
      
      // If changing to non-PR, remove PR date and presence entries
      if (newStatus !== 'permanent_resident') {
        updates.prDate = null;
        updates.presenceInCanada = [];
      }
      
      const result = await updateUserProfile(updates);
      if (result.data) updateLocalProfile(result.data);
      setIsEditingStatus(false);
      const successMessage = 'Immigration status updated successfully!';
      Platform.OS === 'web' ? alert(successMessage) : Alert.alert('Success', successMessage);
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to update status';
      Platform.OS === 'web' ? alert(`Error: ${errorMessage}`) : Alert.alert('Error', errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditPRDatePress = () => {
    setEditedPRDate(userProfile?.prDate ? new Date(userProfile.prDate) : new Date());
    setIsEditingPRDate(true);
  };

  const handleCancelPRDateEdit = () => {
    setIsEditingPRDate(false);
    setEditedPRDate(null);
    setShowPRDatePicker(false);
  };

  const handleSavePRDate = async () => {
    if (!editedPRDate) {
      const message = 'Please select a valid date';
      Platform.OS === 'web' ? alert(message) : Alert.alert('Error', message);
      return;
    }

    setIsSaving(true);
    try {
      const result = await updateUserProfile({ prDate: editedPRDate.toISOString() });
      if (result.data) updateLocalProfile(result.data);
      const successMessage = 'PR date updated successfully!';
      Platform.OS === 'web' ? alert(successMessage) : Alert.alert('Success', successMessage);
      setIsEditingPRDate(false);
      setEditedPRDate(null);
      setShowPRDatePicker(false);
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to update PR date';
      Platform.OS === 'web' ? alert(`Error: ${errorMessage}`) : Alert.alert('Error', errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (date: any): string => {
    if (!date) return 'Not set';
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  // Handlers for presence entries
  const handleAddPresence = async (entry: Omit<DateRangeEntry, 'id'>) => {
    try {
      const currentPresence = userProfile?.presenceInCanada || [];
      const newEntry = {
        id: Date.now().toString(),
        from: entry.from,
        to: entry.to,
        purpose: (entry as any).purpose || 'visitor',
      } as PresenceEntry;
      
      const result = await updateUserProfile({
        presenceInCanada: [...currentPresence, newEntry],
      });
      
      if (result.data) updateLocalProfile(result.data);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to add entry');
    }
  };

  const handleEditPresence = async (id: string, updates: Partial<DateRangeEntry>) => {
    try {
      const currentPresence = userProfile?.presenceInCanada || [];
      const updatedPresence = currentPresence.map(entry =>
        entry.id === id ? { ...entry, ...updates } : entry
      );
      
      const result = await updateUserProfile({
        presenceInCanada: updatedPresence,
      });
      
      if (result.data) updateLocalProfile(result.data);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update entry');
    }
  };

  const handleDeletePresence = async (id: string) => {
    try {
      const currentPresence = userProfile?.presenceInCanada || [];
      const updatedPresence = currentPresence.filter(entry => entry.id !== id);
      
      const result = await updateUserProfile({
        presenceInCanada: updatedPresence,
      });
      
      if (result.data) updateLocalProfile(result.data);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to delete entry');
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

        {/* Immigration Status Section */}
        {!isEditingStatus ? (
          <View style={styles.infoBox}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Immigration Status</Text>
              <TouchableOpacity
                onPress={() => setIsEditingStatus(true)}
                disabled={profileLoading}
                style={styles.editIcon}
              >
                <FontAwesome name="pencil" size={14} color="#666" style={styles.pencilIcon} />
              </TouchableOpacity>
            </View>
            <Text style={styles.value}>
              {IMMIGRATION_STATUS_LABELS[userProfile?.immigrationStatus || ''] || 'Not set'}
            </Text>
          </View>
        ) : (
          <View style={styles.editSection}>
            <Text style={styles.label}>Edit Immigration Status</Text>
            <View style={styles.pickerContainer}>
              {Object.entries(IMMIGRATION_STATUS_LABELS).map(([key, label]) => (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.pickerOption,
                    userProfile?.immigrationStatus === key && styles.pickerOptionSelected,
                  ]}
                  onPress={() => handleSaveStatus(key)}
                  disabled={isSaving}
                >
                  <Text
                    style={[
                      styles.pickerOptionText,
                      userProfile?.immigrationStatus === key && styles.pickerOptionTextSelected,
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton, { marginTop: 12 }]}
              onPress={() => setIsEditingStatus(false)}
              disabled={isSaving}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* PR Date Section (if permanent resident) */}
        {userProfile?.immigrationStatus === 'permanent_resident' && (
          <>
            {!isEditingPRDate ? (
              <View style={styles.infoBox}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>PR Date</Text>
                  <TouchableOpacity
                    onPress={handleEditPRDatePress}
                    disabled={profileLoading}
                    style={styles.editIcon}
                  >
                    <FontAwesome name="pencil" size={14} color="#666" style={styles.pencilIcon} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.value}>{formatDate(userProfile.prDate)}</Text>
                {!userProfile.prDate && (<Text style={[styles.helpText, { marginTop: 4, marginBottom: 8 }]}>
                  Refer to the back of your PR Card or Confirmation of PR document
                </Text>)}
              </View>
            ) : (
              <View style={styles.editSection}>
                <Text style={styles.label}>Edit PR Date</Text>
                <Text style={[styles.helpText, { marginTop: 4, marginBottom: 8 }]}>
                  Refer to the back of your PR Card or Confirmation of PR document
                </Text>
                <TouchableOpacity
                  onPress={() => setShowPRDatePicker(true)}
                  style={styles.dateButton}
                >
                  <Text style={styles.dateButtonText}>
                    {editedPRDate ? formatDate(editedPRDate) : 'Select PR date'}
                  </Text>
                </TouchableOpacity>
                {showPRDatePicker && (
                  <DateTimePicker
                    value={editedPRDate || new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(event, date) => {
                      setShowPRDatePicker(false);
                      if (date && event.type !== 'dismissed') {
                        setEditedPRDate(date);
                      }
                    }}
                    maximumDate={new Date()}
                  />
                )}
                <View style={styles.editButtons}>
                  <TouchableOpacity
                    style={[styles.button, styles.cancelButton]}
                    onPress={handleCancelPRDateEdit}
                    disabled={isSaving}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.button, styles.saveButton]}
                    onPress={handleSavePRDate}
                    disabled={isSaving}
                  >
                    <Text style={styles.saveButtonText}>
                      {isSaving ? 'Saving...' : 'Save'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </>
        )}

        {/* Presence in Canada Before PR (only for PRs) */}
        {userProfile?.immigrationStatus === 'permanent_resident' && (
          <View style={styles.presenceSection}>
            <View style={styles.sectionHeader}>
              <FontAwesome name="calendar" size={18} color="#3b82f6" />
              <Text style={styles.sectionTitle}>Time in Canada Before PR</Text>
            </View>
            <Text style={styles.sectionDescription}>
              Track your time spent in Canada before becoming a permanent resident. 
              Days before PR count as half days toward citizenship (max 365 days credit).
            </Text>
            
            <DateRangeList
              entries={userProfile?.presenceInCanada || []}
              onAdd={handleAddPresence}
              onEdit={handleEditPresence}
              onDelete={handleDeletePresence}
              title="Presence Entries"
              emptyMessage="No entries yet. Add periods when you were in Canada before PR."
              fields={[
                {
                  name: 'purpose',
                  label: 'Purpose of Stay',
                  type: 'select',
                  options: Object.values(PURPOSE_OF_STAY_LABELS),
                  required: true,
                },
              ]}
              allowFutureDates={false}
            />
            
            <View style={styles.noteBox}>
              <FontAwesome name="info-circle" size={14} color="#3b82f6" />
              <Text style={styles.noteText}>
                Include: visitor stays, study permits, work permits, protected person status, 
                business visits, or time with no legal status.
              </Text>
            </View>
          </View>
        )}

        {/* Link to Travel Absences */}
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            Don't forget to add your <Text style={styles.linkText}>travel absences</Text> in the Travel tab
            to get accurate citizenship eligibility calculations.
          </Text>
        </View>
      </View>
      <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
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
  presenceSection: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
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
  linkText: {
    fontWeight: '600',
    color: '#3b82f6',
  },
});
