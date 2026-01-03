import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, Platform, Alert, Modal, ScrollView } from 'react-native';
import { View, Text, VStack, HStack, Button, ButtonText } from '@gluestack-ui/themed';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import DateTimePicker from '@react-native-community/datetimepicker';
import WebDateInput from './WebDateInput';
import { useColorScheme } from './useColorScheme';
import { 
  StatusEntry, 
  StatusType, 
  STATUS_TYPE_LABELS,
  getCurrentStatus,
  hasPRStatus,
  UserProfile,
} from '@journey-to-citizen/types';

interface StatusTimelineProps {
  entries: StatusEntry[];
  onAddStatus: (entry: Omit<StatusEntry, 'id'>) => Promise<void>;
  onEditStatus: (id: string, updates: Partial<StatusEntry>) => Promise<void>;
  onDeleteStatus: (id: string) => Promise<void>;
  onStatusChange?: (newStatus: StatusType, startDate: string) => Promise<void>;
  profile?: UserProfile | null;
}

// Status colors for visual distinction
const STATUS_COLORS: Record<StatusType, { bg: string; border: string; text: string }> = {
  visitor: { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' },
  study_permit: { bg: '#dbeafe', border: '#3b82f6', text: '#1e40af' },
  work_permit: { bg: '#dcfce7', border: '#22c55e', text: '#166534' },
  protected_person: { bg: '#f3e8ff', border: '#a855f7', text: '#6b21a8' },
  permanent_resident: { bg: '#fce7f3', border: '#ec4899', text: '#9d174d' },
};

export default function StatusTimeline({
  entries,
  onAddStatus,
  onEditStatus,
  onDeleteStatus,
  onStatusChange,
  profile,
}: StatusTimelineProps) {
  const colorScheme = useColorScheme();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'status-change'>('add');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<StatusType>('work_permit');
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Sort entries by date (newest first for display)
  const sortedEntries = [...entries].sort(
    (a, b) => new Date(b.from).getTime() - new Date(a.from).getTime()
  );

  const currentStatus = getCurrentStatus(profile);
  const userHasPR = hasPRStatus(profile);

  const formatDate = (dateStr: string | undefined): string => {
    if (!dateStr) return 'Present';
    const d = new Date(dateStr + 'T00:00:00.000Z');
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC'
    });
  };

  const calculateDuration = (from: string, to?: string): string => {
    const fromDate = new Date(from);
    const toDate = to ? new Date(to) : new Date();
    
    const diffTime = toDate.getTime() - fromDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
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

  const handleOpenAdd = () => {
    setModalMode('add');
    setEditingId(null);
    setSelectedStatus('work_permit');
    setStartDate(new Date());
    setEndDate(null);
    setIsModalVisible(true);
  };

  const handleOpenStatusChange = () => {
    setModalMode('status-change');
    setEditingId(null);
    setSelectedStatus('permanent_resident');
    setStartDate(new Date());
    setEndDate(null);
    setIsModalVisible(true);
  };

  const handleOpenEdit = (entry: StatusEntry) => {
    setModalMode('edit');
    setEditingId(entry.id);
    setSelectedStatus(entry.status);
    setStartDate(new Date(entry.from));
    setEndDate(entry.to ? new Date(entry.to) : null);
    setIsModalVisible(true);
  };

  const handleClose = () => {
    setIsModalVisible(false);
    setEditingId(null);
    setShowStartPicker(false);
    setShowEndPicker(false);
  };

  const handleDelete = async (id: string) => {
    const confirm = await new Promise<boolean>((resolve) => {
      if (Platform.OS === 'web') {
        resolve(window.confirm('Are you sure you want to delete this status entry?'));
      } else {
        Alert.alert(
          'Delete Entry',
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
        await onDeleteStatus(id);
      } catch (error: any) {
        const message = error.message || 'Failed to delete entry';
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

    if (endDate && startDate > endDate) {
      const message = 'Start date must be before end date';
      Platform.OS === 'web' ? alert(message) : Alert.alert('Invalid Dates', message);
      return;
    }

    setIsSaving(true);
    try {
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate ? endDate.toISOString().split('T')[0] : undefined;

      if (modalMode === 'status-change' && onStatusChange) {
        // Handle status change (e.g., got PR)
        await onStatusChange(selectedStatus, startDateStr);
      } else if (editingId) {
        // Edit existing entry
        await onEditStatus(editingId, {
          status: selectedStatus,
          from: startDateStr,
          to: endDateStr,
        });
      } else {
        // Add new entry
        await onAddStatus({
          status: selectedStatus,
          from: startDateStr,
          to: endDateStr,
        });
      }

      handleClose();
    } catch (error: any) {
      const message = error.message || 'Failed to save status';
      Platform.OS === 'web' ? alert(message) : Alert.alert('Error', message);
    } finally {
      setIsSaving(false);
    }
  };

  const renderStatusPicker = () => {
    // Filter statuses based on modal mode
    const availableStatuses = modalMode === 'status-change' 
      ? ['permanent_resident'] as StatusType[]
      : (['visitor', 'study_permit', 'work_permit', 'protected_person', 'permanent_resident'] as StatusType[]);

    return (
      <VStack space="sm">
        <Text style={styles.modalLabel}>Status</Text>
        <View style={styles.statusPickerContainer}>
          {availableStatuses.map((status) => {
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
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <HStack space="sm" alignItems="center">
          <FontAwesome name="history" size={18} color="#3b82f6" />
          <Text style={styles.title}>Immigration Timeline</Text>
        </HStack>
        <Text style={styles.description}>
          Track your immigration journey in Canada. Each status counts toward your citizenship eligibility.
        </Text>
      </View>

      {/* Timeline */}
      {sortedEntries.length === 0 ? (
        <View style={styles.emptyState}>
          <FontAwesome name="calendar-o" size={32} color="#94a3b8" />
          <Text style={styles.emptyText}>No status history yet</Text>
          <Text style={styles.emptySubtext}>Add your current or past immigration status</Text>
        </View>
      ) : (
        <View style={styles.timeline}>
          {sortedEntries.map((entry, index) => {
            const colors = STATUS_COLORS[entry.status];
            const isCurrent = !entry.to;
            const isExpanded = expandedId === entry.id;
            
            return (
              <View key={entry.id} style={styles.timelineItem}>
                {/* Timeline connector */}
                <View style={styles.timelineConnector}>
                  <View style={[
                    styles.timelineDot,
                    { backgroundColor: colors.border }
                  ]} />
                  {index < sortedEntries.length - 1 && (
                    <View style={styles.timelineLine} />
                  )}
                </View>
                
                {/* Content */}
                <TouchableOpacity
                  style={[
                    styles.timelineContent,
                    { 
                      backgroundColor: colors.bg,
                      borderColor: colors.border,
                    }
                  ]}
                  onPress={() => setExpandedId(isExpanded ? null : entry.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.timelineHeader}>
                    <View style={styles.timelineHeaderLeft}>
                      <Text style={[styles.statusLabel, { color: colors.text }]}>
                        {STATUS_TYPE_LABELS[entry.status]}
                      </Text>
                      {isCurrent && (
                        <View style={[styles.currentBadge, { backgroundColor: colors.border }]}>
                          <Text style={styles.currentBadgeText}>Current</Text>
                        </View>
                      )}
                    </View>
                    <FontAwesome 
                      name={isExpanded ? "chevron-up" : "chevron-down"} 
                      size={12} 
                      color={colors.text} 
                    />
                  </View>
                  
                  <Text style={[styles.dateRange, { color: colors.text }]}>
                    {formatDate(entry.from)} — {formatDate(entry.to)}
                  </Text>
                  
                  <Text style={[styles.duration, { color: colors.text, opacity: 0.8 }]}>
                    {calculateDuration(entry.from, entry.to)}
                  </Text>
                  
                  {/* Expanded actions */}
                  {isExpanded && (
                    <View style={styles.expandedActions}>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleOpenEdit(entry)}
                      >
                        <FontAwesome name="pencil" size={14} color="#3b82f6" />
                        <Text style={styles.actionButtonText}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleDelete(entry.id)}
                      >
                        <FontAwesome name="trash" size={14} color="#ef4444" />
                        <Text style={[styles.actionButtonText, { color: '#ef4444' }]}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleOpenAdd}
        >
          <FontAwesome name="plus" size={14} color="#3b82f6" />
          <Text style={styles.addButtonText}>Add Previous Status</Text>
        </TouchableOpacity>
        
        {!userHasPR && (
          <TouchableOpacity
            style={[styles.addButton, styles.statusChangeButton]}
            onPress={handleOpenStatusChange}
          >
            <FontAwesome name="star" size={14} color="#ec4899" />
            <Text style={[styles.addButtonText, { color: '#ec4899' }]}>Got PR!</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Modal for Add/Edit */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleClose}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {modalMode === 'status-change' 
                ? 'Congratulations on PR! 🎉' 
                : modalMode === 'edit' 
                  ? 'Edit Status' 
                  : 'Add Status'}
            </Text>
            <TouchableOpacity onPress={handleClose}>
              <FontAwesome name="times" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {modalMode === 'status-change' && (
              <View style={styles.celebrationBanner}>
                <Text style={styles.celebrationText}>
                  Record your PR status to track your citizenship eligibility!
                </Text>
              </View>
            )}

            {/* Status Picker */}
            {modalMode !== 'status-change' && renderStatusPicker()}

            {/* Start Date */}
            <VStack space="sm" mt="$4">
              <Text style={styles.modalLabel}>
                {modalMode === 'status-change' ? 'PR Date' : 'Start Date'}
              </Text>
              <Text style={styles.modalNote}>
                {modalMode === 'status-change' 
                  ? 'The date on your PR card or COPR document'
                  : 'When did this status begin?'}
              </Text>
              {Platform.OS === 'web' ? (
                <WebDateInput
                  value={startDate}
                  onChange={(date) => date && setStartDate(date)}
                  max={new Date().toISOString().split('T')[0]}
                />
              ) : (
                <>
                  <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => setShowStartPicker(true)}
                  >
                    <Text style={styles.dateButtonText}>
                      {startDate.toLocaleDateString('en-CA')}
                    </Text>
                    <FontAwesome name="calendar" size={16} color="#64748b" />
                  </TouchableOpacity>
                  {showStartPicker && (
                    <DateTimePicker
                      value={startDate}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      themeVariant={colorScheme}
                      onChange={(event, date) => {
                        if (Platform.OS !== 'ios') setShowStartPicker(false);
                        if (date) setStartDate(date);
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

            {/* End Date (only for non-current statuses) */}
            {modalMode !== 'status-change' && (
              <VStack space="sm" mt="$4">
                <Text style={styles.modalLabel}>End Date (Optional)</Text>
                <Text style={styles.modalNote}>
                  Leave empty if this is your current status
                </Text>
                {Platform.OS === 'web' ? (
                  <WebDateInput
                    value={endDate}
                    onChange={setEndDate}
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
                        {endDate ? endDate.toLocaleDateString('en-CA') : 'Not set (current)'}
                      </Text>
                      <FontAwesome name="calendar" size={16} color="#64748b" />
                    </TouchableOpacity>
                    {showEndPicker && (
                      <DateTimePicker
                        value={endDate || new Date()}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        themeVariant={colorScheme}
                        onChange={(event, date) => {
                          if (Platform.OS !== 'ios') setShowEndPicker(false);
                          if (date) setEndDate(date);
                        }}
                        maximumDate={new Date()}
                      />
                    )}
                    {Platform.OS === 'ios' && showEndPicker && (
                      <View style={styles.iosPickerButtons}>
                        <TouchableOpacity
                          style={styles.clearButton}
                          onPress={() => {
                            setEndDate(null);
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
            )}
          </ScrollView>

          {/* Save Button */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.cancelButton]}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  description: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 8,
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#64748b',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
  },
  timeline: {
    marginLeft: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  timelineConnector: {
    width: 24,
    alignItems: 'center',
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 6,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#e2e8f0',
    marginTop: 4,
  },
  timelineContent: {
    flex: 1,
    marginLeft: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timelineHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  currentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  currentBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
    textTransform: 'uppercase',
  },
  dateRange: {
    fontSize: 14,
    marginTop: 4,
  },
  duration: {
    fontSize: 12,
    marginTop: 2,
  },
  expandedActions: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionButtonText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3b82f6',
  },
  statusChangeButton: {
    backgroundColor: '#fdf2f8',
    borderColor: '#fbcfe8',
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
    marginTop: 4,
  },
  celebrationBanner: {
    backgroundColor: '#fdf2f8',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#fbcfe8',
  },
  celebrationText: {
    fontSize: 14,
    color: '#9d174d',
    textAlign: 'center',
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
