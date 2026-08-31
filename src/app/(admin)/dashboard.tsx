import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import AdminBottomNav from "@/components/AdminBottomNav";
import { supabase } from "@/lib/supabase";

const colors = {
  background: "#F6F7FB",
  primary: "#1E4867",
  blueCard: "#EAF3FF",
  orangeCard: "#FFF1E5",
  white: "#FFFFFF",
  text: "#1B1B1B",
  subtitle: "#777777",
  orange: "#E39A42",
  lightGray: "#EFEFEF",
  shadow: "#000",
};

export default function AdminDashboard() {
  const router = useRouter();

  const [pendingAccountsCount, setPendingAccountsCount] = useState<number | null>(null);
  const [pendingComplaintsCount, setPendingComplaintsCount] = useState<number | null>(null);
  const [totalUsersCount, setTotalUsersCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardMetrics = async () => {
    setLoading(true);
    try {
      const [
        { count: pendingAccCount },
        { count: pendingCompCount },
        { count: totalUsers },
      ] = await Promise.all([
        supabase
          .from("account")
          .select("acc_id", { count: "exact", head: true })
          .eq("status", "unverified"),
        supabase
          .from("complaints")
          .select("comp_id", { count: "exact", head: true })
          .eq("status", "unverified"),
        supabase
          .from("account")
          .select("acc_id", { count: "exact", head: true }),
      ]);

      setPendingAccountsCount(pendingAccCount ?? 0);
      setPendingComplaintsCount(pendingCompCount ?? 0);
      setTotalUsersCount(totalUsers ?? 0);
    } catch (err) {
      console.error("Failed to fetch admin dashboard metrics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchDashboardMetrics();
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 30 }}
      >
        {/* Pending Account Verification Card */}
        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.card}
          onPress={() => router.push("/(admin)/accounts/pending")}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.cardLabel}>PENDING ACCOUNT VERIFICATIONS</Text>

            <Text style={styles.bigNumber}>
              {loading ? "..." : (pendingAccountsCount ?? 0)}
            </Text>

            {pendingAccountsCount && pendingAccountsCount > 0 ? (
              <View style={styles.warningRow}>
                <Ionicons name="warning" size={12} color="#C0392B" />
                <Text style={styles.warningText}>Requires Attention</Text>
              </View>
            ) : (
              <View style={styles.warningRow}>
                <Ionicons name="checkmark-circle" size={12} color="#1E8E3E" />
                <Text style={[styles.warningText, { color: "#1E8E3E" }]}>
                  All Clear
                </Text>
              </View>
            )}
          </View>

          <View style={styles.blueCircle}>
            <Ionicons
              name="shield-checkmark-outline"
              size={28}
              color="#1F63C6"
            />
          </View>
        </TouchableOpacity>

        {/* Pending Complaint Verification Card */}
        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.card}
          onPress={() => router.push("/(admin)/complaints/review")}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.cardLabel}>PENDING COMPLAINT VERIFICATION</Text>

            <Text style={styles.bigNumber}>
              {loading ? "..." : (pendingComplaintsCount ?? 0)}
            </Text>

            {pendingComplaintsCount && pendingComplaintsCount > 0 ? (
              <View style={styles.warningRow}>
                <Ionicons name="warning" size={12} color="#C0392B" />
                <Text style={styles.warningText}>Requires Attention</Text>
              </View>
            ) : (
              <View style={styles.warningRow}>
                <Ionicons name="checkmark-circle" size={12} color="#1E8E3E" />
                <Text style={[styles.warningText, { color: "#1E8E3E" }]}>
                  All Clear
                </Text>
              </View>
            )}
          </View>

          <View style={styles.blueCircle}>
            <Ionicons
              name="document-text-outline"
              size={28}
              color="#1F63C6"
            />
          </View>
        </TouchableOpacity>

        {/* Total Users Card */}
        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.card}
          onPress={() => router.push("/(admin)/accounts/registered")}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.cardLabel}>TOTAL USERS</Text>

            <Text style={styles.bigNumber}>
              {loading ? "..." : (totalUsersCount ?? 0).toLocaleString()}
            </Text>

            <Text style={styles.greenText}>↗ Active system accounts</Text>
          </View>

          <View style={styles.orangeCircle}>
            <Ionicons name="people-outline" size={28} color="#8B5A14" />
          </View>
        </TouchableOpacity>

        {/* Administrative Actions Title */}
        <Text style={styles.sectionTitle}>Administrative Actions</Text>

        {/* Verify Accounts */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.actionCard}
          onPress={() => router.push("/(admin)/accounts/pending")}
        >
          <View style={styles.actionIconBlue}>
            <Ionicons
              name="shield-checkmark-outline"
              size={28}
              color="#1E63C6"
            />
          </View>

          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Verify Accounts</Text>

            <Text style={styles.actionDescription}>
              Review and approve new resident and authority account requests.
            </Text>
          </View>

          <Ionicons name="chevron-forward" size={24} color="#888" />
        </TouchableOpacity>

        {/* Registered Accounts */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.actionCard}
          onPress={() => router.push("/(admin)/accounts/registered")}
        >
          <View style={styles.actionIconGray}>
            <Ionicons name="people-outline" size={28} color="#555" />
          </View>

          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Registered Accounts</Text>

            <Text style={styles.actionDescription}>
              Browse all approved resident and authority accounts with their
              profile details.
            </Text>
          </View>

          <Ionicons name="chevron-forward" size={24} color="#888" />
        </TouchableOpacity>

        {/* Review Complaints */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.actionCard}
          onPress={() => router.push("/(admin)/complaints/review")}
        >
          <View style={styles.actionIconOrange}>
            <Ionicons name="document-text-outline" size={28} color="#C6761A" />
          </View>

          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Review Complaints</Text>

            <Text style={styles.actionDescription}>
              Verify newly submitted resident reports before they enter the system.
            </Text>
          </View>

          <Ionicons name="chevron-forward" size={24} color="#888" />
        </TouchableOpacity>

        {/* All Complaints */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.actionCard}
          onPress={() => router.push("/(admin)/complaints/all")}
        >
          <View style={styles.actionIconOrange}>
            <Ionicons name="document-text-outline" size={28} color="#C6761A" />
          </View>

          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>All Complaints</Text>

            <Text style={styles.actionDescription}>
              Monitor complaint progress, authority updates and resolve cases.
            </Text>
          </View>

          <Ionicons name="chevron-forward" size={24} color="#888" />
        </TouchableOpacity>

        {/* Community Forum */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.actionCard}
          onPress={() => router.push("/(admin)/forum")}
        >
          <View style={styles.actionIconBlue}>
            <Ionicons name="chatbubbles-outline" size={28} color="#1E63C6" />
          </View>

          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Community Forum</Text>

            <Text style={styles.actionDescription}>
              Moderate discussions, review reported posts, manage announcements,
              and engage with residents.
            </Text>
          </View>

          <Ionicons name="chevron-forward" size={24} color="#888" />
        </TouchableOpacity>

        {/* View Analytics */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.actionCard}
          onPress={() => router.push("/(admin)/analytics")}
        >
          <View style={styles.actionIconOrange}>
            <Ionicons name="bar-chart-outline" size={28} color="#C6761A" />
          </View>

          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>View Analytics</Text>

            <Text style={styles.actionDescription}>
              Monitor system performance, complaint trends, user activity, and
              generate administrative reports.
            </Text>
          </View>

          <Ionicons name="chevron-forward" size={24} color="#888" />
        </TouchableOpacity>

        {/* System Settings */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.actionCard}
          onPress={() => router.push("/(admin)/settings")}
        >
          <View style={styles.actionIconGray}>
            <Ionicons name="settings-outline" size={28} color="#555" />
          </View>

          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>System Settings</Text>

            <Text style={styles.actionDescription}>
              Manage application settings, notifications and user permissions.
            </Text>
          </View>

          <Ionicons name="chevron-forward" size={24} color="#888" />
        </TouchableOpacity>
      </ScrollView>

      <AdminBottomNav activeRoute="home" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  card: {
    backgroundColor: colors.white,
    marginHorizontal: 16,
    marginBottom: 15,
    borderRadius: 16,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: colors.shadow,
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    elevation: 3,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#666",
    letterSpacing: 1,
  },
  bigNumber: {
    marginTop: 5,
    fontSize: 30,
    fontWeight: "700",
    color: "#222",
  },
  warningRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  warningText: {
    marginLeft: 5,
    fontSize: 12,
    color: "#C0392B",
  },
  greenText: {
    marginTop: 8,
    fontSize: 12,
    color: "#1E8E3E",
  },
  blueCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: colors.blueCard,
    justifyContent: "center",
    alignItems: "center",
  },
  orangeCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: colors.orangeCard,
    justifyContent: "center",
    alignItems: "center",
  },
  sectionTitle: {
    marginHorizontal: 18,
    marginTop: 10,
    marginBottom: 14,
    fontSize: 22,
    fontWeight: "700",
    color: "#1F2937",
  },
  actionCard: {
    marginHorizontal: 16,
    marginBottom: 14,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: colors.shadow,
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    elevation: 3,
  },
  actionContent: {
    flex: 1,
    marginLeft: 14,
    marginRight: 10,
  },
  actionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#222",
  },
  actionDescription: {
    marginTop: 5,
    fontSize: 13,
    lineHeight: 19,
    color: "#666",
  },
  actionIconBlue: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#EAF3FF",
    justifyContent: "center",
    alignItems: "center",
  },
  actionIconOrange: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#FFF4E6",
    justifyContent: "center",
    alignItems: "center",
  },
  actionIconGray: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
});
