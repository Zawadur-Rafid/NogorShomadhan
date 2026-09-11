import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  notificationService,
  type AppNotification,
} from "@/services/notification.service";
import {
  setAllNotificationsRead,
  setNotificationRead,
  setNotificationsSeen,
} from "@/store/notification-store";

type UseNotificationsOptions = {
  limit?: number;
};

export function useNotifications(options: UseNotificationsOptions = {}) {
  const limit = options.limit ?? 60;
  const mountedRef = useRef(true);
  const requestIdRef = useRef(0);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      requestIdRef.current += 1;
    };
  }, []);

  const loadNotifications = useCallback(
    async (isRefresh = false) => {
      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      try {
        const nextNotifications = await notificationService.fetchNotifications({
          limit,
        });

        if (mountedRef.current && requestIdRef.current === requestId) {
          setNotifications(nextNotifications);
        }
      } catch (loadError) {
        if (mountedRef.current && requestIdRef.current === requestId) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Could not load notifications.",
          );
        }
      } finally {
        if (mountedRef.current && requestIdRef.current === requestId) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [limit],
  );

  useEffect(() => {
    void Promise.resolve().then(() => loadNotifications());
  }, [loadNotifications]);

  const refresh = useCallback(
    () => loadNotifications(true),
    [loadNotifications],
  );

  const markAsRead = useCallback(
    async (notificationId: string) => {
      const readAt = new Date();
      setNotifications((current) =>
        setNotificationRead(current, notificationId, readAt),
      );

      try {
        await notificationService.markAsRead(notificationId);
      } catch (readError) {
        setError(
          readError instanceof Error
            ? readError.message
            : "Could not mark the notification as read.",
        );
        await loadNotifications();
      }
    },
    [loadNotifications],
  );

  const markAllAsRead = useCallback(async () => {
    const readAt = new Date();
    setNotifications((current) => setAllNotificationsRead(current, readAt));

    try {
      await notificationService.markAllAsRead();
    } catch (readError) {
      setError(
        readError instanceof Error
          ? readError.message
          : "Could not mark all notifications as read.",
      );
      await loadNotifications();
    }
  }, [loadNotifications]);

  const markAllAsSeen = useCallback(async () => {
    const unseenIds = notifications
      .filter((notification) => !notification.seenAt)
      .map((notification) => notification.id);

    if (unseenIds.length === 0) return;

    const seenAt = new Date();
    const unseenIdSet = new Set(unseenIds);
    setNotifications((current) =>
      setNotificationsSeen(current, unseenIdSet, seenAt),
    );

    try {
      await notificationService.markNotificationsAsSeen(unseenIds);
    } catch (seenError) {
      setError(
        seenError instanceof Error
          ? seenError.message
          : "Could not update notification delivery state.",
      );
    }
  }, [notifications]);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.readAt).length,
    [notifications],
  );

  return {
    notifications,
    unreadCount,
    loading,
    refreshing,
    error,
    refresh,
    markAsRead,
    markAllAsRead,
    markAllAsSeen,
  };
}
