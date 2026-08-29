export interface DummyComplaint {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  status: 'PENDING' | 'IN PROGRESS' | 'RESOLVED';
  category: string;
  evidence: string; // Description of evidence
  image: string; // Primary evidence picture
  images: string[]; // Multiple evidence pictures
  isMyComplaint?: boolean;
  color: string;
  icon: string;
  lat: number;
  lng: number;
  contractorAssignments?: any[];
  updates?: any[];
  completedAt?: string;
  deadline?: string;
  budget?: string;
  resolutionNote?: string;
  finalEvidence?: string;
  approvedBy?: any;
  feedback?: any[];
}

export const dummyComplaints: DummyComplaint[] = [];
