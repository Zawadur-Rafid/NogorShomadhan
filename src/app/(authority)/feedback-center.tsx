import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AuthorityPageHeader from '../../components/authority/authority-page-header';
import {
  authorityFeedback,
  authorityFeedbackComments,
  authorityFeedbackSummary,
} from '../../components/authority/store-authority-feedback';

const filters = ['All Feedback', '5 Stars', '4 Stars'] as const;

export default function AuthorityFeedbackCenter() {
  const { width } = useWindowDimensions();
  const [filter, setFilter] = useState<(typeof filters)[number]>('All Feedback');
  const [comments, setComments] = useState(authorityFeedbackComments);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [openDiscussions, setOpenDiscussions] = useState<Record<string, boolean>>({
    'FDB-201': true,
    'FDB-196': true,
  });
  const wide = width >= 900;
  const visibleFeedback = authorityFeedback.filter((item) => {
    if (filter === 'All Feedback') return true;
    return item.rating === Number(filter.charAt(0));
  });

  const submitComment = (feedbackId: string) => {
    const message = drafts[feedbackId]?.trim();
    if (!message) return;
    setComments((current) => ({
      ...current,
      [feedbackId]: [
        ...(current[feedbackId] ?? []),
        {
          id: `CMT-${Date.now()}`,
          author: 'Community Authority',
          initials: 'CA',
          message,
          postedAt: 'Just now',
          authority: true,
        },
      ],
    }));
    setDrafts((current) => ({ ...current, [feedbackId]: '' }));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <AuthorityPageHeader title="Dashboard" />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.container}>
          <View style={styles.hero}>
            <Text style={styles.eyebrow}>RESIDENT EXPERIENCE</Text>
            <Text style={styles.title}>Feedback Center</Text>
            <Text style={styles.subtitle}>Review ratings and comments submitted after complaints were resolved.</Text>
          </View>

          <View style={styles.summaryGrid}>
            <View style={[styles.summaryCard, wide && styles.summaryCardWide]}>
              <View style={[styles.summaryIcon, { backgroundColor: '#FFF7E8' }]}> 
                <Ionicons name="star" size={22} color="#C57C1B" />
              </View>
              <View>
                <Text style={styles.summaryLabel}>Average Rating</Text>
                <Text style={styles.summaryValue}>{authorityFeedbackSummary.averageRating} / 5</Text>
              </View>
            </View>
            <View style={[styles.summaryCard, wide && styles.summaryCardWide]}>
              <View style={[styles.summaryIcon, { backgroundColor: '#EEF6FF' }]}> 
                <Ionicons name="chatbubbles-outline" size={22} color="#3B82F6" />
              </View>
              <View>
                <Text style={styles.summaryLabel}>Total Feedback</Text>
                <Text style={styles.summaryValue}>{authorityFeedbackSummary.totalFeedback}</Text>
              </View>
            </View>
            <View style={[styles.summaryCard, wide && styles.summaryCardWide]}>
              <View style={[styles.summaryIcon, { backgroundColor: '#EAF8F1' }]}> 
                <Ionicons name="happy-outline" size={22} color="#16845B" />
              </View>
              <View>
                <Text style={styles.summaryLabel}>Resident Satisfaction</Text>
                <Text style={styles.summaryValue}>{authorityFeedbackSummary.satisfaction}%</Text>
              </View>
            </View>
          </View>

          <View style={styles.filterBar}>
            <View>
              <Text style={styles.sectionTitle}>Resolved Complaint Feedback</Text>
              <Text style={styles.sectionSubtitle}>{visibleFeedback.length} feedback records shown</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
              {filters.map((item) => (
                <Pressable
                  key={item}
                  onPress={() => setFilter(item)}
                  style={[styles.filterButton, filter === item && styles.filterButtonActive]}
                >
                  <Text style={[styles.filterText, filter === item && styles.filterTextActive]}>{item}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          <View style={[styles.feedbackGrid, wide && styles.feedbackGridWide]}>
            {visibleFeedback.map((feedback) => (
              <View key={feedback.id} style={styles.feedbackCard}>
                <Image source={feedback.image} style={styles.feedbackImage} resizeMode="cover" />
                <View style={styles.feedbackBody}>
                  <View style={styles.complaintTopRow}>
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryText}>{feedback.category}</Text>
                    </View>
                    <Text style={styles.complaintId}>{feedback.complaintId}</Text>
                  </View>
                  <Text style={styles.complaintTitle}>{feedback.complaintTitle}</Text>
                  <View style={styles.locationRow}>
                    <Ionicons name="location-outline" size={13} color="#7A8493" />
                    <Text style={styles.locationText}>{feedback.location}</Text>
                  </View>

                  <View style={styles.reviewBox}>
                    <View style={styles.ratingRow}>
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Ionicons
                          key={`${feedback.id}-star-${index}`}
                          name={index < feedback.rating ? 'star' : 'star-outline'}
                          size={16}
                          color="#C57C1B"
                        />
                      ))}
                      <Text style={styles.ratingValue}>{feedback.rating}.0</Text>
                    </View>
                    <Text style={styles.comment}>“{feedback.comment}”</Text>
                  </View>

                  <View style={styles.residentRow}>
                    <View style={styles.avatar}><Text style={styles.avatarText}>{feedback.initials}</Text></View>
                    <View style={styles.residentCopy}>
                      <Text style={styles.residentName}>{feedback.resident}</Text>
                      <Text style={styles.receivedAt}>Received {feedback.receivedAt}</Text>
                    </View>
                    <View style={styles.verifiedBadge}>
                      <Ionicons name="checkmark-circle" size={14} color="#16845B" />
                      <Text style={styles.verifiedText}>Verified</Text>
                    </View>
                  </View>

                  <View style={styles.discussionSection}>
                    <TouchableOpacity
                      style={styles.discussionHeader}
                      onPress={() => setOpenDiscussions((current) => ({
                        ...current,
                        [feedback.id]: !current[feedback.id],
                      }))}
                    >
                      <View style={styles.discussionTitleRow}>
                        <Ionicons name="chatbubbles-outline" size={17} color="#23435D" />
                        <Text style={styles.discussionTitle}>Community Discussion</Text>
                        <View style={styles.commentCountBadge}>
                          <Text style={styles.commentCountText}>{comments[feedback.id]?.length ?? 0}</Text>
                        </View>
                      </View>
                      <Ionicons
                        name={openDiscussions[feedback.id] ? 'chevron-up' : 'chevron-down'}
                        size={17}
                        color="#7A8493"
                      />
                    </TouchableOpacity>

                    {openDiscussions[feedback.id] && (
                      <View style={styles.discussionBody}>
                        {(comments[feedback.id] ?? []).map((comment) => (
                          <View
                            key={comment.id}
                            style={[styles.commentRow, comment.replyTo && styles.commentReply]}
                          >
                            <View style={[styles.commentAvatar, comment.authority && styles.authorityAvatar]}>
                              <Text style={[styles.commentAvatarText, comment.authority && styles.authorityAvatarText]}>
                                {comment.initials}
                              </Text>
                            </View>
                            <View style={[styles.commentBubble, comment.authority && styles.authorityBubble]}>
                              <View style={styles.commentHeading}>
                                <Text style={styles.commentAuthor}>{comment.author}</Text>
                                {comment.authority && <Text style={styles.authorityLabel}>AUTHORITY</Text>}
                                <Text style={styles.commentTime}>{comment.postedAt}</Text>
                              </View>
                              {!!comment.replyTo && (
                                <Text style={styles.replyingTo}>Replying to {comment.replyTo}</Text>
                              )}
                              <Text style={styles.commentMessage}>{comment.message}</Text>
                              <TouchableOpacity
                                onPress={() => setDrafts((current) => ({
                                  ...current,
                                  [feedback.id]: `@${comment.author} `,
                                }))}
                              >
                                <Text style={styles.replyAction}>Reply</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        ))}

                        <View style={styles.commentComposer}>
                          <View style={[styles.commentAvatar, styles.authorityAvatar]}>
                            <Text style={[styles.commentAvatarText, styles.authorityAvatarText]}>CA</Text>
                          </View>
                          <TextInput
                            value={drafts[feedback.id] ?? ''}
                            onChangeText={(text) => setDrafts((current) => ({ ...current, [feedback.id]: text }))}
                            placeholder="Write a comment or reply..."
                            placeholderTextColor="#9AA2AE"
                            multiline
                            style={styles.commentInput}
                          />
                          <TouchableOpacity
                            style={[
                              styles.sendButton,
                              !drafts[feedback.id]?.trim() && styles.sendButtonDisabled,
                            ]}
                            disabled={!drafts[feedback.id]?.trim()}
                            onPress={() => submitComment(feedback.id)}
                          >
                            <Ionicons name="send" size={16} color="#FFFFFF" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F7F8FA' },
  scrollContent: { paddingBottom: 34 },
  container: { width: '100%', maxWidth: 1180, alignSelf: 'center', padding: 16, gap: 18 },
  hero: { gap: 3 },
  eyebrow: { color: '#B9854B', fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  title: { color: '#111827', fontSize: 25, fontWeight: '800' },
  subtitle: { color: '#6B7280', fontSize: 12, marginTop: 3 },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  summaryCard: { flex: 1, minWidth: 190, minHeight: 78, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FFFFFF', borderRadius: 13, padding: 13, borderWidth: 1, borderColor: '#ECEFF3', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' },
  summaryCardWide: { minWidth: 240 },
  summaryIcon: { width: 43, height: 43, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  summaryLabel: { color: '#667085', fontSize: 10, fontWeight: '600' },
  summaryValue: { color: '#1F2937', fontSize: 20, fontWeight: '800', marginTop: 3, fontVariant: ['tabular-nums'] },
  filterBar: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  sectionTitle: { color: '#1F2937', fontSize: 17, fontWeight: '800' },
  sectionSubtitle: { color: '#8A93A1', fontSize: 9, marginTop: 3 },
  filters: { gap: 7 },
  filterButton: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E6EB' },
  filterButtonActive: { backgroundColor: '#23435D', borderColor: '#23435D' },
  filterText: { color: '#667085', fontSize: 10, fontWeight: '700' },
  filterTextActive: { color: '#FFFFFF' },
  feedbackGrid: { gap: 15 },
  feedbackGridWide: { flexDirection: 'row', alignItems: 'stretch' },
  feedbackCard: { flex: 1, minWidth: 0, backgroundColor: '#FFFFFF', borderRadius: 15, overflow: 'hidden', borderWidth: 1, borderColor: '#E8ECF1', boxShadow: '0 3px 12px rgba(0,0,0,0.05)' },
  feedbackImage: { width: '100%', height: 230, backgroundColor: '#E8EDF4' },
  feedbackBody: { padding: 15, gap: 8 },
  complaintTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  categoryBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, backgroundColor: '#EEF5FF' },
  categoryText: { color: '#2563EB', fontSize: 8, fontWeight: '800' },
  complaintId: { color: '#9098A6', fontSize: 9, fontWeight: '700' },
  complaintTitle: { color: '#1F2937', fontSize: 15, fontWeight: '800' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationText: { color: '#7A8493', fontSize: 10 },
  reviewBox: { padding: 12, borderRadius: 11, backgroundColor: '#FFF9F1', marginTop: 2 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  ratingValue: { color: '#9A641E', fontSize: 10, fontWeight: '800', marginLeft: 5 },
  comment: { color: '#5F5141', fontSize: 11, lineHeight: 17, marginTop: 8 },
  residentRow: { minHeight: 46, flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 3 },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E8EEF2' },
  avatarText: { color: '#23435D', fontSize: 10, fontWeight: '800' },
  residentCopy: { flex: 1 },
  residentName: { color: '#344054', fontSize: 10, fontWeight: '700' },
  receivedAt: { color: '#9098A6', fontSize: 8, marginTop: 3 },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 7, paddingVertical: 4, borderRadius: 10, backgroundColor: '#EAF8F1' },
  verifiedText: { color: '#16845B', fontSize: 8, fontWeight: '800' },
  discussionSection: { marginTop: 4, borderTopWidth: 1, borderTopColor: '#ECEFF3', paddingTop: 9 },
  discussionHeader: { minHeight: 38, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  discussionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  discussionTitle: { color: '#344054', fontSize: 11, fontWeight: '800' },
  commentCountBadge: { minWidth: 21, height: 21, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E8EEF2' },
  commentCountText: { color: '#23435D', fontSize: 8, fontWeight: '900', fontVariant: ['tabular-nums'] },
  discussionBody: { gap: 9, paddingTop: 7 },
  commentRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  commentReply: { paddingLeft: 28 },
  commentAvatar: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EEF1F4' },
  authorityAvatar: { backgroundColor: '#23435D' },
  commentAvatarText: { color: '#596579', fontSize: 8, fontWeight: '900' },
  authorityAvatarText: { color: '#FFFFFF' },
  commentBubble: { flex: 1, minWidth: 0, padding: 9, borderRadius: 10, backgroundColor: '#F7F8FA' },
  authorityBubble: { backgroundColor: '#F0F5F7' },
  commentHeading: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  commentAuthor: { color: '#344054', fontSize: 9, fontWeight: '800' },
  authorityLabel: { color: '#23435D', fontSize: 6, fontWeight: '900', backgroundColor: '#DDE8ED', borderRadius: 6, paddingHorizontal: 5, paddingVertical: 2 },
  commentTime: { marginLeft: 'auto', color: '#98A1AE', fontSize: 7 },
  replyingTo: { color: '#3B82F6', fontSize: 8, fontWeight: '700', marginTop: 4 },
  commentMessage: { color: '#596579', fontSize: 9, lineHeight: 14, marginTop: 4 },
  replyAction: { color: '#3B82F6', fontSize: 8, fontWeight: '800', marginTop: 5 },
  commentComposer: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingTop: 4 },
  commentInput: { flex: 1, minHeight: 39, maxHeight: 85, color: '#344054', fontSize: 9, lineHeight: 14, paddingHorizontal: 11, paddingVertical: 9, borderRadius: 12, borderWidth: 1, borderColor: '#DDE2E8', backgroundColor: '#FFFFFF' },
  sendButton: { width: 37, height: 37, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: '#23435D' },
  sendButtonDisabled: { backgroundColor: '#B7C0C8' },
});
