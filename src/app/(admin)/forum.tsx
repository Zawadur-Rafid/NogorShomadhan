import Ionicons from "@expo/vector-icons/Ionicons";
import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

import AdminBottomNav from "@/components/AdminBottomNav";

type ForumStatus = "Announcement" | "Update" | "Alert";
type ForumComment = { id: string; author: string; initials: string; text: string; time: string };
type ForumPost = { id: string; author: string; initials: string; status: ForumStatus; title: string; body: string; time: string; comments: ForumComment[] };

const initialPosts: ForumPost[] = [
  { id: "post-1", author: "Nusrat Jahan", initials: "NJ", status: "Alert", title: "Water supply interruption", body: "Water pressure has been low in Block C since this morning. Is there an update from the authority?", time: "18 min ago", comments: [{ id: "comment-1", author: "Community Authority", initials: "CA", text: "The maintenance team has been informed and is inspecting the line.", time: "10 min ago" }] },
  { id: "post-2", author: "Rahim Ahmed", initials: "RA", status: "Update", title: "Park cleaning completed", body: "The community park was cleaned today. Thank you to everyone who reported the overflowing bins.", time: "2 hr ago", comments: [{ id: "comment-2", author: "Sadia Islam", initials: "SI", text: "It looks much better now. Thank you!", time: "1 hr ago" }] },
  { id: "post-3", author: "Community Authority", initials: "CA", status: "Announcement", title: "Weekend road maintenance", body: "Road resurfacing near the east gate will take place this Friday from 9 AM to 4 PM.", time: "Yesterday", comments: [] },
];

const statusStyle: Record<ForumStatus, { background: string; color: string }> = {
  Announcement: { background: "#EAF3FF", color: "#1D4ED8" },
  Update: { background: "#EAF8EF", color: "#027A48" },
  Alert: { background: "#FFF1F0", color: "#B42318" },
};

