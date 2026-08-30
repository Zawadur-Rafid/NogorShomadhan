import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, Modal, TouchableWithoutFeedback, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { notificationService, ForumNotification } from "../services/notification.service";
import { confirmAction } from "@/utils/confirm";

export default function TopNav() {
  const router = useRouter();
  const [menuVisible, setMenuVisible] = useState(false);
  const [notifVisible, setNotifVisible] = useState(false);
  const [notifications, setNotifications] = useState<ForumNotification[]>([]);

  useEffect(() => {
    async function loadNotifs() {
      const accId = await AsyncStorage.getItem("acc_id");
      if (accId) {
        const notifs = await notificationService.fetchForumNotifications('resident', accId);
        setNotifications(notifs);
      }
    }
    loadNotifs();
  }, []);

  return (
    <View style={styles.header}>
      <View style={styles.logoSection}>
        <Image
          source={require("../../assets/images/main_logo.png")}
          style={{ width: 24, height: 24, borderRadius: 6 }}
        />
        <Text style={styles.logo}>Nogor Shomadhan</Text>
      </View>
      <View style={styles.rightSection}>
        <View style={{ zIndex: 50 }}>
          <TouchableOpacity onPress={() => setNotifVisible(!notifVisible)}>
            <Ionicons name="notifications-outline" size={20} color="#23435D" />
            {notifications.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{notifications.length}</Text>
              </View>
            )}
          </TouchableOpacity>
          {notifVisible && (
            <View style={styles.notifMenu}>
              <View style={styles.notifHeader}>
                <Text style={styles.notifTitle}>Notifications</Text>
              </View>
              <ScrollView style={{ maxHeight: 300 }}>
                {notifications.length === 0 ? (
                  <Text style={styles.emptyText}>No new notifications</Text>
                ) : (
                  notifications.map((n) => (
                    <TouchableOpacity key={n.id} style={styles.notifItem} onPress={() => {
                        setNotifVisible(false);
                        router.push('/(resident)/forum');
                    }}>
                      <Ionicons name={n.icon as any} size={16} color="#23435D" />
                      <View style={styles.notifContent}>
                        <Text style={styles.notifItemTitle}>{n.title}</Text>
                        <Text style={styles.notifMessage}>{n.message}</Text>
                        <Text style={styles.notifTime}>{n.time}</Text>
                      </View>
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            </View>
          )}
        </View>
        
        <View style={{ zIndex: 50 }}>
          <TouchableOpacity onPress={() => setMenuVisible(!menuVisible)}>
            <Ionicons
              style={{ marginLeft: 12 }}
              name="person-circle"
              size={30}
              color="#23435D"
            />
          </TouchableOpacity>
          
          {menuVisible && (
            <View style={styles.dropdownMenu}>
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => {
                  setMenuVisible(false);
                  router.push('/(resident)/profile');
                }}
              >
                <Ionicons name="person-outline" size={16} color="#23435D" />
                <Text style={styles.dropdownText}>My Profile</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.dropdownItem, { borderBottomWidth: 0 }]}
                onPress={async () => {
                  const confirmed = await confirmAction('Are you sure you want to log out?');
                  if (!confirmed) return;
                  setMenuVisible(false);
                  router.replace('/');
                }}
              >
                <Ionicons name="log-out-outline" size={16} color="#D32F2F" />
                <Text style={[styles.dropdownText, { color: '#D32F2F' }]}>Logout</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: '#fff',
    zIndex: 10,
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
    zIndex: 50,
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#D92D20',
    borderRadius: 10,
    width: 14,
    height: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: 'bold',
  },
  notifMenu: {
    position: 'absolute',
    top: 30,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 8,
    width: 260,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
    zIndex: 1000,
  },
  notifHeader: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  notifTitle: {
    fontWeight: '700',
    color: '#333',
  },
  notifItem: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  notifContent: {
    marginLeft: 10,
    flex: 1,
  },
  notifItemTitle: {
    fontWeight: '600',
    fontSize: 12,
    color: '#333',
  },
  notifMessage: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  notifTime: {
    fontSize: 9,
    color: '#999',
    marginTop: 4,
  },
  emptyText: {
    padding: 15,
    textAlign: 'center',
    color: '#888',
    fontSize: 12,
  },
  dropdownMenu: {
    position: 'absolute',
    top: 40,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 8,
    width: 150,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
    zIndex: 1000,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dropdownText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    fontFamily: 'Inter',
  },
});
