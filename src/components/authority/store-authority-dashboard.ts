export type AuthorityComplaintStatus = 'PENDING' | 'IN PROGRESS' | 'RESOLVED';

export type AuthorityComplaint = {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  category: string;
  status: AuthorityComplaintStatus;
  urgency: number;
  lat: number;
  lng: number;
};

// Temporary dashboard data. Replace this file with backend data when the API is connected.
export const authorityDashboardProfile = {
  name: 'Abdul Rahman',
  initials: 'AR',
  role: 'Community Authority',
  email: 'rahman@nogorshomadhan.gov',
};

export const authorityDashboardStats = [
  { label: 'Total Issues', value: 128, icon: 'document-text-outline', color: '#3B82F6', background: '#FFFFFF' },
  { label: 'Pending', value: 34, icon: 'time-outline', color: '#EF4444', background: '#FFF1F1' },
  { label: 'In Progress', value: 19, icon: 'construct-outline', color: '#C67B00', background: '#F8F2EA' },
  { label: 'Resolved', value: 75, icon: 'checkmark-circle-outline', color: '#2563EB', background: '#EEF6FF' },
] as const;

export const authorityComplaints: AuthorityComplaint[] = [
  {
    id: 'CMP-1048',
    title: 'Overflowing drain beside community school',
    description: 'The drain is overflowing onto the road and blocking the pedestrian path.',
    date: '18 Jul, 9:25 AM',
    location: 'Road 7, Block C',
    category: 'Drainage',
    status: 'PENDING',
    urgency: 47,
    lat: 23.8385,
    lng: 90.3685,
  },
  {
    id: 'CMP-1042',
    title: 'Streetlights not working near the east gate',
    description: 'Several streetlights are out and the entrance becomes unsafe after sunset.',
    date: '17 Jul, 8:40 PM',
    location: 'East Gate, Block A',
    category: 'Streetlight',
    status: 'IN PROGRESS',
    urgency: 35,
    lat: 23.836,
    lng: 90.3705,
  },
  {
    id: 'CMP-1039',
    title: 'Water leakage flooding the pedestrian path',
    description: 'A damaged supply pipe is continuously leaking beside the footpath.',
    date: '17 Jul, 2:10 PM',
    location: 'Road 3, Block B',
    category: 'Water Supply',
    status: 'PENDING',
    urgency: 29,
    lat: 23.8375,
    lng: 90.369,
  },
  {
    id: 'CMP-1034',
    title: 'Damaged road surface beside the market',
    description: 'The broken road surface is slowing traffic and creating a safety risk.',
    date: '16 Jul, 11:15 AM',
    location: 'Market Road, Block D',
    category: 'Road',
    status: 'IN PROGRESS',
    urgency: 21,
    lat: 23.8392,
    lng: 90.3712,
  },
  {
    id: 'CMP-1027',
    title: 'Garbage collection missed for three days',
    description: 'The missed collection was completed and the roadside waste was removed.',
    date: '15 Jul, 7:30 AM',
    location: 'Lane 2, Block E',
    category: 'Waste',
    status: 'RESOLVED',
    urgency: 16,
    lat: 23.8357,
    lng: 90.3672,
  },
];
