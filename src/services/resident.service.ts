import AsyncStorage from '@react-native-async-storage/async-storage';
import { decode } from 'base64-arraybuffer';

import { supabase } from '../lib/supabase';
import { feedbackService } from './feedback.service';

export function formatLocation(data: { house?: string; road?: string; avenue?: string; nearby_landmark?: string; additional_location_details?: string }) {
  const parts = [];
  if (data.house) parts.push(`House ${data.house}`);
  if (data.road) parts.push(`Road ${data.road}`);
  if (data.avenue) parts.push(`Avenue ${data.avenue}`);
  if (data.nearby_landmark) parts.push(data.nearby_landmark);
  if (data.additional_location_details) parts.push(data.additional_location_details);
  
  return parts.length > 0 ? parts.join(', ') : 'Location not provided';
}

function getInitials(name: string) {
  if (!name || !name.trim()) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'N/A';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatBudget(budget: number | string | null | undefined) {
  if (budget == null) return undefined;
  const num = Number(budget);
  if (isNaN(num)) return String(budget);
  return `৳${num.toLocaleString('en-IN')}`;
}

function getWorkUpdateTitle(type: string) {
  switch (type) {
    case 'start': return 'Work started';
    case 'progress_update': return 'Progress update';
    case 'contractor_change': return 'Contractor changed';
    case 'budget_deadline_change': return 'Budget / Deadline updated';
    case 'completion': return 'Work completed';
    default: return 'Work update';
  }
}

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
    .select('comp_id, title, description, house, road, avenue, nearby_landmark, additional_location_details, status, timestamp, category')
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
    return formatLocation(c);
  };

  const recentComplaints = complaints
    .filter((c) => c.status.toLowerCase() !== 'unverified')
    .slice(0, 3)
    .map(c => {
    const d = new Date(c.timestamp || Date.now());
    const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return {
      id: c.comp_id,
      title: c.title,
      description: c.description,
      date: dateStr,
      location: getAddress(c),
      status: c.status.toUpperCase(),
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
    .select('comp_id, title, description, house, road, avenue, nearby_landmark, additional_location_details, status, timestamp, category')
    .order('timestamp', { ascending: false });

  if (error) {
    throw new Error(`Failed to load feed complaints: ${error.message}`);
  }

  const complaints = (data || []).filter(c => c.status?.toLowerCase() !== 'unverified');
  
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
      location: formatLocation(c),
      status: c.status.toUpperCase(),
      category: c.category,
      image: evidenceMap.get(c.comp_id) || null
    };
  });
}

export async function getMyFeedComplaints() {
  const accId = await AsyncStorage.getItem('acc_id');
  if (!accId) throw new Error('No logged-in resident account found.');

  const { data, error } = await supabase
    .from('complaints')
    .select('comp_id, title, description, house, road, avenue, nearby_landmark, additional_location_details, status, timestamp, category')
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
      location: formatLocation(c),
      status: c.status.toUpperCase(),
      category: c.category,
      image: images[0] || null,
      images: images
    };
  });
}

