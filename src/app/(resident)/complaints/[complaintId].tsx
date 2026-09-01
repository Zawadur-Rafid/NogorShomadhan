import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect, useRef } from 'react';
import Animated, { FadeInDown, FadeOut } from 'react-native-reanimated';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
  TextInput,
  ActivityIndicator,
  Alert,
  Animated as RNAnimated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getComplaintDetails, deleteComplaint } from '@/services/resident.service';
import { confirmAction } from '@/utils/confirm';

export type ComplaintDetailMode = 'unverified' | 'pending' | 'in-progress' | 'resolved';

const modeTheme = {
  unverified: {
    label: 'UNVERIFIED',
    color: '#6B7280',
    background: '#F3F4F6',
    icon: 'help-circle-outline' as const,
  },
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

function getDetailMode(status?: string): ComplaintDetailMode {
  if (status === 'UNVERIFIED') return 'unverified';
  if (status === 'IN PROGRESS') return 'in-progress';
  if (status === 'RESOLVED') return 'resolved';
  return 'pending';
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
  images: any[];
  removable?: boolean;
  onRemove?: (index: number) => void;
}) {
  if (!images || images.length === 0) return null;

  return (
    <View style={styles.evidenceGrid}>
      {images.map((image, index) => (
        <View key={`${index}`} style={styles.evidenceThumbWrap}>
          <Image source={{uri: image}} style={styles.evidenceThumb} contentFit="cover" />
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

function WorkActivityTimeline({ updates }: { updates: any[] }) {
  if (!updates || updates.length === 0) {
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

function ContractorAssignmentRow({
  assignment,
  index,
  isCurrent,
}: {
  assignment: any;
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

function ComplaintTimeline({
  complaint,
}: {
  complaint: any;
}) {
  const updates = complaint.updates || [];
  const assignments = complaint.contractorAssignments || [];
  
  const unassignedUpdates = updates.filter(
    (update: any) => !update.contractorAssignmentId,
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
        {(unassignedUpdates.length > 0 || assignments.length === 0) && (
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
            {unassignedUpdates.length > 0 ? (
              <WorkActivityTimeline updates={unassignedUpdates} />
            ) : (
              <View style={styles.emptyPhaseActivity}>
                <Ionicons name="document-text-outline" size={17} color="#98A2B3" />
                <Text style={styles.emptyPhaseActivityText}>
                  Awaiting authority to begin work.
                </Text>
              </View>
            )}
          </View>
        )}

        {assignments.map((assignment: any, index: number) => {
          const nextAssignment = assignments[index + 1];
          const assignmentUpdates = updates.filter(
            (update: any) =>
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

function ContractorAssignments({
  complaint,
  mode,
}: {
  complaint: any;
  mode: ComplaintDetailMode;
}) {
  const assignments = complaint.contractorAssignments || [];
  const currentContractor =
    assignments.find((assignment: any) => !assignment.assignedUntil) ?? assignments.at(-1);

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

function ApprovalCard({ approval }: { approval: any }) {
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

function InteractiveStarRating({ rating, setRating, size = 28 }: { rating: number; setRating: (val: number) => void; size?: number }) {
  return (
    <View style={styles.interactiveStarRow}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity key={star} onPress={() => setRating(star)}>
          <Ionicons
            name={star <= rating ? 'star' : 'star-outline'}
            size={size}
            color={star <= rating ? '#F2A93B' : '#C4D1DF'}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

function FeedbackCard({ feedback }: { feedback: any }) {
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

function ResidentFeedback({
  feedback,
  rating,
  setRating,
  comment,
  setComment,
  hasSubmitted,
  onSubmit,
}: {
  feedback: any[];
  rating: number;
  setRating: (r: number) => void;
  comment: string;
  setComment: (c: string) => void;
  hasSubmitted: boolean;
  onSubmit: () => void;
}) {
  const average =
    feedback.length === 0
      ? 0
      : feedback.reduce((total, item) => total + item.rating, 0) / feedback.length;

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

      {!hasSubmitted && (
        <View style={styles.leaveFeedbackContainer}>
          <Text style={styles.leaveFeedbackTitle}>Leave your feedback</Text>
          <InteractiveStarRating rating={rating} setRating={setRating} />
          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder="Write your comments here..."
            placeholderTextColor="#98A2B3"
            multiline
            style={styles.leaveFeedbackInput}
          />
          <TouchableOpacity
            style={[styles.leaveFeedbackButton, (rating === 0 || comment.trim() === '') && styles.buttonDisabled]}
            disabled={rating === 0 || comment.trim() === ''}
            onPress={onSubmit}
          >
            <Text style={styles.leaveFeedbackButtonText}>Submit Feedback</Text>
          </TouchableOpacity>
        </View>
      )}

      {feedback.length === 0 ? (
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
                Based on {feedback.length} {feedback.length === 1 ? 'response' : 'responses'}
              </Text>
            </View>
          </View>
          <View style={styles.feedbackList}>
            {feedback.map((item) => (
              <FeedbackCard key={item.id} feedback={item} />
            ))}
          </View>
        </>
      )}
    </View>
  );
}

function ReporterProfile({ complaint }: { complaint: any }) {
  const [expanded, setExpanded] = useState(false);
  const maxReporters: number = 3;
  const bangladeshiNames = ['Rahim Uddin', 'Karim Hasan', 'Anisur Rahman'];
  
  const otherReporters = Array.from({ length: maxReporters }).map((_, i) => {
    const name = bangladeshiNames[i];
    const initials = name.split(' ').map(n => n[0]).join('');
    return {
      id: `r-${i}`,
      initials,
      name,
      submittedAt: complaint.date,
    };
  });

  const reporterCount = maxReporters;

  return (
    <View style={styles.reporterPanel}>
      <View style={styles.reporterCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>ME</Text>
        </View>
        <View style={styles.reporterCopy}>
          <Text style={styles.reporterLabel}>PRIMARY REPORTER</Text>
          <Text selectable style={styles.reporterName}>
            You (Resident)
          </Text>
          <Text selectable style={styles.reporterPhone}>
            017XXXXXXXX
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
                <Text style={styles.otherReportersTitle}>Other Reporters</Text>
                <View style={styles.otherReportersCount}>
                  <Text style={styles.otherReportersCountText}>{reporterCount}</Text>
                </View>
              </View>
              <Text style={styles.otherReportersDescription}>
                AI-matched duplicate {reporterCount === 1 ? 'report' : 'reports'}
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
              {otherReporters.map((reporter) => (
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

export default function ComplaintDetailScreen() {
  const router = useRouter();
  const { complaintId } = useLocalSearchParams<{ complaintId: string }>();
  const { width } = useWindowDimensions();

  const [complaint, setComplaint] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const slideAnim = useRef(new RNAnimated.Value(400)).current;

  const triggerToast = (message: string, callback?: () => void) => {
    setToastMessage(message);
    setShowToast(true);
    RNAnimated.sequence([
      RNAnimated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
      RNAnimated.delay(2000),
      RNAnimated.timing(slideAnim, {
        toValue: 400,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowToast(false);
      if (callback) callback();
    });
  };

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getComplaintDetails(complaintId);
        setComplaint(data);
      } catch (error) {
        if (error instanceof Error) Alert.alert('Error', error.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [complaintId]);

  const handleDelete = () => {
    confirmAction(
      'Are you sure you want to delete this complaint?',
      async () => {
        try {
          setDeleting(true);
          await deleteComplaint(complaintId);
          triggerToast('The complaint has been successfully deleted.', () => {
            router.back();
          });
        } catch (error) {
          if (error instanceof Error) {
            Alert.alert('Error', error.message);
          }
        } finally {
          setDeleting(false);
        }
      },
      'Delete Complaint'
    );
  };

  const wide = width >= 900;
  const mode = getDetailMode(complaint?.status);
  const theme = modeTheme[mode];

  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [hasSubmittedFeedback, setHasSubmittedFeedback] = useState(false);
  const [localFeedback, setLocalFeedback] = useState(complaint?.feedback || []);
  const [hasUpvoted, setHasUpvoted] = useState(false);

  useEffect(() => {
    if (complaint) {
      setLocalFeedback(complaint.feedback || []);
    }
  }, [complaint]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.notFound}>
          <ActivityIndicator size="large" color="#23435D" />
          <Text style={styles.notFoundTitle}>Loading complaint details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!complaint) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.notFound}>
          <Ionicons name="document-text-outline" size={38} color="#98A2B3" />
          <Text style={styles.notFoundTitle}>Complaint not found</Text>
          <Text style={styles.notFoundText}>
            This complaint record is not available.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const displayEvidence = complaint.images && complaint.images.length > 0 
    ? complaint.images[0] 
    : complaint.image;

  return (
    <SafeAreaView style={styles.safeArea}>
      {showToast && (
        <RNAnimated.View style={[styles.toastContainer, { transform: [{ translateX: slideAnim }] }]}>
          <View style={styles.toastLeftBorder} />
          <Ionicons name="checkmark-circle" size={24} color="#1b7a43" style={styles.toastIcon} />
          <View style={styles.toastContent}>
            <Text style={styles.toastTitle}>Success</Text>
            <Text style={styles.toastText}>{toastMessage}</Text>
          </View>
          <TouchableOpacity onPress={() => setShowToast(false)} style={styles.toastCloseButton}>
            <Ionicons name="close" size={18} color="#1a1a1a" />
          </TouchableOpacity>
        </RNAnimated.View>
      )}

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
            </View>
            <Text selectable style={styles.title}>
              {complaint.title}
            </Text>
            <Text selectable style={styles.description}>
              {complaint.description}
            </Text>
            {mode === 'unverified' && (
              <TouchableOpacity 
                style={styles.deleteButton} 
                onPress={handleDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="trash-outline" size={16} color="#FFFFFF" />
                    <Text style={styles.deleteButtonText}>Delete Complaint</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>

          <View style={[styles.pageGrid, wide && styles.pageGridWide]}>
            <View style={styles.mainColumn}>
              <View style={styles.panel}>
                <View style={styles.panelHeading}>
                  <View>
                    <Text style={styles.panelTitle}>Complaint Information</Text>
                    <Text style={styles.panelSubtitle}>
                      Verified resident report and assignment details
                    </Text>
                  </View>
                  <Ionicons name="information-circle-outline" size={22} color="#23435D" />
                </View>

                <View style={styles.detailsGrid}>
                  <DetailItem icon="layers-outline" label="Category" value={complaint.category} />
                  <DetailItem icon="location-outline" label="Location" value={complaint.location} />
                  <DetailItem icon="calendar-outline" label="Submitted" value={complaint.date} />
                  <DetailItem icon="map-outline" label="Assigned Zone" value="Unassigned" />
                  <DetailItem icon="person-outline" label="Reported By" value="You" />
                </View>
              </View>

              <View style={styles.panel}>
                <View style={styles.panelHeading}>
                  <View>
                    <Text style={styles.panelTitle}>
                      {mode === 'pending'
                        ? 'Resident Evidence'
                        : mode === 'in-progress'
                          ? 'Latest Work Evidence'
                          : 'Final Completion Evidence'}
                    </Text>
                    <Text style={styles.panelSubtitle}>
                      {mode === 'resolved'
                        ? 'Required proof submitted when the complaint was closed'
                        : 'Most recent photo attached to this complaint record'}
                    </Text>
                  </View>
                  <Ionicons name="image-outline" size={21} color="#23435D" />
                </View>
                <Image
                  source={{ uri: displayEvidence }}
                  style={styles.evidenceImage}
                  contentFit="cover"
                  transition={180}
                />
              </View>



              <ComplaintTimeline complaint={complaint} />

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
                      value={complaint.deadline ?? 'N/A'}
                    />
                    <DetailItem
                      icon="cash-outline"
                      label="Final Budget"
                      value={complaint.budget ?? 'N/A'}
                    />
                  </View>

                  <View style={styles.resolutionNote}>
                    <Text style={styles.resolutionNoteLabel}>RESOLUTION NOTE</Text>
                    <Text selectable style={styles.resolutionNoteText}>
                      {complaint.resolutionNote ?? 'No resolution note provided.'}
                    </Text>
                  </View>

                  {complaint.finalEvidence && (
                    <View style={styles.finalEvidenceCard}>
                      <Text style={styles.resolutionNoteLabel}>FINAL COMPLETION PHOTO</Text>
                      <Image
                        source={{ uri: complaint.finalEvidence }}
                        style={styles.finalEvidenceImage}
                        contentFit="cover"
                      />
                    </View>
                  )}
                </View>
              )}
            </View>

            <View style={styles.sideColumn}>
              <ReporterProfile complaint={complaint} />

              {mode !== 'pending' && (
                <ContractorAssignments complaint={complaint} mode={mode} />
              )}

              {mode === 'resolved' && complaint.approvedBy && (
                <ApprovalCard approval={complaint.approvedBy} />
              )}

              {mode === 'resolved' && (
                <ResidentFeedback
                  feedback={localFeedback}
                  rating={feedbackRating}
                  setRating={setFeedbackRating}
                  comment={feedbackComment}
                  setComment={setFeedbackComment}
                  hasSubmitted={hasSubmittedFeedback}
                  onSubmit={() => {
                    if (feedbackRating === 0 || feedbackComment.trim() === '') return;
                    confirmAction('Are you sure you want to submit this feedback?', () => {
                      setLocalFeedback([{
                        id: Date.now().toString(),
                        resident: 'You',
                        residentInitials: 'YO',
                        rating: feedbackRating,
                        comment: feedbackComment,
                        receivedAt: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                      }, ...localFeedback]);
                      setHasSubmittedFeedback(true);
                    }, 'Submit Feedback');
                  }}
                />
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#EF4444',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 16,
    alignSelf: 'flex-start',
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  safeArea: { flex: 1, backgroundColor: '#F7F8FA' },
  toastContainer: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: '#ebf4ec',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    zIndex: 1000,
    minWidth: 300,
    overflow: 'hidden',
  },
  toastLeftBorder: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: '#1b7a43',
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
  },
  toastIcon: {
    marginRight: 12,
    marginLeft: 4,
  },
  toastContent: {
    flex: 1,
  },
  toastTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  toastText: {
    fontSize: 13,
    color: '#4d4d4d',
    lineHeight: 18,
  },
  toastCloseButton: {
    padding: 4,
    marginLeft: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EAEDF1',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F7F8FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#23435D',
  },
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
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
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
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
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
  upvoteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#FFF7E8',
    borderWidth: 1,
    borderColor: '#F4DFC3',
  },
  upvoteBtnActive: {
    backgroundColor: '#C57C1B',
    borderColor: '#C57C1B',
  },
  upvoteBtnText: {
    color: '#C57C1B',
    fontSize: 12,
    fontWeight: '700',
  },
  upvoteBtnTextActive: {
    color: '#FFFFFF',
  },
  evidenceImage: {
    width: '100%',
    aspectRatio: 1.5,
    borderRadius: 12,
    backgroundColor: '#E8EDF4',
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
  coordinateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 11,
    backgroundColor: '#EFF6FF',
  },
  coordinateText: { color: '#2563EB', fontSize: 8, fontWeight: '700' },
  mapCard: {
    height: 270,
    overflow: 'hidden',
    borderRadius: 12,
    backgroundColor: '#E8EDF4',
  },
  reporterPanel: {
    overflow: 'hidden',
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAEDF1',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
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
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  notFoundTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
  notFoundText: { fontSize: 14, color: '#6B7280' },
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
  starRow: { flexDirection: 'row', gap: 2 },
  interactiveStarRow: { flexDirection: 'row', gap: 6, paddingVertical: 8, justifyContent: 'center' },
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
  leaveFeedbackContainer: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EAEDF1',
  },
  leaveFeedbackTitle: { color: '#1F2937', fontSize: 12, fontWeight: '800', textAlign: 'center' },
  leaveFeedbackInput: {
    minHeight: 60,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#DDE2E8',
    padding: 12,
    color: '#344054',
    fontSize: 10,
    textAlignVertical: 'top',
    marginTop: 8,
    backgroundColor: '#FFFFFF',
  },
  leaveFeedbackButton: {
    marginTop: 10,
    backgroundColor: '#2563EB',
    padding: 12,
    borderRadius: 20,
    alignItems: 'center',
  },
  leaveFeedbackButtonText: { color: '#FFFFFF', fontSize: 10, fontWeight: '900' },
  buttonDisabled: { opacity: 0.5 },
});
