import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, Platform, Alert, Modal, ScrollView } from 'react-native';
import { View, Text, VStack, HStack, Button, ButtonText, Input, InputField } from '@gluestack-ui/themed';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import DateTimePicker from '@react-native-community/datetimepicker';

export interface DateRangeEntry {
  id: string;
  from: any; // Date or timestamp
  to: any; // Date or timestamp
  [key: string]: any; // Allow additional fields like purpose, place, etc.
}

interface DateRangeListProps {
  entries: DateRangeEntry[];
  onAdd: (entry: Omit<DateRangeEntry, 'id'>) => Promise<void>;
  onEdit: (id: string, entry: Partial<DateRangeEntry>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  title: string;
  emptyMessage: string;
  fields?: {
    name: string;
    label: string;
    type: 'text' | 'select';
    options?: string[];
    required?: boolean;
  }[];
  allowFutureDates?: boolean;
  startDateLabel?: string;
  startDateNote?: string;
  endDateLabel?: string;
  endDateNote?: string;
  showAbsentDays?: boolean; // Whether to show absent days calculation (for travel absences)
}

export default function DateRangeList({
  entries,
  onAdd,
  onEdit,
  onDelete,
  title,
  emptyMessage,
  fields = [],
  allowFutureDates = false,
  startDateLabel = 'Start Date',
  startDateNote,
  endDateLabel = 'End Date',
  endDateNote,
  showAbsentDays = false,
}: DateRangeListProps) {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [additionalFields, setAdditionalFields] = useState<Record<string, any>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [showDropdownFor, setShowDropdownFor] = useState<string | null>(null);

  const formatDate = (date: any): string => {
    if (!date) return 'N/A';
    const d = date instanceof Date ? date : new Date(date + 'T00:00:00.000Z');
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC'
    }); // Sep 15, 2024 format
  };

  const calculateDays = (from: any, to: any): number => {
    if (!from || !to) return 0;
    const fromD = from instanceof Date ? from : new Date(from + 'T00:00:00.000Z');
    const toD = to instanceof Date ? to : new Date(to + 'T00:00:00.000Z');
    const diffTime = Math.abs(toD.getTime() - fromD.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1; // Include both start and end dates
  };

  const calculateAbsentDays = (from: any, to: any): number => {
    if (!from || !to) return 0;
    const totalDays = calculateDays(from, to);
    // Absent days = total days - 2 (exclude departure and return days)
    // Minimum 0 for same-day or next-day trips
    return Math.max(0, totalDays - 2);
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    const today = new Date();
    setFromDate(today);
    setToDate(today);
    setAdditionalFields({});
    setShowDropdownFor(null);
    setIsModalVisible(true);
  };

  const handleOpenEdit = (entry: DateRangeEntry) => {
    setEditingId(entry.id);
    setFromDate(entry.from ? new Date(entry.from) : null);
    setToDate(entry.to ? new Date(entry.to) : null);
    
    const fieldsData: Record<string, any> = {};
    fields.forEach(field => {
      if (entry[field.name]) {
        fieldsData[field.name] = entry[field.name];
      }
    });
    setAdditionalFields(fieldsData);
    setShowDropdownFor(null);
    setIsModalVisible(true);
  };

  const handleClose = () => {
    setIsModalVisible(false);
    setEditingId(null);
    setFromDate(null);
    setToDate(null);
    setAdditionalFields({});
    setShowFromPicker(false);
    setShowToPicker(false);
    setShowDropdownFor(null);
  };

  const handleSave = async () => {
    // Validation
    if (!fromDate || !toDate) {
      const message = 'Please select both start and end dates';
      Platform.OS === 'web' ? alert(message) : Alert.alert('Required', message);
      return;
    }

    if (fromDate > toDate) {
      const message = 'Departure date must be before or equal to return date';
      Platform.OS === 'web' ? alert(message) : Alert.alert('Invalid Date Order', message);
      return;
    }

    // Validate required additional fields
    for (const field of fields) {
      if (field.required && !additionalFields[field.name]) {
        const message = `${field.label} is required`;
        Platform.OS === 'web' ? alert(message) : Alert.alert('Required', message);
        return;
      }
    }

    setIsSaving(true);
    try {
      const entryData = {
        from: fromDate.toISOString().split('T')[0], // Store as YYYY-MM-DD string
        to: toDate.toISOString().split('T')[0], // Store as YYYY-MM-DD string
        ...additionalFields,
      };

      if (editingId) {
        await onEdit(editingId, entryData);
      } else {
        await onAdd(entryData);
      }
      handleClose();
    } catch (error: any) {
      const message = error.message || 'Failed to save entry';
      Platform.OS === 'web' ? alert(message) : Alert.alert('Error', message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmDelete = () => {
      onDelete(id).catch((error: any) => {
        const message = error.message || 'Failed to delete entry';
        Platform.OS === 'web' ? alert(message) : Alert.alert('Error', message);
      });
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to delete this entry?')) {
        confirmDelete();
      }
    } else {
      Alert.alert('Delete Entry', 'Are you sure you want to delete this entry?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: confirmDelete },
      ]);
    }
  };

  return (
    <View style={styles.container}>
      <HStack justifyContent="space-between" alignItems="center" mb="$4">
        <Text size="lg" fontWeight="$bold">{title}</Text>
        <Button size="sm" onPress={handleOpenAdd} action="primary">
          <ButtonText>Add</ButtonText>
        </Button>
      </HStack>

      {entries.length === 0 ? (
        <View style={styles.emptyState}>
          <Text size="sm" color="$textLight600" textAlign="center">{emptyMessage}</Text>
        </View>
      ) : (
        <VStack space="sm">
          {entries.map((entry) => (
            <TouchableOpacity
              key={entry.id}
              onPress={() => handleOpenEdit(entry)}
              style={styles.entryCard}
            >
              <HStack justifyContent="space-between" alignItems="center">
                <View style={{ flex: 1 }}>
                  <Text size="sm" fontWeight="$medium">
                    {formatDate(entry.from)} → {formatDate(entry.to)}
                  </Text>
                  <Text size="xs" color="$textLight600">
                    {showAbsentDays ? (
                      <>
                        {calculateDays(entry.from, entry.to)} days • {calculateAbsentDays(entry.from, entry.to)} days absent
                      </>
                    ) : (
                      <>
                        {calculateDays(entry.from, entry.to)} days
                      </>
                    )}
                    {fields.map(field => 
                      entry[field.name] ? ` • ${entry[field.name]}` : ''
                    ).join('')}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    handleDelete(entry.id);
                  }}
                  style={styles.deleteButton}
                >
                  <FontAwesome name="trash-o" size={16} color="#ef4444" />
                </TouchableOpacity>
              </HStack>
            </TouchableOpacity>
          ))}
        </VStack>
      )}

      {/* Add/Edit Modal */}
      <Modal visible={isModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={true}>
              <HStack justifyContent="space-between" alignItems="center" mb="$4">
                <Text size="lg" fontWeight="$bold">
                  {editingId ? 'Edit Entry' : 'Add Entry'}
                </Text>
                <TouchableOpacity onPress={handleClose}>
                  <FontAwesome name="times" size={24} color="#666" />
                </TouchableOpacity>
              </HStack>

              <VStack space="md">
                {/* From Date */}
                <View>
                  <Text size="sm" fontWeight="$medium" mb={endDateNote ? 0 : "$2"}>{startDateLabel} *</Text>
                  {startDateNote && (
                    <Text size="xs" color="$textLight600" mb="$2" style={{ fontStyle: 'italic' }}>
                      {startDateNote}
                    </Text>
                  )}
                  <TouchableOpacity
                    onPress={() => setShowFromPicker(!showFromPicker)}
                    style={styles.dateButton}
                  >
                    <Text size="md" color={fromDate ? '$textLight900' : '$textLight400'}>
                      {fromDate ? formatDate(fromDate) : 'Select start date'}
                    </Text>
                    <FontAwesome name={showFromPicker ? "chevron-up" : "chevron-down"} size={12} color="#666" />
                  </TouchableOpacity>
                  {showFromPicker && (
                    <View style={styles.pickerWrapper}>
                      <DateTimePicker
                        value={fromDate || new Date()}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={(event, date) => {
                          if (Platform.OS === 'ios') {
                            // On iOS, update state but keep picker open
                            if (date) setFromDate(date);
                          } else {
                            // On Android, close after selection
                            if (event.type === 'set' && date) {
                              setFromDate(date);
                              setShowFromPicker(false);
                            } else if (event.type === 'dismissed') {
                              setShowFromPicker(false);
                            }
                          }
                        }}
                        maximumDate={allowFutureDates ? undefined : new Date()}
                      />
                      {/* 
                        iOS-specific Done button (Bug fix: 2025-10-11)
                        iOS UIDatePicker in spinner mode fires onChange continuously as user scrolls.
                        Without this button, picker would close after each component change (month/day/year),
                        requiring users to reopen it multiple times. This Done button matches native iOS
                        behavior and improves UX by keeping picker open until user explicitly confirms.
                        See: docs/7.bug-fixes/2025-10-11_datepicker-closes-immediately.md
                      */}
                      {Platform.OS === 'ios' && (
                        <Button
                          action="primary"
                          size="sm"
                          onPress={() => setShowFromPicker(false)}
                          style={{ marginTop: 8 }}
                        >
                          <ButtonText>Done</ButtonText>
                        </Button>
                      )}
                    </View>
                  )}
                </View>

                {/* To Date */}
                <View>
                  <Text size="sm" fontWeight="$medium" mb={endDateNote ? 0 : "$2"}>{endDateLabel} *</Text>
                  {endDateNote && (
                    <Text size="xs" color="$textLight600" mb="$2" style={{ fontStyle: 'italic' }}>
                      {endDateNote}
                    </Text>
                  )}
                  <TouchableOpacity
                    onPress={() => setShowToPicker(!showToPicker)}
                    style={styles.dateButton}
                  >
                    <Text size="md" color={toDate ? '$textLight900' : '$textLight400'}>
                      {toDate ? formatDate(toDate) : 'Select end date'}
                    </Text>
                    <FontAwesome name={showToPicker ? "chevron-up" : "chevron-down"} size={12} color="#666" />
                  </TouchableOpacity>
                  {showToPicker && (
                    <View style={styles.pickerWrapper}>
                      <DateTimePicker
                        value={toDate || new Date()}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={(event, date) => {
                          if (Platform.OS === 'ios') {
                            // On iOS, update state but keep picker open
                            if (date) setToDate(date);
                          } else {
                            // On Android, close after selection
                            if (event.type === 'set' && date) {
                              setToDate(date);
                              setShowToPicker(false);
                            } else if (event.type === 'dismissed') {
                              setShowToPicker(false);
                            }
                          }
                        }}
                        maximumDate={allowFutureDates ? undefined : new Date()}
                      />
                      {/* iOS-specific Done button - see comment on fromDate picker above */}
                      {Platform.OS === 'ios' && (
                        <Button
                          action="primary"
                          size="sm"
                          onPress={() => setShowToPicker(false)}
                          style={{ marginTop: 8 }}
                        >
                          <ButtonText>Done</ButtonText>
                        </Button>
                      )}
                    </View>
                  )}
                </View>

                {/* Additional Fields */}
                {fields.map((field) => (
                  <View key={field.name}>
                    <Text size="sm" fontWeight="$medium" mb="$2">
                      {field.label} {field.required && '*'}
                    </Text>
                    {field.type === 'text' ? (
                      <Input variant="outline">
                        <InputField
                          placeholder={`Enter ${field.label.toLowerCase()}`}
                          value={additionalFields[field.name] || ''}
                          onChangeText={(text) =>
                            setAdditionalFields({ ...additionalFields, [field.name]: text })
                          }
                        />
                      </Input>
                    ) : field.type === 'select' && field.options ? (
                      <>
                        <TouchableOpacity
                          style={styles.dropdownButton}
                          onPress={() => setShowDropdownFor(showDropdownFor === field.name ? null : field.name)}
                        >
                          <Text size="md" color={additionalFields[field.name] ? '$textLight900' : '$textLight400'}>
                            {additionalFields[field.name] || `Select ${field.label.toLowerCase()}`}
                          </Text>
                          <FontAwesome 
                            name={showDropdownFor === field.name ? "chevron-up" : "chevron-down"} 
                            size={12} 
                            color="#666" 
                          />
                        </TouchableOpacity>
                        {showDropdownFor === field.name && (
                          <View style={styles.dropdownOptions}>
                            <ScrollView style={styles.dropdownScroll} nestedScrollEnabled={true}>
                              {field.options.map((option) => (
                                <TouchableOpacity
                                  key={option}
                                  style={[
                                    styles.dropdownOption,
                                    additionalFields[field.name] === option && styles.dropdownOptionSelected,
                                  ]}
                                  onPress={() => {
                                    setAdditionalFields({ ...additionalFields, [field.name]: option });
                                    setShowDropdownFor(null);
                                  }}
                                >
                                  <Text
                                    size="sm"
                                    color={
                                      additionalFields[field.name] === option
                                        ? '$primary500'
                                        : '$textLight600'
                                    }
                                  >
                                    {option}
                                  </Text>
                                  {additionalFields[field.name] === option && (
                                    <FontAwesome name="check" size={14} color="#3b82f6" />
                                  )}
                                </TouchableOpacity>
                              ))}
                            </ScrollView>
                          </View>
                        )}
                      </>
                    ) : null}
                  </View>
                ))}

                {/* Buttons */}
                <HStack space="md" mt="$2">
                  <Button
                    flex={1}
                    variant="outline"
                    onPress={handleClose}
                    isDisabled={isSaving}
                  >
                    <ButtonText>Cancel</ButtonText>
                  </Button>
                  <Button
                    flex={1}
                    action="primary"
                    onPress={handleSave}
                    isDisabled={isSaving}
                  >
                    <ButtonText>{isSaving ? 'Saving...' : 'Save'}</ButtonText>
                  </Button>
                </HStack>
              </VStack>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  emptyState: {
    padding: 24,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
  },
  entryCard: {
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  deleteButton: {
    padding: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalScroll: {
    maxHeight: '100%',
  },
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
  },
  pickerWrapper: {
    marginTop: 8,
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
  },
  dropdownOptions: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#fff',
    maxHeight: 200,
  },
  dropdownScroll: {
    maxHeight: 200,
  },
  dropdownOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  dropdownOptionSelected: {
    backgroundColor: '#eff6ff',
  },
});
