import Ionicons from "@expo/vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import AdminBottomNav from "@/components/AdminBottomNav";
import { confirmAction } from "@/utils/confirm";

const colors = {
  background: "#F6F7FB",
  primary: "#1E4867",
  white: "#FFFFFF",
  text: "#1B1B1B",
  subtitle: "#777777",
  border: "#E8E8E8",
  red: "#B42318",
  green: "#1E8E3E",
  blue: "#1E63C6",
};

export default function AdminSettingsPage() {
  const router = useRouter();

  // Settings State
  const [aiAutoCategorize, setAiAutoCategorize] = useState(true);
  const [duplicateDetection, setDuplicateDetection] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [newAccountAlerts, setNewAccountAlerts] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [duplicateThreshold, setDuplicateThreshold] = useState<"High (85%)" | "Medium (70%)" | "Low (50%)">("High (85%)");

  const [cacheMessage, setCacheMessage] = useState<string | null>(null);

  const handleClearCache = async () => {
    const confirmed = await confirmAction(
      "Are you sure you want to clear application local cache?",
      undefined,
      "Clear Cache"
    );
    if (!confirmed) return;

    setCacheMessage("Local cache cleared successfully.");
    setTimeout(() => setCacheMessage(null), 3000);
  };

  const handleSignOut = async () => {
    const confirmed = await confirmAction(
      "Are you sure you want to sign out of the administrator portal?",
      undefined,
      "Sign Out"
    );
    if (!confirmed) return;

    await AsyncStorage.removeItem("acc_id");
    router.replace("/(public)/sign-in");
  };

  const cycleThreshold = () => {
    if (duplicateThreshold === "High (85%)") setDuplicateThreshold("Medium (70%)");
    else if (duplicateThreshold === "Medium (70%)") setDuplicateThreshold("Low (50%)");
    else setDuplicateThreshold("High (85%)");
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Top Back Link */}
        <TouchableOpacity
          onPress={() => router.push("/(admin)/dashboard")}
          style={styles.backLink}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={18} color={colors.primary} />
          <Text style={styles.backLinkText}>Dashboard</Text>
        </TouchableOpacity>

        <Text style={styles.pageTitle}>System Settings</Text>

        {/* Admin Account Profile Card */}
        <View style={styles.card}>
          <View style={styles.profileRow}>
            <View style={styles.avatarCircle}>
              <Ionicons name="person-circle" size={44} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.adminName}>System Administrator</Text>
              <Text style={styles.adminEmail}>admin@example.com • Username: admin</Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleBadgeText}>ADMINISTRATOR PORTAL</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={styles.signOutBtn}
            onPress={() => void handleSignOut()}
            activeOpacity={0.85}
          >
            <Ionicons name="log-out-outline" size={16} color={colors.red} />
            <Text style={styles.signOutBtnText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        {/* AI & Automation Settings */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="hardware-chip-outline" size={20} color={colors.primary} />
            <Text style={styles.cardTitle}>AI & Intelligent Categorization</Text>
          </View>

          <View style={styles.settingRow}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={styles.settingLabel}>Gemini AI Auto-Categorization</Text>
              <Text style={styles.settingSub}>
                Automatically classify incoming complaints using Gemini AI.
              </Text>
            </View>
            <Switch
              value={aiAutoCategorize}
              onValueChange={setAiAutoCategorize}
              trackColor={{ false: "#D1D5DB", true: "#93C5FD" }}
              thumbColor={aiAutoCategorize ? colors.primary : "#F3F4F6"}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={styles.settingLabel}>Duplicate Issue Detection</Text>
              <Text style={styles.settingSub}>
                Detect duplicate reports using location radius and category matching.
              </Text>
            </View>
            <Switch
              value={duplicateDetection}
              onValueChange={setDuplicateDetection}
              trackColor={{ false: "#D1D5DB", true: "#93C5FD" }}
              thumbColor={duplicateDetection ? colors.primary : "#F3F4F6"}
            />
          </View>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.settingRowTouchable}
            onPress={cycleThreshold}
            activeOpacity={0.8}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>Duplicate Matching Sensitivity</Text>
              <Text style={styles.settingSub}>Tap to toggle AI matching threshold.</Text>
            </View>
            <View style={styles.thresholdBadge}>
              <Text style={styles.thresholdBadgeText}>{duplicateThreshold}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* System Notifications & Alerts */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="notifications-outline" size={20} color={colors.primary} />
            <Text style={styles.cardTitle}>Notifications & Administrative Alerts</Text>
          </View>

          <View style={styles.settingRow}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={styles.settingLabel}>Urgent Complaint Alerts</Text>
              <Text style={styles.settingSub}>
                Receive notifications when high-urgency issue reports are submitted.
              </Text>
            </View>
            <Switch
              value={emailAlerts}
              onValueChange={setEmailAlerts}
              trackColor={{ false: "#D1D5DB", true: "#93C5FD" }}
              thumbColor={emailAlerts ? colors.primary : "#F3F4F6"}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={styles.settingLabel}>New Account Registrations</Text>
              <Text style={styles.settingSub}>
                Alert when new resident or authority accounts request verification.
              </Text>
            </View>
            <Switch
              value={newAccountAlerts}
              onValueChange={setNewAccountAlerts}
              trackColor={{ false: "#D1D5DB", true: "#93C5FD" }}
              thumbColor={newAccountAlerts ? colors.primary : "#F3F4F6"}
            />
          </View>
        </View>

        {/* Diagnostics & System Health */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="pulse-outline" size={20} color={colors.primary} />
            <Text style={styles.cardTitle}>System Diagnostics & Health</Text>
          </View>

          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Supabase PostgreSQL Database</Text>
            <View style={styles.statusPill}>
              <View style={[styles.statusDot, { backgroundColor: colors.green }]} />
              <Text style={styles.statusPillText}>Connected</Text>
            </View>
          </View>

          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Google Gemini AI Engine</Text>
            <View style={styles.statusPill}>
              <View style={[styles.statusDot, { backgroundColor: colors.green }]} />
              <Text style={styles.statusPillText}>Active</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => void handleClearCache()}
            activeOpacity={0.8}
          >
            <Ionicons name="trash-outline" size={16} color={colors.primary} />
            <Text style={styles.actionBtnText}>Clear Application Cache</Text>
          </TouchableOpacity>
          {cacheMessage ? (
            <Text style={styles.cacheSuccessText}>{cacheMessage}</Text>
          ) : null}
        </View>

        {/* Maintenance Controls */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="construct-outline" size={20} color={colors.red} />
            <Text style={[styles.cardTitle, { color: colors.red }]}>
              System Maintenance Mode
            </Text>
          </View>

          <View style={styles.settingRow}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={styles.settingLabel}>Enable Maintenance Mode</Text>
              <Text style={styles.settingSub}>
                Temporarily pause new submissions for scheduled system updates.
              </Text>
            </View>
            <Switch
              value={maintenanceMode}
              onValueChange={async (val) => {
                if (val) {
                  const confirmed = await confirmAction(
                    "Are you sure you want to enable Maintenance Mode?",
                    undefined,
                    "Enable Maintenance"
                  );
                  if (confirmed) setMaintenanceMode(true);
                } else {
                  setMaintenanceMode(false);
                }
              }}
              trackColor={{ false: "#D1D5DB", true: "#FCA5A5" }}
              thumbColor={maintenanceMode ? colors.red : "#F3F4F6"}
            />
          </View>
        </View>
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
  content: {
    width: "100%",
    maxWidth: 920,
    alignSelf: "center",
    padding: 16,
    paddingBottom: 104,
    gap: 14,
  },
  backLink: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 4,
  },
  backLinkText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "700",
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.primary,
    marginBottom: 4,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  adminName: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
  },
  adminEmail: {
    fontSize: 12,
    color: colors.subtitle,
    marginTop: 2,
  },
  roleBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#EAF3FF",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 6,
  },
  roleBadgeText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: "700",
  },
  signOutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#FEE2E2",
  },
  signOutBtnText: {
    color: colors.red,
    fontWeight: "700",
    fontSize: 13,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.primary,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  settingRowTouchable: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
  settingSub: {
    fontSize: 12,
    color: colors.subtitle,
    marginTop: 2,
    lineHeight: 17,
  },
  divider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginVertical: 12,
  },
  thresholdBadge: {
    backgroundColor: "#EAF3FF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  thresholdBadgeText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "700",
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  statusLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#EAF8EF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusPillText: {
    color: colors.green,
    fontSize: 12,
    fontWeight: "700",
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
    marginTop: 4,
  },
  actionBtnText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "700",
  },
  cacheSuccessText: {
    color: colors.green,
    fontSize: 12,
    textAlign: "center",
    marginTop: 6,
    fontWeight: "600",
  },
});
