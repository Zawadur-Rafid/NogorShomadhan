export type AuthorityComplaintStatus = 'PENDING' | 'IN PROGRESS' | 'RESOLVED';

export type AuthorityComplaint = {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  category: string;
  status: AuthorityComplaintStatus;
  timestamp: string | null;
  house?: string;
  road?: string;
  avenue?: string;
  nearby_landmark?: string;
  additional_location_details?: string;
  duplicateReportCount: number;
};
