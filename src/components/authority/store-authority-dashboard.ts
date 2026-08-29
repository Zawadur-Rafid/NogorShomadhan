export type AuthorityComplaintStatus = 'PENDING' | 'IN PROGRESS' | 'RESOLVED';

export type AuthorityComplaint = {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  category: string;
  status: AuthorityComplaintStatus;
  house?: string;
  road?: string;
  avenue?: string;
  nearby_landmark?: string;
  additional_location_details?: string;
  urgency: number;
};

// Temporary dashboard data. Replace this file with backend data when the API is connected.
export const authorityDashboardProfile = {
  name: 'Abdul Rahman',
  initials: 'AR',
  role: 'Community Authority',
  email: 'rahman@nogorshomadhan.gov',
};
