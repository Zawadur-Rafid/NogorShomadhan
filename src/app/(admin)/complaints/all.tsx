import Ionicons from "@expo/vector-icons/Ionicons";
import { useMemo, useState } from "react";
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import AdminBottomNav from "@/components/AdminBottomNav";
import { dummyComplaints } from "@/components/store/store_complaint";

type ComplaintFilter = "All" | "Pending" | "In Progress" | "Resolved";

const colors = {
  background: "#F5F6FA",
  white: "#FFFFFF",
  primary: "#1F4868",
  text: "#1E1E1E",
  subtitle: "#707070",
  blue: "#E8F2FF",
  orange: "#FFF3E5",
  green: "#EAF8EF",
  red: "#FFECEC",
  blueIcon: "#2D6CDF",
  orangeIcon: "#C97816",
  greenIcon: "#1E8E3E",
  redIcon: "#C0392B",
};

export default function AllComplaintsScreen() {
  const [activeFilter, setActiveFilter] = useState<ComplaintFilter>("All");

  const filteredComplaints = useMemo(() => {
    if (activeFilter === "All") {
      return dummyComplaints;
    }

    return dummyComplaints.filter(
      (complaint) => complaint.status === activeFilter.toUpperCase(),
    );
  }, [activeFilter]);

  const pendingCount = dummyComplaints.filter(
    (complaint) => complaint.status === "PENDING",
  ).length;
  const resolvedCount = dummyComplaints.filter(
    (complaint) => complaint.status === "RESOLVED",
  ).length;
  const inProgressCount = dummyComplaints.filter(
    (complaint) => complaint.status === "IN PROGRESS",
  ).length;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="menu" size={22} color={colors.primary} />
            <Text style={styles.logo}>Complaint Desk</Text>
          </View>

          <View style={styles.headerRight}>
            <Ionicons name="notifications-outline" size={20} color="#000" />
            <View style={styles.adminCircle}>
              <Text style={styles.adminText}>AD</Text>
            </View>
          </View>
        </View>

        <View style={styles.pageIntro}>
          <Text style={styles.kicker}>All complaints</Text>
          <Text style={styles.title}>Community issues in one place</Text>
          <Text style={styles.subtitle}>
            Monitor all reported complaints, track status updates, and review
            cases that need attention.
          </Text>
        </View>

        <View style={styles.statsCard}>
          <View style={styles.iconBlue}>
            <Ionicons
              name="document-text-outline"
              size={24}
              color={colors.blueIcon}
            />
          </View>
          <View style={{ marginLeft: 15 }}>
            <Text style={styles.smallLabel}>TOTAL REPORTS</Text>
            <Text style={styles.bigText}>
              {dummyComplaints.length} Complaints
            </Text>
          </View>
        </View>

        <View style={styles.statsCard}>
          <View style={styles.iconRed}>
            <Ionicons name="warning-outline" size={24} color={colors.redIcon} />
          </View>
          <View style={{ marginLeft: 15 }}>
            <Text style={styles.smallLabel}>PENDING REVIEW</Text>
            <Text style={styles.bigText}>{pendingCount} Cases</Text>
          </View>
        </View>

        <View style={styles.statsCard}>
          <View style={styles.iconGreen}>
            <Ionicons
              name="checkmark-done-outline"
              size={24}
              color={colors.greenIcon}
            />
          </View>
          <View style={{ marginLeft: 15 }}>
            <Text style={styles.smallLabel}>RESOLVED</Text>
            <Text style={styles.bigText}>{resolvedCount} Complaints</Text>
          </View>
        </View>

        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#777" />
          <Text style={styles.searchPlaceholder}>
            Search by complaint title, location or status...
          </Text>
        </View>

        <View style={styles.filterRow}>
          {(
            ["All", "Pending", "In Progress", "Resolved"] as ComplaintFilter[]
          ).map((filter) => {
            const isActive = activeFilter === filter;
            return (
              <TouchableOpacity
                key={filter}
                style={isActive ? styles.activeChip : styles.chip}
                activeOpacity={0.85}
                onPress={() => setActiveFilter(filter)}
              >
                <Text
                  style={isActive ? styles.activeChipText : styles.chipText}
                >
                  {filter}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Complaint feed</Text>
          <Text style={styles.sectionMeta}>{inProgressCount} in progress</Text>
        </View>

        {filteredComplaints.map((item) => {
          const badgeColor =
            item.status === "PENDING"
              ? colors.redIcon
              : item.status === "IN PROGRESS"
                ? colors.orangeIcon
                : colors.blueIcon;

          const badgeBackground =
            item.status === "PENDING"
              ? colors.red
              : item.status === "IN PROGRESS"
                ? colors.orange
                : colors.blue;

          return (
            <View key={item.id} style={styles.complaintCard}>
              <View style={styles.complaintHeader}>
                <View style={styles.iconCircle}>
                  <Ionicons name={item.icon as any} size={18} color="#3B82F6" />
                </View>

                <View style={{ flex: 1, marginLeft: 10 }}>
                  <View style={styles.titleRow}>
                    <Text style={styles.complaintTitle}>{item.title}</Text>

                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: badgeBackground },
                      ]}
                    >
                      <Text style={[styles.statusText, { color: badgeColor }]}>
                        {item.status}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.complaintDesc} numberOfLines={2}>
                    {item.description}
                  </Text>

                  <View style={styles.bottomRow}>
                    <View style={styles.infoRow}>
                      <Ionicons
                        name="calendar-outline"
                        size={10}
                        color="#777"
                      />
                      <Text style={styles.infoText}>{item.date}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Ionicons
                        name="location-outline"
                        size={10}
                        color="#777"
                      />
                      <Text style={styles.infoText} numberOfLines={1}>
                        {item.location}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.actionRow}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.secondaryButton}
                >
                  <Ionicons
                    name="eye-outline"
                    size={16}
                    color={colors.primary}
                  />
                  <Text style={styles.secondaryButtonText}>View</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.primaryButton}
                >
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={16}
                    color="#fff"
                  />
                  <Text style={styles.primaryButtonText}>Open case</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </ScrollView>

      <AdminBottomNav activeRoute="complaints" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 18,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  logo: {
    marginLeft: 10,
    fontSize: 22,
    fontFamily: "Times New Roman",
    fontWeight: "700",
    color: colors.text,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  adminCircle: {
    marginLeft: 15,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#D9E8F5",
    justifyContent: "center",
    alignItems: "center",
  },
  adminText: {
    fontSize: 13,
    color: colors.primary,
    fontFamily: "Times New Roman",
    fontWeight: "700",
  },
  pageIntro: {
    marginBottom: 16,
  },
  kicker: {
    fontSize: 12,
    fontWeight: "700",
    fontFamily: "Times New Roman",
    color: "#1E4867",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    fontFamily: "Times New Roman",
    color: "#1B1B1B",
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: "Times New Roman",
    color: colors.subtitle,
  },
  statsCard: {
    backgroundColor: "#fff",
    marginBottom: 12,
    padding: 15,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  iconBlue: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.blue,
    justifyContent: "center",
    alignItems: "center",
  },
  iconRed: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.red,
    justifyContent: "center",
    alignItems: "center",
  },
  iconGreen: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.green,
    justifyContent: "center",
    alignItems: "center",
  },
  smallLabel: {
    fontSize: 10,
    color: "#666",
    fontFamily: "Times New Roman",
    fontWeight: "700",
  },
  bigText: {
    marginTop: 2,
    fontSize: 28,
    color: "#222",
    fontFamily: "Times New Roman",
    fontWeight: "700",
  },
  searchBar: {
    marginTop: 8,
    marginBottom: 14,
    backgroundColor: "#ECEFF3",
    borderRadius: 22,
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
  },
  searchPlaceholder: {
    marginLeft: 8,
    color: "#8A8A8A",
    fontSize: 13,
    fontFamily: "Times New Roman",
  },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    flexWrap: "wrap",
    gap: 8,
  },
  activeChip: {
    backgroundColor: "#23435D",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  activeChipText: {
    color: "#fff",
    fontSize: 11,
    fontFamily: "Times New Roman",
    fontWeight: "700",
  },
  chip: {
    backgroundColor: "#E8E8E8",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  chipText: {
    color: "#666",
    fontSize: 11,
    fontFamily: "Times New Roman",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    fontFamily: "Times New Roman",
    color: "#1F2937",
  },
  sectionMeta: {
    fontSize: 11,
    color: "#6B7280",
    fontFamily: "Times New Roman",
    fontWeight: "700",
  },
  complaintCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    shadowColor: colors.primary,
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  complaintHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#EEF5FF",
    justifyContent: "center",
    alignItems: "center",
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
  },
  complaintTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    fontFamily: "Times New Roman",
  },
  complaintDesc: {
    marginTop: 4,
    color: "#666",
    lineHeight: 18,
    fontSize: 12,
    fontFamily: "Times New Roman",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusText: {
    fontWeight: "700",
    fontSize: 9,
    fontFamily: "Times New Roman",
  },
  bottomRow: {
    flexDirection: "row",
    marginTop: 8,
    justifyContent: "space-between",
    gap: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  infoText: {
    marginLeft: 4,
    color: "#777",
    fontSize: 10,
    fontFamily: "Times New Roman",
    flexShrink: 1,
  },
  actionRow: {
    flexDirection: "row",
    marginTop: 14,
    gap: 10,
  },
  secondaryButton: {
    flex: 0.42,
    borderWidth: 1,
    borderColor: "#D6DDE5",
    borderRadius: 22,
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  secondaryButtonText: {
    marginLeft: 6,
    color: colors.primary,
    fontSize: 13,
    fontFamily: "Times New Roman",
    fontWeight: "700",
  },
  primaryButton: {
    flex: 0.58,
    backgroundColor: "#23435D",
    borderRadius: 22,
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  primaryButtonText: {
    marginLeft: 6,
    color: "#fff",
    fontSize: 13,
    fontFamily: "Times New Roman",
    fontWeight: "700",
  },
});