export default function AdminForumScreen() {
  const [posts, setPosts] = useState(initialPosts);
  const [postTitle, setPostTitle] = useState("");
  const [postBody, setPostBody] = useState("");
  const [postStatus, setPostStatus] = useState<ForumStatus>("Announcement");
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [activeFilter, setActiveFilter] = useState<ForumStatus | "All">("All");

  const visiblePosts = useMemo(
    () => (activeFilter === "All" ? posts : posts.filter((post) => post.status === activeFilter)),
    [activeFilter, posts],
  );

  const publishPost = () => {
    if (!postTitle.trim() || !postBody.trim()) return;
    setPosts((current) => [{ id: `post-${Date.now()}`, author: "Administrator", initials: "AD", status: postStatus, title: postTitle.trim(), body: postBody.trim(), time: "Just now", comments: [] }, ...current]);
    setPostTitle("");
    setPostBody("");
  };

  const addComment = (postId: string) => {
    const text = commentDrafts[postId]?.trim();
    if (!text) return;
    setPosts((current) => current.map((post) => post.id === postId ? { ...post, comments: [...post.comments, { id: `comment-${Date.now()}`, author: "Administrator", initials: "AD", text, time: "Just now" }] } : post));
    setCommentDrafts((current) => ({ ...current, [postId]: "" }));
  };

  const deletePost = (postId: string) => setPosts((current) => current.filter((post) => post.id !== postId));
  const deleteComment = (postId: string, commentId: string) => setPosts((current) => current.map((post) => post.id === postId ? { ...post, comments: post.comments.filter((comment) => comment.id !== commentId) } : post));

  return (
    <View style={styles.page}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.intro}><Text style={styles.title}>Community Forum</Text><Text style={styles.subtitle}>Review community discussions, post updates, and moderate all resident activity.</Text></View>

        <View style={styles.composer}>
          <Text style={styles.panelTitle}>Create an admin post</Text>
          <TextInput value={postTitle} onChangeText={setPostTitle} placeholder="Post title" placeholderTextColor="#98A2B3" style={styles.titleInput} />
          <TextInput value={postBody} onChangeText={setPostBody} placeholder="Write an announcement, update, or alert..." placeholderTextColor="#98A2B3" multiline style={styles.bodyInput} />
          <View style={styles.composerBottom}>
            <View style={styles.statusOptions}>{(["Announcement", "Update", "Alert"] as ForumStatus[]).map((status) => <TouchableOpacity key={status} onPress={() => setPostStatus(status)} style={[styles.statusOption, postStatus === status && { backgroundColor: statusStyle[status].background, borderColor: statusStyle[status].color }]}><Text style={[styles.statusOptionText, postStatus === status && { color: statusStyle[status].color }]}>{status}</Text></TouchableOpacity>)}</View>
            <TouchableOpacity disabled={!postTitle.trim() || !postBody.trim()} onPress={publishPost} style={[styles.publishButton, (!postTitle.trim() || !postBody.trim()) && styles.disabledButton]}><Ionicons name="send" size={16} color="#FFFFFF" /><Text style={styles.publishText}>Publish</Text></TouchableOpacity>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>{(["All", "Announcement", "Update", "Alert"] as const).map((filter) => <TouchableOpacity key={filter} onPress={() => setActiveFilter(filter)} style={[styles.filter, activeFilter === filter && styles.activeFilter]}><Text style={[styles.filterText, activeFilter === filter && styles.activeFilterText]}>{filter}</Text></TouchableOpacity>)}</ScrollView>

        {visiblePosts.map((post) => <View key={post.id} style={styles.post}>
          <View style={styles.postHeader}><View style={styles.authorRow}><View style={styles.avatar}><Text style={styles.avatarText}>{post.initials}</Text></View><View><Text style={styles.author}>{post.author}</Text><Text style={styles.time}>{post.time}</Text></View></View><View style={styles.headerActions}><View style={[styles.statusBadge, { backgroundColor: statusStyle[post.status].background }]}><Text style={[styles.statusText, { color: statusStyle[post.status].color }]}>{post.status}</Text></View><TouchableOpacity accessibilityLabel="Delete post" onPress={() => deletePost(post.id)} style={styles.deleteIcon}><Ionicons name="trash-outline" size={18} color="#B42318" /></TouchableOpacity></View></View>
          <Text style={styles.postTitle}>{post.title}</Text><Text style={styles.postBody}>{post.body}</Text>
          <View style={styles.commentHeading}><Ionicons name="chatbubble-outline" size={15} color="#667085" /><Text style={styles.commentHeadingText}>{post.comments.length} comment{post.comments.length === 1 ? "" : "s"}</Text></View>
          {post.comments.map((comment) => <View key={comment.id} style={styles.comment}><View style={styles.commentAvatar}><Text style={styles.commentAvatarText}>{comment.initials}</Text></View><View style={styles.commentCopy}><View style={styles.commentTop}><Text style={styles.commentAuthor}>{comment.author}</Text><Text style={styles.commentTime}>{comment.time}</Text></View><Text style={styles.commentText}>{comment.text}</Text></View><TouchableOpacity accessibilityLabel="Delete comment" onPress={() => deleteComment(post.id, comment.id)} style={styles.commentDelete}><Ionicons name="close" size={15} color="#B42318" /></TouchableOpacity></View>)}
          <View style={styles.commentComposer}><TextInput value={commentDrafts[post.id] ?? ""} onChangeText={(text) => setCommentDrafts((current) => ({ ...current, [post.id]: text }))} placeholder="Add an admin comment..." placeholderTextColor="#98A2B3" style={styles.commentInput} /><TouchableOpacity onPress={() => addComment(post.id)} style={styles.commentSend}><Ionicons name="send" size={16} color="#FFFFFF" /></TouchableOpacity></View>
        </View>)}
        {visiblePosts.length === 0 ? <View style={styles.empty}><Ionicons name="chatbubbles-outline" size={40} color="#98A2B3" /><Text style={styles.emptyText}>No forum posts in this category.</Text></View> : null}
      </ScrollView>
      <AdminBottomNav activeRoute="forum" />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#F8F9FC" }, content: { width: "100%", maxWidth: 900, alignSelf: "center", padding: 16, paddingBottom: 102, gap: 16 },
  intro: { marginTop: 8 }, title: { color: "#00475E", fontSize: 32, fontWeight: "700", letterSpacing: -0.5 }, subtitle: { marginTop: 4, color: "#40484D", fontSize: 14, lineHeight: 20 },
  composer: { padding: 16, borderRadius: 14, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#DDE3E8", gap: 10 }, panelTitle: { color: "#191C1E", fontSize: 17, fontWeight: "600" }, titleInput: { minHeight: 42, paddingHorizontal: 12, borderWidth: 1, borderColor: "#D0D5DD", borderRadius: 8, color: "#191C1E", fontSize: 14 }, bodyInput: { minHeight: 88, padding: 12, borderWidth: 1, borderColor: "#D0D5DD", borderRadius: 8, color: "#191C1E", fontSize: 14, textAlignVertical: "top" }, composerBottom: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 }, statusOptions: { flex: 1, flexDirection: "row", flexWrap: "wrap", gap: 6 }, statusOption: { paddingHorizontal: 9, paddingVertical: 6, borderRadius: 14, borderWidth: 1, borderColor: "#D0D5DD" }, statusOptionText: { color: "#667085", fontSize: 11, fontWeight: "600" }, publishButton: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8, backgroundColor: "#00475E" }, disabledButton: { opacity: 0.45 }, publishText: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },
  filters: { gap: 8 }, filter: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, backgroundColor: "#ECEEF0" }, activeFilter: { backgroundColor: "#00475E" }, filterText: { color: "#40484D", fontSize: 12, fontWeight: "600" }, activeFilterText: { color: "#FFFFFF" },
  post: { padding: 16, borderRadius: 14, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#DDE3E8" }, postHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }, authorRow: { flexDirection: "row", alignItems: "center", gap: 9, flex: 1 }, avatar: { width: 36, height: 36, alignItems: "center", justifyContent: "center", borderRadius: 18, backgroundColor: "#E1EBF8" }, avatarText: { color: "#304B6B", fontSize: 12, fontWeight: "700" }, author: { color: "#191C1E", fontSize: 13, fontWeight: "700" }, time: { marginTop: 2, color: "#98A2B3", fontSize: 11 }, headerActions: { flexDirection: "row", alignItems: "center", gap: 5 }, statusBadge: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 12 }, statusText: { fontSize: 10, fontWeight: "700" }, deleteIcon: { padding: 6, borderRadius: 14, backgroundColor: "#FFF1F0" }, postTitle: { marginTop: 14, color: "#191C1E", fontSize: 18, fontWeight: "600" }, postBody: { marginTop: 6, color: "#40484D", fontSize: 14, lineHeight: 20 },
  commentHeading: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 16, marginBottom: 8 }, commentHeadingText: { color: "#667085", fontSize: 12, fontWeight: "600" }, comment: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginTop: 8, padding: 9, borderRadius: 9, backgroundColor: "#F7F8FA" }, commentAvatar: { width: 27, height: 27, alignItems: "center", justifyContent: "center", borderRadius: 14, backgroundColor: "#EAF3FF" }, commentAvatarText: { color: "#304B6B", fontSize: 9, fontWeight: "700" }, commentCopy: { flex: 1 }, commentTop: { flexDirection: "row", alignItems: "center", gap: 6 }, commentAuthor: { color: "#344054", fontSize: 11, fontWeight: "700" }, commentTime: { color: "#98A2B3", fontSize: 10 }, commentText: { marginTop: 3, color: "#475467", fontSize: 12, lineHeight: 17 }, commentDelete: { padding: 3 }, commentComposer: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 12 }, commentInput: { flex: 1, minHeight: 38, paddingHorizontal: 11, borderWidth: 1, borderColor: "#D0D5DD", borderRadius: 8, color: "#191C1E", fontSize: 12 }, commentSend: { width: 38, height: 38, alignItems: "center", justifyContent: "center", borderRadius: 8, backgroundColor: "#00475E" },
  empty: { minHeight: 160, alignItems: "center", justifyContent: "center", gap: 8 }, emptyText: { color: "#667085", fontSize: 14 },
});
