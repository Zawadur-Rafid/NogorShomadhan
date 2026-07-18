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

import AdminBottomNav from "@/components/AdminBottomNav";
import Ionicons from "@expo/vector-icons/Ionicons";

import {
  useAdminAccounts,
  type RegisteredAdminAccount,
} from "@/store/admin-accounts-store";

const colors = {
  background: "#F5F6FA",
  white: "#FFFFFF",
  primary: "#1F4868",
  text: "#1E1E1E",
  subtitle: "#707070",

  blue: "#E8F2FF",
  orange: "#FFF3E5",
  green: "#EAF8EF",

  blueIcon: "#2D6CDF",
  orangeIcon: "#C97816",
  greenIcon: "#1E8E3E",
};

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
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="menu" size={22} color={colors.primary} />
            <Text style={styles.logo}>Registered Desk</Text>
          </View>

          <View style={styles.headerRight}>
            <Ionicons name="notifications-outline" size={20} color="#000" />

            <View style={styles.adminCircle}>
              <Text style={styles.adminText}>AD</Text>
            </View>
          </View>
        </View>

        <View style={styles.pageIntro}>
          <Text style={styles.kicker}>Registered accounts</Text>
          <Text style={styles.title}>All approved accounts</Text>
          <Text style={styles.subtitle}>
            Review approved resident and authority profiles with a cleaner,
            card-based layout.
          </Text>
        </View>

        <View style={styles.statsCard}>
          <View style={styles.iconBlue}>
            <Ionicons name="people-outline" size={24} color={colors.blueIcon} />
          </View>

          <View style={{ marginLeft: 15 }}>
            <Text style={styles.smallLabel}>REGISTERED</Text>
            <Text style={styles.bigText}>
              {registeredAccounts.length} Accounts
            </Text>
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

          <View style={{ marginLeft: 15 }}>
            <Text style={styles.smallLabel}>RECENTLY VERIFIED</Text>
            <Text style={styles.bigText}>18 Citizens</Text>
          </View>
        </View>

        <View style={styles.statsCard}>
          <View style={styles.iconGreen}>
            <Ionicons
              name="business-outline"
              size={24}
              color={colors.greenIcon}
            />
          </View>

          <View style={{ marginLeft: 15 }}>
            <Text style={styles.smallLabel}>AUTHORITY ACCOUNTS</Text>
            <Text style={styles.bigText}>6 Offices</Text>
          </View>
        </View>

        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#777" />
          <Text style={styles.searchPlaceholder}>
            Search by name, role or email...
          </Text>
        </View>

        <View style={styles.filterRow}>
          <TouchableOpacity style={styles.activeChip}>
            <Text style={styles.activeChipText}>All</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.chip}>
            <Text style={styles.chipText}>Resident</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.chip}>
            <Text style={styles.chipText}>Authority</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.filterIcon}>
            <Ionicons name="options-outline" size={18} color="#666" />
          </TouchableOpacity>
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
                  <View style={styles.profileRow}>
                    <View style={styles.avatar}>
                      <Ionicons name="person" size={30} color="#555" />
                    </View>

                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.cardName}>{account.fullName}</Text>
                      <Text style={styles.cardMeta}>
                        {account.role} • Verified
                      </Text>

                      <View style={styles.roleBadgeBlue}>
                        <Text style={styles.roleBadgeBlueText}>
                          APPROVED ACCOUNT
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View>
                    <View style={styles.pill}>
                      <Text style={styles.pillText}>Verified</Text>
                    </View>
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

                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.viewButton}
                  onPress={() => setSelectedAccount(account)}
                >
                  <Text style={styles.viewButtonText}>View details</Text>
                  <Ionicons name="chevron-forward" size={16} color="#fff" />
                </TouchableOpacity>
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

      <AdminBottomNav activeRoute="users" />
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
    color: "#666",
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
  iconOrange: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.orange,
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
    marginLeft: 8,
  },
  chipText: {
    color: "#666",
    fontSize: 11,
    fontFamily: "Times New Roman",
  },
  filterIcon: {
    marginLeft: "auto",
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#EFEFEF",
    justifyContent: "center",
    alignItems: "center",
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
    borderRadius: 16,
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
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#EAEAEA",
    justifyContent: "center",
    alignItems: "center",
  },
  cardName: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Times New Roman",
    color: "#1B1B1B",
  },
  cardMeta: {
    marginTop: 2,
    fontSize: 11,
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
  viewButton: {
    marginTop: 14,
    backgroundColor: "#23435D",
    borderRadius: 22,
    paddingVertical: 11,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  viewButtonText: {
    marginRight: 6,
    color: "#fff",
    fontSize: 14,
    fontFamily: "Times New Roman",
    fontWeight: "700",
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
  roleBadgeBlue: {
    alignSelf: "flex-start",
    marginTop: 5,
    backgroundColor: "#E8F2FF",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  roleBadgeBlueText: {
    color: "#1F63C6",
    fontSize: 10,
    fontFamily: "Times New Roman",
    fontWeight: "700",
  },
});
