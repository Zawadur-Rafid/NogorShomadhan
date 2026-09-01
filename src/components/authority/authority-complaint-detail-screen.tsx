import ProgressSegmentedControl from '@expo/ui/community/segmented-control';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuthorityComplaints } from './authority-complaints-context';
import { getAuthorityLocationDetails } from './authority-location';
import AuthorityPageHeader from './authority-page-header';
import type {
  AuthorityApproval,
  AuthorityComplaintDetail,
  AuthorityContractorAssignment,
  AuthorityEvidenceImage,
  AuthorityResidentFeedback,
  AuthorityWorkUpdate,
} from './store-authority-complaint-details';

export type AuthorityComplaintDetailMode =
  | 'pending'
  | 'in-progress'
  | 'resolved';

type ProgressAction = 'update' | 'contractor' | 'completed';

const modeTheme = {
  pending: {
    label: 'PENDING',
    color: '#EF4444',
    background: '#FEF2F2',
    icon: 'time-outline' as const,
  },
  'in-progress': {
    label: 'IN PROGRESS',
    color: '#C67B00',
    background: '#FFF7E8',
    icon: 'construct-outline' as const,
  },
  resolved: {
    label: 'RESOLVED',
    color: '#2563EB',
    background: '#EFF6FF',
    icon: 'checkmark-circle-outline' as const,
  },
};

function getDetailMode(status?: string): AuthorityComplaintDetailMode {
  if (status === 'IN PROGRESS') return 'in-progress';
  if (status === 'RESOLVED') return 'resolved';
  return 'pending';
}

function normalizePhone(value: string) {
  return value.replace(/[\s-]/g, '');
}

function isValidBangladeshPhone(value: string) {
  const phone = normalizePhone(value);
  return /^(?:01[3-9]\d{8}|\+8801[3-9]\d{8})$/.test(phone);
}

function cleanBudgetInput(value: string) {
  const cleaned = value.replace(/[^\d.]/g, '');
  const [whole, ...rest] = cleaned.split('.');
  return rest.length > 0 ? `${whole}.${rest.join('').slice(0, 2)}` : whole;
}

function budgetToInput(value: string) {
  return cleanBudgetInput(value);
}

function isValidBudgetInput(value: string) {
  const cleaned = cleanBudgetInput(value);
  if (!cleaned) return false;

  const amount = Number(cleaned);
  return Number.isFinite(amount) && amount > 0;
}

function budgetsEqual(first: string, second: string) {
  const firstCleaned = cleanBudgetInput(first);
  const secondCleaned = cleanBudgetInput(second);

  if (!firstCleaned && !secondCleaned) return true;
  if (!firstCleaned || !secondCleaned) return false;

  const firstAmount = Number(firstCleaned);
  const secondAmount = Number(secondCleaned);

  if (!Number.isFinite(firstAmount) || !Number.isFinite(secondAmount)) {
    return firstCleaned === secondCleaned;
  }

  return firstAmount === secondAmount;
}

