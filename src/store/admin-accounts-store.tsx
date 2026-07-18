import {
    createContext,
    useContext,
    useMemo,
    useState,
    type ReactNode,
} from "react";

export type AdminAccountRole = "Resident" | "Authority";

export type AdminAccount = {
  id: string;
  fullName: string;
  nidNumber: string;
  emailAddress: string;
  phoneNumber: string;
  houseNo: string;
  roadNo: string;
  username: string;
  role: AdminAccountRole;
};

export type PendingAdminAccount = AdminAccount & {
  requestedOn: string;
};

export type RegisteredAdminAccount = AdminAccount & {
  verifiedOn: string;
};

type AdminAccountsContextValue = {
  pendingAccounts: PendingAdminAccount[];
  registeredAccounts: RegisteredAdminAccount[];
  approveAccount: (accountId: string) => void;
  rejectAccount: (accountId: string) => void;
};

const initialPendingAccounts: PendingAdminAccount[] = [
  {
    id: "P-1001",
    fullName: "Ayesha Rahman",
    nidNumber: "1987456321098",
    emailAddress: "ayesha.rahman@example.com",
    phoneNumber: "+8801712345678",
    houseNo: "House 14",
    roadNo: "Road 5",
    username: "ayesha.r",
    role: "Resident",
    requestedOn: "2026-07-16",
  },
  {
    id: "P-1002",
    fullName: "Md. Tamim Hasan",
    nidNumber: "1990123478561",
    emailAddress: "tamim.hasan@example.com",
    phoneNumber: "+8801811223344",
    houseNo: "House 8/A",
    roadNo: "Road 12",
    username: "tamim.hasan",
    role: "Authority",
    requestedOn: "2026-07-17",
  },
  {
    id: "P-1003",
    fullName: "Nusrat Jahan",
    nidNumber: "1978563412200",
    emailAddress: "nusrat.jahan@example.com",
    phoneNumber: "+8801933445566",
    houseNo: "House 22",
    roadNo: "Road 3",
    username: "nusrat.j",
    role: "Resident",
    requestedOn: "2026-07-18",
  },
];

const initialRegisteredAccounts: RegisteredAdminAccount[] = [
  {
    id: "R-2001",
    fullName: "Farhan Islam",
    nidNumber: "1988112233445",
    emailAddress: "farhan.islam@example.com",
    phoneNumber: "+8801711002233",
    houseNo: "House 7",
    roadNo: "Road 1",
    username: "farhan.i",
    role: "Resident",
    verifiedOn: "2026-07-10",
  },
  {
    id: "R-2002",
    fullName: "Sumi Akter",
    nidNumber: "1994022755667",
    emailAddress: "sumi.akter@example.com",
    phoneNumber: "+8801912340044",
    houseNo: "House 19",
    roadNo: "Road 8",
    username: "sumi.a",
    role: "Resident",
    verifiedOn: "2026-07-11",
  },
  {
    id: "R-2003",
    fullName: "Md. Rafiq Uddin",
    nidNumber: "1979011122334",
    emailAddress: "rafiq.uddin@example.com",
    phoneNumber: "+8801822123456",
    houseNo: "House 2/A",
    roadNo: "Road 11",
    username: "rafiq.u",
    role: "Authority",
    verifiedOn: "2026-07-13",
  },
];

const AdminAccountsContext = createContext<AdminAccountsContextValue | null>(
  null,
);

export function AdminAccountsProvider({ children }: { children: ReactNode }) {
  const [pendingAccounts, setPendingAccounts] = useState(
    initialPendingAccounts,
  );
  const [registeredAccounts, setRegisteredAccounts] = useState(
    initialRegisteredAccounts,
  );

  const value = useMemo<AdminAccountsContextValue>(
    () => ({
      pendingAccounts,
      registeredAccounts,
      approveAccount: (accountId: string) => {
        setPendingAccounts((currentPending) => {
          const account = currentPending.find((item) => item.id === accountId);

          if (!account) {
            return currentPending;
          }

          setRegisteredAccounts((currentRegistered) => [
            {
              id: `R-${account.id.replace(/^P-/, "")}`,
              fullName: account.fullName,
              nidNumber: account.nidNumber,
              emailAddress: account.emailAddress,
              phoneNumber: account.phoneNumber,
              houseNo: account.houseNo,
              roadNo: account.roadNo,
              username: account.username,
              role: account.role,
              verifiedOn: new Date().toISOString().slice(0, 10),
            },
            ...currentRegistered,
          ]);

          return currentPending.filter((item) => item.id !== accountId);
        });
      },
      rejectAccount: (accountId: string) => {
        setPendingAccounts((currentPending) =>
          currentPending.filter((item) => item.id !== accountId),
        );
      },
    }),
    [pendingAccounts, registeredAccounts],
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
