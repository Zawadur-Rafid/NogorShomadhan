import Ionicons from '@expo/vector-icons/Ionicons';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AuthorityPageHeader from '@/components/authority/authority-page-header';
import { useAuthorityProfile } from '@/components/authority/authority-profile-context';

function ProfileField({
  label,
  value,
  icon,
}: {
  label: string;
  value?: string | null;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.valueBox}>
        <Ionicons name={icon} size={18} color="#7A8493" />
        <Text selectable style={styles.valueText}>
          {value?.trim() || 'Not provided'}
        </Text>
      </View>
    </View>
  );
}

export default function AuthorityProfile() {
  const { profile, loading, error, refresh } = useAuthorityProfile();

  if (loading && !profile) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <AuthorityPageHeader />
        <View style={styles.stateCard}>
          <ActivityIndicator size="large" color="#23435D" />
          <Text style={styles.stateTitle}>Loading profile information</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <AuthorityPageHeader />
        <View style={styles.stateCard}>
          <Ionicons name="alert-circle-outline" size={38} color="#B54747" />
          <Text style={styles.stateTitle}>Profile information unavailable</Text>
          <Text selectable style={styles.stateText}>
            {error ?? 'The logged-in authority account could not be loaded.'}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => void refresh()}>
            <Ionicons name="refresh-outline" size={16} color="#FFFFFF" />
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <AuthorityPageHeader />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.container}>
          <View style={styles.hero}>
            <View style={styles.heroIcon}>
              <Ionicons name="person-outline" size={27} color="#FFFFFF" />
            </View>
            <View style={styles.heroCopy}>
              <Text style={styles.eyebrow}>AUTHORITY PROFILE</Text>
              <Text style={styles.title}>Profile Information</Text>
              <Text style={styles.subtitle}>
                Contact information registered for this authority account.
              </Text>
            </View>
          </View>

          <View style={styles.profileCard}>
            <ProfileField
              label="Full Name"
              value={profile.fullName}
              icon="person-outline"
            />
            <ProfileField
              label="Email"
              value={profile.email}
              icon="mail-outline"
            />
            <ProfileField
              label="Phone Number"
              value={profile.phoneNumber}
              icon="call-outline"
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F7F8FA' },
  scrollContent: { flexGrow: 1, paddingBottom: 34 },
  container: {
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
    gap: 15,
    padding: 16,
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 18,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#EAEDF1',
    backgroundColor: '#FFFFFF',
  },
  heroIcon: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 26,
    backgroundColor: '#23435D',
  },
  heroCopy: { flex: 1 },
  eyebrow: { color: '#B9854B', fontSize: 9, fontWeight: '900', letterSpacing: 0.7 },
  title: { color: '#111827', fontSize: 23, fontWeight: '800', marginTop: 2 },
  subtitle: { color: '#6B7280', fontSize: 10, lineHeight: 15, marginTop: 4 },
  profileCard: {
    gap: 14,
    padding: 18,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EAEDF1',
    backgroundColor: '#FFFFFF',
  },
  field: { gap: 6 },
  fieldLabel: { color: '#475467', fontSize: 9, fontWeight: '800' },
  valueBox: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 12,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#E1E5EA',
    backgroundColor: '#F7F8FA',
  },
  valueText: { flex: 1, color: '#344054', fontSize: 11, lineHeight: 16 },
  stateCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 30,
  },
  stateTitle: { color: '#1F2937', fontSize: 17, fontWeight: '800', textAlign: 'center' },
  stateText: {
    maxWidth: 420,
    color: '#7A8493',
    fontSize: 10,
    lineHeight: 16,
    textAlign: 'center',
  },
  retryButton: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingHorizontal: 17,
    borderRadius: 21,
    backgroundColor: '#23435D',
    marginTop: 4,
  },
  retryButtonText: { color: '#FFFFFF', fontSize: 10, fontWeight: '900' },
});
