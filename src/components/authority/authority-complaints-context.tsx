import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

import {
  addAuthorityWorkUpdate,
  changeAuthorityContractor,
  getAuthorityComplaints,
  resolveAuthorityComplaint,
  startAuthorityComplaint,
  type AddWorkUpdateInput,
  type ChangeContractorInput,
  type ResolveComplaintInput,
  type StartComplaintInput,
} from '@/services/authority.service';

import type {
  AuthorityComplaintDetail,
} from './store-authority-complaint-details';

type AuthorityComplaintsContextValue = {
  complaints: AuthorityComplaintDetail[];

  loading: boolean;

  error: string | null;

  refreshComplaints: () => Promise<void>;

  startComplaint: (
    complaintId: string,
    input: StartComplaintInput,
  ) => Promise<void>;

  addWorkUpdate: (
    complaintId: string,
    input: AddWorkUpdateInput,
  ) => Promise<void>;

  changeContractor: (
    complaintId: string,
    input: ChangeContractorInput,
  ) => Promise<void>;

  resolveComplaint: (
    complaintId: string,
    input: ResolveComplaintInput,
  ) => Promise<void>;

  clearError: () => void;
};

const AuthorityComplaintsContext =
  createContext<AuthorityComplaintsContextValue | null>(
    null,
  );

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred.';
}

export function AuthorityComplaintsProvider({
  children,
}: PropsWithChildren) {
  const [complaints, setComplaints] = useState<
    AuthorityComplaintDetail[]
  >([]);

  const [loading, setLoading] =
    useState<boolean>(true);

  const [error, setError] =
    useState<string | null>(null);

  /*
   * Load all complaints visible to the Authority.
   *
   * authority.service.ts only returns:
   * - pending
   * - in progress
   * - resolved
   *
   * Therefore unverified complaints are not shown here.
   */
  const refreshComplaints =
    useCallback(async () => {
      setLoading(true);
      setError(null);

      try {
        const data =
          await getAuthorityComplaints();

        setComplaints(data);
      } catch (err) {
        console.error(
          'Failed to load authority complaints:',
          err,
        );

        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    }, []);

  /*
   * Load real Supabase data as soon as the
   * Authority module is mounted.
   */
  useEffect(() => {
    void refreshComplaints();
  }, [refreshComplaints]);

  /*
   * Pending -> In Progress
   */
  const startComplaint =
    useCallback(
      async (
        complaintId: string,
        input: StartComplaintInput,
      ) => {
        setError(null);

        try {
          await startAuthorityComplaint(
            complaintId,
            input,
          );

          /*
           * Fetch the complaint again so the UI
           * reflects the actual database state.
           */
          await refreshComplaints();
        } catch (err) {
          const message =
            getErrorMessage(err);

          console.error(
            'Failed to start complaint:',
            err,
          );

          setError(message);

          /*
           * Re-throw so the detail screen can
           * show the backend failure instead of
           * pretending that the operation worked.
           */
          throw err;
        }
      },
      [refreshComplaints],
    );

  /*
   * Add progress update.
   */
  const addWorkUpdate =
    useCallback(
      async (
        complaintId: string,
        input: AddWorkUpdateInput,
      ) => {
        setError(null);

        try {
          await addAuthorityWorkUpdate(
            complaintId,
            input,
          );

          await refreshComplaints();
        } catch (err) {
          const message =
            getErrorMessage(err);

          console.error(
            'Failed to add work update:',
            err,
          );

          setError(message);

          throw err;
        }
      },
      [refreshComplaints],
    );

  /*
   * Change current contractor.
   */
  const changeContractor =
    useCallback(
      async (
        complaintId: string,
        input: ChangeContractorInput,
      ) => {
        setError(null);

        try {
          await changeAuthorityContractor(
            complaintId,
            input,
          );

          await refreshComplaints();
        } catch (err) {
          const message =
            getErrorMessage(err);

          console.error(
            'Failed to change contractor:',
            err,
          );

          setError(message);

          throw err;
        }
      },
      [refreshComplaints],
    );

  /*
   * In Progress -> Resolved
   */
  const resolveComplaint =
    useCallback(
      async (
        complaintId: string,
        input: ResolveComplaintInput,
      ) => {
        setError(null);

        try {
          await resolveAuthorityComplaint(
            complaintId,
            input,
          );

          await refreshComplaints();
        } catch (err) {
          const message =
            getErrorMessage(err);

          console.error(
            'Failed to resolve complaint:',
            err,
          );

          setError(message);

          throw err;
        }
      },
      [refreshComplaints],
    );

  const clearError =
    useCallback(() => {
      setError(null);
    }, []);

  const value =
    useMemo<AuthorityComplaintsContextValue>(
      () => ({
        complaints,
        loading,
        error,
        refreshComplaints,
        startComplaint,
        addWorkUpdate,
        changeContractor,
        resolveComplaint,
        clearError,
      }),
      [
        complaints,
        loading,
        error,
        refreshComplaints,
        startComplaint,
        addWorkUpdate,
        changeContractor,
        resolveComplaint,
        clearError,
      ],
    );

  return (
    <AuthorityComplaintsContext.Provider
      value={value}
    >
      {children}
    </AuthorityComplaintsContext.Provider>
  );
}

export function useAuthorityComplaints() {
  const context =
    useContext(
      AuthorityComplaintsContext,
    );

  if (!context) {
    throw new Error(
      'useAuthorityComplaints must be used inside AuthorityComplaintsProvider',
    );
  }

  return context;
}