export async function getComplaintDetails(compId: string) {
  const { data: complaintData, error } = await supabase
    .from('complaints')
    .select('comp_id, title, description, house, road, avenue, nearby_landmark, additional_location_details, status, timestamp, category, acc_id')
    .eq('comp_id', compId)
    .single();

  if (error || !complaintData) {
    throw new Error(`Failed to load complaint details: ${error?.message}`);
  }

  const [
    evidenceResult,
    duplicateResult,
    historyResult,
    workUpdateResult,
    contractorResult,
    updateEvidenceResult,
    resolutionResult,
  ] = await Promise.all([
    supabase.from('evidence').select('*').eq('comp_id', compId),
    supabase.from('duplicate').select('*').eq('comp_id', compId),
    supabase
      .from('complaint_status_history')
      .select('*')
      .eq('comp_id', compId)
      .order('changed_at', { ascending: true }),
    supabase
      .from('complaint_work_updates')
      .select('*')
      .eq('comp_id', compId)
      .order('created_at', { ascending: true }),
    supabase
      .from('contractor_history')
      .select('*')
      .eq('comp_id', compId)
      .order('changed_at', { ascending: true }),
    supabase
      .from('complaint_update_evidence')
      .select('*')
      .eq('comp_id', compId)
      .order('uploaded_at', { ascending: true }),
    supabase
      .from('complaint_resolution')
      .select('*')
      .eq('comp_id', compId)
      .single(),
  ]);

  const evidenceRows = evidenceResult.data || [];
  const duplicateRows = duplicateResult.data || [];
  const historyRows = historyResult.data || [];
  const workUpdateRows = workUpdateResult.data || [];
  const contractorRows = contractorResult.data || [];
  const updateEvidenceRows = updateEvidenceResult.data || [];
  const resolution = resolutionResult.data;

  // Fetch accounts
  const duplicateReporterIds = duplicateRows
    .map((duplicate) => duplicate.acc_id)
    .filter((id) => Boolean(id));

  const historyActorIds = historyRows
    .map((history) => history.changed_by_acc_id)
    .filter(Boolean);

  const accountIds = [
    ...new Set([
      complaintData.acc_id,
      ...duplicateReporterIds,
      ...historyActorIds,
    ].filter(Boolean)),
  ];

  let accounts: any[] = [];
  if (accountIds.length > 0) {
    const { data: accountData } = await supabase
      .from('account')
      .select('acc_id, full_name, phone_num, email, role')
      .in('acc_id', accountIds);
    accounts = accountData || [];
  }

  const accountMap = new Map(accounts.map((acc) => [acc.acc_id, acc]));

  // Resolve Reporters
  const reporter = complaintData.acc_id ? accountMap.get(complaintData.acc_id) : undefined;
  
  const seenDuplicateAccounts = new Set<string>();
  const otherReporters = duplicateRows
    .map((duplicate) => {
      if (!duplicate.acc_id || duplicate.acc_id === complaintData.acc_id) return null;
      if (seenDuplicateAccounts.has(duplicate.acc_id)) return null;

      const account = accountMap.get(duplicate.acc_id);
      if (!account) return null;

      seenDuplicateAccounts.add(duplicate.acc_id);

      return {
        id: duplicate.dup_id,
        name: account.full_name,
        initials: getInitials(account.full_name),
        submittedAt: formatDate(duplicate.timestamp),
      };
    })
    .filter(Boolean);

  // Resolution & Updates
  const contractorAssignments = contractorRows.map((contractor, index) => {
    const nextContractor = contractorRows[index + 1];
    return {
      id: contractor.contractor_event_id,
      name: contractor.contractor_name,
      phone: contractor.contractor_phone,
      assignedFrom: formatDate(contractor.changed_at),
      assignedUntil: nextContractor
        ? formatDate(nextContractor.changed_at)
        : !contractor.is_current && resolution
          ? formatDate(resolution.resolved_at)
          : undefined,
      changeReason: nextContractor?.change_reason ?? undefined,
    };
  });

  const getContractorForUpdate = (createdAt: string) => {
    const updateTime = new Date(createdAt).getTime();
    return contractorRows
      .filter((contractor) => new Date(contractor.changed_at).getTime() <= updateTime)
      .at(-1);
  };

  const updates = await Promise.all(
    workUpdateRows.map(async (update) => {
      const imageRows = updateEvidenceRows.filter(
        (image) => image.update_id === update.update_id,
      );
      const images = imageRows.map((image) => ({ uri: image.img_url }));
      const contractor = getContractorForUpdate(update.created_at);

      return {
        id: update.update_id,
        title: getWorkUpdateTitle(update.update_type),
        note: update.note ?? 'No additional notes were provided.',
        timestamp: formatDate(update.created_at),
        complete: true,
        budget: formatBudget(update.budget),
        images,
        contractorAssignmentId: contractor?.contractor_event_id,
      };
    })
  );

  const startUpdate = workUpdateRows.find((update) => update.update_type === 'start');
  const startHistory = historyRows.find(
    (history) => history.from_status === 'pending' && history.to_status === 'in progress',
  );
  const approvingAccount = startHistory ? accountMap.get(startHistory.changed_by_acc_id) : undefined;
  const approvedBy =
    startHistory && approvingAccount
      ? {
          name: approvingAccount.full_name,
          initials: getInitials(approvingAccount.full_name),
          role: 'Community Authority',
          approvedAt: formatDate(startHistory.changed_at),
        }
      : undefined;

  const latestBudgetUpdate = [...workUpdateRows]
    .reverse()
    .find((update) => update.budget !== null && update.budget !== undefined);
  const latestDeadlineUpdate = [...workUpdateRows]
    .reverse()
    .find((update) => Boolean(update.deadline));
  const latestProgressUpdate = [...workUpdateRows]
    .reverse()
    .find((update) => update.progress_percent !== null);

  const completionUpdate = [...workUpdateRows]
    .reverse()
    .find((update) => update.update_type === 'completion');
  const finalEvidenceRow = completionUpdate
    ? updateEvidenceRows.find((image) => image.update_id === completionUpdate.update_id)
    : undefined;

  const progress =
    complaintData.status.toUpperCase() === 'RESOLVED'
      ? 100
      : complaintData.status.toUpperCase() === 'IN PROGRESS'
        ? latestProgressUpdate?.progress_percent ?? 10
        : 0;

  const finalEvidence = finalEvidenceRow ? finalEvidenceRow.img_url : undefined;

  // Feedback fetching (unchanged but cleaned up)
  let feedbackList: any[] = [];
  try {
    const dbFeedback = await feedbackService.fetchFeedbackForComplaint(compId);
    if (dbFeedback && dbFeedback.length > 0) {
      feedbackList = dbFeedback.map((f) => {
        const name = f.account?.full_name || 'Resident';
        const initials = getInitials(name);
        const receivedAt = formatDate(f.created_at) !== 'N/A' ? formatDate(f.created_at) : 'Recently';

        const replies = (f.replies || []).map((r) => {
          const authName =
            r.account?.full_name ||
            (r.account?.role === 'authority' ? 'Community Authority' : 'Authority');
          
          return {
            id: r.reply_id,
            author: authName,
            initials: getInitials(authName),
            message: r.message,
            postedAt: formatDate(r.created_at) !== 'N/A' ? formatDate(r.created_at) : 'Recently',
            authority: true,
          };
        });

        return {
          id: f.feedback_id,
          resident: name,
          residentInitials: initials,
          rating: f.rating,
          comment: f.comment,
          receivedAt,
          replies,
        };
      });
    }
  } catch (err) {
    console.warn('Could not load feedback from Supabase:', err);
  }

  const d = new Date(complaintData.timestamp || Date.now());
  const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return {
    id: complaintData.comp_id,
    title: complaintData.title,
    description: complaintData.description,
    date: dateStr,
    location: formatLocation(complaintData),
    status: complaintData.status.toUpperCase(),
    category: complaintData.category,
    house: complaintData.house,
    road: complaintData.road,
    avenue: complaintData.avenue,
    nearby_landmark: complaintData.nearby_landmark,
    additional_location_details: complaintData.additional_location_details,
    image: evidenceRows[0]?.img_url || null,
    images: evidenceRows.map(e => e.img_url),
    reporter: reporter?.full_name ?? 'Unknown Resident',
    reporterInitials: getInitials(reporter?.full_name ?? 'Unknown Resident'),
    reporterPhone: reporter?.phone_num ?? 'Not available',
    otherReporters,
    approvedBy,
    submittedAt: formatDate(complaintData.timestamp),
    startedAt: startHistory?.changed_at ?? startUpdate?.created_at ?? null,
    resolvedAt: resolution?.resolved_at ?? null,
    deadline: resolution?.final_deadline ?? latestDeadlineUpdate?.deadline,
    budget: formatBudget(resolution?.final_budget ?? latestBudgetUpdate?.budget),
    workNote: startUpdate?.note ?? '',
    progress,
    completedAt: resolution ? formatDate(resolution.resolved_at) : undefined,
    resolutionNote: resolution?.resolution_note ?? undefined,
    finalEvidence,
    contractorAssignments,
    updates,
    feedback: feedbackList,
    approval: null,
  };
}

export async function deleteComplaint(compId: string) {
  // Check if unverified first
  const { data: complaint, error: checkError } = await supabase
    .from('complaints')
    .select('status')
    .eq('comp_id', compId)
    .single();

  if (checkError) {
    throw new Error(`Failed to check complaint status: ${checkError.message}`);
  }

  if (complaint.status.toLowerCase() !== 'unverified') {
    throw new Error('Only unverified complaints can be deleted.');
  }

  const { error: deleteError } = await supabase
    .from('complaints')
    .delete()
    .eq('comp_id', compId);

  if (deleteError) {
    throw new Error(`Failed to delete complaint: ${deleteError.message}`);
  }
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