// src/services/admin.service.ts
import { supabase } from "../lib/supabase";

export async function confirmDuplicate(dupId: string, adminNote?: string) {
  const { data: duplicateRow, error: duplicateError } = await supabase
    .from("duplicate")
    .select("comp_id")
    .eq("dup_id", dupId)
    .single();

  if (duplicateError || !duplicateRow) {
    throw new Error(
      `Failed to load duplicate complaint: ${duplicateError?.message ?? "Not found"}`,
    );
  }

  const { error } = await supabase
    .from("duplicate")
    .update({
      admin_status: "confirmed",
      reviewed_at: new Date().toISOString(),
      admin_note: adminNote || null,
    })
    .eq("dup_id", dupId);

  if (error) {
    throw new Error(`Failed to confirm duplicate: ${error.message}`);
  }

  if (duplicateRow.comp_id) {
    const { error: deleteError } = await supabase
      .from("complaints")
      .delete()
      .eq("comp_id", duplicateRow.comp_id);

    if (deleteError) {
      throw new Error(
        `Duplicate was accepted, but the submitted complaint could not be deleted: ${deleteError.message}`,
      );
    }
  }
}

export async function rejectDuplicate(dupId: string, adminNote?: string) {
  const { data: duplicateRow, error: duplicateError } = await supabase
    .from("duplicate")
    .select("comp_id")
    .eq("dup_id", dupId)
    .single();

  if (duplicateError || !duplicateRow) {
    throw new Error(
      `Failed to load duplicate complaint: ${duplicateError?.message ?? "Not found"}`,
    );
  }

  const { error } = await supabase
    .from("duplicate")
    .update({
      admin_status: "rejected",
      reviewed_at: new Date().toISOString(),
      admin_note: adminNote || null,
    })
    .eq("dup_id", dupId);

  if (error) {
    throw new Error(`Failed to reject duplicate: ${error.message}`);
  }

  if (duplicateRow.comp_id) {
    const { error: promoteError } = await supabase
      .from("complaints")
      .update({ status: "pending" })
      .eq("comp_id", duplicateRow.comp_id);

    if (promoteError) {
      throw new Error(
        `Duplicate was rejected, but the complaint could not be moved to all complaints: ${promoteError.message}`,
      );
    }
  }
}

export async function markAdminNotificationRead(notificationId: string) {
  const { error } = await supabase
    .from("notifications")
    .update({
      read_at: new Date().toISOString(),
      seen_at: new Date().toISOString(),
    })
    .eq("notification_id", notificationId);

  if (error) {
    throw new Error(`Failed to mark notification as read: ${error.message}`);
  }
}
