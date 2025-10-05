import { StyleSheet, ScrollView } from 'react-native';

import EditScreenInfo from '@/components/EditScreenInfo';
import { Text, View } from '@/components/Themed';
import { useAuth } from '@/context/AuthContext';

export default function TabOneScreen() {
  const { user, userProfile, profileLoading } = useAuth();

  // Get display name or fallback to email
  const displayName = userProfile?.displayName || user?.email?.split('@')[0] || 'User';

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          Welcome, {profileLoading ? '...' : displayName}!
        </Text>
        {!user?.emailVerified && (
          <View style={styles.warningBox}>
            <Text style={styles.warningText}>
              ⚠️ Please verify your email to access all features
            </Text>
          </View>
        )}
      </View>
      <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
      <EditScreenInfo path="app/(tabs)/index.tsx" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    marginTop: 8,
    opacity: 0.7,
  },
  warningBox: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#fef3c7',
    borderRadius: 8,
  },
  warningText: {
    color: '#92400e',
    fontSize: 14,
  },
  separator: {
    marginVertical: 20,
    height: 1,
    width: '90%',
    alignSelf: 'center',
  },
});
