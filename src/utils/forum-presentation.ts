import type { DbAccount, ForumStatus } from '@/services/forum.service';

export type ForumCategory =
  | 'All'
  | 'Announcement'
  | 'Service Update'
  | 'Alert'
  | 'Resident Discussion';

export const forumCategories: ForumCategory[] = [
  'All',
  'Announcement',
  'Service Update',
  'Alert',
  'Resident Discussion',
];

export const officialPostOptions: {
  status: ForumStatus;
  label: Exclude<ForumCategory, 'All' | 'Resident Discussion'>;
  description: string;
}[] = [
  {
    status: 'Announcement',
    label: 'Announcement',
    description: 'Planned notices, schedules, and community events',
  },
  {
    status: 'Update',
    label: 'Service Update',
    description: 'Progress or changes to community services',
  },
  {
    status: 'Alert',
    label: 'Alert',
    description: 'Urgent, time-sensitive information',
  },
];

export const forumCategoryTheme: Record<
  Exclude<ForumCategory, 'All'>,
  { background: string; color: string }
> = {
  Announcement: { background: '#EAF3FF', color: '#1D4ED8' },
  'Service Update': { background: '#EAF8EF', color: '#027A48' },
  Alert: { background: '#FFF1F0', color: '#B42318' },
  'Resident Discussion': { background: '#F4F0FF', color: '#6941C6' },
};

export function getForumCategory(post: {
  status: ForumStatus;
  official?: boolean;
}): Exclude<ForumCategory, 'All'> {
  if (!post.official) return 'Resident Discussion';
  return post.status === 'Update' ? 'Service Update' : post.status;
}

export function getForumSourceLabel(
  account: Pick<DbAccount, 'full_name' | 'role'> | null | undefined,
  isOfficial: boolean,
): string {
  if (!isOfficial) return account?.full_name || 'Resident';

  const role = account?.role?.toLowerCase();
  if (role === 'admin') return 'Administration';
  if (role === 'authority') return 'Community Authority';
  return 'Official Source';
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return parts[0].slice(0, 2).toUpperCase();
}
