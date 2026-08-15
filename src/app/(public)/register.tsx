import React, { useState, useRef } from 'react';
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
  Image,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import BackButton from '@/components/back-button';
import { supabase } from '@/lib/supabase';

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
  error: '#ba1a1a',
  success: '#2e7d32',
};

type FieldName =
  | 'fullName'
  | 'nid'
  | 'email'
  | 'phone'
  | 'houseNo'
  | 'roadNo'
  | 'avenueNo'
  | 'username'
  | 'password'
  | 'confirmPassword';

type FormState = Record<FieldName, string>;

const initialForm: FormState = {
  fullName: '',
  nid: '',
  email: '',
  phone: '',
  houseNo: '',
  roadNo: '',
  avenueNo: '',
  username: '',
  password: '',
  confirmPassword: '',
};

export default function Register() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<Partial<Record<FieldName | 'terms', string>>>({});
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const slideAnim = useRef(new Animated.Value(400)).current;

  const updateField = (name: FieldName, value: string) => {
    setForm((current) => ({ ...current, [name]: value }));
    if (errors[name]) {
      setErrors((current) => ({ ...current, [name]: undefined }));
    }
  };

  const handleRegister = async () => {
    let isValid = true;
    let newErrors: Partial<Record<FieldName | 'terms', string>> = {};

    (Object.keys(form) as FieldName[]).forEach((key) => {
      if (!form[key].trim()) {
        newErrors[key] = 'This field is required.';
        isValid = false;
      }
    });

    if (!acceptedTerms) {
      newErrors.terms = 'You must accept the terms and conditions.';
      isValid = false;
    }

    if (form.fullName && !/^[a-zA-Z\s]+$/.test(form.fullName)) {
      newErrors.fullName = 'Full name must contain only letters.';
      isValid = false;
    }

    if (form.nid && !/^(\d{10}|\d{13}|\d{17})$/.test(form.nid)) {
      newErrors.nid = 'NID must be 10, 13, or 17 digits only.';
      isValid = false;
    }

    if (form.phone && !/^\d{11}$/.test(form.phone)) {
      newErrors.phone = 'Phone number must be exactly 11 digits.';
      isValid = false;
    }

    if (form.password && form.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters.';
      isValid = false;
    }

    if (form.confirmPassword && form.password !== form.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
      isValid = false;
    }

    setErrors(newErrors);

    if (isValid) {
      try {
        const { error } = await supabase
          .from('account')
          .insert([
            {
              full_name: form.fullName,
              nid: form.nid,
              email: form.email,
              phone_num: form.phone,
              house_num: form.houseNo,
              road_number: form.roadNo,
              avenue_num: form.avenueNo,
              username: form.username,
              password: form.password,
            },
          ]);

        if (error) {
          console.error("Supabase insert error:", error);
          if (error.message.toLowerCase().includes('unique')) {
            setErrors({ terms: "An account with this email or username already exists." });
          } else {
            setErrors({ terms: "Failed to register. Please try again." });
          }
          return;
        }

        triggerToast();
        setTimeout(() => {
          router.replace('/');
        }, 3000);
      } catch (err) {
        console.error(err);
        setErrors({ terms: "An unexpected error occurred." });
      }
    }
  };

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

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {showToast && (
        <Animated.View style={[styles.toastContainer, { transform: [{ translateX: slideAnim }] }]}>
          <View style={styles.toastLeftBorder} />
          <MaterialIcons name="check-circle" size={24} color="#1b7a43" style={styles.toastIcon} />
          <View style={styles.toastContent}>
            <Text style={styles.toastTitle}>Success</Text>
            <Text style={styles.toastText}>Sign up successful. Wait for admin to verify.</Text>
          </View>
          <TouchableOpacity onPress={() => setShowToast(false)} style={styles.toastCloseButton}>
            <MaterialIcons name="close" size={18} color="#1a1a1a" />
          </TouchableOpacity>
        </Animated.View>
      )}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <BackButton />
            <Image
              source={require("../../../assets/images/main_logo.png")}
              style={styles.logoImage}
            />
            <Text style={styles.brand}>Nogor Shomadhan</Text>
          </View>
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
              error={errors.fullName}
            />
            <FormInput
              label="National ID (NID)"
              placeholder="10, 13, or 17 digit NID number"
              value={form.nid}
              onChangeText={(value) => updateField('nid', value)}
              keyboardType="number-pad"
              error={errors.nid}
            />
            <FormInput
              label="Email Address"
              placeholder="name@example.com"
              value={form.email}
              onChangeText={(value) => updateField('email', value)}
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
            />
            <FormInput
              label="Phone Number"
              placeholder="01XXXXXXXXX"
              value={form.phone}
              onChangeText={(value) => updateField('phone', value)}
              keyboardType="phone-pad"
              error={errors.phone}
            />

            <SectionHeader icon="location-on" title="Residential Address" />
            <FormInput
              label="House Number"
              placeholder="e.g. 12"
              value={form.houseNo}
              onChangeText={(value) => updateField('houseNo', value)}
              error={errors.houseNo}
            />
            <FormInput
              label="Road Number"
              placeholder="e.g. 5"
              value={form.roadNo}
              onChangeText={(value) => updateField('roadNo', value)}
              error={errors.roadNo}
            />
            <FormInput
              label="Avenue Number"
              placeholder="e.g. 3"
              value={form.avenueNo}
              onChangeText={(value) => updateField('avenueNo', value)}
              error={errors.avenueNo}
            />

            <SectionHeader icon="lock-outline" title="Security Credentials" />
            <FormInput
              label="Username"
              placeholder="Pick a unique username"
              value={form.username}
              onChangeText={(value) => updateField('username', value)}
              autoCapitalize="none"
              error={errors.username}
            />
            <FormInput
              label="Password"
              placeholder="At least 8 characters"
              value={form.password}
              onChangeText={(value) => updateField('password', value)}
              isPassword
              error={errors.password}
            />
            <FormInput
              label="Confirm Password"
              placeholder="Repeat password"
              value={form.confirmPassword}
              onChangeText={(value) => updateField('confirmPassword', value)}
              isPassword
              error={errors.confirmPassword}
            />

            <View>
              <Pressable
                style={styles.termsRow}
                onPress={() => {
                  setAcceptedTerms((current) => !current);
                  if (errors.terms) setErrors((current) => ({ ...current, terms: undefined }));
                }}
              >
                <View style={[styles.checkbox, acceptedTerms && styles.checkboxChecked]}>
                  {acceptedTerms && <MaterialIcons name="check" size={14} color={colors.onPrimary} />}
                </View>
                <Text style={styles.termsText}>
                  I agree to the <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
                  <Text style={styles.termsLink}>Privacy Policy</Text> of Nogor Shomadhan.
                </Text>
              </Pressable>
              {errors.terms && <Text style={styles.errorText}>{errors.terms}</Text>}
            </View>

            <TouchableOpacity style={styles.registerButton} activeOpacity={0.85} onPress={handleRegister}>
              <MaterialIcons name="how-to-reg" size={23} color={colors.onPrimary} />
              <Text style={styles.registerButtonText}>Register</Text>
            </TouchableOpacity>

            <View style={styles.accountPrompt}>
              <Text style={styles.accountPromptText}>Already have an account?</Text>
              <Pressable onPress={() => router.push('/(public)/sign-in')} hitSlop={8}>
                <Text style={styles.accountPromptLink}>Sign In</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
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
  isPassword?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  error?: string;
};

