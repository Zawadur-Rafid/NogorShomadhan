import Ionicons from "@expo/vector-icons/Ionicons";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  LayoutChangeEvent,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import BottomNav from "@/components/BottomNav";
import ResidentPageHeader from "@/components/resident-page-header";
import { forumService, ForumStatus } from "@/services/forum.service";
import { confirmAction } from "@/utils/confirm";
import {
  ForumCategory,
  forumCategories,
  forumCategoryTheme,
  getForumCategory,
  getForumSourceLabel,
} from "@/utils/forum-presentation";
import {
  CommunityEventViewerModal,
  EventData,
  formatDateRangeReadable,
  parseEventFromBody,
} from "@/components/CommunityEventModal";

interface ForumCommentUI {
  id: string;
  author: string;
  initials: string;
  text: string;
  time: string;
  parent_comment_id?: string | null;
  official?: boolean;
}
interface ForumPostUI {
  id: string;
  author: string;
  initials: string;
  status: ForumStatus;
  title: string;
  body: string;
  time: string;
  official?: boolean;
  comments: ForumCommentUI[];
}

const initialPosts: ForumPostUI[] = [
  {
    id: "post-event-1",
    author: "Community Authority",
    initials: "CA",
    status: "Announcement",
    title: "Community Tree Plantation & Clean-Up Drive",
    body: '[[COMMUNITY_EVENT:{"startDate":"2026-09-12","endDate":"2026-09-14"}]]\n\nJoin hands with community neighbors and local volunteers for a 3-day greening and cleanup initiative across Ward 4. Refreshments and equipment will be provided at the Community Center.',
    time: "2 hrs ago",
    official: true,
    comments: [
      {
        id: "comment-ev-1",
        author: "Arif Hasan",
        initials: "AH",
        text: "Will saplings and tools be provided on site?",
        time: "1 hr ago",
      },
      {
        id: "comment-ev-2",
        author: "Community Authority",
        initials: "CA",
        text: "Yes, diverse fruit and shade tree saplings and gloves will be distributed freely.",
        time: "30 min ago",
        parent_comment_id: "comment-ev-1",
        official: true,
      },
    ],
  },
  {
    id: "post-1",
    author: "Nusrat Jahan",
    initials: "NJ",
    status: "Alert",
    title: "Water supply interruption",
    body: "Water pressure has been low in Block C since this morning. Is there any update from the authority?",
    time: "18 min ago",
    comments: [
      {
        id: "comment-1",
        author: "Community Authority",
        initials: "CA",
        text: "The maintenance team has been informed and is inspecting the line.",
        time: "10 min ago",
        official: true,
      },
    ],
  },
  {
    id: "post-2",
    author: "Rahim Ahmed",
    initials: "RA",
    status: "Update",
    title: "Park cleaning completed",
    body: "The community park was cleaned today. Thanks to everyone who reported the overflowing bins.",
    time: "2 hr ago",
    comments: [
      {
        id: "comment-2",
        author: "Sadia Islam",
        initials: "SI",
        text: "It looks much better now. Thank you!",
        time: "1 hr ago",
      },
    ],
  },
  {
    id: "post-3",
    author: "Community Authority",
    initials: "CA",
    status: "Announcement",
    title: "Weekend road maintenance",
    body: "Road resurfacing near the east gate will take place this Friday from 9 AM to 4 PM.",
    time: "Yesterday",
    official: true,
    comments: [],
  },
];

