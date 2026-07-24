import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

const adminNotifications = [
  { id: "notification-1", icon: "document-text-outline", title: "New complaint submitted", message: "Broken Main Pipe is awaiting verification.", time: "5 min ago" },
  { id: "notification-2", icon: "person-add-outline", title: "New account request", message: "A resident account is awaiting approval.", time: "18 min ago" },
  { id: "notification-3", icon: "checkmark-circle-outline", title: "Complaint resolved", message: "Major Pothole was marked as resolved.", time: "1 hr ago" },
  { id: "notification-4", icon: "bar-chart-outline", title: "Weekly report ready", message: "Your community performance summary is available.", time: "Today" },
] as const;

/** Shared top bar for every screen in the admin route group. */
export default function AdminPageHeader() {
  const router = useRouter();
  const [menuVisible, setMenuVisible] = useState(false);
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const [logoutPromptVisible, setLogoutPromptVisible] = useState(false);

  const confirmLogout = () => {
    setMenuVisible(false);
    setLogoutPromptVisible(true);
  };

  return (
    <View style={styles.header}>
      <Pressable
        accessibilityLabel="Open admin navigation"
        accessibilityRole="button"
        hitSlop={10}
        style={styles.iconButton}
      >
        <Ionicons name="menu" size={24} color="#304B6B" />
      </Pressable>

      <Text numberOfLines={1} style={styles.brand}>
        Nogor Shomadhan
      </Text>

      <View style={styles.actions}>
        <Pressable
          accessibilityLabel="View notifications"
          accessibilityRole="button"
          hitSlop={10}
          onPress={() => setNotificationsVisible((visible) => !visible)}
          style={[styles.iconButton, styles.notificationButton]}
        >
          <Ionicons name="notifications-outline" size={24} color="#AA3029" />
          <View style={styles.notificationCount}>
            <Text style={styles.notificationCountText}>3</Text>
          </View>
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
            style={({ pressed }) => [styles.logoutButton, pressed && styles.pressed]}
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
            <Text style={styles.notificationsNew}>3 new</Text>
          </View>
          {adminNotifications.map((notification) => (
            <Pressable key={notification.id} style={({ pressed }) => [styles.notificationItem, pressed && styles.notificationPressed]}>
              <View style={styles.notificationIcon}>
                <Ionicons name={notification.icon} size={17} color="#304B6B" />
              </View>
              <View style={styles.notificationCopy}>
                <Text numberOfLines={1} style={styles.notificationTitle}>{notification.title}</Text>
                <Text numberOfLines={2} style={styles.notificationMessage}>{notification.message}</Text>
                <Text style={styles.notificationTime}>{notification.time}</Text>
              </View>
              {notification.id !== "notification-4" ? <View style={styles.unreadDot} /> : null}
            </Pressable>
          ))}
        </View>
      ) : null}

      <Modal
        transparent
        animationType="fade"
        visible={logoutPromptVisible}
        onRequestClose={() => setLogoutPromptVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View accessibilityViewIsModal style={styles.logoutDialog}>
            <Text style={styles.dialogTitle}>Log out?</Text>
            <Text style={styles.dialogMessage}>
              Are you sure you want to log out of your admin account?
            </Text>
            <View style={styles.dialogActions}>
              <Pressable
                accessibilityRole="button"
                onPress={() => setLogoutPromptVisible(false)}
                style={({ pressed }) => [
                  styles.cancelButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.replace("/")}
                style={({ pressed }) => [
                  styles.confirmButton,
                  pressed && styles.confirmPressed,
                ]}
              >
                <Text style={styles.confirmText}>Log out</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 64,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    backgroundColor: "#F8F9FC",
    zIndex: 10,
  },
  iconButton: { alignItems: "center", justifyContent: "center" },
  notificationButton: { position: "relative" },
  notificationCount: {
    position: "absolute",
    top: -7,
    right: -9,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
    borderRadius: 8,
    backgroundColor: "#D92D20",
  },
  notificationCountText: { color: "#FFFFFF", fontSize: 9, fontWeight: "800" },
  brand: {
    flex: 1,
    marginLeft: 10,
    color: "#304B6B",
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 0.1,
  },
  actions: { flexDirection: "row", alignItems: "center", gap: 15 },
  avatar: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 17,
    backgroundColor: "#E1EBF8",
  },
  avatarText: { color: "#304B6B", fontSize: 13, fontWeight: "700" },
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
  },
  notificationsHeading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#EAECF0" },
  notificationsTitle: { color: "#1F2937", fontSize: 15, fontWeight: "800" },
  notificationsNew: { color: "#D92D20", fontSize: 11, fontWeight: "700" },
  notificationItem: { minHeight: 67, flexDirection: "row", alignItems: "flex-start", gap: 9, paddingHorizontal: 14, paddingVertical: 10 },
  notificationPressed: { backgroundColor: "#F2F6FA" },
  notificationIcon: { width: 30, height: 30, alignItems: "center", justifyContent: "center", borderRadius: 15, backgroundColor: "#EAF3FF" },
  notificationCopy: { flex: 1 },
  notificationTitle: { color: "#344054", fontSize: 12, fontWeight: "700" },
  notificationMessage: { marginTop: 2, color: "#667085", fontSize: 11, lineHeight: 15 },
  notificationTime: { marginTop: 3, color: "#98A2B3", fontSize: 10 },
  unreadDot: { width: 7, height: 7, marginTop: 5, borderRadius: 4, backgroundColor: "#D92D20" },
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
