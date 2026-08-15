import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Link } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import Logo from '@/components/logo';
import BackButton from '@/components/back-button';
import { supabase } from '@/lib/supabase';

// Design tokens based on design.md
const colors = {
  background: '#f8f9fc',
  primary: '#00475e',
  onPrimary: '#ffffff',
  surface: '#ffffff', // For cards (surface-container-lowest)
  onSurface: '#191c1e',
  onSurfaceVariant: '#40484d',
  outline: '#70787d',
  outlineVariant: '#c0c8cd',
  error: '#ba1a1a',
};

const typography = {
  headlineLg: {
    fontFamily: 'Inter',
    fontSize: 28,
    fontWeight: '700' as const,
    color: colors.onSurface,
  },
  bodyLg: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '400' as const,
    color: colors.onSurfaceVariant,
  },
  labelMd: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '700' as const,
  },
  buttonText: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '600' as const,
  }
};

export default function SignInScreen() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [showToast, setShowToast] = useState(false);
  const slideAnim = React.useRef(new Animated.Value(400)).current;

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

  const handleSignIn = async () => {
    setErrorMsg('');
    if (!identifier.trim() || !password.trim()) {
      setErrorMsg('Invalid credentials.');
      return;
    }

    setIsLoading(true);
    try {
      // Check account table for matching email or username and password
      const { data, error } = await supabase
        .from('account')
        .select('*')
        .or(`email.eq.${identifier},username.eq.${identifier}`)
        .eq('password', password)
        .single();

      if (error || !data || data.status !== 'verified') {
        setErrorMsg('Invalid credentials.');
        setIsLoading(false);
        return;
      }

      triggerToast();
      setTimeout(() => {
        // Route based on role
        if (data.role === 'resident') {
          router.replace('/(resident)/dashboard');
        } else if (data.role === 'authority') {
          // Assume authority has a similar route structure
          router.replace('/authority/dashboard');
        } else if (data.role === 'admin') {
          router.replace('/(admin)/dashboard');
        } else {
          setErrorMsg('Unknown user role.');
        }
      }, 3000);
    } catch (err) {
      console.error(err);
      setErrorMsg('An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {showToast && (
        <Animated.View style={[styles.toastContainer, { transform: [{ translateX: slideAnim }] }]}>
          <View style={styles.toastLeftBorder} />
          <MaterialIcons name="check-circle" size={24} color="#1b7a43" style={styles.toastIcon} />
          <View style={styles.toastContent}>
            <Text style={styles.toastTitle}>Success</Text>
            <Text style={styles.toastText}>Sign in successful. Redirecting...</Text>
          </View>
          <TouchableOpacity onPress={() => setShowToast(false)} style={styles.toastCloseButton}>
            <MaterialIcons name="close" size={18} color="#1a1a1a" />
          </TouchableOpacity>
        </Animated.View>
      )}
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.topNav}>
            <BackButton />
          </View>

          <View style={styles.header}>
            <Logo size="small" />
            <Text style={styles.subtitle}>Sign in to your account</Text>
          </View>

          {/* Sign In Form */}
          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email or Username</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter email or username"
                placeholderTextColor={colors.outlineVariant}
                value={identifier}
                onChangeText={setIdentifier}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Enter password"
                  placeholderTextColor={colors.outlineVariant}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <MaterialIcons
                    name={showPassword ? 'visibility' : 'visibility-off'}
                    size={20}
                    color={colors.outline}
                  />
                </TouchableOpacity>
              </View>
              {errorMsg ? (
                <Text style={styles.errorText}>{errorMsg}</Text>
              ) : null}
            </View>

            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.signInButton, isLoading && styles.signInButtonDisabled]} 
              onPress={handleSignIn} 
              activeOpacity={0.8}
              disabled={isLoading}
            >
              <Text style={styles.signInButtonText}>{isLoading ? 'Signing In...' : 'Sign In'}</Text>
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <Link href="/register" asChild>
                <TouchableOpacity>
                  <Text style={styles.registerText}>Register</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
    justifyContent: 'center',
  },
  topNav: {
    alignSelf: 'flex-start',
    marginBottom: 16,
    marginTop: Platform.OS === 'android' ? 16 : 0,
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    ...typography.headlineLg,
    color: colors.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.bodyLg,
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: colors.surface,
    borderRadius: 16, // Cards use 16px radius
    padding: 24,
    // Soft ambient shadow (Level 1)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  errorText: {
    color: colors.error,
    fontFamily: 'Inter',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'left',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    ...typography.labelMd,
    color: colors.onSurface,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Inter',
    color: colors.onSurface,
    backgroundColor: colors.background,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 8,
    backgroundColor: colors.background,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Inter',
    color: colors.onSurface,
  },
  eyeIcon: {
    padding: 12,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    ...typography.labelMd,
    color: colors.primary,
  },
  signInButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    // Slightly more shadow for interactivity
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  signInButtonDisabled: {
    opacity: 0.7,
  },
  signInButtonText: {
    ...typography.buttonText,
    color: colors.onPrimary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    ...typography.bodyLg,
    fontSize: 14,
  },
  registerText: {
    ...typography.bodyLg,
    fontSize: 14,
    fontWeight: '700',
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
