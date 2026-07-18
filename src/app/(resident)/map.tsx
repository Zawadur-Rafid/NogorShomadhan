import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import MapViewComponent from '../../components/MapView';
import TopNav from '../../components/TopNav';
import { dummyComplaints } from '../../components/store/store_complaint';

export default function ResidentMap() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <TopNav />
      
      <View style={styles.mapContainer}>
        <MapViewComponent locations={dummyComplaints} />
      </View>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/(resident)/dashboard')}>
          <Ionicons name="home-outline" size={20} color="#888" />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="map" size={20} color="#23435D" />
          <Text style={styles.activeNav}>Map</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="document-text-outline" size={20} color="#888" />
          <Text style={styles.navText}>Complaints</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="bar-chart-outline" size={20} color="#888" />
          <Text style={styles.navText}>Data</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/(resident)/profile')}>
          <Ionicons name="person-outline" size={20} color="#888" />
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
      </View>
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
