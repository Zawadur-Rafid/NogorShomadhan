import AsyncStorage from "@react-native-async-storage/async-storage";

import { supabase } from "@/lib/supabase";

export type NotificationType =
  | "account_review_required"
  | "account_approved"
  | "account_rejected"
  | "complaint_review_required"
  | "duplicate_review_required"
  | "complaint_accepted"
  | "complaint_rejected"
  | "complaint_duplicate_confirmed"
  | "complaint_work_started"
  | "complaint_pending_stale"
  | "complaint_progress_updated"
  | "complaint_deadline_changed"
  | "complaint_deadline_milestone"
  | "complaint_overdue"
  | "complaint_resolved"
  | "complaint_feedback_received"
  | "complaint_feedback_replied"
  | "forum_comment_received"
  | "forum_reply_received"
  | "official_announcement"
  | "system_alert";

export type NotificationEntityType =
  | "account"
  | "complaint"
  | "feedback"
  | "forum_post"
  | "forum_comment"
  | "system";

export type NotificationPriority = "low" | "normal" | "high" | "urgent";

export interface AppNotification {
  id: string;
  recipientAccountId: string;
  actorAccountId: string | null;
  type: NotificationType;
  entityType: NotificationEntityType;
  entityId: string | null;
  eventKey: string;
  title: string;
  body: string;
  actionPath: string | null;
  data: Record<string, unknown>;
  priority: NotificationPriority;
  createdAt: Date;
  seenAt: Date | null;
  readAt: Date | null;
}

export interface FetchNotificationsOptions {
  accountId?: string;
  limit?: number;
  unreadOnly?: boolean;
}

type NotificationRow = {
  notification_id: string;
  recipient_acc_id: string;
  actor_acc_id: string | null;
  type: NotificationType;
  entity_type: NotificationEntityType;
  entity_id: string | null;
  event_key: string;
  title: string;
  body: string;
  action_path: string | null;
  data: unknown;
  priority: NotificationPriority;
  created_at: string;
  seen_at: string | null;
  read_at: string | null;
};

const NOTIFICATION_COLUMNS =
  "notification_id, recipient_acc_id, actor_acc_id, type, entity_type, entity_id, event_key, title, body, action_path, data, priority, created_at, seen_at, read_at";

function parseNotificationDate(value: string | null): Date | null {
  if (!value) return null;

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function mapNotificationRow(row: NotificationRow): AppNotification {
  const createdAt = parseNotificationDate(row.created_at) ?? new Date();
  const data =
    row.data && typeof row.data === "object" && !Array.isArray(row.data)
      ? (row.data as Record<string, unknown>)
      : {};

  return {
    id: row.notification_id,
    recipientAccountId: row.recipient_acc_id,
    actorAccountId: row.actor_acc_id,
    type: row.type,
    entityType: row.entity_type,
    entityId: row.entity_id,
    eventKey: row.event_key,
    title: row.title,
    body: row.body,
    actionPath: row.action_path,
    data,
    priority: row.priority,
    createdAt,
    seenAt: parseNotificationDate(row.seen_at),
    readAt: parseNotificationDate(row.read_at),
  };
}

async function getNotificationAccountId(explicitAccountId?: string): Promise<string> {
  const accountId = explicitAccountId ?? (await AsyncStorage.getItem("acc_id"));

  if (!accountId) {
    throw new Error("No logged-in account was found for notifications.");
  }

  return accountId;
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return diffInSeconds + " sec ago";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return diffInMinutes + " min ago";
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return diffInHours + " hr ago";
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return "Yesterday";
  if (diffInDays < 30) return diffInDays + " days ago";
  return date.toLocaleDateString();
}

function getFirst<T>(value: T | T[] | null | undefined): T | null | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value ?? null;
}

export interface AdminNotification {
  id: string;
  type:
    | "account"
    | "complaint_review"
    | "forum_announcement"
    | "complaint_update"
    | "duplicate_review";
  icon: string;
  title: string;
  message: string;
  time: string;
  route: string;
  createdAt: Date;
}

export interface ForumNotification {
  id: string;
  type: "forum_post" | "forum_comment" | "forum_announcement";
  icon: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  createdAt: Date;
}

