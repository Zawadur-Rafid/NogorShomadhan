import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AuthorityPageHeader from '@/components/authority/authority-page-header';
import {
  authorityNotifications,
  type AuthorityNotification,
} from '@/components/authority/store-authority-account';

type NotificationFilter = 'ALL' | 'UNREAD';

const notificationTheme = {
  complaint: { icon: 'document-text-outline' as const, color: '#3B82F6', background: '#EEF6FF' },
  urgency: { icon: 'flame-outline' as const, color: '#E0524D', background: '#FFF1F1' },
  feedback: { icon: 'chatbox-ellipses-outline' as const, color: '#B9854B', background: '#FFF7E8' },
  system: { icon: 'alarm-outline' as const, color: '#7C6BC4', background: '#F2EFFE' },
};

export default function AuthorityNotifications() {
  const router = useRouter();
  const [filter, setFilter] = useState<NotificationFilter>('ALL');
  const [notifications, setNotifications] = useState<AuthorityNotification[]>(
    authorityNotifications,
  );

  const unreadCount = notifications.filter((item) => !item.read).length;
  const visibleNotifications = useMemo(
    () => notifications.filter((item) => filter === 'ALL' || !item.read),
    [filter, notifications],
  );

  const openNotification = (notification: AuthorityNotification) => {
    setNotifications((current) =>
      current.map((item) =>
        item.id === notification.id ? { ...item, read: true } : item,
      ),
    );

    if (!notification.complaintId) return;
    router.push({
      pathname: '/authority/complaints/[complaintId]',
      params: { complaintId: notification.complaintId },
    } as never);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <AuthorityPageHeader />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.container}>
          <View style={styles.hero}>
            <View style={styles.heroIcon}>
              <Ionicons name="notifications-outline" size={25} color="#FFFFFF" />
            </View>
            <View style={styles.heroCopy}>
              <Text style={styles.eyebrow}>AUTHORITY UPDATES</Text>
              <Text style={styles.title}>Notifications</Text>
              <Text style={styles.subtitle}>
                Complaint assignments, urgency alerts, deadlines, and resident feedback.
              </Text>
            </View>
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadValue}>{unreadCount}</Text>
              <Text style={styles.unreadLabel}>unread</Text>
            </View>
          </View>

          <View style={styles.toolbar}>
            <View style={styles.filterRow}>
              {(['ALL', 'UNREAD'] as const).map((item) => (
                <Pressable
                  key={item}
                  onPress={() => setFilter(item)}
                  style={[styles.filterButton, filter === item && styles.filterButtonActive]}
                >
                  <Text style={[styles.filterText, filter === item && styles.filterTextActive]}>
                    {item === 'ALL' ? 'All' : `Unread (${unreadCount})`}
                  </Text>
                </Pressable>
              ))}
            </View>
            <TouchableOpacity
              disabled={unreadCount === 0}
              onPress={() =>
                setNotifications((current) =>
                  current.map((item) => ({ ...item, read: true })),
                )
              }
              style={[styles.markAllButton, unreadCount === 0 && styles.markAllButtonDisabled]}
            >
              <Ionicons name="checkmark-done-outline" size={16} color="#23435D" />
              <Text style={styles.markAllText}>Mark all read</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.notificationList}>
            {visibleNotifications.map((notification) => {
              const theme = notificationTheme[notification.type];
              return (
                <Pressable
                  key={notification.id}
                  onPress={() => openNotification(notification)}
                  style={({ pressed }) => [
                    styles.notificationCard,
                    !notification.read && styles.notificationCardUnread,
                    pressed && styles.notificationCardPressed,
                  ]}
                >
                  <View style={[styles.notificationIcon, { backgroundColor: theme.background }]}>
                    <Ionicons name={theme.icon} size={20} color={theme.color} />
                  </View>
                  <View style={styles.notificationCopy}>
                    <View style={styles.notificationHeading}>
                      <Text style={styles.notificationTitle}>{notification.title}</Text>
                      {!notification.read && <View style={styles.unreadDot} />}
                    </View>
                    <Text style={styles.notificationMessage}>{notification.message}</Text>
                    <Text style={styles.notificationTime}>{notification.time}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={17} color="#A7AFBA" />
                </Pressable>
              );
            })}
          </View>

          {visibleNotifications.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-circle-outline" size={34} color="#16845B" />
              <Text style={styles.emptyTitle}>You are all caught up</Text>
              <Text style={styles.emptyText}>There are no unread notifications.</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F7F8FA' },
  scrollContent: { paddingBottom: 34 },
  container: { width: '100%', maxWidth: 920, alignSelf: 'center', padding: 16, gap: 16 },
  hero: { flexDirection: 'row', alignItems: 'center', gap: 13, padding: 17, borderRadius: 15, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EAEDF1' },
  heroIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: '#23435D' },
  heroCopy: { flex: 1, minWidth: 0 },
  eyebrow: { color: '#B9854B', fontSize: 9, fontWeight: '900', letterSpacing: 0.7 },
  title: { color: '#111827', fontSize: 24, fontWeight: '800', marginTop: 2 },
  subtitle: { color: '#6B7280', fontSize: 10, lineHeight: 15, marginTop: 4 },
  unreadBadge: { alignItems: 'center', minWidth: 57, padding: 9, borderRadius: 12, backgroundColor: '#FFF1F1' },
  unreadValue: { color: '#E0524D', fontSize: 18, fontWeight: '900' },
  unreadLabel: { color: '#A76868', fontSize: 8, fontWeight: '700' },
  toolbar: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  filterRow: { flexDirection: 'row', gap: 7 },
  filterButton: { paddingHorizontal: 13, paddingVertical: 8, borderRadius: 17, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E6EB' },
  filterButtonActive: { backgroundColor: '#23435D', borderColor: '#23435D' },
  filterText: { color: '#667085', fontSize: 10, fontWeight: '700' },
  filterTextActive: { color: '#FFFFFF' },
  markAllButton: { minHeight: 36, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, borderRadius: 18, backgroundColor: '#E8EEF2' },
  markAllButtonDisabled: { opacity: 0.45 },
  markAllText: { color: '#23435D', fontSize: 9, fontWeight: '800' },
  notificationList: { gap: 9 },
  notificationCard: { minHeight: 94, flexDirection: 'row', alignItems: 'center', gap: 11, padding: 13, borderRadius: 13, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EAEDF1' },
  notificationCardUnread: { borderColor: '#C9DAE5', backgroundColor: '#FCFEFF' },
  notificationCardPressed: { opacity: 0.74 },
  notificationIcon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  notificationCopy: { flex: 1, minWidth: 0 },
  notificationHeading: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  notificationTitle: { flex: 1, color: '#263142', fontSize: 12, fontWeight: '800' },
  unreadDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#EF4444' },
  notificationMessage: { color: '#687386', fontSize: 10, lineHeight: 15, marginTop: 4 },
  notificationTime: { color: '#9AA2AE', fontSize: 8, marginTop: 6 },
  emptyState: { alignItems: 'center', padding: 35, borderRadius: 14, backgroundColor: '#FFFFFF' },
  emptyTitle: { color: '#344054', fontSize: 14, fontWeight: '800', marginTop: 9 },
  emptyText: { color: '#8A93A1', fontSize: 10, marginTop: 4 },
});