export default function ResidentForumScreen() {
  const { postId: postIdParam, commentId: commentIdParam } = useLocalSearchParams<{
    postId?: string | string[];
    commentId?: string | string[];
  }>();
  const targetPostId = Array.isArray(postIdParam) ? postIdParam[0] : postIdParam;
  const targetCommentId = Array.isArray(commentIdParam) ? commentIdParam[0] : commentIdParam;
  const scrollViewRef = useRef<ScrollView>(null);
  const postOffsetsRef = useRef<Record<string, number>>({});
  const commentOffsetsRef = useRef<Record<string, number>>({});
  const scrolledTargetRef = useRef<string | null>(null);
  const [posts, setPosts] = useState<ForumPostUI[]>(initialPosts);
  const [postTitle, setPostTitle] = useState("");
  const [postBody, setPostBody] = useState("");
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [replyTarget, setReplyTarget] = useState<Record<string, string | null>>({});
  const [activeFilter, setActiveFilter] = useState<ForumCategory>("All");
  const [selectedEventPost, setSelectedEventPost] = useState<{
    title: string;
    event: EventData;
    description?: string;
    author?: string;
  } | null>(null);

  const loadPostsFromDb = useCallback(async () => {
    try {
      const dbPosts = await forumService.fetchPosts();
      const formatted: ForumPostUI[] = dbPosts.map((p) => ({
          id: p.post_id,
          author: getForumSourceLabel(p.account, p.is_official),
          initials: getInitials(getForumSourceLabel(p.account, p.is_official)),
          status: p.status,
          title: p.title,
          body: p.body,
          time: formatTimeAgo(p.created_at),
          official: p.is_official,
          comments: (p.comments || []).map((c) => ({
            id: c.comment_id,
            author: getForumSourceLabel(c.account, c.is_official),
            initials: getInitials(getForumSourceLabel(c.account, c.is_official)),
            text: c.content,
            time: formatTimeAgo(c.created_at),
            parent_comment_id: c.parent_comment_id,
            official: c.is_official,
          })),
      }));
      setPosts(formatted);
    } catch (e) {
      console.warn("Could not load posts from Supabase:", e);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(loadPostsFromDb);
  }, [loadPostsFromDb]);

  const displayedFilter = targetPostId ? 'All' : activeFilter;
  const visiblePosts = useMemo(
    () =>
      displayedFilter === "All"
        ? posts
        : posts.filter((post) => getForumCategory(post) === displayedFilter),
    [displayedFilter, posts],
  );

  const scrollToNotificationTarget = useCallback(() => {
    if (!targetPostId) return;

    const targetKey = `${targetPostId}:${targetCommentId ?? ''}`;
    if (scrolledTargetRef.current === targetKey) return;

    const postOffset = postOffsetsRef.current[targetPostId];
    if (postOffset === undefined) return;

    const commentOffset = targetCommentId
      ? commentOffsetsRef.current[`${targetPostId}:${targetCommentId}`]
      : 0;
    if (targetCommentId && commentOffset === undefined) return;

    scrolledTargetRef.current = targetKey;
    requestAnimationFrame(() => {
      scrollViewRef.current?.scrollTo({
        y: Math.max(0, postOffset + (commentOffset ?? 0) - 18),
        animated: true,
      });
    });
  }, [targetCommentId, targetPostId]);

  useEffect(() => {
    if (!targetPostId) return;
    scrolledTargetRef.current = null;
    requestAnimationFrame(scrollToNotificationTarget);
  }, [posts, scrollToNotificationTarget, targetPostId]);

  const recordPostOffset = (postId: string, event: LayoutChangeEvent) => {
    postOffsetsRef.current[postId] = event.nativeEvent.layout.y;
    if (postId === targetPostId) scrollToNotificationTarget();
  };

  const recordCommentOffset = (
    postId: string,
    commentId: string,
    event: LayoutChangeEvent,
  ) => {
    commentOffsetsRef.current[`${postId}:${commentId}`] = event.nativeEvent.layout.y;
    if (postId === targetPostId && commentId === targetCommentId) {
      scrollToNotificationTarget();
    }
  };

  const publishPost = async () => {
    if (!postTitle.trim() || !postBody.trim()) return;

    const confirmed = await confirmAction('Are you sure you want to post this resident discussion?');
    if (!confirmed) return;

    const title = postTitle.trim();
    const body = postBody.trim();
    setPostTitle("");
    setPostBody("");

    const newPostUI: ForumPostUI = {
      id: `pending-post-${posts.length + 1}`,
      author: "Resident",
      initials: "RS",
      status: "Update",
      title,
      body,
      time: "Just now",
      comments: [],
    };
    setPosts((current) => [newPostUI, ...current]);

    try {
      const accId = (await AsyncStorage.getItem("acc_id")) || "00000000-0000-0000-0000-000000000000";
      await forumService.createResidentDiscussion({
        acc_id: accId,
        title,
        body,
      });
      loadPostsFromDb();
    } catch {
      console.log("Local resident post created; database sync skipped.");
    }
  };

  const addComment = async (postId: string) => {
    const text = commentDrafts[postId]?.trim();
    if (!text) return;

    const confirmed = await confirmAction('Are you sure you want to submit this comment?');
    if (!confirmed) return;

    const parentId = replyTarget[postId] || null;

    setCommentDrafts((current) => ({ ...current, [postId]: "" }));
    setReplyTarget((current) => ({ ...current, [postId]: null }));

    const newCommentUI: ForumCommentUI = {
      id: `pending-comment-${postId}-${(posts.find((post) => post.id === postId)?.comments.length ?? 0) + 1}`,
      author: "Resident",
      initials: "RS",
      text,
      time: "Just now",
      parent_comment_id: parentId,
      official: false,
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
      const accId = (await AsyncStorage.getItem("acc_id")) || "00000000-0000-0000-0000-000000000000";
      await forumService.createResidentComment({
        post_id: postId,
        acc_id: accId,
        parent_comment_id: parentId,
        content: text,
      });
      loadPostsFromDb();
    } catch {
      console.log("Local resident comment added; database sync skipped.");
    }
  };

  return (
    <SafeAreaView style={styles.page}>
      <ResidentPageHeader />
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.intro}>
          <Text style={styles.kicker}>Community Forum</Text>
          <Text style={styles.title}>Resident discussions</Text>
          <Text style={styles.subtitle}>
            Share updates, ask questions, comment, and reply to neighborhood discussions.
          </Text>
        </View>

        <View style={styles.composer}>
          <Text style={styles.panelTitle}>Start a resident discussion</Text>
          <Text style={styles.panelSubtitle}>
            Ask a question, share a suggestion, or discuss a neighborhood matter with the community.
          </Text>
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
            placeholder="What would you like to discuss?"
            placeholderTextColor="#98A2B3"
            multiline
            style={styles.bodyInput}
          />

          <TouchableOpacity
            disabled={!postTitle.trim() || !postBody.trim()}
            onPress={publishPost}
            style={[styles.publishButton, (!postTitle.trim() || !postBody.trim()) && styles.disabledButton]}
          >
            <Ionicons name="send" size={16} color="#FFFFFF" />
            <Text style={styles.publishText}>Post Discussion</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {forumCategories.map((filter) => (
            <TouchableOpacity
              key={filter}
              onPress={() => setActiveFilter(filter)}
              style={[styles.filter, displayedFilter === filter && styles.activeFilter]}
            >
              <Text style={[styles.filterText, displayedFilter === filter && styles.activeFilterText]}>{filter}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {visiblePosts.map((post) => (
          <View
            key={post.id}
            onLayout={(event) => recordPostOffset(post.id, event)}
            style={[
              styles.post,
              post.id === targetPostId && styles.postHighlighted,
            ]}
          >
            <View style={styles.postHeader}>
              <View style={styles.authorRow}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{post.initials}</Text>
                </View>
                <View>
                  <Text style={styles.author}>{post.author}</Text>
                  <Text style={styles.time}>{post.time}</Text>
                </View>
              </View>

              <View style={[styles.statusBadge, { backgroundColor: forumCategoryTheme[getForumCategory(post)].background }]}>
                <Text style={[styles.statusText, { color: forumCategoryTheme[getForumCategory(post)].color }]}>{getForumCategory(post)}</Text>
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

                  <Text style={styles.postTitle}>{post.title}</Text>
                  {cleanBody ? <Text style={styles.postBody}>{cleanBody}</Text> : null}
                </>
              );
            })()}

            <View style={styles.commentHeading}>
              <Ionicons name="chatbubble-outline" size={15} color="#667085" />
              <Text style={styles.commentHeadingText}>
                {post.comments.length} comment{post.comments.length === 1 ? "" : "s"}
              </Text>
            </View>

            {post.comments.map((comment) => (
              <View
                key={comment.id}
                onLayout={(event) => recordCommentOffset(post.id, comment.id, event)}
                style={[
                  styles.comment,
                  comment.parent_comment_id && styles.replyComment,
                  comment.id === targetCommentId && styles.commentHighlighted,
                ]}
              >
                <View style={styles.commentAvatar}>
                  <Text style={styles.commentAvatarText}>{comment.initials}</Text>
                </View>
                <View style={styles.commentCopy}>
                  <View style={styles.commentTop}>
                    <Text style={styles.commentAuthor}>{comment.author}</Text>
                    {comment.official ? (
                      <View style={styles.officialBadge}>
                        <Text style={styles.officialBadgeText}>Official</Text>
                      </View>
                    ) : null}
                    <Text style={styles.commentTime}>{comment.time}</Text>
                  </View>
                  <Text style={styles.commentText}>{comment.text}</Text>

                  {/* Reply Action */}
                  <TouchableOpacity
                    style={styles.replyAction}
                    onPress={() =>
                      setReplyTarget((current) => ({
                        ...current,
                        [post.id]: comment.id,
                      }))
                    }
                  >
                    <Ionicons name="return-down-forward" size={12} color="#00475E" />
                    <Text style={styles.replyActionText}>Reply</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            <View style={styles.commentComposer}>
              {replyTarget[post.id] && (
                <View style={styles.replyingBanner}>
                  <Text style={styles.replyingText}>Replying to comment</Text>
                  <TouchableOpacity
                    onPress={() => setReplyTarget((current) => ({ ...current, [post.id]: null }))}
                  >
                    <Ionicons name="close-circle" size={14} color="#667085" />
                  </TouchableOpacity>
                </View>
              )}
              <View style={styles.composerInputRow}>
                <TextInput
                  value={commentDrafts[post.id] ?? ""}
                  onChangeText={(text) =>
                    setCommentDrafts((current) => ({ ...current, [post.id]: text }))
                  }
                  placeholder={
                    replyTarget[post.id] ? "Write a reply to comment..." : "Add a reply..."
                  }
                  placeholderTextColor="#98A2B3"
                  style={styles.commentInput}
                />
                <TouchableOpacity onPress={() => addComment(post.id)} style={styles.commentSend}>
                  <Ionicons name="send" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}

        {visiblePosts.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="chatbubbles-outline" size={40} color="#98A2B3" />
            <Text style={styles.emptyText}>No forum posts in this category.</Text>
          </View>
        ) : null}
      </ScrollView>

      <BottomNav activeRoute="forum" />

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
    </SafeAreaView>
  );
}

function getInitials(name: string): string {
  if (!name) return "U";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.substring(0, 2).toUpperCase();
}

function formatTimeAgo(timestamp: string): string {
  if (!timestamp) return "Just now";
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return timestamp;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hr ago`;
  return `${Math.floor(diffHours / 24)} days ago`;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#F8F9FC" },
  content: { width: "100%", maxWidth: 900, alignSelf: "center", padding: 16, paddingBottom: 102, gap: 16 },
  intro: { marginTop: 8 },
  kicker: { color: "#00475E", fontSize: 12, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase" },
  title: { color: "#00475E", fontSize: 30, fontWeight: "700", letterSpacing: -0.5, marginTop: 6 },
  subtitle: { marginTop: 6, color: "#40484D", fontSize: 14, lineHeight: 20 },
  composer: { padding: 16, borderRadius: 14, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#DDE3E8", gap: 10 },
  panelTitle: { color: "#191C1E", fontSize: 17, fontWeight: "600" },
  panelSubtitle: { color: "#667085", fontSize: 12, lineHeight: 17 },
  titleInput: { minHeight: 42, paddingHorizontal: 12, borderWidth: 1, borderColor: "#D0D5DD", borderRadius: 8, color: "#191C1E", fontSize: 14 },
  bodyInput: { minHeight: 88, padding: 12, borderWidth: 1, borderColor: "#D0D5DD", borderRadius: 8, color: "#191C1E", fontSize: 14, textAlignVertical: "top" },
  publishButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 12, borderRadius: 10, backgroundColor: "#00475E" },
  disabledButton: { opacity: 0.45 },
  publishText: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },
  filters: { gap: 8 },
  filter: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, backgroundColor: "#ECEEF0" },
  activeFilter: { backgroundColor: "#00475E" },
  filterText: { color: "#40484D", fontSize: 12, fontWeight: "600" },
  activeFilterText: { color: "#FFFFFF" },
  post: { padding: 16, borderRadius: 14, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#DDE3E8" },
  postHighlighted: {
    borderWidth: 2,
    borderColor: "#2E78A6",
    backgroundColor: "#F8FBFF",
    shadowColor: "#2E78A6",
    shadowOpacity: 0.14,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  postHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 10 },
  authorRow: { flexDirection: "row", alignItems: "center", gap: 9, flex: 1 },
  avatar: { width: 36, height: 36, alignItems: "center", justifyContent: "center", borderRadius: 18, backgroundColor: "#E1EBF8" },
  avatarText: { color: "#304B6B", fontSize: 12, fontWeight: "700" },
  author: { color: "#191C1E", fontSize: 13, fontWeight: "700" },
  time: { marginTop: 2, color: "#98A2B3", fontSize: 11 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 12 },
  statusText: { fontSize: 10, fontWeight: "700" },
  postTitle: { marginTop: 14, color: "#191C1E", fontSize: 18, fontWeight: "600" },
  postBody: { marginTop: 6, color: "#40484D", fontSize: 14, lineHeight: 20 },
  commentHeading: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 16, marginBottom: 8 },
  commentHeadingText: { color: "#667085", fontSize: 12, fontWeight: "600" },
  comment: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginTop: 8, padding: 9, borderRadius: 9, backgroundColor: "#F7F8FA" },
  commentHighlighted: {
    borderWidth: 2,
    borderColor: "#2E78A6",
    backgroundColor: "#EAF4FF",
  },
  replyComment: { marginLeft: 20, backgroundColor: "#EFF6FF", borderLeftWidth: 2, borderLeftColor: "#00475E" },
  commentAvatar: { width: 27, height: 27, alignItems: "center", justifyContent: "center", borderRadius: 14, backgroundColor: "#EAF3FF" },
  commentAvatarText: { color: "#304B6B", fontSize: 9, fontWeight: "700" },
  commentCopy: { flex: 1 },
  commentTop: { flexDirection: "row", alignItems: "center", gap: 6 },
  commentAuthor: { color: "#344054", fontSize: 11, fontWeight: "700" },
  officialBadge: { backgroundColor: "#E0F2FE", paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4 },
  officialBadgeText: { color: "#0369A1", fontSize: 9, fontWeight: "700" },
  commentTime: { color: "#98A2B3", fontSize: 10 },
  commentText: { marginTop: 3, color: "#475467", fontSize: 12, lineHeight: 17 },
  replyAction: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 4 },
  replyActionText: { color: "#00475E", fontSize: 10, fontWeight: "700" },
  commentComposer: { gap: 6, marginTop: 12 },
  replyingBanner: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#EAF3FF", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  replyingText: { color: "#1D4ED8", fontSize: 11, fontWeight: "600" },
  composerInputRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  commentInput: { flex: 1, minHeight: 38, paddingHorizontal: 11, borderWidth: 1, borderColor: "#D0D5DD", borderRadius: 8, color: "#191C1E", fontSize: 12 },
  commentSend: { width: 38, height: 38, alignItems: "center", justifyContent: "center", borderRadius: 8, backgroundColor: "#00475E" },
  empty: { minHeight: 160, alignItems: "center", justifyContent: "center", gap: 8 },
  emptyText: { color: "#667085", fontSize: 14 },
  eventPostBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#D0D5DD",
    borderRadius: 12,
    padding: 10,
    marginTop: 10,
    marginBottom: 4,
    gap: 10,
  },
  eventBannerLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  eventBannerIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#EAF0F6",
    alignItems: "center",
    justifyContent: "center",
  },
  eventBannerBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#EAF0F6",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    marginBottom: 2,
  },
  eventBannerBadgeText: {
    color: "#23435D",
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  eventBannerDateText: { color: "#1F2937", fontSize: 12, fontWeight: "800" },
  viewCalendarAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D0D5DD",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  viewCalendarActionText: { color: "#23435D", fontSize: 10, fontWeight: "800" },
});
