// src/app/(admin)/_layout.tsx

import { Stack } from "expo-router";

import AdminPageHeader from "@/components/admin/admin-page-header";
import { AuthorityComplaintsProvider } from "@/components/authority/authority-complaints-context";

export default function Layout() {
  return (
    <AuthorityComplaintsProvider>
      <Stack
        screenOptions={{
          headerShown: true,
          header: () => <AdminPageHeader />,
          headerShadowVisible: false,
        }}
      />
    </AuthorityComplaintsProvider>
  );
}
