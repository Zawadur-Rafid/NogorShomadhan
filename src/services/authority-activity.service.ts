import AsyncStorage from '@react-native-async-storage/async-storage';

import { supabase } from '@/lib/supabase';

export type AuthorityActivityCategory =
  | 'Complaint'
  | 'Forum'
  | 'Feedback';

export type AuthorityActivityEntity =
  | 'complaint'
  | 'forum_post'
  | 'feedback';

export type AuthorityActivity = {
  id: string;
  category: AuthorityActivityCategory;
  action: string;
  entityType: AuthorityActivityEntity;
  entityId: string;
  title: string;
  detail: string;
  createdAt: string;
};

type StatusHistoryRow = {
  history_id: string;
  comp_id: string;
  from_status: string;
  to_status: string;
  note: string | null;
  changed_at: string;
};

type WorkUpdateRow = {
  update_id: string;
  comp_id: string;
  update_type: string;
  note: string | null;
  budget: number | string | null;
  deadline: string | null;
  progress_percent: number | null;
  created_at: string;
};

type ContractorRow = {
  contractor_event_id: string;
  comp_id: string;
  contractor_name: string;
  contractor_phone: string;
  change_reason: string | null;
  changed_at: string;
};

type ResolutionRow = {
  comp_id: string;
  resolution_note: string | null;
  resolved_at: string;
};

type ForumPostRow = {
  post_id: string;
  title: string;
  status: string;
  is_official: boolean;
  created_at: string;
};

