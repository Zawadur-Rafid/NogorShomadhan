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
  budget: string;
  note: string;
};

type AddWorkUpdateInput = {
  budget: string;
  note: string;
  images: AuthorityEvidenceImage[];
};

type ResolveComplaintInput = {
  budget: string;
  note: string;
  finalImage: AuthorityEvidenceImage;
};

type AuthorityComplaintsContextValue = {
  complaints: AuthorityComplaintDetail[];
  startComplaint: (complaintId: string, input: StartComplaintInput) => void;
  addWorkUpdate: (complaintId: string, input: AddWorkUpdateInput) => void;
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

export function AuthorityComplaintsProvider({ children }: PropsWithChildren) {
  const [complaints, setComplaints] = useState<AuthorityComplaintDetail[]>(
    createInitialAuthorityComplaintDetails,
  );

  const startComplaint = useCallback(
    (complaintId: string, input: StartComplaintInput) => {
      setComplaints((current) =>
        current.map((complaint) => {
          if (complaint.id !== complaintId) return complaint;

          return {
            ...complaint,
            status: 'IN PROGRESS',
            deadline: input.deadline,
            budget: input.budget,
            workNote: input.note,
            progress: 10,
            updates: [
              ...complaint.updates.filter((update) => update.complete),
              {
                id: `UPD-${complaint.id}-${Date.now()}`,
                title: 'Work started',
                note: input.note,
                timestamp: nowLabel(),
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

          return {
            ...complaint,
            budget: input.budget,
            progress: Math.min(95, complaint.progress + 15),
            updates: [
              ...completedUpdates,
              {
                id: `UPD-${complaint.id}-${Date.now()}`,
                title: `Work update ${workUpdateNumber}`,
                note: input.note,
                timestamp: nowLabel(),
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

  const resolveComplaint = useCallback(
    (complaintId: string, input: ResolveComplaintInput) => {
      setComplaints((current) =>
        current.map((complaint) => {
          if (complaint.id !== complaintId) return complaint;

          const timestamp = nowLabel();
          return {
            ...complaint,
            status: 'RESOLVED',
            progress: 100,
            budget: input.budget,
            completedAt: timestamp,
            resolutionNote: input.note,
            finalEvidence: input.finalImage,
            updates: [
              ...complaint.updates.filter((update) => update.complete),
              {
                id: `UPD-${complaint.id}-${Date.now()}`,
                title: 'Complaint resolved',
                note: input.note,
                timestamp,
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
    () => ({ complaints, startComplaint, addWorkUpdate, resolveComplaint }),
    [addWorkUpdate, complaints, resolveComplaint, startComplaint],
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
