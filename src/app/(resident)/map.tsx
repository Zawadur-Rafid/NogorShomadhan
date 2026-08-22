import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import MapViewComponent, { ComplaintLocation } from '../../components/MapView';
import TopNav from '../../components/TopNav';
import BottomNav from '../../components/BottomNav';
import { getMapComplaints } from '../../services/resident.service';

export default function ResidentMap() {
  const router = useRouter();
  const [filter, setFilter] = useState('All');
  const [complaints, setComplaints] = useState<ComplaintLocation[]>([]);

  useEffect(() => {
    async function loadComplaints() {
      try {
        const data = await getMapComplaints();
        setComplaints(data);
      } catch (error) {
        if (error instanceof Error) {
          Alert.alert('Error', error.message);
        }
      }
    }
    loadComplaints();
  }, []);

  const filteredComplaints = useMemo(() => {
    if (filter === 'All') return complaints;
    return complaints.filter(c => c.status === filter.toUpperCase());
  }, [filter, complaints]);

  const filters = ['All', 'Pending', 'In Progress', 'Resolved'];

  return (
    <SafeAreaView style={styles.container}>
      <TopNav />
      
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {filters.map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, filter === f && styles.filterChipActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.mapContainer}>
        <MapViewComponent 
          locations={filteredComplaints}
          onLocationPress={(loc) => router.push(`/(resident)/complaints/${loc.id}`)}
        />
      </View>

      {/* Bottom Navigation */}
      <BottomNav activeRoute="map" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ECECEC',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  filterContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ECECEC',
  },
  filterScroll: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#23435D',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    fontFamily: 'Inter',
  },
  filterTextActive: {
    color: '#fff',
  },
  mapContainer: {
    flex: 1,
  },
  bottomNav: {
    height: 60,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#ECECEC',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 4,
  },
  navItem: {
    alignItems: 'center',
  },
  activeNav: {
    marginTop: 2,
    color: '#23435D',
    fontWeight: '700',
    fontSize: 10,
  },
  navText: {
    marginTop: 2,
    color: '#8A8A8A',
    fontSize: 10,
  },
});
