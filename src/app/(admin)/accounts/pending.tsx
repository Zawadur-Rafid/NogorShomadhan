// src/app/(admin)/accounts/pending.tsx

import { useMemo, useState } from "react";
import {
       Alert,
       Modal,
       Pressable,
       SafeAreaView,
       ScrollView,
       StyleSheet,
       Text,
       TouchableOpacity,
       View,
} from "react-native";

import {
       useAdminAccounts,
       type PendingAdminAccount,
} from "@/store/admin-accounts-store";

type SelectedPendingAccount = PendingAdminAccount | null;

export default function Pending() {
  const { pendingAccounts, approveAccount, rejectAccount } = useAdminAccounts();
  const [selectedAccount, setSelectedAccount] =
    useState<SelectedPendingAccount>(pendingAccounts[0] ?? null);

  const selectedAccountId = selectedAccount?.id;

  const displayedSelectedAccount = useMemo(() => {
    if (!selectedAccountId) {
      return null;
    }

    return (
      pendingAccounts.find((account) => account.id === selectedAccountId) ??
      null
    );
  }, [pendingAccounts, selectedAccountId]);

  const openAccount = (account: PendingAdminAccount) => {
    setSelectedAccount(account);
  };

  const handleApprove = (account: PendingAdminAccount) => {
    Alert.alert(
      "Account approved",
      `${account.fullName} has been moved to registered accounts.`,
    );
    approveAccount(account.id);
    setSelectedAccount((currentSelected) => {
      if (currentSelected?.id !== account.id) {
        return currentSelected;
      }

      const nextAccount =
        pendingAccounts.find((item) => item.id !== account.id) ?? null;
      return nextAccount;
    });
  };

  const handleReject = (account: PendingAdminAccount) => {
    Alert.alert(
      "Account rejected",
      `${account.fullName} has been removed from pending verification.`,
    );
    rejectAccount(account.id);
    setSelectedAccount((currentSelected) => {
      if (currentSelected?.id !== account.id) {
        return currentSelected;
      }

      const nextAccount =
        pendingAccounts.find((item) => item.id !== account.id) ?? null;
      return nextAccount;
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.kicker}>Pending verification</Text>
          <Text style={styles.title}>Accounts waiting to be approved</Text>
          <Text style={styles.subtitle}>
            Tap any card to review the full account information before taking
            action.
          </Text>
        </View>

        {pendingAccounts.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No pending accounts</Text>
            <Text style={styles.emptySubtitle}>
              All submitted accounts have already been reviewed.
            </Text>
          </View>
        ) : (
          pendingAccounts.map((account) => {
            const isActive = selectedAccount?.id === account.id;

            return (
              <TouchableOpacity
                key={account.id}
                activeOpacity={0.85}
                onPress={() => openAccount(account)}
                style={[styles.card, isActive && styles.cardActive]}
              >
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.cardName}>{account.fullName}</Text>
                    <Text style={styles.cardMeta}>{account.role}</Text>
                  </View>
                  <View style={styles.pill}>
                    <Text style={styles.pillText}>Pending</Text>
                  </View>
                </View>

                <View style={styles.cardGrid}>
                  <View style={styles.cardField}>
                    <Text style={styles.label}>NID</Text>
                    <Text style={styles.value}>{account.nidNumber}</Text>
                  </View>
                  <View style={styles.cardField}>
                    <Text style={styles.label}>Username</Text>
                    <Text style={styles.value}>{account.username}</Text>
                  </View>
                </View>

                <Text style={styles.tapHint}>Tap to view full details</Text>

                <View style={styles.actionRow}>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    style={[styles.actionButton, styles.rejectButton]}
                    onPress={() => handleReject(account)}
                  >
                    <Text style={styles.rejectButtonText}>Reject</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.85}
                    style={[styles.actionButton, styles.approveButton]}
                    onPress={() => handleApprove(account)}
                  >
                    <Text style={styles.approveButtonText}>Approve</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      <Modal
        visible={Boolean(displayedSelectedAccount)}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedAccount(null)}
      >
        <Pressable
          style={styles.backdrop}
          onPress={() => setSelectedAccount(null)}
        >
          <Pressable style={styles.modalCard} onPress={() => {}}>
            {displayedSelectedAccount && (
              <>
                <Text style={styles.modalTitle}>
                  {displayedSelectedAccount.fullName}
                </Text>
                <Text style={styles.modalSubtitle}>
                  {displayedSelectedAccount.role} • Requested on{" "}
                  {displayedSelectedAccount.requestedOn}
                </Text>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>NID Number</Text>
                  <Text style={styles.detailValue}>
                    {displayedSelectedAccount.nidNumber}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Email Address</Text>
                  <Text style={styles.detailValue}>
                    {displayedSelectedAccount.emailAddress}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Phone Number</Text>
                  <Text style={styles.detailValue}>
                    {displayedSelectedAccount.phoneNumber}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Residential Address</Text>
                  <Text style={styles.detailValue}>
                    {displayedSelectedAccount.houseNo},{" "}
                    {displayedSelectedAccount.roadNo}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Username</Text>
                  <Text style={styles.detailValue}>
                    {displayedSelectedAccount.username}
                  </Text>
                </View>

                <View style={styles.modalActionRow}>
                  <TouchableOpacity
                    style={[styles.modalActionButton, styles.rejectButton]}
                    activeOpacity={0.85}
                    onPress={() => handleReject(displayedSelectedAccount)}
                  >
                    <Text style={styles.rejectButtonText}>Reject</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalActionButton, styles.approveButton]}
                    activeOpacity={0.85}
                    onPress={() => handleApprove(displayedSelectedAccount)}
                  >
                    <Text style={styles.approveButtonText}>Approve</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6F7FB",
  },
  content: {
    padding: 16,
    paddingBottom: 28,
  },
  header: {
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
    fontSize: 26,
    fontWeight: "800",
    fontFamily: "Times New Roman",
    color: "#1B1B1B",
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: "Times New Roman",
    color: "#666",
  },
  emptyState: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    fontFamily: "Times New Roman",
    color: "#1B1B1B",
  },
  emptySubtitle: {
    marginTop: 8,
    fontSize: 14,
    fontFamily: "Times New Roman",
    color: "#666",
    textAlign: "center",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    borderWidth: 1,
    borderColor: "transparent",
  },
  cardActive: {
    borderColor: "#1E4867",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  cardName: {
    fontSize: 18,
    fontWeight: "800",
    fontFamily: "Times New Roman",
    color: "#1B1B1B",
  },
  cardMeta: {
    marginTop: 4,
    fontSize: 13,
    fontFamily: "Times New Roman",
    color: "#777",
  },
  pill: {
    backgroundColor: "#EAF3FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  pillText: {
    color: "#1E4867",
    fontWeight: "700",
    fontSize: 12,
    fontFamily: "Times New Roman",
  },
  cardGrid: {
    flexDirection: "row",
    gap: 12,
  },
  cardField: {
    flex: 1,
    backgroundColor: "#F6F7FB",
    borderRadius: 14,
    padding: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    fontFamily: "Times New Roman",
    color: "#666",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  value: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Times New Roman",
    color: "#1B1B1B",
  },
  tapHint: {
    marginTop: 12,
    fontSize: 12,
    fontFamily: "Times New Roman",
    color: "#1E4867",
    fontWeight: "600",
  },
  actionRow: {
    flexDirection: "row",
    gap: 16,
    marginTop: 14,
    justifyContent: "center",
  },
  actionButton: {
    flex: 1, // Using flex: 1 to fill available space
    maxWidth: 180, // Maximum width to prevent buttons from being too wide
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  approveButton: {
    backgroundColor: "#1E8E3E",
  },
  rejectButton: {
    backgroundColor: "#BA1A1A",
  },
  approveButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
    fontFamily: "Times New Roman",
  },
  rejectButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
    fontFamily: "Times New Roman",
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(18, 24, 38, 0.55)",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "800",
    fontFamily: "Times New Roman",
    color: "#1B1B1B",
  },
  modalSubtitle: {
    marginTop: 6,
    marginBottom: 16,
    fontSize: 13,
    fontFamily: "Times New Roman",
    color: "#666",
  },
  detailRow: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EEF1F5",
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: "700",
    fontFamily: "Times New Roman",
    color: "#777",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "Times New Roman",
    color: "#1B1B1B",
  },
  modalActionRow: {
    flexDirection: "row",
    gap: 16,
    marginTop: 4,
    justifyContent: "center",
  },
  modalActionButton: {
    flex: 1, // Using flex: 1 to fill available space
    maxWidth: 180, // Maximum width to prevent buttons from being too wide
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: "center",
  },
});
