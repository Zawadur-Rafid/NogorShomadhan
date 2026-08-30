import Ionicons from "@expo/vector-icons/Ionicons";
import { useEffect, useMemo, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import BottomNav from "@/components/BottomNav";
import { forumService } from "@/services/forum.service";
import { confirmAction } from "@/utils/confirm";

type ForumStatus = "Announcement" | "Update" | "Alert";
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

const statusStyle: Record<ForumStatus, { background: string; color: string }> = {
  Announcement: { background: "#EAF3FF", color: "#1D4ED8" },
  Update: { background: "#EAF8EF", color: "#027A48" },
  Alert: { background: "#FFF1F0", color: "#B42318" },
};

export default function ResidentForumScreen() {
  const [posts, setPosts] = useState<ForumPostUI[]>(initialPosts);
  const [postTitle, setPostTitle] = useState("");
  const [postBody, setPostBody] = useState("");
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [replyTarget, setReplyTarget] = useState<Record<string, string | null>>({});
  const [activeFilter, setActiveFilter] = useState<ForumStatus | "All">("All");

  const loadPostsFromDb = async () => {
    try {
      const dbPosts = await forumService.fetchPosts();
      if (dbPosts && dbPosts.length > 0) {
        const formatted: ForumPostUI[] = dbPosts.map((p) => ({
          id: p.post_id,
          author: p.account?.full_name || (p.is_official ? "Authority" : "Resident"),
          initials: getInitials(p.account?.full_name || (p.is_official ? "Authority" : "Resident")),
          status: p.status,
          title: p.title,
          body: p.body,
          time: formatTimeAgo(p.created_at),
          official: p.is_official,
          comments: (p.comments || []).map((c) => ({
            id: c.comment_id,
            author: c.account?.full_name || (c.is_official ? "Authority" : "Resident"),
            initials: getInitials(c.account?.full_name || (c.is_official ? "Authority" : "Resident")),
            text: c.content,
            time: formatTimeAgo(c.created_at),
            parent_comment_id: c.parent_comment_id,
            official: c.is_official,
          })),
        }));
        setPosts(formatted);
      }
    } catch (e) {
      console.warn("Could not load posts from Supabase:", e);
    }
  };

  useEffect(() => {
    loadPostsFromDb();
  }, []);

  const visiblePosts = useMemo(
    () => (activeFilter === "All" ? posts : posts.filter((post) => post.status === activeFilter)),
    [activeFilter, posts],
  );

  const publishPost = async () => {
    if (!postTitle.trim() || !postBody.trim()) return;

    const confirmed = await confirmAction('Are you sure you want to submit this forum post?');
    if (!confirmed) return;

    const title = postTitle.trim();
    const body = postBody.trim();
    setPostTitle("");
    setPostBody("");

    const newPostUI: ForumPostUI = {
      id: `post-${Date.now()}`,
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
      await forumService.createPost({
        acc_id: accId,
        title,
        body,
        status: "Update",
        is_official: false,
      });
      loadPostsFromDb();
    } catch (e) {
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
      id: `comment-${Date.now()}`,
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
      await forumService.createComment({
        post_id: postId,
        acc_id: accId,
        parent_comment_id: parentId,
        content: text,
        is_official: false,
      });
      loadPostsFromDb();
    } catch (e) {
      console.log("Local resident comment added; database sync skipped.");
    }
  };

  return (
    <SafeAreaView style={styles.page}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.intro}>
          <Text style={styles.kicker}>Community Forum</Text>
          <Text style={styles.title}>Resident discussions</Text>
          <Text style={styles.subtitle}>
            Share updates, ask questions, comment, and reply to neighborhood discussions.
          </Text>
        </View>

        <View style={styles.composer}>
          <Text style={styles.panelTitle}>Start a conversation</Text>
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
            placeholder="Ask a question, share an update, or report an issue..."
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
            <Text style={styles.publishText}>Post to forum</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {(["All", "Announcement", "Update", "Alert"] as const).map((filter) => (
            <TouchableOpacity
              key={filter}
              onPress={() => setActiveFilter(filter)}
              style={[styles.filter, activeFilter === filter && styles.activeFilter]}
            >
              <Text style={[styles.filterText, activeFilter === filter && styles.activeFilterText]}>{filter}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {visiblePosts.map((post) => (
          <View key={post.id} style={styles.post}>
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

              <View style={[styles.statusBadge, { backgroundColor: statusStyle[post.status].background }]}>
                <Text style={[styles.statusText, { color: statusStyle[post.status].color }]}>{post.status}</Text>
              </View>
            </View>

            <Text style={styles.postTitle}>{post.title}</Text>
            <Text style={styles.postBody}>{post.body}</Text>

            <View style={styles.commentHeading}>
              <Ionicons name="chatbubble-outline" size={15} color="#667085" />
              <Text style={styles.commentHeadingText}>
                {post.comments.length} comment{post.comments.length === 1 ? "" : "s"}
              </Text>
            </View>

            {post.comments.map((comment) => (
              <View
                key={comment.id}
                style={[styles.comment, comment.parent_comment_id && styles.replyComment]}
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
});