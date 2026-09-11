import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useNotifications } from '@/hooks/use-notifications';
import type { AppNotification } from '@/services/notification.service';

type NotificationFilter = 'ALL' | 'UNREAD';
type NotificationKind = 'account' | 'complaint' | 'duplicate' | 'forum' | 'system';

type AdminNotificationItem = {
  id: string;
  title: string;
  message: string;
  kind: NotificationKind;
  createdAt: Date;
  actionPath: string;
  read: boolean;
};

type NotificationSection = {
  title: 'Today' | 'Yesterday' | 'Earlier';
  data: AdminNotificationItem[];
};

const notificationTheme: Record<
  NotificationKind,
  { icon: keyof typeof Ionicons.glyphMap; color: string; background: string }
> = {
  account: {
    icon: 'person-add-outline',
    color: '#2563EB',
    background: '#EAF2FF',
  },
  complaint: {
    icon: 'document-text-outline',
    color: '#C26708',
    background: '#FFF4E8',
  },
  duplicate: {
    icon: 'git-compare-outline',
    color: '#7C3AED',
    background: '#F3EEFF',
  },
  forum: {
    icon: 'megaphone-outline',
    color: '#16845B',
    background: '#EAF8F1',
  },
  system: {
    icon: 'warning-outline',
    color: '#B42318',
    background: '#FFF0EF',
  },
};

function dataString(notification: AppNotification, key: string): string | null {
  const value = notification.data[key];
  return typeof value === 'string' && value.trim() ? value : null;
}

function withQuery(path: string, params: Record<string, string | null>): string {
  const query = Object.entries(params)
    .filter((entry): entry is [string, string] => Boolean(entry[1]))
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&');

  return query ? `${path}?${query}` : path;
}

function getAdminNotificationPath(notification: AppNotification): string {
  if (notification.type === 'duplicate_review_required') {
    const duplicateId = dataString(notification, 'duplicate_id');
    if (duplicateId) return `/(admin)/duplicates/${duplicateId}`;

    const candidateId =
      dataString(notification, 'candidate_complaint_id') ??
      dataString(notification, 'complaint_id') ??
      notification.entityId;
    return candidateId
      ? `/(admin)/complaints/${candidateId}`
      : '/(admin)/complaints/review';
  }

  if (notification.type === 'account_review_required') {
    const accountId =
      dataString(notification, 'account_id') ??
      (notification.entityType === 'account' ? notification.entityId : null);
    return accountId
      ? `/(admin)/accounts/${accountId}`
      : '/(admin)/accounts/pending';
  }

  const isForumEvent =
    notification.entityType === 'forum_post' ||
    notification.entityType === 'forum_comment' ||
    notification.type === 'forum_comment_received' ||
    notification.type === 'forum_reply_received' ||
    notification.type === 'official_announcement';

  if (isForumEvent) {
    const postId =
      dataString(notification, 'forum_post_id') ??
      (notification.entityType === 'forum_post' ? notification.entityId : null);
    const commentId =
      dataString(notification, 'forum_comment_id') ??
      (notification.entityType === 'forum_comment' ? notification.entityId : null);

    return withQuery('/(admin)/forum', { postId, commentId });
  }

  const complaintId =
    dataString(notification, 'candidate_complaint_id') ??
    dataString(notification, 'complaint_id') ??
    (notification.entityType === 'complaint' ? notification.entityId : null);

  if (complaintId) return `/(admin)/complaints/${complaintId}`;

  if (notification.actionPath?.startsWith('/(admin)/')) {
    return notification.actionPath;
  }

  return '/(admin)/dashboard';
}

function getNotificationKind(notification: AppNotification): NotificationKind {
  if (notification.type === 'account_review_required') return 'account';
  if (notification.type === 'duplicate_review_required') return 'duplicate';
  if (
    notification.type === 'forum_comment_received' ||
    notification.type === 'forum_reply_received' ||
    notification.type === 'official_announcement'
  ) {
    return 'forum';
  }
  if (notification.type === 'system_alert') return 'system';
  return 'complaint';
}

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function formatNotificationTime(date: Date): string {
  const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60_000));
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  });
}

