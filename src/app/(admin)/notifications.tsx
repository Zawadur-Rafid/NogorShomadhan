import Ionicons from "@expo/vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { markAdminNotificationRead } from "@/services/admin.service";
import {
    notificationService,
    type AdminNotification,
} from "@/services/notification.service";

const READ_IDS_KEY = "@nogor-shomadhan/admin/read-notification-ids";

type Filter = "ALL" | "UNREAD";
type SectionTitle = "Today" | "Yesterday" | "Earlier";

type Section = {
  title: SectionTitle;
  data: AdminNotification[];
};

const iconTheme: Record<
  AdminNotification["type"],
  { icon: keyof typeof Ionicons.glyphMap; color: string; background: string }
> = {
  account: {
    icon: "person-add-outline",
    color: "#2563EB",
    background: "#EAF2FF",
  },
  complaint_review: {
    icon: "document-text-outline",
    color: "#C67B00",
    background: "#FFF7E8",
  },
  forum_announcement: {
    icon: "megaphone-outline",
    color: "#B42318",
    background: "#FFF0EF",
  },
  complaint_update: {
    icon: "sync-outline",
    color: "#16845B",
    background: "#EAF8F1",
  },
  duplicate_review: {
    icon: "git-compare-outline",
    color: "#7C3AED",
    background: "#F1EAFF",
  },
};

function groupNotifications(items: AdminNotification[]): Section[] {
  const today = new Date();
  const start = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const todayStart = start(today);
  const groups: Record<SectionTitle, AdminNotification[]> = {
    Today: [],
    Yesterday: [],
    Earlier: [],
  };

  items.forEach((item) => {
    const day = start(item.createdAt);
    if (day === todayStart) groups.Today.push(item);
    else if (day === todayStart - 86_400_000) groups.Yesterday.push(item);
    else groups.Earlier.push(item);
  });

  return (["Today", "Yesterday", "Earlier"] as const)
    .map((title) => ({ title, data: groups[title] }))
    .filter((section) => section.data.length > 0);
}

