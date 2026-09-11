import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
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

import AuthorityPageHeader from '@/components/authority/authority-page-header';
import { useAuthorityComplaints } from '@/components/authority/authority-complaints-context';
import {
  notificationService,
  type ForumNotification,
} from '@/services/notification.service';
import { AUTHORITY_UNREAD_NOTIFICATION_COUNT_KEY } from '@/utils/authority-notification-storage';

type NotificationFilter = 'ALL' | 'UNREAD';
type NotificationKind =
  | 'complaint'
  | 'feedback'
  | 'deadline'
  | ForumNotification['type'];

type NotificationTarget =
  | { type: 'complaint'; complaintId: string }
  | { type: 'forum' };

type AuthorityNotificationItem = {
  id: string;
  title: string;
  message: string;
  kind: NotificationKind;
  createdAt: Date;
  target: NotificationTarget;
  read: boolean;
};

type NotificationSection = {
  title: 'Today' | 'Yesterday' | 'Earlier';
  data: AuthorityNotificationItem[];
};

const READ_NOTIFICATION_IDS_KEY =
  '@nogor-shomadhan/authority/read-notification-ids';

const notificationTheme: Record<
  NotificationKind,
  {
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
    background: string;
  }
> = {
  complaint: {
    icon: 'document-text-outline',
    color: '#2563EB',
    background: '#EAF2FF',
  },
  feedback: {
    icon: 'star-outline',
    color: '#A16207',
    background: '#FFF7DA',
  },
  deadline: {
    icon: 'time-outline',
    color: '#C2410C',
    background: '#FFF0E8',
  },
  forum_post: {
    icon: 'chatbubble-ellipses-outline',
    color: '#16845B',
    background: '#EAF8F1',
  },
  forum_announcement: {
    icon: 'megaphone-outline',
    color: '#B42318',
    background: '#FFF0EF',
  },
  forum_comment: {
    icon: 'chatbox-outline',
    color: '#2563EB',
    background: '#EAF2FF',
  },
};

function parseDate(value?: string | null, fallback = new Date()): Date {
  if (!value) return fallback;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : date;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatNotificationTime(date: Date): string {
  const now = new Date();
  const difference = now.getTime() - date.getTime();
  const minutes = Math.max(0, Math.floor(difference / 60_000));

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  });
}

function getDeadlineMessage(displayId: string, deadline: Date): string {
  const differenceInDays = Math.ceil(
    (startOfDay(deadline).getTime() - startOfDay(new Date()).getTime()) /
      86_400_000,
  );

  if (differenceInDays < 0) {
    const overdueDays = Math.abs(differenceInDays);
    return `${displayId} is overdue by ${overdueDays} day${overdueDays === 1 ? '' : 's'}.`;
  }

  if (differenceInDays === 0) return `${displayId} is due today.`;
  if (differenceInDays === 1) return `${displayId} is due tomorrow.`;
  return `${displayId} is due within ${differenceInDays} days.`;
}

function groupNotifications(
  notifications: AuthorityNotificationItem[],
): NotificationSection[] {
  const today = startOfDay(new Date()).getTime();
  const yesterday = today - 86_400_000;
  const groups: Record<NotificationSection['title'], AuthorityNotificationItem[]> = {
    Today: [],
    Yesterday: [],
    Earlier: [],
  };

  notifications.forEach((notification) => {
    const notificationDay = startOfDay(notification.createdAt).getTime();

    if (notificationDay === today) {
      groups.Today.push(notification);
    } else if (notificationDay === yesterday) {
      groups.Yesterday.push(notification);
    } else {
      groups.Earlier.push(notification);
    }
  });

  return (['Today', 'Yesterday', 'Earlier'] as const)
    .map((title) => ({ title, data: groups[title] }))
    .filter((section) => section.data.length > 0);
}