function groupNotifications(
  notifications: AdminNotificationItem[],
): NotificationSection[] {
  const today = startOfDay(new Date());
  const yesterday = today - 86_400_000;
  const groups: Record<NotificationSection['title'], AdminNotificationItem[]> = {
    Today: [],
    Yesterday: [],
    Earlier: [],
  };

  notifications.forEach((notification) => {
    const day = startOfDay(notification.createdAt);
    const title = day === today ? 'Today' : day === yesterday ? 'Yesterday' : 'Earlier';
    groups[title].push(notification);
  });

  return (['Today', 'Yesterday', 'Earlier'] as const)
    .map((title) => ({ title, data: groups[title] }))
    .filter((section) => section.data.length > 0);
}

export default function AdminNotificationsScreen() {
  const router = useRouter();
  const {
    notifications: inboxNotifications,
    unreadCount,
    loading,
    refreshing,
    error,
    refresh,
    markAsRead,
    markAllAsRead,
    markAllAsSeen,
  } = useNotifications({ limit: 100 });
  const [filter, setFilter] = useState<NotificationFilter>('ALL');
  const hasFocusedRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      if (hasFocusedRef.current) {
        void refresh();
      } else {
        hasFocusedRef.current = true;
      }
    }, [refresh]),
  );

  useEffect(() => {
    if (!loading && inboxNotifications.length > 0) {
      void markAllAsSeen();
    }
  }, [inboxNotifications.length, loading, markAllAsSeen]);

  const notifications = useMemo<AdminNotificationItem[]>(
    () =>
      inboxNotifications.map((notification) => ({
        id: notification.id,
        title: notification.title,
        message: notification.body,
        kind: getNotificationKind(notification),
        createdAt: notification.createdAt,
        actionPath: getAdminNotificationPath(notification),
        read: Boolean(notification.readAt),
      })),
    [inboxNotifications],
  );

  const visibleNotifications = useMemo(
    () => notifications.filter((item) => filter === 'ALL' || !item.read),
    [filter, notifications],
  );
  const sections = useMemo(
    () => groupNotifications(visibleNotifications),
    [visibleNotifications],
  );
  const initialLoading = loading && notifications.length === 0;

  const openNotification = useCallback(
    (notification: AdminNotificationItem) => {
      void markAsRead(notification.id);
      router.push(notification.actionPath as never);
    },
    [markAsRead, router],
  );

  return (
    <View style={styles.page}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
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
        <Pressable
          style={styles.backButton}
          onPress={() => router.replace("/(admin)/dashboard" as never)}
        >
          <Ionicons name="arrow-back" size={18} color="#23435D" />
          <Text style={styles.backText}>Back to Dashboard</Text>
        </Pressable>

        <View style={styles.headingRow}>
          <View style={styles.headingCopy}>
            <Text style={styles.eyebrow}>ADMIN INBOX</Text>
            <Text style={styles.title}>Notifications</Text>
            <Text style={styles.subtitle}>
              {unreadCount === 0
                ? 'You are all caught up.'
                : `${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}`}
            </Text>
          </View>

          {unreadCount > 0 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Mark all notifications as read"
              hitSlop={8}
              onPress={() => void markAllAsRead()}
              style={({ pressed }) => [
                styles.markAllButton,
                pressed && styles.buttonPressed,
              ]}
            >
              <Ionicons name="checkmark-done-outline" size={18} color="#23435D" />
              <Text style={styles.markAllText}>Mark all read</Text>
            </Pressable>
          ) : null}
        </View>

        <View accessibilityRole="tablist" style={styles.filters}>
          {(['ALL', 'UNREAD'] as const).map((item) => {
            const selected = filter === item;

            return (
              <Pressable
                key={item}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                onPress={() => setFilter(item)}
                style={[
                  styles.filterButton,
                  selected && styles.filterButtonActive,
                ]}
              >
                <Text
                  style={[
                    styles.filterText,
                    selected && styles.filterTextActive,
                  ]}
                >
                  {item === 'ALL' ? 'All' : `Unread (${unreadCount})`}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {error ? (
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle-outline" size={21} color="#B42318" />
            <View style={styles.errorCopy}>
              <Text style={styles.errorTitle}>Notifications could not update</Text>
              <Text style={styles.errorText}>{error}</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Retry loading notifications"
              onPress={() => void refresh()}
              style={styles.retryButton}
            >
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          </View>
        ) : null}

        {initialLoading ? (
          <View style={styles.stateCard}>
            <ActivityIndicator size="small" color="#23435D" />
            <Text style={styles.stateText}>Loading notifications…</Text>
          </View>
        ) : sections.length > 0 ? (
          <View style={styles.sections}>
            {sections.map((section) => (
              <View key={section.title} style={styles.section}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                <View style={styles.notificationList}>
                  {section.data.map((notification, index) => {
                    const theme = notificationTheme[notification.kind];
                    const isLastItem = index === section.data.length - 1;

                    return (
                      <Pressable
                        key={notification.id}
                        accessibilityRole="button"
                        accessibilityLabel={`${notification.title}. ${notification.message}. ${formatNotificationTime(notification.createdAt)}`}
                        accessibilityHint="Opens the related Admin page"
                        onPress={() => openNotification(notification)}
                        style={({ pressed }) => [
                          styles.notificationCard,
                          isLastItem && styles.notificationCardLast,
                          !notification.read && styles.notificationCardUnread,
                          pressed && styles.notificationCardPressed,
                        ]}
                      >
                        {!notification.read ? <View style={styles.unreadAccent} /> : null}
                        <View
                          style={[
                            styles.notificationIcon,
                            { backgroundColor: theme.background },
                          ]}
                        >
                          <Ionicons
                            name={theme.icon}
                            size={21}
                            color={theme.color}
                          />
                        </View>
                        <View style={styles.notificationCopy}>
                          <View style={styles.notificationHeading}>
                            <Text
                              numberOfLines={1}
                              style={[
                                styles.notificationTitle,
                                !notification.read && styles.notificationTitleUnread,
                              ]}
                            >
                              {notification.title}
                            </Text>
                            <Text style={styles.notificationTime}>
                              {formatNotificationTime(notification.createdAt)}
                            </Text>
                          </View>
                          <Text numberOfLines={3} style={styles.notificationMessage}>
                            {notification.message}
                          </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color="#98A2B3" />
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.stateCard}>
            <View style={styles.emptyIcon}>
              <Ionicons name="checkmark-circle-outline" size={30} color="#16845B" />
            </View>
            <Text style={styles.emptyTitle}>
              {filter === 'UNREAD' ? 'You are all caught up' : 'No notifications yet'}
            </Text>
            <Text style={styles.stateText}>
              Account reviews, complaint reviews, duplicate checks, and forum activity will appear here.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F7F8FA' },
  content: {
    width: '100%',
    maxWidth: 920,
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingTop: 22,
    paddingBottom: 40,
  },
  headingRow: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
  },
  headingCopy: { flex: 1, minWidth: 0 },
  eyebrow: {
    color: '#B9854B',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  title: { color: '#23435D', fontSize: 28, fontWeight: '800', marginTop: 3 },
  subtitle: { color: '#667085', fontSize: 13, lineHeight: 19, marginTop: 4 },
  markAllButton: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
  },
  markAllText: { color: '#23435D', fontSize: 12, fontWeight: '700' },
  buttonPressed: { opacity: 0.65 },
  filters: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    padding: 3,
    marginTop: 20,
    marginBottom: 22,
    borderRadius: 12,
    backgroundColor: '#E9EDF1',
  },
  filterButton: {
    minHeight: 38,
    minWidth: 76,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: 9,
  },
  filterButtonActive: {
    backgroundColor: '#FFFFFF',
    boxShadow: '0 1px 4px rgba(16, 24, 40, 0.08)',
  },
  filterText: { color: '#667085', fontSize: 13, fontWeight: '700' },
  filterTextActive: { color: '#23435D' },
  sections: { gap: 24 },
  section: { gap: 9 },
  sectionTitle: { color: '#475467', fontSize: 13, fontWeight: '800' },
  notificationList: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E4E7EC',
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
  },
  notificationCard: {
    position: 'relative',
    minHeight: 84,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E4E7EC',
    backgroundColor: '#FFFFFF',
  },
  notificationCardLast: { borderBottomWidth: 0 },
  notificationCardUnread: { backgroundColor: '#F5FAFF' },
  notificationCardPressed: { backgroundColor: '#EEF4F8' },
  unreadAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: '#2E78A6',
  },
  notificationIcon: {
    width: 42,
    height: 42,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 21,
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
