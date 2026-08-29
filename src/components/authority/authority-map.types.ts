import type { AuthorityComplaint } from './store-authority-dashboard';

export type AuthorityIssueMapProps = {
  complaints: AuthorityComplaint[];
  selectedComplaintId?: string;
  onComplaintPress?: (complaintId: string) => void;
  height?: number;
};
