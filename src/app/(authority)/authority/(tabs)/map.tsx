import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AuthorityMap from '@/components/authority/authority-map';
import { useAuthorityComplaints } from '@/components/authority/authority-complaints-context';
import AuthorityPageHeader from '@/components/authority/authority-page-header';

const statusLegend = [
  { label: 'Pending', color: '#EF4444' },
  { label: 'In Progress', color: '#C67B00' },
  { label: 'Resolved', color: '#2563EB' },
] as const;

export default function AuthorityMapScreen() {
  const router = useRouter();
  const { complaints } = useAuthorityComplaints();

  const openComplaint = (complaint: { id: string }) => {
    router.push({
      pathname: '/authority/complaints/[complaintId]',
      params: { complaintId: complaint.id },
    } as never);
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <AuthorityPageHeader
        title="Home"
        icon="home-outline"
        onBack={() => router.navigate('/authority/dashboard' as never)}
      />

      <View style={styles.mapContainer}>
        <AuthorityMap
          locations={complaints}
          onLocationPress={openComplaint}
        />

        <View style={styles.legend} pointerEvents="none">
          <Text style={styles.legendTitle}>Status</Text>
          {statusLegend.map((item) => (
            <View key={item.label} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: item.color }]} />
              <Text style={styles.legendText}>{item.label}</Text>
            </View>
          ))}
        </View>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#E8EDF4',
  },
  legend: {
    position: 'absolute',
    top: 14,
    right: 14,
    gap: 8,
    minWidth: 122,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    boxShadow: '0 3px 12px rgba(35, 67, 93, 0.16)',
    zIndex: 10,
  },
  legendTitle: {
    color: '#1F2937',
    fontSize: 11,
    fontWeight: '800',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  legendDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  legendText: {
    color: '#4B5563',
    fontSize: 10,
    fontWeight: '600',
  },
});
