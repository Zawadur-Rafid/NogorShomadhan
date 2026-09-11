import type { AppNotification } from "@/services/notification.service";

export function setNotificationRead(
  notifications: AppNotification[],
  notificationId: string,
  readAt = new Date(),
): AppNotification[] {
  return notifications.map((notification) =>
    notification.id === notificationId
      ? { ...notification, seenAt: notification.seenAt ?? readAt, readAt }
      : notification,
  );
}

export function setAllNotificationsRead(
  notifications: AppNotification[],
  readAt = new Date(),
): AppNotification[] {
  return notifications.map((notification) =>
    notification.readAt
      ? notification
      : { ...notification, seenAt: notification.seenAt ?? readAt, readAt },
  );
}

export function setNotificationsSeen(
  notifications: AppNotification[],
  notificationIds: ReadonlySet<string>,
  seenAt = new Date(),
): AppNotification[] {
  return notifications.map((notification) =>
    !notification.seenAt && notificationIds.has(notification.id)
      ? { ...notification, seenAt }
      : notification,
  );
}
