import { supabase } from '@/lib/supabase';

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return diffInSeconds + ' sec ago';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return diffInMinutes + ' min ago';
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return diffInHours + ' hr ago';
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return 'Yesterday';
  if (diffInDays < 30) return diffInDays + ' days ago';
  return date.toLocaleDateString();
}

export interface ForumNotification {
  id: string;
  type: 'forum_post' | 'forum_comment' | 'forum_announcement';
  icon: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  createdAt: Date;
}

export const notificationService = {
  async fetchForumNotifications(
    role: 'admin' | 'authority' | 'resident',
    accId?: string
  ): Promise<ForumNotification[]> {
    try {
      const notifications: ForumNotification[] = [];

      // 1. Fetch forum posts
      const { data: posts, error: postsError } = await supabase
        .from('forum_posts')
        .select('*, account:account!acc_id(full_name, username, role)')
        .order('created_at', { ascending: false });

      if (postsError) {
        console.warn('Error fetching posts for notifications:', postsError.message);
      }

      if (posts) {
        posts.forEach((post) => {
          const authorRole = post.account?.role;
          const authorName = post.account?.full_name || 'Someone';

          if (role === 'admin') {
            if (!post.is_official) {
              notifications.push({
                id: 'post-' + post.post_id,
                type: 'forum_post',
                icon: 'chatbubble-ellipses-outline',
                title: 'New Forum Post',
                message: authorName + ' posted: "' + post.title + '"',
                time: formatTimeAgo(post.created_at),
                read: false,
                createdAt: new Date(post.created_at),
              });
            } else if (authorRole === 'authority') {
              notifications.push({
                id: 'ann-' + post.post_id,
                type: 'forum_announcement',
                icon: 'megaphone-outline',
                title: 'New Announcement',
                message: 'Authority posted: "' + post.title + '"',
                time: formatTimeAgo(post.created_at),
                read: false,
                createdAt: new Date(post.created_at),
              });
            }
          }

          if (role === 'authority') {
            if (!post.is_official) {
              notifications.push({
                id: 'post-' + post.post_id,
                type: 'forum_post',
                icon: 'chatbubble-ellipses-outline',
                title: 'New Forum Post',
                message: authorName + ' posted: "' + post.title + '"',
                time: formatTimeAgo(post.created_at),
                read: false,
                createdAt: new Date(post.created_at),
              });
            } else if (authorRole === 'admin') {
              notifications.push({
                id: 'ann-' + post.post_id,
                type: 'forum_announcement',
                icon: 'megaphone-outline',
                title: 'New Announcement',
                message: 'Admin posted: "' + post.title + '"',
                time: formatTimeAgo(post.created_at),
                read: false,
                createdAt: new Date(post.created_at),
              });
            }
          }

          if (role === 'resident') {
            if (post.is_official) {
              notifications.push({
                id: 'ann-' + post.post_id,
                type: 'forum_announcement',
                icon: 'megaphone-outline',
                title: 'New Announcement',
                message: (authorRole === 'admin' ? 'Admin' : 'Authority') + ' posted: "' + post.title + '"',
                time: formatTimeAgo(post.created_at),
                read: false,
                createdAt: new Date(post.created_at),
              });
            } else if (post.acc_id !== accId) {
              notifications.push({
                id: 'post-' + post.post_id,
                type: 'forum_post',
                icon: 'chatbubble-ellipses-outline',
                title: 'New Resident Post',
                message: authorName + ' posted: "' + post.title + '"',
                time: formatTimeAgo(post.created_at),
                read: false,
                createdAt: new Date(post.created_at),
              });
            }
          }
        });
      }

      // 2. Fetch comments for resident
      if (role === 'resident' && accId) {
        const myPosts = posts?.filter((p) => p.acc_id === accId) || [];
        const myPostIds = myPosts.map((p) => p.post_id);

        if (myPostIds.length > 0) {
          const { data: comments, error: commentsError } = await supabase
            .from('forum_comments')
            .select('*, account:account!acc_id(full_name)')
            .in('post_id', myPostIds)
            .neq('acc_id', accId)
            .order('created_at', { ascending: false });

          if (commentsError) {
            console.warn('Error fetching comments for notifications:', commentsError.message);
          }

          if (comments) {
            comments.forEach((comment) => {
              const authorName = comment.account?.full_name || 'Someone';
              notifications.push({
                id: 'comment-' + comment.comment_id,
                type: 'forum_comment',
                icon: 'chatbox-outline',
                title: 'New Comment',
                message: authorName + ' commented on your post.',
                time: formatTimeAgo(comment.created_at),
                read: false,
                createdAt: new Date(comment.created_at),
              });
            });
          }
        }
      }

      return notifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (e) {
      console.error('Unexpected error in fetchForumNotifications:', e);
      return [];
    }
  },
};
