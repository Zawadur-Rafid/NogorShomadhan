import { supabase } from "../lib/supabase";

type DuplicateConfirmationRow = {
  acc_id: string | null;
  comp_id: string | null;
  matched_comp_id: string;
};

function complaintReference(complaintId: string) {
  return `Complaint ${complaintId.slice(0, 8)}`;
}

async function ensureDuplicateConfirmationNotification(
  dupId: string,
  duplicate: DuplicateConfirmationRow,
) {
  if (!duplicate.acc_id) {
    throw new Error("The duplicate complaint has no resident to notify.");
  }

  const { data: baseComplaint, error: baseComplaintError } = await supabase
    .from("complaints")
    .select("title")
    .eq("comp_id", duplicate.matched_comp_id)
    .single();

  if (baseComplaintError || !baseComplaint) {
    throw new Error(
      `Failed to load the base complaint: ${baseComplaintError?.message ?? "Not found"}`,
    );
  }

  const baseReference = complaintReference(duplicate.matched_comp_id);
  const candidateReference = duplicate.comp_id
    ? complaintReference(duplicate.comp_id)
    : "Your report";

  const { error: notificationError } = await supabase
    .from("notifications")
    .upsert(
      {
        recipient_acc_id: duplicate.acc_id,
        actor_acc_id: null,
        type: "complaint_duplicate_confirmed",
        entity_type: "complaint",
        entity_id: duplicate.matched_comp_id,
        event_key: `duplicate:${dupId}:confirmed`,
        title: "Complaint linked to an existing report",
        body:
          `${candidateReference} was confirmed as a duplicate of base complaint ` +
          `${baseReference} — "${baseComplaint.title}". Follow ${baseReference} to track its progress.`,
        action_path: `/(resident)/complaints/${duplicate.matched_comp_id}`,
        data: {
          duplicate_id: dupId,
          candidate_complaint_id: duplicate.comp_id,
          candidate_complaint_label: candidateReference,
          canonical_complaint_id: duplicate.matched_comp_id,
          canonical_complaint_label: baseReference,
        },
        priority: "normal",
      },
      {
        onConflict: "recipient_acc_id,event_key",
        ignoreDuplicates: true,
      },
    );

  if (notificationError) {
    throw new Error(
      `Duplicate was confirmed, but the resident notification could not be created: ${notificationError.message}`,
    );
  }
}

export async function confirmDuplicate(dupId: string, adminNote?: string) {
  const { data: duplicateRow, error: duplicateError } = await supabase
    .from("duplicate")
    .select("acc_id,comp_id,matched_comp_id")
    .eq("dup_id", dupId)
    .single();

  if (duplicateError || !duplicateRow) {
    throw new Error(
      `Failed to load duplicate complaint: ${duplicateError?.message ?? "Not found"}`,
    );
  }

  const { data: updatedDuplicate, error } = await supabase
    .from("duplicate")
    .update({
      admin_status: "confirmed",
      reviewed_at: new Date().toISOString(),
      admin_note: adminNote || null,
    })
    .eq("dup_id", dupId)
    .select("admin_status")
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to confirm duplicate: ${error.message}`);
  }

  if (updatedDuplicate?.admin_status !== "confirmed") {
    throw new Error(
      "The duplicate could not be confirmed. Check the duplicate table UPDATE policy.",
    );
  }

  await ensureDuplicateConfirmationNotification(dupId, duplicateRow);

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

  const { data: updatedDuplicate, error } = await supabase
    .from("duplicate")
    .update({
      admin_status: "rejected",
      reviewed_at: new Date().toISOString(),
      admin_note: adminNote || null,
    })
    .eq("dup_id", dupId)
    .select("admin_status")
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to reject duplicate: ${error.message}`);
  }

  if (updatedDuplicate?.admin_status !== "rejected") {
    throw new Error(
      "The duplicate decision could not be saved. Check the duplicate table UPDATE policy.",
    );
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
