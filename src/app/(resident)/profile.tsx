import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useState, useEffect, useRef } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useWindowDimensions, View, ActivityIndicator, Animated, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../lib/supabase';

import TopNav from '../../components/TopNav';
import BottomNav from '../../components/BottomNav';

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
  
  const [loading, setLoading] = useState(true);
  const [accId, setAccId] = useState<string | null>(null);
  
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [nid, setNid] = useState<string>('');
  const [role, setRole] = useState<string>('');
  const [initials, setInitials] = useState<string>('');

  const [isEditing, setIsEditing] = useState(false);

  const [showToast, setShowToast] = useState(false);
  const slideAnim = useRef(new Animated.Value(400)).current;

  const triggerToast = () => {
    setShowToast(true);
    Animated.sequence([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.delay(2000),
      Animated.timing(slideAnim, {
        toValue: 400,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start(() => setShowToast(false));
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const id = await AsyncStorage.getItem('acc_id');
        if (!id) {
          router.replace('/sign-in');
          return;
        }
        setAccId(id);

        const { data, error } = await supabase
          .from('account')
          .select('*')
          .eq('acc_id', id)
          .single();

        if (data && !error) {
          setName(data.full_name || '');
          setEmail(data.email || '');
          setPhone(data.phone_num || '');
          setNid(data.nid || '');
          setRole(data.role ? data.role.charAt(0).toUpperCase() + data.role.slice(1) : '');
          
          const parts = [];
          if (data.house_num) parts.push(`House ${data.house_num}`);
          if (data.road_number) parts.push(`Road ${data.road_number}`);
          if (data.avenue_num) parts.push(`Avenue ${data.avenue_num}`);
          setAddress(parts.join(', '));
          
          if (data.full_name) {
            const nameParts = data.full_name.split(' ');
            if (nameParts.length > 1) {
              setInitials(nameParts[0].charAt(0).toUpperCase() + nameParts[nameParts.length - 1].charAt(0).toUpperCase());
            } else {
              setInitials(data.full_name.substring(0, 2).toUpperCase());
            }
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleEditToggle = async () => {
    if (isEditing) {
      if (accId) {
        // Just updating basic contact info as it's displayed as a single string for address. 
        // We won't parse address back to house/road for this simple edit, we'll just update email and phone.
        const { error } = await supabase
          .from('account')
          .update({ email: email, phone_num: phone })
          .eq('acc_id', accId);
          
        if (!error) {
          triggerToast();
        }
      }
      setIsEditing(false);
    } else {
      setIsEditing(true);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#23435D" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <TopNav />
      {showToast && (
        <Animated.View style={[styles.toastContainer, { transform: [{ translateX: slideAnim }] }]}>
          <View style={styles.toastLeftBorder} />
          <MaterialIcons name="check-circle" size={24} color="#1b7a43" style={styles.toastIcon} />
          <View style={styles.toastContent}>
            <Text style={styles.toastTitle}>Success</Text>
            <Text style={styles.toastText}>Profile information successfully updated.</Text>
          </View>
          <TouchableOpacity onPress={() => setShowToast(false)} style={styles.toastCloseButton}>
            <MaterialIcons name="close" size={18} color="#1a1a1a" />
          </TouchableOpacity>
        </Animated.View>
      )}
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.container}>
          <View style={styles.profileHero}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View style={styles.heroCopy}>
              <Text style={styles.eyebrow}>RESIDENT ACCOUNT</Text>
              <Text style={styles.title}>{name}</Text>
              <Text style={styles.role}>{role}</Text>
              <View style={styles.verifiedBadge}>
                <Ionicons name="shield-checkmark" size={13} color="#16845B" />
                <Text style={styles.verifiedText}>Verified resident account</Text>
              </View>
            </View>
          </View>

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
                <ProfileField label="Address" value={address} icon="home-outline" editable={false} />
                <ProfileField label="NID Number" value={nid} icon="id-card-outline" editable={false} />
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
  toastContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    right: 16,
    width: 320,
    backgroundColor: '#ebf4ec',
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 16,
    paddingRight: 16,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    overflow: 'hidden',
  },
  toastLeftBorder: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: '#1b7a43',
  },
  toastIcon: {
    marginLeft: 16,
    marginTop: 0,
  },
  toastContent: {
    flex: 1,
    marginLeft: 12,
  },
  toastTitle: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  toastText: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '400',
    color: '#2a2a2a',
    lineHeight: 20,
  },
  toastCloseButton: {
    padding: 2,
    marginLeft: 8,
  },
});
