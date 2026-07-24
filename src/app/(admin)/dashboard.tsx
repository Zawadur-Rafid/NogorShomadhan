import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import AdminBottomNav from "@/components/AdminBottomNav";

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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 30 }}
      >
        {/* HEADER */}

        <View style={styles.header}>
          <View style={styles.leftHeader}>
            <Ionicons name="menu" size={22} color={colors.primary} />

            <Text style={styles.logo}>Nogor Shomadhan</Text>
          </View>

          <View style={styles.rightHeader}>
            <Ionicons name="notifications-outline" size={20} color="#B12020" />

            <View style={styles.adminBadge}>
              <Text style={styles.adminText}>AD</Text>
            </View>
          </View>
        </View>

        {/* Pending Verification */}

        <View style={styles.card}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardLabel}>PENDING ACCOUNNT VERIFICATIONS</Text>

            <Text style={styles.bigNumber}>14</Text>

            <View style={styles.warningRow}>
              <Ionicons name="warning" size={12} color="#C0392B" />

              <Text style={styles.warningText}>Requires Attention</Text>
            </View>
          </View>

          <View style={styles.blueCircle}>
            <Ionicons
              name="shield-checkmark-outline"
              size={28}
              color="#1F63C6"
            />
          </View>
        </View>

        {/* System Health */}

        <View style={styles.card}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardLabel}>PENDING COMPLAINT VERIFICATION</Text>

            <Text style={styles.bigNumber}>25</Text>

            <View style={styles.warningRow}>
              <Ionicons name="warning" size={12} color="#C0392B" />

              <Text style={styles.warningText}>Requires Attention</Text>
            </View>
          </View>

          <View style={styles.blueCircle}>
            <Ionicons
              name="shield-checkmark-outline"
              size={28}
              color="#1F63C6"
            />
          </View>
        </View>

        {/* Total Users */}

        <View style={styles.card}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardLabel}>TOTAL USERS</Text>

            <Text style={styles.bigNumber}>12,840</Text>

            <Text style={styles.greenText}>↗ +12% from last month</Text>
          </View>

          <View style={styles.orangeCircle}>
            <Ionicons name="people-outline" size={28} color="#8B5A14" />
          </View>
        </View>

        {/* Administrative Actions */}

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

        {/* Review Complaints */}

        <TouchableOpacity activeOpacity={0.85} style={styles.actionCard}>
          <View style={styles.actionIconOrange}>
            <Ionicons name="document-text-outline" size={28} color="#C6761A" />
          </View>

          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Review Complaints</Text>

            <Text style={styles.actionDescription}>
              Monitor complaint progress, assign authorities and resolve cases.
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

        {/* System Settings */}

        <TouchableOpacity activeOpacity={0.85} style={styles.actionCard}>
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

        {/* Community Forum */}
        <TouchableOpacity activeOpacity={0.85} style={styles.actionCard}>
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
      </ScrollView>

      <AdminBottomNav activeRoute="home" />
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingTop: 15,
    marginBottom: 15,
  },

  leftHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  logo: {
    marginLeft: 10,
    fontSize: 20,
    fontWeight: "700",
    fontFamily: "Times New Roman",
    color: colors.primary,
  },

  rightHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  adminBadge: {
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
    fontWeight: "700",
    fontFamily: "Times New Roman",
    color: colors.primary,
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
    fontFamily: "Times New Roman",
    color: "#666",
    letterSpacing: 1,
  },

  bigNumber: {
    marginTop: 5,
    fontSize: 30,
    fontWeight: "700",
    fontFamily: "Times New Roman",
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
    fontFamily: "Times New Roman",
    color: "#C0392B",
  },

  greenText: {
    marginTop: 8,
    fontSize: 12,
    fontFamily: "Times New Roman",
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
    fontFamily: "Times New Roman",
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
    fontFamily: "Times New Roman",
    color: "#222",
  },

  actionDescription: {
    marginTop: 5,
    fontSize: 13,
    lineHeight: 19,
    fontFamily: "Times New Roman",
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
