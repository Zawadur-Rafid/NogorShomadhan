import Ionicons from '@expo/vector-icons/Ionicons';
import ProgressSegmentedControl from '@expo/ui/community/segmented-control';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuthorityComplaints } from './authority-complaints-context';
import AuthorityMap from './authority-map';
import AuthorityPageHeader from './authority-page-header';
import type {
  AuthorityContractorAssignment,
  AuthorityComplaintDetail,
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

export default function AuthorityComplaintDetailScreen() {
  const params = useLocalSearchParams<{ complaintId?: string | string[] }>();
  const { width } = useWindowDimensions();
  const {
    complaints,
    startComplaint,
    addWorkUpdate,
    resolveComplaint,
    changeContractor,
  } = useAuthorityComplaints();
  const complaintId = Array.isArray(params.complaintId)
    ? params.complaintId[0]
    : params.complaintId;
  const complaint = complaints.find((item) => item.id === complaintId);
  const [deadline, setDeadline] = useState(complaint?.deadline ?? '');
  const [workBudget, setWorkBudget] = useState(complaint?.budget ?? '');
  const [initialNote, setInitialNote] = useState(complaint?.workNote ?? '');
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
  const wide = width >= 900;
  const mode = getDetailMode(complaint?.status);
  const theme = modeTheme[mode];

  const latestWorkImage = useMemo(() => {
    if (!complaint) return undefined;
    for (let index = complaint.updates.length - 1; index >= 0; index -= 1) {
      const image = complaint.updates[index].images[0];
      if (image) return image;
    }
    return undefined;
  }, [complaint]);

  if (!complaint) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <AuthorityPageHeader fallbackPath="/authority/complaints" />
        <View style={styles.notFound}>
          <Ionicons name="document-text-outline" size={38} color="#98A2B3" />
          <Text style={styles.notFoundTitle}>Complaint not found</Text>
          <Text style={styles.notFoundText}>
            This complaint record is not available in the current authority data.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const displayEvidence =
    mode === 'resolved'
      ? complaint.finalEvidence ?? latestWorkImage ?? complaint.evidence
      : mode === 'in-progress'
        ? latestWorkImage ?? complaint.evidence
        : complaint.evidence;

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

  const handleStartWork = () => {
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

    startComplaint(complaint.id, {
      deadline: deadline.trim(),
      contractorName: contractorName.trim(),
      contractorPhone: contractorPhone.trim(),
      budget: workBudget.trim(),
      note: initialNote.trim(),
    });
    setFormMessage('Work started. This complaint is now In Progress.');
  };

  const handleAddUpdate = () => {
    if (!updateNote.trim() || !deadline.trim() || !workBudget.trim()) {
      setFormMessage(
        'Deadline, current amount, and update notes are required. Photos are optional.',
      );
      return;
    }

    addWorkUpdate(complaint.id, {
      deadline: deadline.trim(),
      note: updateNote.trim(),
      budget: workBudget.trim(),
      images: updateImages,
    });
    setUpdateNote('');
    setUpdateImages([]);
    setFormMessage('Work update added to the complaint history.');
  };

  const handleChangeContractor = () => {
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

    changeContractor(complaint.id, {
      name: newContractorName.trim(),
      phone: newContractorPhone.trim(),
      reason: contractorChangeReason.trim(),
    });
    setNewContractorName('');
    setNewContractorPhone('');
    setContractorChangeReason('');
    setFormMessage('Contractor assignment updated and added to the history.');
  };

  const handleResolve = () => {
    if (!resolutionNote.trim() || !finalEvidence) {
      setFormMessage(
        'A final completion photo and completion notes are required before closing.',
      );
      return;
    }

    resolveComplaint(complaint.id, {
      note: resolutionNote.trim(),
      budget: complaint.budget,
      finalImage: finalEvidence,
    });
    setFormMessage('');
  };

  const canStartWork =
    contractorName.trim().length > 0 &&
    contractorPhone.trim().length > 0 &&
    deadline.trim().length > 0 &&
    workBudget.trim().length > 0 &&
    initialNote.trim().length > 0;
  const canAddUpdate =
    updateNote.trim().length > 0 &&
    deadline.trim().length > 0 &&
    workBudget.trim().length > 0;
  const canChangeContractor =
    newContractorName.trim().length > 0 &&
    newContractorPhone.trim().length > 0 &&
    contractorChangeReason.trim().length > 0;
  const canResolve =
    resolutionNote.trim().length > 0 &&
    finalEvidence !== null;

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
                  <DetailItem icon="calendar-outline" label="Submitted" value={complaint.submittedAt} />
                  <DetailItem icon="map-outline" label="Assigned Zone" value={complaint.zone} />
                  <DetailItem
                    icon="arrow-up-circle-outline"
                    label="Urgency"
                    value={`${complaint.urgency} resident signals`}
                  />
                  <DetailItem icon="person-outline" label="Reported By" value={complaint.reporter} />
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
                  source={displayEvidence}
                  style={styles.evidenceImage}
                  contentFit="cover"
                  transition={180}
                />
              </View>

              <View style={styles.panel}>
                <View style={styles.panelHeading}>
                  <View>
                    <Text style={styles.panelTitle}>Issue Location</Text>
                    <Text style={styles.panelSubtitle}>{complaint.location}</Text>
                  </View>
                  <View style={styles.coordinateBadge}>
                    <Ionicons name="navigate-outline" size={13} color="#2563EB" />
                    <Text selectable style={styles.coordinateText}>
                      {complaint.lat.toFixed(4)}, {complaint.lng.toFixed(4)}
                    </Text>
                  </View>
                </View>
                <View style={styles.mapCard}>
                  <AuthorityMap locations={[complaint]} />
                </View>
              </View>

              <ComplaintTimeline complaint={complaint} />
              {mode === 'resolved' && <ResidentFeedback complaint={complaint} />}
            </View>

            <View style={styles.sideColumn}>
              <View style={styles.reporterCard}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{complaint.reporterInitials}</Text>
                </View>
                <View style={styles.reporterCopy}>
                  <Text style={styles.reporterLabel}>RESIDENT REPORTER</Text>
                  <Text selectable style={styles.reporterName}>
                    {complaint.reporter}
                  </Text>
                  <Text selectable style={styles.reporterPhone}>
                    {complaint.reporterPhone}
                  </Text>
                </View>
                <Ionicons name="shield-checkmark-outline" size={21} color="#16845B" />
              </View>

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
                      onChangeText={setContractorPhone}
                      placeholder="Enter mobile number"
                      placeholderTextColor="#98A2B3"
                      keyboardType="phone-pad"
                      style={styles.input}
                    />
                  </View>

                  <Text style={styles.inputLabel}>Deadline</Text>
                  <View style={styles.inputBox}>
                    <Ionicons name="calendar-outline" size={17} color="#7A8493" />
                    <TextInput
                      value={deadline}
                      onChangeText={setDeadline}
                      placeholder="DD MMM YYYY"
                      placeholderTextColor="#98A2B3"
                      style={styles.input}
                    />
                  </View>

                  <Text style={styles.inputLabel}>Estimated Budget</Text>
                  <View style={styles.inputBox}>
                    <Ionicons name="cash-outline" size={17} color="#7A8493" />
                    <TextInput
                      value={workBudget}
                      onChangeText={setWorkBudget}
                      placeholder="Enter estimated budget"
                      placeholderTextColor="#98A2B3"
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
                    disabled={!canStartWork}
                    style={[
                      styles.primaryButton,
                      !canStartWork && styles.buttonDisabled,
                    ]}
                    onPress={handleStartWork}
                  >
                    <Ionicons name="construct-outline" size={18} color="#FFFFFF" />
                    <Text style={styles.primaryButtonText}>Start Work</Text>
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
                        onChangeText={setWorkBudget}
                        placeholder="Enter updated amount"
                        placeholderTextColor="#98A2B3"
                        style={styles.input}
                      />
                    </View>

                    <Text style={styles.inputLabel}>Deadline</Text>
                    <View style={styles.inputBox}>
                      <Ionicons name="calendar-outline" size={17} color="#7A8493" />
                      <TextInput
                        value={deadline}
                        onChangeText={setDeadline}
                        placeholder="DD MMM YYYY"
                        placeholderTextColor="#98A2B3"
                        style={styles.input}
                      />
                    </View>

                    <Text style={styles.inputLabel}>Update Notes</Text>
                    <TextInput
                      value={updateNote}
                      onChangeText={setUpdateNote}
                      placeholder="What work was completed in this update?"
                      placeholderTextColor="#98A2B3"
                      multiline
                      style={[styles.inputBox, styles.noteInput]}
                    />

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
                      disabled={!canAddUpdate}
                      style={[
                        styles.secondaryButton,
                        !canAddUpdate && styles.buttonDisabled,
                      ]}
                      onPress={handleAddUpdate}
                    >
                      <Ionicons name="add-circle-outline" size={18} color="#23435D" />
                      <Text style={styles.secondaryButtonText}>Add Update</Text>
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
                            onChangeText={setNewContractorPhone}
                            placeholder="Enter mobile number"
                            placeholderTextColor="#98A2B3"
                            keyboardType="phone-pad"
                            style={styles.input}
                          />
                        </View>

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
                          disabled={!canChangeContractor}
                          style={[
                            styles.secondaryButton,
                            !canChangeContractor && styles.buttonDisabled,
                          ]}
                          onPress={handleChangeContractor}
                        >
                          <Ionicons name="person-add-outline" size={18} color="#23435D" />
                          <Text style={styles.secondaryButtonText}>Assign New Contractor</Text>
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
                      disabled={!canResolve}
                      style={[
                        styles.primaryButton,
                        !canResolve && styles.buttonDisabled,
                      ]}
                      onPress={handleResolve}
                    >
                      <Ionicons name="checkmark-done-outline" size={18} color="#FFFFFF" />
                      <Text style={styles.primaryButtonText}>Mark as Completed</Text>
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
                      value={complaint.deadline}
                    />
                    <DetailItem
                      icon="cash-outline"
                      label="Final Budget"
                      value={complaint.budget}
                    />
                  </View>

                  <View style={styles.resolutionNote}>
                    <Text style={styles.resolutionNoteLabel}>RESOLUTION NOTE</Text>
                    <Text selectable style={styles.resolutionNoteText}>
                      {complaint.resolutionNote}
                    </Text>
                  </View>

                  {complaint.finalEvidence && (
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
  reporterCard: {
    minHeight: 82,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAEDF1',
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
  reporterCopy: { flex: 1 },
  reporterLabel: { color: '#B9854B', fontSize: 7, fontWeight: '900', letterSpacing: 0.5 },
  reporterName: { color: '#1F2937', fontSize: 12, fontWeight: '800', marginTop: 3 },
  reporterPhone: { color: '#7A8493', fontSize: 9, marginTop: 3 },
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
