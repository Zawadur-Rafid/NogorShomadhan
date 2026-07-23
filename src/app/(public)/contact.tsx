import BackButton from "@/components/back-button";
import { MaterialIcons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

const colors = {
  primary: "#00475e",
  primaryContainer: "#1a5f7a",
  secondary: "#904d00",
  secondaryContainer: "#ffa454",
  surface: "#ffffff",
  surfaceContainer: "#eceef0",
  background: "#f8f9fc",
  onSurfaceVariant: "#40484d",
  error: "#ba1a1a",
};

export default function ContactScreen() {
  const router = useRouter();
  // Form States
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = () => {
    if (!name || !phone || !email || !subject || !message) {
      Alert.alert(
        "Missing Fields",
        "Please fill out all sections before submitting.",
      );
      return;
    }

    // Process submission logic here (e.g., API endpoint submission)
    Alert.alert(
      "Message Sent!",
      `Thank you, ${name}. Your message regarding "${subject}" has been successfully submitted to Nogor Shomadhan.`,
    );

    // Clear form after successful submit
    setName("");
    setPhone("");
    setEmail("");
    setSubject("");
    setMessage("");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header Layout (Mirrors Impact page) */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <BackButton />
          <Image
            source={require("../../../assets/images/main_logo.png")}
            style={styles.logoImage}
          />
          <Text style={styles.headerTitle}>Contact Us</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Hero Introduction Card */}
        <View style={styles.heroSection}>
          <Text style={styles.mainTitle}>Get in Touch</Text>
          <View style={styles.divider} />
          <Text style={styles.description}>
            Have questions, feedback, or need assistance regarding civic
            complaints? Fill out the form below, and our support team will get
            back to you as soon as possible.
          </Text>
        </View>

        {/* Contact Form Section */}
        <View style={styles.formCard}>
          {/* Name Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Name</Text>
            <View style={styles.inputWrapper}>
              <MaterialIcons
                name="person-outline"
                size={20}
                color={colors.primary}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Enter your full name"
                placeholderTextColor="#a0a8b0"
                value={name}
                onChangeText={setName}
              />
            </View>
          </View>

          {/* Contact Number Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Contact Number</Text>
            <View style={styles.inputWrapper}>
              <MaterialIcons
                name="phone-android"
                size={20}
                color={colors.primary}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Enter your contact number"
                placeholderTextColor="#a0a8b0"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
            </View>
          </View>

          {/* Email Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
            <View style={styles.inputWrapper}>
              <MaterialIcons
                name="mail-outline"
                size={20}
                color={colors.primary}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Enter your email address"
                placeholderTextColor="#a0a8b0"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>
          </View>

          {/* Subject Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Subject</Text>
            <View style={styles.inputWrapper}>
              <MaterialIcons
                name="label-outline"
                size={20}
                color={colors.primary}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="What is this regarding?"
                placeholderTextColor="#a0a8b0"
                value={subject}
                onChangeText={setSubject}
              />
            </View>
          </View>

          {/* Message Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Message</Text>
            <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Type your message details here..."
                placeholderTextColor="#a0a8b0"
                multiline={true}
                numberOfLines={5}
                textAlignVertical="top"
                value={message}
                onChangeText={setMessage}
              />
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={styles.submitButton}
            activeOpacity={0.85}
            onPress={handleSubmit}
          >
            <Text style={styles.submitButtonText}>Submit Message</Text>
            <MaterialIcons name="send" size={18} color="#ffffff" />
          </TouchableOpacity>
        </View>
      {/* Account actions appear after the page content, not over it. */}
      <View style={styles.bottomSection}>

          <View style={styles.ctaContainer}>
              <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() => router.push('/(public)/register')}
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
      </ScrollView>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    height: 56,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  logoImage: {
    width: 28,
    height: 28,
    borderRadius: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.primary,
  },
  scrollView: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 0,
  },
  heroSection: {
    backgroundColor: colors.surface,
    padding: 24,
    borderRadius: 16,
    marginBottom: 24,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.primary,
    marginBottom: 12,
  },
  divider: {
    height: 4,
    width: 40,
    backgroundColor: colors.secondaryContainer,
    borderRadius: 2,
    marginBottom: 16,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.onSurfaceVariant,
  },
  formCard: {
    backgroundColor: colors.surface,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(192,200,205,0.15)",
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 18,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.primary,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: "rgba(192,200,205,0.4)",
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 48,
  },
  textAreaWrapper: {
    height: "auto",
    paddingVertical: 10,
    alignItems: "flex-start",
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: colors.primary,
    fontSize: 14,
    fontWeight: "500",
    height: "100%",
  },
  textArea: {
    height: 100,
  },
  submitButton: {
    flexDirection: "row",
    backgroundColor: colors.primary,
    height: 48,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  submitButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  bottomSection: {
    marginTop: 40,
    backgroundColor: '#f2f4f6',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 16,
    paddingTop: 32,
    paddingBottom: 24,
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
