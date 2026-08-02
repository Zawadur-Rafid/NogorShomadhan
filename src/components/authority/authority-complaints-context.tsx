import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

import {
  createInitialAuthorityComplaintDetails,
  type AuthorityComplaintDetail,
  type AuthorityEvidenceImage,
} from './store-authority-complaint-details';

type StartComplaintInput = {
  deadline: string;
  contractorName: string;
  contractorPhone: string;
  budget: string;
  note: string;
};

type AddWorkUpdateInput = {
  deadline: string;
  budget: string;
  note: string;
  images: AuthorityEvidenceImage[];
};

type ResolveComplaintInput = {
  budget: string;
  note: string;
  finalImage: AuthorityEvidenceImage;
};

type ChangeContractorInput = {
  name: string;
  phone: string;
  reason: string;
};

type AuthorityComplaintsContextValue = {
  complaints: AuthorityComplaintDetail[];
  startComplaint: (complaintId: string, input: StartComplaintInput) => void;
  addWorkUpdate: (complaintId: string, input: AddWorkUpdateInput) => void;
  changeContractor: (
    complaintId: string,
    input: ChangeContractorInput,
  ) => void;
  resolveComplaint: (complaintId: string, input: ResolveComplaintInput) => void;
};

const AuthorityComplaintsContext =
  createContext<AuthorityComplaintsContextValue | null>(null);

function nowLabel() {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date());
}

function getCurrentContractor(complaint: AuthorityComplaintDetail) {
  for (
    let index = complaint.contractorAssignments.length - 1;
    index >= 0;
    index -= 1
  ) {
    const assignment = complaint.contractorAssignments[index];
    if (!assignment.assignedUntil) return assignment;
  }

  return complaint.contractorAssignments.at(-1);
}

export function AuthorityComplaintsProvider({ children }: PropsWithChildren) {
  const [complaints, setComplaints] = useState<AuthorityComplaintDetail[]>(
    createInitialAuthorityComplaintDetails,
  );

  const startComplaint = useCallback(
    (complaintId: string, input: StartComplaintInput) => {
      setComplaints((current) =>
        current.map((complaint) => {
          if (complaint.id !== complaintId) return complaint;

          const timestamp = nowLabel();
          const contractorAssignmentId = `CTR-${complaint.id}-${Date.now()}`;

          return {
            ...complaint,
            status: 'IN PROGRESS',
            deadline: input.deadline,
            budget: input.budget,
            workNote: input.note,
            progress: 10,
            contractorAssignments: [
              {
                id: contractorAssignmentId,
                name: input.contractorName,
                phone: input.contractorPhone,
                assignedFrom: timestamp,
              },
            ],
            updates: [
              ...complaint.updates.filter((update) => update.complete),
              {
                id: `UPD-${complaint.id}-${Date.now()}`,
                title: 'Work started',
                note: input.note,
                timestamp,
                contractorAssignmentId,
                complete: true,
                budget: input.budget,
                images: [],
              },
            ],
          };
        }),
      );
    },
    [],
  );

  const addWorkUpdate = useCallback(
    (complaintId: string, input: AddWorkUpdateInput) => {
      setComplaints((current) =>
        current.map((complaint) => {
          if (complaint.id !== complaintId) return complaint;

          const completedUpdates = complaint.updates.filter((update) => update.complete);
          const workUpdateNumber = completedUpdates.filter((update) =>
            update.title.startsWith('Work update'),
          ).length + 1;

          const currentContractor = getCurrentContractor(complaint);
          return {
            ...complaint,
            deadline: input.deadline,
            budget: input.budget,
            progress: Math.min(95, complaint.progress + 15),
            updates: [
              ...completedUpdates,
              {
                id: `UPD-${complaint.id}-${Date.now()}`,
                title: `Work update ${workUpdateNumber}`,
                note: input.note,
                timestamp: nowLabel(),
                contractorAssignmentId: currentContractor?.id,
                complete: true,
                budget: input.budget,
                images: [...input.images],
              },
            ],
          };
        }),
      );
    },
    [],
  );

  const changeContractor = useCallback(
    (complaintId: string, input: ChangeContractorInput) => {
      setComplaints((current) =>
        current.map((complaint) => {
          if (complaint.id !== complaintId) return complaint;

          const timestamp = nowLabel();
          const previousContractor = getCurrentContractor(complaint);
          const contractorAssignmentId = `CTR-${complaint.id}-${Date.now()}`;

          return {
            ...complaint,
            contractorAssignments: [
              ...complaint.contractorAssignments.map((assignment) =>
                assignment.id === previousContractor?.id
                  ? {
                      ...assignment,
                      assignedUntil: timestamp,
                      changeReason: input.reason,
                    }
                  : assignment,
              ),
              {
                id: contractorAssignmentId,
                name: input.name,
                phone: input.phone,
                assignedFrom: timestamp,
              },
            ],
            updates: [
              ...complaint.updates.filter((update) => update.complete),
              {
                id: `UPD-${complaint.id}-${Date.now()}`,
                title: 'Contractor changed',
                note: previousContractor
                  ? `${previousContractor.name} was replaced by ${input.name}. Reason: ${input.reason}`
                  : `${input.name} was assigned. Reason: ${input.reason}`,
                timestamp,
                complete: true,
                budget: complaint.budget,
                images: [],
                contractorAssignmentId,
              },
            ],
          };
        }),
      );
    },
    [],
  );

  const resolveComplaint = useCallback(
    (complaintId: string, input: ResolveComplaintInput) => {
      setComplaints((current) =>
        current.map((complaint) => {
          if (complaint.id !== complaintId) return complaint;

          const timestamp = nowLabel();
          const currentContractor = getCurrentContractor(complaint);
          return {
            ...complaint,
            status: 'RESOLVED',
            progress: 100,
            budget: input.budget,
            completedAt: timestamp,
            resolutionNote: input.note,
            finalEvidence: input.finalImage,
            contractorAssignments: complaint.contractorAssignments.map((assignment) =>
              assignment.id === currentContractor?.id
                ? {
                    ...assignment,
                    assignedUntil: timestamp,
                  }
                : assignment,
            ),
            updates: [
              ...complaint.updates.filter((update) => update.complete),
              {
                id: `UPD-${complaint.id}-${Date.now()}`,
                title: 'Complaint resolved',
                note: input.note,
                timestamp,
                contractorAssignmentId: currentContractor?.id,
                complete: true,
                budget: input.budget,
                images: [input.finalImage],
              },
            ],
          };
        }),
      );
    },
    [],
  );

  const value = useMemo(
    () => ({
      complaints,
      startComplaint,
      addWorkUpdate,
      changeContractor,
      resolveComplaint,
    }),
    [
      addWorkUpdate,
      changeContractor,
      complaints,
      resolveComplaint,
      startComplaint,
    ],
  );

  return (
    <AuthorityComplaintsContext.Provider value={value}>
      {children}
    </AuthorityComplaintsContext.Provider>
  );
}

export function useAuthorityComplaints() {
  const context = useContext(AuthorityComplaintsContext);

  if (!context) {
    throw new Error(
      'useAuthorityComplaints must be used inside AuthorityComplaintsProvider',
    );
  }

  return context;
}
