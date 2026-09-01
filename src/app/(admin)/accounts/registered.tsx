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

const colors = {
  background: "#F5F6FA",
  white: "#FFFFFF",
  text: "#1E1E1E",
  subtitle: "#707070",
  blue: "#E8F2FF",
  orange: "#FFF3E5",
  green: "#EAF8EF",
  blueIcon: "#2D6CDF",
  orangeIcon: "#C97816",
  greenIcon: "#1E8E3E",
};

type AccountSortOrder = "newest" | "oldest";

export default function RegisteredAccountsPage() {
  const { registeredAccounts, metrics, loading, error, refresh } =
    useAdminAccounts();
  const [query, setQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<AccountSortOrder>("newest");
  const [selectedAccount, setSelectedAccount] = useState<AdminAccount | null>(
    null,
  );

  const filteredAccounts = useMemo(() => {
    const search = query.trim().toLowerCase();

    let list = registeredAccounts.filter((account) => {
      if (!search) return true;
      return (
        account.fullName.toLowerCase().includes(search) ||
        account.email.toLowerCase().includes(search) ||
        account.username.toLowerCase().includes(search) ||
        account.role.toLowerCase().includes(search)
      );
    });

    return [...list].sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;

      if (aTime !== bTime && aTime > 0 && bTime > 0) {
        return sortOrder === "newest" ? bTime - aTime : aTime - bTime;
      }

      // Fallback: reverse order for newest if no timestamp available
      const aIndex = registeredAccounts.indexOf(a);
      const bIndex = registeredAccounts.indexOf(b);
      return sortOrder === "newest" ? bIndex - aIndex : aIndex - bIndex;
    });
  }, [registeredAccounts, query, sortOrder]);

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
            <Text style={styles.smallLabel}>REGISTERED</Text>
            <Text style={styles.bigText}>
              {metrics.registeredCount} Accounts
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

          <View style={styles.statsTextBlock}>
            <Text style={styles.smallLabel}>RECENTLY VERIFIED</Text>
            <Text style={styles.bigText}>
              {metrics.verifiedTodayCount} Citizens
            </Text>
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

          <View style={styles.statsTextBlock}>
            <Text style={styles.smallLabel}>AUTHORITY ACCOUNTS</Text>
            <Text style={styles.bigText}>{metrics.authorityCount} Offices</Text>
          </View>
        </View>

        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#777" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search by name, role, email or username"
            placeholderTextColor="#8A8A8A"
            style={styles.searchInput}
          />
        </View>

        {/* Sort Controls */}
        <View style={styles.sortContainer}>
          <View style={styles.sortOptions}>
            <TouchableOpacity
              style={[
                styles.sortBtn,
                sortOrder === "newest" && styles.activeSortBtn,
              ]}
              onPress={() => setSortOrder("newest")}
              activeOpacity={0.8}
            >
              <Ionicons
                name="arrow-down"
                size={14}
                color={sortOrder === "newest" ? "#FFFFFF" : "#555555"}
              />
              <Text
                style={[
                  styles.sortBtnText,
                  sortOrder === "newest" && styles.activeSortBtnText,
                ]}
              >
                Newest First
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.sortBtn,
                sortOrder === "oldest" && styles.activeSortBtn,
              ]}
              onPress={() => setSortOrder("oldest")}
              activeOpacity={0.8}
            >
              <Ionicons
                name="arrow-up"
                size={14}
                color={sortOrder === "oldest" ? "#FFFFFF" : "#555555"}
              />
              <Text
                style={[
                  styles.sortBtnText,
                  sortOrder === "oldest" && styles.activeSortBtnText,
                ]}
              >
                Oldest First
              </Text>
            </TouchableOpacity>
          </View>
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
            <Text style={styles.emptyTitle}>No registered accounts</Text>
            <Text style={styles.emptySubtitle}>
              Approved accounts will appear here.
            </Text>
          </View>
        ) : null}

        {filteredAccounts.map((account) => (
          <TouchableOpacity
            key={account.id}
            activeOpacity={0.88}
            onPress={() => setSelectedAccount(account)}
            style={styles.card}
          >
            <View style={styles.cardHeader}>
              <View style={styles.profileRow}>
                <View style={styles.avatar}>
                  <Ionicons name="person" size={30} color="#555" />
                </View>

                <View style={styles.profileTextWrap}>
                  <Text style={styles.personName}>{account.fullName}</Text>
                  <Text style={styles.personInfo}>
                    {account.role.toUpperCase()} • VERIFIED
                  </Text>

                  <View style={styles.roleBadge}>
                    <Text style={styles.roleBadgeText}>APPROVED ACCOUNT</Text>
                  </View>
                </View>
              </View>

              <View style={styles.pill}>
                <Text style={styles.pillText}>Verified</Text>
              </View>
            </View>

            <View style={styles.cardGrid}>
              <View style={styles.cardField}>
                <Text style={styles.label}>Email</Text>
                <Text style={styles.value}>{account.email}</Text>
              </View>

              <View style={styles.cardField}>
                <Text style={styles.label}>Phone</Text>
                <Text style={styles.value}>{account.phoneNum || "-"}</Text>
              </View>
            </View>

            <View style={styles.viewButton}>
              <Text style={styles.viewButtonText}>View details</Text>
              <Ionicons name="chevron-forward" size={16} color="#fff" />
            </View>
          </TouchableOpacity>
        ))}
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
                  {selectedAccount.role.toUpperCase()} • VERIFIED
                </Text>

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
                    {selectedAccount.phoneNum || "-"}
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
                  onPress={() => setSelectedAccount(null)}
                >
                  <Text style={styles.closeButtonText}>Close</Text>
                </TouchableOpacity>
              </>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>

      <AdminBottomNav activeRoute="registered-accounts" />
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
  },
  statsCard: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#EFEFEF",
  },
  iconBlue: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: colors.blue,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  iconOrange: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: colors.orange,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  iconGreen: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: colors.green,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  statsTextBlock: {
    flex: 1,
  },
  smallLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.subtitle,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  bigText: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 4,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: colors.text,
  },
  sortContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 6,
    marginBottom: 10,
    paddingHorizontal: 4,
    flexWrap: "wrap",
    gap: 8,
  },
  sortLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.subtitle,
  },
  sortOptions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sortBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  activeSortBtn: {
    backgroundColor: "#1F4868",
    borderColor: "#1F4868",
  },
  sortBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#555555",
  },
  activeSortBtnText: {
    color: "#FFFFFF",
  },
  refreshButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#E8F2FF",
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 14,
  },
  refreshText: {
    color: "#1F4868",
    fontSize: 12,
    fontWeight: "700",
  },
  errorText: {
    color: "#C0392B",
    fontSize: 13,
    marginBottom: 10,
  },
  loadingText: {
    color: colors.subtitle,
    fontSize: 13,
    marginBottom: 10,
  },
  emptyState: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 24,
    alignItems: "center",
    marginTop: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.subtitle,
    marginTop: 4,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#EFEFEF",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#EEEEEE",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  profileTextWrap: {
    flex: 1,
  },
  personName: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  personInfo: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.subtitle,
    marginTop: 2,
  },
  roleBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#EAF8EF",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 6,
  },
  roleBadgeText: {
    color: "#1E8E3E",
    fontSize: 10,
    fontWeight: "700",
  },
  pill: {
    backgroundColor: "#EAF8EF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  pillText: {
    color: "#1E8E3E",
    fontSize: 11,
    fontWeight: "700",
  },
  cardGrid: {
    marginTop: 14,
    gap: 10,
  },
  cardField: {
    borderRadius: 10,
    backgroundColor: "#F8FAFD",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  label: {
    color: "#667085",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 2,
  },
  value: {
    color: "#101828",
    fontSize: 13,
    fontWeight: "600",
  },
  viewButton: {
    marginTop: 12,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#1F4868",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  viewButtonText: {
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
