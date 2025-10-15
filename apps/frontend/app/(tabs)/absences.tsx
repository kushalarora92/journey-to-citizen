import React, { useMemo } from 'react';
import { StyleSheet, ScrollView, Alert, Platform, TouchableOpacity, Pressable } from 'react-native';
import { View, Text, VStack, HStack } from '@gluestack-ui/themed';
import { useAuth } from '@/context/AuthContext';
import { useFirebaseFunctions } from '@/hooks/useFirebaseFunctions';
import { useAnalytics, useScreenTracking } from '@/hooks/useAnalytics';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import DateRangeList, { DateRangeEntry } from '@/components/DateRangeList';
import { AbsenceEntry } from '@journey-to-citizen/types';
import { 
  findOverlappingRanges, 
  formatOverlappingRangesMessage,
  formatDateForDisplay 
} from '@/utils/dateRangeValidation';

export default function AbsencesScreen() {
  const { userProfile, profileLoading, updateLocalProfile } = useAuth();
  const { updateUserProfile } = useFirebaseFunctions();
  const { trackEvent } = useAnalytics();
  
  // Track screen view
  useScreenTracking('Travel Absences');
  
  // Helper function for consistent tracking
  const trackAbsencesAction = (action: string, params?: Record<string, any>) => {
    trackEvent('absences_action', {
      action,
      screen: 'Travel Absences',
      ...params,
    });
  };

  if (profileLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading your travel history...</Text>
        </View>
      </View>
    );
  }

  const absences = userProfile?.travelAbsences || [];
  
  // Separate past, current, and future trips - use useMemo to recalculate when absences change
  const { pastTrips, currentTrips, upcomingTrips } = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Reset to start of day for accurate comparison
    
    const past = absences.filter(absence => {
      if (!absence.from || !absence.to) return false;
      const toDate = new Date(absence.to + 'T00:00:00.000Z');
      return toDate < now; // Ended before today
    });
    
    const current = absences.filter(absence => {
      if (!absence.from || !absence.to) return false;
      const fromDate = new Date(absence.from + 'T00:00:00.000Z');
      const toDate = new Date(absence.to + 'T00:00:00.000Z');
      return fromDate <= now && toDate >= now; // Started on/before today AND ends on/after today
    });
    
    const upcoming = absences.filter(absence => {
      if (!absence.from) return false;
      const fromDate = new Date(absence.from + 'T00:00:00.000Z');
      return fromDate > now; // Starts after today
    });
    
    return { pastTrips: past, currentTrips: current, upcomingTrips: upcoming };
  }, [absences]);

  // Handlers for absence entries
  const handleAddAbsence = async (entry: Omit<DateRangeEntry, 'id'>) => {
    try {
      trackAbsencesAction('add_trip_attempt', {
        has_destination: !!(entry as any).place,
        from_date: entry.from,
        to_date: entry.to,
      });
      
      const currentAbsences = userProfile?.travelAbsences || [];
      
      // Check for overlaps and warn user (but allow them to continue)
      const newRange = { from: entry.from, to: entry.to };
      const overlapping = findOverlappingRanges(newRange, currentAbsences);
      
      if (overlapping.length > 0) {
        // Overlapping dates - show warning and ask for confirmation
        const message = `Note: This trip overlaps with existing trip(s):\n\n${formatOverlappingRangesMessage(overlapping)}\n\nDon't worry - overlapping days will only be counted once in your eligibility calculation.\n\nDo you want to add this trip?`;
        
        const shouldContinue = await new Promise<boolean>((resolve) => {
          if (Platform.OS === 'web') {
            resolve(confirm(message));
          } else {
            Alert.alert(
              'Overlapping Dates Detected',
              message,
              [
                { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
                { text: 'Add Trip', onPress: () => resolve(true) }
              ]
            );
          }
        });
        
        if (!shouldContinue) {
          trackAbsencesAction('add_trip_cancelled', { reason: 'overlap_warning' });
          return;
        }
        
        trackAbsencesAction('add_trip_confirmed_despite_overlap', {
          overlapping_count: overlapping.length,
        });
      }
      
      const newEntry = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        from: entry.from,
        to: entry.to,
        place: (entry as any).place || '',
      } as AbsenceEntry;
      
      const result = await updateUserProfile({
        travelAbsences: [...currentAbsences, newEntry],
      });
      
      if (result.data) {
        updateLocalProfile(result.data);
        trackAbsencesAction('add_trip_success', {
          trip_id: newEntry.id,
          has_destination: !!newEntry.place,
        });
      }
    } catch (error: any) {
      trackAbsencesAction('add_trip_error', { error: error.message });
      throw new Error(error.message || 'Failed to add trip');
    }
  };

  const handleEditAbsence = async (id: string, updates: Partial<DateRangeEntry>) => {
    try {
      trackAbsencesAction('edit_trip_attempt', {
        trip_id: id,
        updated_fields: Object.keys(updates),
      });
      
      const currentAbsences = userProfile?.travelAbsences || [];
      const updatedAbsences = currentAbsences.map(entry =>
        entry.id === id ? { ...entry, ...updates } : entry
      );
      
      const result = await updateUserProfile({
        travelAbsences: updatedAbsences,
      });
      
      if (result.data) {
        updateLocalProfile(result.data);
        trackAbsencesAction('edit_trip_success', { trip_id: id });
      }
    } catch (error: any) {
      trackAbsencesAction('edit_trip_error', { trip_id: id, error: error.message });
      throw new Error(error.message || 'Failed to update trip');
    }
  };

  const handleDeleteAbsence = async (id: string) => {
    try {
      trackAbsencesAction('delete_trip_attempt', { trip_id: id });
      
      const currentAbsences = userProfile?.travelAbsences || [];
      const updatedAbsences = currentAbsences.filter(entry => entry.id !== id);
      
      const result = await updateUserProfile({
        travelAbsences: updatedAbsences,
      });
      
      if (result.data) {
        updateLocalProfile(result.data);
        trackAbsencesAction('delete_trip_success', { trip_id: id });
      }
    } catch (error: any) {
      trackAbsencesAction('delete_trip_error', { trip_id: id, error: error.message });
      throw new Error(error.message || 'Failed to delete trip');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <VStack space="lg">
          {/* Header */}
          <View>
            <HStack alignItems="center" mb="$2">
              <FontAwesome name="plane" size={24} color="#3b82f6" />
              <Text style={styles.title}>Travel Absences</Text>
            </HStack>
            <Text style={styles.subtitle}>
              Track all your trips outside Canada in the last 5 years (or since you landed in Canada) for accurate citizenship eligibility calculations.
            </Text>
          </View>

          {/* Info Card */}
          <Pressable 
            style={[styles.infoCard, { cursor: 'auto' }]}
            onPress={() => trackAbsencesAction('important_rules_click')}
          >
            <HStack space="sm" alignItems="flex-start">
              <FontAwesome name="info-circle" size={16} color="#3b82f6" style={{ marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.infoTitle}>Important Rules</Text>
                <Text style={styles.infoText}>
                  • Include ALL trips, even day trips to the US{'\n'}
                  • Day you left and returned count as days IN Canada{'\n'}
                  • Only full days outside count as absences{'\n'}
                  • You can add future trips to plan ahead
                </Text>
              </View>
            </HStack>
          </Pressable>

          {/* Current Trip Alert */}
          {currentTrips.length > 0 && (
            <View style={styles.currentCard}>
              <HStack space="sm" alignItems="center">
                <FontAwesome name="plane" size={18} color="#10b981" />
                <Text style={styles.currentText}>
                  You are currently on {currentTrips.length === 1 ? 'a trip' : `${currentTrips.length} trips`}
                </Text>
              </HStack>
            </View>
          )}

          {/* Upcoming Trips Alert */}
          {upcomingTrips.length > 0 && (
            <View style={styles.upcomingCard}>
              <HStack space="sm" alignItems="center">
                <FontAwesome name="calendar" size={18} color="#f59e0b" />
                <Text style={styles.upcomingText}>
                  You have {upcomingTrips.length} upcoming {upcomingTrips.length === 1 ? 'trip' : 'trips'} planned
                </Text>
              </HStack>
            </View>
          )}

          {/* Statistics */}
          {absences.length > 0 && (
            <View style={styles.statsCard}>
              <HStack justifyContent="space-around">
                <Pressable 
                  style={[styles.statItem, { cursor: 'auto' }]}
                  onPress={() => trackAbsencesAction('filter_click', { 
                    filter_type: 'Past', 
                    count: pastTrips.length 
                  })}
                >
                  <Text style={styles.statValue}>{pastTrips.length}</Text>
                  <Text style={styles.statLabel}>Past</Text>
                </Pressable>
                <View style={styles.statDivider} />
                <Pressable 
                  style={[styles.statItem, { cursor: 'auto' }]}
                  onPress={() => trackAbsencesAction('filter_click', { 
                    filter_type: 'Current', 
                    count: currentTrips.length 
                  })}
                >
                  <Text style={styles.statValue}>{currentTrips.length}</Text>
                  <Text style={styles.statLabel}>Current</Text>
                </Pressable>
                <View style={styles.statDivider} />
                <Pressable 
                  style={[styles.statItem, { cursor: 'auto' }]}
                  onPress={() => trackAbsencesAction('filter_click', {
                    filter_type: 'Upcoming',
                    count: upcomingTrips.length 
                  })}
                >
                  <Text style={styles.statValue}>{upcomingTrips.length}</Text>
                  <Text style={styles.statLabel}>Upcoming</Text>
                </Pressable>
                <View style={styles.statDivider} />
                <Pressable 
                  style={[styles.statItem, { cursor: 'auto' }]}
                  onPress={() => trackAbsencesAction('filter_click', {
                    filter_type: 'Total',
                    count: absences.length 
                  })}
                >
                  <Text style={styles.statValue}>{absences.length}</Text>
                  <Text style={styles.statLabel}>Total</Text>
                </Pressable>
              </HStack>
            </View>
          )}

          {/* Date Range List */}
          <View style={styles.listContainer}>
            <DateRangeList
              entries={absences}
              onAdd={handleAddAbsence}
              onEdit={handleEditAbsence}
              onDelete={handleDeleteAbsence}
              title="All Travel Absences"
              emptyMessage="No trips recorded yet. Add your first trip to start tracking."
              fields={[
                {
                  name: 'place',
                  label: 'Destination',
                  type: 'text',
                  required: false,
                  note: 'Country or city you visited (optional)',
                },
              ]}
              allowFutureDates={true}
              startDateLabel="Departure Date"
              startDateNote="Day you departed from Canada (day included)"
              endDateLabel="Return Date"
              endDateNote="Day you arrived back in Canada (day included)"
              showAbsentDays={true}
            />
          </View>

          {/* Bottom Info */}
          <Pressable 
            style={[styles.bottomNote, { cursor: 'auto' }]}
            onPress={() => trackAbsencesAction('tip_section_click')}
          >
            <Text style={styles.bottomNoteText}>
              💡 Tip: Add trips as soon as you book them to keep your eligibility date accurate.
            </Text>
          </Pressable>
        </VStack>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  section: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginLeft: 12,
    color: '#1e293b',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  infoCard: {
    backgroundColor: '#eff6ff',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 20,
  },
  currentCard: {
    backgroundColor: '#d1fae5',
    padding: 14,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  currentText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#065f46',
  },
  upcomingCard: {
    backgroundColor: '#fef3c7',
    padding: 14,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  upcomingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#78350f',
  },
  statsCard: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e2e8f0',
  },
  listContainer: {
    marginTop: 8,
  },
  bottomNote: {
    padding: 16,
    backgroundColor: '#f0fdf4',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#86efac',
  },
  bottomNoteText: {
    fontSize: 13,
    color: '#166534',
    lineHeight: 18,
  },
});
