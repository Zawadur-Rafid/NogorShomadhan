// src/app/(admin)/accounts/registered.tsx

import { useMemo, useState } from "react";
import {
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
    type RegisteredAdminAccount,
} from "@/store/admin-accounts-store";

type SelectedRegisteredAccount = RegisteredAdminAccount | null;

export default function Registered() {
  const { registeredAccounts } = useAdminAccounts();
  const [selectedAccount, setSelectedAccount] =
    useState<SelectedRegisteredAccount>(registeredAccounts[0] ?? null);

  const selectedAccountId = selectedAccount?.id;

  const displayedSelectedAccount = useMemo(() => {
    if (!selectedAccountId) {
      return null;
    }

    return (
      registeredAccounts.find((account) => account.id === selectedAccountId) ??
      null
    );
  }, [registeredAccounts, selectedAccountId]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.kicker}>Registered accounts</Text>
          <Text style={styles.title}>All approved accounts</Text>
          <Text style={styles.subtitle}>
            Tap a card to inspect the full profile details for each registered
            user.
          </Text>
        </View>

        {registeredAccounts.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No registered accounts</Text>
            <Text style={styles.emptySubtitle}>
              Approve a pending account to add it here.
            </Text>
          </View>
        ) : (
          registeredAccounts.map((account) => {
            const isActive = selectedAccount?.id === account.id;

            return (
              <TouchableOpacity
                key={account.id}
                activeOpacity={0.85}
                onPress={() => setSelectedAccount(account)}
                style={[styles.card, isActive && styles.cardActive]}
              >
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.cardName}>{account.fullName}</Text>
                    <Text style={styles.cardMeta}>{account.role}</Text>
                  </View>
                  <View style={styles.pill}>
                    <Text style={styles.pillText}>Verified</Text>
                  </View>
                </View>

                <View style={styles.cardGrid}>
                  <View style={styles.cardField}>
                    <Text style={styles.label}>Email</Text>
                    <Text style={styles.value}>{account.emailAddress}</Text>
                  </View>
                  <View style={styles.cardField}>
                    <Text style={styles.label}>Phone</Text>
                    <Text style={styles.value}>{account.phoneNumber}</Text>
                  </View>
                </View>

                <Text style={styles.tapHint}>Tap to view full details</Text>
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
                  {displayedSelectedAccount.role} • Verified on{" "}
                  {displayedSelectedAccount.verifiedOn}
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

                <TouchableOpacity
                  style={styles.closeButton}
                  activeOpacity={0.85}
                  onPress={() => setSelectedAccount(null)}
                >
                  <Text style={styles.closeButtonText}>Close</Text>
                </TouchableOpacity>
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
    backgroundColor: "#EEF8F1",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  pillText: {
    color: "#1E8E3E",
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
  closeButton: {
    marginTop: 6,
    backgroundColor: "#1E4867",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  closeButtonText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 15,
    fontFamily: "Times New Roman",
  },
});
