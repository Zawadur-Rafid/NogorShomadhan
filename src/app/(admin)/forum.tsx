import Ionicons from "@expo/vector-icons/Ionicons";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, LayoutChangeEvent, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useWindowDimensions, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import KeyboardAwareScrollView, {
  type AppKeyboardAwareScrollViewRef,
} from "@/components/keyboard-aware-scroll-view";
import AdminBottomNav from "@/components/AdminBottomNav";
import { forumService, ForumModerationStatus, ForumStatus } from "@/services/forum.service";
import { CommunityGuidelinesModal } from "@/components/forum/community-guidelines";
import { confirmAction } from "@/utils/confirm";
import {
  ForumCategory,
  forumCategories,
  forumCategoryTheme,
  getForumCategory,
  getForumSourceLabel,
  officialPostOptions,
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
  moderationStatus?: ForumModerationStatus;
  rejectionNote?: string | null;
  comments: ForumCommentUI[];
}

const initialFallbackPosts: ForumPostUI[] = [
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
    body: "Water pressure has been low in Block C since this morning. Is there an update from the authority?",
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
    body: "The community park was cleaned today. Thank you to everyone who reported the overflowing bins.",
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

export default function AdminForumScreen() {
  const { postId: postIdParam, commentId: commentIdParam } = useLocalSearchParams<{
    postId?: string | string[];
    commentId?: string | string[];
  }>();
  const requestedPostId = Array.isArray(postIdParam) ? postIdParam[0] : postIdParam;
  const { width } = useWindowDimensions();
  const isNarrow = width < 560;
  const targetCommentId = Array.isArray(commentIdParam) ? commentIdParam[0] : commentIdParam;
  const scrollViewRef = useRef<AppKeyboardAwareScrollViewRef>(null);
  const postOffsetsRef = useRef<Record<string, number>>({});
  const commentOffsetsRef = useRef<Record<string, number>>({});
  const scrolledTargetRef = useRef<string | null>(null);
  const [posts, setPosts] = useState<ForumPostUI[]>(initialFallbackPosts);
  const [postTitle, setPostTitle] = useState("");
  const [postBody, setPostBody] = useState("");
  const [postStatus, setPostStatus] = useState<ForumStatus>("Announcement");
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [replyTarget, setReplyTarget] = useState<Record<string, string | null>>({});
  const [activeFilter, setActiveFilter] = useState<ForumCategory>("All");
  const [dismissedTargetKey, setDismissedTargetKey] = useState<string | null>(null);
  const [selectedEventPost, setSelectedEventPost] = useState<{
    title: string;
    event: EventData;
    description?: string;
    author?: string;
  } | null>(null);
  const [rejectTarget, setRejectTarget] = useState<ForumPostUI | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [moderatingPostId, setModeratingPostId] = useState<string | null>(null);
  const [showGuidelines, setShowGuidelines] = useState(false);

  const loadPostsFromDb = useCallback(async () => {
    try {
      // Admins see published posts and the review queue. Rejected posts are
      // withdrawn from the forum entirely.
      const dbPosts = await forumService.fetchPosts({
        moderationStatuses: ["pending", "approved"],
      });
      const formatted: ForumPostUI[] = dbPosts.map((p) => ({
          id: p.post_id,
          author: getForumSourceLabel(p.account, p.is_official),
          initials: getInitials(getForumSourceLabel(p.account, p.is_official)),
          status: p.status,
          title: p.title,
          body: p.body,
          time: formatTimeAgo(p.created_at),
          official: p.is_official,
          moderationStatus: p.moderation_status,
          rejectionNote: p.rejection_note,
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
      console.warn("Could not load forum posts from Supabase:", e);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(loadPostsFromDb);
  }, [loadPostsFromDb]);

  const targetPostId = useMemo(
    () =>
      requestedPostId ??
      (targetCommentId
        ? posts.find((post) =>
            post.comments.some((comment) => comment.id === targetCommentId),
          )?.id
        : undefined),
    [posts, requestedPostId, targetCommentId],
  );
  const targetKey = targetPostId
    ? `${targetPostId}:${targetCommentId ?? ""}`
    : null;
  const targetPending = Boolean(
    targetKey && dismissedTargetKey !== targetKey,
  );
  const displayedFilter: ForumCategory = targetPending ? "All" : activeFilter;
  const visiblePosts = useMemo(
    () =>
      displayedFilter === "All"
        ? posts
        : posts.filter((post) => getForumCategory(post) === displayedFilter),
    [displayedFilter, posts],
  );

  const scrollToNotificationTarget = useCallback(() => {
    if (!targetPostId) return;

    const nextTargetKey = `${targetPostId}:${targetCommentId ?? ""}`;
    if (scrolledTargetRef.current === nextTargetKey) return;

    const postOffset = postOffsetsRef.current[targetPostId];
    if (postOffset === undefined) return;

    const commentOffset = targetCommentId
      ? commentOffsetsRef.current[`${targetPostId}:${targetCommentId}`]
      : 0;
    if (targetCommentId && commentOffset === undefined) return;

    scrolledTargetRef.current = nextTargetKey;
    requestAnimationFrame(() => {
      scrollViewRef.current?.scrollTo({
        y: Math.max(0, postOffset + (commentOffset ?? 0) - 18),
        animated: true,
      });
    });
  }, [targetCommentId, targetPostId]);

  useEffect(() => {
    if (!targetPostId) return;
    requestAnimationFrame(scrollToNotificationTarget);
  }, [posts, scrollToNotificationTarget, targetPostId]);

  const changeFilter = (filter: ForumCategory) => {
    if (targetKey) {
      scrolledTargetRef.current = targetKey;
      setDismissedTargetKey(targetKey);
    }
    setActiveFilter(filter);
  };

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

    const postType = officialPostOptions.find((option) => option.status === postStatus)?.label ?? 'official post';
    const confirmed = await confirmAction(`Are you sure you want to publish this ${postType.toLowerCase()}?`);
    if (!confirmed) return;

    const newTitle = postTitle.trim();
    const newBody = postBody.trim();
    setPostTitle("");
    setPostBody("");

    const newPostUI: ForumPostUI = {
      id: createLocalId('post'),
      author: "Administrator",
      initials: "AD",
      status: postStatus,
      title: newTitle,
      body: newBody,
      time: "Just now",
      official: true,
      comments: [],
    };
    setPosts((current) => [newPostUI, ...current]);

    try {
      const accId = (await AsyncStorage.getItem("acc_id")) || "00000000-0000-0000-0000-000000000000";
      await forumService.createOfficialPost({
        acc_id: accId,
        title: newTitle,
        body: newBody,
        status: postStatus,
      });
      loadPostsFromDb();
    } catch {
      console.log("Locally added post; database sync skipped.");
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
      id: createLocalId('comment'),
      author: "Administrator",
      initials: "AD",
      text,
      time: "Just now",
      parent_comment_id: parentId,
      official: true,
    };

    setPosts((current) =>
      current.map((post) =>
        post.id === postId
          ? { ...post, comments: [...post.comments, newCommentUI] }
          : post,
      ),
    );

    try {
      const accId = (await AsyncStorage.getItem("acc_id")) || "00000000-0000-0000-0000-000000000000";
      await forumService.createOfficialComment({
        post_id: postId,
        acc_id: accId,
        parent_comment_id: parentId,
        content: text,
      });
      loadPostsFromDb();
    } catch {
      console.log("Locally added comment; database sync skipped.");
    }
  };

  const approvePost = async (post: ForumPostUI) => {
    const confirmed = await confirmAction(
      `Approve "${post.title}"? It will be published to the forum and the author, the authority, and every resident will be notified.`,
    );
    if (!confirmed) return;

    setModeratingPostId(post.id);
    try {
      const adminAccId = await AsyncStorage.getItem("acc_id");
      if (!adminAccId) {
        Alert.alert("Not signed in", "Could not identify the reviewing admin.");
        return;
      }

      const ok = await forumService.approvePost(post.id, adminAccId);
      if (!ok) {
        Alert.alert(
          "Could not approve",
          "The post could not be approved. It may have already been reviewed.",
        );
      }
      await loadPostsFromDb();
    } finally {
      setModeratingPostId(null);
    }
  };

  const submitRejection = async () => {
    if (!rejectTarget) return;

    const note = rejectNote.trim();
    if (!note) return;

    setModeratingPostId(rejectTarget.id);
    try {
      const adminAccId = await AsyncStorage.getItem("acc_id");
      if (!adminAccId) {
        Alert.alert("Not signed in", "Could not identify the reviewing admin.");
        return;
      }

      const ok = await forumService.rejectPost(rejectTarget.id, adminAccId, note);
      if (!ok) {
        Alert.alert(
          "Could not reject",
          "The post could not be rejected. It may have already been reviewed.",
        );
      }

      setRejectTarget(null);
      setRejectNote("");
      await loadPostsFromDb();
    } finally {
      setModeratingPostId(null);
    }
  };

  const deletePost = async (postId: string) => {
    const targetPost = posts.find((p) => p.id === postId);
    const question = targetPost?.official
      ? "Are you sure you want to delete this announcement?"
      : "Are you sure you want to delete this forum post?";
    const confirmed = await confirmAction(question);
    if (!confirmed) return;

    setPosts((current) => current.filter((post) => post.id !== postId));
    try {
      if (!postId.startsWith("post-")) {
        await forumService.deletePost(postId);
      }
    } catch {
      console.log("Local post deletion completed.");
    }
  };

  // Admin deletes comment directly from main database table
  const deleteComment = async (postId: string, commentId: string) => {
    const confirmed = await confirmAction("Are you sure you want to delete this comment?");
    if (!confirmed) return;

    setPosts((current) =>
      current.map((post) =>
        post.id === postId
          ? { ...post, comments: post.comments.filter((comment) => comment.id !== commentId) }
          : post,
      ),
    );

    try {
      if (!commentId.startsWith("comment-")) {
        await forumService.deleteComment(commentId);
        Alert.alert("Deleted", "Comment was removed from the database.");
      }
    } catch {
      console.log("Local comment deletion completed.");
    }
  };

  return (
    <View style={styles.page}>
      <KeyboardAwareScrollView
        ref={scrollViewRef}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.intro}>
          <Text style={styles.title}>Community Forum</Text>
          <Text style={styles.subtitle}>
            Review community discussions, post announcements, reply to comments, and moderate content.
          </Text>
        </View>

        <View style={styles.composer}>
          <Text style={styles.panelTitle}>Create an official community post</Text>
          <Text style={styles.panelSubtitle}>
            Select the message type so residents can quickly understand its purpose.
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
            placeholder="Write the official message..."
            placeholderTextColor="#98A2B3"
            multiline
            style={styles.bodyInput}
          />
          <View style={[styles.composerBottom, isNarrow && styles.composerBottomMobile]}>
            <View style={[styles.statusOptions, isNarrow && styles.statusOptionsMobile]}>
              {officialPostOptions.map((option) => (
                <TouchableOpacity
                  key={option.status}
                  accessibilityLabel={`${option.label}: ${option.description}`}
                  onPress={() => setPostStatus(option.status)}
                  style={[
                    styles.statusOption,
                    isNarrow && styles.statusOptionMobile,
                    postStatus === option.status && {
                      backgroundColor: forumCategoryTheme[option.label].background,
                      borderColor: forumCategoryTheme[option.label].color,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusOptionText,
                      postStatus === option.status && { color: forumCategoryTheme[option.label].color },
                    ]}
                  >
                    {option.label}
                  </Text>
                  <Text style={styles.statusOptionDescription}>{option.description}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              disabled={!postTitle.trim() || !postBody.trim()}
              onPress={publishPost}
              style={[styles.publishButton, isNarrow && styles.publishButtonMobile, (!postTitle.trim() || !postBody.trim()) && styles.disabledButton]}
            >
              <Ionicons name="send" size={16} color="#FFFFFF" />
              <Text style={styles.publishText}>
                Publish {officialPostOptions.find((option) => option.status === postStatus)?.label}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {forumCategories.map((filter) => (
            <TouchableOpacity
              key={filter}
              onPress={() => changeFilter(filter)}
              style={[styles.filter, displayedFilter === filter && styles.activeFilter]}
            >
              <Text style={[styles.filterText, displayedFilter === filter && styles.activeFilterText]}>
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Posts & Comments List */}
        {visiblePosts.map((post) => (
          <View
            key={post.id}
            onLayout={(event) => recordPostOffset(post.id, event)}
            style={[styles.post, post.id === targetPostId && styles.postHighlighted]}
          >
            <View style={styles.postHeader}>
              <View style={styles.authorRow}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{post.initials}</Text>
                </View>
                <View style={styles.authorCopy}>
                  <Text style={styles.author} numberOfLines={1} ellipsizeMode="tail">
                    {post.author}
                  </Text>
                  <Text style={styles.time}>{post.time}</Text>
                </View>
              </View>

              <View style={styles.headerActions}>
                <View style={[styles.statusBadge, { backgroundColor: forumCategoryTheme[getForumCategory(post)].background }]}>
                  <Text style={[styles.statusText, { color: forumCategoryTheme[getForumCategory(post)].color }]}>
                    {getForumCategory(post)}
                  </Text>
                </View>
                <TouchableOpacity
                  accessibilityLabel="Delete post"
                  onPress={() => deletePost(post.id)}
                  style={styles.deleteIcon}
                >
                  <Ionicons name="trash-outline" size={18} color="#B42318" />
                </TouchableOpacity>
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

            {post.moderationStatus === "pending" && (
              <View style={styles.reviewPanel}>
                <View style={styles.reviewHeaderRow}>
                  <Ionicons name="shield-checkmark-outline" size={16} color="#B54708" />
                  <Text style={styles.reviewPendingTitle}>Awaiting your review</Text>
                </View>
                <Text style={styles.reviewHint}>
                  Check this post against the Community Guidelines. Approving
                  publishes it and notifies the author, the authority, and every
                  resident.
                </Text>

                <TouchableOpacity
                  onPress={() => setShowGuidelines(true)}
                  style={styles.reviewGuidelinesLink}
                  accessibilityRole="button"
                  accessibilityLabel="View Community Guidelines"
                >
                  <Ionicons name="shield-checkmark" size={14} color="#00475E" />
                  <Text style={styles.reviewGuidelinesText}>
                    View Community Guidelines
                  </Text>
                  <Ionicons name="chevron-forward" size={13} color="#00475E" />
                </TouchableOpacity>

                <View style={styles.reviewActions}>
                  <TouchableOpacity
                    disabled={moderatingPostId === post.id}
                    onPress={() => approvePost(post)}
                    style={[
                      styles.reviewButton,
                      styles.approveButton,
                      moderatingPostId === post.id && styles.disabledButton,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel="Approve post"
                  >
                    <Ionicons name="checkmark-circle" size={15} color="#FFFFFF" />
                    <Text style={styles.approveButtonText}>Accept</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    disabled={moderatingPostId === post.id}
                    onPress={() => {
                      setRejectTarget(post);
                      setRejectNote("");
                    }}
                    style={[
                      styles.reviewButton,
                      styles.rejectButton,
                      moderatingPostId === post.id && styles.disabledButton,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel="Reject post"
                  >
                    <Ionicons name="close-circle" size={15} color="#B42318" />
                    <Text style={styles.rejectButtonText}>Reject</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <View style={styles.commentHeading}>
              <Ionicons name="chatbubble-outline" size={15} color="#667085" />
              <Text style={styles.commentHeadingText}>
                {post.comments.length} comment{post.comments.length === 1 ? "" : "s"}
              </Text>
            </View>

            {/* Comments & Replies */}
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
                      <View style={styles.adminTag}>
                        <Text style={styles.adminTagText}>Official</Text>
                      </View>
                    ) : null}
                    <Text style={styles.commentTime}>{comment.time}</Text>
                  </View>
                  <Text style={styles.commentText}>{comment.text}</Text>

                  {/* Reply Button for Admin */}
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
                    <Text style={styles.replyActionText}>Reply to comment</Text>
                  </TouchableOpacity>
                </View>

                {/* Admin Delete Comment Button (Deletes from main table) */}
                <TouchableOpacity
                  accessibilityLabel="Delete comment from table"
                  onPress={() => deleteComment(post.id, comment.id)}
                  style={styles.commentDelete}
                >
                  <Ionicons name="close" size={15} color="#B42318" />
                </TouchableOpacity>
              </View>
            ))}

            {/* Comment Composer */}
            {/* Commenting opens only once the post is published. */}
            {isPostOpenForComments(post) && (
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
                      replyTarget[post.id] ? "Write a reply to comment..." : "Add an admin comment..."
                    }
                    placeholderTextColor="#98A2B3"
                    style={styles.commentInput}
                  />
                  <TouchableOpacity onPress={() => addComment(post.id)} style={styles.commentSend}>
                    <Ionicons name="send" size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        ))}

        {visiblePosts.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="chatbubbles-outline" size={40} color="#98A2B3" />
          </View>
        ) : null}
      </KeyboardAwareScrollView>
      <AdminBottomNav activeRoute="forum" />

      <CommunityGuidelinesModal
        visible={showGuidelines}
        onClose={() => setShowGuidelines(false)}
      />

      <Modal
        visible={Boolean(rejectTarget)}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setRejectTarget(null)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setRejectTarget(null)}
        >
          <Pressable
            style={styles.modalCard}
            onPress={(event) => event.stopPropagation()}
          >
            <View style={styles.modalHeaderRow}>
              <View style={styles.modalIconBadge}>
                <Ionicons name="close-circle-outline" size={20} color="#B42318" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Reject this post</Text>
                <Text style={styles.modalSubtitle} numberOfLines={2}>
                  {rejectTarget?.title}
                </Text>
              </View>
            </View>

            {/* A Modal renders in its own window, so it needs its own
                keyboard handling — the screen's scroll view cannot reach it. */}
            <KeyboardAwareScrollView
              contentContainerStyle={styles.modalScrollBody}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              bottomOffset={130}
            >
              <Text style={styles.modalLabel}>
                Why is this post being rejected?
              </Text>
              <Text style={styles.modalHelp}>
                This note is sent to the author with their rejection
                notification, so explain which guideline the post did not meet.
              </Text>

              <TextInput
                value={rejectNote}
                onChangeText={setRejectNote}
                placeholder="e.g. This post shares a neighbour's personal details without consent."
                placeholderTextColor="#98A2B3"
                multiline
                style={styles.modalInput}
              />
            </KeyboardAwareScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setRejectTarget(null)}
                style={[styles.reviewButton, styles.modalCancelButton]}
                accessibilityRole="button"
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                disabled={!rejectNote.trim() || moderatingPostId !== null}
                onPress={submitRejection}
                style={[
                  styles.reviewButton,
                  styles.modalConfirmButton,
                  (!rejectNote.trim() || moderatingPostId !== null) &&
                    styles.disabledButton,
                ]}
                accessibilityRole="button"
              >
                <Text style={styles.modalConfirmText}>Reject & notify</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

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
    </View>
  );
}

/** Fallback demo posts carry no moderation status and are always open. */
function isPostOpenForComments(post: ForumPostUI): boolean {
  return !post.moderationStatus || post.moderationStatus === "approved";
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

function createLocalId(prefix: string): string {
  return `${prefix}-${Date.now()}`;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#F8F9FC" },
  content: { width: "100%", maxWidth: 900, alignSelf: "center", padding: 16, paddingBottom: 102, gap: 16 },
  intro: { marginTop: 8 },
  title: { color: "#00475E", fontSize: 24, fontWeight: "700", letterSpacing: -0.3 },
  subtitle: { marginTop: 4, color: "#40484D", fontSize: 12, lineHeight: 18 },
  composer: { padding: 16, borderRadius: 14, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#DDE3E8", gap: 10 },
  panelTitle: { color: "#191C1E", fontSize: 15, fontWeight: "600" },
  panelSubtitle: { color: "#667085", fontSize: 11, lineHeight: 15 },
  composerBottomMobile: { flexDirection: "column", alignItems: "stretch" },
  titleInput: { minHeight: 42, paddingHorizontal: 12, borderWidth: 1, borderColor: "#D0D5DD", borderRadius: 8, color: "#191C1E", fontSize: 13 },
  statusOptionsMobile: { width: "100%" },
  bodyInput: { minHeight: 88, padding: 12, borderWidth: 1, borderColor: "#D0D5DD", borderRadius: 8, color: "#191C1E", fontSize: 13, textAlignVertical: "top" },
  statusOptionMobile: { flex: 1, minWidth: 0 },
  composerBottom: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  statusOptions: { flex: 1, flexDirection: "row", flexWrap: "wrap", gap: 6 },
  statusOption: { minWidth: 142, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: "#D0D5DD" },
  publishButtonMobile: { minHeight: 48, justifyContent: "center", paddingHorizontal: 16 },
  statusOptionText: { color: "#667085", fontSize: 11, fontWeight: "600" },
  statusOptionDescription: { maxWidth: 150, marginTop: 2, color: "#7A8490", fontSize: 9, lineHeight: 12 },
  publishButton: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8, backgroundColor: "#00475E" },
  disabledButton: { opacity: 0.45 },
  publishText: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },
  filters: { gap: 8 },
  filter: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, backgroundColor: "#ECEEF0" },
  activeFilter: { backgroundColor: "#00475E" },
  filterText: { color: "#40484D", fontSize: 11, fontWeight: "600" },
  activeFilterText: { color: "#FFFFFF" },
  post: { padding: 16, borderRadius: 14, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#DDE3E8" },
  postHighlighted: { borderWidth: 2, borderColor: "#2E78A6", backgroundColor: "#F8FBFF", boxShadow: "0 0 0 4px rgba(46,120,166,0.12)" },
  postHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 14 },
  authorRow: { flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", gap: 9, marginRight: 8 },
  avatar: { width: 36, height: 36, alignItems: "center", justifyContent: "center", borderRadius: 18, backgroundColor: "#E1EBF8" },
  avatarText: { color: "#304B6B", fontSize: 11, fontWeight: "700" },
  authorCopy: { flex: 1, minWidth: 0 },
  author: { color: "#191C1E", fontSize: 12, fontWeight: "700" },
  time: { marginTop: 2, color: "#98A2B3", fontSize: 10 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 8, flexShrink: 0 },
  statusBadge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 9, fontWeight: "700" },
  deleteIcon: { padding: 6, borderRadius: 14, backgroundColor: "#FFF1F0" },
  reviewPanel: {
    marginTop: 14,
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#FFFAEB",
    borderWidth: 1,
    borderColor: "#FEDF89",
    gap: 6,
  },
  reviewHeaderRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  reviewPendingTitle: { color: "#B54708", fontSize: 12, fontWeight: "800" },
  reviewGuidelinesLink: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 5,
    paddingVertical: 2,
  },
  reviewGuidelinesText: {
    color: "#00475E",
    fontSize: 11,
    fontWeight: "700",
    textDecorationLine: "underline",
  },
  reviewHint: { color: "#667085", fontSize: 11, lineHeight: 16 },
  reviewActions: { flexDirection: "row", gap: 8, marginTop: 4 },
  reviewButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  approveButton: { backgroundColor: "#027A48" },
  approveButtonText: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },
  rejectButton: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#FECDCA" },
  rejectButtonText: { color: "#B42318", fontSize: 12, fontWeight: "700" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalCard: {
    width: "100%",
    maxWidth: 420,
    maxHeight: "90%",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#EAECF0",
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 10,
  },
  modalHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#EAECF0",
  },
  modalIconBadge: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#FFF1F0",
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitle: { fontSize: 17, fontWeight: "800", color: "#1F2937" },
  modalSubtitle: { fontSize: 11, color: "#667085", marginTop: 2 },
  modalScrollBody: { paddingTop: 2 },
  modalLabel: { marginTop: 14, color: "#344054", fontSize: 12, fontWeight: "700" },
  modalHelp: { marginTop: 4, color: "#667085", fontSize: 11, lineHeight: 16 },
  modalInput: {
    marginTop: 8,
    minHeight: 88,
    padding: 12,
    borderWidth: 1,
    borderColor: "#D0D5DD",
    borderRadius: 10,
    backgroundColor: "#FAFAFA",
    color: "#191C1E",
    fontSize: 13,
    textAlignVertical: "top",
  },
  modalActions: { flexDirection: "row", gap: 8, marginTop: 14 },
  modalCancelButton: { backgroundColor: "#F2F4F7" },
  modalCancelText: { color: "#344054", fontSize: 12, fontWeight: "700" },
  modalConfirmButton: { backgroundColor: "#B42318" },
  modalConfirmText: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },
  postTitle: { marginTop: 14, color: "#191C1E", fontSize: 16, fontWeight: "700" },
  postBody: { marginTop: 6, color: "#40484D", fontSize: 12, lineHeight: 18 },
  commentHeading: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 16, marginBottom: 8 },
  commentHeadingText: { color: "#667085", fontSize: 11, fontWeight: "600" },
  comment: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginTop: 8, padding: 9, borderRadius: 9, backgroundColor: "#F7F8FA" },
  commentHighlighted: { borderWidth: 2, borderColor: "#C57C1B", backgroundColor: "#FFF9F1" },
  replyComment: { marginLeft: 20, backgroundColor: "#EFF6FF", borderLeftWidth: 2, borderLeftColor: "#3B82F6" },
  commentAvatar: { width: 27, height: 27, alignItems: "center", justifyContent: "center", borderRadius: 14, backgroundColor: "#EAF3FF" },
  commentAvatarText: { color: "#304B6B", fontSize: 9, fontWeight: "700" },
  commentCopy: { flex: 1 },
  commentTop: { flexDirection: "row", alignItems: "center", gap: 6 },
  commentAuthor: { color: "#344054", fontSize: 11, fontWeight: "700" },
  adminTag: { backgroundColor: "#E0F2FE", paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4 },
  adminTagText: { color: "#0369A1", fontSize: 9, fontWeight: "700" },
  commentTime: { color: "#98A2B3", fontSize: 10 },
  commentText: { marginTop: 3, color: "#475467", fontSize: 12, lineHeight: 17 },
  replyAction: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 4 },
  replyActionText: { color: "#00475E", fontSize: 10, fontWeight: "700" },
  commentDelete: { padding: 3 },
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
