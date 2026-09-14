import { supabase } from '@/lib/supabase';

export interface DbAccount {
  acc_id?: string;
  full_name: string;
  username: string;
  role: string;
}

export type ForumStatus = 'Announcement' | 'Update' | 'Alert';

export type ForumModerationStatus = 'pending' | 'approved' | 'rejected';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * forum_posts has two foreign keys to account (acc_id and reviewed_by), so the
 * author embed must name the constraint. A bare `account!acc_id` hint is
 * ambiguous and makes PostgREST reject the whole query with PGRST201.
 */
export const POST_AUTHOR_EMBED =
  'account:account!forum_posts_acc_id_fkey(full_name, username, role)';

export interface FetchPostsOptions {
  /**
   * Account viewing the forum. Their own posts stay visible to them while
   * they wait for review, so a submitted post does not simply vanish.
   * Their rejected posts are not returned — those are surfaced through the
   * rejection notification instead.
   */
  viewerAccId?: string | null;
  /**
   * Moderation states to return, for review screens. Rejected posts are left
   * out everywhere, so an admin queue asks for ['pending', 'approved'].
   */
  moderationStatuses?: ForumModerationStatus[];
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
  status: ForumStatus;
  is_official: boolean;
  created_at: string;
  moderation_status: ForumModerationStatus;
  rejection_note?: string | null;
  reviewed_at?: string | null;
  account?: DbAccount | null;
  comments?: DbForumComment[];
}

export const forumService = {
  /**
   * Fetch all forum posts along with author account information and comments/replies.
   */
  async fetchPosts(options: FetchPostsOptions = {}): Promise<DbForumPost[]> {
    try {
      let query = supabase
        .from('forum_posts')
        .select(`
          *,
          ${POST_AUTHOR_EMBED}
        `);

      if (options.moderationStatuses) {
        query = query.in('moderation_status', options.moderationStatuses);
      } else {
        // The id is interpolated into a PostgREST filter, so only accept a UUID.
        const viewerAccId = UUID_PATTERN.test(options.viewerAccId ?? '')
          ? options.viewerAccId
          : null;

        // Approved posts, plus the viewer's own post while it awaits review.
        query = viewerAccId
          ? query.or(
              `moderation_status.eq.approved,and(acc_id.eq.${viewerAccId},moderation_status.eq.pending)`,
            )
          : query.eq('moderation_status', 'approved');
      }

      const { data: posts, error: postsError } = await query.order(
        'created_at',
        { ascending: false },
      );

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

  /** Create a verified post from an admin or community authority account. */
  async createOfficialPost(params: {
    acc_id: string;
    title: string;
    body: string;
    status: ForumStatus;
  }): Promise<DbForumPost | null> {
    return createForumPost({ ...params, is_official: true });
  },

  /** Create the only post type available to residents. */
  async createResidentDiscussion(params: {
    acc_id: string;
    title: string;
    body: string;
  }): Promise<DbForumPost | null> {
    return createForumPost({
      ...params,
      status: 'Update',
      is_official: false,
    });
  },

  async createOfficialComment(params: {
    post_id: string;
    acc_id: string;
    parent_comment_id?: string | null;
    content: string;
  }): Promise<DbForumComment | null> {
    return createForumComment({ ...params, is_official: true });
  },

  async createResidentComment(params: {
    post_id: string;
    acc_id: string;
    parent_comment_id?: string | null;
    content: string;
  }): Promise<DbForumComment | null> {
    return createForumComment({ ...params, is_official: false });
  },

  /**
   * Look up one of the viewer's own rejected posts. A rejected post is removed
   * from every feed, so this is how the author reads the reason after tapping
   * their rejection notification.
   */
  async fetchOwnRejectedPost(
    post_id: string,
    acc_id: string,
  ): Promise<DbForumPost | null> {
    try {
      const { data, error } = await supabase
        .from('forum_posts')
        .select(`*, ${POST_AUTHOR_EMBED}`)
        .eq('post_id', post_id)
        .eq('acc_id', acc_id)
        .eq('moderation_status', 'rejected')
        .maybeSingle();

      if (error) {
        console.warn('Supabase rejected post lookup failed:', error.message);
        return null;
      }
      return data;
    } catch (e: any) {
      console.warn('Supabase rejected post lookup error:', e?.message || e);
      return null;
    }
  },

  /**
   * Approve a resident post. Database triggers notify the author and then
   * announce the post to the authority and every other resident.
   */
  async approvePost(post_id: string, admin_acc_id: string): Promise<boolean> {
    return setModerationStatus(post_id, admin_acc_id, 'approved', null);
  },

  /**
   * Reject a resident post. The note is required and is shown to the author
   * in their rejection notification.
   */
  async rejectPost(
    post_id: string,
    admin_acc_id: string,
    rejection_note: string,
  ): Promise<boolean> {
    const note = rejection_note.trim();
    if (!note) {
      console.warn('Rejecting a post requires a reason for the author.');
      return false;
    }
    return setModerationStatus(post_id, admin_acc_id, 'rejected', note);
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

async function setModerationStatus(
  post_id: string,
  admin_acc_id: string,
  moderation_status: Exclude<ForumModerationStatus, 'pending'>,
  rejection_note: string | null,
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('forum_posts')
      .update({
        moderation_status,
        reviewed_by: admin_acc_id,
        rejection_note,
      })
      .eq('post_id', post_id)
      // Guard against two admins reviewing the same post at once.
      .eq('moderation_status', 'pending');

    if (error) {
      console.warn('Supabase forum moderation update failed:', error.message);
      return false;
    }
    return true;
  } catch (e: any) {
    console.warn('Supabase forum moderation error:', e?.message || e);
    return false;
  }
}

async function createForumPost(params: {
  acc_id: string;
  title: string;
  body: string;
  status: ForumStatus;
  is_official: boolean;
}): Promise<DbForumPost | null> {
  try {
    const { data, error } = await supabase
      .from('forum_posts')
      .insert([params])
      .select(`*, ${POST_AUTHOR_EMBED}`)
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
}

async function createForumComment(params: {
  post_id: string;
  acc_id: string;
  parent_comment_id?: string | null;
  content: string;
  is_official: boolean;
}): Promise<DbForumComment | null> {
  try {
    const { data, error } = await supabase
      .from('forum_comments')
      .insert([{ ...params, parent_comment_id: params.parent_comment_id || null }])
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
}
