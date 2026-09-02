import React, {
  createContext,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { getAuthorityProfile } from '@/services/authority.service';
import type { AuthorityAccountProfile } from '@/types/authority-account';

type AuthorityProfileContextValue = {
  profile: AuthorityAccountProfile | null;
  initials: string;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

const AuthorityProfileContext =
  createContext<AuthorityProfileContextValue | null>(null);

function getInitials(name?: string) {
  if (!name) return 'CA';

  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

  return initials || 'CA';
}

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : 'The authority profile could not be loaded.';
}

export function AuthorityProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<AuthorityAccountProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    getAuthorityProfile()
      .then((nextProfile) => {
        if (!active) return;
        setProfile(nextProfile);
        setError(null);
      })
      .catch((profileError: unknown) => {
        if (!active) return;
        setProfile(null);
        setError(getErrorMessage(profileError));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      setProfile(await getAuthorityProfile());
    } catch (profileError) {
      setError(getErrorMessage(profileError));
    } finally {
      setLoading(false);
    }
  }, []);

  const value = useMemo<AuthorityProfileContextValue>(
    () => ({
      profile,
      initials: getInitials(profile?.fullName),
      loading,
      error,
      refresh,
    }),
    [error, loading, profile, refresh],
  );

  return (
    <AuthorityProfileContext.Provider value={value}>
      {children}
    </AuthorityProfileContext.Provider>
  );
}

export function useAuthorityProfile() {
  const context = React.use(AuthorityProfileContext);

  if (!context) {
    throw new Error(
      'useAuthorityProfile must be used inside AuthorityProfileProvider',
    );
  }

  return context;
}
