import React, { useState, useEffect } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { confirmAction } from '@/utils/confirm';

export const EVENT_TAG_PREFIX = '[[COMMUNITY_EVENT:';
export const EVENT_TAG_SUFFIX = ']]';

export interface EventData {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
}

export function formatEventBody(event: EventData, description?: string): string {
  const meta = JSON.stringify(event);
  const desc = description?.trim() ? `\n\n${description.trim()}` : '';
  return `${EVENT_TAG_PREFIX}${meta}${EVENT_TAG_SUFFIX}${desc}`;
}

export function parseEventFromBody(body: string): {
  isEvent: boolean;
  event?: EventData;
  cleanBody: string;
} {
  if (!body) return { isEvent: false, cleanBody: '' };
  const startIdx = body.indexOf(EVENT_TAG_PREFIX);
  if (startIdx === -1) return { isEvent: false, cleanBody: body };

  const endIdx = body.indexOf(EVENT_TAG_SUFFIX, startIdx);
  if (endIdx === -1) return { isEvent: false, cleanBody: body };

  const jsonStr = body.substring(startIdx + EVENT_TAG_PREFIX.length, endIdx);
  try {
    const event = JSON.parse(jsonStr) as EventData;
    const cleanBody = (
      body.substring(0, startIdx) + body.substring(endIdx + EVENT_TAG_SUFFIX.length)
    ).trim();
    return {
      isEvent: true,
      event,
      cleanBody,
    };
  } catch {
    return { isEvent: false, cleanBody: body };
  }
}

