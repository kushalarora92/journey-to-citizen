import React, { useState, useMemo } from 'react';
import { StyleSheet, ScrollView, Alert, Platform, TouchableOpacity, Pressable, Modal, TextInput } from 'react-native';
import { View, Text, VStack, HStack } from '@gluestack-ui/themed';
import { useAuth } from '@/context/AuthContext';
import { useFirebaseFunctions } from '@/hooks/useFirebaseFunctions';
import { useAnalytics, useScreenTracking } from '@/hooks/useAnalytics';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import DateTimePicker from '@react-native-community/datetimepicker';
import WebDateInput from '@/components/WebDateInput';
import { useColorScheme } from '@/components/useColorScheme';
import { 
  AbsenceEntry, 
  StatusEntry, 
  StatusType, 
  STATUS_TYPE_LABELS,
  getCurrentStatus,
  hasPRStatus,
} from '@journey-to-citizen/types';
import { formatDateForDisplay } from '@/utils/dateRangeValidation';

// Timeline event type
type TimelineEventType = 'status' | 'trip';

interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  date: string; // ISO date string for sorting
  status?: StatusType;
  statusEnd?: string;
  tripFrom?: string;
  tripTo?: string;
  tripPlace?: string;
}

// Status colors for visual distinction - very subtle, sophisticated palette
const STATUS_COLORS: Record<StatusType, { bg: string; border: string; text: string; dot: string }> = {
  visitor: { bg: '#fffbf5', border: '#fde68a', text: '#92400e', dot: '#f59e0b' },
  study_permit: { bg: '#f8faff', border: '#bfdbfe', text: '#1e3a8a', dot: '#3b82f6' },
  work_permit: { bg: '#f7fef9', border: '#bbf7d0', text: '#14532d', dot: '#22c55e' },
  protected_person: { bg: '#faf8ff', border: '#e9d5ff', text: '#581c87', dot: '#a855f7' },
  permanent_resident: { bg: '#fef8fb', border: '#fbcfe8', text: '#831843', dot: '#ec4899' },
};

