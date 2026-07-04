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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Link } from 'expo-router';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import Logo from '@/components/logo';
import BackButton from '@/components/back-button';
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
  primaryContainer: '#1a5f7a',
  onPrimaryContainer: '#9bd7f7',
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

type Role = 'resident' | 'authority' | 'admin';

export default function SignInScreen() {
  const router = useRouter();
  const [role, setRole] = useState<Role>('resident');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Animation for the segment control background
  const translateX = useSharedValue(0);

  const handleRoleChange = (selectedRole: Role, index: number) => {
    setRole(selectedRole);
    // Assuming each tab takes 33.33% of the container width
    translateX.value = withTiming(index * 100, {
      duration: 300,
      easing: Easing.inOut(Easing.ease),
    });
  };

  const handleSignIn = () => {
    // Routing logic based on selected role
    if (role === 'resident') {
      router.replace('/(resident)/dashboard');
    } else if (role === 'authority') {
      router.replace('/(authority)/dashboard');
    } else if (role === 'admin') {
      router.replace('/(admin)/dashboard');
    }
  };

  const roleIndicatorStyle = useAnimatedStyle(() => {
    // We animate the 'left' property using percentage strings which is supported in reanimated
    // 0%, 33.33%, 66.66%
    return {
      left: `${(translateX.value / 100) * 33.33}%` as any,
    };
  });

  return (
    <SafeAreaView style={styles.container}>
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

          {/* Role Segmented Control */}
          <View style={styles.roleContainer}>
            <Animated.View 
              style={[
                styles.roleIndicator, 
                roleIndicatorStyle
              ]} 
            />
            {(['resident', 'authority', 'admin'] as Role[]).map((r, i) => (
              <TouchableOpacity
                key={r}
                style={styles.roleTab}
                onPress={() => handleRoleChange(r, i)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.roleTabText,
                  role === r && styles.roleTabTextActive
                ]}>
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Sign In Form */}
          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                {role === 'resident' ? 'Email or Username' : role === 'authority' ? 'Official Email' : 'Admin ID'}
              </Text>
              <TextInput
                style={styles.input}
                placeholder={role === 'resident' ? 'Enter email or username' : 'Enter ID / Email'}
                placeholderTextColor={colors.outlineVariant}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType={role === 'resident' ? 'email-address' : 'default'}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter password"
                placeholderTextColor={colors.outlineVariant}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.signInButton} onPress={handleSignIn} activeOpacity={0.8}>
              <Text style={styles.signInButtonText}>Sign In</Text>
            </TouchableOpacity>

            {/* Register link only relevant for residents usually */}
            {role === 'resident' && (
              <View style={styles.footer}>
                <Text style={styles.footerText}>Don't have an account? </Text>
                <Link href="/register" asChild>
                  <TouchableOpacity>
                    <Text style={styles.registerText}>Register</Text>
                  </TouchableOpacity>
                </Link>
              </View>
            )}
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
  roleContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 4,
    marginBottom: 24,
    // Soft ambient shadow (Level 1)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    position: 'relative',
  },
  roleIndicator: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 4,
    width: '33.33%',
    backgroundColor: colors.primaryContainer,
    borderRadius: 6,
  },
  roleTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
    zIndex: 1,
  },
  roleTabText: {
    ...typography.labelMd,
    color: colors.onSurfaceVariant,
  },
  roleTabTextActive: {
    color: colors.onPrimaryContainer,
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
    backgroundColor: colors.background, // Inputs contrast slightly
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
});
