import AsyncStorage from '@react-native-async-storage/async-storage';
import { decode } from 'base64-arraybuffer';

import { supabase } from '../lib/supabase';

export async function uploadEvidenceImage(base64: string): Promise<string> {
  const fileName = `complaint_${Date.now()}_${Math.random()
    .toString(36)
    .substring(7)}.jpg`;

  const { data, error } = await supabase.storage
    .from('evidence')
    .upload(fileName, decode(base64), {
      contentType: 'image/jpeg',
      upsert: false,
    });

  if (error) {
    throw new Error(`Failed to upload image: ${error.message}`);
  }

  const { data: publicUrlData } = supabase.storage
    .from('evidence')
    .getPublicUrl(data.path);

  return publicUrlData.publicUrl;
}

async function getSubmittingResidentId(explicitAccId?: string): Promise<string> {
  const accId = explicitAccId ?? (await AsyncStorage.getItem('acc_id'));

  if (!accId) {
    throw new Error('No logged-in resident account was found.');
  }

  const { data: account, error } = await supabase
    .from('account')
    .select('acc_id, role, status')
    .eq('acc_id', accId)
    .single();

  if (error) {
    throw new Error(`Failed to verify resident account: ${error.message}`);
  }

  if (account.role !== 'resident') {
    throw new Error('Only a resident account can submit a complaint.');
  }

  if (account.status !== 'verified') {
    throw new Error('Resident account must be verified before submitting a complaint.');
  }

  return accId;
}

export async function createComplaint(complaintData: {
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  category: string;
  images: { uri: string; base64: string }[];
  acc_id?: string;
}) {
  const residentAccId = await getSubmittingResidentId(complaintData.acc_id);

  const { data: complaint, error: complaintError } = await supabase
    .from('complaints')
    .insert({
      title: complaintData.title,
      description: complaintData.description,
      latitude: complaintData.latitude,
      longitude: complaintData.longitude,
      category: complaintData.category,
      acc_id: residentAccId,
    })
    .select('comp_id')
    .single();

  if (complaintError) {
    throw new Error(`Failed to insert complaint: ${complaintError.message}`);
  }

  const compId = complaint.comp_id;

  for (const image of complaintData.images) {
    const publicUrl = await uploadEvidenceImage(image.base64);

    const { error: evidenceError } = await supabase
      .from('evidence')
      .insert({
        comp_id: compId,
        img_url: publicUrl,
      });

    if (evidenceError) {
      throw new Error(
        `Complaint was created, but evidence could not be saved: ${evidenceError.message}`,
      );
    }
  }

  return compId;
}