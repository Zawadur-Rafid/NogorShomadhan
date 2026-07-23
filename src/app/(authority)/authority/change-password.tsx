import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AuthorityPageHeader from '@/components/authority/authority-page-header';

function PasswordField({
  label,
  value,
  onChangeText,
  visible,
  onToggle,
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  visible: boolean;
  onToggle: () => void;
  placeholder: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.inputBox}>
        <Ionicons name="lock-closed-outline" size={17} color="#7A8493" />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#98A2B3"
          secureTextEntry={!visible}
          autoCapitalize="none"
          style={styles.input}
        />
        <TouchableOpacity onPress={onToggle} accessibilityLabel={visible ? 'Hide password' : 'Show password'}>
          <Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={18} color="#7A8493" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function AuthorityChangePassword() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [visibleField, setVisibleField] = useState<'current' | 'new' | 'confirm' | null>(null);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const updatePassword = () => {
    setSaved(false);
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Complete all password fields.');
      return;
    }
    if (newPassword.length < 8) {
      setError('The new password must contain at least 8 characters.');
      return;
    }
    if (newPassword === currentPassword) {
      setError('Choose a new password that is different from the current password.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    setError('');
    setSaved(true);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setVisibleField(null);
  };

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
              <Ionicons name="shield-checkmark-outline" size={27} color="#FFFFFF" />
            </View>
            <View style={styles.heroCopy}>
              <Text style={styles.eyebrow}>ACCOUNT SECURITY</Text>
              <Text style={styles.title}>Change Password</Text>
              <Text style={styles.subtitle}>Update the password used to access your authority account.</Text>
            </View>
          </View>

          {saved && (
            <View style={styles.successBanner}>
              <Ionicons name="checkmark-circle" size={19} color="#16845B" />
              <Text style={styles.successText}>Password changed successfully.</Text>
            </View>
          )}

          <View style={styles.formPanel}>
            <View style={styles.panelHeading}>
              <View>
                <Text style={styles.panelTitle}>Password Details</Text>
                <Text style={styles.panelSubtitle}>All fields are required.</Text>
              </View>
              <Ionicons name="key-outline" size={22} color="#23435D" />
            </View>

            <PasswordField
              label="Current Password"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Enter current password"
              visible={visibleField === 'current'}
              onToggle={() => setVisibleField((field) => field === 'current' ? null : 'current')}
            />
            <PasswordField
              label="New Password"
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Enter new password"
              visible={visibleField === 'new'}
              onToggle={() => setVisibleField((field) => field === 'new' ? null : 'new')}
            />
            <PasswordField
              label="Confirm New Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Re-enter new password"
              visible={visibleField === 'confirm'}
              onToggle={() => setVisibleField((field) => field === 'confirm' ? null : 'confirm')}
            />

            <View style={styles.requirements}>
              <Text style={styles.requirementsTitle}>Password requirements</Text>
              <View style={styles.requirementRow}>
                <Ionicons name="checkmark-circle-outline" size={14} color="#16845B" />
                <Text style={styles.requirementText}>At least 8 characters</Text>
              </View>
              <View style={styles.requirementRow}>
                <Ionicons name="checkmark-circle-outline" size={14} color="#16845B" />
                <Text style={styles.requirementText}>Different from your current password</Text>
              </View>
            </View>

            {!!error && (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle-outline" size={18} color="#DC4B42" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <TouchableOpacity style={styles.saveButton} onPress={updatePassword}>
              <Ionicons name="lock-closed-outline" size={18} color="#FFFFFF" />
              <Text style={styles.saveButtonText}>Update Password</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F7F8FA' },
  scrollContent: { paddingBottom: 34 },
  container: { width: '100%', maxWidth: 720, alignSelf: 'center', padding: 16, gap: 15 },
  hero: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18, borderRadius: 15, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EAEDF1' },
  heroIcon: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: '#23435D' },
  heroCopy: { flex: 1 },
  eyebrow: { color: '#B9854B', fontSize: 9, fontWeight: '900', letterSpacing: 0.7 },
  title: { color: '#111827', fontSize: 24, fontWeight: '800', marginTop: 2 },
  subtitle: { color: '#6B7280', fontSize: 10, lineHeight: 15, marginTop: 4 },
  successBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 12, backgroundColor: '#EAF8F1', borderWidth: 1, borderColor: '#CDEBDE' },
  successText: { color: '#16845B', fontSize: 10, fontWeight: '700' },
  formPanel: { gap: 13, padding: 18, borderRadius: 14, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EAEDF1' },
  panelHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 3 },
  panelTitle: { color: '#1F2937', fontSize: 16, fontWeight: '800' },
  panelSubtitle: { color: '#8A93A1', fontSize: 9, marginTop: 3 },
  field: { gap: 6 },
  fieldLabel: { color: '#475467', fontSize: 9, fontWeight: '800' },
  inputBox: { minHeight: 45, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 11, borderRadius: 11, borderWidth: 1, borderColor: '#DDE2E8', backgroundColor: '#FFFFFF' },
  input: { flex: 1, color: '#344054', fontSize: 10 },
  requirements: { gap: 7, padding: 12, borderRadius: 11, backgroundColor: '#F7F9FA' },
  requirementsTitle: { color: '#344054', fontSize: 9, fontWeight: '800', marginBottom: 1 },
  requirementRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  requirementText: { color: '#667085', fontSize: 9 },
  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 7, padding: 11, borderRadius: 10, backgroundColor: '#FFF1F1' },
  errorText: { flex: 1, color: '#A83F39', fontSize: 9, fontWeight: '700' },
  saveButton: { minHeight: 45, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 23, backgroundColor: '#23435D', marginTop: 3 },
  saveButtonText: { color: '#FFFFFF', fontSize: 10, fontWeight: '900' },
});
