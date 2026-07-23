import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AuthorityPageHeader from '@/components/authority/authority-page-header';
import {
  authorityActivityLog,
  type AuthorityActivityType,
} from '@/components/authority/store-authority-account';

type ActivityFilter = 'All' | AuthorityActivityType;

const filters: ActivityFilter[] = ['All', 'Complaint', 'Report', 'Account'];

export default function AuthorityActivityLog() {
  const [filter, setFilter] = useState<ActivityFilter>('All');
  const [search, setSearch] = useState('');

  const visibleActivities = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return authorityActivityLog.filter((item) => {
      const matchesFilter = filter === 'All' || item.type === filter;
      const matchesSearch =
        !keyword ||
        item.title.toLowerCase().includes(keyword) ||
        item.detail.toLowerCase().includes(keyword);
      return matchesFilter && matchesSearch;
    });
  }, [filter, search]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <AuthorityPageHeader />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.container}>
          <View style={styles.hero}>
            <View>
              <Text style={styles.eyebrow}>ACCOUNT HISTORY</Text>
              <Text style={styles.title}>Activity Log</Text>
              <Text style={styles.subtitle}>Review complaint actions, generated reports, and account access.</Text>
            </View>
            <View style={styles.activityCount}>
              <Text style={styles.activityCountValue}>{authorityActivityLog.length}</Text>
              <Text style={styles.activityCountLabel}>recent actions</Text>
            </View>
          </View>

          <View style={styles.controls}>
            <View style={styles.searchBox}>
              <Ionicons name="search-outline" size={18} color="#7A8493" />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search activity"
                placeholderTextColor="#9AA2AE"
                style={styles.searchInput}
              />
              {!!search && (
                <Pressable onPress={() => setSearch('')}>
                  <Ionicons name="close-circle" size={18} color="#9AA2AE" />
                </Pressable>
              )}
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
              {filters.map((item) => (
                <Pressable
                  key={item}
                  onPress={() => setFilter(item)}
                  style={[styles.filterButton, filter === item && styles.filterButtonActive]}
                >
                  <Text style={[styles.filterText, filter === item && styles.filterTextActive]}>{item}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          <View style={styles.timeline}>
            {visibleActivities.map((activity, index) => (
              <View key={activity.id} style={styles.timelineRow}>
                <View style={styles.timelineTrack}>
                  <View style={[styles.timelineIcon, { backgroundColor: activity.background }]}>
                    <Ionicons name={activity.icon} size={18} color={activity.color} />
                  </View>
                  {index < visibleActivities.length - 1 && <View style={styles.timelineLine} />}
                </View>
                <View style={styles.activityCard}>
                  <View style={styles.activityHeading}>
                    <View style={styles.typeBadge}>
                      <Text style={styles.typeText}>{activity.type.toUpperCase()}</Text>
                    </View>
                    <Text style={styles.activityTime}>{activity.time}</Text>
                  </View>
                  <Text style={styles.activityTitle}>{activity.title}</Text>
                  <Text style={styles.activityDetail}>{activity.detail}</Text>
                  <Text style={styles.activityId}>{activity.id}</Text>
                </View>
              </View>
            ))}
          </View>

          {visibleActivities.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="time-outline" size={33} color="#98A2B3" />
              <Text style={styles.emptyTitle}>No activity found</Text>
              <Text style={styles.emptyText}>Try another activity type or search phrase.</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F7F8FA' },
  scrollContent: { paddingBottom: 34 },
  container: { width: '100%', maxWidth: 900, alignSelf: 'center', padding: 16, gap: 16 },
  hero: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14, padding: 17, borderRadius: 15, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EAEDF1' },
  eyebrow: { color: '#B9854B', fontSize: 9, fontWeight: '900', letterSpacing: 0.7 },
  title: { color: '#111827', fontSize: 24, fontWeight: '800', marginTop: 2 },
  subtitle: { color: '#6B7280', fontSize: 10, lineHeight: 15, marginTop: 4 },
  activityCount: { alignItems: 'center', minWidth: 76, padding: 10, borderRadius: 12, backgroundColor: '#E8EEF2' },
  activityCountValue: { color: '#23435D', fontSize: 19, fontWeight: '900' },
  activityCountLabel: { color: '#607080', fontSize: 7, fontWeight: '700' },
  controls: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10 },
  searchBox: { flex: 1, minWidth: 245, minHeight: 42, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, borderRadius: 12, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E6EB' },
  searchInput: { flex: 1, color: '#344054', fontSize: 10 },
  filters: { gap: 7 },
  filterButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 17, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E6EB' },
  filterButtonActive: { backgroundColor: '#23435D', borderColor: '#23435D' },
  filterText: { color: '#667085', fontSize: 9, fontWeight: '700' },
  filterTextActive: { color: '#FFFFFF' },
  timeline: { gap: 0 },
  timelineRow: { flexDirection: 'row', gap: 11 },
  timelineTrack: { width: 42, alignItems: 'center' },
  timelineIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  timelineLine: { width: 2, flex: 1, minHeight: 60, backgroundColor: '#DEE3E8' },
  activityCard: { flex: 1, minWidth: 0, padding: 14, borderRadius: 13, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EAEDF1', marginBottom: 11 },
  activityHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 9 },
  typeBadge: { paddingHorizontal: 7, paddingVertical: 4, borderRadius: 9, backgroundColor: '#F0F3F6' },
  typeText: { color: '#667085', fontSize: 7, fontWeight: '900', letterSpacing: 0.3 },
  activityTime: { color: '#9AA2AE', fontSize: 8 },
  activityTitle: { color: '#263142', fontSize: 12, fontWeight: '800', marginTop: 8 },
  activityDetail: { color: '#687386', fontSize: 10, lineHeight: 15, marginTop: 4 },
  activityId: { color: '#3B82F6', fontSize: 8, fontWeight: '800', marginTop: 8 },
  emptyState: { alignItems: 'center', padding: 35, borderRadius: 14, backgroundColor: '#FFFFFF' },
  emptyTitle: { color: '#344054', fontSize: 14, fontWeight: '800', marginTop: 9 },
  emptyText: { color: '#8A93A1', fontSize: 10, marginTop: 4 },
});
