import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const colors = {
  background: '#f8f9fc',
  card: '#ffffff',
  field: '#f1f3f6',
  primary: '#00475e',
  primaryRaised: '#00566d',
  onPrimary: '#ffffff',
  onSurface: '#191c1e',
  onSurfaceVariant: '#40484d',
  outline: '#c0c8cd',
  accent: '#9a5b0f',
};

const areas = ['Ward 01', 'Ward 02', 'Ward 03', 'Ward 04'];

type FieldName =
  | 'fullName'
  | 'nid'
  | 'email'
  | 'phone'
  | 'address'
  | 'area'
  | 'username'
  | 'password'
  | 'confirmPassword';

type FormState = Record<FieldName, string>;

const initialForm: FormState = {
  fullName: '',
  nid: '',
  email: '',
  phone: '',
  address: '',
  area: '',
  username: '',
  password: '',
  confirmPassword: '',
};

export default function Register() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initialForm);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const updateField = (name: FieldName, value: string) => {
    setForm((current) => ({ ...current, [name]: value }));
  };

  const cycleArea = () => {
    const currentIndex = areas.indexOf(form.area);
    updateField('area', areas[(currentIndex + 1) % areas.length]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerIconButton}
            activeOpacity={0.75}
            onPress={() => router.back()}
          >
            <MaterialIcons name="arrow-back" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.brand}>Nogor Shomadhan</Text>
          <TouchableOpacity style={styles.headerIconButton} activeOpacity={0.75}>
            <MaterialIcons name="notifications-none" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            <Text style={styles.title}>Resident Registration</Text>
            <Text style={styles.subtitle}>
              Please fill in your details to create an official citizen account.
            </Text>

            <SectionHeader icon="person-outline" title="Personal Information" />
            <FormInput
              label="Full Name"
              placeholder="e.g. Abdullah Al Mamun"
              value={form.fullName}
              onChangeText={(value) => updateField('fullName', value)}
            />
            <FormInput
              label="National ID (NID)"
              placeholder="10 or 17 digit NID number"
              value={form.nid}
              onChangeText={(value) => updateField('nid', value)}
              keyboardType="number-pad"
            />
            <FormInput
              label="Email Address"
              placeholder="name@example.com"
              value={form.email}
              onChangeText={(value) => updateField('email', value)}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <FormInput
              label="Phone Number"
              placeholder="+880 1XXX-XXXXXX"
              value={form.phone}
              onChangeText={(value) => updateField('phone', value)}
              keyboardType="phone-pad"
            />

            <SectionHeader icon="location-on" title="Residential Address" />
            <FormInput
              label="House No & Road No"
              placeholder="House 12, Road 5"
              value={form.address}
              onChangeText={(value) => updateField('address', value)}
            />
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Area / Ward</Text>
              <Pressable style={styles.selectInput} onPress={cycleArea}>
                <Text style={[styles.selectText, !form.area && styles.placeholderText]}>
                  {form.area || 'Select Area'}
                </Text>
                <MaterialIcons name="keyboard-arrow-down" size={24} color={colors.onSurfaceVariant} />
              </Pressable>
            </View>

            <SectionHeader icon="lock-outline" title="Security Credentials" />
            <FormInput
              label="Username"
              placeholder="Pick a unique username"
              value={form.username}
              onChangeText={(value) => updateField('username', value)}
              autoCapitalize="none"
            />
            <FormInput
              label="Password"
              placeholder="At least 8 characters"
              value={form.password}
              onChangeText={(value) => updateField('password', value)}
              secureTextEntry
            />
            <FormInput
              label="Confirm Password"
              placeholder="Repeat password"
              value={form.confirmPassword}
              onChangeText={(value) => updateField('confirmPassword', value)}
              secureTextEntry
            />

            <Pressable
              style={styles.termsRow}
              onPress={() => setAcceptedTerms((current) => !current)}
            >
              <View style={[styles.checkbox, acceptedTerms && styles.checkboxChecked]}>
                {acceptedTerms && <MaterialIcons name="check" size={14} color={colors.onPrimary} />}
              </View>
              <Text style={styles.termsText}>
                I agree to the <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
                <Text style={styles.termsLink}>Privacy Policy</Text> of Nogor Shomadhan.
              </Text>
            </Pressable>

            <TouchableOpacity style={styles.registerButton} activeOpacity={0.85}>
              <MaterialIcons name="how-to-reg" size={23} color={colors.onPrimary} />
              <Text style={styles.registerButtonText}>Register Button</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <View style={styles.bottomTabs}>
          <BottomTab icon="home" label="Home" />
          <BottomTab icon="map" label="Map" />
          <BottomTab icon="person-outline" label="Profile" active />
          <BottomTab icon="assignment" label="Complaints" />
          <BottomTab icon="insert-chart-outlined" label="Data" />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function SectionHeader({ icon, title }: { icon: keyof typeof MaterialIcons.glyphMap; title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <MaterialIcons name={icon} size={16} color={colors.accent} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

type FormInputProps = {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
  keyboardType?: 'default' | 'email-address' | 'number-pad' | 'phone-pad';
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
};

function FormInput({
  label,
  placeholder,
  value,
  onChangeText,
  keyboardType = 'default',
  secureTextEntry = false,
  autoCapitalize = 'sentences',
}: FormInputProps) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={colors.onSurfaceVariant}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
      />
    </View>
  );
}

