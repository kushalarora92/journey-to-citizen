import React, { useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, Platform, Alert, ActivityIndicator, KeyboardAvoidingView, ScrollView } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

interface DeleteAccountModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  userEmail: string;
}

export default function DeleteAccountModal({ visible, onClose, onConfirm, userEmail }: DeleteAccountModalProps) {
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleClose = () => {
    setConfirmText('');
    setIsDeleting(false);
    onClose();
  };

  const handleConfirmDelete = async () => {
    if (confirmText.toUpperCase() !== 'DELETE') {
      const message = 'Please type DELETE to confirm';
      if (Platform.OS === 'web') {
        alert(message);
      } else {
        Alert.alert('Error', message);
      }
      return;
    }

    setIsDeleting(true);
    try {
      await onConfirm();
      handleClose();
    } catch (error: any) {
      setIsDeleting(false);
      const errorMessage = error.message || 'Failed to schedule deletion';
      if (Platform.OS === 'web') {
        alert(`Error: ${errorMessage}`);
      } else {
        Alert.alert('Error', errorMessage);
      }
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.modalContainer}>
            {/* Warning */}
            <View style={styles.header}>
              <FontAwesome name="exclamation-triangle" size={48} color="#dc2626" />
            </View>

            <Text style={styles.title}>Schedule Account Deletion?</Text>
            
            <Text style={styles.description}>
              Your account will be <Text style={styles.boldText}>scheduled for deletion in 30 days</Text>. 
              You can cancel anytime by signing in again. After 30 days, all your data will be permanently deleted:
            </Text>

            <View style={styles.dataList}>
              <View style={styles.dataItem}>
                <FontAwesome name="circle" size={6} color="#64748b" />
                <Text style={styles.dataText}>Your account information (email, display name)</Text>
              </View>
              <View style={styles.dataItem}>
                <FontAwesome name="circle" size={6} color="#64748b" />
                <Text style={styles.dataText}>Your profile data (PR date, immigration status)</Text>
              </View>
              <View style={styles.dataItem}>
                <FontAwesome name="circle" size={6} color="#64748b" />
                <Text style={styles.dataText}>All travel history and absence records</Text>
              </View>
              <View style={styles.dataItem}>
                <FontAwesome name="circle" size={6} color="#64748b" />
                <Text style={styles.dataText}>Physical presence records in Canada</Text>
              </View>
              <View style={styles.dataItem}>
                <FontAwesome name="circle" size={6} color="#64748b" />
                <Text style={styles.dataText}>All analytics and usage data</Text>
              </View>
            </View>

            <View style={styles.warningBox}>
              <FontAwesome name="info-circle" size={16} color="#3b82f6" />
              <Text style={styles.warningText}>
                You'll have 30 days to cancel by signing in again. After 30 days, your account will be permanently deleted.
              </Text>
            </View>

            <Text style={styles.confirmInstruction}>
              Type <Text style={styles.boldText}>DELETE</Text> below to confirm:
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Type DELETE"
              value={confirmText}
              onChangeText={setConfirmText}
              autoCapitalize="characters"
              autoCorrect={false}
              editable={!isDeleting}
            />

            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={[styles.button, styles.continueButton, (isDeleting || confirmText.toUpperCase() !== 'DELETE') && styles.continueButtonDisabled]} 
                onPress={handleConfirmDelete}
                disabled={isDeleting || confirmText.toUpperCase() !== 'DELETE'}
              >
                {isDeleting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.continueButtonText}>Continue</Text>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.button, styles.cancelButton]} 
                onPress={handleClose}
                disabled={isDeleting}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    maxWidth: 500,
    width: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#475569',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 24,
  },
  boldText: {
    fontWeight: '700',
    color: '#1e293b',
  },
  dataList: {
    marginBottom: 16,
  },
  dataItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    paddingLeft: 8,
  },
  dataText: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: '#dbeafe',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
    marginBottom: 24,
  },
  warningText: {
    fontSize: 13,
    color: '#1e3a8a',
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
  confirmInstruction: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 12,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 24,
    backgroundColor: '#fff',
  },
  buttonContainer: {
    gap: 12,
  },
  button: {
    width: '100%',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButton: {
    backgroundColor: '#dc2626',
  },
  continueButtonDisabled: {
    backgroundColor: '#fca5a5',
    opacity: 0.5,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  cancelButton: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#475569',
  },
});
