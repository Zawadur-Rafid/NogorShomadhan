// src/services/authority.service.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

import { supabase } from '@/lib/supabase';

import type {
    AuthorityComplaintDetail,
    AuthorityEvidenceImage,
} from '@/components/authority/store-authority-complaint-details';

type ComplaintStatus =
  | 'unverified'
  | 'pending'
  | 'in progress'
  | 'resolved';

type WorkUpdateType =
  | 'start'
  | 'progress_update'
  | 'contractor_change'
  | 'budget_deadline_change'
  | 'completion';

type ComplaintRow = {
  comp_id: string;
  acc_id: string | null;
  title: string;
  description: string;
  house?: string;
  road?: string;
  avenue?: string;
  nearby_landmark?: string;
  additional_location_details?: string;
  category: string;
  status: ComplaintStatus;
  timestamp: string | null;
  urgency: number;
};

type AccountRow = {
  acc_id: string;
  full_name: string;
  phone_num: string | null;
  email?: string | null;
  role?: string | null;
};

type EvidenceRow = {
  ev_id: string;
  comp_id: string;
  img_url: string;
};

type DuplicateRow = {
  dup_id: string;
  acc_id: string | null;
  comp_id: string | null;
  timestamp: string | null;
};

type StatusHistoryRow = {
  history_id: string;
  comp_id: string;
  from_status: ComplaintStatus;
  to_status: ComplaintStatus;
  changed_by_acc_id: string;
  changed_at: string;
  note: string | null;
};

type WorkUpdateRow = {
  update_id: string;
  comp_id: string;
  updated_by_acc_id: string;
  update_type: WorkUpdateType;
  note: string | null;
  budget: number | string | null;
  deadline: string | null;
  progress_percent: number | null;
  created_at: string;
};

type ContractorRow = {
  contractor_event_id: string;
  comp_id: string;
  contractor_name: string;
  contractor_phone: string;
  change_reason: string | null;
  changed_by_acc_id: string;
  changed_at: string;
  is_current: boolean;
};

type UpdateEvidenceRow = {
  update_evidence_id: string;
  update_id: string;
  comp_id: string;
  img_url: string;
  storage_path: string | null;
  uploaded_by_acc_id: string;
  uploaded_at: string;
};

type ResolutionRow = {
  comp_id: string;
  resolved_by_acc_id: string;
  resolved_at: string;
  resolution_note: string | null;
  final_budget: number | string | null;
  final_deadline: string | null;
};

export type StartComplaintInput = {
  deadline: string;
  contractorName: string;
  contractorPhone: string;
  budget: string;
  note: string;
};

export type AddWorkUpdateInput = {
  deadline?: string;
  budget?: string;
  note?: string;
  images: AuthorityEvidenceImage[];
};

export type ChangeContractorInput = {
  name: string;
  phone: string;
  reason: string;
};

export type ResolveComplaintInput = {
  budget: string;
  note: string;
  finalImage: AuthorityEvidenceImage;
};

async function getLoggedInAccountId(): Promise<string> {
  const accId = await AsyncStorage.getItem('acc_id');

  if (!accId) {
    throw new Error('No logged-in authority account was found.');
  }

  return accId;
}

function mapStatus(
  status: ComplaintStatus,
): 'PENDING' | 'IN PROGRESS' | 'RESOLVED' {
  if (status === 'in progress') return 'IN PROGRESS';
  if (status === 'resolved') return 'RESOLVED';
  return 'PENDING';
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) return 'NA';

  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

