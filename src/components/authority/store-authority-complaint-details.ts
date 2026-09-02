import type { AuthorityComplaint } from './store-authority-dashboard';

export type AuthorityEvidenceImage = number | { uri: string };

export type AuthorityMergedReporter = {
  id: string;
  name: string;
  initials: string;
  submittedAt: string;
};

export type AuthorityApproval = {
  name: string;
  initials: string;
  role: string;
  approvedAt: string;
};

export type AuthorityContractorAssignment = {
  id: string;
  name: string;
  phone: string;
  assignedFrom: string;
  assignedUntil?: string;
  changeReason?: string;
};

export type AuthorityWorkUpdate = {
  id: string;
  title: string;
  note: string;
  timestamp: string;
  complete: boolean;
  budget: string;
  images: AuthorityEvidenceImage[];
  contractorAssignmentId?: string;
};

export type AuthorityResidentFeedback = {
  id: string;
  resident: string;
  residentInitials: string;
  rating: number;
  comment: string;
  receivedAt: string;
};

export type AuthorityComplaintDetail = AuthorityComplaint & {
  reporter: string;
  reporterInitials: string;
  reporterPhone: string;
  otherReporters: AuthorityMergedReporter[];
  approvedBy?: AuthorityApproval;
  submittedAt: string;
  startedAt?: string | null;
  resolvedAt?: string | null;

  evidence?: AuthorityEvidenceImage;

  // Deadline is stored in the UI model as YYYY-MM-DD.
  deadline: string;
  budget: string;
  workNote: string;
  progress: number;
  completedAt?: string;
  resolutionNote?: string;
  finalEvidence?: AuthorityEvidenceImage;
  contractorAssignments: AuthorityContractorAssignment[];
  updates: AuthorityWorkUpdate[];
  feedback: AuthorityResidentFeedback[];
};
