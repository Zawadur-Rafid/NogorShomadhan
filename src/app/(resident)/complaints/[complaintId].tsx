import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { dummyComplaints } from '@/components/store/store_complaint';

const theme = {
  background: '#f8f9fc',
  surface: '#ffffff',
  primary: '#00475e',
  primaryContainer: '#1a5f7a',
  onPrimaryContainer: '#9bd7f7',
  onSurface: '#191c1e',
  onSurfaceVariant: '#40484d',
  outline: '#70787d',
  outlineVariant: '#c0c8cd',
  surfaceContainerLow: '#f2f4f6',
  surfaceContainer: '#eceef0',
  pendingBg: '#ffdcc3',
  pendingText: '#713b00',
  progressBg: '#c0e8ff',
  progressText: '#004d66',
  resolvedBg: '#d1fadf',
  resolvedText: '#027a48',
};

export default function ComplaintDetailScreen() {
  const router = useRouter();
  const { complaintId } = useLocalSearchParams<{ complaintId: string }>();

  // Find complaint by ID or default to first
  const complaint = dummyComplaints.find((item) => item.id === complaintId) || dummyComplaints[0];

  const [urgencyCount, setUrgencyCount] = useState(complaint.urgencyCount);
  const [hasVotedUrgency, setHasVotedUrgency] = useState(false);

  const handleUrgencyUpvote = () => {
    if (hasVotedUrgency) {
      setUrgencyCount((prev) => prev - 1);
      setHasVotedUrgency(false);
    } else {
      setUrgencyCount((prev) => prev + 1);
      setHasVotedUrgency(true);
      Alert.alert('Urgency Reported', 'Thank you. Your vote increases this issue priority for local authorities.');
    }
  };

  // Status Badge formatting
  let badgeBg = theme.pendingBg;
  let badgeText = theme.pendingText;
  let statusLabel = 'Pending Review';
  if (complaint.status === 'IN PROGRESS') {
    badgeBg = theme.progressBg;
    badgeText = theme.progressText;
    statusLabel = 'In Progress';
  } else if (complaint.status === 'RESOLVED') {
    badgeBg = theme.resolvedBg;
    badgeText = theme.resolvedText;
    statusLabel = 'Resolved';
  }

  // Category Icon
  let categoryIcon: keyof typeof MaterialIcons.glyphMap = 'report-problem';
  if (complaint.category === 'Water Supply') categoryIcon = 'water-drop';
  if (complaint.category === 'Roads & Traffic') categoryIcon = 'construction';
  if (complaint.category === 'Streetlights') categoryIcon = 'lightbulb';
  if (complaint.category === 'Waste Management') categoryIcon = 'delete';
  if (complaint.category === 'Parks & Recreation') categoryIcon = 'park';
  if (complaint.category === 'Public Safety') categoryIcon = 'shield';
  if (complaint.category === 'Drainage System') categoryIcon = 'water-damage';

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color={theme.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Complaint Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        
        {/* Evidence Picture Header */}
        <View style={styles.imageCard}>
          {complaint.image ? (
            <Image source={{ uri: complaint.image }} style={styles.evidenceImage} resizeMode="cover" />
          ) : (
            <View style={styles.noImagePlaceholder}>
              <MaterialIcons name="image-not-supported" size={48} color={theme.outline} />
              <Text style={styles.noImageText}>No evidence photo uploaded</Text>
            </View>
          )}
          <View style={styles.imageBadgeOverlay}>
            <View style={[styles.statusBadge, { backgroundColor: badgeBg }]}>
              <Text style={[styles.statusBadgeText, { color: badgeText }]}>{statusLabel}</Text>
            </View>
          </View>
        </View>

        {/* Title & Metadata Card */}
        <View style={styles.card}>
          <View style={styles.categoryRow}>
            <View style={styles.categoryChip}>
              <MaterialIcons name={categoryIcon} size={16} color={theme.primary} />
              <Text style={styles.categoryChipText}>{complaint.category}</Text>
            </View>
            <View style={styles.dateTag}>
              <MaterialIcons name="event" size={14} color={theme.outline} />
              <Text style={styles.dateTagText}>{complaint.date}</Text>
            </View>
          </View>

          <Text style={styles.title}>{complaint.title}</Text>

          {/* Location details */}
          <View style={styles.locationContainer}>
            <MaterialIcons name="location-on" size={20} color="#EF4444" />
            <Text style={styles.locationText}>{complaint.location}</Text>
          </View>
        </View>

        {/* Urgency Count Card */}
        <View style={styles.card}>
          <Text style={styles.sectionHeading}>URGENCY ASSESSMENT</Text>
          <View style={styles.urgencyRow}>
            <View style={styles.urgencyInfo}>
              <View style={styles.urgencyBadgeContainer}>
                <Text style={styles.urgencyLevelLabel}>Priority:</Text>
                <View style={[
                  styles.urgencyPill,
                  complaint.urgencyLevel === 'CRITICAL' && { backgroundColor: '#FEE2E2' },
                  complaint.urgencyLevel === 'HIGH' && { backgroundColor: '#FFEDD5' },
                  complaint.urgencyLevel === 'MEDIUM' && { backgroundColor: '#FEF3C7' },
                  complaint.urgencyLevel === 'LOW' && { backgroundColor: '#D1FAE5' },
                ]}>
                  <Text style={[
                    styles.urgencyPillText,
                    complaint.urgencyLevel === 'CRITICAL' && { color: '#991B1B' },
                    complaint.urgencyLevel === 'HIGH' && { color: '#C2410C' },
                    complaint.urgencyLevel === 'MEDIUM' && { color: '#B45309' },
                    complaint.urgencyLevel === 'LOW' && { color: '#065F46' },
                  ]}>{complaint.urgencyLevel}</Text>
                </View>
              </View>

              <Text style={styles.urgencyCountText}>
                🔥 <Text style={{ fontWeight: '700', color: theme.onSurface }}>{urgencyCount}</Text> residents marked this as urgent
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.voteButton, hasVotedUrgency && styles.votedButton]}
              onPress={handleUrgencyUpvote}
            >
              <MaterialIcons
                name="local-fire-department"
                size={20}
                color={hasVotedUrgency ? '#FFF' : '#EF4444'}
              />
              <Text style={[styles.voteButtonText, hasVotedUrgency && styles.votedButtonText]}>
                {hasVotedUrgency ? 'Urgent!' : '+1 Urgent'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Issue Description */}
        <View style={styles.card}>
          <Text style={styles.sectionHeading}>DESCRIPTION</Text>
          <Text style={styles.descriptionText}>{complaint.description}</Text>
        </View>

        {/* Evidence Details */}
        <View style={styles.card}>
          <Text style={styles.sectionHeading}>EVIDENCE ATTACHMENT</Text>
          <View style={styles.evidenceContainer}>
            <MaterialIcons name="verified" size={20} color={theme.primary} />
            <Text style={styles.evidenceText}>{complaint.evidence}</Text>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.outlineVariant + '40',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.surfaceContainerLow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'Inter',
    fontSize: 18,
    fontWeight: '700',
    color: theme.primary,
  },
  content: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  imageCard: {
    width: '100%',
    height: 220,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: theme.surfaceContainer,
    position: 'relative',
    borderWidth: 1,
    borderColor: theme.outlineVariant + '4D',
  },
  evidenceImage: {
    width: '100%',
    height: '100%',
  },
  noImagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: theme.outline,
    marginTop: 8,
  },
  imageBadgeOverlay: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusBadgeText: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '700',
  },
  card: {
    backgroundColor: theme.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.outlineVariant + '4D',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.primary + '15',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryChipText: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '700',
    color: theme.primary,
  },
  dateTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateTagText: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: theme.outline,
  },
  title: {
    fontFamily: 'Inter',
    fontSize: 22,
    fontWeight: '700',
    color: theme.onSurface,
    marginBottom: 12,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.surfaceContainerLow,
    padding: 10,
    borderRadius: 10,
  },
  locationText: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600',
    color: theme.onSurfaceVariant,
    flex: 1,
  },
  sectionHeading: {
    fontFamily: 'Inter',
    fontSize: 11,
    fontWeight: '700',
    color: theme.outline,
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  urgencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  urgencyInfo: {
    flex: 1,
    gap: 6,
  },
  urgencyBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  urgencyLevelLabel: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: theme.onSurfaceVariant,
  },
  urgencyPill: {
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 12,
  },
  urgencyPillText: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '700',
  },
  urgencyCountText: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: theme.onSurfaceVariant,
  },
  voteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  votedButton: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  voteButtonText: {
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: '700',
    color: '#EF4444',
  },
  votedButtonText: {
    color: '#FFFFFF',
  },
  descriptionText: {
    fontFamily: 'Inter',
    fontSize: 15,
    color: theme.onSurfaceVariant,
    lineHeight: 22,
  },
  evidenceContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: theme.surfaceContainerLow,
    padding: 12,
    borderRadius: 10,
  },
  evidenceText: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: theme.onSurface,
    flex: 1,
    lineHeight: 20,
  },
});
