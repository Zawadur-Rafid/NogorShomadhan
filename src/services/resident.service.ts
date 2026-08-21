import { supabase } from '../lib/supabase';
import { decode } from 'base64-arraybuffer';

export async function uploadEvidenceImage(base64: string): Promise<string> {
  const fileName = `complaint_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
  
  const { data, error } = await supabase.storage
    .from('evidence')
    .upload(fileName, decode(base64), {
      contentType: 'image/jpeg',
    });

  if (error) {
    throw new Error(`Failed to upload image: ${error.message}`);
  }

  const { data: publicUrlData } = supabase.storage
    .from('evidence')
    .getPublicUrl(data.path);

  return publicUrlData.publicUrl;
}

export async function createComplaint(complaintData: {
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  category: string;
  images: { uri: string, base64: string }[];
  acc_id?: string; // Optional for now if we don't have auth context
}) {
  // 1. Insert Complaint
  const { data: complaint, error: complaintError } = await supabase
    .from('complaints')
    .insert({
      title: complaintData.title,
      description: complaintData.description,
      latitude: complaintData.latitude,
      longitude: complaintData.longitude,
      category: complaintData.category,
      acc_id: complaintData.acc_id || null
    })
    .select('comp_id')
    .single();

  if (complaintError) {
    throw new Error(`Failed to insert complaint: ${complaintError.message}`);
  }

  const compId = complaint.comp_id;

  // 2. Upload Images and Insert Evidence
  for (const img of complaintData.images) {
    const publicUrl = await uploadEvidenceImage(img.base64);
    
    const { error: evidenceError } = await supabase
      .from('evidence')
      .insert({
        comp_id: compId,
        img_url: publicUrl
      });

    if (evidenceError) {
      console.error('Failed to insert evidence record:', evidenceError);
    }
  }

  return compId;
}
