import { useMemo, useState } from "react";
import {
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import Ionicons from "@expo/vector-icons/Ionicons";

import AdminBottomNav from "@/components/AdminBottomNav";
import { AdminAccount, useAdminAccounts } from "@/store/admin-accounts-store";
import { confirmAction } from "@/utils/confirm";

const colors = {
  background: "#F5F6FA",
  white: "#FFFFFF",
  text: "#1E1E1E",
  subtitle: "#707070",
  border: "#E5E7EB",
  blue: "#E8F2FF",
  orange: "#FFF3E5",
  red: "#FFECEC",
  blueIcon: "#2D6CDF",
  orangeIcon: "#C97816",
  redIcon: "#C0392B",
};

export default function PendingAccountsPage() {
  const {
    pendingAccounts,
    metrics,
    loading,
    error,
    refresh,
    approveAccount,
    rejectAccount,
  } = useAdminAccounts();

  const [query, setQuery] = useState("");
  const [selectedAccount, setSelectedAccount] = useState<AdminAccount | null>(
    null,
  );
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const filteredAccounts = useMemo(() => {
    const search = query.trim().toLowerCase();

    if (!search) {
      return pendingAccounts;
    }

    return pendingAccounts.filter((account) => {
      return (
        account.fullName.toLowerCase().includes(search) ||
        account.nid.toLowerCase().includes(search) ||
        account.email.toLowerCase().includes(search) ||
        account.username.toLowerCase().includes(search)
      );
    });
  }, [pendingAccounts, query]);

  const handleApprove = async (accountId: string) => {
    const confirmed = await confirmAction('Are you sure you want to approve this account?');
    if (!confirmed) return;

    setActionLoadingId(accountId);
    await approveAccount(accountId);
    setActionLoadingId(null);

    if (selectedAccount?.id === accountId) {
      setSelectedAccount(null);
    }
  };

  const handleReject = async (accountId: string) => {
    const confirmed = await confirmAction('Are you sure you want to reject this account?');
    if (!confirmed) return;

    setActionLoadingId(accountId);
    await rejectAccount(accountId);
    setActionLoadingId(null);

    if (selectedAccount?.id === accountId) {
      setSelectedAccount(null);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.statsCard}>
          <View style={styles.iconBlue}>
            <Ionicons name="people-outline" size={24} color={colors.blueIcon} />
          </View>
          <View style={styles.statsTextBlock}>
            <Text style={styles.smallLabel}>PENDING ACCOUNT</Text>
            <Text style={styles.bigText}>{metrics.pendingCount} Accounts</Text>
          </View>
        </View>

        <View style={styles.statsCard}>
          <View style={styles.iconOrange}>
            <Ionicons
              name="shield-checkmark-outline"
              size={24}
              color={colors.orangeIcon}
            />
          </View>
          <View style={styles.statsTextBlock}>
            <Text style={styles.smallLabel}>VERIFIED TODAY</Text>
            <Text style={styles.bigText}>
              {metrics.verifiedTodayCount} Citizens
            </Text>
          </View>
        </View>

        <View style={styles.statsCard}>
          <View style={styles.iconRed}>
            <Ionicons
              name="close-circle-outline"
              size={24}
              color={colors.redIcon}
            />
          </View>
          <View style={styles.statsTextBlock}>
            <Text style={styles.smallLabel}>REJECTED TODAY</Text>
            <Text style={styles.bigText}>
              {metrics.rejectedTodayCount} Accounts
            </Text>
          </View>
        </View>

        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#777" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search by name, NID, email or username"
            placeholderTextColor="#8A8A8A"
            style={styles.searchInput}
          />
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => void refresh()}
          style={styles.refreshButton}
        >
          <Ionicons name="refresh" size={16} color="#1F4868" />
          <Text style={styles.refreshText}>Refresh</Text>
        </TouchableOpacity>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {loading ? (
          <Text style={styles.loadingText}>Loading accounts...</Text>
        ) : null}

        {!loading && filteredAccounts.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No pending accounts</Text>
            <Text style={styles.emptySubtitle}>
              New unverified accounts will appear here.
            </Text>
          </View>
        ) : null}

        {filteredAccounts.map((account) => {
          const busy = actionLoadingId === account.id;

          return (
            <View key={account.id} style={styles.requestCard}>
              <View style={styles.profileRow}>
                <View style={styles.avatar}>
                  <Ionicons name="person" size={30} color="#555" />
                </View>

                <View style={styles.profileTextWrap}>
                  <Text style={styles.personName}>{account.fullName}</Text>
                  <Text style={styles.personInfo}>NID: {account.nid}</Text>

                  <View style={styles.roleBadge}>
                    <Text style={styles.roleBadgeText}>NEW RESIDENT</Text>
                  </View>
                </View>
              </View>

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.infoButton}
                  onPress={() => setSelectedAccount(account)}
                >
                  <Ionicons name="eye-outline" size={18} color="#1F4868" />
                  <Text style={styles.infoText}>View info</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.rejectButton}
                  onPress={() => void handleReject(account.id)}
                  disabled={busy}
                >
                  <Ionicons
                    name="close-circle-outline"
                    size={18}
                    color="#C0392B"
                  />
                  <Text style={styles.rejectText}>
                    {busy ? "Processing" : "Reject"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.approveButton}
                  onPress={() => void handleApprove(account.id)}
                  disabled={busy}
                >
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={18}
                    color="#fff"
                  />
                  <Text style={styles.approveText}>
                    {busy ? "Processing" : "Approve"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </ScrollView>

      <Modal
        visible={Boolean(selectedAccount)}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedAccount(null)}
      >
        <Pressable
          style={styles.backdrop}
          onPress={() => setSelectedAccount(null)}
        >
          <Pressable style={styles.modalCard} onPress={() => {}}>
            {selectedAccount ? (
              <>
                <Text style={styles.modalTitle}>
                  {selectedAccount.fullName}
                </Text>
                <Text style={styles.modalSubtitle}>
                  Complete account details
                </Text>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Full Name</Text>
                  <Text style={styles.detailValue}>
                    {selectedAccount.fullName}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>NID</Text>
                  <Text style={styles.detailValue}>{selectedAccount.nid}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Email</Text>
                  <Text style={styles.detailValue}>
                    {selectedAccount.email}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Phone Number</Text>
                  <Text style={styles.detailValue}>
                    {selectedAccount.phoneNum}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>House Number</Text>
                  <Text style={styles.detailValue}>
                    {selectedAccount.houseNum || "-"}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Road Number</Text>
                  <Text style={styles.detailValue}>
                    {selectedAccount.roadNumber || "-"}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Avenue Number</Text>
                  <Text style={styles.detailValue}>
                    {selectedAccount.avenueNum || "-"}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Username</Text>
                  <Text style={styles.detailValue}>
                    {selectedAccount.username}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.closeButton}
                  activeOpacity={0.85}
                  onPress={() => setSelectedAccount(null)}
                >
                  <Text style={styles.closeButtonText}>Close</Text>
                </TouchableOpacity>
              </>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>

      <AdminBottomNav activeRoute="users" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 25,
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
  statsTextBlock: {
    marginLeft: 15,
  },
  iconBlue: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.blue,
    justifyContent: "center",
    alignItems: "center",
  },
  iconOrange: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.orange,
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
  smallLabel: {
    fontSize: 10,
    color: "#666",
    fontWeight: "700",
  },
  bigText: {
    marginTop: 2,
    fontSize: 28,
    color: "#222",
    fontWeight: "700",
  },
  searchBar: {
    marginTop: 8,
    marginBottom: 10,
    backgroundColor: "#ECEFF3",
    borderRadius: 22,
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
  },
  searchInput: {
    marginLeft: 8,
    color: "#1E1E1E",
    fontSize: 13,
    flex: 1,
  },
  refreshButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    backgroundColor: "#E8F2FF",
  },
  refreshText: {
    color: "#1F4868",
    fontWeight: "700",
    fontSize: 12,
  },
  loadingText: {
    color: colors.subtitle,
    marginBottom: 12,
  },
  errorText: {
    color: "#B42318",
    marginBottom: 12,
  },
  emptyState: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.subtitle,
    marginTop: 6,
  },
  requestCard: {
    backgroundColor: "#fff",
    marginBottom: 16,
    borderRadius: 16,
    padding: 15,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#ECECEC",
    justifyContent: "center",
    alignItems: "center",
  },
  profileTextWrap: {
    flex: 1,
    marginLeft: 12,
  },
  personName: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  personInfo: {
    marginTop: 4,
    fontSize: 13,
    color: colors.subtitle,
  },
  roleBadge: {
    marginTop: 8,
    alignSelf: "flex-start",
    borderRadius: 999,
    backgroundColor: "#E8F2FF",
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.2,
    color: "#235EA8",
  },
  buttonRow: {
    marginTop: 14,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  infoButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EAF1F7",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
  },
  infoText: {
    color: "#1F4868",
    fontWeight: "700",
    fontSize: 12,
  },
  rejectButton: {
    marginLeft: "auto",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFEFEF",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
  },
  rejectText: {
    color: "#C0392B",
    fontWeight: "700",
    fontSize: 12,
  },
  approveButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1F4868",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
  },
  approveText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 12,
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.42)",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  modalCard: {
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    padding: 18,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#182230",
  },
  modalSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: "#667085",
    marginBottom: 14,
  },
  detailRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#EEF2F6",
  },
  detailLabel: {
    color: "#667085",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 2,
  },
  detailValue: {
    color: "#101828",
    fontSize: 14,
    fontWeight: "600",
  },
  closeButton: {
    marginTop: 16,
    backgroundColor: "#1F4868",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    paddingVertical: 11,
  },
  closeButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
});
