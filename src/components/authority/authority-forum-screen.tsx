import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import AuthorityPageHeader from '@/components/authority/authority-page-header';
import { forumService } from '@/services/forum.service';
import { confirmAction } from '@/utils/confirm';
import {
  CommunityEventCreateModal,
  CommunityEventViewerModal,
  EventData,
  formatDateRangeReadable,
  formatEventBody,
  parseEventFromBody,
} from '@/components/CommunityEventModal';

type ForumStatus = 'Announcement' | 'Update' | 'Alert';

type ForumCommentUI = {
  id: string;
  author: string;
  initials: string;
  text: string;
  time: string;
  parent_comment_id?: string | null;
  official?: boolean;
};

type ForumPostUI = {
  id: string;
  author: string;
  initials: string;
  status: ForumStatus;
  title: string;
  body: string;
  time: string;
  official?: boolean;
  comments: ForumCommentUI[];
};

const initialPosts: ForumPostUI[] = [
  {
    id: 'post-event-1',
    author: 'Community Authority',
    initials: 'CA',
    status: 'Announcement',
    title: 'Community Tree Plantation & Clean-Up Drive',
    body: '[[COMMUNITY_EVENT:{"startDate":"2026-09-12","endDate":"2026-09-14"}]]\n\nJoin hands with community neighbors and local volunteers for a 3-day greening and cleanup initiative across Ward 4. Refreshments and equipment will be provided at the Community Center.',
    time: '2 hrs ago',
    official: true,
    comments: [
      {
        id: 'comment-ev-1',
        author: 'Arif Hasan',
        initials: 'AH',
        text: 'Will saplings and tools be provided on site?',
        time: '1 hr ago',
      },
      {
        id: 'comment-ev-2',
        author: 'Community Authority',
        initials: 'CA',
        text: 'Yes, diverse fruit and shade tree saplings and gloves will be distributed freely.',
        time: '30 min ago',
        parent_comment_id: 'comment-ev-1',
        official: true,
      },
    ],
  },
  {
    id: 'post-1',
    author: 'Nusrat Jahan',
    initials: 'NJ',
    status: 'Alert',
    title: 'Water supply interruption',
    body: 'Water pressure has been low in Block C since this morning. Is there an update from the authority?',
    time: '18 min ago',
    comments: [
      {
        id: 'comment-1',
        author: 'Community Authority',
        initials: 'CA',
        text: 'The maintenance team has been informed and is inspecting the line.',
        time: '10 min ago',
        official: true,
      },
    ],
  },
  {
    id: 'post-2',
    author: 'Rahim Ahmed',
    initials: 'RA',
    status: 'Update',
    title: 'Park cleaning completed',
    body: 'The community park was cleaned today. Thank you to everyone who reported the overflowing bins.',
    time: '2 hr ago',
    comments: [
      {
        id: 'comment-2',
        author: 'Sadia Islam',
        initials: 'SI',
        text: 'It looks much better now. Thank you!',
        time: '1 hr ago',
      },
    ],
  },
  {
    id: 'post-3',
    author: 'Community Authority',
    initials: 'CA',
    status: 'Announcement',
    title: 'Weekend road maintenance',
    body: 'Road resurfacing near the east gate will take place this Friday from 9 AM to 4 PM.',
    time: 'Yesterday',
    official: true,
    comments: [],
  },
];

const statusTheme: Record<ForumStatus, { background: string; color: string }> = {
  Announcement: { background: '#EAF3FF', color: '#1D4ED8' },
  Update: { background: '#EAF8EF', color: '#027A48' },
  Alert: { background: '#FFF1F0', color: '#B42318' },
};

