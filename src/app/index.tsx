import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground, Dimensions, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function OnboardingScreen() {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 3);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const steps = [
    {
      id: 0,
      icon: 'report-problem',
      title: 'Report Issue',
      description: 'Spot a problem? Snap a photo and submit it in seconds.',
      iconBg: 'rgba(0, 71, 94, 0.1)',
      iconColor: '#00475e',
    },
    {
      id: 1,
      icon: 'analytics',
      title: 'Track Status',
      description: 'Stay updated with real-time notifications on the progress.',
      iconBg: 'rgba(255, 164, 84, 0.2)',
      iconColor: '#904d00',
    },
    {
      id: 2,
      icon: 'task-alt',
      title: 'Issue Resolved',
      description: 'Confirm resolution and contribute to a cleaner city.',
      iconBg: 'rgba(255, 221, 187, 0.3)',
      iconColor: '#5f3800',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Background Illustration Overlay */}
      <View style={StyleSheet.absoluteFill}>
        <ImageBackground
          source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDWAkfJ5tDPfkObLB5RxDQi2qBOBp7dem5it_EO4yQvlpM6e6Q2M0LQCjoEaU0mr82BkHCW5Fgp9wfzK4Tq0x1Fqt8N7epYQsFcO-FZQmJiBo9mpy2Q-UDwi79eyFo2oxgSEMAdUu7RNIfkyOdyJwpLfR2TY8zNpdbMTX-xKyPhz_6rUy8zYg6p6Htq_sEftY8otjutNl87ihq7cTRk_WxVdXGCqF943amhzpx613-E6NFTGQEXYThM' }}
          style={styles.bgImage}
          imageStyle={{ opacity: 0.3 }}
        />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <MaterialIcons name="location-city" size={48} color="#ffffff" />
          </View>
          <Text style={styles.title}>Nogor Shomadhan</Text>
          <Text style={styles.subtitle}>Smart Solutions for a Better City</Text>
        </View>

        {/* Workflow Illustration */}
        <View style={styles.workflowContainer}>
          {/* Connecting line */}
          <View style={styles.connectorLine} />
          
          {steps.map((step, index) => {
            const isActive = activeStep === index;
            return (
              <View 
                key={step.id} 
                style={[
                  styles.stepCard, 
                  isActive ? styles.stepActive : styles.stepInactive
                ]}
              >
                <View style={[styles.stepIconWrapper, { backgroundColor: step.iconBg }]}>
                  <MaterialIcons name={step.icon as any} size={24} color={step.iconColor} />
                </View>
                <View style={styles.stepTextContainer}>
                  <Text style={styles.stepTitle}>{step.title}</Text>
                  <Text style={styles.stepDesc}>{step.description}</Text>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* CTAs & Footer */}
      <View style={styles.bottomSection}>
        <View style={styles.ctaContainer}>
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={() => router.push('/register')}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>Register</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={() => router.push('/(public)/sign-in')}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>Sign In</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footerLinks}>
          <TouchableOpacity onPress={() => router.push('/(public)/about')}>
            <Text style={styles.footerLinkText}>About</Text>
          </TouchableOpacity>
          <View style={styles.footerDot} />
          <TouchableOpacity onPress={() => router.push('/(public)/impact')}>
            <Text style={styles.footerLinkText}>Impact</Text>
          </TouchableOpacity>
          <View style={styles.footerDot} />
          <TouchableOpacity onPress={() => router.push('/(public)/contact')}>
            <Text style={styles.footerLinkText}>Contact</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fc',
  },
  bgImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 32,
    paddingBottom: 24,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    width: 80,
    height: 80,
    backgroundColor: '#1a5f7a',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  title: {
    fontFamily: 'Inter',
    fontSize: 28,
    fontWeight: '700',
    color: '#00475e',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Inter',
    fontSize: 16,
    color: '#40484d',
    textAlign: 'center',
    maxWidth: 280,
  },
  workflowContainer: {
    width: '100%',
    maxWidth: 400,
    position: 'relative',
    paddingVertical: 16,
  },
  connectorLine: {
    position: 'absolute',
    left: 40,
    top: 40,
    bottom: 40,
    width: 2,
    backgroundColor: 'rgba(192, 200, 205, 0.3)',
    zIndex: -1,
  },
  stepCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 24,
  },
  stepActive: {
    borderColor: 'rgba(0, 71, 94, 0.5)',
    transform: [{ scale: 1.05 }],
    shadowColor: '#00475e',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 25,
    elevation: 5,
    zIndex: 10,
  },
  stepInactive: {
    borderColor: 'rgba(192, 200, 205, 0.3)',
    opacity: 0.6,
  },
  stepIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  stepTextContainer: {
    flex: 1,
  },
    stepTitle: {
        fontFamily: 'Inter',
        fontSize: 20,
        fontWeight: '700',
        color: '#191c1e',
        marginBottom: 4,
    },
  stepDesc: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#40484d',
  },
  bottomSection: {
    backgroundColor: '#f2f4f6',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  ctaContainer: {
    gap: 12,
    marginBottom: 32,
  },
  primaryButton: {
    width: '100%',
    height: 56,
    backgroundColor: '#00475e',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
    primaryButtonText: {
        fontFamily: 'Inter',
        fontSize: 20,
        fontWeight: '700',
        color: '#ffffff',
    },
  secondaryButton: {
    width: '100%',
    height: 56,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#00475e',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
    secondaryButtonText: {
        fontFamily: 'Inter',
        fontSize: 20,
        fontWeight: '700',
        color: '#00475e',
    },
  footerLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
  },
  footerLinkText: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '600',
    color: '#40484d',
  },
  footerDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#c0c8cd',
  },
});
