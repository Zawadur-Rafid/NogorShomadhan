import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AuthorityFilterChip from '@/components/authority/authority-filter-chip';
import { useAuthorityComplaints } from '@/components/authority/authority-complaints-context';
import AuthorityPageHeader from '@/components/authority/authority-page-header';
import {
  type AuthorityComplaint,
  type AuthorityComplaintStatus,
} from '@/components/authority/store-authority-dashboard';

type ComplaintFilter = 'ALL' | AuthorityComplaintStatus;
type ComplaintSearchParams = {
  status?: string | string[];
  category?: string | string[];
  area?: string | string[];
  query?: string | string[];
};

const filters: { label: string; value: ComplaintFilter }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'In Progress', value: 'IN PROGRESS' },
  { label: 'Resolved', value: 'RESOLVED' },
];

const statusOrder: AuthorityComplaintStatus[] = ['PENDING', 'IN PROGRESS', 'RESOLVED'];

const getComplaintArea = (location: string) => {
  const block = location.match(/Block\s+[A-Z0-9-]+/i)?.[0];
  return block ?? location.split(',').at(-1)?.trim() ?? location;
};

const getFirstParam = (value?: string | string[]) =>
  Array.isArray(value) ? value[0] ?? '' : value ?? '';

const matchesComplaintSearch = (
  complaint: AuthorityComplaint,
  keyword: string,
) =>
  !keyword ||
  complaint.title.toLowerCase().includes(keyword) ||
  complaint.location.toLowerCase().includes(keyword) ||
  complaint.category.toLowerCase().includes(keyword) ||
  complaint.id.toLowerCase().includes(keyword);

const statusTheme: Record<AuthorityComplaintStatus, { color: string; background: string; icon: keyof typeof Ionicons.glyphMap }> = {
  PENDING: { color: '#EF4444', background: '#FEF2F2', icon: 'time-outline' },
  'IN PROGRESS': { color: '#C67B00', background: '#FFF7E8', icon: 'construct-outline' },
  RESOLVED: { color: '#2563EB', background: '#EFF6FF', icon: 'checkmark-circle-outline' },
};