function formatDate(value?: string | null): string {
  if (!value) return 'Unknown';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

function formatShortDate(value?: string | null): string {
  if (!value) return 'Unknown';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

function formatDateKey(value?: string | null): string {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatBudget(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '';

  const amount = Number(value);
  if (Number.isNaN(amount)) return String(value);

  return `৳ ${amount.toLocaleString('en-BD', {
    maximumFractionDigits: 2,
  })}`;
}

function parseBudget(value: string): number {
  const normalized = value.replace(/[^\d.]/g, '');
  const amount = Number(normalized);

  if (!normalized || Number.isNaN(amount) || amount <= 0) {
    throw new Error('Enter a valid budget greater than 0.');
  }

  return amount;
}

function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getTomorrowKey(): string {
  const tomorrow = new Date();
  tomorrow.setHours(0, 0, 0, 0);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return localDateKey(tomorrow);
}

function parseDeadline(value: string): string {
  const trimmed = value.trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    throw new Error('Select a valid deadline date.');
  }

  if (trimmed < getTomorrowKey()) {
    throw new Error('Deadline must be tomorrow or a later date.');
  }

  const [year, month, day] = trimmed.split('-').map(Number);
  const localNoon = new Date(year, month - 1, day, 12, 0, 0, 0);

  if (
    localNoon.getFullYear() !== year ||
    localNoon.getMonth() !== month - 1 ||
    localNoon.getDate() !== day
  ) {
    throw new Error('Select a valid deadline date.');
  }

  return localNoon.toISOString();
}

function normalizeBangladeshPhone(value: string): string {
  const compact = value.replace(/[\s-]/g, '');

  if (/^01[3-9]\d{8}$/.test(compact)) {
    return `+880${compact.slice(1)}`;
  }

  if (/^\+8801[3-9]\d{8}$/.test(compact)) {
    return compact;
  }

  throw new Error(
    'Enter a valid Bangladesh mobile number, e.g. 01712345678 or +8801712345678.',
  );
}

function getLocation(complaint: ComplaintRow): string {
  const parts = [complaint.house, complaint.road, complaint.avenue, complaint.nearby_landmark].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : 'Location not provided';
}

function getWorkUpdateTitle(type: WorkUpdateType): string {
  switch (type) {
    case 'start':
      return 'Work started';
    case 'progress_update':
      return 'Work progress updated';
    case 'contractor_change':
      return 'Contractor changed';
    case 'budget_deadline_change':
      return 'Budget / deadline updated';
    case 'completion':
      return 'Complaint resolved';
    default:
      return 'Work update';
  }
}

function extractEvidenceStoragePath(url: string): string | null {
  const markers = [
    '/storage/v1/object/public/evidence/',
    '/storage/v1/object/sign/evidence/',
  ];

  for (const marker of markers) {
    const markerIndex = url.indexOf(marker);
    if (markerIndex < 0) continue;

    const encodedPath = url
      .slice(markerIndex + marker.length)
      .split('?')[0];

    try {
      return decodeURIComponent(encodedPath);
    } catch {
      return encodedPath;
    }
  }

  return null;
}

async function getImageSource(
  url?: string | null,
): Promise<AuthorityEvidenceImage | undefined> {
  if (!url?.trim()) return undefined;

  const storagePath = extractEvidenceStoragePath(url);

  if (storagePath) {
    const { data, error } = await supabase.storage
      .from('evidence')
      .createSignedUrl(storagePath, 60 * 60);

    if (!error && data?.signedUrl) {
      return { uri: data.signedUrl };
    }
  }

  return { uri: url };
}

async function uploadAuthorityImage(
  complaintId: string,
  image: AuthorityEvidenceImage,
  folder: 'updates' | 'resolution',
): Promise<{ publicUrl: string; storagePath: string }> {
  if (typeof image === 'number') {
    throw new Error(
      'Bundled application images cannot be uploaded as authority evidence.',
    );
  }

  if (!image.uri) {
    throw new Error('Selected image does not contain a valid URI.');
  }

  const response = await fetch(image.uri);

  if (!response.ok) {
    throw new Error('Unable to read the selected image.');
  }

  const arrayBuffer = await response.arrayBuffer();
  const extensionMatch = image.uri.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
  const extension = extensionMatch?.[1]?.toLowerCase() === 'png' ? 'png' : 'jpg';
  const contentType = extension === 'png' ? 'image/png' : 'image/jpeg';

  const storagePath =
    `authority-${folder}/${complaintId}/` +
    `${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;

  const { error } = await supabase.storage
    .from('evidence')
    .upload(storagePath, arrayBuffer, {
      contentType,
      upsert: false,
    });

  if (error) {
    throw new Error(`Failed to upload authority evidence: ${error.message}`);
  }

  const { data } = supabase.storage
    .from('evidence')
    .getPublicUrl(storagePath);

  return {
    publicUrl: data.publicUrl,
    storagePath,
  };
}

async function ensureComplaintIsInProgress(complaintId: string) {
  const { data, error } = await supabase
    .from('complaints')
    .select('status')
    .eq('comp_id', complaintId)
    .single();

  if (error) {
    throw new Error(`Failed to read complaint status: ${error.message}`);
  }

  if (data.status !== 'in progress') {
    throw new Error('This action is only available for an In Progress complaint.');
  }
}

export async function getAuthorityComplaints(): Promise<
  AuthorityComplaintDetail[]
> {
  const { data: complaintData, error: complaintError } = await supabase
    .from('complaints')
    .select('*')
    .in('status', ['pending', 'in progress', 'resolved'])
    .order('timestamp', { ascending: false });

  if (complaintError) {
    throw new Error(
      `Failed to load authority complaints: ${complaintError.message}`,
    );
  }

  const complaints = (complaintData ?? []) as ComplaintRow[];
  if (complaints.length === 0) return [];

  const complaintIds = complaints.map((complaint) => complaint.comp_id);
  const reporterIds = complaints
    .map((complaint) => complaint.acc_id)
    .filter((id): id is string => Boolean(id));

  const [
    evidenceResult,
    duplicateResult,
    historyResult,
    workUpdateResult,
    contractorResult,
    updateEvidenceResult,
    resolutionResult,
  ] = await Promise.all([
    supabase.from('evidence').select('*').in('comp_id', complaintIds),
    supabase.from('duplicate').select('*').in('comp_id', complaintIds),
    supabase
      .from('complaint_status_history')
      .select('*')
      .in('comp_id', complaintIds)
      .order('changed_at', { ascending: true }),
    supabase
      .from('complaint_work_updates')
      .select('*')
      .in('comp_id', complaintIds)
      .order('created_at', { ascending: true }),
    supabase
      .from('contractor_history')
      .select('*')
      .in('comp_id', complaintIds)
      .order('changed_at', { ascending: true }),
    supabase
      .from('complaint_update_evidence')
      .select('*')
      .in('comp_id', complaintIds)
      .order('uploaded_at', { ascending: true }),
    supabase
      .from('complaint_resolution')
      .select('*')
      .in('comp_id', complaintIds),
  ]);

  const firstError =
    evidenceResult.error ??
    duplicateResult.error ??
    historyResult.error ??
    workUpdateResult.error ??
    contractorResult.error ??
    updateEvidenceResult.error ??
    resolutionResult.error;

  if (firstError) {
    throw new Error(`Failed to load complaint details: ${firstError.message}`);
  }

  const evidenceRows = (evidenceResult.data ?? []) as EvidenceRow[];
  const duplicateRows = (duplicateResult.data ?? []) as DuplicateRow[];
  const historyRows = (historyResult.data ?? []) as StatusHistoryRow[];
  const workUpdateRows = (workUpdateResult.data ?? []) as WorkUpdateRow[];
  const contractorRows = (contractorResult.data ?? []) as ContractorRow[];
  const updateEvidenceRows =
    (updateEvidenceResult.data ?? []) as UpdateEvidenceRow[];
  const resolutionRows = (resolutionResult.data ?? []) as ResolutionRow[];

  const duplicateReporterIds = duplicateRows
    .map((duplicate) => duplicate.acc_id)
    .filter((id): id is string => Boolean(id));

  const historyActorIds = historyRows
    .map((history) => history.changed_by_acc_id)
    .filter(Boolean);

  const accountIds = [
    ...new Set([
      ...reporterIds,
      ...duplicateReporterIds,
      ...historyActorIds,
    ]),
  ];

  let accounts: AccountRow[] = [];

  if (accountIds.length > 0) {
    const { data: accountData, error: accountError } = await supabase
      .from('account')
      .select('acc_id, full_name, phone_num, email, role')
      .in('acc_id', accountIds);

    if (accountError) {
      throw new Error(
        `Failed to load complaint reporters: ${accountError.message}`,
      );
    }

    accounts = (accountData ?? []) as AccountRow[];
  }

  const accountMap = new Map(
    accounts.map((account) => [account.acc_id, account]),
  );

  return Promise.all(
    complaints.map(async (complaint) => {
      const complaintEvidence = evidenceRows.filter(
        (item) => item.comp_id === complaint.comp_id,
      );
      const complaintDuplicates = duplicateRows
        .filter((item) => item.comp_id === complaint.comp_id)
        .sort((a, b) => {
          const first = a.timestamp ? new Date(a.timestamp).getTime() : 0;
          const second = b.timestamp ? new Date(b.timestamp).getTime() : 0;
          return first - second;
        });
      const complaintHistory = historyRows.filter(
        (item) => item.comp_id === complaint.comp_id,
      );
      const complaintWorkUpdates = workUpdateRows.filter(
        (item) => item.comp_id === complaint.comp_id,
      );
      const complaintContractors = contractorRows.filter(
        (item) => item.comp_id === complaint.comp_id,
      );
      const complaintUpdateEvidence = updateEvidenceRows.filter(
        (item) => item.comp_id === complaint.comp_id,
      );
      const resolution = resolutionRows.find(
        (item) => item.comp_id === complaint.comp_id,
      );

      // Primary reporter is exactly the account referenced by complaints.acc_id.
      const reporter = complaint.acc_id
        ? accountMap.get(complaint.acc_id)
        : undefined;

      // Other reporters come only from duplicate rows for this complaint.
      const seenDuplicateAccounts = new Set<string>();
      const otherReporters = complaintDuplicates
        .map((duplicate) => {
          if (!duplicate.acc_id) return null;
          if (duplicate.acc_id === complaint.acc_id) return null;
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
        .filter(
          (
            item,
          ): item is {
            id: string;
            name: string;
            initials: string;
            submittedAt: string;
          } => Boolean(item),
        );

      const contractorAssignments = complaintContractors.map(
        (contractor, index) => {
          const nextContractor = complaintContractors[index + 1];

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
        },
      );

      const getContractorForUpdate = (createdAt: string) => {
        const updateTime = new Date(createdAt).getTime();
        return complaintContractors
          .filter(
            (contractor) =>
              new Date(contractor.changed_at).getTime() <= updateTime,
          )
          .at(-1);
      };

      const updates = await Promise.all(
        complaintWorkUpdates.map(async (update) => {
          const imageRows = complaintUpdateEvidence.filter(
            (image) => image.update_id === update.update_id,
          );
          const imageSources = await Promise.all(
            imageRows.map((image) => getImageSource(image.img_url)),
          );
          const images = imageSources.filter(
            (image): image is AuthorityEvidenceImage => Boolean(image),
          );
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
        }),
      );

      const latestBudgetUpdate = [...complaintWorkUpdates]
        .reverse()
        .find((update) => update.budget !== null && update.budget !== undefined);
      const latestDeadlineUpdate = [...complaintWorkUpdates]
        .reverse()
        .find((update) => Boolean(update.deadline));
      const latestProgressUpdate = [...complaintWorkUpdates]
        .reverse()
        .find((update) => update.progress_percent !== null);
      const startUpdate = complaintWorkUpdates.find(
        (update) => update.update_type === 'start',
      );
      const startHistory = complaintHistory.find(
        (history) =>
          history.from_status === 'pending' &&
          history.to_status === 'in progress',
      );
      const approvingAccount = startHistory
        ? accountMap.get(startHistory.changed_by_acc_id)
        : undefined;
      const approvedBy =
        startHistory && approvingAccount
          ? {
              name: approvingAccount.full_name,
              initials: getInitials(approvingAccount.full_name),
              role: 'Community Authority',
              approvedAt: formatDate(startHistory.changed_at),
            }
          : undefined;
      const completionUpdate = [...complaintWorkUpdates]
        .reverse()
        .find((update) => update.update_type === 'completion');
      const finalEvidenceRow = completionUpdate
        ? complaintUpdateEvidence.find(
            (image) => image.update_id === completionUpdate.update_id,
          )
        : undefined;

      const status = mapStatus(complaint.status);
      const progress =
        status === 'RESOLVED'
          ? 100
          : status === 'IN PROGRESS'
            ? latestProgressUpdate?.progress_percent ?? 10
            : 0;

      const residentEvidence = await getImageSource(
        complaintEvidence[0]?.img_url,
      );
      const finalEvidence = finalEvidenceRow
        ? await getImageSource(finalEvidenceRow.img_url)
        : undefined;

      return {
        id: complaint.comp_id,
        title: complaint.title,
        description: complaint.description,
        date: formatShortDate(complaint.timestamp),
        location: getLocation(complaint),
        category: complaint.category,
        status,
        urgency: complaint.urgency,
        house: complaint.house,
        road: complaint.road,
        avenue: complaint.avenue,
        nearby_landmark: complaint.nearby_landmark,
        additional_location_details: complaint.additional_location_details,
        reporter: reporter?.full_name ?? 'Unknown Resident',
        reporterInitials: getInitials(
          reporter?.full_name ?? 'Unknown Resident',
        ),
        reporterPhone: reporter?.phone_num ?? 'Not available',
        otherReporters,
        approvedBy,
        submittedAt: formatDate(complaint.timestamp),
        zone: '',
        evidence: residentEvidence,
        deadline: formatDateKey(
          resolution?.final_deadline ?? latestDeadlineUpdate?.deadline,
        ),
        budget: formatBudget(
          resolution?.final_budget ?? latestBudgetUpdate?.budget,
        ),
        workNote: startUpdate?.note ?? '',
        progress,
        completedAt: resolution
          ? formatDate(resolution.resolved_at)
          : undefined,
        resolutionNote: resolution?.resolution_note ?? undefined,
        finalEvidence,
        contractorAssignments,
        updates,
        feedback: [],
      } satisfies AuthorityComplaintDetail;
    }),
  );
}

export async function startAuthorityComplaint(
  complaintId: string,
  input: StartComplaintInput,
): Promise<void> {
  const accId = await getLoggedInAccountId();
  const deadline = parseDeadline(input.deadline);
  const budget = parseBudget(input.budget);
  const contractorPhone = normalizeBangladeshPhone(input.contractorPhone);

  if (!input.contractorName.trim() || !input.note.trim()) {
    throw new Error('Contractor name and initial work note are required.');
  }

  const { data: currentComplaint, error: readError } = await supabase
    .from('complaints')
    .select('status')
    .eq('comp_id', complaintId)
    .single();

  if (readError) {
    throw new Error(`Failed to read complaint: ${readError.message}`);
  }

  if (currentComplaint.status !== 'pending') {
    throw new Error('Only a Pending complaint can be started.');
  }

  const { error: statusError } = await supabase
    .from('complaints')
    .update({ status: 'in progress' })
    .eq('comp_id', complaintId)
    .eq('status', 'pending');

  if (statusError) {
    throw new Error(`Failed to start complaint: ${statusError.message}`);
  }

  const { error: historyError } = await supabase
    .from('complaint_status_history')
    .insert({
      comp_id: complaintId,
      from_status: 'pending',
      to_status: 'in progress',
      changed_by_acc_id: accId,
      note: input.note.trim(),
    });

  if (historyError) {
    throw new Error(`Failed to save status history: ${historyError.message}`);
  }

  const { error: contractorError } = await supabase
    .from('contractor_history')
    .insert({
      comp_id: complaintId,
      contractor_name: input.contractorName.trim(),
      contractor_phone: contractorPhone,
      change_reason: null,
      changed_by_acc_id: accId,
      is_current: true,
    });

  if (contractorError) {
    throw new Error(`Failed to assign contractor: ${contractorError.message}`);
  }

  const { error: updateError } = await supabase
    .from('complaint_work_updates')
    .insert({
      comp_id: complaintId,
      updated_by_acc_id: accId,
      update_type: 'start',
      note: input.note.trim(),
      budget,
      deadline,
      progress_percent: 10,
    });

  if (updateError) {
    throw new Error(`Failed to save work plan: ${updateError.message}`);
  }
}

export async function addAuthorityWorkUpdate(
  complaintId: string,
  input: AddWorkUpdateInput,
): Promise<void> {
  const accId = await getLoggedInAccountId();
  await ensureComplaintIsInProgress(complaintId);

  const { data: stateRows, error: stateError } = await supabase
    .from('complaint_work_updates')
    .select('budget, deadline, progress_percent, created_at')
    .eq('comp_id', complaintId)
    .order('created_at', { ascending: false })
    .limit(100);

  if (stateError) {
    throw new Error(
      `Failed to read current work state: ${stateError.message}`,
    );
  }

  const rows = stateRows ?? [];

  const currentBudgetRaw =
    rows.find(
      (row) => row.budget !== null && row.budget !== undefined,
    )?.budget ?? null;

  const currentDeadlineRaw =
    rows.find((row) => Boolean(row.deadline))?.deadline ?? null;

  const currentProgress =
    rows.find((row) => row.progress_percent !== null)?.progress_percent ?? 10;

  const currentBudgetNumber =
    currentBudgetRaw === null ? null : Number(currentBudgetRaw);

  const currentDeadlineKey = formatDateKey(currentDeadlineRaw);

  let nextBudget: number | string | null = currentBudgetRaw;
  let nextDeadline: string | null = currentDeadlineRaw;

  let budgetChanged = false;
  let deadlineChanged = false;

  if (input.budget !== undefined) {
    const parsedBudget = parseBudget(input.budget);

    budgetChanged =
      currentBudgetNumber === null ||
      !Number.isFinite(currentBudgetNumber) ||
      parsedBudget !== currentBudgetNumber;

    if (budgetChanged) {
      nextBudget = parsedBudget;
    }
  }

  if (input.deadline !== undefined) {
    const requestedDeadline = input.deadline.trim();

    if (!requestedDeadline) {
      throw new Error('Select a valid deadline date.');
    }

    deadlineChanged = requestedDeadline !== currentDeadlineKey;

    if (deadlineChanged) {
      nextDeadline = parseDeadline(requestedDeadline);
    }
  }

  const note = input.note?.trim() ?? '';
  const hasNote = note.length > 0;
  const hasPhotos = input.images.length > 0;

  if (!budgetChanged && !deadlineChanged && !hasNote && !hasPhotos) {
    throw new Error(
      'Change the estimated budget or deadline, add notes, or attach at least one photo.',
    );
  }

  const updateType: WorkUpdateType =
    hasNote || hasPhotos
      ? 'progress_update'
      : 'budget_deadline_change';

  const nextProgress =
    updateType === 'progress_update'
      ? Math.min(95, currentProgress + 15)
      : currentProgress;

  let storedNote = note;

  if (!storedNote) {
    const changeDescriptions: string[] = [];

    if (budgetChanged) {
      changeDescriptions.push('Estimated budget updated');
    }

    if (deadlineChanged) {
      changeDescriptions.push('Deadline updated');
    }

    if (hasPhotos) {
      changeDescriptions.push('Progress evidence added');
    }

    storedNote = `${changeDescriptions.join('. ')}.`;
  }

  const { data: workUpdate, error: workUpdateError } = await supabase
    .from('complaint_work_updates')
    .insert({
      comp_id: complaintId,
      updated_by_acc_id: accId,
      update_type: updateType,
      note: storedNote,
      budget: nextBudget,
      deadline: nextDeadline,
      progress_percent: nextProgress,
    })
    .select('update_id')
    .single();

  if (workUpdateError) {
    throw new Error(
      `Failed to save work update: ${workUpdateError.message}`,
    );
  }

  for (const image of input.images) {
    const uploaded = await uploadAuthorityImage(
      complaintId,
      image,
      'updates',
    );

    const { error: evidenceError } = await supabase
      .from('complaint_update_evidence')
      .insert({
        update_id: workUpdate.update_id,
        comp_id: complaintId,
        img_url: uploaded.publicUrl,
        storage_path: uploaded.storagePath,
        uploaded_by_acc_id: accId,
      });

    if (evidenceError) {
      throw new Error(
        `Failed to save progress evidence: ${evidenceError.message}`,
      );
    }
  }
}

export async function changeAuthorityContractor(
  complaintId: string,
  input: ChangeContractorInput,
): Promise<void> {
  const accId = await getLoggedInAccountId();
  await ensureComplaintIsInProgress(complaintId);

  if (!input.name.trim() || !input.reason.trim()) {
    throw new Error('Contractor name and reason for change are required.');
  }

  const phone = normalizeBangladeshPhone(input.phone);

  const [{ data: currentContractor, error: currentError }, latestStateResult] =
    await Promise.all([
      supabase
        .from('contractor_history')
        .select('contractor_event_id, contractor_name')
        .eq('comp_id', complaintId)
        .eq('is_current', true)
        .maybeSingle(),
      supabase
        .from('complaint_work_updates')
        .select('budget, deadline, progress_percent')
        .eq('comp_id', complaintId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

  if (currentError) {
    throw new Error(`Failed to read current contractor: ${currentError.message}`);
  }

  if (latestStateResult.error) {
    throw new Error(
      `Failed to read current work state: ${latestStateResult.error.message}`,
    );
  }

  if (currentContractor) {
    const { error: closeError } = await supabase
      .from('contractor_history')
      .update({ is_current: false })
      .eq('contractor_event_id', currentContractor.contractor_event_id);

    if (closeError) {
      throw new Error(
        `Failed to close previous contractor assignment: ${closeError.message}`,
      );
    }
  }

  const { error: contractorError } = await supabase
    .from('contractor_history')
    .insert({
      comp_id: complaintId,
      contractor_name: input.name.trim(),
      contractor_phone: phone,
      change_reason: input.reason.trim(),
      changed_by_acc_id: accId,
      is_current: true,
    });

  if (contractorError) {
    throw new Error(`Failed to assign new contractor: ${contractorError.message}`);
  }

  const previousName = currentContractor?.contractor_name;
  const note = previousName
    ? `${previousName} was replaced by ${input.name.trim()}. Reason: ${input.reason.trim()}`
    : `${input.name.trim()} was assigned. Reason: ${input.reason.trim()}`;

  const { error: workUpdateError } = await supabase
    .from('complaint_work_updates')
    .insert({
      comp_id: complaintId,
      updated_by_acc_id: accId,
      update_type: 'contractor_change',
      note,
      budget: latestStateResult.data?.budget ?? null,
      deadline: latestStateResult.data?.deadline ?? null,
      progress_percent: latestStateResult.data?.progress_percent ?? null,
    });

  if (workUpdateError) {
    throw new Error(
      `Failed to save contractor change history: ${workUpdateError.message}`,
    );
  }
}

export async function resolveAuthorityComplaint(
  complaintId: string,
  input: ResolveComplaintInput,
): Promise<void> {
  const accId = await getLoggedInAccountId();
  await ensureComplaintIsInProgress(complaintId);

  if (!input.note.trim()) {
    throw new Error('Completion notes are required.');
  }

  const { data: latestUpdate, error: latestError } = await supabase
    .from('complaint_work_updates')
    .select('deadline, budget')
    .eq('comp_id', complaintId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestError) {
    throw new Error(
      `Failed to read current complaint data: ${latestError.message}`,
    );
  }

  let finalBudget: number | string | null = latestUpdate?.budget ?? null;
  if (input.budget.trim()) {
    finalBudget = parseBudget(input.budget);
  }

  const finalDeadline = latestUpdate?.deadline ?? null;
  const uploaded = await uploadAuthorityImage(
    complaintId,
    input.finalImage,
    'resolution',
  );

  const { data: completionUpdate, error: completionError } = await supabase
    .from('complaint_work_updates')
    .insert({
      comp_id: complaintId,
      updated_by_acc_id: accId,
      update_type: 'completion',
      note: input.note.trim(),
      budget: finalBudget,
      deadline: finalDeadline,
      progress_percent: 100,
    })
    .select('update_id')
    .single();

  if (completionError) {
    throw new Error(
      `Failed to save completion update: ${completionError.message}`,
    );
  }

  const { error: evidenceError } = await supabase
    .from('complaint_update_evidence')
    .insert({
      update_id: completionUpdate.update_id,
      comp_id: complaintId,
      img_url: uploaded.publicUrl,
      storage_path: uploaded.storagePath,
      uploaded_by_acc_id: accId,
    });

  if (evidenceError) {
    throw new Error(
      `Failed to save completion evidence: ${evidenceError.message}`,
    );
  }

  const { error: resolutionError } = await supabase
    .from('complaint_resolution')
    .upsert(
      {
        comp_id: complaintId,
        resolved_by_acc_id: accId,
        resolution_note: input.note.trim(),
        final_budget: finalBudget,
        final_deadline: finalDeadline,
      },
      { onConflict: 'comp_id' },
    );

  if (resolutionError) {
    throw new Error(
      `Failed to save complaint resolution: ${resolutionError.message}`,
    );
  }

  const { error: statusError } = await supabase
    .from('complaints')
    .update({ status: 'resolved' })
    .eq('comp_id', complaintId)
    .eq('status', 'in progress');

  if (statusError) {
    throw new Error(`Failed to resolve complaint: ${statusError.message}`);
  }

  const { error: historyError } = await supabase
    .from('complaint_status_history')
    .insert({
      comp_id: complaintId,
      from_status: 'in progress',
      to_status: 'resolved',
      changed_by_acc_id: accId,
      note: input.note.trim(),
    });

  if (historyError) {
    throw new Error(
      `Failed to save resolution history: ${historyError.message}`,
    );
  }

  const { error: contractorError } = await supabase
    .from('contractor_history')
    .update({ is_current: false })
    .eq('comp_id', complaintId)
    .eq('is_current', true);

  if (contractorError) {
    console.warn(
      'Complaint resolved, but contractor could not be marked inactive:',
      contractorError.message,
    );
  }
}