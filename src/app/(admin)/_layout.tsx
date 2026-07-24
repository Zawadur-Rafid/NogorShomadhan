// src/app/(admin)/_layout.tsx

import { Stack } from "expo-router";

import { AuthorityComplaintsProvider } from "@/components/authority/authority-complaints-context";

export default function Layout() {
  return (
    <AuthorityComplaintsProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </AuthorityComplaintsProvider>
  );
}