export default function AuthorityAllComplaints() {
  const router = useRouter();
  const { complaints } = useAuthorityComplaints();
  const params = useLocalSearchParams<ComplaintSearchParams>();
  const statusParam = getFirstParam(params.status);
  const categoryParam = getFirstParam(params.category);
  const areaParam = getFirstParam(params.area);
  const search = getFirstParam(params.query);
  const categoryFilters = useMemo(
    () => ['ALL', ...new Set(complaints.map((item) => item.category))],
    [complaints],
  );
  const areaFilters = useMemo(
    () => [
      'ALL',
      ...new Set(complaints.map((item) => getComplaintArea(item.location))),
    ],
    [complaints],
  );
  const filter = filters.some((item) => item.value === statusParam)
    ? statusParam as ComplaintFilter
    : 'ALL';
  const category = categoryFilters.includes(categoryParam) ? categoryParam : 'ALL';
  const area = areaFilters.includes(areaParam) ? areaParam : 'ALL';
  const updateFilters = (updates: Record<string, string>) => {
    router.setParams(updates as never);
  };

  const filteredComplaints = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return complaints
      .filter((complaint) => filter === 'ALL' || complaint.status === filter)
      .filter((complaint) => category === 'ALL' || complaint.category === category)
      .filter((complaint) => area === 'ALL' || getComplaintArea(complaint.location) === area)
      .filter((complaint) => matchesComplaintSearch(complaint, keyword))
      .sort((first, second) => second.urgency - first.urgency);
  }, [area, category, complaints, filter, search]);

  const facetCounts = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    const matchesSearch = (complaint: AuthorityComplaint) =>
      matchesComplaintSearch(complaint, keyword);

    const statusCounts = Object.fromEntries(
      filters.map((item) => [
        item.value,
        complaints.filter(
          (complaint) =>
            (item.value === 'ALL' || complaint.status === item.value) &&
            (category === 'ALL' || complaint.category === category) &&
            (area === 'ALL' || getComplaintArea(complaint.location) === area) &&
            matchesSearch(complaint),
        ).length,
      ]),
    ) as Record<ComplaintFilter, number>;

    const categoryCounts = Object.fromEntries(
      categoryFilters.map((item) => [
        item,
        complaints.filter(
          (complaint) =>
            (filter === 'ALL' || complaint.status === filter) &&
            (item === 'ALL' || complaint.category === item) &&
            (area === 'ALL' || getComplaintArea(complaint.location) === area) &&
            matchesSearch(complaint),
        ).length,
      ]),
    ) as Record<string, number>;

    const areaCounts = Object.fromEntries(
      areaFilters.map((item) => [
        item,
        complaints.filter(
          (complaint) =>
            (filter === 'ALL' || complaint.status === filter) &&
            (category === 'ALL' || complaint.category === category) &&
            (item === 'ALL' || getComplaintArea(complaint.location) === item) &&
            matchesSearch(complaint),
        ).length,
      ]),
    ) as Record<string, number>;

    return { statusCounts, categoryCounts, areaCounts };
  }, [
    area,
    areaFilters,
    category,
    categoryFilters,
    complaints,
    filter,
    search,
  ]);

  const openComplaint = (complaint: AuthorityComplaint) => {
    router.push({
      pathname: '/authority/complaints/[complaintId]',
      params: { complaintId: complaint.id },
    } as never);
  };

  const sections = statusOrder
    .map((status) => ({ status, complaints: filteredComplaints.filter((item) => item.status === status) }))
    .filter((section) => section.complaints.length > 0);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <AuthorityPageHeader
        title="Home"
        icon="home-outline"
        onBack={() => router.navigate('/authority/dashboard' as never)}
      />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.container}>
          <View style={styles.hero}>
            <Text style={styles.eyebrow}>ASSIGNED COMPLAINTS</Text>
            <Text style={styles.title}>All Complaints</Text>
            <Text style={styles.subtitle}>Complaints are grouped by status and prioritized by urgency within each group.</Text>
          </View>

          <View style={styles.controls}>
            <View style={styles.searchBox}>
              <Ionicons name="search-outline" size={18} color="#7A8493" />
              <TextInput
                value={search}
                onChangeText={(value) => updateFilters({ query: value })}
                placeholder="Search title, category, location or ID"
                placeholderTextColor="#9AA2AE"
                style={styles.searchInput}
              />
              {!!search && (
                <Pressable onPress={() => updateFilters({ query: '' })}>
                  <Ionicons name="close-circle" size={18} color="#9AA2AE" />
                </Pressable>
              )}
            </View>

            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Status</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
                {filters.map((item) => {
                  const active = filter === item.value;
                  const count = facetCounts.statusCounts[item.value];
                  return (
                    <AuthorityFilterChip
                      key={item.value}
                      label={item.label}
                      count={count}
                      active={active}
                      disabled={!active && item.value !== 'ALL' && count === 0}
                      onPress={() => updateFilters({ status: item.value === 'ALL' ? '' : item.value })}
                    />
                  );
                })}
              </ScrollView>
            </View>

            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
                {categoryFilters.map((item) => {
                  const active = category === item;
                  const count = facetCounts.categoryCounts[item];
                  return (
                    <AuthorityFilterChip
                      key={item}
                      label={item === 'ALL' ? 'All Categories' : item}
                      count={count}
                      active={active}
                      disabled={!active && item !== 'ALL' && count === 0}
                      onPress={() => updateFilters({ category: item === 'ALL' ? '' : item })}
                    />
                  );
                })}
              </ScrollView>
            </View>

            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Area</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
                {areaFilters.map((item) => {
                  const active = area === item;
                  const count = facetCounts.areaCounts[item];
                  return (
                    <AuthorityFilterChip
                      key={item}
                      label={item === 'ALL' ? 'All Areas' : item}
                      count={count}
                      active={active}
                      disabled={!active && item !== 'ALL' && count === 0}
                      onPress={() => updateFilters({ area: item === 'ALL' ? '' : item })}
                    />
                  );
                })}
              </ScrollView>
            </View>
          </View>

          <View style={styles.resultSummary}>
            <View>
              <Text style={styles.resultText}>{filteredComplaints.length} complaints found</Text>
              {(filter !== 'ALL' ||
                category !== 'ALL' ||
                area !== 'ALL' ||
                search.length > 0) && (
                <Pressable
                  onPress={() => {
                    updateFilters({
                      status: '',
                      category: '',
                      area: '',
                      query: '',
                    });
                  }}
                  style={styles.clearFilters}
                >
                  <Ionicons name="close-circle-outline" size={13} color="#2563EB" />
                  <Text style={styles.clearFiltersText}>Clear all filters</Text>
                </Pressable>
              )}
            </View>
            <View style={styles.sortBadge}>
              <Ionicons name="arrow-down-outline" size={13} color="#A7640C" />
              <Text style={styles.sortText}>Urgency: highest first</Text>
            </View>
          </View>

          {sections.map((section) => {
            const theme = statusTheme[section.status];
            return (
              <View key={section.status} style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionIcon, { backgroundColor: theme.background }]}> 
                    <Ionicons name={theme.icon} size={19} color={theme.color} />
                  </View>
                  <View style={styles.sectionHeadingCopy}>
                    <Text style={styles.sectionTitle}>{section.status === 'IN PROGRESS' ? 'In Progress' : section.status.charAt(0) + section.status.slice(1).toLowerCase()}</Text>
                    <Text style={styles.sectionCount}>{section.complaints.length} complaints</Text>
                  </View>
                </View>

                <View style={styles.complaintList}>
                  {section.complaints.map((complaint) => (
                    <Pressable
                      key={complaint.id}
                      onPress={() => openComplaint(complaint)}
                      style={({ pressed }) => [styles.complaintCard, pressed && styles.complaintCardPressed]}
                    >
                      <View style={styles.complaintMain}>
                        <View style={styles.complaintTopLine}>
                          <Text style={styles.complaintTitle} numberOfLines={1}>{complaint.title}</Text>
                          <View style={[styles.statusBadge, { backgroundColor: theme.background }]}> 
                            <Text style={[styles.statusText, { color: theme.color }]}>{complaint.status}</Text>
                          </View>
                        </View>
                        <Text style={styles.complaintDescription} numberOfLines={1}>{complaint.description}</Text>
                        <View style={styles.metaRow}>
                          <Text style={styles.complaintId}>{complaint.id}</Text>
                          <View style={styles.metaItem}><Ionicons name="layers-outline" size={12} color="#7A8493" /><Text style={styles.metaText}>{complaint.category}</Text></View>
                          <View style={styles.metaItem}><Ionicons name="location-outline" size={12} color="#7A8493" /><Text style={styles.metaText}>{complaint.location}</Text></View>
                          <View style={styles.metaItem}><Ionicons name="calendar-outline" size={12} color="#7A8493" /><Text style={styles.metaText}>{complaint.date}</Text></View>
                        </View>
                      </View>
                      <View style={styles.urgencyBadge}>
                        <Ionicons name="arrow-up-circle" size={17} color="#C57C1B" />
                        <Text style={styles.urgencyValue}>{complaint.urgency}</Text>
                        <Text style={styles.urgencyLabel}>urgent</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color="#A7AFBA" />
                    </Pressable>
                  ))}
                </View>
              </View>
            );
          })}

          {filteredComplaints.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={30} color="#99A2AE" />
              <Text style={styles.emptyTitle}>No complaints found</Text>
              <Text style={styles.emptyText}>Try another status, category, area, or search keyword.</Text>
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
  container: { width: '100%', maxWidth: 1080, alignSelf: 'center', padding: 16, gap: 17 },
  hero: { gap: 3 },
  eyebrow: { color: '#B9854B', fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  title: { color: '#111827', fontSize: 25, fontWeight: '800' },
  subtitle: { color: '#6B7280', fontSize: 12, marginTop: 3 },
  controls: { gap: 11 },
  searchBox: { flex: 1, minWidth: 260, minHeight: 43, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, borderRadius: 12, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E6EB' },
  searchInput: { flex: 1, color: '#344054', fontSize: 11 },
  filterGroup: { gap: 6 },
  filterLabel: { color: '#475467', fontSize: 9, fontWeight: '800', letterSpacing: 0.3 },
  filters: { gap: 7 },
  resultSummary: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  resultText: { color: '#667085', fontSize: 10, fontWeight: '700' },
  clearFilters: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5 },
  clearFiltersText: { color: '#2563EB', fontSize: 9, fontWeight: '700' },
  sortBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 12, backgroundColor: '#FFF7E8' },
  sortText: { color: '#A7640C', fontSize: 9, fontWeight: '700' },
  section: { gap: 10 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  sectionHeadingCopy: { flex: 1 },
  sectionTitle: { color: '#1F2937', fontSize: 16, fontWeight: '800' },
  sectionCount: { color: '#8A93A1', fontSize: 9, marginTop: 2 },
  complaintList: { gap: 9 },
  complaintCard: { minHeight: 94, flexDirection: 'row', alignItems: 'center', gap: 11, padding: 13, borderRadius: 13, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EAEDF1', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' },
  complaintCardPressed: { opacity: 0.76 },
  complaintMain: { flex: 1, minWidth: 0 },
  complaintTopLine: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  complaintTitle: { flex: 1, color: '#263142', fontSize: 13, fontWeight: '800' },
  complaintDescription: { color: '#687386', fontSize: 10, marginTop: 4 },
  statusBadge: { paddingHorizontal: 7, paddingVertical: 4, borderRadius: 10 },
  statusText: { fontSize: 8, fontWeight: '800' },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginTop: 8 },
  complaintId: { color: '#3B82F6', fontSize: 9, fontWeight: '800' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: { color: '#7A8493', fontSize: 9 },
  urgencyBadge: { alignItems: 'center', minWidth: 48, padding: 7, borderRadius: 11, backgroundColor: '#FFF7E8' },
  urgencyValue: { color: '#A7640C', fontSize: 13, fontWeight: '900', fontVariant: ['tabular-nums'] },
  urgencyLabel: { color: '#A77C45', fontSize: 7, fontWeight: '700' },
  emptyState: { alignItems: 'center', padding: 35, borderRadius: 14, backgroundColor: '#FFFFFF' },
  emptyTitle: { color: '#344054', fontSize: 14, fontWeight: '800', marginTop: 9 },
  emptyText: { color: '#8A93A1', fontSize: 10, marginTop: 4 },
});
