// src/services/admin.service.ts
import { supabase } from '../lib/supabase';

export async function confirmDuplicate(dupId: string, adminNote?: string) {
  const { error } = await supabase
    .from('duplicate')
    .update({
      admin_status: 'confirmed',
      reviewed_at: new Date().toISOString(),
      admin_note: adminNote || null
    })
    .eq('dup_id', dupId);

  if (error) {
    throw new Error(`Failed to confirm duplicate: ${error.message}`);
  }
}

export async function rejectDuplicate(dupId: string, adminNote?: string) {
  const { error } = await supabase
    .from('duplicate')
    .update({
      admin_status: 'rejected',
      reviewed_at: new Date().toISOString(),
      admin_note: adminNote || null
    })
    .eq('dup_id', dupId);

  if (error) {
    throw new Error(`Failed to reject duplicate: ${error.message}`);
  }
}