export default function TimelineScreen() {
  const { userProfile, profileLoading, updateLocalProfile } = useAuth();
  const { updateUserProfile } = useFirebaseFunctions();
  const { trackEvent } = useAnalytics();
  const colorScheme = useColorScheme();
  
  // Track screen view
  useScreenTracking('Timeline');
  
  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'status' | 'trip'>('trip');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form states
  const [selectedStatus, setSelectedStatus] = useState<StatusType>('work_permit');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [tripPlace, setTripPlace] = useState('');
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  // Helper function for consistent tracking
  const trackTimelineAction = (action: string, params?: Record<string, any>) => {
    trackEvent('timeline_action', {
      action,
      screen: 'Timeline',
      ...params,
    });
  };

  // Build unified timeline from status history and travel absences
  const timelineEvents = useMemo(() => {
    const events: TimelineEvent[] = [];
    
    // Add status entries
    const statusHistory = userProfile?.statusHistory || [];
    statusHistory.forEach(status => {
      events.push({
        id: `status-${status.id}`,
        type: 'status',
        date: status.from,
        status: status.status,
        statusEnd: status.to,
      });
    });
    
    // Add travel absences
    const absences = userProfile?.travelAbsences || [];
    absences.forEach(absence => {
      events.push({
        id: `trip-${absence.id}`,
        type: 'trip',
        date: absence.from,
        tripFrom: absence.from,
        tripTo: absence.to,
        tripPlace: absence.place,
      });
    });
    
    // Sort by date (newest first)
    return events.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateB - dateA;
    });
  }, [userProfile?.statusHistory, userProfile?.travelAbsences]);

  // Get current status for inference
  const currentStatus = getCurrentStatus(userProfile);
  const userHasPR = hasPRStatus(userProfile);

  // Format date helpers
  const formatDate = (dateStr: string | undefined): string => {
    if (!dateStr) return 'Present';
    return formatDateForDisplay(dateStr);
  };

  const calculateDuration = (from: string, to?: string): string => {
    const fromDate = new Date(from);
    const toDate = to ? new Date(to) : new Date();
    
    const diffTime = toDate.getTime() - fromDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Same day';
    if (diffDays === 1) return '1 day';
    if (diffDays < 30) return `${diffDays} days`;
    if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} month${months > 1 ? 's' : ''}`;
    }
    
    const years = Math.floor(diffDays / 365);
    const remainingMonths = Math.floor((diffDays % 365) / 30);
    
    if (remainingMonths === 0) return `${years} year${years > 1 ? 's' : ''}`;
    return `${years} year${years > 1 ? 's' : ''}, ${remainingMonths} month${remainingMonths > 1 ? 's' : ''}`;
  };

  const calculateAbsentDays = (from: string, to: string): number => {
    const fromDate = new Date(from + 'T00:00:00.000Z');
    const toDate = new Date(to + 'T00:00:00.000Z');
    const diffTime = toDate.getTime() - fromDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays - 1); // Subtract 1 because departure and return days don't count
  };

  // Modal handlers
  const handleOpenAddTrip = () => {
    trackTimelineAction('open_add_trip');
    setModalType('trip');
    setEditingId(null);
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    setStartDate(dateStr);
    setEndDate(dateStr);
    setTripPlace('');
    setModalVisible(true);
  };

  const handleOpenAddStatus = () => {
    trackTimelineAction('open_add_status');
    setModalType('status');
    setEditingId(null);
    setSelectedStatus('work_permit');
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    setStartDate(dateStr);
    setEndDate('');
    setModalVisible(true);
  };

  const handleOpenEditTrip = (event: TimelineEvent) => {
    trackTimelineAction('open_edit_trip', { trip_id: event.id });
    setModalType('trip');
    setEditingId(event.id.replace('trip-', ''));
    setStartDate(event.tripFrom!);
    setEndDate(event.tripTo!);
    setTripPlace(event.tripPlace || '');
    setModalVisible(true);
  };

  const handleOpenEditStatus = (event: TimelineEvent) => {
    trackTimelineAction('open_edit_status', { status_id: event.id });
    setModalType('status');
    setEditingId(event.id.replace('status-', ''));
    setSelectedStatus(event.status!);
    setStartDate(event.date);
    setEndDate(event.statusEnd || '');
    setModalVisible(true);
  };

  const handleClose = () => {
    setModalVisible(false);
    setEditingId(null);
    setShowStartPicker(false);
    setShowEndPicker(false);
  };

  const handleDeleteTrip = async (id: string) => {
    const confirm = await new Promise<boolean>((resolve) => {
      if (Platform.OS === 'web') {
        resolve(window.confirm('Are you sure you want to delete this trip?'));
      } else {
        Alert.alert(
          'Delete Trip',
          'Are you sure you want to delete this trip?',
          [
            { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
            { text: 'Delete', style: 'destructive', onPress: () => resolve(true) }
          ]
        );
      }
    });

    if (confirm) {
      try {
        trackTimelineAction('delete_trip_attempt', { trip_id: id });
        const currentAbsences = userProfile?.travelAbsences || [];
        const updatedAbsences = currentAbsences.filter(entry => entry.id !== id);
        
        const result = await updateUserProfile({
          travelAbsences: updatedAbsences,
        });
        
        if (result.data) {
          updateLocalProfile(result.data);
          trackTimelineAction('delete_trip_success', { trip_id: id });
        }
      } catch (error: any) {
        trackTimelineAction('delete_trip_error', { trip_id: id, error: error.message });
        const message = error.message || 'Failed to delete trip';
        Platform.OS === 'web' ? alert(message) : Alert.alert('Error', message);
      }
    }
  };

  const handleDeleteStatus = async (id: string) => {
    const confirm = await new Promise<boolean>((resolve) => {
      if (Platform.OS === 'web') {
        resolve(window.confirm('Are you sure you want to delete this status entry?'));
      } else {
        Alert.alert(
          'Delete Status',
          'Are you sure you want to delete this status entry?',
          [
            { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
            { text: 'Delete', style: 'destructive', onPress: () => resolve(true) }
          ]
        );
      }
    });

    if (confirm) {
      try {
        trackTimelineAction('delete_status_attempt', { status_id: id });
        const currentStatuses = userProfile?.statusHistory || [];
        const updatedStatuses = currentStatuses.filter(entry => entry.id !== id);
        
        const result = await updateUserProfile({
          statusHistory: updatedStatuses,
        });
        
        if (result.data) {
          updateLocalProfile(result.data);
          trackTimelineAction('delete_status_success', { status_id: id });
        }
      } catch (error: any) {
        trackTimelineAction('delete_status_error', { status_id: id, error: error.message });
        const message = error.message || 'Failed to delete status';
        Platform.OS === 'web' ? alert(message) : Alert.alert('Error', message);
      }
    }
  };

  const handleSave = async () => {
    // Validation
    if (!startDate) {
      const message = 'Please select a start date';
      Platform.OS === 'web' ? alert(message) : Alert.alert('Required', message);
      return;
    }

    if (modalType === 'trip' && !endDate) {
      const message = 'Please select a return date for your trip';
      Platform.OS === 'web' ? alert(message) : Alert.alert('Required', message);
      return;
    }

    if (endDate && startDate > endDate) {
      const message = 'Start date must be before end date';
      Platform.OS === 'web' ? alert(message) : Alert.alert('Invalid Dates', message);
      return;
    }

    setIsSaving(true);
    try {
      const startDateStr = startDate;
      const endDateStr = endDate || undefined;

      if (modalType === 'trip') {
        trackTimelineAction(editingId ? 'edit_trip_attempt' : 'add_trip_attempt', {
          trip_id: editingId,
          has_destination: !!tripPlace,
        });
        
        const currentAbsences = userProfile?.travelAbsences || [];
        
        if (editingId) {
          // Edit existing trip
          const updatedAbsences = currentAbsences.map(entry =>
            entry.id === editingId 
              ? { ...entry, from: startDateStr, to: endDateStr!, place: tripPlace }
              : entry
          );
          
          const result = await updateUserProfile({
            travelAbsences: updatedAbsences,
          });
          
          if (result.data) {
            updateLocalProfile(result.data);
            trackTimelineAction('edit_trip_success', { trip_id: editingId });
          }
        } else {
          // Add new trip
          const newEntry: AbsenceEntry = {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            from: startDateStr,
            to: endDateStr!,
            place: tripPlace,
          };
          
          const result = await updateUserProfile({
            travelAbsences: [...currentAbsences, newEntry],
          });
          
          if (result.data) {
            updateLocalProfile(result.data);
            trackTimelineAction('add_trip_success', { trip_id: newEntry.id });
          }
        }
      } else {
        // Status
        trackTimelineAction(editingId ? 'edit_status_attempt' : 'add_status_attempt', {
          status_id: editingId,
          status_type: selectedStatus,
        });
        
        const currentStatuses = userProfile?.statusHistory || [];
        
        if (editingId) {
          // Edit existing status
          const updatedStatuses = currentStatuses.map(entry =>
            entry.id === editingId 
              ? { ...entry, status: selectedStatus, from: startDateStr, to: endDateStr }
              : entry
          );
          
          const result = await updateUserProfile({
            statusHistory: updatedStatuses,
          });
          
          if (result.data) {
            updateLocalProfile(result.data);
            trackTimelineAction('edit_status_success', { status_id: editingId });
          }
        } else {
          // Add new status - automatically end the previous current status
          const updatedStatuses = currentStatuses.map(entry => {
            // If this is a current status (no end date) and it's different from the new status
            if (!entry.to) {
              // Calculate end date: one day before new status starts
              const newStatusDate = new Date(startDateStr + 'T00:00:00');
              newStatusDate.setDate(newStatusDate.getDate() - 1);
              const year = newStatusDate.getFullYear();
              const month = String(newStatusDate.getMonth() + 1).padStart(2, '0');
              const day = String(newStatusDate.getDate()).padStart(2, '0');
              const previousEndDate = `${year}-${month}-${day}`;
              
              // Only set end date if it's after the start date
              if (previousEndDate >= entry.from) {
                return { ...entry, to: previousEndDate };
              }
            }
            return entry;
          });
          
          const newEntry: StatusEntry = {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            status: selectedStatus,
            from: startDateStr,
            to: endDateStr,
          };
          
          const result = await updateUserProfile({
            statusHistory: [...updatedStatuses, newEntry],
          });
          
          if (result.data) {
            updateLocalProfile(result.data);
            trackTimelineAction('add_status_success', { status_id: newEntry.id });
          }
        }
      }

      handleClose();
    } catch (error: any) {
      const action = modalType === 'trip' 
        ? (editingId ? 'edit_trip_error' : 'add_trip_error')
        : (editingId ? 'edit_status_error' : 'add_status_error');
      trackTimelineAction(action, { error: error.message });
      
      const message = error.message || `Failed to ${editingId ? 'update' : 'add'} ${modalType}`;
      Platform.OS === 'web' ? alert(message) : Alert.alert('Error', message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChange = async () => {
    trackTimelineAction('got_pr_click');
    setModalType('status');
    setEditingId(null);
    setSelectedStatus('permanent_resident');
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    setStartDate(dateStr);
    setEndDate('');
    setModalVisible(true);
  };

  if (profileLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading your timeline...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <ScrollView style={styles.container}>
        <View style={styles.section}>
        <VStack space="lg">
          {/* Header */}
          <View>
            <HStack alignItems="center" mb="$2">
              <FontAwesome name="history" size={24} color="#3b82f6" />
              <Text style={styles.title}>Immigration Timeline</Text>
            </HStack>
            <Text style={styles.subtitle}>
              Track your complete journey in Canada. Immigration status changes and travel absences all in one place.
            </Text>
          </View>

          {/* Info Card */}
          <View style={styles.infoCard}>
            <HStack space="sm" alignItems="flex-start">
              <FontAwesome name="info-circle" size={16} color="#3b82f6" style={{ marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.infoTitle}>Quick Guide</Text>
                <Text style={styles.infoText}>
                  • Add your immigration statuses (visitor, work/study permit, PR){'\n'}
                  • Track ALL trips outside Canada (even day trips){'\n'}
                  • Day you left and returned count as days IN Canada{'\n'}
                  • Current status is inferred from your timeline
                </Text>
              </View>
            </HStack>
          </View>

          {/* Quick Actions */}
          <HStack space="md">
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={handleOpenAddTrip}
            >
              <FontAwesome name="plane" size={18} color="#3b82f6" />
              <Text style={styles.quickActionText}>Add Trip</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={handleOpenAddStatus}
            >
              <FontAwesome name="flag" size={18} color="#22c55e" />
              <Text style={styles.quickActionText}>Add Status</Text>
            </TouchableOpacity>
          </HStack>

          {/* Timeline */}
          {timelineEvents.length === 0 ? (
            <View style={styles.emptyState}>
              <FontAwesome name="calendar-o" size={48} color="#94a3b8" />
              <Text style={styles.emptyText}>Your journey starts here</Text>
              <Text style={styles.emptySubtext}>Add your immigration status and travel history</Text>
            </View>
          ) : (
            <View style={styles.timeline}>
              {timelineEvents.map((event, index) => {
                const isExpanded = expandedId === event.id;
                
                if (event.type === 'status') {
                  const colors = STATUS_COLORS[event.status!];
                  const isCurrent = !event.statusEnd;
                  
                  return (
                    <View key={event.id} style={styles.timelineItem}>
                      {/* Timeline connector */}
                      <View style={styles.timelineConnector}>
                        <View style={[
                          styles.timelineDot,
                          { backgroundColor: colors.dot }
                        ]} />
                        {index < timelineEvents.length - 1 && (
                          <View style={styles.timelineLine} />
                        )}
                      </View>
                      
                      {/* Status Content */}
                      <TouchableOpacity
                        style={[
                          styles.timelineContent,
                          styles.statusContent,
                          { 
                            backgroundColor: colors.bg,
                            borderLeftWidth: 3,
                            borderLeftColor: colors.dot,
                            borderTopWidth: 0,
                            borderRightWidth: 0,
                            borderBottomWidth: 0,
                          }
                        ]}
                        onPress={() => setExpandedId(isExpanded ? null : event.id)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.statusHeader}>
                          <View style={styles.statusHeaderLeft}>
                            <Text style={[styles.statusLabel, { color: colors.text }]}>
                              {STATUS_TYPE_LABELS[event.status!]}
                            </Text>
                            {isCurrent && (
                              <View style={[styles.currentBadge, { backgroundColor: colors.dot }]}>
                                <Text style={styles.currentBadgeText}>CURRENT</Text>
                              </View>
                            )}
                          </View>
                          <FontAwesome 
                            name={isExpanded ? "chevron-up" : "chevron-down"} 
                            size={12} 
                            color={colors.text} 
                          />
                        </View>
                        
                        <Text style={[styles.dateText, { color: colors.text }]}>
                          {formatDate(event.date)} — {formatDate(event.statusEnd)}
                        </Text>
                        
                        <Text style={[styles.durationText, { color: colors.text, opacity: 0.8 }]}>
                          {calculateDuration(event.date, event.statusEnd)}
                        </Text>
                        
                        {/* Expanded actions */}
                        {isExpanded && (
                          <View style={styles.expandedActions}>
                            <TouchableOpacity
                              style={styles.actionButton}
                              onPress={() => handleOpenEditStatus(event)}
                            >
                              <FontAwesome name="pencil" size={14} color="#3b82f6" />
                              <Text style={styles.actionButtonText}>Edit</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.actionButton}
                              onPress={() => handleDeleteStatus(event.id.replace('status-', ''))}
                            >
                              <FontAwesome name="trash" size={14} color="#ef4444" />
                              <Text style={[styles.actionButtonText, { color: '#ef4444' }]}>Delete</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </TouchableOpacity>
                    </View>
                  );
                } else {
                  // Trip
                  const absentDays = calculateAbsentDays(event.tripFrom!, event.tripTo!);
                  const isToday = new Date(event.tripFrom!).toDateString() === new Date().toDateString();
                  const isFuture = new Date(event.tripFrom!) > new Date();
                  
                  return (
                    <View key={event.id} style={styles.timelineItem}>
                      {/* Timeline connector */}
                      <View style={styles.timelineConnector}>
                        <View style={[
                          styles.timelineDot,
                          styles.tripDot,
                          { backgroundColor: isFuture ? '#f59e0b' : isToday ? '#10b981' : '#64748b' }
                        ]} />
                        {index < timelineEvents.length - 1 && (
                          <View style={styles.timelineLine} />
                        )}
                      </View>
                      
                      {/* Trip Content */}
                      <TouchableOpacity
                        style={[
                          styles.timelineContent,
                          styles.tripContent,
                          isFuture && { borderLeftColor: '#fbbf24', borderLeftWidth: 2 },
                          isToday && { borderLeftColor: '#22c55e', borderLeftWidth: 2 },
                        ]}
                        onPress={() => setExpandedId(isExpanded ? null : event.id)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.tripHeader}>
                          <View style={styles.tripHeaderLeft}>
                            <FontAwesome name="plane" size={13} color="#94a3b8" />
                            <Text style={styles.tripLabel}>
                              {event.tripPlace || 'Trip abroad'}
                            </Text>
                            {isFuture && (
                              <View style={styles.futureBadge}>
                                <Text style={styles.futureBadgeText}>UPCOMING</Text>
                              </View>
                            )}
                            {isToday && (
                              <View style={styles.todayBadge}>
                                <Text style={styles.todayBadgeText}>TODAY</Text>
                              </View>
                            )}
                          </View>
                          <FontAwesome 
                            name={isExpanded ? "chevron-up" : "chevron-down"} 
                            size={12} 
                            color="#64748b" 
                          />
                        </View>
                        
                        <Text style={styles.dateText}>
                          {formatDate(event.tripFrom!)} → {formatDate(event.tripTo!)}
                        </Text>
                        
                        <Text style={[styles.durationText, { opacity: 0.7 }]}>
                          {absentDays} {absentDays === 1 ? 'day' : 'days'} absent
                        </Text>
                        
                        {/* Expanded actions */}
                        {isExpanded && (
                          <View style={styles.expandedActions}>
                            <TouchableOpacity
                              style={styles.actionButton}
                              onPress={() => handleOpenEditTrip(event)}
                            >
                              <FontAwesome name="pencil" size={14} color="#3b82f6" />
                              <Text style={styles.actionButtonText}>Edit</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.actionButton}
                              onPress={() => handleDeleteTrip(event.id.replace('trip-', ''))}
                            >
                              <FontAwesome name="trash" size={14} color="#ef4444" />
                              <Text style={[styles.actionButtonText, { color: '#ef4444' }]}>Delete</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </TouchableOpacity>
                    </View>
                  );
                }
              })}
            </View>
          )}

          {/* Bottom Info */}
          <View style={styles.bottomNote}>
            <Text style={styles.bottomNoteText}>
              💡 Tip: Keep your timeline up-to-date for accurate citizenship eligibility calculations. Add trips as soon as you book them!
            </Text>
          </View>
        </VStack>
      </View>

      {/* Modal for Add/Edit */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleClose}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingId 
                ? `Edit ${modalType === 'trip' ? 'Trip' : 'Status'}`
                : `Add ${modalType === 'trip' ? 'Trip' : 'Status'}`}
            </Text>
            <TouchableOpacity onPress={handleClose}>
              <FontAwesome name="times" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>
          
          {modalType === 'trip' && (
            <View style={styles.modalInfoBox}>
              <HStack space="sm" alignItems="flex-start">
                <FontAwesome name="info-circle" size={14} color="#3b82f6" style={{ marginTop: 1 }} />
                <Text style={styles.modalInfoText}>
                  Track trips outside Canada only (international travel). Domestic trips within Canada don't count as absences.
                </Text>
              </HStack>
            </View>
          )}

          <ScrollView style={styles.modalContent}>
            {modalType === 'status' ? (
              <>
                {/* Status Picker */}
                <VStack space="sm">
                  <Text style={styles.modalLabel}>Immigration Status</Text>
                  <View style={styles.statusPickerContainer}>
                    {(['visitor', 'study_permit', 'work_permit', 'protected_person', 'permanent_resident'] as StatusType[]).map((status) => {
                      const colors = STATUS_COLORS[status];
                      const isSelected = selectedStatus === status;
                      return (
                        <TouchableOpacity
                          key={status}
                          style={[
                            styles.statusOption,
                            { 
                              backgroundColor: isSelected ? colors.bg : '#f9fafb',
                              borderColor: isSelected ? colors.border : '#e5e7eb',
                            }
                          ]}
                          onPress={() => setSelectedStatus(status)}
                        >
                          <Text style={[
                            styles.statusOptionText,
                            { color: isSelected ? colors.text : '#6b7280' }
                          ]}>
                            {STATUS_TYPE_LABELS[status]}
                          </Text>
                          {isSelected && (
                            <FontAwesome name="check" size={14} color={colors.text} />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </VStack>

                {/* Start Date */}
                <VStack space="sm" mt="$4">
                  <Text style={styles.modalLabel}>Start Date</Text>
                  <Text style={styles.modalNote}>When did this status begin?</Text>
                  {Platform.OS === 'web' ? (
                    <WebDateInput
                      value={startDate ? new Date(startDate + 'T00:00:00') : new Date()}
                      onChange={(date) => {
                        if (date) {
                          const year = date.getFullYear();
                          const month = String(date.getMonth() + 1).padStart(2, '0');
                          const day = String(date.getDate()).padStart(2, '0');
                          setStartDate(`${year}-${month}-${day}`);
                        }
                      }}
                      max={new Date().toISOString().split('T')[0]}
                    />
                  ) : (
                    <>
                      <TouchableOpacity
                        style={styles.dateButton}
                        onPress={() => setShowStartPicker(true)}
                      >
                        <Text style={styles.dateButtonText}>
                          {startDate || 'Select date'}
                        </Text>
                        <FontAwesome name="calendar" size={16} color="#64748b" />
                      </TouchableOpacity>
                      {showStartPicker && (
                        <DateTimePicker
                          value={startDate ? new Date(startDate + 'T12:00:00') : new Date()}
                          mode="date"
                          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                          themeVariant={colorScheme}
                          onChange={(event, date) => {
                            if (Platform.OS !== 'ios') setShowStartPicker(false);
                            if (date) {
                              const year = date.getFullYear();
                              const month = String(date.getMonth() + 1).padStart(2, '0');
                              const day = String(date.getDate()).padStart(2, '0');
                              setStartDate(`${year}-${month}-${day}`);
                            }
                          }}
                          maximumDate={new Date()}
                        />
                      )}
                      {Platform.OS === 'ios' && showStartPicker && (
                        <TouchableOpacity
                          style={styles.doneButton}
                          onPress={() => setShowStartPicker(false)}
                        >
                          <Text style={styles.doneButtonText}>Done</Text>
                        </TouchableOpacity>
                      )}
                    </>
                  )}
                </VStack>

                {/* End Date */}
                <VStack space="sm" mt="$4">
                  <Text style={styles.modalLabel}>End Date (Optional)</Text>
                  <Text style={styles.modalNote}>Leave empty if this is your current status</Text>
                  {Platform.OS === 'web' ? (
                    <WebDateInput
                      value={endDate ? new Date(endDate + 'T00:00:00') : null}
                      onChange={(date) => {
                        if (date) {
                          const year = date.getFullYear();
                          const month = String(date.getMonth() + 1).padStart(2, '0');
                          const day = String(date.getDate()).padStart(2, '0');
                          setEndDate(`${year}-${month}-${day}`);
                        } else {
                          setEndDate('');
                        }
                      }}
                      max={new Date().toISOString().split('T')[0]}
                    />
                  ) : (
                    <>
                      <TouchableOpacity
                        style={styles.dateButton}
                        onPress={() => setShowEndPicker(true)}
                      >
                        <Text style={[
                          styles.dateButtonText,
                          !endDate && { color: '#94a3b8' }
                        ]}>
                          {endDate || 'Not set (current)'}
                        </Text>
                        <FontAwesome name="calendar" size={16} color="#64748b" />
                      </TouchableOpacity>
                      {showEndPicker && (
                        <DateTimePicker
                          value={endDate ? new Date(endDate + 'T12:00:00') : new Date()}
                          mode="date"
                          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                          themeVariant={colorScheme}
                          onChange={(event, date) => {
                            if (Platform.OS !== 'ios') setShowEndPicker(false);
                            if (date) {
                              const year = date.getFullYear();
                              const month = String(date.getMonth() + 1).padStart(2, '0');
                              const day = String(date.getDate()).padStart(2, '0');
                              setEndDate(`${year}-${month}-${day}`);
                            }
                          }}
                          maximumDate={new Date()}
                        />
                      )}
                      {Platform.OS === 'ios' && showEndPicker && (
                        <View style={styles.iosPickerButtons}>
                          <TouchableOpacity
                            style={styles.clearButton}
                            onPress={() => {
                              setEndDate('');
                              setShowEndPicker(false);
                            }}
                          >
                            <Text style={styles.clearButtonText}>Clear</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.doneButton}
                            onPress={() => setShowEndPicker(false)}
                          >
                            <Text style={styles.doneButtonText}>Done</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </>
                  )}
                </VStack>
              </>
            ) : (
              <>
                {/* Trip Destination */}
                <VStack space="sm">
                  <Text style={styles.modalLabel}>Destination (Optional)</Text>
                  <Text style={styles.modalNote}>Country or city you visited</Text>
                  <TextInput
                    style={styles.textInput}
                    value={tripPlace}
                    onChangeText={setTripPlace}
                    placeholder="e.g., Mexico, India, USA"
                    placeholderTextColor="#94a3b8"
                  />
                </VStack>

                {/* Departure Date */}
                <VStack space="sm" mt="$4">
                  <Text style={styles.modalLabel}>Departure Date</Text>
                  <Text style={styles.modalNote}>Day you left/will leave Canada (can be upcoming)</Text>
                  {Platform.OS === 'web' ? (
                    <WebDateInput
                      value={startDate ? new Date(startDate + 'T00:00:00') : new Date()}
                      onChange={(date) => {
                        if (date) {
                          const year = date.getFullYear();
                          const month = String(date.getMonth() + 1).padStart(2, '0');
                          const day = String(date.getDate()).padStart(2, '0');
                          setStartDate(`${year}-${month}-${day}`);
                        }
                      }}
                    />
                  ) : (
                    <>
                      <TouchableOpacity
                        style={styles.dateButton}
                        onPress={() => setShowStartPicker(true)}
                      >
                        <Text style={styles.dateButtonText}>
                          {startDate || 'Select date'}
                        </Text>
                        <FontAwesome name="calendar" size={16} color="#64748b" />
                      </TouchableOpacity>
                      {showStartPicker && (
                        <DateTimePicker
                          value={startDate ? new Date(startDate + 'T12:00:00') : new Date()}
                          mode="date"
                          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                          themeVariant={colorScheme}
                          onChange={(event, date) => {
                            if (Platform.OS !== 'ios') setShowStartPicker(false);
                            if (date) {
                              const year = date.getFullYear();
                              const month = String(date.getMonth() + 1).padStart(2, '0');
                              const day = String(date.getDate()).padStart(2, '0');
                              setStartDate(`${year}-${month}-${day}`);
                            }
                          }}
                        />
                      )}
                      {Platform.OS === 'ios' && showStartPicker && (
                        <TouchableOpacity
                          style={styles.doneButton}
                          onPress={() => setShowStartPicker(false)}
                        >
                          <Text style={styles.doneButtonText}>Done</Text>
                        </TouchableOpacity>
                      )}
                    </>
                  )}
                </VStack>

                {/* Return Date */}
                <VStack space="sm" mt="$4">
                  <Text style={styles.modalLabel}>Return Date</Text>
                  <Text style={styles.modalNote}>Day you returned/will return (can be tentative for upcoming trips)</Text>
                  {Platform.OS === 'web' ? (
                    <WebDateInput
                      value={endDate ? new Date(endDate + 'T00:00:00') : null}
                      onChange={(date) => {
                        if (date) {
                          const year = date.getFullYear();
                          const month = String(date.getMonth() + 1).padStart(2, '0');
                          const day = String(date.getDate()).padStart(2, '0');
                          setEndDate(`${year}-${month}-${day}`);
                        }
                      }}
                    />
                  ) : (
                    <>
                      <TouchableOpacity
                        style={styles.dateButton}
                        onPress={() => setShowEndPicker(true)}
                      >
                        <Text style={styles.dateButtonText}>
                          {endDate || 'Select date'}
                        </Text>
                        <FontAwesome name="calendar" size={16} color="#64748b" />
                      </TouchableOpacity>
                      {showEndPicker && (
                        <DateTimePicker
                          value={endDate ? new Date(endDate + 'T12:00:00') : new Date()}
                          mode="date"
                          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                          themeVariant={colorScheme}
                          onChange={(event, date) => {
                            if (Platform.OS !== 'ios') setShowEndPicker(false);
                            if (date) {
                              const year = date.getFullYear();
                              const month = String(date.getMonth() + 1).padStart(2, '0');
                              const day = String(date.getDate()).padStart(2, '0');
                              setEndDate(`${year}-${month}-${day}`);
                            }
                          }}
                        />
                      )}
                      {Platform.OS === 'ios' && showEndPicker && (
                        <TouchableOpacity
                          style={styles.doneButton}
                          onPress={() => setShowEndPicker(false)}
                        >
                          <Text style={styles.doneButtonText}>Done</Text>
                        </TouchableOpacity>
                      )}
                    </>
                  )}
                </VStack>
              </>
            )}
          </ScrollView>

          {/* Save Button */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleClose}
              disabled={isSaving}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.saveButton,
                isSaving && styles.saveButtonDisabled
              ]}
              onPress={handleSave}
              disabled={isSaving}
            >
              <Text style={styles.saveButtonText}>
                {isSaving ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
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
    backgroundColor: '#f8fafc',
    padding: 15,
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#3b82f6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  infoText: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 18,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  quickActionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
  },
  emptyState: {
    alignItems: 'center',
    padding: 48,
    backgroundColor: '#fafafa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    borderStyle: 'dashed',
  },
  emptyText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 16,
    letterSpacing: 0.2,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 6,
  },
  timeline: {
    marginLeft: 0,
    marginTop: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  timelineConnector: {
    width: 28,
    alignItems: 'center',
  },
  timelineDot: {
    width: 11,
    height: 11,
    borderRadius: 5.5,
    marginTop: 8,
    borderWidth: 2.5,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  tripDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    borderWidth: 0,
    marginTop: 10,
    opacity: 0.8,
  },
  timelineLine: {
    width: 1.5,
    flex: 1,
    backgroundColor: '#e5e7eb',
    marginTop: 6,
  },
  timelineContent: {
    flex: 1,
    marginLeft: 16,
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  statusContent: {
    borderLeftWidth: 3,
  },
  tripContent: {
    backgroundColor: '#fafafa',
    borderLeftWidth: 2,
    borderLeftColor: '#e5e7eb',
    paddingVertical: 12,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusLabel: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tripHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tripLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#475569',
  },
  currentBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  currentBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.8,
  },
  futureBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: '#fbbf24',
  },
  futureBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.8,
  },
  todayBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: '#22c55e',
  },
  todayBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.8,
  },
  dateText: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 8,
    fontWeight: '400',
  },
  durationText: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 3,
    fontWeight: '400',
  },
  expandedActions: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.08)',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionButtonText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '600',
  },
  bottomNote: {
    padding: 14,
    backgroundColor: '#fafafa',
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginTop: 8,
  },
  bottomNoteText: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 17,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
  },
  modalInfoBox: {
    margin: 16,
    marginTop: 0,
    padding: 12,
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  modalInfoText: {
    fontSize: 12,
    color: '#1e40af',
    lineHeight: 17,
    flex: 1,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  modalNote: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  textInput: {
    fontSize: 15,
    padding: 14,
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    color: '#1f2937',
    marginTop: 8,
  },
  statusPickerContainer: {
    marginTop: 8,
    gap: 8,
  },
  statusOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
    borderWidth: 2,
  },
  statusOptionText: {
    fontSize: 15,
    fontWeight: '500',
  },
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginTop: 8,
  },
  dateButtonText: {
    fontSize: 15,
    color: '#1f2937',
  },
  doneButton: {
    backgroundColor: '#3b82f6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  doneButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  iosPickerButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  clearButton: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#64748b',
    fontSize: 15,
    fontWeight: '600',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
  saveButton: {
    flex: 1,
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#3b82f6',
  },
  saveButtonDisabled: {
    backgroundColor: '#93c5fd',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