function BottomTab({
  icon,
  label,
  active = false,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  active?: boolean;
}) {
  return (
    <View style={styles.tabItem}>
      <View style={[styles.tabIconPill, active && styles.tabIconPillActive]}>
        <MaterialIcons name={icon} size={22} color={active ? colors.onPrimary : colors.onSurfaceVariant} />
      </View>
      <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    minHeight: 64,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#eef1f5',
    backgroundColor: colors.background,
  },
  headerIconButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: {
    flex: 1,
    paddingHorizontal: 10,
    fontFamily: 'Inter',
    fontSize: 24,
    fontWeight: '800',
    color: colors.primary,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 28,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e9ed',
    padding: 24,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 18,
    elevation: 2,
  },
  title: {
    fontFamily: 'Inter',
    fontSize: 24,
    fontWeight: '800',
    color: colors.primary,
  },
  subtitle: {
    fontFamily: 'Inter',
    fontSize: 15,
    lineHeight: 21,
    color: colors.onSurfaceVariant,
    marginTop: -8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 8,
  },
  sectionTitle: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: colors.accent,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '700',
    color: colors.onSurfaceVariant,
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.outline,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontFamily: 'Inter',
    fontSize: 15,
    color: colors.onSurface,
    backgroundColor: colors.field,
  },
  selectInput: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.outline,
    borderRadius: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.field,
  },
  selectText: {
    fontFamily: 'Inter',
    fontSize: 15,
    color: colors.onSurface,
  },
  placeholderText: {
    color: colors.onSurfaceVariant,
  },
  termsRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    paddingTop: 18,
  },
  checkbox: {
    width: 16,
    height: 16,
    borderWidth: 1,
    borderColor: colors.outline,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    backgroundColor: colors.card,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  termsText: {
    flex: 1,
    fontFamily: 'Inter',
    fontSize: 14,
    lineHeight: 20,
    color: colors.onSurfaceVariant,
  },
  termsLink: {
    fontWeight: '800',
    color: colors.primary,
  },
  registerButton: {
    minHeight: 56,
    borderRadius: 12,
    backgroundColor: colors.primaryRaised,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  registerButtonText: {
    fontFamily: 'Inter',
    fontSize: 20,
    fontWeight: '800',
    color: colors.onPrimary,
  },
  bottomTabs: {
    height: 66,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: '#dce2e7',
    backgroundColor: colors.card,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  tabIconPill: {
    minWidth: 44,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconPillActive: {
    backgroundColor: '#1b7890',
  },
  tabLabel: {
    fontFamily: 'Inter',
    fontSize: 11,
    fontWeight: '700',
    color: colors.onSurfaceVariant,
  },
  tabLabelActive: {
    color: '#1b7890',
  },
});
