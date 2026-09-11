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
import { SafeAreaView } from 'react-native-safe-area-context';

import ResidentPageHeader from '@/components/resident-page-header';
import { useNotifications } from '@/hooks/use-notifications';
import type { AppNotification } from '@/services/notification.service';

type NotificationFilter = 'ALL' | 'UNREAD';
type NotificationKind =
  | 'complaint'
  | 'duplicate'
  | 'progress'
  | 'feedback'
  | 'forum'
  | 'announcement'
  | 'system';

type ResidentNotificationItem = {
  id: string;
  title: string;
  message: string;
  kind: NotificationKind;
  createdAt: Date;
  actionPath: string;
  read: boolean;
};

const notificationTheme: Record<
  NotificationKind,
  { icon: keyof typeof Ionicons.glyphMap; color: string; background: string }
> = {
  complaint: { icon: 'document-text-outline', color: '#2563EB', background: '#EAF2FF' },
  duplicate: { icon: 'git-merge-outline', color: '#7C3AED', background: '#F3EEFF' },
  progress: { icon: 'construct-outline', color: '#C26708', background: '#FFF4E8' },
  feedback: { icon: 'chatbox-ellipses-outline', color: '#16845B', background: '#EAF8F1' },
  forum: { icon: 'chatbubbles-outline', color: '#2563EB', background: '#EAF2FF' },
  announcement: { icon: 'megaphone-outline', color: '#B42318', background: '#FFF0EF' },
  system: { icon: 'warning-outline', color: '#B42318', background: '#FFF0EF' },
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

function getResidentNotificationPath(notification: AppNotification): string {
  const forumEvent =
    notification.entityType === 'forum_post' ||
    notification.entityType === 'forum_comment' ||
    notification.type === 'forum_comment_received' ||
    notification.type === 'forum_reply_received' ||
    notification.type === 'official_announcement';

  if (forumEvent) {
    const postId =
      dataString(notification, 'forum_post_id') ??
      (notification.entityType === 'forum_post' ? notification.entityId : null);
    const commentId =
      dataString(notification, 'forum_comment_id') ??
      (notification.entityType === 'forum_comment' ? notification.entityId : null);

    return withQuery('/(resident)/forum', { postId, commentId });
  }

  const complaintId =
    dataString(notification, 'canonical_complaint_id') ??
    dataString(notification, 'complaint_id') ??
    (notification.entityType === 'complaint' ? notification.entityId : null);

  if (complaintId) {
    const section =
      notification.type === 'complaint_duplicate_confirmed'
        ? 'reporters'
        : notification.type === 'complaint_feedback_replied' ||
            notification.type === 'complaint_resolved'
          ? 'feedback'
          : notification.type === 'complaint_work_started' ||
              notification.type === 'complaint_progress_updated' ||
              notification.type === 'complaint_deadline_changed' ||
              notification.type === 'complaint_deadline_milestone' ||
              notification.type === 'complaint_overdue'
            ? 'work'
            : 'overview';

    return withQuery(`/(resident)/complaints/${complaintId}`, {
      section,
      feedbackId: dataString(notification, 'feedback_id'),
      replyId: dataString(notification, 'feedback_reply_id'),
      updateId: dataString(notification, 'work_update_id'),
      duplicateId: dataString(notification, 'duplicate_id'),
    });
  }

  if (notification.actionPath?.startsWith('/(resident)/')) {
    return notification.actionPath;
  }

  return '/(resident)/dashboard';
}

function getNotificationKind(notification: AppNotification): NotificationKind {
  if (notification.type === 'complaint_duplicate_confirmed') return 'duplicate';
  if (notification.type === 'complaint_feedback_replied') return 'feedback';
  if (
    notification.type === 'complaint_work_started' ||
    notification.type === 'complaint_progress_updated' ||
    notification.type === 'complaint_deadline_changed' ||
    notification.type === 'complaint_deadline_milestone' ||
    notification.type === 'complaint_overdue'
  ) {
    return 'progress';
  }
  if (notification.type === 'official_announcement') return 'announcement';
  if (
    notification.type === 'forum_comment_received' ||
    notification.type === 'forum_reply_received'
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
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export default function ResidentNotificationsScreen() {
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
    if (!loading && inboxNotifications.length > 0) void markAllAsSeen();
  }, [inboxNotifications.length, loading, markAllAsSeen]);

  const notifications = useMemo<ResidentNotificationItem[]>(
    () =>
      inboxNotifications.map((notification) => ({
        id: notification.id,
        title: notification.title,
        message: notification.body,
        kind: getNotificationKind(notification),
        createdAt: notification.createdAt,
        actionPath: getResidentNotificationPath(notification),
        read: Boolean(notification.readAt),
      })),
    [inboxNotifications],
  );

  const visibleNotifications = useMemo(
    () => notifications.filter((item) => filter === 'ALL' || !item.read),
    [filter, notifications],
  );

  const sections = useMemo(() => {
    const today = startOfDay(new Date());
    const yesterday = today - 86_400_000;
    const groups: Record<string, ResidentNotificationItem[]> = {
      Today: [],
      Yesterday: [],
      Earlier: [],
    };

    visibleNotifications.forEach((notification) => {
      const day = startOfDay(notification.createdAt);
      groups[day === today ? 'Today' : day === yesterday ? 'Yesterday' : 'Earlier'].push(
        notification,
      );
    });

    return ['Today', 'Yesterday', 'Earlier']
      .map((title) => ({ title, data: groups[title] }))
      .filter((section) => section.data.length > 0);
  }, [visibleNotifications]);

  const openNotification = useCallback(
    (notification: ResidentNotificationItem) => {
      void markAsRead(notification.id);
      router.push(notification.actionPath as never);
    },
    [markAsRead, router],
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ResidentPageHeader />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} tintColor="#23435D" />
        }
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.container}>
          <View style={styles.headingRow}>
            <View style={styles.headingCopy}>
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
                onPress={() => void markAllAsRead()}
                style={({ pressed }) => [styles.markAllButton, pressed && styles.pressed]}
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
                  style={[styles.filterButton, selected && styles.filterButtonActive]}
                >
                  <Text style={[styles.filterText, selected && styles.filterTextActive]}>
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
              <Pressable onPress={() => void refresh()} style={styles.retryButton}>
                <Text style={styles.retryText}>Retry</Text>
              </Pressable>
            </View>
          ) : null}

          {loading && notifications.length === 0 ? (
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
                      return (
                        <Pressable
                          key={notification.id}
                          accessibilityRole="button"
                          accessibilityLabel={`${notification.title}. ${notification.message}`}
                          accessibilityHint="Opens the related update"
                          onPress={() => openNotification(notification)}
                          style={({ pressed }) => [
                            styles.notificationCard,
                            index === section.data.length - 1 && styles.notificationCardLast,
                            !notification.read && styles.notificationCardUnread,
                            pressed && styles.notificationCardPressed,
                          ]}
                        >
                          {!notification.read ? <View style={styles.unreadAccent} /> : null}
                          <View style={[styles.notificationIcon, { backgroundColor: theme.background }]}>
                            <Ionicons name={theme.icon} size={21} color={theme.color} />
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
                Complaint, feedback, and forum updates will appear here.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F7F8FA' },
  scrollContent: { paddingBottom: 36 },
  container: { width: '100%', maxWidth: 920, alignSelf: 'center', paddingHorizontal: 16, paddingTop: 22 },
  headingRow: { minHeight: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 },
  headingCopy: { flex: 1, minWidth: 0 },
  title: { color: '#182230', fontSize: 27, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { color: '#667085', fontSize: 13, lineHeight: 19, marginTop: 4 },
  markAllButton: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 8 },
  markAllText: { color: '#23435D', fontSize: 13, fontWeight: '700' },
  pressed: { opacity: 0.65 },
  filters: { alignSelf: 'flex-start', flexDirection: 'row', padding: 3, marginTop: 20, marginBottom: 22, borderRadius: 12, backgroundColor: '#E9EDF1' },
  filterButton: { minHeight: 38, minWidth: 74, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14, borderRadius: 9 },
  filterButtonActive: { backgroundColor: '#FFFFFF', elevation: 2 },
  filterText: { color: '#667085', fontSize: 13, fontWeight: '700' },
  filterTextActive: { color: '#23435D' },
  sections: { gap: 24 },
  section: { gap: 10 },
  sectionTitle: { color: '#475467', fontSize: 13, fontWeight: '800' },
  notificationList: { overflow: 'hidden', borderWidth: 1, borderColor: '#E4E7EC', borderRadius: 14, backgroundColor: '#FFFFFF' },
  notificationCard: { position: 'relative', minHeight: 84, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E4E7EC', backgroundColor: '#FFFFFF' },
  notificationCardUnread: { backgroundColor: '#F5FAFF' },
  notificationCardLast: { borderBottomWidth: 0 },
  notificationCardPressed: { backgroundColor: '#EEF4F8' },
  unreadAccent: { position: 'absolute', top: 0, bottom: 0, left: 0, width: 3, backgroundColor: '#2E78A6' },
  notificationIcon: { width: 42, height: 42, flexShrink: 0, alignItems: 'center', justifyContent: 'center', borderRadius: 21 },
  notificationCopy: { flex: 1, minWidth: 0 },
  notificationHeading: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  notificationTitle: { flex: 1, color: '#344054', fontSize: 14, fontWeight: '700' },
  notificationTitleUnread: { color: '#182230', fontWeight: '800' },
  notificationMessage: { color: '#667085', fontSize: 13, lineHeight: 19, marginTop: 4 },
  notificationTime: { flexShrink: 0, color: '#98A2B3', fontSize: 11, fontWeight: '600' },
  stateCard: { minHeight: 240, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 28, borderWidth: 1, borderColor: '#E4E7EC', borderRadius: 16, backgroundColor: '#FFFFFF' },
  stateText: { maxWidth: 340, color: '#667085', fontSize: 13, lineHeight: 19, textAlign: 'center' },
  emptyIcon: { width: 54, height: 54, alignItems: 'center', justifyContent: 'center', borderRadius: 27, backgroundColor: '#EAF8F1' },
  emptyTitle: { color: '#344054', fontSize: 16, fontWeight: '800', marginTop: 4 },
  errorCard: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 13, marginBottom: 18, borderWidth: 1, borderColor: '#FECDCA', borderRadius: 12, backgroundColor: '#FEF3F2' },
  errorCopy: { flex: 1, minWidth: 0 },
  errorTitle: { color: '#912018', fontSize: 13, fontWeight: '800' },
  errorText: { color: '#B42318', fontSize: 12, lineHeight: 17, marginTop: 2 },
  retryButton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 8 },
  retryText: { color: '#912018', fontSize: 13, fontWeight: '800' },
});
