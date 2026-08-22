import { supabase } from '@/lib/supabase';

export interface DbAccount {
  acc_id?: string;
  full_name: string;
  username: string;
  role: string;
}

export interface DbForumComment {
  comment_id: string;
  post_id: string;
  acc_id: string;
  parent_comment_id?: string | null;
  content: string;
  is_official: boolean;
  created_at: string;
  account?: DbAccount | null;
}

export interface DbForumPost {
  post_id: string;
  acc_id: string;
  title: string;
  body: string;
  status: 'Announcement' | 'Update' | 'Alert';
  is_official: boolean;
  created_at: string;
  account?: DbAccount | null;
  comments?: DbForumComment[];
}

export const forumService = {
  /**
   * Fetch all forum posts along with author account information and comments/replies.
   */
  async fetchPosts(): Promise<DbForumPost[]> {
    try {
      const { data: posts, error: postsError } = await supabase
        .from('forum_posts')
        .select(`
          *,
          account:account!acc_id(full_name, username, role)
        `)
        .order('created_at', { ascending: false });

      if (postsError) {
        console.warn('Supabase fetch error for forum_posts:', postsError.message);
        return [];
      }

      if (!posts || posts.length === 0) return [];

      const postIds = posts.map((p) => p.post_id);

      const { data: comments, error: commentsError } = await supabase
        .from('forum_comments')
        .select(`
          *,
          account:account!acc_id(full_name, username, role)
        `)
        .in('post_id', postIds)
        .order('created_at', { ascending: true });

      if (commentsError) {
        console.warn('Supabase fetch error for forum_comments:', commentsError.message);
      }

      const allComments: DbForumComment[] = comments || [];

      return posts.map((post) => {
        const postComments = allComments.filter((c) => c.post_id === post.post_id);
        return {
          ...post,
          comments: postComments,
        };
      });
    } catch (e) {
      console.error('Unexpected error in fetchPosts:', e);
      return [];
    }
  },

  /**
   * Create a new forum post or official announcement.
   */
  async createPost(params: {
    acc_id: string;
    title: string;
    body: string;
    status: 'Announcement' | 'Update' | 'Alert';
    is_official?: boolean;
  }): Promise<DbForumPost | null> {
    try {
      const { data, error } = await supabase
        .from('forum_posts')
        .insert([
          {
            acc_id: params.acc_id,
            title: params.title,
            body: params.body,
            status: params.status,
            is_official: params.is_official ?? false,
          },
        ])
        .select(`*, account:account!acc_id(full_name, username, role)`)
        .single();

      if (error) {
        console.warn('Supabase post creation skipped (run supabase_forum.sql in Supabase SQL editor):', error.message);
        return null;
      }
      return data;
    } catch (e: any) {
      console.warn('Supabase post creation error:', e?.message || e);
      return null;
    }
  },

  /**
   * Post a comment or a reply to a specific comment on a post.
   * `parent_comment_id` links the reply to the target parent comment.
   * `acc_id` stores the user/resident ID making the comment.
   */
  async createComment(params: {
    post_id: string;
    acc_id: string;
    parent_comment_id?: string | null;
    content: string;
    is_official?: boolean;
  }): Promise<DbForumComment | null> {
    try {
      const { data, error } = await supabase
        .from('forum_comments')
        .insert([
          {
            post_id: params.post_id,
            acc_id: params.acc_id,
            parent_comment_id: params.parent_comment_id || null,
            content: params.content,
            is_official: params.is_official ?? false,
          },
        ])
        .select(`*, account:account!acc_id(full_name, username, role)`)
        .single();

      if (error) {
        console.warn('Supabase comment creation skipped (run supabase_forum.sql in Supabase SQL editor):', error.message);
        return null;
      }
      return data;
    } catch (e: any) {
      console.warn('Supabase comment creation error:', e?.message || e);
      return null;
    }
  },

  /**
   * Delete a comment from the main database table (e.g. Admin moderation).
   */
  async deleteComment(comment_id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('forum_comments')
        .delete()
        .eq('comment_id', comment_id);

      if (error) {
        console.warn('Supabase comment deletion skipped:', error.message);
        return false;
      }
      return true;
    } catch (e: any) {
      console.warn('Supabase comment deletion error:', e?.message || e);
      return false;
    }
  },

  /**
   * Delete a post from the main database table.
   */
  async deletePost(post_id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('forum_posts')
        .delete()
        .eq('post_id', post_id);

      if (error) {
        console.warn('Supabase post deletion skipped:', error.message);
        return false;
      }
      return true;
    } catch (e: any) {
      console.warn('Supabase post deletion error:', e?.message || e);
      return false;
    }
  },
};
