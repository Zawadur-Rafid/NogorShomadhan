import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { useMemo, useState, useEffect } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  Alert
} from "react-native";
import { useRouter } from "expo-router";
import { getFeedComplaints } from "@/services/resident.service";

type StatusFilter = "All" | "Pending" | "In Progress" | "Resolved";

const CATEGORIES = [
  "All Categories",
  "Water Supply",
  "Roads & Traffic",
  "Streetlights",
  "Waste Management",
  "Parks & Recreation",
  "Public Safety",
  "Drainage System",
];

const theme = {
  background: "#f8f9fc",
  surface: "#ffffff",
  primary: "#00475e",
  primaryContainer: "#1a5f7a",
  onPrimaryContainer: "#9bd7f7",
  onSurface: "#191c1e",
  onSurfaceVariant: "#40484d",
  outline: "#70787d",
  outlineVariant: "#c0c8cd",
  surfaceContainerLow: "#f2f4f6",
  surfaceContainer: "#eceef0",
  pendingBg: "#FEF2F2",
  pendingText: "#EF4444",
  progressBg: "#FEF9C3",
  progressText: "#C67B00",
  resolvedBg: "#EFF6FF", 
  resolvedText: "#2563EB",
  secondaryContainer: "#ffa454",
  onSecondaryContainer: "#713b00",
};

