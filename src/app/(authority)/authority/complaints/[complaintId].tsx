import { useLocalSearchParams } from 'expo-router';

import AuthorityComplaintDetailScreen from '@/components/authority/authority-complaint-detail-screen';

export default function AuthorityComplaintDetailsRoute() {
  const params = useLocalSearchParams<{ complaintId?: string | string[] }>();
  const complaintId = Array.isArray(params.complaintId)
    ? params.complaintId[0]
    : params.complaintId;

  return <AuthorityComplaintDetailScreen key={complaintId} />;
}
