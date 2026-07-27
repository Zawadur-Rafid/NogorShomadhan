import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { dummyComplaints } from '@/components/store/store_complaint';

type StatusFilter = 'All' | 'Pending' | 'In Progress' | 'Resolved';

const theme = {
  background: '#f8f9fc',
  surface: '#ffffff',
  primary: '#00475e',
  primaryContainer: '#1a5f7a',
  onPrimaryContainer: '#9bd7f7',
  onSurface: '#191c1e',
  onSurfaceVariant: '#40484d',
  outline: '#70787d',
  outlineVariant: '#c0c8cd',
  surfaceContainerLow: '#f2f4f6',
  surfaceContainer: '#eceef0',
  pendingBg: '#ffdcc3',
  pendingText: '#713b00',
  progressBg: '#c0e8ff',
  progressText: '#004d66',
  resolvedBg: '#d1fadf',
  resolvedText: '#027a48',
  secondaryContainer: '#ffa454',
  onSecondaryContainer: '#713b00',
};

export default function MyComplaintsScreen() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<StatusFilter>('All');

  // Filter complaints filed by resident
  const myComplaints = useMemo(() => {
    return dummyComplaints.filter((c) => c.isMyComplaint);
  }, []);

  const filteredComplaints = useMemo(() => {
    if (activeFilter === 'All') return myComplaints;
    return myComplaints.filter(
      (c) => c.status.toUpperCase() === activeFilter.toUpperCase()
    );
  }, [activeFilter, myComplaints]);

  const handleOpenDetails = (id: string) => {
    router.push({
      pathname: '/(resident)/complaints/[complaintId]',
      params: { complaintId: id },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Header Section */}
        <View style={styles.pageIntro}>
          <Text style={styles.title}>My Complaints</Text>
          <Text style={styles.subtitle}>
            Track status and progress of issues reported by you.
          </Text>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterContainer}
          >
            {(['All', 'Pending', 'In Progress', 'Resolved'] as StatusFilter[]).map(
              (filter) => {
                const isActive = activeFilter === filter;
                return (
                  <TouchableOpacity
                    key={filter}
                    style={[
                      styles.filterBtn,
                      isActive ? styles.activeFilter : styles.inactiveFilter,
                    ]}
                    onPress={() => setActiveFilter(filter)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.filterText,
                        isActive
                          ? styles.activeFilterText
                          : styles.inactiveFilterText,
                      ]}
                    >
                      {filter}
                    </Text>
                  </TouchableOpacity>
                );
              }
            )}
          </ScrollView>
        </View>

        {/* Complaints List */}
        <View style={styles.listContainer}>
          {filteredComplaints.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons
                name="assignment-late"
                size={56}
                color={theme.outlineVariant}
                style={{ marginBottom: 12 }}
              />
              <Text style={styles.emptyTitle}>No complaints found</Text>
              <Text style={styles.emptyDesc}>
                You have not submitted any complaints under this filter yet.
              </Text>
            </View>
          ) : (
            filteredComplaints.map((item) => {
              let badgeBg = theme.pendingBg;
              let badgeText = theme.pendingText;
              let statusLabel = 'Pending';
              if (item.status === 'IN PROGRESS') {
                badgeBg = theme.progressBg;
                badgeText = theme.progressText;
                statusLabel = 'In Progress';
              } else if (item.status === 'RESOLVED') {
                badgeBg = theme.resolvedBg;
                badgeText = theme.resolvedText;
                statusLabel = 'Resolved';
              }

              let categoryIcon: keyof typeof MaterialIcons.glyphMap = 'report-problem';
              if (item.category === 'Water Supply') categoryIcon = 'water-drop';
              if (item.category === 'Roads & Traffic') categoryIcon = 'construction';
              if (item.category === 'Streetlights') categoryIcon = 'lightbulb';
              if (item.category === 'Waste Management') categoryIcon = 'delete';
              if (item.category === 'Parks & Recreation') categoryIcon = 'park';
              if (item.category === 'Public Safety') categoryIcon = 'shield';
              if (item.category === 'Drainage System') categoryIcon = 'water-damage';
              if (item.category === 'Electricity') categoryIcon = 'flash-on';

              const imageCount = item.images ? item.images.length : (item.image ? 1 : 0);

              return (
                <TouchableOpacity
                  key={item.id}
                  style={styles.card}
                  activeOpacity={0.9}
                  onPress={() => handleOpenDetails(item.id)}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.cardHeaderLeft}>
                      <View style={styles.iconCircle}>
                        <MaterialIcons
                          name={categoryIcon}
                          size={22}
                          color={theme.primary}
                        />
                      </View>
                      <View style={styles.titleArea}>
                        <Text style={styles.cardTitle}>{item.title}</Text>
                        <Text style={styles.cardCategory}>
                          {item.category} • {item.date}
                        </Text>
                      </View>
                    </View>
                    <View
                      style={[styles.statusBadge, { backgroundColor: badgeBg }]}
                    >
                      <Text
                        style={[styles.statusBadgeText, { color: badgeText }]}
                      >
                        {statusLabel}
                      </Text>
                    </View>
                  </View>

                  {item.image && (
                    <View style={styles.imageWrapper}>
                      <Image
                        source={{ uri: item.image }}
                        style={styles.evidenceImage}
                      />
                      {imageCount > 1 && (
                        <View style={styles.photoCountBadge}>
                          <MaterialIcons name="photo-library" size={14} color="#FFF" />
                          <Text style={styles.photoCountText}>{imageCount} Photos</Text>
                        </View>
                      )}
                    </View>
                  )}

                  <Text style={styles.cardDesc} numberOfLines={2}>
                    {item.description}
                  </Text>

                  <View style={styles.metaRow}>
                    <View style={styles.locationTag}>
                      <MaterialIcons
                        name="place"
                        size={16}
                        color={theme.primary}
                      />
                      <Text style={styles.locationText}>{item.location}</Text>
                    </View>
                    <View style={styles.urgencyTag}>
                      <MaterialIcons
                        name="priority-high"
                        size={14}
                        color="#EF4444"
                      />
                      <Text style={styles.urgencyText}>
                        {item.urgencyCount} Votes
                      </Text>
                    </View>
                  </View>

                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={styles.viewBtn}
                      onPress={() => handleOpenDetails(item.id)}
                    >
                      <Text style={styles.viewBtnText}>View Details & Images</Text>
                      <MaterialIcons
                        name="chevron-right"
                        size={18}
                        color={theme.primary}
                      />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/(resident)/complaints/create')}
      >
        <MaterialIcons
          name="add"
          size={28}
          color={theme.onSecondaryContainer}
        />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  contentContainer: {
    paddingTop: 20,
    paddingBottom: 100,
  },
  pageIntro: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  title: {
    fontFamily: 'Inter',
    fontSize: 28,
    fontWeight: '700',
    color: theme.primary,
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: theme.onSurfaceVariant,
  },
  filterSection: {
    marginBottom: 16,
  },
  filterContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeFilter: {
    backgroundColor: theme.primary,
  },
  inactiveFilter: {
    backgroundColor: theme.surfaceContainer,
  },
  filterText: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '600',
  },
  activeFilterText: {
    color: '#fff',
  },
  inactiveFilterText: {
    color: theme.onSurfaceVariant,
  },
  listContainer: {
    paddingHorizontal: 16,
    gap: 16,
  },
  card: {
    backgroundColor: theme.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.outlineVariant + '4D',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
    marginRight: 8,
  },
  iconCircle: {
    width: 42,
    height: 42,
    backgroundColor: theme.primary + '1A',
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleArea: {
    flex: 1,
  },
  cardTitle: {
    fontFamily: 'Inter',
    fontSize: 18,
    fontWeight: '600',
    color: theme.onSurface,
  },
  cardCategory: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '600',
    color: theme.primary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusBadgeText: {
    fontFamily: 'Inter',
    fontSize: 11,
    fontWeight: '700',
  },
  imageWrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  evidenceImage: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    backgroundColor: theme.surfaceContainer,
  },
  photoCountBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  photoCountText: {
    color: '#FFF',
    fontFamily: 'Inter',
    fontSize: 11,
    fontWeight: '700',
  },
  cardDesc: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: theme.onSurfaceVariant,
    lineHeight: 20,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: theme.surfaceContainer,
    marginBottom: 12,
  },
  locationTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  locationText: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: theme.onSurfaceVariant,
    flex: 1,
  },
  urgencyTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  urgencyText: {
    fontFamily: 'Inter',
    fontSize: 11,
    fontWeight: '700',
    color: '#B91C1C',
  },
  actionRow: {
    flexDirection: 'row',
  },
  viewBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: theme.surfaceContainerLow,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  viewBtnText: {
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: '600',
    color: theme.primary,
  },
  emptyState: {
    paddingVertical: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontFamily: 'Inter',
    fontSize: 20,
    fontWeight: '600',
    color: theme.onSurface,
    marginBottom: 4,
  },
  emptyDesc: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: theme.onSurfaceVariant,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 80,
    backgroundColor: theme.secondaryContainer,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
});