export default function AuthorityNotifications() {
  const router = useRouter();
  const {
    complaints,
    loading: complaintsLoading,
    error: complaintsError,
    refreshComplaints,
  } = useAuthorityComplaints();
  const [filter, setFilter] = useState<NotificationFilter>('ALL');
  const [forumNotifications, setForumNotifications] = useState<
    ForumNotification[]
  >([]);
  const [forumLoading, setForumLoading] = useState(true);
  const [readNotificationIds, setReadNotificationIds] = useState<Set<string>>(
    new Set(),
  );
  const [readStateLoading, setReadStateLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadForumNotifications = useCallback(async () => {
    try {
      const notifications =
        await notificationService.fetchForumNotifications('authority');
      setForumNotifications(notifications);
    } finally {
      setForumLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadForumNotifications();
  }, [loadForumNotifications]);

  useEffect(() => {
    async function loadReadState() {
      try {
        const storedValue = await AsyncStorage.getItem(
          READ_NOTIFICATION_IDS_KEY,
        );
        const storedIds: unknown = storedValue ? JSON.parse(storedValue) : [];

        if (Array.isArray(storedIds)) {
          setReadNotificationIds(
            new Set(storedIds.filter((id): id is string => typeof id === 'string')),
          );
        }
      } catch (error) {
        console.warn('Could not load authority notification read state:', error);
      } finally {
        setReadStateLoading(false);
      }
    }

    void loadReadState();
  }, []);

  const sourceNotifications = useMemo<AuthorityNotificationItem[]>(() => {
    const complaintNotifications = complaints.flatMap((complaint) => {
      const eventDate =
        complaint.status === 'RESOLVED'
          ? parseDate(complaint.resolvedAt, parseDate(complaint.timestamp))
          : complaint.status === 'IN PROGRESS'
            ? parseDate(complaint.startedAt, parseDate(complaint.timestamp))
            : parseDate(complaint.timestamp);
      const statusNotification: AuthorityNotificationItem = {
        id: `complaint-${complaint.id}-${complaint.status}`,
        title:
          complaint.status === 'PENDING'
            ? 'Complaint ready for action'
            : complaint.status === 'IN PROGRESS'
              ? 'Work started'
              : 'Complaint resolved',
        message: `${complaint.displayId} · ${complaint.title}`,
        kind: 'complaint',
        createdAt: eventDate,
        target: { type: 'complaint', complaintId: complaint.id },
        read: false,
      };

      const feedbackNotifications: AuthorityNotificationItem[] =
        complaint.feedback.map((feedback) => ({
          id: `feedback-${feedback.id}`,
          title: 'New resident feedback',
          message: `${complaint.displayId} received a ${feedback.rating}-star rating.`,
          kind: 'feedback',
          createdAt: parseDate(feedback.createdAt, eventDate),
          target: { type: 'complaint', complaintId: complaint.id },
          read: false,
        }));

      const deadlineNotifications: AuthorityNotificationItem[] = [];

      if (complaint.status === 'IN PROGRESS' && complaint.deadline) {
        const deadline = parseDate(`${complaint.deadline}T12:00:00`);
        const differenceInDays = Math.ceil(
          (startOfDay(deadline).getTime() - startOfDay(new Date()).getTime()) /
            86_400_000,
        );

        if (differenceInDays >= -30 && differenceInDays <= 2) {
          deadlineNotifications.push({
            id: `deadline-${complaint.id}-${complaint.deadline}`,
            title:
              differenceInDays < 0
                ? 'Work deadline overdue'
                : 'Work deadline approaching',
            message: getDeadlineMessage(complaint.displayId, deadline),
            kind: 'deadline',
            createdAt: new Date(),
            target: { type: 'complaint', complaintId: complaint.id },
            read: false,
          });
        }
      }

      return [
        ...deadlineNotifications,
        ...feedbackNotifications,
        statusNotification,
      ];
    });

    const forumItems: AuthorityNotificationItem[] = forumNotifications.map(
      (notification) => ({
        id: notification.id,
        title: notification.title,
        message: notification.message,
        kind: notification.type,
        createdAt: notification.createdAt,
        target: { type: 'forum' },
        read: notification.read,
      }),
    );

    return [...complaintNotifications, ...forumItems]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 60);
  }, [complaints, forumNotifications]);

  const notifications = useMemo(
    () =>
      sourceNotifications.map((notification) => ({
        ...notification,
        read:
          notification.read || readNotificationIds.has(notification.id),
      })),
    [readNotificationIds, sourceNotifications],
  );

  const unreadCount = notifications.filter(
    (notification) => !notification.read,
  ).length;
  const visibleNotifications = useMemo(
    () =>
      notifications.filter(
        (notification) => filter === 'ALL' || !notification.read,
      ),
    [filter, notifications],
  );
  const sections = useMemo(
    () => groupNotifications(visibleNotifications),
    [visibleNotifications],
  );
  const initialLoading =
    readStateLoading ||
    (complaintsLoading && complaints.length === 0) ||
    (forumLoading && forumNotifications.length === 0);

  useEffect(() => {
    if (initialLoading) return;

    void AsyncStorage.setItem(
      AUTHORITY_UNREAD_NOTIFICATION_COUNT_KEY,
      String(unreadCount),
    ).catch((error) => {
      console.warn('Could not save authority unread count:', error);
    });
  }, [initialLoading, unreadCount]);

  const persistReadIds = useCallback(async (ids: Set<string>) => {
    try {
      await AsyncStorage.setItem(
        READ_NOTIFICATION_IDS_KEY,
        JSON.stringify([...ids]),
      );
    } catch (error) {
      console.warn('Could not save authority notification read state:', error);
    }
  }, []);

  const markAsRead = useCallback(
    (notificationId: string) => {
      if (readNotificationIds.has(notificationId)) return;

      const nextIds = new Set(readNotificationIds);
      nextIds.add(notificationId);
      setReadNotificationIds(nextIds);
      void persistReadIds(nextIds);
    },
    [persistReadIds, readNotificationIds],
  );

  const markAllAsRead = useCallback(() => {
    const nextIds = new Set(readNotificationIds);
    notifications.forEach((notification) => nextIds.add(notification.id));
    setReadNotificationIds(nextIds);
    void persistReadIds(nextIds);
  }, [notifications, persistReadIds, readNotificationIds]);

  const openNotification = useCallback(
    (notification: AuthorityNotificationItem) => {
      markAsRead(notification.id);

      if (notification.target.type === 'forum') {
        router.push('/authority/forum' as never);
        return;
      }

      router.push({
        pathname: '/authority/complaints/[complaintId]',
        params: { complaintId: notification.target.complaintId },
      } as never);
    },
    [markAsRead, router],
  );

  const refresh = useCallback(async () => {
    setRefreshing(true);

    try {
      await Promise.all([refreshComplaints(), loadForumNotifications()]);
    } finally {
      setRefreshing(false);
    }
  }, [loadForumNotifications, refreshComplaints]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <AuthorityPageHeader title="Dashboard" />
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
                hitSlop={8}
                onPress={markAllAsRead}
                style={({ pressed }) => [
                  styles.markAllButton,
                  pressed && styles.buttonPressed,
                ]}
              >
                <Ionicons
                  name="checkmark-done-outline"
                  size={18}
                  color="#23435D"
                />
                <Text style={styles.markAllText}>Mark all read</Text>
              </Pressable>
            ) : null}
          </View>

          <View
            accessibilityRole="tablist"
            style={styles.filterContainer}
          >
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

          {complaintsError ? (
            <View style={styles.errorCard}>
              <Ionicons name="alert-circle-outline" size={21} color="#B42318" />
              <View style={styles.errorCopy}>
                <Text style={styles.errorTitle}>Some updates could not load</Text>
                <Text style={styles.errorText}>{complaintsError}</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                onPress={() => void refresh()}
                style={styles.retryButton}
              >
                <Text style={styles.retryText}>Retry</Text>
              </Pressable>
            </View>
          ) : null}

          {initialLoading ? (
            <View style={styles.loadingState}>
              <ActivityIndicator size="small" color="#23435D" />
              <Text style={styles.loadingText}>Loading notifications…</Text>
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
                          accessibilityHint="Opens the related update"
                          onPress={() => openNotification(notification)}
                          style={({ pressed }) => [
                            styles.notificationCard,
                            isLastItem && styles.notificationCardLast,
                            !notification.read && styles.notificationCardUnread,
                            pressed && styles.notificationCardPressed,
                          ]}
                        >
                          {!notification.read ? (
                            <View style={styles.unreadAccent} />
                          ) : null}
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
                                  !notification.read &&
                                    styles.notificationTitleUnread,
                                ]}
                              >
                                {notification.title}
                              </Text>
                              <Text style={styles.notificationTime}>
                                {formatNotificationTime(notification.createdAt)}
                              </Text>
                            </View>
                            <Text
                              numberOfLines={2}
                              style={styles.notificationMessage}
                            >
                              {notification.message}
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
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={30}
                  color="#16845B"
                />
              </View>
              <Text style={styles.emptyTitle}>
                {filter === 'UNREAD'
                  ? 'You are all caught up'
                  : 'No notifications yet'}
              </Text>
              <Text style={styles.emptyText}>
                {filter === 'UNREAD'
                  ? 'New authority updates will appear here.'
                  : 'Complaint and forum updates will appear here when available.'}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },
  scrollContent: {
    paddingBottom: 36,
  },
  container: {
    width: '100%',
    maxWidth: 920,
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingTop: 22,
  },
  headingRow: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  headingCopy: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    color: '#182230',
    fontSize: 27,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: '#667085',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },
  markAllButton: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 10,
  },
  markAllText: {
    color: '#23435D',
    fontSize: 13,
    fontWeight: '700',
  },
  buttonPressed: {
    opacity: 0.65,
  },
  filterContainer: {
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
    minWidth: 74,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: 9,
  },
  filterButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#101828',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  filterText: {
    color: '#667085',
    fontSize: 13,
    fontWeight: '700',
  },
  filterTextActive: {
    color: '#23435D',
  },
  sections: {
    gap: 24,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    color: '#475467',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
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
  notificationCardUnread: {
    backgroundColor: '#F5FAFF',
  },
  notificationCardLast: {
    borderBottomWidth: 0,
  },
  notificationCardPressed: {
    backgroundColor: '#EEF4F8',
  },
  unreadAccent: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
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
  notificationCopy: {
    flex: 1,
    minWidth: 0,
  },
  notificationHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  notificationTitle: {
    flex: 1,
    color: '#344054',
    fontSize: 14,
    fontWeight: '700',
  },
  notificationTitleUnread: {
    color: '#182230',
    fontWeight: '800',
  },
  notificationMessage: {
    color: '#667085',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },
  notificationTime: {
    flexShrink: 0,
    color: '#98A2B3',
    fontSize: 11,
    fontWeight: '600',
  },
  loadingState: {
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#667085',
    fontSize: 13,
  },
  emptyState: {
    minHeight: 260,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
    borderWidth: 1,
    borderColor: '#E4E7EC',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
  },
  emptyIcon: {
    width: 54,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 27,
    backgroundColor: '#EAF8F1',
  },
  emptyTitle: {
    color: '#344054',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 14,
  },
  emptyText: {
    maxWidth: 340,
    color: '#667085',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 6,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 13,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#FECDCA',
    borderRadius: 12,
    backgroundColor: '#FEF3F2',
  },
  errorCopy: {
    flex: 1,
    minWidth: 0,
  },
  errorTitle: {
    color: '#912018',
    fontSize: 13,
    fontWeight: '800',
  },
  errorText: {
    color: '#B42318',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  retryButton: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  retryText: {
    color: '#912018',
    fontSize: 13,
    fontWeight: '800',
  },
});