export function formatDateRangeReadable(startDate?: string, endDate?: string): string {
  if (!startDate) return '';
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : start;

  const startFormatted = start.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  if (!endDate || startDate === endDate) {
    return startFormatted;
  }

  const endFormatted = end.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return `${startFormatted} – ${endFormatted}`;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function padZero(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}

function toDateString(year: number, month: number, day: number) {
  return `${year}-${padZero(month + 1)}-${padZero(day)}`;
}

// ----------------------------------------------------
// 1. REUSABLE CALENDAR COMPONENT
// ----------------------------------------------------
interface CalendarGridProps {
  currentYear: number;
  currentMonth: number;
  startDate?: string;
  endDate?: string;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onSelectDate?: (dateStr: string) => void;
  selectable?: boolean;
}

export function CalendarGrid({
  currentYear,
  currentMonth,
  startDate,
  endDate,
  onPrevMonth,
  onNextMonth,
  onSelectDate,
  selectable = false,
}: CalendarGridProps) {
  const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    cells.push(null);
  }
  for (let day = 1; day <= totalDays; day++) {
    cells.push(day);
  }
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <View style={calStyles.container}>
      {/* Month Navigation */}
      <View style={calStyles.monthNav}>
        <TouchableOpacity
          accessibilityLabel="Previous month"
          onPress={onPrevMonth}
          style={calStyles.navButton}
        >
          <Ionicons name="chevron-back" size={18} color="#23435D" />
        </TouchableOpacity>
        <Text style={calStyles.monthYearText}>
          {MONTH_NAMES[currentMonth]} {currentYear}
        </Text>
        <TouchableOpacity
          accessibilityLabel="Next month"
          onPress={onNextMonth}
          style={calStyles.navButton}
        >
          <Ionicons name="chevron-forward" size={18} color="#23435D" />
        </TouchableOpacity>
      </View>

      {/* Weekday headers */}
      <View style={calStyles.weekHeader}>
        {DAY_LABELS.map((lbl) => (
          <Text key={lbl} style={calStyles.dayLabel}>
            {lbl}
          </Text>
        ))}
      </View>

      {/* Grid of days */}
      <View style={calStyles.grid}>
        {cells.map((day, idx) => {
          if (day === null) {
            return <View key={`empty-${idx}`} style={calStyles.dayCell} />;
          }

          const dateKey = toDateString(currentYear, currentMonth, day);
          const isStart = startDate === dateKey;
          const isEnd = endDate === dateKey;
          const isBetween =
            Boolean(startDate && endDate && dateKey > startDate && dateKey < endDate);
          const isToday = todayStr === dateKey;

          return (
            <TouchableOpacity
              key={dateKey}
              disabled={!selectable}
              onPress={() => selectable && onSelectDate?.(dateKey)}
              style={[
                calStyles.dayCell,
                isBetween && calStyles.inRangeCell,
                isStart && calStyles.rangeStartCell,
                isEnd && calStyles.rangeEndCell,
              ]}
            >
              <View
                style={[
                  calStyles.dayBubble,
                  (isStart || isEnd) && calStyles.activeBubble,
                  isToday && !(isStart || isEnd) && calStyles.todayBubble,
                ]}
              >
                <Text
                  style={[
                    calStyles.dayText,
                    (isStart || isEnd) && calStyles.activeDayText,
                    isBetween && calStyles.inRangeText,
                    isToday && !(isStart || isEnd) && calStyles.todayText,
                  ]}
                >
                  {day}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ----------------------------------------------------
// 2. EVENT CREATOR MODAL (Authority Side)
// ----------------------------------------------------
interface CreateEventModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    description: string;
    startDate: string;
    endDate: string;
  }) => Promise<void> | void;
}

export function CommunityEventCreateModal({
  visible,
  onClose,
  onSubmit,
}: CreateEventModalProps) {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());

  const todayKey = toDateString(today.getFullYear(), today.getMonth(), today.getDate());
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(todayKey);
  const [endDate, setEndDate] = useState(todayKey);
  const [activePicker, setActivePicker] = useState<'start' | 'end'>('start');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      setTitle('');
      setDescription('');
      const t = new Date();
      const tKey = toDateString(t.getFullYear(), t.getMonth(), t.getDate());
      setStartDate(tKey);
      setEndDate(tKey);
      setCurrentYear(t.getFullYear());
      setCurrentMonth(t.getMonth());
      setActivePicker('start');
      setError('');
      setSubmitting(false);
    }
  }, [visible]);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleSelectDate = (dateStr: string) => {
    setError('');
    if (activePicker === 'start') {
      setStartDate(dateStr);
      if (dateStr > endDate) {
        setEndDate(dateStr);
      }
      setActivePicker('end');
    } else {
      if (dateStr < startDate) {
        setStartDate(dateStr);
      } else {
        setEndDate(dateStr);
      }
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError('Please enter an event title.');
      return;
    }
    if (!startDate || !endDate) {
      setError('Please select start and end dates.');
      return;
    }

    const confirmed = await confirmAction(
      'Are you sure you want to submit this announcement?',
      undefined,
      'Submit Event Announcement'
    );
    if (!confirmed) return;

    try {
      setSubmitting(true);
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        startDate,
        endDate,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to submit event.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={modalStyles.overlay} onPress={onClose}>
        <Pressable style={modalStyles.card} onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View style={modalStyles.headerRow}>
            <View style={modalStyles.headerLeft}>
              <View style={modalStyles.iconBadge}>
                <Ionicons name="calendar" size={20} color="#23435D" />
              </View>
              <View>
                <Text style={modalStyles.title}>Create Community Event</Text>
                <Text style={modalStyles.subtitle}>
                  Mark dates on the calendar and post an announcement
                </Text>
              </View>
            </View>
            <TouchableOpacity
              accessibilityLabel="Close"
              onPress={onClose}
              style={modalStyles.closeButton}
            >
              <Ionicons name="close" size={20} color="#667085" />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={modalStyles.scrollBody}
          >
            {/* Title Input */}
            <View style={modalStyles.field}>
              <Text style={modalStyles.fieldLabel}>Event Title *</Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="e.g. Annual Community Clean-up Drive"
                placeholderTextColor="#98A2B3"
                style={modalStyles.textInput}
              />
            </View>

            {/* Date Pickers Buttons */}
            <View style={modalStyles.datePickersRow}>
              <TouchableOpacity
                onPress={() => setActivePicker('start')}
                style={[
                  modalStyles.datePickerButton,
                  activePicker === 'start' && modalStyles.datePickerActive,
                ]}
              >
                <Text style={modalStyles.datePickerLabel}>START DATE</Text>
                <View style={modalStyles.datePickerValueRow}>
                  <Ionicons
                    name="calendar-outline"
                    size={15}
                    color={activePicker === 'start' ? '#23435D' : '#667085'}
                  />
                  <Text
                    style={[
                      modalStyles.datePickerValue,
                      activePicker === 'start' && modalStyles.datePickerValueActive,
                    ]}
                  >
                    {startDate}
                  </Text>
                </View>
              </TouchableOpacity>

              <View style={modalStyles.arrowBetween}>
                <Ionicons name="arrow-forward" size={16} color="#98A2B3" />
              </View>

              <TouchableOpacity
                onPress={() => setActivePicker('end')}
                style={[
                  modalStyles.datePickerButton,
                  activePicker === 'end' && modalStyles.datePickerActive,
                ]}
              >
                <Text style={modalStyles.datePickerLabel}>END DATE</Text>
                <View style={modalStyles.datePickerValueRow}>
                  <Ionicons
                    name="calendar-outline"
                    size={15}
                    color={activePicker === 'end' ? '#23435D' : '#667085'}
                  />
                  <Text
                    style={[
                      modalStyles.datePickerValue,
                      activePicker === 'end' && modalStyles.datePickerValueActive,
                    ]}
                  >
                    {endDate}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            <Text style={modalStyles.helperText}>
              Tap days on the calendar to mark {activePicker === 'start' ? 'Start Date' : 'End Date'}.
            </Text>

            {/* Calendar */}
            <CalendarGrid
              currentYear={currentYear}
              currentMonth={currentMonth}
              startDate={startDate}
              endDate={endDate}
              onPrevMonth={handlePrevMonth}
              onNextMonth={handleNextMonth}
              onSelectDate={handleSelectDate}
              selectable
            />

            {/* Optional Description */}
            <View style={[modalStyles.field, { marginTop: 14 }]}>
              <Text style={modalStyles.fieldLabel}>Event Details / Notes</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Share details, location coordinates, items to bring..."
                placeholderTextColor="#98A2B3"
                multiline
                style={[modalStyles.textInput, { height: 75, textAlignVertical: 'top' }]}
              />
            </View>

            {error ? <Text style={modalStyles.errorText}>{error}</Text> : null}

            {/* Actions */}
            <View style={modalStyles.actionsRow}>
              <TouchableOpacity
                onPress={onClose}
                disabled={submitting}
                style={modalStyles.cancelBtn}
              >
                <Text style={modalStyles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSubmit}
                disabled={submitting}
                style={[modalStyles.submitBtn, submitting && { opacity: 0.7 }]}
              >
                <Ionicons name="megaphone-outline" size={16} color="#FFFFFF" />
                <Text style={modalStyles.submitBtnText}>
                  {submitting ? 'Publishing...' : 'Submit Event Announcement'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ----------------------------------------------------
// 3. EVENT VIEWER MODAL (Resident & Authority View)
// ----------------------------------------------------
interface ViewEventModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  startDate: string;
  endDate: string;
  description?: string;
  authorName?: string;
}

export function CommunityEventViewerModal({
  visible,
  onClose,
  title,
  startDate,
  endDate,
  description,
  authorName = 'Community Authority',
}: ViewEventModalProps) {
  const initialDate = startDate ? new Date(startDate) : new Date();
  const [currentYear, setCurrentYear] = useState(
    Number.isNaN(initialDate.getFullYear()) ? new Date().getFullYear() : initialDate.getFullYear()
  );
  const [currentMonth, setCurrentMonth] = useState(
    Number.isNaN(initialDate.getMonth()) ? new Date().getMonth() : initialDate.getMonth()
  );

  useEffect(() => {
    if (visible && startDate) {
      const d = new Date(startDate);
      if (!Number.isNaN(d.getTime())) {
        setCurrentYear(d.getFullYear());
        setCurrentMonth(d.getMonth());
      }
    }
  }, [visible, startDate]);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const readableRange = formatDateRangeReadable(startDate, endDate);

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={modalStyles.overlay} onPress={onClose}>
        <Pressable style={modalStyles.card} onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View style={modalStyles.headerRow}>
            <View style={modalStyles.headerLeft}>
              <View style={modalStyles.iconBadge}>
                <Ionicons name="calendar" size={20} color="#23435D" />
              </View>
              <View style={{ flex: 1 }}>
                <View style={modalStyles.eventTagBadge}>
                  <Text style={modalStyles.eventTagBadgeText}>COMMUNITY EVENT</Text>
                </View>
                <Text style={modalStyles.title} numberOfLines={2}>
                  {title}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              accessibilityLabel="Close"
              onPress={onClose}
              style={modalStyles.closeButton}
            >
              <Ionicons name="close" size={20} color="#667085" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={modalStyles.scrollBody}>
            {/* Event Dates banner */}
            <View style={modalStyles.eventDateCard}>
              <View style={modalStyles.eventDateRow}>
                <Ionicons name="time-outline" size={18} color="#23435D" />
                <Text style={modalStyles.eventDateText}>{readableRange}</Text>
              </View>
              <Text style={modalStyles.eventAuthorText}>Posted by {authorName}</Text>
            </View>

            {/* Calendar */}
            <CalendarGrid
              currentYear={currentYear}
              currentMonth={currentMonth}
              startDate={startDate}
              endDate={endDate}
              onPrevMonth={handlePrevMonth}
              onNextMonth={handleNextMonth}
              selectable={false}
            />

            {/* Legend */}
            <View style={modalStyles.legendRow}>
              <View style={modalStyles.legendItem}>
                <View style={[modalStyles.legendDot, { backgroundColor: '#23435D' }]} />
                <Text style={modalStyles.legendText}>Start / End Date</Text>
              </View>
              <View style={modalStyles.legendItem}>
                <View style={[modalStyles.legendDot, { backgroundColor: '#EAF0F6' }]} />
                <Text style={modalStyles.legendText}>Event Period</Text>
              </View>
            </View>

            {/* Description if any */}
            {description ? (
              <View style={modalStyles.descContainer}>
                <Text style={modalStyles.descLabel}>EVENT DETAILS</Text>
                <Text style={modalStyles.descText}>{description}</Text>
              </View>
            ) : null}

            <TouchableOpacity onPress={onClose} style={modalStyles.doneBtn}>
              <Text style={modalStyles.doneBtnText}>Close Calendar</Text>
            </TouchableOpacity>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ----------------------------------------------------
// STYLES
// ----------------------------------------------------
const calStyles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EAECF0',
    padding: 12,
    marginTop: 6,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  navButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F2F4F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthYearText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1F2937',
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F4F7',
    marginBottom: 4,
  },
  dayLabel: {
    width: 36,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    color: '#8A93A1',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inRangeCell: {
    backgroundColor: '#EAF0F6',
  },
  rangeStartCell: {
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
    backgroundColor: '#EAF0F6',
  },
  rangeEndCell: {
    borderTopRightRadius: 18,
    borderBottomRightRadius: 18,
    backgroundColor: '#EAF0F6',
  },
  dayBubble: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeBubble: {
    backgroundColor: '#23435D',
  },
  todayBubble: {
    borderWidth: 1.5,
    borderColor: '#23435D',
  },
  dayText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#344054',
  },
  activeDayText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  inRangeText: {
    color: '#23435D',
    fontWeight: '700',
  },
  todayText: {
    color: '#23435D',
    fontWeight: '800',
  },
});

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EAECF0',
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EAECF0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconBadge: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#EAF0F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 11,
    color: '#667085',
    marginTop: 2,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F2F4F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollBody: {
    paddingTop: 14,
    paddingBottom: 6,
  },
  field: {
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#344054',
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D0D5DD',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1F2937',
    backgroundColor: '#FAFAFA',
  },
  datePickersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  datePickerButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D0D5DD',
    borderRadius: 10,
    padding: 10,
    backgroundColor: '#F9FAFB',
  },
  datePickerActive: {
    borderColor: '#23435D',
    backgroundColor: '#EAF0F6',
  },
  datePickerLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#667085',
    letterSpacing: 0.5,
  },
  datePickerValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  datePickerValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#344054',
  },
  datePickerValueActive: {
    color: '#23435D',
  },
  arrowBetween: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  helperText: {
    fontSize: 11,
    color: '#667085',
    marginBottom: 6,
  },
  errorText: {
    fontSize: 12,
    color: '#D92D20',
    fontWeight: '600',
    marginTop: 8,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#F2F4F7',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    color: '#344054',
    fontSize: 14,
    fontWeight: '700',
  },
  submitBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#23435D',
    borderRadius: 10,
    paddingVertical: 12,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  // Viewer styles
  eventTagBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EAF0F6',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 4,
  },
  eventTagBadgeText: {
    color: '#23435D',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  eventDateCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EAECF0',
    padding: 12,
    marginBottom: 10,
  },
  eventDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eventDateText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1F2937',
  },
  eventAuthorText: {
    fontSize: 11,
    color: '#667085',
    marginTop: 4,
    marginLeft: 26,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    marginTop: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#667085',
  },
  descContainer: {
    marginTop: 14,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#EAECF0',
  },
  descLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#8A93A1',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  descText: {
    fontSize: 13,
    color: '#344054',
    lineHeight: 19,
  },
  doneBtn: {
    marginTop: 16,
    backgroundColor: '#23435D',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
