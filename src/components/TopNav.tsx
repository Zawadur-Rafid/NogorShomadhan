import { confirmAction } from "@/utils/confirm";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { notificationService } from "../services/notification.service";

export default function TopNav() {
  const router = useRouter();
  const [menuVisible, setMenuVisible] = useState(false);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      void notificationService
        .fetchUnreadCount()
        .then((unreadCount) => {
          if (active) setUnreadNotificationCount(unreadCount);
        })
        .catch((error) => {
          console.warn("Could not load resident unread count:", error);
        });

      return () => {
        active = false;
      };
    }, []),
  );

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
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={`Notifications, ${unreadNotificationCount} unread`}
            onPress={() => {
              setMenuVisible(false);
              router.push("/(resident)/notifications" as never);
            }}
          >
            <Ionicons name="notifications-outline" size={20} color="#23435D" />
            {unreadNotificationCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {unreadNotificationCount > 99 ? "99+" : unreadNotificationCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
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
                  router.push("/(resident)/profile");
                }}
              >
                <Ionicons name="person-outline" size={16} color="#23435D" />
                <Text style={styles.dropdownText}>My Profile</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.dropdownItem, { borderBottomWidth: 0 }]}
                onPress={async () => {
                  const confirmed = await confirmAction(
                    "Are you sure you want to log out?",
                  );
                  if (!confirmed) return;
                  setMenuVisible(false);
                  router.replace("/");
                }}
              >
                <Ionicons name="log-out-outline" size={16} color="#D32F2F" />
                <Text style={[styles.dropdownText, { color: "#D32F2F" }]}>
                  Logout
                </Text>
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
    backgroundColor: "#fff",
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
    fontFamily: "System",
  },
  rightSection: {
    flexDirection: "row",
    alignItems: "center",
    zIndex: 50,
  },
  badge: {
    position: "absolute",
    top: -7,
    right: -9,
    backgroundColor: "#D92D20",
    borderRadius: 9,
    minWidth: 17,
    height: 17,
    paddingHorizontal: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "bold",
  },
  dropdownMenu: {
    position: "absolute",
    top: 40,
    right: 0,
    backgroundColor: "#fff",
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
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  dropdownText: {
    marginLeft: 10,
    fontSize: 15,
    color: "#1F2937",
    fontWeight: "600",
    fontFamily: "System",
  },
});
