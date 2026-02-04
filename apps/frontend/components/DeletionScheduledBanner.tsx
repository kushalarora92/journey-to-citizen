import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Platform, ActivityIndicator } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFirebaseFunctions } from '@/hooks/useFirebaseFunctions';
import { useAuth } from '@/context/AuthContext';
import { useAnalytics } from '@/hooks/useAnalytics';
import { getAuth, signOut } from 'firebase/auth';

interface DeletionScheduledBannerProps {
  deletionDate: string; // ISO date string (YYYY-MM-DD)
}

export default function DeletionScheduledBanner({ deletionDate }: DeletionScheduledBannerProps) {
  const [isCancelling, setIsCancelling] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { cancelAccountDeletion } = useFirebaseFunctions();
  const { refreshUserProfile } = useAuth();
  const { trackEvent } = useAnalytics();

  // Calculate days remaining
  const calculateDaysRemaining = () => {
    const today = new Date();
    const deletion = new Date(deletionDate);
    const diffTime = deletion.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const daysRemaining = calculateDaysRemaining();

  const handleCancelDeletion = async () => {
    trackEvent('cancel_deletion_click', {
      days_remaining: daysRemaining,
      deletion_date: deletionDate,
    });

    const confirmMessage = `Are you sure you want to cancel the scheduled deletion and reactivate your account?`;
    
    const confirmed = Platform.OS === 'web' 
      ? window.confirm(confirmMessage)
      : await new Promise<boolean>((resolve) => {
          Alert.alert(
            'Cancel Deletion',
            confirmMessage,
            [
              { text: 'No', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Yes, Reactivate', onPress: () => resolve(true) },
            ]
          );
        });

    if (!confirmed) {
      return;
    }

    setIsCancelling(true);
    try {
      const result = await cancelAccountDeletion();
      
      if (result.success) {
        trackEvent('cancel_deletion_success', {
          days_remaining: daysRemaining,
        });

        // Refresh user profile to update deletion status
        await refreshUserProfile();

        const successMessage = 'Account reactivated successfully!';
        if (Platform.OS === 'web') {
          alert(successMessage);
        } else {
          Alert.alert('Success', successMessage);
        }
      }
    } catch (error: any) {
      trackEvent('cancel_deletion_error', {
        error: error.message,
        days_remaining: daysRemaining,
      });

      const errorMessage = error.message || 'Failed to cancel account deletion';
      if (Platform.OS === 'web') {
        alert(`Error: ${errorMessage}`);
      } else {
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setIsCancelling(false);
    }
  };

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      const auth = getAuth();
      await signOut(auth);
      trackEvent('logout', { source: 'deletion_banner' });
    } catch (error: any) {
      console.error('Error logging out:', error);
      const errorMessage = 'Failed to log out. Please try again.';
      if (Platform.OS === 'web') {
        alert(`Error: ${errorMessage}`);
      } else {
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <View style={styles.banner}>
      <View style={styles.iconContainer}>
        <FontAwesome name="exclamation-triangle" size={24} color="#dc2626" />
      </View>
      
      <View style={styles.content}>
        <Text style={styles.title}>Account Scheduled for Deletion</Text>
        <Text style={styles.message}>
          Your account will be permanently deleted in{' '}
          <Text style={styles.boldText}>{daysRemaining} day{daysRemaining !== 1 ? 's' : ''}</Text>
          {' '}on {new Date(deletionDate).toLocaleDateString()}.
        </Text>
        <Text style={styles.subMessage}>
          All your data will be lost. Cancel now to keep your account.
        </Text>
      </View>

      <TouchableOpacity 
        style={[styles.cancelButton, isCancelling && styles.cancelButtonDisabled]}
        onPress={handleCancelDeletion}
        disabled={isCancelling}
      >
        {isCancelling ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <>
            <FontAwesome name="undo" size={16} color="#fff" />
            <Text style={styles.cancelButtonText}>Cancel Deletion</Text>
          </>
        )}
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.logoutButton, isLoggingOut && styles.logoutButtonDisabled]}
        onPress={handleLogout}
        disabled={isLoggingOut}
      >
        {isLoggingOut ? (
          <ActivityIndicator color="#6b7280" size="small" />
        ) : (
          <>
            <FontAwesome name="sign-out" size={16} color="#6b7280" />
            <Text style={styles.logoutButtonText}>Logout</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#fee2e2',
    borderWidth: 2,
    borderColor: '#dc2626',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    flexDirection: 'column',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  content: {
    flex: 1,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#991b1b',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: '#7f1d1d',
    marginBottom: 6,
    lineHeight: 20,
  },
  boldText: {
    fontWeight: '700',
  },
  subMessage: {
    fontSize: 13,
    color: '#991b1b',
    fontStyle: 'italic',
  },
  cancelButton: {
    backgroundColor: '#16a34a',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  cancelButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  logoutButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  logoutButtonDisabled: {
    opacity: 0.5,
  },
  logoutButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
});
