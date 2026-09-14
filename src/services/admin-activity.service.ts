import AsyncStorage from '@react-native-async-storage/async-storage';

import { supabase } from '@/lib/supabase';
import { POST_AUTHOR_EMBED } from '@/services/forum.service';

export type AdminActivityCategory =
  | 'Account'
  | 'Complaint'
  | 'Duplicate'
  | 'Forum'
  | 'Settings';

export type AdminActivityEntity =
  | 'account'
  | 'complaint'
  | 'duplicate'
  | 'forum_post'
  | 'settings';

export type AdminActivity = {
  id: string;
  category: AdminActivityCategory;
  action: string;
  entityType: AdminActivityEntity;
  entityId: string;
  title: string;
  detail: string;
  createdAt: string;
};

type AccountReviewRow = {
  review_id: string;
  acc_id: string | null;
  full_name: string | null;
  username: string | null;
  decision: string;
  reviewed_at: string;
  note: string | null;
};

type StatusHistoryRow = {
  history_id: string;
  comp_id: string;
  from_status: string;
  to_status: string;
  note: string | null;
  changed_at: string;
};

type DuplicateRow = {
  dup_id: string;
  comp_id: string | null;
  matched_comp_id: string;
  admin_status: string;
  admin_note: string | null;
  ai_score: number | string | null;
  reviewed_at: string | null;
};

type ModeratedPostRow = {
  post_id: string;
  title: string;
  moderation_status: string;
  rejection_note: string | null;
  reviewed_at: string | null;
  account?: { full_name?: string | null } | null;
};

type OwnPostRow = {
  post_id: string;
  title: string;
  status: string;
  is_official: boolean;
  created_at: string;
};

type OwnCommentRow = {
  comment_id: string;
  post_id: string;
  parent_comment_id: string | null;
  content: string;
  created_at: string;
};

type SettingsRow = {
  id: string | number;
  maintenance_mode: boolean | null;
  ai_auto_categorize: boolean | null;
  duplicate_detection: boolean | null;
  duplicate_threshold_percent: number | null;
  updated_at: string | null;
};

const SOURCE_LIMIT = 200;