function startOfDay(date: Date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function fromDateKey(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

function getTomorrow() {
  return addDays(startOfDay(new Date()), 1);
}

function isAllowedDeadline(value: string) {
  const parsed = fromDateKey(value);
  return Boolean(parsed && parsed.getTime() >= getTomorrow().getTime());
}

function formatDateOnly(value: string) {
  const parsed = fromDateKey(value);
  if (!parsed) return value || 'Not available';

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(parsed);
}

function hasValidImage(
  image?: AuthorityEvidenceImage | null,
): image is AuthorityEvidenceImage {
  if (!image) return false;
  if (typeof image === 'number') return true;
  return Boolean(image.uri?.trim());
}

function DatePickerField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const minimumDate = getTomorrow();
  const selectedDate = fromDateKey(value);
  const initialMonth =
    selectedDate && selectedDate.getTime() >= minimumDate.getTime()
      ? selectedDate
      : minimumDate;

  const [open, setOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(
    new Date(initialMonth.getFullYear(), initialMonth.getMonth(), 1),
  );

  useEffect(() => {
    const parsed = fromDateKey(value);
    const next =
      parsed && parsed.getTime() >= minimumDate.getTime()
        ? parsed
        : minimumDate;

    setVisibleMonth(new Date(next.getFullYear(), next.getMonth(), 1));
  }, [value]);

  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: Array<Date | null> = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from(
      { length: daysInMonth },
      (_, index) => new Date(year, month, index + 1),
    ),
  ];

  while (cells.length % 7 !== 0) cells.push(null);

  const minMonth = new Date(
    minimumDate.getFullYear(),
    minimumDate.getMonth(),
    1,
  );

  const canGoPrevious = visibleMonth.getTime() > minMonth.getTime();

  const chooseDate = (date: Date) => {
    if (date.getTime() < minimumDate.getTime()) return;
    onChange(toDateKey(date));
    setOpen(false);
  };

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Select deadline"
        onPress={() => setOpen(true)}
        style={styles.inputBox}
      >
        <Ionicons name="calendar-outline" size={17} color="#7A8493" />
        <Text
          style={[
            styles.dateFieldText,
            !value && styles.dateFieldPlaceholder,
          ]}
        >
          {value ? formatDateOnly(value) : 'Select deadline'}
        </Text>
        <Ionicons name="chevron-down-outline" size={16} color="#98A2B3" />
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.calendarOverlay}>
          <View style={styles.calendarCard}>
            <View style={styles.calendarHeader}>
              <TouchableOpacity
                disabled={!canGoPrevious}
                onPress={() =>
                  setVisibleMonth(
                    new Date(year, month - 1, 1),
                  )
                }
                style={[
                  styles.calendarNavButton,
                  !canGoPrevious && styles.calendarNavButtonDisabled,
                ]}
              >
                <Ionicons name="chevron-back" size={19} color="#23435D" />
              </TouchableOpacity>

              <Text style={styles.calendarMonthTitle}>
                {new Intl.DateTimeFormat('en-GB', {
                  month: 'long',
                  year: 'numeric',
                }).format(visibleMonth)}
              </Text>

              <TouchableOpacity
                onPress={() =>
                  setVisibleMonth(
                    new Date(year, month + 1, 1),
                  )
                }
                style={styles.calendarNavButton}
              >
                <Ionicons name="chevron-forward" size={19} color="#23435D" />
              </TouchableOpacity>
            </View>

            <View style={styles.calendarWeekHeader}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(
                (weekday) => (
                  <Text key={weekday} style={styles.calendarWeekday}>
                    {weekday}
                  </Text>
                ),
              )}
            </View>

            <View style={styles.calendarGrid}>
              {cells.map((date, index) => {
                if (!date) {
                  return <View key={`empty-${index}`} style={styles.calendarDayCell} />;
                }

                const disabled = date.getTime() < minimumDate.getTime();
                const selected = value === toDateKey(date);

                return (
                  <Pressable
                    key={toDateKey(date)}
                    disabled={disabled}
                    onPress={() => chooseDate(date)}
                    style={[
                      styles.calendarDayCell,
                      selected && styles.calendarDaySelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.calendarDayText,
                        disabled && styles.calendarDayDisabledText,
                        selected && styles.calendarDaySelectedText,
                      ]}
                    >
                      {date.getDate()}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.calendarFooter}>
              <Text style={styles.calendarHint}>
                Earliest selectable date: {formatDateOnly(toDateKey(minimumDate))}
              </Text>
              <TouchableOpacity
                onPress={() => setOpen(false)}
                style={styles.calendarCloseButton}
              >
                <Text style={styles.calendarCloseText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

function DetailItem({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.detailItem}>
      <View style={styles.detailIcon}>
        <Ionicons name={icon} size={17} color="#23435D" />
      </View>
      <View style={styles.detailCopy}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text selectable style={styles.detailValue}>
          {value}
        </Text>
      </View>
    </View>
  );
}

function EvidenceGrid({
  images,
  removable = false,
  onRemove,
}: {
  images: AuthorityEvidenceImage[];
  removable?: boolean;
  onRemove?: (index: number) => void;
}) {
  if (images.length === 0) return null;

  return (
    <View style={styles.evidenceGrid}>
      {images.map((image, index) => (
        <View key={`${index}-${JSON.stringify(image)}`} style={styles.evidenceThumbWrap}>
          <Image source={image} style={styles.evidenceThumb} contentFit="cover" />
          {removable && onRemove && (
            <Pressable
              accessibilityLabel={`Remove photo ${index + 1}`}
              onPress={() => onRemove(index)}
              style={styles.removePhoto}
            >
              <Ionicons name="close" size={14} color="#FFFFFF" />
            </Pressable>
          )}
        </View>
      ))}
    </View>
  );
}

function WorkActivityTimeline({ updates }: { updates: AuthorityWorkUpdate[] }) {
  if (updates.length === 0) {
    return (
      <View style={styles.emptyPhaseActivity}>
        <Ionicons name="document-text-outline" size={17} color="#98A2B3" />
        <Text style={styles.emptyPhaseActivityText}>
          No work activity was recorded during this assignment.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.timeline}>
      {updates.map((update, index) => (
        <View key={update.id} style={styles.timelineRow}>
          <View style={styles.timelineTrack}>
            <View
              style={[
                styles.timelineDot,
                update.complete
                  ? styles.timelineDotComplete
                  : styles.timelineDotPending,
              ]}
            >
              <Ionicons
                name={update.complete ? 'checkmark' : 'ellipsis-horizontal'}
                size={12}
                color="#FFFFFF"
              />
            </View>
            {index < updates.length - 1 && (
              <View
                style={[
                  styles.timelineLine,
                  update.complete && styles.timelineLineComplete,
                ]}
              />
            )}
          </View>
          <View style={styles.timelineContent}>
            <View style={styles.timelineHeading}>
              <Text style={styles.timelineTitle}>{update.title}</Text>
              <Text style={styles.timelineTime}>{update.timestamp}</Text>
            </View>
            <Text style={styles.timelineNote}>{update.note}</Text>
            <View style={styles.budgetChange}>
              <Ionicons name="cash-outline" size={13} color="#607A9A" />
              <Text style={styles.budgetChangeText}>
                Budget at this update: {update.budget}
              </Text>
            </View>
            <EvidenceGrid images={update.images} />
          </View>
        </View>
      ))}
    </View>
  );
}

function ComplaintTimeline({
  complaint,
}: {
  complaint: AuthorityComplaintDetail;
}) {
  const unassignedUpdates = complaint.updates.filter(
    (update) => !update.contractorAssignmentId,
  );

  return (
    <View style={styles.panel}>
      <View style={styles.panelHeading}>
        <View style={styles.panelHeadingCopy}>
          <Text style={styles.panelTitle}>Work History</Text>
          <Text style={styles.panelSubtitle}>
            A chronological view of responsibility and work progress
          </Text>
        </View>
        <Ionicons name="git-branch-outline" size={21} color="#23435D" />
      </View>

      <View style={styles.workHistoryPhases}>
        {unassignedUpdates.length > 0 && (
          <View style={styles.intakePhase}>
            <View style={styles.intakePhaseHeading}>
              <View style={styles.intakePhaseIcon}>
                <Ionicons name="clipboard-outline" size={16} color="#607A9A" />
              </View>
              <View style={styles.intakePhaseCopy}>
                <Text style={styles.intakePhaseTitle}>Complaint Intake</Text>
                <Text style={styles.intakePhaseText}>Before contractor assignment</Text>
              </View>
            </View>
            <WorkActivityTimeline updates={unassignedUpdates} />
          </View>
        )}

        {complaint.contractorAssignments.map((assignment, index) => {
          const nextAssignment = complaint.contractorAssignments[index + 1];
          const assignmentUpdates = complaint.updates.filter(
            (update) =>
              update.contractorAssignmentId === assignment.id &&
              update.title !== 'Contractor changed',
          );

          return (
            <View key={assignment.id} style={styles.contractorWorkPhase}>
              <ContractorAssignmentRow
                assignment={assignment}
                index={index}
                isCurrent={
                  !assignment.assignedUntil && complaint.status === 'IN PROGRESS'
                }
              />

              <View style={styles.phaseActivity}>
                <View style={styles.phaseActivityHeading}>
                  <Ionicons name="list-outline" size={14} color="#607A9A" />
                  <Text style={styles.phaseActivityLabel}>
                    WORK DURING THIS ASSIGNMENT
                  </Text>
                </View>
                <WorkActivityTimeline updates={assignmentUpdates} />
              </View>

              {nextAssignment && (
                <View style={styles.contractorTransition}>
                  <View style={styles.contractorTransitionIcon}>
                    <Ionicons name="swap-horizontal" size={18} color="#A86617" />
                  </View>
                  <View style={styles.contractorTransitionCopy}>
                    <View style={styles.contractorTransitionHeading}>
                      <Text style={styles.contractorTransitionTitle}>
                        Contractor changed
                      </Text>
                      <Text style={styles.contractorTransitionTime}>
                        {assignment.assignedUntil ?? nextAssignment.assignedFrom}
                      </Text>
                    </View>
                    <Text selectable style={styles.contractorTransitionText}>
                      {assignment.name} {'\u2192'} {nextAssignment.name}
                    </Text>
                    <View style={styles.contractorTransitionReason}>
                      <Text style={styles.contractorTransitionReasonLabel}>
                        REASON FOR CHANGE
                      </Text>
                      <Text selectable style={styles.contractorTransitionReasonText}>
                        {assignment.changeReason ?? 'No reason was recorded.'}
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

function StarRating({ rating, size = 15 }: { rating: number; size?: number }) {
  return (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Ionicons
          key={star}
          name={star <= Math.round(rating) ? 'star' : 'star-outline'}
          size={size}
          color="#F2A93B"
        />
      ))}
    </View>
  );
}

function FeedbackCard({ feedback }: { feedback: AuthorityResidentFeedback }) {
  return (
    <View style={styles.feedbackCard}>
      <View style={styles.feedbackAvatar}>
        <Text style={styles.feedbackAvatarText}>{feedback.residentInitials}</Text>
      </View>
      <View style={styles.feedbackCopy}>
        <View style={styles.feedbackHeading}>
          <View>
            <Text style={styles.feedbackName}>{feedback.resident}</Text>
            <Text style={styles.feedbackDate}>{feedback.receivedAt}</Text>
          </View>
          <StarRating rating={feedback.rating} size={13} />
        </View>
        <Text selectable style={styles.feedbackComment}>
          “{feedback.comment}”
        </Text>
      </View>
    </View>
  );
}

function ResidentFeedback({ complaint }: { complaint: AuthorityComplaintDetail }) {
  const average =
    complaint.feedback.length === 0
      ? 0
      : complaint.feedback.reduce((total, item) => total + item.rating, 0) /
        complaint.feedback.length;

  return (
    <View style={styles.panel}>
      <View style={styles.panelHeading}>
        <View>
          <Text style={styles.panelTitle}>Resident Feedback</Text>
          <Text style={styles.panelSubtitle}>
            Ratings and comments submitted after resolution
          </Text>
        </View>
        <Ionicons name="chatbox-ellipses-outline" size={21} color="#23435D" />
      </View>

      {complaint.feedback.length === 0 ? (
        <View style={styles.emptyFeedback}>
          <Ionicons name="hourglass-outline" size={23} color="#98A2B3" />
          <Text style={styles.emptyFeedbackTitle}>No feedback received yet</Text>
          <Text style={styles.emptyFeedbackText}>
            Resident ratings and comments will appear here.
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.feedbackSummary}>
            <Text style={styles.feedbackAverage}>{average.toFixed(1)}</Text>
            <View>
              <StarRating rating={average} size={17} />
              <Text style={styles.feedbackCount}>
                Based on {complaint.feedback.length}{' '}
                {complaint.feedback.length === 1 ? 'response' : 'responses'}
              </Text>
            </View>
          </View>
          <View style={styles.feedbackList}>
            {complaint.feedback.map((item) => (
              <FeedbackCard key={item.id} feedback={item} />
            ))}
          </View>
        </>
      )}
    </View>
  );
}

function ApprovalCard({ approval }: { approval: AuthorityApproval }) {

  return (
    <View style={styles.approvalCard}>
      <View style={styles.approvalIcon}>
        <Ionicons name="shield-checkmark" size={22} color="#FFFFFF" />
      </View>
      <View style={styles.approvalCopy}>
        <Text style={styles.approvalLabel}>WORK APPROVED BY</Text>
        <Text selectable style={styles.approvalName}>
          {approval.name}
        </Text>
        <Text selectable style={styles.approvalRole}>
          {approval.role}
        </Text>
        <View style={styles.approvalDateRow}>
          <Ionicons name="calendar-outline" size={12} color="#4A7C69" />
          <Text selectable style={styles.approvalDate}>
            {approval.approvedAt}
          </Text>
        </View>
      </View>
      <View style={styles.approvedBadge}>
        <Text style={styles.approvedBadgeText}>WORK APPROVED</Text>
      </View>
    </View>
  );
}

function ReporterProfile({ complaint }: { complaint: AuthorityComplaintDetail }) {
  const [expanded, setExpanded] = useState(false);
  const reporterCount = complaint.otherReporters.length;

  return (
    <View style={styles.reporterPanel}>
      <View style={styles.reporterCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{complaint.reporterInitials}</Text>
        </View>
        <View style={styles.reporterCopy}>
          <Text style={styles.reporterLabel}>PRIMARY REPORTER</Text>
          <Text selectable style={styles.reporterName}>
            {complaint.reporter}
          </Text>
          <Text selectable style={styles.reporterPhone}>
            {complaint.reporterPhone}
          </Text>
          <Text style={styles.primaryReporterHint}>
            First person who reported this issue
          </Text>
        </View>
        <Ionicons name="person-circle-outline" size={23} color="#B9854B" />
      </View>

      {reporterCount > 0 && (
        <>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded }}
            accessibilityLabel={`${expanded ? 'Hide' : 'Show'} ${reporterCount} other reporters`}
            onPress={() => setExpanded((current) => !current)}
            style={({ pressed }) => [
              styles.otherReportersToggle,
              pressed && styles.otherReportersTogglePressed,
            ]}
          >
            <View style={styles.otherReportersIcon}>
              <Ionicons name="people-outline" size={17} color="#2563EB" />
            </View>
            <View style={styles.otherReportersCopy}>
              <View style={styles.otherReportersTitleRow}>
                <Text style={styles.otherReportersTitle}>Others reported</Text>
                <View style={styles.otherReportersCount}>
                  <Text style={styles.otherReportersCountText}>{reporterCount}</Text>
                </View>
              </View>
              <Text style={styles.otherReportersDescription}>
                {reporterCount === 1
                  ? '1 other resident reported the same issue'
                  : `${reporterCount} other residents reported the same issue`}
              </Text>
            </View>
            <Ionicons
              name={expanded ? 'chevron-up' : 'chevron-down'}
              size={18}
              color="#607A9A"
            />
          </Pressable>

          {expanded && (
            <Animated.View
              entering={FadeInDown.duration(180)}
              exiting={FadeOut.duration(120)}
              style={styles.otherReportersList}
            >
              {complaint.otherReporters.map((reporter) => (
                <View key={reporter.id} style={styles.otherReporterRow}>
                  <View style={styles.otherReporterAvatar}>
                    <Text style={styles.otherReporterAvatarText}>{reporter.initials}</Text>
                  </View>
                  <View style={styles.otherReporterCopy}>
                    <Text selectable style={styles.otherReporterName}>
                      {reporter.name}
                    </Text>
                    <Text selectable style={styles.otherReporterDate}>
                      Reported {reporter.submittedAt}
                    </Text>
                  </View>
                  <Ionicons name="git-merge-outline" size={15} color="#7890AB" />
                </View>
              ))}
            </Animated.View>
          )}
        </>
      )}
    </View>
  );
}

export default function AuthorityComplaintDetailScreen() {
  const params = useLocalSearchParams<{ complaintId?: string | string[] }>();
  const { width } = useWindowDimensions();
  const {
    complaints,
    loading,
    error,
    startComplaint,
    addWorkUpdate,
    resolveComplaint,
    changeContractor,
  } = useAuthorityComplaints();

  const complaintId = Array.isArray(params.complaintId)
    ? params.complaintId[0]
    : params.complaintId;
  const complaint = complaints.find((item) => item.id === complaintId);

  const [deadline, setDeadline] = useState('');
  const [workBudget, setWorkBudget] = useState('');
  const [initialNote, setInitialNote] = useState('');
  const [contractorName, setContractorName] = useState('');
  const [contractorPhone, setContractorPhone] = useState('');
  const [updateNote, setUpdateNote] = useState('');
  const [updateImages, setUpdateImages] = useState<AuthorityEvidenceImage[]>([]);
  const [resolutionNote, setResolutionNote] = useState('');
  const [finalEvidence, setFinalEvidence] =
    useState<AuthorityEvidenceImage | null>(null);
  const [progressAction, setProgressAction] =
    useState<ProgressAction>('update');
  const [formMessage, setFormMessage] = useState('');
  const [newContractorName, setNewContractorName] = useState('');
  const [newContractorPhone, setNewContractorPhone] = useState('');
  const [contractorChangeReason, setContractorChangeReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const wide = width >= 900;
  const mode = getDetailMode(complaint?.status);
  const theme = modeTheme[mode];

  useEffect(() => {
    if (!complaint) return;

    if (complaint.status === 'PENDING') {
      setDeadline('');
      setWorkBudget('');
      setInitialNote('');
      return;
    }

    setDeadline(complaint.deadline ?? '');
    setWorkBudget(budgetToInput(complaint.budget));
    setInitialNote(complaint.workNote ?? '');
  }, [complaint?.id, complaint?.status, complaint?.deadline, complaint?.budget, complaint?.workNote]);

  const latestWorkImage = useMemo(() => {
    if (!complaint) return undefined;

    for (let index = complaint.updates.length - 1; index >= 0; index -= 1) {
      const image = complaint.updates[index].images[0];
      if (hasValidImage(image)) return image;
    }

    return undefined;
  }, [complaint]);

  if (loading && !complaint) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <AuthorityPageHeader fallbackPath="/authority/complaints" />
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color="#23435D" />
          <Text style={styles.loadingTitle}>Loading complaint</Text>
          <Text style={styles.loadingText}>
            Fetching complaint information from the database...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!complaint) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <AuthorityPageHeader fallbackPath="/authority/complaints" />
        <View style={styles.notFound}>
          <Ionicons name="document-text-outline" size={38} color="#98A2B3" />
          <Text style={styles.notFoundTitle}>Complaint not found</Text>
          <Text style={styles.notFoundText}>
            {error
              ? error
              : 'This complaint record is not available in the authority database.'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const locationDetails = getAuthorityLocationDetails(complaint);

  const residentEvidence = hasValidImage(complaint.evidence)
    ? complaint.evidence
    : undefined;
  const finalCompletionEvidence = hasValidImage(complaint.finalEvidence)
    ? complaint.finalEvidence
    : undefined;

  const displayEvidence =
    mode === 'resolved'
      ? finalCompletionEvidence ?? latestWorkImage ?? residentEvidence
      : mode === 'in-progress'
        ? latestWorkImage ?? residentEvidence
        : residentEvidence;

  const evidenceTitle =
    mode === 'resolved'
      ? finalCompletionEvidence
        ? 'Final Completion Evidence'
        : latestWorkImage
          ? 'Latest Work Evidence'
          : 'Resident Evidence'
      : mode === 'in-progress'
        ? latestWorkImage
          ? 'Latest Work Evidence'
          : 'Resident Evidence'
        : 'Resident Evidence';

  const evidenceSubtitle =
    evidenceTitle === 'Final Completion Evidence'
      ? 'Required proof submitted when the complaint was closed'
      : evidenceTitle === 'Latest Work Evidence'
        ? 'Most recent work photo attached to this complaint'
        : 'Photo submitted by the resident with the complaint';

  const savedBudget = budgetToInput(complaint.budget);
  const savedDeadline = complaint.deadline ?? '';

  const budgetChanged = !budgetsEqual(workBudget, savedBudget);
  const deadlineChanged = deadline !== savedDeadline;
  const noteChanged = updateNote.trim().length > 0;
  const photosChanged = updateImages.length > 0;

  const hasAnyUpdateChange =
    budgetChanged || deadlineChanged || noteChanged || photosChanged;

  const changedBudgetIsValid =
    !budgetChanged || isValidBudgetInput(workBudget);

  const changedDeadlineIsValid =
    !deadlineChanged || isAllowedDeadline(deadline);

  const pickPhotos = async (multiple: boolean) => {
    setFormMessage('');

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setFormMessage('Photo access is required to attach work evidence.');
      return [];
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: multiple,
      selectionLimit: multiple ? 5 : 1,
      quality: 0.8,
    });

    if (result.canceled) return [];
    return result.assets.map((asset) => ({ uri: asset.uri }));
  };

  const chooseUpdatePhotos = async () => {
    const selected = await pickPhotos(true);
    if (selected.length > 0) {
      setUpdateImages((current) => [...current, ...selected].slice(0, 5));
    }
  };

  const chooseFinalEvidence = async () => {
    const selected = await pickPhotos(false);
    if (selected[0]) setFinalEvidence(selected[0]);
  };

  const handleStartWork = async () => {
    if (
      !contractorName.trim() ||
      !contractorPhone.trim() ||
      !deadline.trim() ||
      !workBudget.trim() ||
      !initialNote.trim()
    ) {
      setFormMessage(
        'Contractor name, phone, deadline, amount, and initial work note are required.',
      );
      return;
    }

    if (!isValidBangladeshPhone(contractorPhone)) {
      setFormMessage(
        'Enter a valid Bangladesh phone number, e.g. 01712345678 or +8801712345678.',
      );
      return;
    }

    if (!isAllowedDeadline(deadline)) {
      setFormMessage('Deadline must be tomorrow or a later date.');
      return;
    }

    setActionLoading(true);
    setFormMessage('');

    try {
      await startComplaint(complaint.id, {
        deadline,
        contractorName: contractorName.trim(),
        contractorPhone: contractorPhone.trim(),
        budget: workBudget.trim(),
        note: initialNote.trim(),
      });

      setFormMessage(
        'Work started successfully. This complaint is now In Progress.',
      );
    } catch (err) {
      setFormMessage(
        err instanceof Error
          ? err.message
          : 'Failed to start work on this complaint.',
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddUpdate = async () => {
    if (!hasAnyUpdateChange) {
      setFormMessage(
        'Change the estimated budget or deadline, add notes, or attach at least one photo.',
      );
      return;
    }

    if (budgetChanged && !isValidBudgetInput(workBudget)) {
      setFormMessage('Enter a valid estimated budget greater than 0.');
      return;
    }

    if (deadlineChanged && !isAllowedDeadline(deadline)) {
      setFormMessage(
        'A changed deadline must be tomorrow or a later date.',
      );
      return;
    }

    setActionLoading(true);
    setFormMessage('');

    try {
      await addWorkUpdate(complaint.id, {
        budget: budgetChanged ? workBudget.trim() : undefined,
        deadline: deadlineChanged ? deadline : undefined,
        note: noteChanged ? updateNote.trim() : undefined,
        images: updateImages,
      });

      setUpdateNote('');
      setUpdateImages([]);
      setFormMessage('Work update successfully added to the complaint history.');
    } catch (err) {
      setFormMessage(
        err instanceof Error ? err.message : 'Failed to save the work update.',
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleChangeContractor = async () => {
    if (
      !newContractorName.trim() ||
      !newContractorPhone.trim() ||
      !contractorChangeReason.trim()
    ) {
      setFormMessage(
        'New contractor name, phone number, and reason for the change are required.',
      );
      return;
    }

    if (!isValidBangladeshPhone(newContractorPhone)) {
      setFormMessage(
        'Enter a valid Bangladesh phone number, e.g. 01712345678 or +8801712345678.',
      );
      return;
    }

    setActionLoading(true);
    setFormMessage('');

    try {
      await changeContractor(complaint.id, {
        name: newContractorName.trim(),
        phone: newContractorPhone.trim(),
        reason: contractorChangeReason.trim(),
      });

      setNewContractorName('');
      setNewContractorPhone('');
      setContractorChangeReason('');
      setFormMessage(
        'Contractor successfully changed and recorded in the complaint history.',
      );
    } catch (err) {
      setFormMessage(
        err instanceof Error ? err.message : 'Failed to change the contractor.',
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolve = async () => {
    if (!resolutionNote.trim() || !finalEvidence) {
      setFormMessage(
        'A final completion photo and completion notes are required before closing.',
      );
      return;
    }

    setActionLoading(true);
    setFormMessage('');

    try {
      await resolveComplaint(complaint.id, {
        note: resolutionNote.trim(),
        budget: workBudget.trim() || complaint.budget,
        finalImage: finalEvidence,
      });

      setFinalEvidence(null);
      setResolutionNote('');
      setFormMessage('Complaint successfully marked as resolved.');
    } catch (err) {
      setFormMessage(
        err instanceof Error
          ? err.message
          : 'Failed to resolve this complaint.',
      );
    } finally {
      setActionLoading(false);
    }
  };

  const canStartWork =
    contractorName.trim().length > 0 &&
    isValidBangladeshPhone(contractorPhone) &&
    isAllowedDeadline(deadline) &&
    workBudget.trim().length > 0 &&
    initialNote.trim().length > 0;

  const canAddUpdate =
    hasAnyUpdateChange &&
    changedBudgetIsValid &&
    changedDeadlineIsValid;

  const canChangeContractor =
    newContractorName.trim().length > 0 &&
    isValidBangladeshPhone(newContractorPhone) &&
    contractorChangeReason.trim().length > 0;

  const canResolve =
    resolutionNote.trim().length > 0 && finalEvidence !== null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <AuthorityPageHeader fallbackPath="/authority/complaints" />

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.container}>
          <View style={styles.hero}>
            <View style={styles.heroTopRow}>
              <View style={[styles.statusBadge, { backgroundColor: theme.background }]}>
                <Ionicons name={theme.icon} size={15} color={theme.color} />
                <Text style={[styles.statusText, { color: theme.color }]}>
                  {theme.label}
                </Text>
              </View>
              <Text selectable style={styles.complaintId}>
                {complaint.id}
              </Text>
            </View>
            <Text selectable style={styles.title}>
              {complaint.title}
            </Text>
            <Text selectable style={styles.description}>
              {complaint.description}
            </Text>
          </View>

          {mode !== 'pending' && complaint.approvedBy && (
            <ApprovalCard approval={complaint.approvedBy} />
          )}

          <View style={[styles.pageGrid, wide && styles.pageGridWide]}>
            <View style={styles.mainColumn}>
              <View style={styles.panel}>
                <View style={styles.panelHeading}>
                  <View>
                    <Text style={styles.panelTitle}>Complaint Information</Text>
                    <Text style={styles.panelSubtitle}>
                      Verified resident report details
                    </Text>
                  </View>
                  <Ionicons name="information-circle-outline" size={22} color="#23435D" />
                </View>

                <View style={styles.detailsGrid}>
                  <DetailItem
                    icon="layers-outline"
                    label="Category"
                    value={complaint.category}
                  />
                  <DetailItem
                    icon="calendar-outline"
                    label="Submitted"
                    value={complaint.submittedAt}
                  />
                </View>
              </View>

              <View style={styles.panel}>
                <View style={styles.panelHeading}>
                  <View>
                    <Text style={styles.panelTitle}>Location Details</Text>
                    <Text style={styles.panelSubtitle}>
                      Address information supplied by the resident
                    </Text>
                  </View>
                  <Ionicons name="location-outline" size={22} color="#23435D" />
                </View>

                <View style={styles.detailsGrid}>
                  <DetailItem
                    icon="navigate-outline"
                    label="Full Address"
                    value={complaint.location}
                  />
                  {locationDetails.map((item) => (
                    <DetailItem
                      key={item.key}
                      icon={
                        item.key === 'house'
                          ? 'home-outline'
                          : item.key === 'road'
                            ? 'map-outline'
                            : item.key === 'avenue'
                              ? 'business-outline'
                              : item.key === 'nearby_landmark'
                                ? 'flag-outline'
                                : 'document-text-outline'
                      }
                      label={item.label}
                      value={item.value || 'Not provided'}
                    />
                  ))}
                </View>
              </View>

              <View style={styles.panel}>
                <View style={styles.panelHeading}>
                  <View>
                    <Text style={styles.panelTitle}>{evidenceTitle}</Text>
                    <Text style={styles.panelSubtitle}>{evidenceSubtitle}</Text>
                  </View>
                  <Ionicons name="image-outline" size={21} color="#23435D" />
                </View>
                {hasValidImage(displayEvidence) ? (
                  <Image
                    source={displayEvidence}
                    style={styles.evidenceImage}
                    contentFit="cover"
                    transition={180}
                  />
                ) : (
                  <View style={styles.noEvidence}>
                    <Ionicons name="image-outline" size={32} color="#98A2B3" />
                    <Text style={styles.noEvidenceTitle}>
                      No evidence image available
                    </Text>
                    <Text style={styles.noEvidenceText}>
                      No photo is attached to this complaint record.
                    </Text>
                  </View>
                )}
              </View>



              {mode !== 'pending' && (
                <ComplaintTimeline complaint={complaint} />
              )}
              {mode === 'resolved' && (
                <ResidentFeedback complaint={complaint} />
              )}
            </View>

            <View style={styles.sideColumn}>
              <ReporterProfile complaint={complaint} />

              {mode !== 'pending' && (
                <ContractorAssignments complaint={complaint} mode={mode} />
              )}

              {mode === 'pending' && (
                <View style={[styles.panel, styles.actionPanel]}>
                  <View style={styles.actionIcon}>
                    <Ionicons name="play" size={21} color="#FFFFFF" />
                  </View>
                  <Text style={styles.actionTitle}>Start Work</Text>
                  <Text style={styles.actionDescription}>
                    Assign a contractor and add the initial plan before starting work.
                  </Text>

                  <View style={styles.formSectionHeading}>
                    <Ionicons name="hammer-outline" size={17} color="#23435D" />
                    <View style={styles.formSectionCopy}>
                      <Text style={styles.formSectionTitle}>Assigned Contractor</Text>
                      <Text style={styles.formSectionDescription}>
                        Private details visible only to authority users
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.inputLabel}>Contractor Name</Text>
                  <View style={styles.inputBox}>
                    <Ionicons name="business-outline" size={17} color="#7A8493" />
                    <TextInput
                      value={contractorName}
                      onChangeText={setContractorName}
                      placeholder="Enter contractor or company name"
                      placeholderTextColor="#98A2B3"
                      style={styles.input}
                    />
                  </View>

                  <Text style={styles.inputLabel}>Contractor Phone Number</Text>
                  <View style={styles.inputBox}>
                    <Ionicons name="call-outline" size={17} color="#7A8493" />
                    <TextInput
                      value={contractorPhone}
                      onChangeText={(value) =>
                        setContractorPhone(value.replace(/[^\d+]/g, ''))
                      }
                      placeholder="01712345678 or +8801712345678"
                      placeholderTextColor="#98A2B3"
                      keyboardType="phone-pad"
                      maxLength={14}
                      style={styles.input}
                    />
                  </View>
                  {contractorPhone.length > 0 &&
                    !isValidBangladeshPhone(contractorPhone) && (
                      <Text style={styles.validationError}>
                        Use 01XXXXXXXXX or +8801XXXXXXXXX
                      </Text>
                    )}

                  <Text style={styles.inputLabel}>Deadline</Text>
                  <DatePickerField value={deadline} onChange={setDeadline} />

                  <Text style={styles.inputLabel}>Estimated Budget</Text>
                  <View style={styles.inputBox}>
                    <Ionicons name="cash-outline" size={17} color="#7A8493" />
                    <TextInput
                      value={workBudget}
                      onChangeText={(value) =>
                        setWorkBudget(cleanBudgetInput(value))
                      }
                      placeholder="Enter estimated budget"
                      placeholderTextColor="#98A2B3"
                      keyboardType="decimal-pad"
                      style={styles.input}
                    />
                  </View>

                  <Text style={styles.inputLabel}>Initial Work Note</Text>
                  <TextInput
                    value={initialNote}
                    onChangeText={setInitialNote}
                    placeholder="Describe the planned work..."
                    placeholderTextColor="#98A2B3"
                    multiline
                    style={[styles.inputBox, styles.noteInput]}
                  />

                  {formMessage.length > 0 && (
                    <View style={styles.formMessage}>
                      <Ionicons name="information-circle-outline" size={17} color="#607A9A" />
                      <Text style={styles.formMessageText}>{formMessage}</Text>
                    </View>
                  )}

                  <TouchableOpacity
                    disabled={!canStartWork || actionLoading}
                    style={[
                      styles.primaryButton,
                      (!canStartWork || actionLoading) && styles.buttonDisabled,
                    ]}
                    onPress={handleStartWork}
                  >
                    {actionLoading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Ionicons
                          name="construct-outline"
                          size={18}
                          color="#FFFFFF"
                        />
                        <Text style={styles.primaryButtonText}>Start Work</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}

              {mode === 'in-progress' && (
                <View style={[styles.panel, styles.actionPanel]}>
                    <View style={styles.progressHeading}>
                      <View style={styles.progressCopy}>
                        <Text style={styles.actionTitle}>Record Progress</Text>
                        <Text style={styles.actionDescription}>
                          Add work progress, change the contractor, or complete the complaint.
                        </Text>
                      </View>
                      <Text style={styles.progressValue}>{complaint.progress}%</Text>
                    </View>
                    <View style={styles.progressTrack}>
                      <View
                        style={[styles.progressBar, { width: `${complaint.progress}%` }]}
                      />
                    </View>

                    <ProgressSegmentedControl
                      values={['Update', 'Contractor', 'Completed']}
                      selectedIndex={
                        progressAction === 'update'
                          ? 0
                          : progressAction === 'contractor'
                            ? 1
                            : 2
                      }
                      onChange={({ nativeEvent }) => {
                        setProgressAction(
                          nativeEvent.selectedSegmentIndex === 0
                            ? 'update'
                            : nativeEvent.selectedSegmentIndex === 1
                              ? 'contractor'
                              : 'completed',
                        );
                        setFormMessage('');
                      }}
                      style={styles.actionModeControl}
                    />

                    {progressAction === 'update' && (
                      <Animated.View
                        entering={FadeIn.duration(180)}
                        exiting={FadeOut.duration(120)}
                        style={styles.actionForm}
                      >

                    <Text style={styles.inputLabel}>Current Amount</Text>
                    <View style={styles.inputBox}>
                      <Ionicons name="cash-outline" size={17} color="#7A8493" />
                      <TextInput
                        value={workBudget}
                        onChangeText={(value) =>
                          setWorkBudget(cleanBudgetInput(value))
                        }
                        placeholder="Enter updated amount"
                        placeholderTextColor="#98A2B3"
                        keyboardType="decimal-pad"
                        style={styles.input}
                      />
                    </View>

                    <Text style={styles.inputLabel}>Deadline</Text>
                    <DatePickerField value={deadline} onChange={setDeadline} />

                    <Text style={styles.inputLabel}>Update Notes</Text>
                    <TextInput
                      value={updateNote}
                      onChangeText={setUpdateNote}
                      placeholder="What work was completed in this update?"
                      placeholderTextColor="#98A2B3"
                      multiline
                      style={[styles.inputBox, styles.noteInput]}
                    />

                    <Text style={styles.updateRequirementHint}>
                      Change the amount or deadline, add notes, or attach photos. Any one change is enough.
                    </Text>

                    <Text style={styles.inputLabel}>Work Evidence (1–5 photos)</Text>
                    <TouchableOpacity style={styles.photoPicker} onPress={chooseUpdatePhotos}>
                      <Ionicons name="images-outline" size={20} color="#23435D" />
                      <View style={styles.photoPickerCopy}>
                        <Text style={styles.photoPickerTitle}>Add progress photos (optional)</Text>
                        <Text style={styles.photoPickerText}>
                          {updateImages.length}/5 selected
                        </Text>
                      </View>
                      <Ionicons name="add-circle-outline" size={20} color="#3B82F6" />
                    </TouchableOpacity>
                    <EvidenceGrid
                      images={updateImages}
                      removable
                      onRemove={(index) =>
                        setUpdateImages((current) =>
                          current.filter((_, itemIndex) => itemIndex !== index),
                        )
                      }
                    />

                    {formMessage.length > 0 && (
                      <View style={styles.formMessage}>
                        <Ionicons name="information-circle-outline" size={17} color="#607A9A" />
                        <Text style={styles.formMessageText}>{formMessage}</Text>
                      </View>
                    )}

                    <TouchableOpacity
                      disabled={!canAddUpdate || actionLoading}
                      style={[
                        styles.secondaryButton,
                        (!canAddUpdate || actionLoading) && styles.buttonDisabled,
                      ]}
                      onPress={handleAddUpdate}
                    >
                      {actionLoading ? (
                        <ActivityIndicator size="small" color="#23435D" />
                      ) : (
                        <>
                          <Ionicons
                            name="add-circle-outline"
                            size={18}
                            color="#23435D"
                          />
                          <Text style={styles.secondaryButtonText}>Add Update</Text>
                        </>
                      )}
                    </TouchableOpacity>
                      </Animated.View>
                    )}

                    {progressAction === 'contractor' && (
                      <Animated.View
                        entering={FadeIn.duration(180)}
                        exiting={FadeOut.duration(120)}
                        style={styles.actionForm}
                      >
                        <View style={styles.resolveHeading}>
                          <View style={styles.contractorActionIcon}>
                            <Ionicons name="swap-horizontal" size={21} color="#FFFFFF" />
                          </View>
                          <View style={styles.progressCopy}>
                            <Text style={styles.actionTitle}>Change Contractor</Text>
                            <Text style={styles.actionDescription}>
                              Close the current assignment and start a new dated assignment.
                            </Text>
                          </View>
                        </View>

                        <Text style={styles.inputLabel}>New Contractor Name</Text>
                        <View style={styles.inputBox}>
                          <Ionicons name="business-outline" size={17} color="#7A8493" />
                          <TextInput
                            value={newContractorName}
                            onChangeText={setNewContractorName}
                            placeholder="Enter contractor or company name"
                            placeholderTextColor="#98A2B3"
                            style={styles.input}
                          />
                        </View>

                        <Text style={styles.inputLabel}>New Phone Number</Text>
                        <View style={styles.inputBox}>
                          <Ionicons name="call-outline" size={17} color="#7A8493" />
                          <TextInput
                            value={newContractorPhone}
                            onChangeText={(value) =>
                              setNewContractorPhone(value.replace(/[^\d+]/g, ''))
                            }
                            placeholder="01712345678 or +8801712345678"
                            placeholderTextColor="#98A2B3"
                            keyboardType="phone-pad"
                            maxLength={14}
                            style={styles.input}
                          />
                        </View>
                        {newContractorPhone.length > 0 &&
                          !isValidBangladeshPhone(newContractorPhone) && (
                            <Text style={styles.validationError}>
                              Use 01XXXXXXXXX or +8801XXXXXXXXX
                            </Text>
                          )}

                        <Text style={styles.inputLabel}>Reason for Contractor Change</Text>
                        <TextInput
                          value={contractorChangeReason}
                          onChangeText={setContractorChangeReason}
                          placeholder="Explain why the current contractor is being replaced..."
                          placeholderTextColor="#98A2B3"
                          multiline
                          style={[styles.inputBox, styles.noteInput]}
                        />

                        <View style={styles.contractorPrivacyNotice}>
                          <Ionicons name="eye-off-outline" size={16} color="#607A9A" />
                          <Text style={styles.contractorPrivacyText}>
                            Contractor details and change reasons are visible only to authority users.
                          </Text>
                        </View>

                        {formMessage.length > 0 && (
                          <View style={styles.formMessage}>
                            <Ionicons name="information-circle-outline" size={17} color="#607A9A" />
                            <Text style={styles.formMessageText}>{formMessage}</Text>
                          </View>
                        )}

                        <TouchableOpacity
                          disabled={!canChangeContractor || actionLoading}
                          style={[
                            styles.secondaryButton,
                            (!canChangeContractor || actionLoading) &&
                              styles.buttonDisabled,
                          ]}
                          onPress={handleChangeContractor}
                        >
                          {actionLoading ? (
                            <ActivityIndicator size="small" color="#23435D" />
                          ) : (
                            <>
                              <Ionicons
                                name="person-add-outline"
                                size={18}
                                color="#23435D"
                              />
                              <Text style={styles.secondaryButtonText}>
                                Assign New Contractor
                              </Text>
                            </>
                          )}
                        </TouchableOpacity>
                      </Animated.View>
                    )}

                    {progressAction === 'completed' && (
                      <Animated.View
                        entering={FadeIn.duration(180)}
                        exiting={FadeOut.duration(120)}
                        style={styles.actionForm}
                      >
                    <View style={styles.resolveHeading}>
                      <View style={styles.resolveActionIcon}>
                        <Ionicons name="checkmark-done-outline" size={21} color="#FFFFFF" />
                      </View>
                      <View style={styles.progressCopy}>
                        <Text style={styles.actionTitle}>Complete Complaint</Text>
                        <Text style={styles.actionDescription}>
                          Upload final proof and notes to close this complaint.
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.inputLabel}>Final Completion Photo</Text>
                    <TouchableOpacity style={styles.finalPhotoPicker} onPress={chooseFinalEvidence}>
                      {finalEvidence ? (
                        <Image source={finalEvidence} style={styles.finalPhoto} contentFit="cover" />
                      ) : (
                        <View style={styles.finalPhotoEmpty}>
                          <Ionicons name="camera-outline" size={27} color="#2563EB" />
                          <Text style={styles.finalPhotoTitle}>Add completion proof</Text>
                          <Text style={styles.finalPhotoText}>
                            Required before this complaint can be completed
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>

                    <Text style={styles.inputLabel}>Completion Notes</Text>
                    <TextInput
                      value={resolutionNote}
                      onChangeText={setResolutionNote}
                      placeholder="Describe the completed work and final inspection..."
                      placeholderTextColor="#98A2B3"
                      multiline
                      style={[styles.inputBox, styles.noteInput]}
                    />

                    {formMessage.length > 0 && (
                      <View style={styles.formMessage}>
                        <Ionicons name="information-circle-outline" size={17} color="#607A9A" />
                        <Text style={styles.formMessageText}>{formMessage}</Text>
                      </View>
                    )}

                    <TouchableOpacity
                      disabled={!canResolve || actionLoading}
                      style={[
                        styles.primaryButton,
                        (!canResolve || actionLoading) && styles.buttonDisabled,
                      ]}
                      onPress={handleResolve}
                    >
                      {actionLoading ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <>
                          <Ionicons
                            name="checkmark-done-outline"
                            size={18}
                            color="#FFFFFF"
                          />
                          <Text style={styles.primaryButtonText}>
                            Mark as Completed
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                      </Animated.View>
                    )}
                </View>
              )}

              {mode === 'resolved' && (
                <View style={[styles.panel, styles.resolutionPanel]}>
                  <View style={styles.resolutionIcon}>
                    <Ionicons name="checkmark-done" size={24} color="#FFFFFF" />
                  </View>
                  <Text style={styles.resolutionTitle}>Resolution Complete</Text>
                  <Text style={styles.resolutionDescription}>
                    This complaint is closed. Work details and evidence are read-only.
                  </Text>

                  <View style={styles.resolutionDetails}>
                    <DetailItem
                      icon="calendar-outline"
                      label="Completed"
                      value={complaint.completedAt ?? 'Completion date unavailable'}
                    />
                    <DetailItem
                      icon="flag-outline"
                      label="Final Deadline"
                      value={
                        complaint.deadline
                          ? formatDateOnly(complaint.deadline)
                          : 'Not available'
                      }
                    />
                    <DetailItem
                      icon="cash-outline"
                      label="Final Budget"
                      value={complaint.budget || 'Not available'}
                    />
                  </View>

                  <View style={styles.resolutionNote}>
                    <Text style={styles.resolutionNoteLabel}>RESOLUTION NOTE</Text>
                    <Text selectable style={styles.resolutionNoteText}>
                      {complaint.resolutionNote}
                    </Text>
                  </View>

                  {hasValidImage(complaint.finalEvidence) && (
                    <View style={styles.finalEvidenceCard}>
                      <Text style={styles.resolutionNoteLabel}>FINAL COMPLETION PHOTO</Text>
                      <Image
                        source={complaint.finalEvidence}
                        style={styles.finalEvidenceImage}
                        contentFit="cover"
                      />
                    </View>
                  )}
                </View>
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F7F8FA' },
  scrollContent: { paddingBottom: 34 },
  container: {
    width: '100%',
    maxWidth: 1180,
    alignSelf: 'center',
    padding: 16,
    gap: 17,
  },
  hero: {
    gap: 7,
    padding: 17,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAEDF1',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 13,
  },
  statusText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.4 },
  complaintId: { color: '#3B82F6', fontSize: 10, fontWeight: '800' },
  title: { color: '#111827', fontSize: 24, fontWeight: '800' },
  description: { color: '#667085', fontSize: 12, lineHeight: 18 },
  pageGrid: { gap: 15 },
  pageGridWide: { flexDirection: 'row', alignItems: 'flex-start' },
  mainColumn: { flex: 1.5, gap: 15, minWidth: 0 },
  sideColumn: { flex: 0.85, gap: 15, minWidth: 0 },
  panel: {
    padding: 16,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAEDF1',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  },
  panelHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 14,
  },
  panelHeadingCopy: { flex: 1, minWidth: 0 },
  panelTitle: { color: '#1F2937', fontSize: 16, fontWeight: '800' },
  panelSubtitle: { color: '#8A93A1', fontSize: 9, marginTop: 3 },
  detailsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  detailItem: {
    flex: 1,
    minWidth: 190,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 11,
    borderRadius: 11,
    backgroundColor: '#F8FAFB',
  },
  detailIcon: {
    width: 35,
    height: 35,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8EEF2',
  },
  detailCopy: { flex: 1, minWidth: 0 },
  detailLabel: { color: '#8A93A1', fontSize: 8, fontWeight: '700' },
  detailValue: { color: '#344054', fontSize: 10, fontWeight: '700', marginTop: 3 },
  evidenceImage: {
    width: '100%',
    aspectRatio: 1.5,
    borderRadius: 12,
    backgroundColor: '#E8EDF4',
  },
  noEvidence: {
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 12,
    backgroundColor: '#F2F4F7',
  },
  noEvidenceTitle: {
    color: '#475467',
    fontSize: 11,
    fontWeight: '800',
  },
  noEvidenceText: {
    color: '#98A2B3',
    fontSize: 9,
    textAlign: 'center',
  },
  evidenceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 9 },
  evidenceThumbWrap: {
    width: 98,
    height: 76,
    borderRadius: 9,
    overflow: 'visible',
    position: 'relative',
  },
  evidenceThumb: {
    width: '100%',
    height: '100%',
    borderRadius: 9,
    backgroundColor: '#E8EDF4',
  },
  removePhoto: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 23,
    height: 23,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC4B42',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  approvalCard: {
    minHeight: 92,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 11,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#CDE8DB',
    backgroundColor: '#F1FBF6',
  },
  approvalIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16845B',
  },
  approvalCopy: { flex: 1, minWidth: 0 },
  approvalLabel: {
    color: '#16845B',
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  approvalName: { color: '#1F2937', fontSize: 12, fontWeight: '800', marginTop: 3 },
  approvalRole: { color: '#4A7C69', fontSize: 8, marginTop: 2 },
  approvalDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 7,
  },
  approvalDate: { flex: 1, color: '#607A72', fontSize: 7, lineHeight: 11 },
  approvedBadge: {
    maxWidth: 72,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: '#DDF4E8',
  },
  approvedBadgeText: {
    color: '#16845B',
    fontSize: 6,
    fontWeight: '900',
    lineHeight: 9,
    textAlign: 'center',
  },
  reporterPanel: {
    overflow: 'hidden',
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAEDF1',
  },
  reporterCard: {
    minHeight: 82,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    padding: 14,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8EEF2',
  },
  avatarText: { color: '#23435D', fontSize: 12, fontWeight: '900' },
  reporterCopy: { flex: 1, minWidth: 0 },
  reporterLabel: { color: '#B9854B', fontSize: 7, fontWeight: '900', letterSpacing: 0.5 },
  reporterName: { color: '#1F2937', fontSize: 12, fontWeight: '800', marginTop: 3 },
  reporterPhone: { color: '#7A8493', fontSize: 9, marginTop: 3 },
  primaryReporterHint: { color: '#98A2B3', fontSize: 7, lineHeight: 11, marginTop: 4 },
  otherReportersToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#EAEDF1',
    backgroundColor: '#FBFCFE',
  },
  otherReportersTogglePressed: { opacity: 0.72 },
  otherReportersIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EAF2FD',
  },
  otherReportersCopy: { flex: 1, minWidth: 0 },
  otherReportersTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  otherReportersTitle: { color: '#344054', fontSize: 10, fontWeight: '800' },
  otherReportersCount: {
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    borderRadius: 10,
    backgroundColor: '#2563EB',
  },
  otherReportersCountText: {
    color: '#FFFFFF',
    fontSize: 7,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  otherReportersDescription: { color: '#7890AB', fontSize: 7, marginTop: 2 },
  otherReportersList: {
    gap: 8,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#EAEDF1',
    backgroundColor: '#F8FAFC',
  },
  otherReporterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E3E8EF',
    backgroundColor: '#FFFFFF',
  },
  otherReporterAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8EEF2',
  },
  otherReporterAvatarText: {
    color: '#23435D',
    fontSize: 8,
    fontWeight: '900',
  },
  otherReporterCopy: { flex: 1, minWidth: 0 },
  otherReporterName: { color: '#344054', fontSize: 9, fontWeight: '800' },
  otherReporterDate: { color: '#8A93A1', fontSize: 7, lineHeight: 11, marginTop: 2 },
  contractorPanel: { gap: 0 },
  currentContractorCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 11,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CFE0F5',
    backgroundColor: '#F4F8FE',
  },
  currentContractorIcon: {
    width: 43,
    height: 43,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
  },
  currentContractorCopy: { flex: 1, minWidth: 0 },
  currentContractorLabel: {
    color: '#2563EB',
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  currentContractorName: {
    color: '#1F2937',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 3,
  },
  currentContractorPhone: { color: '#52677F', fontSize: 9, marginTop: 3 },
  currentContractorDates: { color: '#7890AB', fontSize: 8, lineHeight: 12, marginTop: 5 },
  workHistoryPhases: { gap: 14 },
  intakePhase: {
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E3E8EF',
    backgroundColor: '#F9FAFB',
  },
  intakePhaseHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  intakePhaseIcon: {
    width: 31,
    height: 31,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8EEF2',
  },
  intakePhaseCopy: { flex: 1, minWidth: 0 },
  intakePhaseTitle: { color: '#344054', fontSize: 11, fontWeight: '800' },
  intakePhaseText: { color: '#8A93A1', fontSize: 8, marginTop: 2 },
  contractorWorkPhase: { gap: 10 },
  phaseActivity: {
    marginLeft: 12,
    paddingLeft: 15,
    borderLeftWidth: 2,
    borderLeftColor: '#DCE8F7',
  },
  phaseActivityHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 11,
  },
  phaseActivityLabel: {
    color: '#607A9A',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.45,
  },
  emptyPhaseActivity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingBottom: 5,
  },
  emptyPhaseActivityText: {
    flex: 1,
    color: '#98A2B3',
    fontSize: 8,
    lineHeight: 13,
  },
  contractorTransition: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    marginLeft: 12,
    padding: 11,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#F2E2C9',
    backgroundColor: '#FFF9EF',
  },
  contractorTransitionIcon: {
    width: 31,
    height: 31,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FBEACF',
  },
  contractorTransitionCopy: { flex: 1, minWidth: 0 },
  contractorTransitionHeading: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  contractorTransitionTitle: {
    flex: 1,
    color: '#8C5715',
    fontSize: 10,
    fontWeight: '900',
  },
  contractorTransitionTime: {
    maxWidth: '48%',
    color: '#A18057',
    fontSize: 7,
    lineHeight: 11,
    textAlign: 'right',
  },
  contractorTransitionText: {
    color: '#5F482C',
    fontSize: 9,
    fontWeight: '800',
    lineHeight: 14,
    marginTop: 5,
  },
  contractorTransitionReason: {
    gap: 3,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F2E2C9',
  },
  contractorTransitionReasonLabel: {
    color: '#A86617',
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 0.35,
  },
  contractorTransitionReasonText: {
    color: '#7A5A30',
    fontSize: 8,
    lineHeight: 13,
  },
  contractorHistoryItem: {
    gap: 8,
    padding: 11,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#E3E8EF',
    backgroundColor: '#F9FAFB',
  },
  contractorHistoryHeading: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
  },
  contractorHistoryNumber: {
    width: 25,
    height: 25,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8EEF2',
  },
  contractorHistoryNumberText: { color: '#23435D', fontSize: 8, fontWeight: '900' },
  contractorHistoryCopy: { flex: 1, minWidth: 0 },
  contractorHistoryName: { color: '#344054', fontSize: 10, fontWeight: '800' },
  contractorHistoryPhone: { color: '#7A8493', fontSize: 8, marginTop: 2 },
  currentContractorBadge: {
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: '#EAF8EF',
  },
  currentContractorBadgeText: { color: '#16845B', fontSize: 6, fontWeight: '900' },
  contractorDateRange: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  contractorDateRangeText: { flex: 1, color: '#607A9A', fontSize: 8, lineHeight: 12 },
  actionPanel: { gap: 10 },
  actionModeControl: { width: '100%', height: 38 },
  actionForm: { gap: 10 },
  formSectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#F0F5F7',
  },
  formSectionCopy: { flex: 1 },
  formSectionTitle: { color: '#344054', fontSize: 10, fontWeight: '800' },
  formSectionDescription: { color: '#7A8493', fontSize: 8, marginTop: 2 },
  actionIcon: {
    width: 43,
    height: 43,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#C57C1B',
  },
  actionTitle: { color: '#1F2937', fontSize: 17, fontWeight: '800' },
  actionDescription: { color: '#7A8493', fontSize: 10, lineHeight: 15 },
  inputLabel: { color: '#475467', fontSize: 9, fontWeight: '800', marginTop: 2 },
  inputBox: {
    minHeight: 43,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 11,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#DDE2E8',
    backgroundColor: '#FFFFFF',
  },
  input: { flex: 1, color: '#344054', fontSize: 10 },
  validationError: {
    color: '#DC2626',
    fontSize: 8,
    marginTop: -4,
  },
  dateFieldText: {
    flex: 1,
    color: '#344054',
    fontSize: 10,
  },
  dateFieldPlaceholder: {
    color: '#98A2B3',
  },
  calendarOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.42)',
  },
  calendarCard: {
    width: '100%',
    maxWidth: 390,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  calendarNavButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
  },
  calendarNavButtonDisabled: {
    opacity: 0.3,
  },
  calendarMonthTitle: {
    flex: 1,
    color: '#1F2937',
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
  calendarWeekHeader: {
    flexDirection: 'row',
    marginTop: 14,
  },
  calendarWeekday: {
    width: '14.2857%',
    color: '#98A2B3',
    fontSize: 8,
    fontWeight: '800',
    textAlign: 'center',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 7,
  },
  calendarDayCell: {
    width: '14.2857%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  calendarDaySelected: {
    backgroundColor: '#23435D',
  },
  calendarDayText: {
    color: '#344054',
    fontSize: 10,
    fontWeight: '700',
  },
  calendarDayDisabledText: {
    color: '#D0D5DD',
  },
  calendarDaySelectedText: {
    color: '#FFFFFF',
  },
  calendarFooter: {
    gap: 10,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#EAECF0',
  },
  calendarHint: {
    color: '#667085',
    fontSize: 8,
    textAlign: 'center',
  },
  calendarCloseButton: {
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
  },
  calendarCloseText: {
    color: '#23435D',
    fontSize: 9,
    fontWeight: '800',
  },
  noteInput: {
    minHeight: 92,
    color: '#344054',
    fontSize: 10,
    lineHeight: 16,
    paddingTop: 11,
    textAlignVertical: 'top',
  },
  primaryButton: {
    minHeight: 45,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 23,
    backgroundColor: '#23435D',
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 10, fontWeight: '900' },
  secondaryButton: {
    minHeight: 43,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 22,
    backgroundColor: '#F0F5F7',
    borderWidth: 1,
    borderColor: '#D7E2E7',
  },
  secondaryButtonText: { color: '#23435D', fontSize: 10, fontWeight: '900' },
  buttonDisabled: { opacity: 0.42 },
  progressHeading: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  progressCopy: { flex: 1 },
  progressValue: { color: '#C57C1B', fontSize: 21, fontWeight: '900' },
  progressTrack: {
    height: 8,
    overflow: 'hidden',
    borderRadius: 4,
    backgroundColor: '#F0E4D4',
  },
  progressBar: { height: '100%', borderRadius: 4, backgroundColor: '#C57C1B' },
  updateRequirementHint: {
    color: '#7890AB',
    fontSize: 8,
    lineHeight: 12,
    marginTop: -2,
  },
  photoPicker: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 11,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#BFCBD4',
    backgroundColor: '#F8FAFB',
  },
  photoPickerCopy: { flex: 1 },
  photoPickerTitle: { color: '#344054', fontSize: 10, fontWeight: '800' },
  photoPickerText: { color: '#8A93A1', fontSize: 8, marginTop: 2 },
  formMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#EFF4F7',
  },
  formMessageText: { flex: 1, color: '#52677F', fontSize: 9, lineHeight: 14 },
  contractorPrivacyNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#F8FAFB',
    borderWidth: 1,
    borderColor: '#E3E8EF',
  },
  contractorPrivacyText: { flex: 1, color: '#607A9A', fontSize: 8, lineHeight: 13 },
  resolveHeading: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  contractorActionIcon: {
    width: 43,
    height: 43,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16845B',
  },
  resolveActionIcon: {
    width: 43,
    height: 43,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
  },
  finalPhotoPicker: {
    width: '100%',
    minHeight: 150,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#9DBCE5',
    backgroundColor: '#F4F8FE',
  },
  finalPhoto: { width: '100%', height: 180 },
  finalPhotoEmpty: {
    minHeight: 150,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    padding: 18,
  },
  finalPhotoTitle: { color: '#1D4F91', fontSize: 11, fontWeight: '800' },
  finalPhotoText: { color: '#7890AB', fontSize: 8, textAlign: 'center' },
  resolutionPanel: { gap: 11, backgroundColor: '#F8FBFF', borderColor: '#DCE8F7' },
  resolutionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
  },
  resolutionTitle: { color: '#1D4F91', fontSize: 18, fontWeight: '900' },
  resolutionDescription: { color: '#607A9A', fontSize: 10, lineHeight: 15 },
  resolutionDetails: { gap: 8 },
  resolutionNote: {
    gap: 6,
    padding: 12,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCE8F7',
  },
  resolutionNoteLabel: { color: '#2563EB', fontSize: 8, fontWeight: '900', letterSpacing: 0.5 },
  resolutionNoteText: { color: '#52677F', fontSize: 10, lineHeight: 16 },
  finalEvidenceCard: {
    gap: 8,
    padding: 12,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCE8F7',
  },
  finalEvidenceImage: { width: '100%', aspectRatio: 1.4, borderRadius: 9 },
  timeline: { gap: 0 },
  timelineRow: { flexDirection: 'row', gap: 11 },
  timelineTrack: { width: 28, alignItems: 'center' },
  timelineDot: {
    width: 27,
    height: 27,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineDotComplete: { backgroundColor: '#16845B' },
  timelineDotPending: { backgroundColor: '#B9854B' },
  timelineLine: { width: 2, flex: 1, minHeight: 45, backgroundColor: '#E1E5EA' },
  timelineLineComplete: { backgroundColor: '#B8DFCF' },
  timelineContent: { flex: 1, minWidth: 0, paddingBottom: 17 },
  timelineHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 9,
  },
  timelineTitle: { flex: 1, color: '#344054', fontSize: 11, fontWeight: '800' },
  timelineTime: { color: '#8A93A1', fontSize: 8 },
  timelineNote: { color: '#667085', fontSize: 9, lineHeight: 14, marginTop: 4 },
  budgetChange: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 7,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: '#F0F5F7',
  },
  budgetChangeText: { color: '#607A9A', fontSize: 8, fontWeight: '700' },
  starRow: { flexDirection: 'row', gap: 2 },
  feedbackSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#FFF9EF',
    borderWidth: 1,
    borderColor: '#F2E2C9',
  },
  feedbackAverage: { color: '#9A6118', fontSize: 31, fontWeight: '900' },
  feedbackCount: { color: '#8A735A', fontSize: 8, marginTop: 4 },
  feedbackList: { gap: 10, marginTop: 12 },
  feedbackCard: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    borderRadius: 11,
    backgroundColor: '#F9FAFB',
  },
  feedbackAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8EEF2',
  },
  feedbackAvatarText: { color: '#23435D', fontSize: 9, fontWeight: '900' },
  feedbackCopy: { flex: 1, minWidth: 0 },
  feedbackHeading: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  feedbackName: { color: '#344054', fontSize: 10, fontWeight: '800' },
  feedbackDate: { color: '#98A2B3', fontSize: 7, marginTop: 2 },
  feedbackComment: { color: '#667085', fontSize: 9, lineHeight: 14, marginTop: 7 },
  emptyFeedback: { alignItems: 'center', paddingVertical: 20 },
  emptyFeedbackTitle: { color: '#475467', fontSize: 11, fontWeight: '800', marginTop: 7 },
  emptyFeedbackText: { color: '#98A2B3', fontSize: 8, marginTop: 3 },
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  loadingTitle: {
    color: '#344054',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 14,
  },
  loadingText: {
    color: '#8A93A1',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 5,
  },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 },
  notFoundTitle: { color: '#344054', fontSize: 17, fontWeight: '800', marginTop: 10 },
  notFoundText: { color: '#8A93A1', fontSize: 10, textAlign: 'center', marginTop: 5 },
});

