import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";

const complaints = [
  {
    id: "1",
    title: "Broken Main Pipe",
    description:
      "Significant water leakage on Sector 4 Main Road near the mosque.",
    date: "Oct 24, 2023",
    location: "Sector 4, Uttara",
    status: "PENDING",
    color: "#F87171",
    icon: "water-outline",
  },
  {
    id: "2",
    title: "Major Pothole",
    description:
      "Deep pothole causing traffic hazards at the intersection of Road 12.",
    date: "Oct 21, 2023",
    location: "Road 12, Banani",
    status: "RESOLVED",
    color: "#60A5FA",
    icon: "construct-outline",
  },
  {
    id: "3",
    title: "Street Light Failure",
    description:
      "Three consecutive lamps are out, making the park perimeter dark at night.",
    date: "Oct 19, 2023",
    location: "Dhanmondi Lake Area",
    status: "PENDING",
    color: "#FBBF24",
    icon: "bulb-outline",
  },
];

export default function Dashboard() {
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#F7F8FA",
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingTop: 12,
    },
    logoSection: {
      flexDirection: "row",
      alignItems: "center",
    },
    logo: {
      marginLeft: 8,
      fontSize: 18,
      fontWeight: "700",
      color: "#23435D",
    },
    rightSection: {
      flexDirection: "row",
      alignItems: "center",
    },
    welcome: {
      paddingHorizontal: 16,
      marginTop: 12,
    },
    smallTitle: {
      fontSize: 10,
      color: "#B9854B",
      fontWeight: "700",
      letterSpacing: 0.8,
    },
    bigTitle: {
      fontSize: 24,
      fontWeight: "700",
      color: "#111827",
      marginTop: 2,
    },
    statsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginHorizontal: 16,
      marginTop: 12,
    },
    whiteCard: {
      width: "48%",
      backgroundColor: "#fff",
      borderRadius: 12,
      padding: 14,
      shadowColor: "#000",
      shadowOpacity: 0.05,
      shadowRadius: 6,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      elevation: 2,
    },
    cardLabel: {
      marginTop: 6,
      fontSize: 11,
      color: "#555",
    },
    cardNumber: {
      fontSize: 24,
      fontWeight: "700",
      marginTop: 4,
      color: "#222",
    },
    sectionHeader: {
      marginTop: 20,
      marginHorizontal: 16,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: "#1F2937",
    },
    viewAll: {
      color: "#3B82F6",
      fontWeight: "600",
      fontSize: 13,
    },
    complaintCard: {
      backgroundColor: "#fff",
      marginHorizontal: 16,
      marginTop: 10,
      borderRadius: 12,
      padding: 12,
      shadowColor: "#000",
      shadowOpacity: 0.04,
      shadowRadius: 6,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      elevation: 2,
    },
    complaintHeader: {
      flexDirection: "row",
    },
    iconCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: "#EEF5FF",
      justifyContent: "center",
      alignItems: "center",
    },
    complaintTitle: {
      fontSize: 14,
      fontWeight: "700",
      color: "#222",
    },
    complaintDesc: {
      marginTop: 2,
      color: "#666",
      lineHeight: 18,
      fontSize: 12,
    },
    statusBadge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 10,
    },
    statusText: {
      fontWeight: "700",
      fontSize: 9,
    },
    bottomRow: {
      flexDirection: "row",
      marginTop: 6,
      justifyContent: "space-between",
    },
    infoRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    infoText: {
      marginLeft: 3,
      color: "#777",
      fontSize: 10,
    },
    mapCard: {
      height: 160,
      marginHorizontal: 16,
      marginTop: 12,
      borderRadius: 14,
      backgroundColor: "#E8EDF4",
      justifyContent: "center",
      alignItems: "center",
    },
    mapTitle: {
      marginTop: 8,
      fontSize: 16,
      fontWeight: "700",
      color: "#374151",
    },
    mapSubtitle: {
      marginTop: 4,
      fontSize: 11,
      color: "#6B7280",
      textAlign: "center",
      paddingHorizontal: 20,
    },
    helpCard: {
      marginHorizontal: 16,
      marginVertical: 20,
      backgroundColor: "#23435D",
      borderRadius: 14,
      padding: 16,
      flexDirection: "row",
      alignItems: "center",
    },
    helpTitle: {
      color: "#fff",
      fontWeight: "700",
      fontSize: 18,
    },
    helpText: {
      color: "#D9E4EC",
      marginTop: 6,
      lineHeight: 18,
      width: "90%",
      fontSize: 12,
    },
    helpButton: {
      marginTop: 12,
      backgroundColor: "#fff",
      alignSelf: "flex-start",
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
    },
    helpButtonText: {
      color: "#23435D",
      fontWeight: "700",
      fontSize: 12,
    },
    plusButton: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: "#C57C1B",
      justifyContent: "center",
      alignItems: "center",
      marginLeft: 8,
    },
    bottomNav: {
      height: 60,
      backgroundColor: "#fff",
      borderTopWidth: 1,
      borderTopColor: "#ECECEC",
      flexDirection: "row",
      justifyContent: "space-around",
      alignItems: "center",
      paddingBottom: 4,
    },
    navItem: {
      alignItems: "center",
    },
    activeNav: {
      marginTop: 2,
      color: "#23435D",
      fontWeight: "700",
      fontSize: 10,
    },
    navText: {
      marginTop: 2,
      color: "#8A8A8A",
      fontSize: 10,
    },
  });

  const renderComplaint = ({ item }: any) => (
    <View style={styles.complaintCard}>
      <View style={styles.complaintHeader}>
        <View style={styles.iconCircle}>
          <Ionicons name={item.icon} size={18} color="#3B82F6" />
        </View>
        <View style={{ flex: 1, marginLeft: 8 }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text style={styles.complaintTitle}>{item.title}</Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: item.color + "33" },
              ]}
            >
              <Text style={[styles.statusText, { color: item.color }]}>
                {item.status}
              </Text>
            </View>
          </View>
          <Text style={styles.complaintDesc} numberOfLines={1}>
            {item.description}
          </Text>
          <View style={styles.bottomRow}>
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={10} color="#777" />
              <Text style={styles.infoText}>{item.date}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={10} color="#777" />
              <Text style={styles.infoText}>{item.location}</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.logoSection}>
            <Ionicons name="menu" size={22} color="#23435D" />
            <Image
              source={require("../../../assets/images/main_logo.png")}
              style={{ width: 24, height: 24, borderRadius: 6, marginLeft: 8 }}
            />
            <Text style={styles.logo}>Nogor Shomadhan</Text>
          </View>
          <View style={styles.rightSection}>
            <Ionicons name="notifications-outline" size={20} color="#23435D" />
            <Ionicons
              style={{ marginLeft: 12 }}
              name="person-circle"
              size={30}
              color="#23435D"
            />
          </View>
        </View>

        {/* Welcome */}
        <View style={styles.welcome}>
          <Text style={styles.smallTitle}>WELCOME BACK,</Text>
          <Text style={styles.bigTitle}>Resident Dashboard</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.whiteCard}>
            <Ionicons name="document-text-outline" size={18} color="#3B82F6" />
            <Text style={styles.cardLabel}>Total Issues</Text>
            <Text style={styles.cardNumber}>12</Text>
          </View>
          <View style={[styles.whiteCard, { backgroundColor: "#FFF1F1" }]}>
            <Ionicons name="sad-outline" size={18} color="#EF4444" />
            <Text style={[styles.cardLabel, { color: "#EF4444" }]}>
              Pending
            </Text>
            <Text style={[styles.cardNumber, { color: "#EF4444" }]}>3</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.whiteCard, { backgroundColor: "#F8F2EA" }]}>
            <Ionicons name="people-outline" size={18} color="#C67B00" />
            <Text style={[styles.cardLabel, { color: "#C67B00" }]}>
              In Progress
            </Text>
            <Text style={[styles.cardNumber, { color: "#C67B00" }]}>5</Text>
          </View>
          <View style={[styles.whiteCard, { backgroundColor: "#EEF6FF" }]}>
            <Ionicons
              name="checkmark-circle-outline"
              size={18}
              color="#2563EB"
            />
            <Text style={[styles.cardLabel, { color: "#2563EB" }]}>
              Resolved
            </Text>
            <Text style={[styles.cardNumber, { color: "#2563EB" }]}>4</Text>
          </View>
        </View>

        {/* Recent Complaints */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Complaints</Text>
          <TouchableOpacity>
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          scrollEnabled={false}
          data={complaints}
          keyExtractor={(item) => item.id}
          renderItem={renderComplaint}
        />

        {/* Nearby Issues */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Nearby Issues</Text>
          <TouchableOpacity>
            <Text style={styles.viewAll}>Expand</Text>
          </TouchableOpacity>
        </View>

        {/* Map */}
        <View style={styles.mapCard}>
          <Ionicons name="map" size={48} color="#94A3B8" />
          <Text style={styles.mapTitle}>Interactive Map</Text>
          <Text style={styles.mapSubtitle}>
            Nearby reported issues will appear here.
          </Text>
        </View>

        {/* Help Center */}
        <View style={styles.helpCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.helpTitle}>Need assistance?</Text>
            <Text style={styles.helpText}>
              Browse our FAQ or contact the municipal helpline directly for
              urgent emergencies.
            </Text>
            <TouchableOpacity style={styles.helpButton}>
              <Text style={styles.helpButtonText}>Help Center</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.plusButton}>
            <Ionicons name="add" size={28} color="#fff" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="home" size={20} color="#23435D" />
          <Text style={styles.activeNav}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="map-outline" size={20} color="#888" />
          <Text style={styles.navText}>Map</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="document-text-outline" size={20} color="#888" />
          <Text style={styles.navText}>Complaints</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="bar-chart-outline" size={20} color="#888" />
          <Text style={styles.navText}>Data</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="person-outline" size={20} color="#888" />
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
