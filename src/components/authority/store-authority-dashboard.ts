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