export const notificationService = {
  async fetchNotifications(
    options: FetchNotificationsOptions = {},
  ): Promise<AppNotification[]> {
    const accountId = await getNotificationAccountId(options.accountId);
    const limit = Math.min(Math.max(options.limit ?? 60, 1), 200);

    let query = supabase
      .from("notifications")
      .select(NOTIFICATION_COLUMNS)
      .eq("recipient_acc_id", accountId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (options.unreadOnly) {
      query = query.is("read_at", null);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to load notifications: ${error.message}`);
    }

    return ((data ?? []) as NotificationRow[]).map(mapNotificationRow);
  },

  async fetchUnreadCount(accountId?: string): Promise<number> {
    const recipientAccountId = await getNotificationAccountId(accountId);
    const { count, error } = await supabase
      .from("notifications")
      .select("notification_id", { count: "exact", head: true })
      .eq("recipient_acc_id", recipientAccountId)
      .is("read_at", null);

    if (error) {
      throw new Error(`Failed to load unread notification count: ${error.message}`);
    }

    return count ?? 0;
  },

  async markNotificationsAsSeen(
    notificationIds: string[],
    accountId?: string,
  ): Promise<void> {
    if (notificationIds.length === 0) return;

    const recipientAccountId = await getNotificationAccountId(accountId);
    const { error } = await supabase
      .from("notifications")
      .update({ seen_at: new Date().toISOString() })
      .eq("recipient_acc_id", recipientAccountId)
      .in("notification_id", notificationIds)
      .is("seen_at", null);

    if (error) {
      throw new Error(`Failed to mark notifications as seen: ${error.message}`);
    }
  },

  async markAsRead(notificationId: string, accountId?: string): Promise<void> {
    const recipientAccountId = await getNotificationAccountId(accountId);
    const timestamp = new Date().toISOString();
    const { error } = await supabase
      .from("notifications")
      .update({ seen_at: timestamp, read_at: timestamp })
      .eq("recipient_acc_id", recipientAccountId)
      .eq("notification_id", notificationId);

    if (error) {
      throw new Error(`Failed to mark notification as read: ${error.message}`);
    }
  },

  async markAllAsRead(accountId?: string): Promise<void> {
    const recipientAccountId = await getNotificationAccountId(accountId);
    const timestamp = new Date().toISOString();
    const { error } = await supabase
      .from("notifications")
      .update({ seen_at: timestamp, read_at: timestamp })
      .eq("recipient_acc_id", recipientAccountId)
      .is("read_at", null);

    if (error) {
      throw new Error(`Failed to mark all notifications as read: ${error.message}`);
    }
  },

  async fetchAdminNotifications(): Promise<AdminNotification[]> {
    try {
      const notifications: AdminNotification[] = [];

      const adminAccountId = await AsyncStorage.getItem("acc_id");
      if (adminAccountId) {
        const { data: inboxNotifications, error: inboxError } = await supabase
          .from("notifications")
          .select(
            "notification_id,type,title,body,action_path,created_at,entity_id,data,read_at",
          )
          .eq("recipient_acc_id", adminAccountId)
          .is("read_at", null)
          .order("created_at", { ascending: false })
          .limit(40);

        if (inboxError) {
          console.warn(
            "Error fetching persistent admin notifications:",
            inboxError.message,
          );
        } else {
          (inboxNotifications ?? []).forEach((notification) => {
            const isDuplicate =
              notification.type === "duplicate_review_required";
            notifications.push({
              id: notification.notification_id,
              type: isDuplicate ? "duplicate_review" : "complaint_update",
              icon: isDuplicate
                ? "git-compare-outline"
                : "notifications-outline",
              title: notification.title,
              message: notification.body,
              time: formatTimeAgo(notification.created_at),
              route:
                isDuplicate && notification.data?.duplicate_id
                  ? `/(admin)/duplicates/${notification.data.duplicate_id}`
                  : (notification.action_path ?? "/(admin)/dashboard"),
              createdAt: new Date(notification.created_at),
            });
          });
        }
      }

      const { data: newAccounts, error: accountsError } = await supabase
        .from("account")
        .select("acc_id, full_name, username, created_at, status")
        .eq("status", "unverified")
        .order("created_at", { ascending: false })
        .limit(25);

      if (accountsError) {
        console.warn(
          "Error fetching new accounts for notifications:",
          accountsError.message,
        );
      }

      if (newAccounts) {
        newAccounts.forEach((account) => {
          notifications.push({
            id: "account-" + account.acc_id,
            type: "account",
            icon: "person-add-outline",
            title: "New account registered",
            message: `${account.full_name || "A user"} (${account.username || "unknown"}) is waiting for approval.`,
            time: formatTimeAgo(account.created_at ?? new Date().toISOString()),
            route: "/(admin)/accounts/pending",
            createdAt: new Date(account.created_at ?? Date.now()),
          });
        });
      }

      const { data: newComplaints, error: complaintsError } = await supabase
        .from("complaints")
        .select("comp_id, title, status, timestamp")
        .eq("status", "unverified")
        .order("timestamp", { ascending: false })
        .limit(25);

      if (complaintsError) {
        console.warn(
          "Error fetching complaints for notifications:",
          complaintsError.message,
        );
      }

      if (newComplaints) {
        newComplaints.forEach((complaint) => {
          notifications.push({
            id: "complaint-review-" + complaint.comp_id,
            type: "complaint_review",
            icon: "document-text-outline",
            title: "New complaint for review",
            message: `"${complaint.title}" is waiting for admin review.`,
            time: formatTimeAgo(
              complaint.timestamp ?? new Date().toISOString(),
            ),
            route: "/(admin)/complaints/review",
            createdAt: new Date(complaint.timestamp ?? Date.now()),
          });
        });
      }

      const { data: announcements, error: announcementsError } = await supabase
        .from("forum_posts")
        .select(
          "post_id, title, created_at, is_official, account:account!acc_id(full_name)",
        )
        .eq("is_official", true)
        .order("created_at", { ascending: false })
        .limit(25);

      if (announcementsError) {
        console.warn(
          "Error fetching forum announcements:",
          announcementsError.message,
        );
      }

      if (announcements) {
        announcements.forEach((post) => {
          const author = getFirst(
            post.account as
              | { full_name?: string }
              | { full_name?: string }[]
              | null
              | undefined,
          );
          const authorName = author?.full_name || "Admin";

          notifications.push({
            id: "forum-announcement-" + post.post_id,
            type: "forum_announcement",
            icon: "megaphone-outline",
            title: "New announcement",
            message: `${authorName} posted: "${post.title}"`,
            time: formatTimeAgo(post.created_at),
            route: "/(admin)/forum",
            createdAt: new Date(post.created_at),
          });
        });
      }

      const { data: complaintStatusHistory, error: statusHistoryError } =
        await supabase
          .from("complaint_status_history")
          .select(
            "history_id, comp_id, from_status, to_status, changed_at, complaint:complaints!comp_id(title)",
          )
          .order("changed_at", { ascending: false })
          .limit(25);

      if (statusHistoryError) {
        console.warn(
          "Error fetching complaint status history:",
          statusHistoryError.message,
        );
      }

      if (complaintStatusHistory) {
        complaintStatusHistory.forEach((history) => {
          if (
            !history.from_status ||
            !history.to_status ||
            history.from_status === history.to_status
          ) {
            return;
          }

          const complaint = getFirst(
            history.complaint as
              | { title?: string }
              | { title?: string }[]
              | null
              | undefined,
          );
          const complaintTitle = complaint?.title || "Complaint";

          notifications.push({
            id: "complaint-status-" + history.history_id,
            type: "complaint_update",
            icon: "sync-outline",
            title: "Complaint status changed",
            message: `"${complaintTitle}" changed from ${history.from_status} to ${history.to_status}.`,
            time: formatTimeAgo(history.changed_at),
            route: `/(admin)/complaints/${history.comp_id}`,
            createdAt: new Date(history.changed_at),
          });
        });
      }

      const { data: complaintWorkUpdates, error: workUpdateError } =
        await supabase
          .from("complaint_work_updates")
          .select(
            "update_id, comp_id, update_type, note, created_at, complaint:complaints!comp_id(title)",
          )
          .order("created_at", { ascending: false })
          .limit(25);

      if (workUpdateError) {
        console.warn(
          "Error fetching complaint work updates:",
          workUpdateError.message,
        );
      }

      if (complaintWorkUpdates) {
        complaintWorkUpdates.forEach((update) => {
          const complaint = getFirst(
            update.complaint as
              | { title?: string }
              | { title?: string }[]
              | null
              | undefined,
          );
          const complaintTitle = complaint?.title || "Complaint";
          const messageTail = update.note
            ? update.note
            : update.update_type === "completion"
              ? "Complaint marked as completed."
              : "Work progress was updated.";

          notifications.push({
            id: "complaint-update-" + update.update_id,
            type: "complaint_update",
            icon: "build-outline",
            title: "Complaint progress update",
            message: `"${complaintTitle}" ${messageTail}`,
            time: formatTimeAgo(update.created_at),
            route: `/(admin)/complaints/${update.comp_id}`,
            createdAt: new Date(update.created_at),
          });
        });
      }

      return notifications
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 40);
    } catch (e) {
      console.error("Unexpected error in fetchAdminNotifications:", e);
      return [];
    }
  },

  async fetchForumNotifications(
    role: "admin" | "authority" | "resident",
    accId?: string,
  ): Promise<ForumNotification[]> {
    try {
      const notifications: ForumNotification[] = [];

      const { data: posts, error: postsError } = await supabase
        .from("forum_posts")
        .select("*, account:account!acc_id(full_name, username, role)")
        .order("created_at", { ascending: false });

      if (postsError) {
        console.warn(
          "Error fetching posts for notifications:",
          postsError.message,
        );
      }

      if (posts) {
        posts.forEach((post) => {
          const authorRole = post.account?.role;
          const authorName = post.account?.full_name || "Someone";

          if (role === "admin") {
            if (!post.is_official) {
              notifications.push({
                id: "post-" + post.post_id,
                type: "forum_post",
                icon: "chatbubble-ellipses-outline",
                title: "New Forum Post",
                message: authorName + ' posted: "' + post.title + '"',
                time: formatTimeAgo(post.created_at),
                read: false,
                createdAt: new Date(post.created_at),
              });
            } else if (authorRole === "authority") {
              notifications.push({
                id: "ann-" + post.post_id,
                type: "forum_announcement",
                icon: "megaphone-outline",
                title: "New Announcement",
                message: 'Authority posted: "' + post.title + '"',
                time: formatTimeAgo(post.created_at),
                read: false,
                createdAt: new Date(post.created_at),
              });
            }
          }

          if (role === "authority") {
            if (!post.is_official) {
              notifications.push({
                id: "post-" + post.post_id,
                type: "forum_post",
                icon: "chatbubble-ellipses-outline",
                title: "New Forum Post",
                message: authorName + ' posted: "' + post.title + '"',
                time: formatTimeAgo(post.created_at),
                read: false,
                createdAt: new Date(post.created_at),
              });
            } else if (authorRole === "admin") {
              notifications.push({
                id: "ann-" + post.post_id,
                type: "forum_announcement",
                icon: "megaphone-outline",
                title: "New Announcement",
                message: 'Admin posted: "' + post.title + '"',
                time: formatTimeAgo(post.created_at),
                read: false,
                createdAt: new Date(post.created_at),
              });
            }
          }

          if (role === "resident") {
            if (post.is_official) {
              notifications.push({
                id: "ann-" + post.post_id,
                type: "forum_announcement",
                icon: "megaphone-outline",
                title: "New Announcement",
                message:
                  (authorRole === "admin" ? "Admin" : "Authority") +
                  ' posted: "' +
                  post.title +
                  '"',
                time: formatTimeAgo(post.created_at),
                read: false,
                createdAt: new Date(post.created_at),
              });
            } else if (post.acc_id !== accId) {
              notifications.push({
                id: "post-" + post.post_id,
                type: "forum_post",
                icon: "chatbubble-ellipses-outline",
                title: "New Resident Post",
                message: authorName + ' posted: "' + post.title + '"',
                time: formatTimeAgo(post.created_at),
                read: false,
                createdAt: new Date(post.created_at),
              });
            }
          }
        });
      }

      if (role === "resident" && accId) {
        const myPosts = posts?.filter((p) => p.acc_id === accId) || [];
        const myPostIds = myPosts.map((p) => p.post_id);

        if (myPostIds.length > 0) {
          const { data: comments, error: commentsError } = await supabase
            .from("forum_comments")
            .select("*, account:account!acc_id(full_name)")
            .in("post_id", myPostIds)
            .neq("acc_id", accId)
            .order("created_at", { ascending: false });

          if (commentsError) {
            console.warn(
              "Error fetching comments for notifications:",
              commentsError.message,
            );
          }

          if (comments) {
            comments.forEach((comment) => {
              const authorName = comment.account?.full_name || "Someone";
              notifications.push({
                id: "comment-" + comment.comment_id,
                type: "forum_comment",
                icon: "chatbox-outline",
                title: "New Comment",
                message: authorName + " commented on your post.",
                time: formatTimeAgo(comment.created_at),
                read: false,
                createdAt: new Date(comment.created_at),
              });
            });
          }
        }
      }

      return notifications.sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
      );
    } catch (e) {
      console.error("Unexpected error in fetchForumNotifications:", e);
      return [];
    }
  },
};
