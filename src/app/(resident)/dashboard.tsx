import React, { useState, useEffect } from "react";
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";

import TopNav from "../../components/TopNav";
import BottomNav from "../../components/BottomNav";

import { getDashboardData, DashboardData } from "../../services/resident.service";

export default function Dashboard() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const dashboardData = await getDashboardData();
        setData(dashboardData);
      } catch (error) {
        if (error instanceof Error) Alert.alert("Error", error.message);
      }
    }
    loadData();
  }, []);

  const stats = data?.stats || { total: 0, pending: 0, inProgress: 0, resolved: 0 };
  const recentComplaints = data?.recentComplaints || [];

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
      fontFamily: "Inter",
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
      fontFamily: "Inter",
    },
    bigTitle: {
      fontSize: 24,
      fontWeight: "700",
      color: "#111827",
      marginTop: 2,
      fontFamily: "Inter",
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
      fontFamily: "Inter",
    },
    cardNumber: {
      fontSize: 24,
      fontWeight: "700",
      marginTop: 4,
      color: "#222",
      fontFamily: "Inter",
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
      fontFamily: "Inter",
    },
    viewAll: {
      color: "#3B82F6",
      fontWeight: "600",
      fontSize: 13,
      fontFamily: "Inter",
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
      fontFamily: "Inter",
    },
    complaintDesc: {
      marginTop: 2,
      color: "#666",
      lineHeight: 18,
      fontSize: 12,
      fontFamily: "Inter",
    },
    statusBadge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 10,
    },
    statusText: {
      fontWeight: "700",
      fontSize: 9,
      fontFamily: "Inter",
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
      fontFamily: "Inter",
    },
    mapCard: {
      height: 250,
      marginHorizontal: 16,
      marginTop: 12,
      borderRadius: 14,
      backgroundColor: "#E8EDF4",
      overflow: "hidden",
    },
    legendContainer: {
      flexDirection: "row",
      justifyContent: "space-evenly",
      marginHorizontal: 16,
      marginTop: 12,
      paddingHorizontal: 8,
    },
    legendItem: {
      flexDirection: "row",
      alignItems: "center",
    },
    legendColor: {
      width: 12,
      height: 12,
      borderRadius: 6,
      marginRight: 6,
    },
    legendText: {
      fontSize: 12,
      color: "#6B7280",
      fontFamily: "Inter",
      fontWeight: "500",
    },
    mapTitle: {
      marginTop: 8,
      fontSize: 16,
      fontWeight: "700",
      color: "#374151",
      fontFamily: "Inter",
    },
    mapSubtitle: {
      marginTop: 4,
      fontSize: 11,
      color: "#6B7280",
      textAlign: "center",
      paddingHorizontal: 20,
      fontFamily: "Inter",
    },
    forumCard: {
      marginHorizontal: 16,
      marginTop: 12,
      marginBottom: 4,
      backgroundColor: "#fff",
      borderRadius: 14,
      padding: 16,
      flexDirection: "row",
      alignItems: "center",
      shadowColor: "#000",
      shadowOpacity: 0.05,
      shadowRadius: 6,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      elevation: 2,
    },
    forumIcon: {
      width: 46,
      height: 46,
      borderRadius: 23,
      backgroundColor: "#EAF3FF",
      justifyContent: "center",
      alignItems: "center",
    },
    forumCopy: {
      flex: 1,
      marginLeft: 12,
      marginRight: 10,
    },
    forumTitle: {
      color: "#1B1B1B",
      fontSize: 16,
      fontWeight: "700",
      fontFamily: "Inter",
    },
    forumText: {
      marginTop: 4,
      color: "#6B7280",
      fontSize: 12,
      lineHeight: 18,
      fontFamily: "Inter",
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
      fontFamily: "Inter",
    },
    helpText: {
      color: "#D9E4EC",
      marginTop: 6,
      lineHeight: 18,
      width: "90%",
      fontSize: 12,
      fontFamily: "Inter",
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
      fontFamily: "Inter",
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
      fontFamily: "Inter",
    },
    navText: {
      marginTop: 2,
      color: "#8A8A8A",
      fontSize: 10,
      fontFamily: "Inter",
    },
  });

  const renderComplaint = ({ item }: any) => (
    <TouchableOpacity 
      activeOpacity={0.8}
      onPress={() => router.push(`/(resident)/complaints/${item.id}`)}
    >
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
              <View style={styles.infoRow}>
                <Ionicons name="arrow-up-circle" size={14} color="#C57C1B" />
                <Text style={[styles.infoText, { color: '#C57C1B', fontWeight: 'bold' }]}>{item.urgencyCount}</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* HEADER */}
        <TopNav />

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
            <Text style={styles.cardNumber}>{stats.total}</Text>
          </View>
          <View style={[styles.whiteCard, { backgroundColor: "#FFF1F1" }]}>
            <Ionicons name="sad-outline" size={18} color="#EF4444" />
            <Text style={[styles.cardLabel, { color: "#EF4444" }]}>
              Pending
            </Text>
            <Text style={[styles.cardNumber, { color: "#EF4444" }]}>{stats.pending}</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.whiteCard, { backgroundColor: "#F8F2EA" }]}>
            <Ionicons name="people-outline" size={18} color="#C67B00" />
            <Text style={[styles.cardLabel, { color: "#C67B00" }]}>
              In Progress
            </Text>
            <Text style={[styles.cardNumber, { color: "#C67B00" }]}>{stats.inProgress}</Text>
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
            <Text style={[styles.cardNumber, { color: "#2563EB" }]}>{stats.resolved}</Text>
          </View>
        </View>

        {/* Recent Complaints */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Complaints</Text>
          <TouchableOpacity onPress={() => router.push('/(resident)/complaints')}>
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          scrollEnabled={false}
          data={recentComplaints}
          keyExtractor={(item) => item.id}
          renderItem={renderComplaint}
        />



        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Community Forum</Text>
          <TouchableOpacity onPress={() => router.push('/(resident)/forum')}>
            <Text style={styles.viewAll}>Open</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.forumCard}
          onPress={() => router.push('/(resident)/forum')}
        >
          <View style={styles.forumIcon}>
            <Ionicons name="chatbubbles-outline" size={22} color="#2D6CDF" />
          </View>

          <View style={styles.forumCopy}>
            <Text style={styles.forumTitle}>Join the resident forum</Text>
            <Text style={styles.forumText}>
              Share updates, ask questions, and discuss neighborhood issues with other residents.
            </Text>
          </View>

          <Ionicons name="chevron-forward" size={22} color="#888" />
        </TouchableOpacity>

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
      <BottomNav activeRoute="home" />
    </SafeAreaView>
  );
}