export default function AuthorityForumScreen() {
  const { width } = useWindowDimensions();
  const wide = width >= 760;
  const [posts, setPosts] = useState<ForumPostUI[]>(initialPosts);
  const [postTitle, setPostTitle] = useState('');
  const [postBody, setPostBody] = useState('');
  const [postStatus, setPostStatus] = useState<ForumStatus>('Announcement');
  const [activeFilter, setActiveFilter] = useState<ForumStatus | 'All'>('All');
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [replyTarget, setReplyTarget] = useState<Record<string, string | null>>({});
  const [createEventModalVisible, setCreateEventModalVisible] = useState(false);
  const [selectedEventPost, setSelectedEventPost] = useState<{
    title: string;
    event: EventData;
    description?: string;
    author?: string;
  } | null>(null);

  const loadPostsFromDb = async () => {
    try {
      const dbPosts = await forumService.fetchPosts();
      if (dbPosts && dbPosts.length > 0) {
        const formatted: ForumPostUI[] = dbPosts.map((p) => ({
          id: p.post_id,
          author: p.account?.full_name || (p.is_official ? 'Community Authority' : 'Resident'),
          initials: getInitials(p.account?.full_name || (p.is_official ? 'Authority' : 'Resident')),
          status: p.status,
          title: p.title,
          body: p.body,
          time: formatTimeAgo(p.created_at),
          official: p.is_official,
          comments: (p.comments || []).map((c) => ({
            id: c.comment_id,
            author: c.account?.full_name || (c.is_official ? 'Community Authority' : 'Resident'),
            initials: getInitials(c.account?.full_name || (c.is_official ? 'Authority' : 'Resident')),
            text: c.content,
            time: formatTimeAgo(c.created_at),
            parent_comment_id: c.parent_comment_id,
            official: c.is_official,
          })),
        }));
        setPosts(formatted);
      }
    } catch (e) {
      console.warn('Could not load posts from Supabase:', e);
    }
  };

  useEffect(() => {
    loadPostsFromDb();
  }, []);

  const visiblePosts = useMemo(
    () => (activeFilter === 'All' ? posts : posts.filter((post) => post.status === activeFilter)),
    [activeFilter, posts],
  );

  const authorityPostCount = posts.filter((post) => post.official).length;
  const authorityResponseCount = posts.reduce(
    (total, post) => total + post.comments.filter((comment) => comment.official).length,
    0,
  );

  const publishPost = async () => {
    const title = postTitle.trim();
    const body = postBody.trim();
    if (!title || !body) return;

    const confirmed = await confirmAction('Are you sure you want to submit this announcement?');
    if (!confirmed) return;

    setPostTitle('');
    setPostBody('');

    const newPostUI: ForumPostUI = {
      id: 'post-' + Date.now(),
      author: 'Community Authority',
      initials: 'CA',
      status: postStatus,
      title,
      body,
      time: 'Just now',
      official: true,
      comments: [],
    };
    setPosts((current) => [newPostUI, ...current]);

    try {
      const accId = (await AsyncStorage.getItem('acc_id')) || '00000000-0000-0000-0000-000000000000';
      await forumService.createPost({
        acc_id: accId,
        title,
        body,
        status: postStatus,
        is_official: true,
      });
      loadPostsFromDb();
    } catch (e) {
      console.log('Local authority post created; database sync skipped.');
    }
  };

  const addReply = async (postId: string) => {
    const text = replyDrafts[postId]?.trim();
    if (!text) return;

    const confirmed = await confirmAction('Are you sure you want to submit this response?');
    if (!confirmed) return;

    const parentId = replyTarget[postId] || null;

    setReplyDrafts((current) => ({ ...current, [postId]: '' }));
    setReplyTarget((current) => ({ ...current, [postId]: null }));

    const newCommentUI: ForumCommentUI = {
      id: 'comment-' + Date.now(),
      author: 'Community Authority',
      initials: 'CA',
      text,
      time: 'Just now',
      parent_comment_id: parentId,
      official: true,
    };

    setPosts((current) =>
      current.map((post) =>
        post.id === postId
          ? {
              ...post,
              comments: [...post.comments, newCommentUI],
            }
          : post,
      ),
    );

    try {
      const accId = (await AsyncStorage.getItem('acc_id')) || '00000000-0000-0000-0000-000000000000';
      await forumService.createComment({
        post_id: postId,
        acc_id: accId,
        parent_comment_id: parentId,
        content: text,
        is_official: true,
      });
      loadPostsFromDb();
    } catch (e) {
      console.log('Local authority reply created; database sync skipped.');
    }
  };

  const canPublish = Boolean(postTitle.trim() && postBody.trim());

  return (
    <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={styles.safeArea}>
      <AuthorityPageHeader title="Dashboard" />

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.contentContainer}>
          <View style={[styles.intro, wide && styles.introWide]}>
            <View style={styles.introCopy}>
              <Text style={styles.kicker}>COMMUNITY CONNECTION</Text>
              <Text style={styles.title}>Community Forum</Text>
              <Text style={styles.subtitle}>
                Share verified updates, answer resident questions, comment, and reply to community posts.
              </Text>
            </View>
            <View style={styles.introIcon}>
              <Ionicons name="chatbubbles-outline" size={30} color="#FFFFFF" />
            </View>
          </View>

          <View style={styles.summaryGrid}>
            <SummaryCard icon="people-outline" label="Discussions" value={posts.length} />
            <SummaryCard icon="megaphone-outline" label="Official posts" value={authorityPostCount} />
            <SummaryCard icon="return-down-back-outline" label="Authority replies" value={authorityResponseCount} />
          </View>

          <View style={styles.composer}>
            <View style={styles.composerHeading}>
              <View style={styles.composerIcon}>
                <Ionicons name="create-outline" size={20} color="#2F6B5F" />
              </View>
              <View style={styles.composerHeadingCopy}>
                <Text style={styles.panelTitle}>Publish an official post</Text>
                <Text style={styles.panelSubtitle}>Your post will be marked as Community Authority.</Text>
              </View>
            </View>

            <TextInput
              value={postTitle}
              onChangeText={setPostTitle}
              placeholder="Post title"
              placeholderTextColor="#98A2B3"
              style={styles.titleInput}
            />
            <TextInput
              value={postBody}
              onChangeText={setPostBody}
              placeholder="Write an announcement, service update, or important alert..."
              placeholderTextColor="#98A2B3"
              multiline
              textAlignVertical="top"
              style={styles.bodyInput}
            />

            <View style={[styles.composerFooter, !wide && styles.composerFooterMobile]}>
              <View style={styles.statusOptions}>
                {(['Announcement', 'Update', 'Alert'] as ForumStatus[]).map((status) => {
                  const selected = postStatus === status;
                  const theme = statusTheme[status];
                  return (
                    <TouchableOpacity
                      key={status}
                      onPress={() => setPostStatus(status)}
                      style={[
                        styles.statusOption,
                        selected && { backgroundColor: theme.background, borderColor: theme.color },
                      ]}
                    >
                      <Text style={[styles.statusOptionText, selected && { color: theme.color }]}>{status}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.composerActions}>
                <TouchableOpacity
                  accessibilityLabel="Create Community Event"
                  onPress={() => setCreateEventModalVisible(true)}
                  style={styles.createEventButton}
                >
                  <Ionicons name="calendar-outline" size={15} color="#23435D" />
                  <Text style={styles.createEventButtonText}>Create Event</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  accessibilityLabel="Publish official forum post"
                  disabled={!canPublish}
                  onPress={publishPost}
                  style={[styles.publishButton, !canPublish && styles.disabledButton]}
                >
                  <Ionicons name="send" size={16} color="#FFFFFF" />
                  <Text style={styles.publishText}>Publish post</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.discussionHeading}>
            <View>
              <Text style={styles.sectionTitle}>Latest discussions</Text>
              <Text style={styles.sectionSubtitle}>Respond to residents with verified information</Text>
            </View>
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>Community feed</Text>
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filters}
          >
            {(['All', 'Announcement', 'Update', 'Alert'] as const).map((filter) => (
              <TouchableOpacity
                key={filter}
                onPress={() => setActiveFilter(filter)}
                style={[styles.filter, activeFilter === filter && styles.activeFilter]}
              >
                <Text style={[styles.filterText, activeFilter === filter && styles.activeFilterText]}>
                  {filter}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.feed}>
            {visiblePosts.map((post) => (
              <View key={post.id} style={styles.postCard}>
                <View style={styles.postHeader}>
                  <View style={styles.authorRow}>
                    <View style={[styles.avatar, post.official && styles.officialAvatar]}>
                      <Text style={[styles.avatarText, post.official && styles.officialAvatarText]}>
                        {post.initials}
                      </Text>
                    </View>
                    <View style={styles.authorCopy}>
                      <View style={styles.authorNameRow}>
                        <Text style={styles.author}>{post.author}</Text>
                        {post.official ? (
                          <View style={styles.officialBadge}>
                            <Ionicons name="shield-checkmark" size={11} color="#2F6B5F" />
                            <Text style={styles.officialText}>Official</Text>
                          </View>
                        ) : null}
                      </View>
                      <Text style={styles.time}>{post.time}</Text>
                    </View>
                  </View>

                  <View style={[styles.statusBadge, { backgroundColor: statusTheme[post.status].background }]}>
                    <Text style={[styles.statusText, { color: statusTheme[post.status].color }]}>{post.status}</Text>
                  </View>
                </View>

                {(() => {
                  const { isEvent, event, cleanBody } = parseEventFromBody(post.body);
                  return (
                    <>
                      {isEvent && event ? (
                        <TouchableOpacity
                          accessibilityRole="button"
                          accessibilityLabel="View community event calendar"
                          style={styles.eventPostBanner}
                          onPress={() =>
                            setSelectedEventPost({
                              title: post.title,
                              event,
                              description: cleanBody,
                              author: post.author,
                            })
                          }
                        >
                          <View style={styles.eventBannerLeft}>
                            <View style={styles.eventBannerIcon}>
                              <Ionicons name="calendar" size={18} color="#23435D" />
                            </View>
                            <View style={{ flex: 1 }}>
                              <View style={styles.eventBannerBadge}>
                                <Text style={styles.eventBannerBadgeText}>COMMUNITY EVENT</Text>
                              </View>
                              <Text style={styles.eventBannerDateText}>
                                {formatDateRangeReadable(event.startDate, event.endDate)}
                              </Text>
                            </View>
                          </View>
                          <View style={styles.viewCalendarAction}>
                            <Text style={styles.viewCalendarActionText}>View Calendar</Text>
                            <Ionicons name="chevron-forward" size={13} color="#23435D" />
                          </View>
                        </TouchableOpacity>
                      ) : null}

                      <Text selectable style={styles.postTitle}>{post.title}</Text>
                      {cleanBody ? <Text selectable style={styles.postBody}>{cleanBody}</Text> : null}
                    </>
                  );
                })()}

                <View style={styles.commentHeading}>
                  <Ionicons name="chatbubble-outline" size={15} color="#667085" />
                  <Text style={styles.commentHeadingText}>
                    {post.comments.length} {post.comments.length === 1 ? 'reply' : 'replies'}
                  </Text>
                </View>

                {post.comments.map((comment) => (
                  <View
                    key={comment.id}
                    style={[
                      styles.comment,
                      comment.official && styles.officialComment,
                      comment.parent_comment_id && styles.replyComment,
                    ]}
                  >
                    <View style={[styles.commentAvatar, comment.official && styles.officialCommentAvatar]}>
                      <Text style={styles.commentAvatarText}>{comment.initials}</Text>
                    </View>
                    <View style={styles.commentCopy}>
                      <View style={styles.commentTop}>
                        <Text style={styles.commentAuthor}>{comment.author}</Text>
                        {comment.official ? <Ionicons name="shield-checkmark" size={12} color="#2F6B5F" /> : null}
                        <Text style={styles.commentTime}>{comment.time}</Text>
                      </View>
                      <Text selectable style={styles.commentText}>{comment.text}</Text>

                      {/* Authority reply action to specific comment */}
                      <TouchableOpacity
                        style={styles.replyAction}
                        onPress={() =>
                          setReplyTarget((current) => ({
                            ...current,
                            [post.id]: comment.id,
                          }))
                        }
                      >
                        <Ionicons name="return-down-forward" size={12} color="#2F6B5F" />
                        <Text style={styles.replyActionText}>Reply to comment</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}

                <View style={styles.replyComposer}>
                  {replyTarget[post.id] && (
                    <View style={styles.replyingBanner}>
                      <Text style={styles.replyingText}>Replying to specific comment</Text>
                      <TouchableOpacity
                        onPress={() => setReplyTarget((current) => ({ ...current, [post.id]: null }))}
                      >
                        <Ionicons name="close-circle" size={14} color="#667085" />
                      </TouchableOpacity>
                    </View>
                  )}
                  <View style={styles.replyInputRow}>
                    <TextInput
                      value={replyDrafts[post.id] ?? ''}
                      onChangeText={(text) => setReplyDrafts((current) => ({ ...current, [post.id]: text }))}
                      placeholder={
                        replyTarget[post.id] ? "Reply to comment..." : "Reply as Community Authority..."
                      }
                      placeholderTextColor="#98A2B3"
                      style={styles.replyInput}
                      onSubmitEditing={() => addReply(post.id)}
                    />
                    <TouchableOpacity
                      accessibilityLabel={'Reply to ' + post.title}
                      disabled={!replyDrafts[post.id]?.trim()}
                      onPress={() => addReply(post.id)}
                      style={[styles.replyButton, !replyDrafts[post.id]?.trim() && styles.disabledReplyButton]}
                    >
                      <Ionicons name="send" size={15} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}

            {visiblePosts.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIcon}>
                  <Ionicons name="chatbubbles-outline" size={28} color="#7A8F88" />
                </View>
                <Text style={styles.emptyTitle}>No discussions found</Text>
                <Text style={styles.emptyText}>There are no forum posts in this category yet.</Text>
              </View>
            ) : null}
          </View>
        </View>
      </ScrollView>

      {selectedEventPost && (
        <CommunityEventViewerModal
          visible={Boolean(selectedEventPost)}
          onClose={() => setSelectedEventPost(null)}
          title={selectedEventPost.title}
          startDate={selectedEventPost.event.startDate}
          endDate={selectedEventPost.event.endDate}
          description={selectedEventPost.description}
          authorName={selectedEventPost.author}
        />
      )}

      <CommunityEventCreateModal
        visible={createEventModalVisible}
        onClose={() => setCreateEventModalVisible(false)}
        onSubmit={async ({ title, description, startDate, endDate }) => {
          const formattedBody = formatEventBody({ startDate, endDate }, description);
          const newPostUI: ForumPostUI = {
            id: 'post-' + Date.now(),
            author: 'Community Authority',
            initials: 'CA',
            status: 'Announcement',
            title,
            body: formattedBody,
            time: 'Just now',
            official: true,
            comments: [],
          };
          setPosts((current) => [newPostUI, ...current]);

          try {
            const accId =
              (await AsyncStorage.getItem('acc_id')) ||
              '00000000-0000-0000-0000-000000000000';
            await forumService.createPost({
              acc_id: accId,
              title,
              body: formattedBody,
              status: 'Announcement',
              is_official: true,
            });
            loadPostsFromDb();
          } catch (e) {
            console.log('Local event announcement created; database sync skipped.');
          }
        }}
      />
    </SafeAreaView>
  );
}

function SummaryCard({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: number;
}) {
  return (
    <View style={styles.summaryCard}>
      <View style={styles.summaryIcon}>
        <Ionicons name={icon} size={18} color="#2F6B5F" />
      </View>
      <View>
        <Text style={styles.summaryValue}>{value}</Text>
        <Text style={styles.summaryLabel}>{label}</Text>
      </View>
    </View>
  );
}

function getInitials(name: string): string {
  if (!name) return 'U';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.substring(0, 2).toUpperCase();
}

function formatTimeAgo(timestamp: string): string {
  if (!timestamp) return 'Just now';
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return timestamp;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hr ago`;
  return `${Math.floor(diffHours / 24)} days ago`;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F7F8FA' },
  scrollContent: { paddingBottom: 30 },
  contentContainer: { width: '100%', maxWidth: 960, alignSelf: 'center', padding: 16, gap: 16 },
  intro: { gap: 16, padding: 18, borderRadius: 16, backgroundColor: '#23435D' },
  introWide: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  introCopy: { flex: 1 },
  kicker: { color: '#BFD3DE', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  title: { marginTop: 5, color: '#FFFFFF', fontSize: 27, fontWeight: '800', letterSpacing: -0.4 },
  subtitle: { maxWidth: 650, marginTop: 6, color: '#DCE8EE', fontSize: 13, lineHeight: 20 },
  introIcon: { width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center', backgroundColor: '#2F6B5F' },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  summaryCard: { flex: 1, minWidth: 150, minHeight: 76, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 13, borderRadius: 13, borderWidth: 1, borderColor: '#E2E8E5', backgroundColor: '#FFFFFF' },
  summaryIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ECF5F2' },
  summaryValue: { color: '#1F2937', fontSize: 20, fontWeight: '800' },
  summaryLabel: { marginTop: 1, color: '#7B8491', fontSize: 10, fontWeight: '600' },
  composer: { gap: 11, padding: 17, borderRadius: 15, borderWidth: 1, borderColor: '#D7E8E2', backgroundColor: '#FFFFFF' },
  composerHeading: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  composerIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ECF5F2' },
  composerHeadingCopy: { flex: 1 },
  panelTitle: { color: '#1F2937', fontSize: 16, fontWeight: '700' },
  panelSubtitle: { marginTop: 2, color: '#7B8491', fontSize: 10 },
  titleInput: { minHeight: 44, paddingHorizontal: 13, borderWidth: 1, borderColor: '#D5DCE1', borderRadius: 10, backgroundColor: '#FAFBFC', color: '#1F2937', fontSize: 13 },
  bodyInput: { minHeight: 96, padding: 13, borderWidth: 1, borderColor: '#D5DCE1', borderRadius: 10, backgroundColor: '#FAFBFC', color: '#1F2937', fontSize: 13, lineHeight: 19 },
  composerFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  composerFooterMobile: { alignItems: 'stretch', flexDirection: 'column' },
  statusOptions: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  statusOption: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 16, borderWidth: 1, borderColor: '#D5DCE1', backgroundColor: '#FFFFFF' },
  statusOptionText: { color: '#667085', fontSize: 10, fontWeight: '700' },
  publishButton: { minHeight: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingHorizontal: 15, borderRadius: 20, backgroundColor: '#2F6B5F' },
  disabledButton: { opacity: 0.42 },
  publishText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  composerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  createEventButton: { minHeight: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 13, borderRadius: 20, borderWidth: 1, borderColor: '#23435D', backgroundColor: '#EAF0F6' },
  createEventButtonText: { color: '#23435D', fontSize: 11, fontWeight: '800' },
  eventPostBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#D0D5DD', borderRadius: 12, padding: 10, marginTop: 10, marginBottom: 4, gap: 10 },
  eventBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  eventBannerIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#EAF0F6', alignItems: 'center', justifyContent: 'center' },
  eventBannerBadge: { alignSelf: 'flex-start', backgroundColor: '#EAF0F6', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5, marginBottom: 2 },
  eventBannerBadgeText: { color: '#23435D', fontSize: 8, fontWeight: '800', letterSpacing: 0.5 },
  eventBannerDateText: { color: '#1F2937', fontSize: 12, fontWeight: '800' },
  viewCalendarAction: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D0D5DD', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  viewCalendarActionText: { color: '#23435D', fontSize: 10, fontWeight: '800' },
  discussionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingTop: 2 },
  sectionTitle: { color: '#1F2937', fontSize: 18, fontWeight: '700' },
  sectionSubtitle: { marginTop: 3, color: '#7B8491', fontSize: 10 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 9, paddingVertical: 6, borderRadius: 14, backgroundColor: '#ECF5F2' },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#2F6B5F' },
  liveText: { color: '#2F6B5F', fontSize: 9, fontWeight: '800' },
  filters: { gap: 8 },
  filter: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 17, borderWidth: 1, borderColor: '#E1E5E9', backgroundColor: '#FFFFFF' },
  activeFilter: { borderColor: '#23435D', backgroundColor: '#23435D' },
  filterText: { color: '#667085', fontSize: 11, fontWeight: '700' },
  activeFilterText: { color: '#FFFFFF' },
  feed: { gap: 12 },
  postCard: { padding: 16, borderRadius: 15, borderWidth: 1, borderColor: '#E3E7EA', backgroundColor: '#FFFFFF' },
  postHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  authorRow: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 9 },
  avatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E8EEF5' },
  officialAvatar: { backgroundColor: '#DDEFE9' },
  avatarText: { color: '#304B6B', fontSize: 11, fontWeight: '800' },
  officialAvatarText: { color: '#2F6B5F' },
  authorCopy: { flex: 1, minWidth: 0 },
  authorNameRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  author: { color: '#1F2937', fontSize: 12, fontWeight: '800' },
  officialBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 10, backgroundColor: '#ECF5F2' },
  officialText: { color: '#2F6B5F', fontSize: 8, fontWeight: '800' },
  time: { marginTop: 2, color: '#98A2B3', fontSize: 9 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 12 },
  statusText: { fontSize: 9, fontWeight: '800' },
  postTitle: { marginTop: 14, color: '#1F2937', fontSize: 17, fontWeight: '700' },
  postBody: { marginTop: 6, color: '#59616C', fontSize: 12, lineHeight: 19 },
  commentHeading: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 15, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#EEF0F2' },
  commentHeadingText: { color: '#667085', fontSize: 10, fontWeight: '700' },
  comment: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 9, padding: 10, borderRadius: 10, backgroundColor: '#F7F8FA' },
  officialComment: { borderWidth: 1, borderColor: '#DCEAE5', backgroundColor: '#F3F8F6' },
  replyComment: { marginLeft: 20, backgroundColor: '#EFF6FF', borderLeftWidth: 2, borderLeftColor: '#2F6B5F' },
  commentAvatar: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E7EDF4' },
  officialCommentAvatar: { backgroundColor: '#DDEFE9' },
  commentAvatarText: { color: '#304B6B', fontSize: 8, fontWeight: '800' },
  commentCopy: { flex: 1 },
  commentTop: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  commentAuthor: { color: '#344054', fontSize: 11, fontWeight: '700' },
  commentTime: { color: '#98A2B3', fontSize: 10 },
  commentText: { marginTop: 3, color: '#475467', fontSize: 12, lineHeight: 17 },
  replyAction: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4 },
  replyActionText: { color: '#2F6B5F', fontSize: 10, fontWeight: '700' },
  replyComposer: { gap: 6, marginTop: 12 },
  replyingBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#EAF3FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  replyingText: { color: '#1D4ED8', fontSize: 11, fontWeight: '600' },
  replyInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  replyInput: { flex: 1, minHeight: 38, paddingHorizontal: 11, borderWidth: 1, borderColor: '#D0D5DD', borderRadius: 8, color: '#191C1E', fontSize: 12 },
  replyButton: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: '#2F6B5F' },
  disabledReplyButton: { opacity: 0.45 },
  emptyState: { minHeight: 160, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#E2E8E5', alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { color: '#1F2937', fontSize: 15, fontWeight: '700' },
  emptyText: { color: '#667085', fontSize: 13 },
});