function ContractorAssignmentRow({
  assignment,
  index,
  isCurrent,
}: {
  assignment: AuthorityContractorAssignment;
  index: number;
  isCurrent: boolean;
}) {
  return (
    <View style={styles.contractorHistoryItem}>
      <View style={styles.contractorHistoryHeading}>
        <View style={styles.contractorHistoryNumber}>
          <Text style={styles.contractorHistoryNumberText}>{index + 1}</Text>
        </View>
        <View style={styles.contractorHistoryCopy}>
          <Text selectable style={styles.contractorHistoryName}>
            {assignment.name}
          </Text>
          <Text selectable style={styles.contractorHistoryPhone}>
            {assignment.phone}
          </Text>
        </View>
        {isCurrent && (
          <View style={styles.currentContractorBadge}>
            <Text style={styles.currentContractorBadgeText}>CURRENT</Text>
          </View>
        )}
      </View>

      <View style={styles.contractorDateRange}>
        <Ionicons name="calendar-outline" size={13} color="#607A9A" />
        <Text selectable style={styles.contractorDateRangeText}>
          {assignment.assignedFrom} to {assignment.assignedUntil ?? 'Present'}
        </Text>
      </View>
    </View>
  );
}

function ContractorAssignments({
  complaint,
  mode,
}: {
  complaint: AuthorityComplaintDetail;
  mode: AuthorityComplaintDetailMode;
}) {
  const assignments = complaint.contractorAssignments;
  const currentContractor =
    assignments.find((assignment) => !assignment.assignedUntil) ?? assignments.at(-1);

  if (!currentContractor) return null;

  return (
    <View style={[styles.panel, styles.contractorPanel]}>
      <View style={styles.panelHeading}>
        <View>
          <Text style={styles.panelTitle}>Assigned Contractor</Text>
          <Text style={styles.panelSubtitle}>Authority-only assignment information</Text>
        </View>
        <Ionicons name="shield-outline" size={21} color="#23435D" />
      </View>

      <View style={styles.currentContractorCard}>
        <View style={styles.currentContractorIcon}>
          <Ionicons name="hammer-outline" size={20} color="#FFFFFF" />
        </View>
        <View style={styles.currentContractorCopy}>
          <Text style={styles.currentContractorLabel}>
            {mode === 'resolved' ? 'FINAL CONTRACTOR' : 'CURRENT CONTRACTOR'}
          </Text>
          <Text selectable style={styles.currentContractorName}>
            {currentContractor.name}
          </Text>
          <Text selectable style={styles.currentContractorPhone}>
            {currentContractor.phone}
          </Text>
          <Text selectable style={styles.currentContractorDates}>
            {currentContractor.assignedFrom} to{' '}
            {currentContractor.assignedUntil ?? 'Present'}
          </Text>
        </View>
      </View>
    </View>
  );
}
