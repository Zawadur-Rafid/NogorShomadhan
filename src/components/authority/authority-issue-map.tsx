import Ionicons from '@expo/vector-icons/Ionicons';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import type { AuthorityIssueMapProps } from './authority-map.types';

export default function AuthorityIssueMap({
  complaints,
  selectedComplaintId,
  height = 330,
}: AuthorityIssueMapProps) {
  const selectedComplaint =
    complaints.find((complaint) => complaint.id === selectedComplaintId) ??
    complaints[0];

  const openExternalMap = async () => {
    if (!selectedComplaint) return;

    const query = encodeURIComponent(selectedComplaint.location);
    await Linking.openURL(
      `https://www.google.com/maps/search/?api=1&query=${query}`,
    );
  };

  return (
    <View style={[styles.container, { height }]}>
      <View style={styles.icon}>
        <Ionicons name="map-outline" size={30} color="#23435D" />
      </View>
      <Text style={styles.title}>Authority complaint map</Text>
      <Text selectable style={styles.description}>
        The interactive multi-marker map is available in the iOS and Android app.
      </Text>
      {selectedComplaint && (
        <>
          <Text selectable style={styles.address}>
            {selectedComplaint.location}
          </Text>
          <Pressable onPress={openExternalMap} style={styles.button}>
            <Ionicons name="open-outline" size={15} color="#FFFFFF" />
            <Text style={styles.buttonText}>Open this address in Maps</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    padding: 24,
    borderRadius: 14,
    backgroundColor: '#EEF2F5',
  },
  icon: {
    width: 58,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 29,
    backgroundColor: '#FFFFFF',
  },
  title: { color: '#253244', fontSize: 14, fontWeight: '800' },
  description: {
    maxWidth: 360,
    color: '#6B7280',
    fontSize: 10,
    lineHeight: 16,
    textAlign: 'center',
  },
  address: {
    maxWidth: 420,
    color: '#344054',
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 18,
    backgroundColor: '#23435D',
  },
  buttonText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800' },
});
