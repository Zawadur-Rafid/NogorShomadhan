import { MaterialIcons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Image,
} from "react-native";
import BottomNav from "@/components/BottomNav";
import { dummyComplaints } from "@/components/store/store_complaint";

type ComplaintFilter = "All" | "Pending" | "In Progress" | "Resolved";

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
  pendingBg: "#ffdcc3",
  pendingText: "#713b00",
  progressBg: "#c0e8ff",
  progressText: "#004d66",
  resolvedBg: "#d1fadf", 
  resolvedText: "#027a48",
  secondaryContainer: "#ffa454",
  onSecondaryContainer: "#713b00",
};

export default function ResidentAllComplaintsScreen() {
  const [activeFilter, setActiveFilter] = useState<ComplaintFilter>("All");

  const filteredComplaints = useMemo(() => {
    if (activeFilter === "All") {
      return dummyComplaints;
    }
    return dummyComplaints.filter(
      (complaint) => complaint.status.toUpperCase() === activeFilter.toUpperCase(),
    );
  }, [activeFilter]);

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
            Track and manage reported city issues.
          </Text>
        </View>

        {/* Filter Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContainer}>
          {(["All", "Pending", "In Progress", "Resolved"] as ComplaintFilter[]).map((filter) => {
            const isActive = activeFilter === filter;
            return (
              <TouchableOpacity
                key={filter}
                style={[styles.filterBtn, isActive ? styles.activeFilter : styles.inactiveFilter]}
                onPress={() => setActiveFilter(filter)}
                activeOpacity={0.8}
              >
                <Text style={[styles.filterText, isActive ? styles.activeFilterText : styles.inactiveFilterText]}>
                  {filter}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Complaint List */}
        <View style={styles.listContainer}>
          {filteredComplaints.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="error-outline" size={64} color={theme.outlineVariant} style={{marginBottom: 16}} />
              <Text style={styles.emptyTitle}>No complaints found</Text>
              <Text style={styles.emptyDesc}>There are no reports in this category.</Text>
            </View>
          ) : (
            filteredComplaints.map((item) => {
              // Status colors mapping
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

              // Icon mapping from string to MaterialIcons
              let materialIcon: keyof typeof MaterialIcons.glyphMap = "report-problem";
              if (item.icon.includes("water")) materialIcon = "water-drop";
              if (item.icon.includes("construct")) materialIcon = "construction";
              if (item.icon.includes("bulb")) materialIcon = "lightbulb";
              if (item.icon.includes("trash")) materialIcon = "delete";
              if (item.icon.includes("bicycle") || item.icon.includes("car")) materialIcon = "directions-car";
              if (item.icon.includes("leaf")) materialIcon = "park";
              if (item.icon.includes("paw")) materialIcon = "pets";
              if (item.icon.includes("warning")) materialIcon = "warning";

              return (
                <View key={item.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.cardHeaderLeft}>
                      <View style={styles.iconCircle}>
                        <MaterialIcons name={materialIcon} size={24} color={theme.primary} />
                      </View>
                      <View style={styles.titleArea}>
                        <Text style={styles.cardTitle}>{item.title}</Text>
                        <Text style={styles.cardMeta}>{item.date} • #CMP-{item.id.padStart(4, '0')}</Text>
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
                  
                  <View style={styles.actionRow}>
                    <TouchableOpacity style={styles.viewBtn}>
                      <Text style={styles.viewBtnText}>View Details</Text>
                    </TouchableOpacity>
                    {item.status === "IN PROGRESS" && (
                      <TouchableOpacity style={styles.trackBtn}>
                        <Text style={styles.trackBtnText}>Track Team</Text>
                      </TouchableOpacity>
                    )}
                    {item.status === "RESOLVED" && (
                      <TouchableOpacity style={styles.closedBtn} disabled>
                        <Text style={styles.closedBtnText}>Case Closed</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab}>
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    height: 64,
    backgroundColor: theme.surfaceContainerLow,
    borderBottomWidth: 1,
    borderBottomColor: theme.outlineVariant + "40",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  iconButton: {
    padding: 8,
    borderRadius: 999,
  },
  headerTitle: {
    fontFamily: "Inter",
    fontSize: 24,
    fontWeight: "600",
    color: theme.primary,
  },
  content: {
    paddingTop: 24,
    paddingBottom: 100,
  },
  pageIntro: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  title: {
    fontFamily: "Inter",
    fontSize: 32,
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
  filterScroll: {
    marginBottom: 24,
    maxHeight: 40,
  },
  filterContainer: {
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 8,
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
    shadowColor: theme.primary,
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
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
  listContainer: {
    paddingHorizontal: 16,
    gap: 16,
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
    gap: 16,
    marginRight: 8,
  },
  iconCircle: {
    width: 48,
    height: 48,
    backgroundColor: theme.primary + "1A", 
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  titleArea: {
    flex: 1,
  },
  cardTitle: {
    fontFamily: "Inter",
    fontSize: 20,
    fontWeight: "600",
    color: theme.onSurface,
  },
  cardMeta: {
    fontFamily: "Inter",
    fontSize: 12,
    fontWeight: "600",
    color: theme.outline,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusBadgeText: {
    fontFamily: "Inter",
    fontSize: 12,
    fontWeight: "600",
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
    marginBottom: 16,
  },
  actionRow: {
    flexDirection: "row",
    gap: 8,
  },
  viewBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.outlineVariant,
    justifyContent: "center",
    alignItems: "center",
  },
  viewBtnText: {
    fontFamily: "Inter",
    fontSize: 12,
    fontWeight: "600",
    color: theme.primary,
  },
  trackBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: theme.primaryContainer,
    justifyContent: "center",
    alignItems: "center",
  },
  trackBtnText: {
    fontFamily: "Inter",
    fontSize: 12,
    fontWeight: "600",
    color: theme.onPrimaryContainer,
  },
  closedBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: theme.surfaceContainer + "80",
    justifyContent: "center",
    alignItems: "center",
  },
  closedBtnText: {
    fontFamily: "Inter",
    fontSize: 12,
    fontWeight: "600",
    color: theme.onSurfaceVariant,
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
