import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { supabase } from "@/lib/supabase";

export type AdminAccountRole = "resident" | "authority" | "admin";
export type AdminAccountStatus = "unverified" | "verified" | "rejected";

export type AdminAccount = {
  id: string;
  fullName: string;
  nid: string;
  email: string;
  phoneNum: string;
  houseNum: string;
  roadNumber: string;
  avenueNum: string;
  username: string;
  role: AdminAccountRole;
  status: AdminAccountStatus;
  createdAt: string | null;
  updatedAt: string | null;
  verifiedAt: string | null;
  rejectedAt: string | null;
};

export type AdminAccountMetrics = {
  pendingCount: number;
  verifiedTodayCount: number;
  rejectedTodayCount: number;
  registeredCount: number;
  authorityCount: number;
};

type AdminAccountsContextValue = {
  pendingAccounts: AdminAccount[];
  registeredAccounts: AdminAccount[];
  loading: boolean;
  error: string | null;
  metrics: AdminAccountMetrics;
  refresh: () => Promise<void>;
  approveAccount: (accountId: string) => Promise<void>;
  rejectAccount: (accountId: string) => Promise<void>;
};

type AccountRow = {
  acc_id?: string;
  full_name?: string;
  nid?: string;
  email?: string;
  phone_num?: string;
  house_num?: string;
  road_number?: string;
  avenue_num?: string;
  username?: string;
  role?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
  verified_at?: string;
  rejected_at?: string;
};

const initialMetrics: AdminAccountMetrics = {
  pendingCount: 0,
  verifiedTodayCount: 0,
  rejectedTodayCount: 0,
  registeredCount: 0,
  authorityCount: 0,
};

function getTodayKey() {
  const now = new Date();
  return `admin_metrics_${now.getFullYear()}_${now.getMonth() + 1}_${now.getDate()}`;
}

const AdminAccountsContext = createContext<AdminAccountsContextValue | null>(
  null,
);

function toRole(role: string | undefined): AdminAccountRole {
  if (role === "authority" || role === "admin") {
    return role;
  }

  return "resident";
}

function toStatus(status: string | undefined): AdminAccountStatus {
  if (status === "verified") {
    return "verified";
  }

  if (status === "rejected" || status === "suspended") {
    return "rejected";
  }

  return "unverified";
}

function mapRowToAccount(row: AccountRow): AdminAccount {
  return {
    id: row.acc_id ?? "",
    fullName: row.full_name ?? "",
    nid: row.nid ?? "",
    email: row.email ?? "",
    phoneNum: row.phone_num ?? "",
    houseNum: row.house_num ?? "",
    roadNumber: row.road_number ?? "",
    avenueNum: row.avenue_num ?? "",
    username: row.username ?? "",
    role: toRole(row.role),
    status: toStatus(row.status),
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,
    verifiedAt: row.verified_at ?? null,
    rejectedAt: row.rejected_at ?? null,
  };
}

export function AdminAccountsProvider({ children }: { children: ReactNode }) {
  const [pendingAccounts, setPendingAccounts] = useState<AdminAccount[]>([]);
  const [registeredAccounts, setRegisteredAccounts] = useState<AdminAccount[]>(
    [],
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<AdminAccountMetrics>(initialMetrics);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from("account")
      .select("*");

    if (fetchError) {
      setError(fetchError.message);
      setLoading(false);
      return;
    }

    const rows = (data ?? []) as AccountRow[];
    const accounts = rows
      .map(mapRowToAccount)
      .filter((account) => Boolean(account.id));

    const verifiedAccounts = accounts.filter(
      (account) => account.status === "verified",
    );
    const pendingAccs = accounts.filter(
      (account) => account.status === "unverified",
    );

    // Read stored today actions from AsyncStorage
    const todayKey = getTodayKey();
    let verifiedTodayCount = 0;
    let rejectedTodayCount = 0;

    try {
      const storedVerified = await AsyncStorage.getItem(`${todayKey}_verified`);
      const storedRejected = await AsyncStorage.getItem(`${todayKey}_rejected`);

      if (storedVerified !== null) {
        const parsed = JSON.parse(storedVerified);
        verifiedTodayCount = Array.isArray(parsed) ? parsed.length : 0;
      } else {
        // Initial default: count verified accounts in system
        verifiedTodayCount = verifiedAccounts.length;
      }

      if (storedRejected !== null) {
        rejectedTodayCount = parseInt(storedRejected, 10) || 0;
      }
    } catch (e) {
      console.error("Error reading metrics from AsyncStorage", e);
      verifiedTodayCount = verifiedAccounts.length;
    }

    setPendingAccounts(pendingAccs);
    setRegisteredAccounts(verifiedAccounts);

    setMetrics({
      pendingCount: pendingAccs.length,
      verifiedTodayCount,
      rejectedTodayCount,
      registeredCount: verifiedAccounts.length,
      authorityCount: verifiedAccounts.filter(
        (account) => account.role === "authority",
      ).length,
    });

    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const approveAccount = useCallback(
    async (accountId: string) => {
      const { error: updateError } = await supabase
        .from("account")
        .update({ status: "verified" })
        .eq("acc_id", accountId);

      if (updateError) {
        setError(updateError.message);
        return;
      }

      // Record approval for today
      try {
        const todayKey = getTodayKey();
        const storedVerified = await AsyncStorage.getItem(`${todayKey}_verified`);
        let currentList: string[] = [];
        if (storedVerified) {
          currentList = JSON.parse(storedVerified);
        }
        if (!currentList.includes(accountId)) {
          currentList.push(accountId);
          await AsyncStorage.setItem(`${todayKey}_verified`, JSON.stringify(currentList));
        }
      } catch (e) {
        console.error("Error updating verified metrics in AsyncStorage", e);
      }

      await refresh();
    },
    [refresh],
  );

  const rejectAccount = useCallback(
    async (accountId: string) => {
      const { error: deleteError } = await supabase
        .from("account")
        .delete()
        .eq("acc_id", accountId);

      if (deleteError) {
        setError(deleteError.message);
        return;
      }

      // Record rejection for today
      try {
        const todayKey = getTodayKey();
        const storedRejected = await AsyncStorage.getItem(`${todayKey}_rejected`);
        const currentCount = (parseInt(storedRejected || "0", 10) || 0) + 1;
        await AsyncStorage.setItem(`${todayKey}_rejected`, currentCount.toString());
      } catch (e) {
        console.error("Error updating rejected metrics in AsyncStorage", e);
      }

      await refresh();
    },
    [refresh],
  );

  const value = useMemo<AdminAccountsContextValue>(
    () => ({
      pendingAccounts,
      registeredAccounts,
      loading,
      error,
      metrics,
      refresh,
      approveAccount,
      rejectAccount,
    }),
    [
      pendingAccounts,
      registeredAccounts,
      loading,
      error,
      metrics,
      refresh,
      approveAccount,
      rejectAccount,
    ],
  );

  return (
    <AdminAccountsContext.Provider value={value}>
      {children}
    </AdminAccountsContext.Provider>
  );
}

export function useAdminAccounts() {
  const context = useContext(AdminAccountsContext);

  if (!context) {
    throw new Error(
      "useAdminAccounts must be used within an AdminAccountsProvider",
    );
  }

  return context;
}
