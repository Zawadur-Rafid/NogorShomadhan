import { notificationService } from "@/services/notification.service";
import { confirmAction } from "@/utils/confirm";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

const getNotificationRoute = (notification: { route?: string; title?: string }) => {
  if (notification.route) return notification.route;

  const title = (notification.title ?? "").toLowerCase();

  if (title.includes("account")) return "/(admin)/accounts/pending";
  if (title.includes("complaint") || title.includes("review"))
    return "/(admin)/complaints/review";
  if (title.includes("announcement") || title.includes("forum"))
    return "/(admin)/forum";
  if (title.includes("status") || title.includes("progress") || title.includes("work"))
    return "/(admin)/complaints/all";

  return "/(admin)/dashboard";
};

/** Shared top bar for every screen in the admin route group. */
export default function AdminPageHeader() {
  const router = useRouter();
  const [menuVisible, setMenuVisible] = useState(false);
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    async function fetchNotifs() {
      const dbNotifications = await notificationService.fetchAdminNotifications();
      setNotifications(dbNotifications);
    }

    fetchNotifs();
  }, []);

  const handleNotificationPress = (notification: any) => {
    const route = getNotificationRoute(notification);
    setNotifications((current) =>
      current.filter((item) => item.id !== notification.id),
    );
    setNotificationsVisible(false);
    router.push(route as any);
  };

  const confirmLogout = () => {
    setMenuVisible(false);
    confirmAction(
      "Are you sure you want to log out of your admin account?",
      () => router.replace("/"),
      "Log Out",
    );
  };

  return (
    <View style={styles.header}>
      <View style={styles.brandWrap}>
        <View style={styles.logoBox}>
          <Ionicons name="business-outline" size={22} color="#ffffff" />
        </View>
        <Text numberOfLines={1} style={styles.brand}>
          Nogor Shomadhan
        </Text>
      </View>

      <View style={styles.actions}>
        <Pressable
          accessibilityLabel="View notifications"
          accessibilityRole="button"
          hitSlop={10}
          onPress={() => setNotificationsVisible((visible) => !visible)}
          style={[styles.iconButton, styles.notificationButton]}
        >
          <Ionicons name="notifications-outline" size={24} color="#23435D" />
          {notifications.length > 0 ? (
            <View style={styles.notificationCount}>
              <Text style={styles.notificationCountText}>
                {notifications.length > 9 ? "9" : notifications.length}
              </Text>
            </View>
          ) : null}
        </Pressable>
        <Pressable
          accessibilityLabel="Open account menu"
          accessibilityRole="button"
          onPress={() => setMenuVisible((visible) => !visible)}
          style={styles.avatar}
        >
          <Text style={styles.avatarText}>AD</Text>
        </Pressable>
      </View>

      {menuVisible ? (
        <View style={styles.accountMenu}>
          <Pressable
            accessibilityRole="button"
            onPress={confirmLogout}
            style={({ pressed }) => [
              styles.logoutButton,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons name="log-out-outline" size={18} color="#B42318" />
            <Text style={styles.logoutText}>Log out</Text>
          </Pressable>
        </View>
      ) : null}

      {notificationsVisible ? (
        <View style={styles.notificationsMenu}>
          <View style={styles.notificationsHeading}>
            <Text style={styles.notificationsTitle}>Notifications</Text>
            <Text style={styles.notificationsNew}>
              {notifications.length} new
            </Text>
          </View>

          {notifications.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No new notifications</Text>
            </View>
          ) : (
            <ScrollView
              style={styles.notificationScroll}
              contentContainerStyle={styles.notificationListContent}
              showsVerticalScrollIndicator={false}
            >
              {notifications.map((notification) => (
                <Pressable
                  key={notification.id}
                  onPress={() => handleNotificationPress(notification)}
                  style={({ pressed }) => [
                    styles.notificationItem,
                    pressed && styles.notificationPressed,
                  ]}
                >
                  <View style={styles.notificationIcon}>
                    <Ionicons
                      name={notification.icon}
                      size={17}
                      color="#304B6B"
                    />
                  </View>
                  <View style={styles.notificationCopy}>
                    <Text numberOfLines={1} style={styles.notificationTitle}>
                      {notification.title}
                    </Text>
                    <Text numberOfLines={2} style={styles.notificationMessage}>
                      {notification.message}
                    </Text>
                    <Text style={styles.notificationTime}>
                      {notification.time}
                    </Text>
                  </View>
                  <View style={styles.unreadDot} />
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>
      ) : null}

      {null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 8,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E7EEF3",
    zIndex: 10,
  },
  brandWrap: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    minWidth: 0,
  },
  logoBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#23435D",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  iconButton: { alignItems: "center", justifyContent: "center" },
  notificationButton: { position: "relative", marginRight: 10 },
  notificationCount: {
    position: "absolute",
    top: -7,
    right: -9,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: "#D92D20",
    borderWidth: 2,
    borderColor: "#DCEFF3",
  },
  notificationCountText: { color: "#FFFFFF", fontSize: 9, fontWeight: "800" },
  brand: {
    flex: 1,
    color: "#23435D",
    fontSize: 19,
    fontWeight: "700",
    letterSpacing: 0.1,
  },
  actions: { flexDirection: "row", alignItems: "center" },
  avatar: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: "#E1EBF8",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  avatarText: { color: "#304B6B", fontSize: 12, fontWeight: "700" },
  accountMenu: {
    position: "absolute",
    top: 58,
    right: 18,
    minWidth: 126,
    padding: 6,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 10,
    elevation: 6,
  },
  notificationsMenu: {
    position: "absolute",
    top: 58,
    right: 16,
    width: 320,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 10,
    elevation: 6,
    maxHeight: 420,
    overflow: "hidden",
  },
  notificationsHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#EAECF0",
  },
  notificationsTitle: { color: "#1F2937", fontSize: 15, fontWeight: "800" },
  notificationsNew: { color: "#D92D20", fontSize: 11, fontWeight: "700" },
  notificationScroll: { maxHeight: 330 },
  notificationListContent: { paddingBottom: 8 },
  notificationItem: {
    minHeight: 67,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  notificationPressed: { backgroundColor: "#F2F6FA" },
  notificationIcon: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
    backgroundColor: "#EAF3FF",
  },
  notificationCopy: { flex: 1 },
  notificationTitle: { color: "#344054", fontSize: 12, fontWeight: "700" },
  notificationMessage: {
    marginTop: 2,
    color: "#667085",
    fontSize: 11,
    lineHeight: 15,
  },
  notificationTime: { marginTop: 3, color: "#98A2B3", fontSize: 10 },
  unreadDot: {
    width: 7,
    height: 7,
    marginTop: 5,
    borderRadius: 4,
    backgroundColor: "#D92D20",
  },
  emptyState: { paddingVertical: 22, paddingHorizontal: 14 },
  emptyText: {
    color: "#667085",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  logoutButton: {
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    paddingHorizontal: 12,
    borderRadius: 7,
  },
  logoutText: { color: "#B42318", fontSize: 14, fontWeight: "700" },
  pressed: { backgroundColor: "#FFF1F0" },
  modalOverlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "rgba(15, 23, 42, 0.42)",
  },
  logoutDialog: {
    width: "100%",
    maxWidth: 360,
    padding: 22,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
  },
  dialogTitle: { color: "#1F2937", fontSize: 20, fontWeight: "800" },
  dialogMessage: {
    marginTop: 8,
    color: "#667085",
    fontSize: 14,
    lineHeight: 21,
  },
  dialogActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 22,
  },
  cancelButton: {
    minHeight: 40,
    justifyContent: "center",
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: "#F2F4F7",
  },
  cancelText: { color: "#344054", fontSize: 14, fontWeight: "700" },
  confirmButton: {
    minHeight: 40,
    justifyContent: "center",
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: "#B42318",
  },
  confirmPressed: { backgroundColor: "#8E1B12" },
  confirmText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
});
