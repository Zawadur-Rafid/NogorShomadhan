import type { AuthorityComplaintStatus } from './store-authority-dashboard';

export type AuthorityNotification = {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'complaint' | 'urgency' | 'feedback' | 'system';
  read: boolean;
  complaintId?: string;
  complaintStatus?: AuthorityComplaintStatus;
};

export const authorityNotifications: AuthorityNotification[] = [
  {
    id: 'NTF-501',
    title: 'New complaint assigned',
    message: 'CMP-1048: Overflowing drain beside community school needs review.',
    time: '10 minutes ago',
    type: 'complaint',
    read: false,
    complaintId: 'CMP-1048',
    complaintStatus: 'PENDING',
  },
  {
    id: 'NTF-500',
    title: 'Urgency threshold reached',
    message: 'CMP-1048 now has 47 resident urgency signals.',
    time: '35 minutes ago',
    type: 'urgency',
    read: false,
    complaintId: 'CMP-1048',
    complaintStatus: 'PENDING',
  },
  {
    id: 'NTF-498',
    title: 'Resident added feedback',
    message: 'A new 5-star rating was added for resolved complaint CMP-1027.',
    time: '2 hours ago',
    type: 'feedback',
    read: false,
    complaintId: 'CMP-1027',
    complaintStatus: 'RESOLVED',
  },
  {
    id: 'NTF-494',
    title: 'Work-plan deadline approaching',
    message: 'CMP-1042 is due within the next 24 hours.',
    time: 'Yesterday, 6:20 PM',
    type: 'system',
    read: true,
    complaintId: 'CMP-1042',
    complaintStatus: 'IN PROGRESS',
  },
  {
    id: 'NTF-489',
    title: 'Complaint resolved',
    message: 'CMP-1027 was marked as resolved and residents were notified.',
    time: '19 Jul, 5:30 PM',
    type: 'complaint',
    read: true,
    complaintId: 'CMP-1027',
    complaintStatus: 'RESOLVED',
  },
];

export const authorityProfileDetails = {
  name: 'Abdul Rahman',
  email: 'rahman@nogorshomadhan.gov',
  phone: '+880 1712-345678',
  employeeId: 'AUTH-0074',
  role: 'Community Authority',
  assignedZone: 'Blocks A–E, Ward 12',
  office: 'Ward 12 Community Service Office',
} as const;

export type AuthorityActivityType = 'Complaint' | 'Report' | 'Account';

export const authorityActivityLog = [
  {
    id: 'ACT-701',
    type: 'Complaint' as AuthorityActivityType,
    title: 'Started work on CMP-1042',
    detail: 'Added a work plan, budget, and deadline for the streetlight repair.',
    time: 'Today, 9:40 AM',
    icon: 'construct-outline' as const,
    color: '#C67B00',
    background: '#FFF7E8',
  },
  {
    id: 'ACT-699',
    type: 'Complaint' as AuthorityActivityType,
    title: 'Reviewed CMP-1048',
    detail: 'Opened the assigned drainage complaint and verified resident evidence.',
    time: 'Today, 8:55 AM',
    icon: 'document-text-outline' as const,
    color: '#3B82F6',
    background: '#EEF6FF',
  },
  {
    id: 'ACT-694',
    type: 'Report' as AuthorityActivityType,
    title: 'Generated authority analytics report',
    detail: 'Created the 30-day performance and complaint distribution report.',
    time: 'Yesterday, 4:15 PM',
    icon: 'bar-chart-outline' as const,
    color: '#7C6BC4',
    background: '#F2EFFE',
  },
  {
    id: 'ACT-688',
    type: 'Complaint' as AuthorityActivityType,
    title: 'Resolved CMP-1027',
    detail: 'Closed the missed garbage collection complaint after final inspection.',
    time: '19 Jul, 5:30 PM',
    icon: 'checkmark-done-outline' as const,
    color: '#16845B',
    background: '#EAF8F1',
  },
  {
    id: 'ACT-681',
    type: 'Account' as AuthorityActivityType,
    title: 'Signed in to authority portal',
    detail: 'Successful account access from the registered device.',
    time: '19 Jul, 8:02 AM',
    icon: 'log-in-outline' as const,
    color: '#23435D',
    background: '#E8EEF2',
  },
] as const;
