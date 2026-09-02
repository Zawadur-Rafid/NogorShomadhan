import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AuthorityPageHeader from '@/components/authority/authority-page-header';
import {
  getAuthorityActivities,
  type AuthorityActivity,
  type AuthorityActivityCategory,
} from '@/services/authority-activity.service';

type ActivityFilter = 'All' | AuthorityActivityCategory;

const filters: ActivityFilter[] = ['All', 'Complaint', 'Forum', 'Feedback'];
const PAGE_SIZE = 20;

const categoryTheme = {
  Complaint: {
    icon: 'construct-outline' as const,
    color: '#C67B00',
    background: '#FFF7E8',
  },
  Forum: {
    icon: 'chatbubbles-outline' as const,
    color: '#16845B',
    background: '#EAF8F1',
  },
  Feedback: {
    icon: 'star-outline' as const,
    color: '#7C6BC4',
    background: '#F2EFFE',
  },
};

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'The activity log could not be loaded.';
}

function getTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString('en-BD', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getDayKey(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function getDayLabel(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const today = new Date();
  const todayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  ).getTime();
  const dateStart = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  ).getTime();
  const difference = Math.round((todayStart - dateStart) / 86_400_000);

  if (difference === 0) return 'Today';
  if (difference === 1) return 'Yesterday';
  return date.toLocaleDateString('en-BD', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function AuthorityActivityLogScreen() {
  const router = useRouter();
  const [activities, setActivities] = useState<AuthorityActivity[]>([]);
  const [filter, setFilter] = useState<ActivityFilter>('All');
  const [search, setSearch] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    getAuthorityActivities()
      .then((data) => {
        if (cancelled) return;
        setActivities(data);
        setError(null);
      })
      .catch((loadError: unknown) => {
        if (cancelled) return;
        setError(getErrorMessage(loadError));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const refreshActivities = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await getAuthorityActivities();
      setActivities(data);
      setVisibleCount(PAGE_SIZE);
      setError(null);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, []);

  const filteredActivities = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return activities.filter((activity) => {
      const matchesFilter = filter === 'All' || activity.category === filter;
      const matchesSearch =
        !keyword ||
        activity.title.toLowerCase().includes(keyword) ||
        activity.detail.toLowerCase().includes(keyword) ||
        activity.entityId.toLowerCase().includes(keyword);
      return matchesFilter && matchesSearch;
    });
  }, [activities, filter, search]);

  const visibleActivities = useMemo(
    () => filteredActivities.slice(0, visibleCount),
    [filteredActivities, visibleCount],
  );
  const hasMore = visibleActivities.length < filteredActivities.length;

  const openActivity = useCallback(
    (activity: AuthorityActivity) => {
      if (activity.entityType === 'complaint') {
        router.push({
          pathname: '/authority/complaints/[complaintId]',
          params: { complaintId: activity.entityId },
        } as never);
        return;
      }

      if (activity.entityType === 'forum_post') {
        router.push('/authority/forum' as never);
        return;
      }

      router.push('/authority/feedback-center' as never);
    },
    [router],
  );

  const selectFilter = (nextFilter: ActivityFilter) => {
    setFilter(nextFilter);
    setVisibleCount(PAGE_SIZE);
  };

  const updateSearch = (value: string) => {
    setSearch(value);
    setVisibleCount(PAGE_SIZE);
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <AuthorityPageHeader
        title="Home"
        icon="home-outline"
        onBack={() => router.navigate('/authority/dashboard' as never)}
      />
      <FlatList
        data={visibleActivities}
        keyExtractor={(item) => item.id}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshing={refreshing}
        onRefresh={() => void refreshActivities()}
        ListHeaderComponent={
          <View style={styles.headerContent}>
            <View style={styles.hero}>
              <View style={styles.heroIcon}>
                <Ionicons name="time-outline" size={26} color="#FFFFFF" />
              </View>
              <View style={styles.heroCopy}>
                <Text style={styles.eyebrow}>ACCOUNT HISTORY</Text>
                <Text style={styles.title}>Activity Log</Text>
                <Text style={styles.subtitle}>
                  Your complaint decisions, contractor changes, work updates, and forum contributions in one timeline.
                </Text>
              </View>
              <View style={styles.activityCount}>
                <Text style={styles.activityCountValue}>{activities.length}</Text>
                <Text style={styles.activityCountLabel}>actions</Text>
              </View>
            </View>

            <View style={styles.controls}>
              <View style={styles.searchBox}>
                <Ionicons name="search-outline" size={18} color="#7A8493" />
                <TextInput
                  value={search}
                  onChangeText={updateSearch}
                  placeholder="Search activity, complaint, or contractor"
                  placeholderTextColor="#9AA2AE"
                  returnKeyType="search"
                  style={styles.searchInput}
                />
                {search ? (
                  <Pressable
                    accessibilityLabel="Clear activity search"
                    hitSlop={8}
                    onPress={() => updateSearch('')}
                  >
                    <Ionicons name="close-circle" size={18} color="#9AA2AE" />
                  </Pressable>
                ) : null}
              </View>

              <View style={styles.filters}>
                {filters.map((item) => (
                  <Pressable
                    key={item}
                    accessibilityRole="button"
                    accessibilityState={{ selected: filter === item }}
                    onPress={() => selectFilter(item)}
                    style={({ pressed }) => [
                      styles.filterButton,
                      filter === item && styles.filterButtonActive,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterText,
                        filter === item && styles.filterTextActive,
                      ]}
                    >
                      {item === 'Complaint' ? 'Complaints' : item}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.resultHeading}>
              <Text style={styles.resultTitle}>Recent activity</Text>
              <Text style={styles.resultCount}>
                {filteredActivities.length} {filteredActivities.length === 1 ? 'record' : 'records'}
              </Text>
            </View>

            {error && activities.length > 0 ? (
              <View style={styles.inlineError}>
                <Ionicons name="warning-outline" size={17} color="#B54747" />
                <Text selectable style={styles.inlineErrorText}>{error}</Text>
                <Pressable onPress={() => void refreshActivities()}>
                  <Text style={styles.retryText}>Retry</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        }
        renderItem={({ item, index }) => {
          const theme = categoryTheme[item.category];
          const previous = visibleActivities[index - 1];
          const showDay =
            !previous || getDayKey(previous.createdAt) !== getDayKey(item.createdAt);

          return (
            <View style={styles.itemContainer}>
              {showDay ? (
                <Text style={styles.dayLabel}>{getDayLabel(item.createdAt)}</Text>
              ) : null}
              <View style={styles.timelineRow}>
                <View style={styles.timelineTrack}>
                  <View style={[styles.timelineIcon, { backgroundColor: theme.background }]}>
                    <Ionicons name={theme.icon} size={19} color={theme.color} />
                  </View>
                  {index < visibleActivities.length - 1 ? (
                    <View style={styles.timelineLine} />
                  ) : null}
                </View>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Open ${item.title}`}
                  onPress={() => openActivity(item)}
                  style={({ pressed }) => [
                    styles.activityCard,
                    pressed && styles.activityCardPressed,
                  ]}
                >
                  <View style={styles.activityHeading}>
                    <View style={[styles.typeBadge, { backgroundColor: theme.background }]}>
                      <Text style={[styles.typeText, { color: theme.color }]}>
                        {item.category.toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.activityTime}>{getTimestamp(item.createdAt)}</Text>
                  </View>
                  <Text selectable style={styles.activityTitle}>{item.title}</Text>
                  {item.detail ? (
                    <Text selectable style={styles.activityDetail}>{item.detail}</Text>
                  ) : null}
                  <View style={styles.cardFooter}>
                    <Text selectable numberOfLines={1} style={styles.activityId}>
                      {item.entityId}
                    </Text>
                    <View style={styles.openAction}>
                      <Text style={styles.openActionText}>View details</Text>
                      <Ionicons name="chevron-forward" size={14} color="#3B82F6" />
                    </View>
                  </View>
                </Pressable>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            {loading ? (
              <>
                <ActivityIndicator size="large" color="#23435D" />
                <Text style={styles.emptyTitle}>Loading activity</Text>
                <Text style={styles.emptyText}>Building your authority timeline.</Text>
              </>
            ) : error ? (
              <>
                <Ionicons name="alert-circle-outline" size={36} color="#B54747" />
                <Text style={styles.emptyTitle}>Activity unavailable</Text>
                <Text selectable style={styles.emptyText}>{error}</Text>
                <Pressable
                  onPress={() => void refreshActivities()}
                  style={styles.retryButton}
                >
                  <Ionicons name="refresh-outline" size={16} color="#FFFFFF" />
                  <Text style={styles.retryButtonText}>Try again</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Ionicons name="time-outline" size={36} color="#98A2B3" />
                <Text style={styles.emptyTitle}>No activity found</Text>
                <Text style={styles.emptyText}>
                  {activities.length === 0
                    ? 'Your complaint and forum actions will appear here.'
                    : 'Try another activity type or search phrase.'}
                </Text>
              </>
            )}
          </View>
        }
        ListFooterComponent={
          hasMore ? (
            <Pressable
              onPress={() => setVisibleCount((count) => count + PAGE_SIZE)}
              style={({ pressed }) => [styles.loadMoreButton, pressed && styles.pressed]}
            >
              <Text style={styles.loadMoreText}>Load more activity</Text>
              <Ionicons name="chevron-down" size={16} color="#23435D" />
            </Pressable>
          ) : visibleActivities.length > 0 ? (
            <Text style={styles.endText}>You have reached the end of this activity.</Text>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F7F8FA' },
  listContent: {
    width: '100%',
    maxWidth: 920,
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingBottom: 36,
  },
  headerContent: { gap: 15, paddingTop: 16 },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    padding: 17,
    borderRadius: 15,
    borderCurve: 'continuous',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAEDF1',
  },
  heroIcon: {
    width: 49,
    height: 49,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#23435D',
  },
  heroCopy: { flex: 1, minWidth: 0 },
  eyebrow: { color: '#B9854B', fontSize: 9, fontWeight: '900', letterSpacing: 0.7 },
  title: { color: '#111827', fontSize: 24, fontWeight: '800', marginTop: 2 },
  subtitle: { color: '#6B7280', fontSize: 10, lineHeight: 15, marginTop: 4 },
  activityCount: {
    alignItems: 'center',
    minWidth: 65,
    padding: 9,
    borderRadius: 12,
    borderCurve: 'continuous',
    backgroundColor: '#E8EEF2',
  },
  activityCountValue: {
    color: '#23435D',
    fontSize: 19,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  activityCountLabel: { color: '#607080', fontSize: 8, fontWeight: '700' },
  controls: { gap: 10 },
  searchBox: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderCurve: 'continuous',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E6EB',
  },
  searchInput: { flex: 1, color: '#344054', fontSize: 11 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  filterButton: {
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E6EB',
  },
  filterButtonActive: { backgroundColor: '#23435D', borderColor: '#23435D' },
  filterText: { color: '#667085', fontSize: 10, fontWeight: '700' },
  filterTextActive: { color: '#FFFFFF' },
  pressed: { opacity: 0.72 },
  resultHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingTop: 2,
  },
  resultTitle: { color: '#263142', fontSize: 15, fontWeight: '800' },
  resultCount: { color: '#8A93A1', fontSize: 9, fontWeight: '700' },
  inlineError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 11,
    borderRadius: 11,
    backgroundColor: '#FFF4F3',
  },
  inlineErrorText: { flex: 1, color: '#8D3F3F', fontSize: 10, lineHeight: 15 },
  retryText: { color: '#B54747', fontSize: 10, fontWeight: '800' },
  itemContainer: { paddingTop: 4 },
  dayLabel: {
    color: '#667085',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.4,
    paddingTop: 11,
    paddingBottom: 8,
    paddingLeft: 52,
    textTransform: 'uppercase',
  },
  timelineRow: { flexDirection: 'row', gap: 11 },
  timelineTrack: { width: 42, alignItems: 'center' },
  timelineIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineLine: { width: 2, flex: 1, minHeight: 65, backgroundColor: '#DEE3E8' },
  activityCard: {
    flex: 1,
    minWidth: 0,
    padding: 14,
    borderRadius: 13,
    borderCurve: 'continuous',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAEDF1',
    marginBottom: 11,
  },
  activityCardPressed: { backgroundColor: '#F8FAFC', borderColor: '#D6E1E8' },
  activityHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 9,
  },
  typeBadge: { paddingHorizontal: 7, paddingVertical: 4, borderRadius: 9 },
  typeText: { fontSize: 7, fontWeight: '900', letterSpacing: 0.3 },
  activityTime: { color: '#9AA2AE', fontSize: 8 },
  activityTitle: { color: '#263142', fontSize: 12, fontWeight: '800', marginTop: 8 },
  activityDetail: { color: '#687386', fontSize: 10, lineHeight: 15, marginTop: 4 },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 9,
  },
  activityId: { flex: 1, color: '#8290A3', fontSize: 8, fontWeight: '700' },
  openAction: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  openActionText: { color: '#3B82F6', fontSize: 8, fontWeight: '800' },
  emptyState: {
    alignItems: 'center',
    gap: 7,
    padding: 36,
    borderRadius: 14,
    borderCurve: 'continuous',
    backgroundColor: '#FFFFFF',
    marginTop: 12,
  },
  emptyTitle: { color: '#344054', fontSize: 14, fontWeight: '800', textAlign: 'center' },
  emptyText: { maxWidth: 430, color: '#8A93A1', fontSize: 10, lineHeight: 15, textAlign: 'center' },
  retryButton: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    borderRadius: 19,
    backgroundColor: '#23435D',
    marginTop: 4,
  },
  retryButtonText: { color: '#FFFFFF', fontSize: 9, fontWeight: '800' },
  loadMoreButton: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 21,
    backgroundColor: '#E8EEF2',
    marginTop: 8,
  },
  loadMoreText: { color: '#23435D', fontSize: 10, fontWeight: '800' },
  endText: { color: '#98A2B3', fontSize: 9, textAlign: 'center', paddingTop: 15 },
});
