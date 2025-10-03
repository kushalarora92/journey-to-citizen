import { StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';

import EditScreenInfo from '@/components/EditScreenInfo';
import { Text, View } from '@/components/Themed';
import { useAuth } from '@/context/AuthContext';

export default function TabTwoScreen() {
  const { user, sendVerificationEmail } = useAuth();

  const handleResendVerification = async () => {
    try {
      await sendVerificationEmail();
      Alert.alert('Success', 'Verification email sent! Please check your inbox.');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send verification email');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.title}>Profile</Text>
        <View style={styles.infoBox}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{user?.email}</Text>
        </View>
        <View style={styles.infoBox}>
          <Text style={styles.label}>Email Verified</Text>
          <Text style={styles.value}>{user?.emailVerified ? '✓ Yes' : '✗ No'}</Text>
        </View>
        {!user?.emailVerified && (
          <TouchableOpacity
            style={styles.button}
            onPress={handleResendVerification}
          >
            <Text style={styles.buttonText}>Resend Verification Email</Text>
          </TouchableOpacity>
        )}
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
  label: {
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.7,
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
  },
  button: {
    backgroundColor: '#3b82f6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
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