function FormInput({
  label,
  placeholder,
  value,
  onChangeText,
  keyboardType = 'default',
  isPassword = false,
  autoCapitalize = 'sentences',
  error,
}: FormInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputWrapper, error && styles.inputError]}>
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={colors.onSurfaceVariant}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          secureTextEntry={isPassword && !showPassword}
          autoCapitalize={autoCapitalize}
        />
        {isPassword && (
          <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.iconButton}>
            <MaterialIcons name={showPassword ? 'visibility-off' : 'visibility'} size={20} color={colors.onSurfaceVariant} />
          </Pressable>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
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
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eef1f5',
    backgroundColor: colors.background,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoImage: {
    width: 28,
    height: 28,
    borderRadius: 6,
  },
  brand: {
    fontFamily: 'Inter',
    fontSize: 20,
    fontWeight: '700',
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
    gap: 6,
  },
  label: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '700',
    color: colors.onSurfaceVariant,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.outline,
    borderRadius: 8,
    backgroundColor: colors.field,
    minHeight: 48,
  },
  inputError: {
    borderColor: colors.error,
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    fontFamily: 'Inter',
    fontSize: 15,
    color: colors.onSurface,
    minHeight: 48,
  },
  iconButton: {
    padding: 12,
  },
  errorText: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: colors.error,
    paddingLeft: 4,
  },
  termsRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    paddingTop: 8,
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
    marginTop: 8,
  },
  registerButtonText: {
    fontFamily: 'Inter',
    fontSize: 20,
    fontWeight: '800',
    color: colors.onPrimary,
  },
  accountPrompt: {
    marginTop: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  accountPromptText: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: colors.onSurfaceVariant,
  },
  accountPromptLink: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
  },
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