function clean(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function complaintTitle(
  titles: Map<string, string>,
  complaintId: string,
): string {
  return titles.get(complaintId) || `Complaint ${complaintId.slice(0, 8)}`;
}

function joinDetails(parts: (string | null | undefined)[]): string {
  return parts.map(clean).filter(Boolean).join(' · ');
}

function formatScore(value: number | string | null): string {
  if (value === null || value === '') return '';
  const score = Number(value);
  if (!Number.isFinite(score)) return '';
  const percent = score <= 1 ? score * 100 : score;
  return `AI match ${Math.round(percent)}%`;
}

async function getLoggedInAdminId(): Promise<string> {
  const accId = await AsyncStorage.getItem('acc_id');
  if (!accId) {
    throw new Error('No logged-in admin account was found.');
  }
  return accId;
}

async function fetchSourceActivities(accId: string): Promise<AdminActivity[]> {
  const [
    accountResult,
    statusResult,
    duplicateResult,
    moderatedPostResult,
    ownPostResult,
    ownCommentResult,
    settingsResult,
  ] = await Promise.all([
    supabase
      .from('account_review_log')
      .select('review_id, acc_id, full_name, username, decision, reviewed_at, note')
      .eq('reviewed_by', accId)
      .order('reviewed_at', { ascending: false })
      .limit(SOURCE_LIMIT),
    supabase
      .from('complaint_status_history')
      .select('history_id, comp_id, from_status, to_status, note, changed_at')
      .eq('changed_by_acc_id', accId)
      .order('changed_at', { ascending: false })
      .limit(SOURCE_LIMIT),
    supabase
      .from('duplicate')
      .select('dup_id, comp_id, matched_comp_id, admin_status, admin_note, ai_score, reviewed_at')
      .eq('reviewed_by', accId)
      .order('reviewed_at', { ascending: false })
      .limit(SOURCE_LIMIT),
    // Moderation decisions on other people's posts. A post the admin wrote
    // themselves is stamped reviewed_by = author by the database trigger, so it
    // is excluded here and reported as an authored post instead.
    supabase
      .from('forum_posts')
      .select(`post_id, title, moderation_status, rejection_note, reviewed_at, ${POST_AUTHOR_EMBED}`)
      .eq('reviewed_by', accId)
      .neq('acc_id', accId)
      .order('reviewed_at', { ascending: false })
      .limit(SOURCE_LIMIT),
    supabase
      .from('forum_posts')
      .select('post_id, title, status, is_official, created_at')
      .eq('acc_id', accId)
      .order('created_at', { ascending: false })
      .limit(SOURCE_LIMIT),
    supabase
      .from('forum_comments')
      .select('comment_id, post_id, parent_comment_id, content, created_at')
      .eq('acc_id', accId)
      .order('created_at', { ascending: false })
      .limit(SOURCE_LIMIT),
    supabase
      .from('app_settings')
      .select('id, maintenance_mode, ai_auto_categorize, duplicate_detection, duplicate_threshold_percent, updated_at')
      .eq('updated_by_acc_id', accId)
      .order('updated_at', { ascending: false })
      .limit(SOURCE_LIMIT),
  ]);

  const results = [
    accountResult,
    statusResult,
    duplicateResult,
    moderatedPostResult,
    ownPostResult,
    ownCommentResult,
    settingsResult,
  ];
  const failures = results.filter((result) => result.error);

  if (failures.length === results.length) {
    throw new Error(
      `Failed to load admin activity: ${failures[0]?.error?.message ?? 'No activity source was available.'}`,
    );
  }

  failures.forEach((result) => {
    console.warn('An activity source could not be loaded:', result.error?.message);
  });

  const accountRows = (accountResult.data ?? []) as AccountReviewRow[];
  const statusRows = (statusResult.data ?? []) as StatusHistoryRow[];
  const duplicateRows = (duplicateResult.data ?? []) as DuplicateRow[];
  const moderatedRows = (moderatedPostResult.data ?? []) as unknown as ModeratedPostRow[];
  const ownPostRows = (ownPostResult.data ?? []) as OwnPostRow[];
  const ownCommentRows = (ownCommentResult.data ?? []) as OwnCommentRow[];
  const settingsRows = (settingsResult.data ?? []) as SettingsRow[];

  const complaintIds = [
    ...new Set([
      ...statusRows.map((row) => row.comp_id),
      ...duplicateRows.map((row) => row.matched_comp_id),
    ]),
  ];
  const commentPostIds = [...new Set(ownCommentRows.map((row) => row.post_id))];

  const [complaintResult, commentPostResult] = await Promise.all([
    complaintIds.length
      ? supabase.from('complaints').select('comp_id, title').in('comp_id', complaintIds)
      : Promise.resolve({ data: [], error: null }),
    commentPostIds.length
      ? supabase.from('forum_posts').select('post_id, title').in('post_id', commentPostIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (complaintResult.error) {
    console.warn('Complaint titles could not be loaded:', complaintResult.error.message);
  }
  if (commentPostResult.error) {
    console.warn('Forum titles could not be loaded:', commentPostResult.error.message);
  }

  const complaintTitles = new Map<string, string>(
    (complaintResult.data ?? []).map((row) => [row.comp_id, row.title]),
  );
  const forumTitles = new Map<string, string>(
    (commentPostResult.data ?? []).map((row) => [row.post_id, row.title]),
  );

  const activities: AdminActivity[] = [];

  accountRows.forEach((row) => {
    const approved = row.decision === 'approved';
    const name = clean(row.full_name) || 'A resident';
    activities.push({
      id: `account:${row.review_id}`,
      category: 'Account',
      action: approved ? 'account_approved' : 'account_rejected',
      entityType: 'account',
      entityId: row.acc_id ?? row.review_id,
      title: `${approved ? 'Approved' : 'Rejected'} the account of ${name}`,
      detail: joinDetails([
        row.username ? `@${row.username}` : '',
        approved
          ? 'The resident can now sign in and report issues.'
          : 'The registration was removed.',
        row.note,
      ]),
      createdAt: row.reviewed_at,
    });
  });

  statusRows.forEach((row) => {
    const title = complaintTitle(complaintTitles, row.comp_id);
    const verified = row.from_status === 'unverified';
    activities.push({
      id: `status:${row.history_id}`,
      category: 'Complaint',
      action: verified ? 'complaint_verified' : 'status_changed',
      entityType: 'complaint',
      entityId: row.comp_id,
      title: verified
        ? `Verified ${title}`
        : `Changed status for ${title}`,
      detail: joinDetails([`${row.from_status} → ${row.to_status}`, row.note]),
      createdAt: row.changed_at,
    });
  });

  duplicateRows.forEach((row) => {
    const confirmed = row.admin_status === 'confirmed';
    const title = complaintTitle(complaintTitles, row.matched_comp_id);
    activities.push({
      id: `duplicate:${row.dup_id}`,
      category: 'Duplicate',
      action: confirmed ? 'duplicate_confirmed' : 'duplicate_rejected',
      entityType: 'duplicate',
      entityId: row.dup_id,
      title: confirmed
        ? `Confirmed a duplicate of ${title}`
        : `Rejected a duplicate match for ${title}`,
      detail: joinDetails([
        formatScore(row.ai_score),
        confirmed
          ? 'The repeated complaint was removed.'
          : 'The complaint was kept and moved to pending.',
        row.admin_note,
      ]),
      createdAt: row.reviewed_at ?? new Date(0).toISOString(),
    });
  });

  moderatedRows.forEach((row) => {
    const approved = row.moderation_status === 'approved';
    const author = clean(row.account?.full_name) || 'a resident';
    activities.push({
      id: `moderation:${row.post_id}`,
      category: 'Forum',
      action: approved ? 'post_approved' : 'post_rejected',
      entityType: 'forum_post',
      entityId: row.post_id,
      title: `${approved ? 'Approved' : 'Rejected'} the post "${row.title}"`,
      detail: joinDetails([
        `Written by ${author}`,
        approved
          ? 'Published to the community forum.'
          : `Reason: ${clean(row.rejection_note) || 'No reason was recorded.'}`,
      ]),
      createdAt: row.reviewed_at ?? new Date(0).toISOString(),
    });
  });

  ownPostRows.forEach((row) => {
    activities.push({
      id: `forum-post:${row.post_id}`,
      category: 'Forum',
      action: row.is_official ? 'official_post_created' : 'post_created',
      entityType: 'forum_post',
      entityId: row.post_id,
      title: `${row.is_official ? `Published ${row.status.toLowerCase()}` : 'Created forum post'}: ${row.title}`,
      detail: row.is_official
        ? 'Shared as an official Administration post.'
        : 'Shared a post with the community.',
      createdAt: row.created_at,
    });
  });

  ownCommentRows.forEach((row) => {
    const replied = Boolean(row.parent_comment_id);
    activities.push({
      id: `forum-comment:${row.comment_id}`,
      category: 'Forum',
      action: replied ? 'reply_created' : 'comment_created',
      entityType: 'forum_post',
      entityId: row.post_id,
      title: `${replied ? 'Replied to a comment' : 'Commented'} on ${forumTitles.get(row.post_id) || 'a forum post'}`,
      detail: clean(row.content),
      createdAt: row.created_at,
    });
  });

  settingsRows.forEach((row) => {
    activities.push({
      id: `settings:${row.id}:${row.updated_at ?? ''}`,
      category: 'Settings',
      action: 'settings_updated',
      entityType: 'settings',
      entityId: String(row.id),
      title: 'Updated system settings',
      detail: joinDetails([
        `AI categorisation ${row.ai_auto_categorize ? 'on' : 'off'}`,
        `Duplicate detection ${row.duplicate_detection ? 'on' : 'off'}`,
        row.duplicate_threshold_percent === null
          ? ''
          : `Threshold ${row.duplicate_threshold_percent}%`,
        row.maintenance_mode ? 'Maintenance mode on' : '',
      ]),
      createdAt: row.updated_at ?? new Date(0).toISOString(),
    });
  });

  return activities.sort(
    (first, second) =>
      new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime(),
  );
}

export async function getAdminActivities(): Promise<AdminActivity[]> {
  const accId = await getLoggedInAdminId();
  return fetchSourceActivities(accId);
}
