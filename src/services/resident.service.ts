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
  house?: string;
  road?: string;
  avenue?: string;
  nearby_landmark?: string;
  additional_location_details?: string;
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
      house: complaintData.house,
      road: complaintData.road,
      avenue: complaintData.avenue,
      nearby_landmark: complaintData.nearby_landmark,
      additional_location_details: complaintData.additional_location_details,
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

// getMapComplaints removed since map is removed
export interface DashboardData {
  stats: {
    total: number;
    pending: number;
    inProgress: number;
    resolved: number;
  };
  recentComplaints: any[];
}

export async function getDashboardData(): Promise<DashboardData> {
  const { data, error } = await supabase
    .from('complaints')
    .select('comp_id, title, description, house, road, avenue, nearby_landmark, additional_location_details, status, urgency, timestamp, category')
    .order('timestamp', { ascending: false });

  if (error) {
    throw new Error(`Failed to load dashboard data: ${error.message}`);
  }

  const complaints = data || [];
  
  let pending = 0;
  let inProgress = 0;
  let resolved = 0;

  complaints.forEach((c) => {
    if (c.status.toLowerCase() === 'pending' || c.status.toLowerCase() === 'unverified') pending++;
    else if (c.status.toLowerCase() === 'in progress') inProgress++;
    else if (c.status.toLowerCase() === 'resolved') resolved++;
  });

  const getIconForCategory = (category: string) => {
    switch (category) {
      case 'Water Supply': return 'water-outline';
      case 'Roads & Traffic': return 'construct-outline';
      case 'Streetlights': return 'bulb-outline';
      case 'Waste Management': return 'trash-outline';
      case 'Parks & Recreation': return 'bicycle-outline';
      case 'Public Safety': return 'paw-outline';
      case 'Drainage System': return 'water-outline';
      case 'Electricity': return 'flash-outline';
      default: return 'alert-circle-outline';
    }
  };

  const getColorForStatus = (status: string) => {
    if (status.toLowerCase() === 'pending' || status.toLowerCase() === 'unverified') return '#EF4444';
    if (status.toLowerCase() === 'in progress') return '#F59E0B';
    if (status.toLowerCase() === 'resolved') return '#3B82F6';
    return '#6B7280';
  };

  const getAddress = (c: any) => {
    const parts = [c.house, c.road, c.avenue, c.nearby_landmark].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'Location not provided';
  };

  const recentComplaints = complaints.slice(0, 3).map(c => {
    const d = new Date(c.timestamp || Date.now());
    const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return {
      id: c.comp_id,
      title: c.title,
      description: c.description,
      date: dateStr,
      location: getAddress(c),
      status: c.status.toUpperCase(),
      urgencyCount: c.urgency,
      color: getColorForStatus(c.status),
      icon: getIconForCategory(c.category)
    };
  });

  return {
    stats: {
      total: complaints.length,
      pending,
      inProgress,
      resolved
    },
    recentComplaints
  };
}

export async function getFeedComplaints() {
  const { data, error } = await supabase
    .from('complaints')
    .select('comp_id, title, description, house, road, avenue, nearby_landmark, additional_location_details, status, urgency, timestamp, category')
    .order('timestamp', { ascending: false });

  if (error) {
    throw new Error(`Failed to load feed complaints: ${error.message}`);
  }

  const complaints = data || [];
  
  if (complaints.length === 0) return [];
  
  const complaintIds = complaints.map(c => c.comp_id);
  const { data: evidenceData } = await supabase
    .from('evidence')
    .select('comp_id, img_url')
    .in('comp_id', complaintIds);
    
  const evidenceMap = new Map();
  if (evidenceData) {
    evidenceData.forEach(ev => {
      if (!evidenceMap.has(ev.comp_id)) {
        evidenceMap.set(ev.comp_id, ev.img_url);
      }
    });
  }

  return complaints.map(c => {
    const d = new Date(c.timestamp || Date.now());
    const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    
    return {
      id: c.comp_id,
      title: c.title,
      description: c.description,
      date: dateStr,
      location: [c.house, c.road, c.avenue, c.nearby_landmark].filter(Boolean).join(', ') || 'Location not provided',
      status: c.status.toUpperCase(),
      category: c.category,
      urgencyCount: c.urgency,
      image: evidenceMap.get(c.comp_id) || null
    };
  });
}

export async function getMyFeedComplaints() {
  const accId = await AsyncStorage.getItem('acc_id');
  if (!accId) throw new Error('No logged-in resident account found.');

  const { data, error } = await supabase
    .from('complaints')
    .select('comp_id, title, description, house, road, avenue, nearby_landmark, additional_location_details, status, urgency, timestamp, category')
    .eq('acc_id', accId)
    .order('timestamp', { ascending: false });

  if (error) {
    throw new Error(`Failed to load my complaints: ${error.message}`);
  }

  const complaints = data || [];
  if (complaints.length === 0) return [];

  const complaintIds = complaints.map(c => c.comp_id);
  const { data: evidenceData } = await supabase
    .from('evidence')
    .select('comp_id, img_url')
    .in('comp_id', complaintIds);

  const evidenceMap = new Map();
  if (evidenceData) {
    evidenceData.forEach(ev => {
      if (!evidenceMap.has(ev.comp_id)) {
        evidenceMap.set(ev.comp_id, [ev.img_url]);
      } else {
        evidenceMap.get(ev.comp_id).push(ev.img_url);
      }
    });
  }

  return complaints.map(c => {
    const d = new Date(c.timestamp || Date.now());
    const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const images = evidenceMap.get(c.comp_id) || [];
    
    return {
      id: c.comp_id,
      title: c.title,
      description: c.description,
      date: dateStr,
      location: [c.house, c.road, c.avenue, c.nearby_landmark].filter(Boolean).join(', ') || 'Location not provided',
      status: c.status.toUpperCase(),
      category: c.category,
      urgencyCount: c.urgency,
      image: images[0] || null,
      images: images
    };
  });
}

export async function getComplaintDetails(compId: string) {
  const { data, error } = await supabase
    .from('complaints')
    .select('comp_id, title, description, house, road, avenue, nearby_landmark, additional_location_details, status, urgency, timestamp, category')
    .eq('comp_id', compId)
    .single();

  if (error) {
    throw new Error(`Failed to load complaint details: ${error.message}`);
  }

  const { data: evidenceData } = await supabase
    .from('evidence')
    .select('img_url')
    .eq('comp_id', compId);

  const images = (evidenceData || []).map((e) => e.img_url);

  const d = new Date(data.timestamp || Date.now());
  const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return {
    id: data.comp_id,
    title: data.title,
    description: data.description,
    date: dateStr,
    location: [data.house, data.road, data.avenue, data.nearby_landmark, data.additional_location_details].filter(Boolean).join(', ') || 'Location not provided',
    status: data.status.toUpperCase(),
    category: data.category,
    urgencyCount: data.urgency,
    house: data.house,
    road: data.road,
    avenue: data.avenue,
    nearby_landmark: data.nearby_landmark,
    additional_location_details: data.additional_location_details,
    images: images,
    updates: [],
    contractorAssignments: [],
    feedback: [],
    approval: null,
  };
}

export async function getAnalyticsData() {
  const accId = await AsyncStorage.getItem('acc_id');
  const { data, error } = await supabase
    .from('complaints')
    .select('status, category, acc_id');

  if (error) {
    throw new Error(`Failed to load analytics data: ${error.message}`);
  }

  const all = data || [];
  const my = all.filter((c) => c.acc_id === accId);
  
  return { all, my };
}