import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import TopNav from '../../components/TopNav';
import BottomNav from '../../components/BottomNav';

const residentProfileDetails = {
  name: 'Ashfia Tabassum',
  email: 'ashfia@gmail.com',
  phone: '+880 1711-123456',
  address: 'Apt 4B, Building 12, Block C',
  nid: '1234567890',
  role: 'Resident',
};

function ProfileField({
  label,
  value,
  onChangeText,
  icon,
  editable = true,
}: {
  label: string;
  value: string;
  onChangeText?: (value: string) => void;
  icon: keyof typeof Ionicons.glyphMap;
  editable?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={[styles.inputBox, !editable && styles.inputBoxReadOnly]}>
        <Ionicons name={icon} size={17} color="#7A8493" />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          editable={editable}
          style={[styles.input, !editable && styles.inputReadOnly]}
        />
        {!editable && <Ionicons name="lock-closed-outline" size={13} color="#A0A7B1" />}
      </View>
    </View>
  );
}

export default function Profile() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const wide = width >= 820;
  const [name, setName] = useState<string>(residentProfileDetails.name);
  const [email, setEmail] = useState<string>(residentProfileDetails.email);
  const [phone, setPhone] = useState<string>(residentProfileDetails.phone);
  const [address, setAddress] = useState<string>(residentProfileDetails.address);
  const [saved, setSaved] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const handleEditToggle = () => {
    if (isEditing) {
      setSaved(true);
      setIsEditing(false);
    } else {
      setIsEditing(true);
      setSaved(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <TopNav />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.container}>
          <View style={styles.profileHero}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>AT</Text>
            </View>
            <View style={styles.heroCopy}>
              <Text style={styles.eyebrow}>RESIDENT ACCOUNT</Text>
              <Text style={styles.title}>{name}</Text>
              <Text style={styles.role}>{residentProfileDetails.role}</Text>
              <View style={styles.verifiedBadge}>
                <Ionicons name="shield-checkmark" size={13} color="#16845B" />
                <Text style={styles.verifiedText}>Verified resident account</Text>
              </View>
            </View>
          </View>

          {saved && (
            <View style={styles.successBanner}>
              <Ionicons name="checkmark-circle" size={19} color="#16845B" />
              <Text style={styles.successText}>Profile information saved successfully.</Text>
              <TouchableOpacity onPress={() => setSaved(false)}>
                <Ionicons name="close" size={17} color="#16845B" />
              </TouchableOpacity>
            </View>
          )}

          <View style={[styles.pageGrid, wide && styles.pageGridWide]}>
            <View style={styles.formPanel}>
              <View style={styles.panelHeading}>
                <View>
                  <Text style={styles.panelTitle}>Profile Information</Text>
                  <Text style={styles.panelSubtitle}>Update your resident contact information.</Text>
                </View>
                <Ionicons name="person-outline" size={22} color="#23435D" />
              </View>

              <View style={styles.fieldsGrid}>
                <ProfileField label="Full Name" value={name} onChangeText={setName} icon="person-outline" editable={false} />
                <ProfileField label="Email Address" value={email} onChangeText={setEmail} icon="mail-outline" editable={isEditing} />
                <ProfileField label="Phone Number" value={phone} onChangeText={setPhone} icon="call-outline" editable={isEditing} />
                <ProfileField label="Address" value={address} onChangeText={setAddress} icon="home-outline" editable={isEditing} />
                <ProfileField label="NID Number" value={residentProfileDetails.nid} icon="id-card-outline" editable={false} />
              </View>

              <TouchableOpacity style={styles.saveButton} onPress={handleEditToggle}>
                <Ionicons name={isEditing ? "save-outline" : "create-outline"} size={18} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>{isEditing ? "Save Changes" : "Edit Profile"}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.sideColumn}>
              <View style={styles.securityCard}>
                <View style={styles.securityIcon}>
                  <Ionicons name="lock-closed-outline" size={21} color="#FFFFFF" />
                </View>
                <Text style={styles.securityTitle}>Account Security</Text>
                <Text style={styles.securityText}>Keep your account protected with a strong password.</Text>
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => router.push('/(resident)/change-password')}
                >
                  <Text style={styles.secondaryButtonText}>Change Password</Text>
                  <Ionicons name="arrow-forward" size={15} color="#23435D" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
      <BottomNav activeRoute="profile" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F7F8FA' },
  scrollContent: { paddingBottom: 34 },
  container: { width: '100%', maxWidth: 1040, alignSelf: 'center', padding: 16, gap: 15 },
  profileHero: { flexDirection: 'row', alignItems: 'center', gap: 15, padding: 18, borderRadius: 15, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EAEDF1' },
  avatar: { width: 66, height: 66, borderRadius: 33, alignItems: 'center', justifyContent: 'center', backgroundColor: '#23435D' },
  avatarText: { color: '#FFFFFF', fontSize: 20, fontWeight: '900' },
  heroCopy: { flex: 1 },
  eyebrow: { color: '#B9854B', fontSize: 9, fontWeight: '900', letterSpacing: 0.7 },
  title: { color: '#111827', fontSize: 23, fontWeight: '800', marginTop: 2 },
  role: { color: '#6B7280', fontSize: 10, marginTop: 3 },
  verifiedBadge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 11, backgroundColor: '#EAF8F1', marginTop: 8 },
  verifiedText: { color: '#16845B', fontSize: 8, fontWeight: '800' },
  successBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 12, backgroundColor: '#EAF8F1', borderWidth: 1, borderColor: '#CDEBDE' },
  successText: { flex: 1, color: '#16845B', fontSize: 10, fontWeight: '700' },
  pageGrid: { gap: 14 },
  pageGridWide: { flexDirection: 'row', alignItems: 'flex-start' },
  formPanel: { flex: 1.5, padding: 17, borderRadius: 14, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EAEDF1' },
  sideColumn: { flex: 0.8, gap: 12 },
  panelHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16 },
  panelTitle: { color: '#1F2937', fontSize: 16, fontWeight: '800' },
  panelSubtitle: { color: '#8A93A1', fontSize: 9, marginTop: 3 },
  fieldsGrid: { gap: 12 },
  field: { gap: 6 },
  fieldLabel: { color: '#475467', fontSize: 9, fontWeight: '800' },
  inputBox: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 11, borderRadius: 11, borderWidth: 1, borderColor: '#DDE2E8', backgroundColor: '#FFFFFF' },
  inputBoxReadOnly: { backgroundColor: '#F7F8FA' },
  input: { flex: 1, color: '#344054', fontSize: 10 },
  inputReadOnly: { color: '#7A8493' },
  saveButton: { alignSelf: 'flex-start', minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 18, borderRadius: 22, backgroundColor: '#23435D', marginTop: 17 },
  saveButtonText: { color: '#FFFFFF', fontSize: 10, fontWeight: '900' },
  securityCard: { gap: 10, padding: 16, borderRadius: 14, backgroundColor: '#F2F6F8', borderWidth: 1, borderColor: '#DCE5EA' },
  securityIcon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: '#23435D' },
  securityTitle: { color: '#1F2937', fontSize: 15, fontWeight: '800' },
  securityText: { color: '#6B7280', fontSize: 10, lineHeight: 15 },
  secondaryButton: { minHeight: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D7E2E7' },
  secondaryButtonText: { color: '#23435D', fontSize: 9, fontWeight: '900' },
});
