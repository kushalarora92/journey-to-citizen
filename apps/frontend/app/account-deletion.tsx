import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { View, Text, Heading } from '@gluestack-ui/themed';
import DeletionScheduledBanner from '@/components/DeletionScheduledBanner';
import { useAuth } from '@/context/AuthContext';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';

export default function AccountDeletionScreen() {
  const { userProfile } = useAuth();
  const colorScheme = useColorScheme();

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: Colors[colorScheme].background }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <Heading size="xl" style={styles.title}>
          Account Scheduled for Deletion
        </Heading>
        <Text size="md" style={styles.description}>
          Your account is scheduled to be permanently deleted. 
          You can cancel this request below.
        </Text>
      </View>

      {userProfile?.deletionExecutionDate && (
        <DeletionScheduledBanner deletionDate={userProfile.deletionExecutionDate} />
      )}

      <View style={styles.infoSection}>
        <Heading size="md" style={styles.sectionTitle}>
          What happens next?
        </Heading>
        <Text size="sm" style={styles.infoText}>
          • Your account will be deleted on the scheduled date
        </Text>
        <Text size="sm" style={styles.infoText}>
          • All your data will be permanently removed
        </Text>
        <Text size="sm" style={styles.infoText}>
          • You can cancel anytime before the deletion date
        </Text>
        <Text size="sm" style={styles.infoText}>
          • After cancellation, you'll regain full access to your account
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    marginBottom: 12,
  },
  description: {
    color: '#64748b',
    lineHeight: 22,
  },
  infoSection: {
    marginTop: 32,
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sectionTitle: {
    marginBottom: 16,
  },
  infoText: {
    color: '#475569',
    marginBottom: 8,
    lineHeight: 20,
  },
});
