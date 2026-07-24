import AdminBottomNav from "@/components/AdminBottomNav";
import Ionicons from "@expo/vector-icons/Ionicons";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const colors = {
  background: "#F5F6FA",
  white: "#FFFFFF",
  primary: "#1F4868",
  text: "#1E1E1E",
  subtitle: "#707070",
  border: "#E5E7EB",

  blue: "#E8F2FF",
  orange: "#FFF3E5",
  red: "#FFECEC",

  blueIcon: "#2D6CDF",
  orangeIcon: "#C97816",
  redIcon: "#C0392B",

  shadow: "#000",
};

export default function VerificationDesk() {
  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 25,
        }}
      >
        {/* Pending */}

        <View style={styles.statsCard}>
          <View style={styles.iconBlue}>
            <Ionicons name="people-outline" size={24} color={colors.blueIcon} />
          </View>

          <View style={{ marginLeft: 15 }}>
            <Text style={styles.smallLabel}>PENDING</Text>

            <Text style={styles.bigText}>24 Accounts</Text>
          </View>
        </View>

        {/* Verified */}

        <View style={styles.statsCard}>
          <View style={styles.iconOrange}>
            <Ionicons
              name="shield-checkmark-outline"
              size={24}
              color={colors.orangeIcon}
            />
          </View>

          <View style={{ marginLeft: 15 }}>
            <Text style={styles.smallLabel}>VERIFIED TODAY</Text>

            <Text style={styles.bigText}>156 Citizens</Text>
          </View>
        </View>

        {/* Rejected */}

        <View style={styles.statsCard}>
          <View style={styles.iconRed}>
            <Ionicons
              name="close-circle-outline"
              size={24}
              color={colors.redIcon}
            />
          </View>

          <View style={{ marginLeft: 15 }}>
            <Text style={styles.smallLabel}>REJECTED</Text>

            <Text style={styles.bigText}>12 Flags</Text>
          </View>
        </View>

        {/* Search */}

        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#777" />

          <Text style={styles.searchPlaceholder}>
            Search by name, ID or email...
          </Text>
        </View>

        {/* Filters */}

        <View style={styles.filterRow}>
          <TouchableOpacity style={styles.chip}>
            <Text style={styles.chipText}>Resident</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.filterIcon}>
            <Ionicons name="options-outline" size={18} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Request Card 1 */}

        <View style={styles.requestCard}>
          <View style={styles.profileRow}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={30} color="#555" />
            </View>

            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.personName}>Ahmed Karim Chowdhury</Text>

              <Text style={styles.personInfo}>Resident • ID: NID-8829-102</Text>

              <View style={styles.roleBadge}>
                <Text style={styles.roleBadgeText}>NEW RESIDENT</Text>
              </View>
            </View>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.rejectButton}>
              <Ionicons name="close-circle-outline" size={18} color="#C0392B" />

              <Text style={styles.rejectText}>Reject</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.approveButton}>
              <Ionicons
                name="checkmark-circle-outline"
                size={18}
                color="#fff"
              />

              <Text style={styles.approveText}>Approve</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Request Card 2 */}

        <View style={styles.requestCard}>
          <View style={styles.profileRow}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={30} color="#555" />
            </View>

            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.personName}>Nusrat Jahan Mim</Text>

              <Text style={styles.personInfo}>Resident • ID: BC-1123-990</Text>

              <View style={styles.roleBadgeBlue}>
                <Text style={styles.roleBadgeBlueText}>NEW RESIDENT</Text>
              </View>
            </View>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.rejectButton}>
              <Ionicons name="close-circle-outline" size={18} color="#C0392B" />

              <Text style={styles.rejectText}>Reject</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.approveButton}>
              <Ionicons
                name="checkmark-circle-outline"
                size={18}
                color="#fff"
              />

              <Text style={styles.approveText}>Approve</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Request Card 3 */}

        <View style={styles.requestCard}>
          <View style={styles.profileRow}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={30} color="#555" />
            </View>

            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.personName}>Rafiqul Islam</Text>

              <Text style={styles.personInfo}>Resident • ID: BC-1123-990</Text>

              <View style={styles.roleBadgeBlue}>
                <Text style={styles.roleBadgeBlueText}>NEW RESIDENT</Text>
              </View>
            </View>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.rejectButton}>
              <Ionicons name="close-circle-outline" size={18} color="#C0392B" />

              <Text style={styles.rejectText}>Reject</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.approveButton}>
              <Ionicons
                name="checkmark-circle-outline"
                size={18}
                color="#fff"
              />

              <Text style={styles.approveText}>Approve</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Load More */}

        <TouchableOpacity activeOpacity={0.8} style={styles.loadMoreButton}>
          <Text style={styles.loadMoreText}>Load more requests</Text>

          <Ionicons name="chevron-down" size={16} color="#666" />
        </TouchableOpacity>
      </ScrollView>

      <AdminBottomNav activeRoute="users" />
    </View>
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
    paddingHorizontal: 16,
    paddingTop: 14,
    marginBottom: 14,
  },

  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },

  logo: {
    marginLeft: 10,
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
    // No fontFamily - uses system default (SF Pro/Roboto)
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
    fontWeight: "700",
    // No fontFamily - uses system default (SF Pro/Roboto)
  },

  statsCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 15,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",

    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },
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
    // No fontFamily - uses system default (SF Pro/Roboto)
  },

  bigText: {
    marginTop: 2,
    fontSize: 28,
    color: "#222",
    fontWeight: "700",
    // No fontFamily - uses system default (SF Pro/Roboto)
  },

  searchBar: {
    marginHorizontal: 16,
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
    // No fontFamily - uses system default (SF Pro/Roboto)
  },

  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 15,
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
    // No fontFamily - uses system default (SF Pro/Roboto)
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

  requestCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 15,

    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    elevation: 3,
  },

  profileRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#EAEAEA",
    justifyContent: "center",
    alignItems: "center",
  },

  personName: {
    fontSize: 16,
    color: "#222",
    fontWeight: "700",
    // No fontFamily - uses system default (SF Pro/Roboto)
  },

  personInfo: {
    marginTop: 2,
    fontSize: 11,
    color: "#666",
    // No fontFamily - uses system default (SF Pro/Roboto)
  },

  roleBadge: {
    alignSelf: "flex-start",
    marginTop: 5,
    backgroundColor: "#F8E5BF",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },

  roleBadgeText: {
    color: "#8A5A00",
    fontSize: 10,
    fontWeight: "700",
    // No fontFamily - uses system default (SF Pro/Roboto)
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
    fontWeight: "700",
    // No fontFamily - uses system default (SF Pro/Roboto)
  },

  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
  },

  rejectButton: {
    flex: 0.47,
    borderWidth: 1,
    borderColor: "#D9534F",
    borderRadius: 22,
    paddingVertical: 11,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },

  rejectText: {
    marginLeft: 5,
    color: "#C0392B",
    fontSize: 14,
    fontWeight: "700",
    // No fontFamily - uses system default (SF Pro/Roboto)
  },

  approveButton: {
    flex: 0.47,
    backgroundColor: "#23435D",
    borderRadius: 22,
    paddingVertical: 11,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },

  approveText: {
    marginLeft: 5,
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
    // No fontFamily - uses system default (SF Pro/Roboto)
  },

  loadMoreButton: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECECEC",
    borderRadius: 22,
    paddingHorizontal: 22,
    paddingVertical: 10,
    marginTop: 8,
  },

  loadMoreText: {
    marginRight: 6,
    color: "#666",
    fontSize: 13,
    fontWeight: "700",
    // No fontFamily - uses system default (SF Pro/Roboto)
  },
});