export default function AdminNotificationsScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("ALL");
  const [items, setItems] = useState<AdminNotification[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [notifications, stored] = await Promise.all([
      notificationService.fetchAdminNotifications(),
      AsyncStorage.getItem(READ_IDS_KEY),
    ]);
    setItems(notifications);
    try {
      const parsed: unknown = stored ? JSON.parse(stored) : [];
      if (Array.isArray(parsed)) {
        setReadIds(
          new Set(parsed.filter((id): id is string => typeof id === "string")),
        );
      }
    } catch {
      setReadIds(new Set());
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const unreadCount = items.filter((item) => !readIds.has(item.id)).length;
  const visibleItems = useMemo(
    () => items.filter((item) => filter === "ALL" || !readIds.has(item.id)),
    [filter, items, readIds],
  );
  const sections = useMemo(
    () => groupNotifications(visibleItems),
    [visibleItems],
  );

  const markRead = useCallback(
    async (id: string) => {
      const next = new Set(readIds);
      next.add(id);
      setReadIds(next);
      await AsyncStorage.setItem(READ_IDS_KEY, JSON.stringify([...next]));
      if (
        !id.startsWith("account-") &&
        !id.startsWith("complaint-review-") &&
        !id.startsWith("forum-announcement-") &&
        !id.startsWith("complaint-status-") &&
        !id.startsWith("complaint-update-")
      ) {
        await markAdminNotificationRead(id).catch((error) =>
          console.warn("Could not mark admin notification read:", error),
        );
      }
    },
    [readIds],
  );

  const openNotification = async (item: AdminNotification) => {
    await markRead(item.id);
    router.push(item.route as never);
  };

  const markAllRead = async () => {
    const next = new Set(readIds);
    items.forEach((item) => next.add(item.id));
    setReadIds(next);
    await AsyncStorage.setItem(READ_IDS_KEY, JSON.stringify([...next]));
    await Promise.all(
      items
        .filter(
          (item) =>
            !item.id.startsWith("account-") &&
            !item.id.startsWith("complaint-review-") &&
            !item.id.startsWith("forum-announcement-") &&
            !item.id.startsWith("complaint-status-") &&
            !item.id.startsWith("complaint-update-"),
        )
        .map((item) =>
          markAdminNotificationRead(item.id).catch(() => undefined),
        ),
    );
  };

  const refresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <View style={styles.page}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void refresh()}
            tintColor="#23435D"
          />
        }
        contentContainerStyle={styles.content}
      >
        <View style={styles.headingRow}>
          <View style={styles.headingCopy}>
            <Text style={styles.eyebrow}>ADMIN INBOX</Text>
            <Text style={styles.title}>Notifications</Text>
            <Text style={styles.subtitle}>
              {unreadCount
                ? `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`
                : "You are all caught up."}
            </Text>
          </View>
          {unreadCount > 0 ? (
            <Pressable style={styles.markAll} onPress={() => void markAllRead}>
              <Ionicons
                name="checkmark-done-outline"
                size={18}
                color="#23435D"
              />
              <Text style={styles.markAllText}>Mark all read</Text>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.filters}>
          {(["ALL", "UNREAD"] as const).map((value) => (
            <Pressable
              key={value}
              onPress={() => setFilter(value)}
              style={[styles.filter, filter === value && styles.filterActive]}
            >
              <Text
                style={[
                  styles.filterText,
                  filter === value && styles.filterTextActive,
                ]}
              >
                {value === "ALL" ? "All" : `Unread (${unreadCount})`}
              </Text>
            </Pressable>
          ))}
        </View>

        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color="#23435D" />
            <Text style={styles.loadingText}>Loading notifications...</Text>
          </View>
        ) : sections.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons
              name="checkmark-circle-outline"
              size={38}
              color="#16845B"
            />
            <Text style={styles.emptyTitle}>No notifications yet</Text>
            <Text style={styles.emptyText}>
              New admin updates will appear here.
            </Text>
          </View>
        ) : (
          sections.map((section) => (
            <View key={section.title} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <View style={styles.list}>
                {section.data.map((item, index) => {
                  const unread = !readIds.has(item.id);
                  const theme = iconTheme[item.type];
                  return (
                    <Pressable
                      key={item.id}
                      onPress={() => void openNotification(item)}
                      style={({ pressed }) => [
                        styles.card,
                        index === section.data.length - 1 && styles.cardLast,
                        unread && styles.cardUnread,
                        pressed && styles.cardPressed,
                      ]}
                    >
                      {unread ? <View style={styles.unreadAccent} /> : null}
                      <View
                        style={[
                          styles.icon,
                          { backgroundColor: theme.background },
                        ]}
                      >
                        <Ionicons
                          name={theme.icon}
                          size={21}
                          color={theme.color}
                        />
                      </View>
                      <View style={styles.copy}>
                        <View style={styles.cardHeading}>
                          <Text
                            numberOfLines={1}
                            style={[
                              styles.cardTitle,
                              unread && styles.cardTitleUnread,
                            ]}
                          >
                            {item.title}
                          </Text>
                          <Text style={styles.time}>{item.time}</Text>
                        </View>
                        <Text numberOfLines={2} style={styles.message}>
                          {item.message}
                        </Text>
                      </View>
                      <Ionicons
                        name="chevron-forward"
                        size={18}
                        color="#98A2B3"
                      />
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#F7F8FA" },
  content: {
    padding: 20,
    paddingBottom: 40,
    gap: 18,
    maxWidth: 920,
    width: "100%",
    alignSelf: "center",
  },
  headingRow: {
    minHeight: 62,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
  },
  headingCopy: { flex: 1 },
  eyebrow: {
    color: "#B9854B",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
  },
  title: { color: "#23435D", fontSize: 28, fontWeight: "800", marginTop: 3 },
  subtitle: { color: "#667085", fontSize: 13, marginTop: 4 },
  markAll: {
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 8,
  },
  markAllText: { color: "#23435D", fontSize: 12, fontWeight: "700" },
  filters: {
    alignSelf: "flex-start",
    flexDirection: "row",
    padding: 3,
    borderRadius: 12,
    backgroundColor: "#E9EDF1",
  },
  filter: {
    minHeight: 38,
    minWidth: 76,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
    borderRadius: 9,
  },
  filterActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#101828",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  filterText: { color: "#667085", fontSize: 13, fontWeight: "700" },
  filterTextActive: { color: "#23435D" },
  section: { gap: 9 },
  sectionTitle: { color: "#475467", fontSize: 13, fontWeight: "800" },
  list: {
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E4E7EC",
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
  },
  card: {
    position: "relative",
    minHeight: 84,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E4E7EC",
    backgroundColor: "#FFFFFF",
  },
  cardLast: { borderBottomWidth: 0 },
  cardUnread: { backgroundColor: "#FBFDFF" },
  cardPressed: { opacity: 0.7 },
  unreadAccent: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: "#23435D",
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  copy: { flex: 1, minWidth: 0 },
  cardHeading: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardTitle: { flex: 1, color: "#344054", fontSize: 13, fontWeight: "700" },
  cardTitleUnread: { color: "#1F2937", fontWeight: "800" },
  time: { color: "#98A2B3", fontSize: 10 },
  message: { color: "#667085", fontSize: 12, lineHeight: 18, marginTop: 4 },
  loading: { alignItems: "center", paddingVertical: 50, gap: 12 },
  loadingText: { color: "#667085", fontSize: 13 },
  empty: { alignItems: "center", paddingVertical: 70, gap: 8 },
  emptyTitle: { color: "#1F2937", fontSize: 18, fontWeight: "800" },
  emptyText: { color: "#667085", fontSize: 13 },
});