export default function ResidentAllComplaintsScreen() {
  const router = useRouter();
  const [activeStatusFilter, setActiveStatusFilter] = useState<StatusFilter>("All");
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>("All Categories");
  const [upvotedComplaints, setUpvotedComplaints] = useState<Set<string>>(new Set());
  const [complaints, setComplaints] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getFeedComplaints();
        setComplaints(data);
      } catch (error) {
        if (error instanceof Error) {
          Alert.alert("Error", error.message);
        }
      }
    }
    loadData();
  }, []);

  const filteredComplaints = useMemo(() => {
    return complaints.filter((complaint) => {
      const matchStatus =
        activeStatusFilter === "All" ||
        complaint.status.toUpperCase() === activeStatusFilter.toUpperCase();
      const matchCategory =
        activeCategoryFilter === "All Categories" ||
        complaint.category === activeCategoryFilter;
      return matchStatus && matchCategory;
    });
  }, [activeStatusFilter, activeCategoryFilter, complaints]);

  const handleOpenDetails = (id: string) => {
    router.push({
      pathname: "/(resident)/complaints/[complaintId]",
      params: { complaintId: id },
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Header Section */}
        <View style={styles.pageIntro}>
          <Text style={styles.title}>All Complaints</Text>
          <Text style={styles.subtitle}>
            Track, filter, and review reported community issues.
          </Text>
        </View>

        {/* Status Filter Tabs */}
        <View style={styles.filterSection}>
          <Text style={styles.sectionLabel}>STATUS</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContainer}>
            {(["All", "Pending", "In Progress", "Resolved"] as StatusFilter[]).map((filter) => {
              const isActive = activeStatusFilter === filter;
              return (
                <TouchableOpacity
                  key={filter}
                  style={[styles.filterBtn, isActive ? styles.activeFilter : styles.inactiveFilter]}
                  onPress={() => setActiveStatusFilter(filter)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.filterText, isActive ? styles.activeFilterText : styles.inactiveFilterText]}>
                    {filter}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Category Filter Chips */}
        <View style={styles.filterSection}>
          <Text style={styles.sectionLabel}>CATEGORY</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContainer}>
            {CATEGORIES.map((cat) => {
              const isActive = activeCategoryFilter === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[styles.chipBtn, isActive ? styles.activeChip : styles.inactiveChip]}
                  onPress={() => setActiveCategoryFilter(cat)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.chipText, isActive ? styles.activeChipText : styles.inactiveChipText]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Complaint List */}
        <View style={styles.listContainer}>
          {filteredComplaints.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="error-outline" size={64} color={theme.outlineVariant} style={{marginBottom: 16}} />
              <Text style={styles.emptyTitle}>No complaints found</Text>
              <Text style={styles.emptyDesc}>There are no reports matching your active filters.</Text>
            </View>
          ) : (
            filteredComplaints.map((item) => {
              let badgeBg = theme.pendingBg;
              let badgeText = theme.pendingText;
              let statusLabel = "Pending";
              if (item.status === "IN PROGRESS") {
                badgeBg = theme.progressBg;
                badgeText = theme.progressText;
                statusLabel = "In Progress";
              } else if (item.status === "RESOLVED") {
                badgeBg = theme.resolvedBg;
                badgeText = theme.resolvedText;
                statusLabel = "Resolved";
              }

              let materialIcon: keyof typeof MaterialIcons.glyphMap = "report-problem";
              if (item.category === "Water Supply") materialIcon = "water-drop";
              if (item.category === "Roads & Traffic") materialIcon = "construction";
              if (item.category === "Streetlights") materialIcon = "lightbulb";
              if (item.category === "Waste Management") materialIcon = "delete";
              if (item.category === "Parks & Recreation") materialIcon = "park";
              if (item.category === "Public Safety") materialIcon = "shield";
              if (item.category === "Drainage System") materialIcon = "water-damage";

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
                        <MaterialIcons name={materialIcon} size={24} color={theme.primary} />
                      </View>
                      <View style={styles.titleArea}>
                        <Text style={styles.cardTitle}>{item.title}</Text>
                        <Text style={styles.cardCategory}>{item.category} • {item.date}</Text>
                      </View>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: badgeBg }]}>
                      <Text style={[styles.statusBadgeText, { color: badgeText }]}>{statusLabel}</Text>
                    </View>
                  </View>
                  
                  {item.image && (
                    <Image source={{ uri: item.image }} style={styles.evidenceImage} />
                  )}

                  <Text style={styles.cardDesc} numberOfLines={2}>
                    {item.description}
                  </Text>
                  
                  <View style={styles.metaRow}>
                    <View style={styles.locationTag}>
                      <MaterialIcons name="place" size={16} color={theme.primary} />
                      <Text style={styles.locationText}>{item.location}</Text>
                    </View>
                    <TouchableOpacity 
                      style={[styles.urgencyTag, upvotedComplaints.has(item.id) && { backgroundColor: '#C57C1B' }]}
                      disabled={item.status !== "PENDING"}
                      onPress={(e) => {
                        e.stopPropagation();
                        if (item.status === "PENDING") {
                          setUpvotedComplaints(prev => {
                            const newSet = new Set(prev);
                            if (newSet.has(item.id)) {
                              newSet.delete(item.id);
                            } else {
                              newSet.add(item.id);
                            }
                            return newSet;
                          });
                        }
                      }}
                    >
                      <Ionicons name="arrow-up-circle" size={16} color={upvotedComplaints.has(item.id) ? "#FFFFFF" : "#C57C1B"} />
                      <Text style={[styles.urgencyText, upvotedComplaints.has(item.id) && { color: "#FFFFFF" }]}>
                        {item.urgencyCount + (upvotedComplaints.has(item.id) ? 1 : 0)} Urgency Votes
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.actionRow}>
                    <TouchableOpacity 
                      style={styles.viewBtn}
                      onPress={() => handleOpenDetails(item.id)}
                    >
                      <Text style={styles.viewBtnText}>View Details</Text>
                      <MaterialIcons name="chevron-right" size={18} color={theme.primary} />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Floating Action Button for New Complaint */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => router.push("/(resident)/complaints/create")}
      >
        <MaterialIcons name="add" size={28} color={theme.onSecondaryContainer} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  content: {
    paddingTop: 20,
    paddingBottom: 100,
  },
  pageIntro: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  title: {
    fontFamily: "Inter",
    fontSize: 28,
    fontWeight: "700",
    color: theme.primary,
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: "Inter",
    fontSize: 14,
    color: theme.onSurfaceVariant,
  },
  filterSection: {
    marginBottom: 12,
  },
  sectionLabel: {
    fontFamily: "Inter",
    fontSize: 11,
    fontWeight: "700",
    color: theme.outline,
    paddingHorizontal: 16,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  filterScroll: {
    maxHeight: 40,
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
    fontFamily: "Inter",
    fontSize: 12,
    fontWeight: "600",
  },
  activeFilterText: {
    color: "#fff",
  },
  inactiveFilterText: {
    color: theme.onSurfaceVariant,
  },
  chipBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.outlineVariant,
    backgroundColor: theme.surface,
  },
  activeChip: {
    backgroundColor: theme.primaryContainer,
    borderColor: theme.primary,
  },
  inactiveChip: {
    backgroundColor: theme.surfaceContainerLow,
  },
  chipText: {
    fontFamily: "Inter",
    fontSize: 12,
    fontWeight: "500",
  },
  activeChipText: {
    color: theme.onPrimaryContainer,
    fontWeight: "700",
  },
  inactiveChipText: {
    color: theme.onSurfaceVariant,
  },
  listContainer: {
    paddingHorizontal: 16,
    gap: 16,
    marginTop: 8,
  },
  card: {
    backgroundColor: theme.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.outlineVariant + "4D",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
    marginRight: 8,
  },
  iconCircle: {
    width: 44,
    height: 44,
    backgroundColor: theme.primary + "1A", 
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  titleArea: {
    flex: 1,
  },
  cardTitle: {
    fontFamily: "Inter",
    fontSize: 18,
    fontWeight: "600",
    color: theme.onSurface,
  },
  cardCategory: {
    fontFamily: "Inter",
    fontSize: 12,
    fontWeight: "600",
    color: theme.primary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusBadgeText: {
    fontFamily: "Inter",
    fontSize: 11,
    fontWeight: "700",
  },
  evidenceImage: {
    width: "100%",
    height: 180,
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: theme.surfaceContainer,
  },
  cardDesc: {
    fontFamily: "Inter",
    fontSize: 14,
    color: theme.onSurfaceVariant,
    lineHeight: 20,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: theme.surfaceContainer,
    marginBottom: 12,
  },
  locationTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flex: 1,
  },
  locationText: {
    fontFamily: "Inter",
    fontSize: 12,
    color: theme.onSurfaceVariant,
    flex: 1,
  },
  urgencyTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  urgencyText: {
    fontFamily: "Inter",
    fontSize: 11,
    fontWeight: "700",
    color: "#B91C1C",
  },
  actionRow: {
    flexDirection: "row",
  },
  viewBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: theme.surfaceContainerLow,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
  },
  viewBtnText: {
    fontFamily: "Inter",
    fontSize: 13,
    fontWeight: "600",
    color: theme.primary,
  },
  emptyState: {
    paddingVertical: 64,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontFamily: "Inter",
    fontSize: 20,
    fontWeight: "600",
    color: theme.onSurface,
    marginBottom: 4,
  },
  emptyDesc: {
    fontFamily: "Inter",
    fontSize: 14,
    color: theme.onSurfaceVariant,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 80,
    backgroundColor: theme.secondaryContainer,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  }
});