type ForumCommentRow = {
  comment_id: string;
  post_id: string;
  parent_comment_id: string | null;
  content: string;
  created_at: string;
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

function formatBudget(value: number | string | null): string {
  if (value === null || value === '') return '';
  const amount = Number(value);
  return Number.isFinite(amount)
    ? `Budget ৳${amount.toLocaleString('en-BD')}`
    : '';
}

function formatDeadline(value: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ''
    : `Deadline ${date.toLocaleDateString('en-BD')}`;
}

async function getLoggedInAuthorityId(): Promise<string> {
  const accId = await AsyncStorage.getItem('acc_id');
  if (!accId) {
    throw new Error('No logged-in authority account was found.');
  }
  return accId;
}

async function fetchSourceActivities(
  accId: string,
): Promise<AuthorityActivity[]> {
  const [
    statusResult,
    workResult,
    contractorResult,
    resolutionResult,
    forumPostResult,
    forumCommentResult,
  ] = await Promise.all([
    supabase
      .from('complaint_status_history')
      .select('history_id, comp_id, from_status, to_status, note, changed_at')
      .eq('changed_by_acc_id', accId)
      .order('changed_at', { ascending: false })
      .limit(SOURCE_LIMIT),
    supabase
      .from('complaint_work_updates')
      .select('update_id, comp_id, update_type, note, budget, deadline, progress_percent, created_at')
      .eq('updated_by_acc_id', accId)
      .order('created_at', { ascending: false })
      .limit(SOURCE_LIMIT),
    supabase
      .from('contractor_history')
      .select('contractor_event_id, comp_id, contractor_name, contractor_phone, change_reason, changed_at')
      .eq('changed_by_acc_id', accId)
      .order('changed_at', { ascending: false })
      .limit(SOURCE_LIMIT),
    supabase
      .from('complaint_resolution')
      .select('comp_id, resolution_note, resolved_at')
      .eq('resolved_by_acc_id', accId)
      .order('resolved_at', { ascending: false })
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
  ]);

  const results = [
    statusResult,
    workResult,
    contractorResult,
    resolutionResult,
    forumPostResult,
    forumCommentResult,
  ];
  const failures = results.filter((result) => result.error);

  if (failures.length === results.length) {
    throw new Error(
      `Failed to load authority activity: ${failures[0]?.error?.message ?? 'No activity source was available.'}`,
    );
  }

  failures.forEach((result) => {
    console.warn('An activity source could not be loaded:', result.error?.message);
  });

  const statusRows = (statusResult.data ?? []) as StatusHistoryRow[];
  const workRows = (workResult.data ?? []) as WorkUpdateRow[];
  const contractorRows = (contractorResult.data ?? []) as ContractorRow[];
  const resolutionRows = (resolutionResult.data ?? []) as ResolutionRow[];
  const forumPostRows = (forumPostResult.data ?? []) as ForumPostRow[];
  const forumCommentRows = (forumCommentResult.data ?? []) as ForumCommentRow[];

  const complaintIds = [
    ...new Set([
      ...statusRows.map((row) => row.comp_id),
      ...workRows.map((row) => row.comp_id),
      ...contractorRows.map((row) => row.comp_id),
      ...resolutionRows.map((row) => row.comp_id),
    ]),
  ];
  const commentPostIds = [...new Set(forumCommentRows.map((row) => row.post_id))];

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
  const startedComplaintIds = new Set(
    workRows.filter((row) => row.update_type === 'start').map((row) => row.comp_id),
  );
  const resolvedComplaintIds = new Set(resolutionRows.map((row) => row.comp_id));

  const activities: AuthorityActivity[] = [];

  statusRows.forEach((row) => {
    if (row.to_status === 'in progress' && startedComplaintIds.has(row.comp_id)) return;
    if (row.to_status === 'resolved' && resolvedComplaintIds.has(row.comp_id)) return;

    activities.push({
      id: `status:${row.history_id}`,
      category: 'Complaint',
      action: 'status_changed',
      entityType: 'complaint',
      entityId: row.comp_id,
      title: `Changed status for ${complaintTitle(complaintTitles, row.comp_id)}`,
      detail: joinDetails([
        `${row.from_status} → ${row.to_status}`,
        row.note,
      ]),
      createdAt: row.changed_at,
    });
  });

  workRows.forEach((row) => {
    if (row.update_type === 'contractor_change') return;
    if (row.update_type === 'completion' && resolvedComplaintIds.has(row.comp_id)) return;

    const title = complaintTitle(complaintTitles, row.comp_id);
    const titleByType: Record<string, string> = {
      start: `Approved and started work on ${title}`,
      progress_update: `Added a work update to ${title}`,
      budget_deadline_change: `Updated the work plan for ${title}`,
      completion: `Completed ${title}`,
    };

    activities.push({
      id: `work:${row.update_id}`,
      category: 'Complaint',
      action: row.update_type,
      entityType: 'complaint',
      entityId: row.comp_id,
      title: titleByType[row.update_type] || `Updated ${title}`,
      detail: joinDetails([
        row.note,
        formatBudget(row.budget),
        formatDeadline(row.deadline),
        row.progress_percent === null ? '' : `Progress ${row.progress_percent}%`,
      ]),
      createdAt: row.created_at,
    });
  });

  contractorRows.forEach((row) => {
    const changed = Boolean(clean(row.change_reason));
    activities.push({
      id: `contractor:${row.contractor_event_id}`,
      category: 'Complaint',
      action: changed ? 'contractor_changed' : 'contractor_assigned',
      entityType: 'complaint',
      entityId: row.comp_id,
      title: `${changed ? 'Changed' : 'Assigned'} contractor for ${complaintTitle(complaintTitles, row.comp_id)}`,
      detail: joinDetails([
        `${row.contractor_name} (${row.contractor_phone})`,
        changed ? `Reason: ${row.change_reason}` : '',
      ]),
      createdAt: row.changed_at,
    });
  });

  resolutionRows.forEach((row) => {
    activities.push({
      id: `resolution:${row.comp_id}`,
      category: 'Complaint',
      action: 'resolved',
      entityType: 'complaint',
      entityId: row.comp_id,
      title: `Resolved ${complaintTitle(complaintTitles, row.comp_id)}`,
      detail: clean(row.resolution_note) || 'Recorded final completion evidence.',
      createdAt: row.resolved_at,
    });
  });

  forumPostRows.forEach((row) => {
    const officialLabel = row.is_official
      ? `Published ${row.status.toLowerCase()}`
      : 'Created forum post';
    activities.push({
      id: `forum-post:${row.post_id}`,
      category: 'Forum',
      action: row.is_official ? 'official_post_created' : 'post_created',
      entityType: 'forum_post',
      entityId: row.post_id,
      title: `${officialLabel}: ${row.title}`,
      detail: row.is_official
        ? 'Shared as an official Community Authority post.'
        : 'Shared a post with the community.',
      createdAt: row.created_at,
    });
  });

  forumCommentRows.forEach((row) => {
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

  return activities.sort(
    (first, second) =>
      new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime(),
  );
}

export async function getAuthorityActivities(): Promise<AuthorityActivity[]> {
  const accId = await getLoggedInAuthorityId();
  return fetchSourceActivities(accId);
}
