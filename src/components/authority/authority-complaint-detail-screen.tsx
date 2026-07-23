import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
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
  AuthorityComplaintDetail,
  AuthorityEvidenceImage,
  AuthorityResidentFeedback,
} from './store-authority-complaint-details';

export type AuthorityComplaintDetailMode =
  | 'pending'
  | 'in-progress'
  | 'resolved';

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

function ComplaintTimeline({
  complaint,
}: {
  complaint: AuthorityComplaintDetail;
}) {
  return (
    <View style={styles.panel}>
      <View style={styles.panelHeading}>
        <View>
          <Text style={styles.panelTitle}>Work History</Text>
          <Text style={styles.panelSubtitle}>
            Notes, evidence, and budget changes in chronological order
          </Text>
        </View>
        <Ionicons name="git-branch-outline" size={21} color="#23435D" />
      </View>

      <View style={styles.timeline}>
        {complaint.updates.map((update, index) => (
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
              {index < complaint.updates.length - 1 && (
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
  } = useAuthorityComplaints();
  const complaintId = Array.isArray(params.complaintId)
    ? params.complaintId[0]
    : params.complaintId;
  const complaint = complaints.find((item) => item.id === complaintId);
  const [deadline, setDeadline] = useState(complaint?.deadline ?? '');
  const [workBudget, setWorkBudget] = useState(complaint?.budget ?? '');
  const [initialNote, setInitialNote] = useState(complaint?.workNote ?? '');
  const [updateNote, setUpdateNote] = useState('');
  const [updateImages, setUpdateImages] = useState<AuthorityEvidenceImage[]>([]);
  const [resolutionNote, setResolutionNote] = useState('');
  const [finalEvidence, setFinalEvidence] =
    useState<AuthorityEvidenceImage | null>(null);
  const [formMessage, setFormMessage] = useState('');
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
    if (!deadline.trim() || !workBudget.trim() || !initialNote.trim()) {
      setFormMessage('Deadline, budget, and initial work note are required.');
      return;
    }

    startComplaint(complaint.id, {
      deadline: deadline.trim(),
      budget: workBudget.trim(),
      note: initialNote.trim(),
    });
    setFormMessage('Work started. This complaint is now In Progress.');
  };

  const handleAddUpdate = () => {
    if (!updateNote.trim() || !workBudget.trim() || updateImages.length === 0) {
      setFormMessage(
        'Add an update note, current budget, and at least one evidence photo.',
      );
      return;
    }

    addWorkUpdate(complaint.id, {
      note: updateNote.trim(),
      budget: workBudget.trim(),
      images: updateImages,
    });
    setUpdateNote('');
    setUpdateImages([]);
    setFormMessage('Work update added to the complaint history.');
  };

  const handleResolve = () => {
    if (!resolutionNote.trim() || !finalEvidence) {
      setFormMessage(
        'A final completion photo and resolution note are required before closing.',
      );
      return;
    }

    resolveComplaint(complaint.id, {
      note: resolutionNote.trim(),
      budget: workBudget.trim() || complaint.budget,
      finalImage: finalEvidence,
    });
    setFormMessage('');
  };

  const canAddUpdate =
    updateNote.trim().length > 0 &&
    workBudget.trim().length > 0 &&
    updateImages.length > 0;
  const canResolve =
    resolutionNote.trim().length > 0 &&
    workBudget.trim().length > 0 &&
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

              {mode === 'pending' && (
                <View style={[styles.panel, styles.actionPanel]}>
                  <View style={styles.actionIcon}>
                    <Ionicons name="play" size={21} color="#FFFFFF" />
                  </View>
                  <Text style={styles.actionTitle}>Start Work</Text>
                  <Text style={styles.actionDescription}>
                    Add the initial plan before moving this complaint to In Progress.
                  </Text>

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

                  <TouchableOpacity style={styles.primaryButton} onPress={handleStartWork}>
                    <Ionicons name="construct-outline" size={18} color="#FFFFFF" />
                    <Text style={styles.primaryButtonText}>Start Work</Text>
                  </TouchableOpacity>
                </View>
              )}

              {mode === 'in-progress' && (
                <>
                  <View style={[styles.panel, styles.actionPanel]}>
                    <View style={styles.progressHeading}>
                      <View style={styles.progressCopy}>
                        <Text style={styles.actionTitle}>Add Work Update</Text>
                        <Text style={styles.actionDescription}>
                          Each update records notes, photos, time, and budget.
                        </Text>
                      </View>
                      <Text style={styles.progressValue}>{complaint.progress}%</Text>
                    </View>
                    <View style={styles.progressTrack}>
                      <View
                        style={[styles.progressBar, { width: `${complaint.progress}%` }]}
                      />
                    </View>

                    <Text style={styles.inputLabel}>Current Budget</Text>
                    <View style={styles.inputBox}>
                      <Ionicons name="cash-outline" size={17} color="#7A8493" />
                      <TextInput
                        value={workBudget}
                        onChangeText={setWorkBudget}
                        placeholder="Enter updated budget"
                        placeholderTextColor="#98A2B3"
                        style={styles.input}
                      />
                    </View>

                    <Text style={styles.inputLabel}>Update Note</Text>
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
                        <Text style={styles.photoPickerTitle}>Add progress photos</Text>
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
                  </View>

                  <View style={[styles.panel, styles.resolveActionPanel]}>
                    <View style={styles.resolveHeading}>
                      <View style={styles.resolveActionIcon}>
                        <Ionicons name="checkmark-done-outline" size={21} color="#FFFFFF" />
                      </View>
                      <View style={styles.progressCopy}>
                        <Text style={styles.actionTitle}>Complete & Resolve</Text>
                        <Text style={styles.actionDescription}>
                          Final evidence and a resolution note are mandatory.
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.inputLabel}>Resolution Note</Text>
                    <TextInput
                      value={resolutionNote}
                      onChangeText={setResolutionNote}
                      placeholder="Describe the completed work and final inspection..."
                      placeholderTextColor="#98A2B3"
                      multiline
                      style={[styles.inputBox, styles.noteInput]}
                    />

                    <Text style={styles.inputLabel}>Final Completion Photo</Text>
                    <TouchableOpacity style={styles.finalPhotoPicker} onPress={chooseFinalEvidence}>
                      {finalEvidence ? (
                        <Image source={finalEvidence} style={styles.finalPhoto} contentFit="cover" />
                      ) : (
                        <View style={styles.finalPhotoEmpty}>
                          <Ionicons name="camera-outline" size={27} color="#2563EB" />
                          <Text style={styles.finalPhotoTitle}>Add completion proof</Text>
                          <Text style={styles.finalPhotoText}>
                            Required before this complaint can be resolved
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      disabled={!canResolve}
                      style={[
                        styles.primaryButton,
                        !canResolve && styles.buttonDisabled,
                      ]}
                      onPress={handleResolve}
                    >
                      <Ionicons name="checkmark-done-outline" size={18} color="#FFFFFF" />
                      <Text style={styles.primaryButtonText}>Mark as Resolved</Text>
                    </TouchableOpacity>
                  </View>
                </>
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
  actionPanel: { gap: 10 },
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
  resolveActionPanel: { gap: 10, borderColor: '#DCE8F7', backgroundColor: '#FBFDFF' },
  resolveHeading: { flexDirection: 'row', alignItems: 'center', gap: 10 },
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
