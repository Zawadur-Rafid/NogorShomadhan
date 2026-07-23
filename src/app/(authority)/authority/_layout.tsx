import Stack from 'expo-router/stack';

import { AuthorityComplaintsProvider } from '@/components/authority/authority-complaints-context';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function AuthorityLayout() {
  return (
    <AuthorityComplaintsProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="complaints/[complaintId]" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="change-password" />
        <Stack.Screen name="activity-log" />
      </Stack>
    </AuthorityComplaintsProvider>
  );
}
