import BackButton from "@/components/back-button";
import { MaterialIcons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

const IMPACT_IMAGES = [
  require("../../../assets/images/impact_1.png"),
  require("../../../assets/images/impact_2.png"),
  require("../../../assets/images/impact_3.png"),
  require("../../../assets/images/impact_4.png"),
];

const colors = {
  primary: "#00475e",
  primaryContainer: "#1a5f7a",
  secondary: "#904d00",
  secondaryContainer: "#ffa454",
  surface: "#ffffff",
  surfaceContainer: "#eceef0",
  background: "#f8f9fc",
  onSurfaceVariant: "#40484d",
};

export default function ImpactScreen() {
  const router = useRouter();
  // State to manage the currently selected full-screen image
  const [selectedImage, setSelectedImage] = useState<any | null>(null);

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <BackButton />
          <Image
            source={require("../../../assets/images/main_logo.png")}
            style={styles.logoImage}
          />
          <Text style={styles.headerTitle}>Impact</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Hero / Title Section */}
        <View style={styles.heroSection}>
          <Text style={styles.mainTitle}>Impact of Nogor Shomadhan</Text>
          <View style={styles.divider} />
          <Text style={styles.description}>
            Nogor Shomadhan is transforming the way citizens interact with urban
            governance systems by introducing transparency, efficiency, and
            accountability into civic issue management.
          </Text>
          <Text style={styles.description}>
            By digitizing the complaint process, the platform reduces delays,
            eliminates communication gaps, and ensures that issues are
            systematically tracked from submission to resolution.
          </Text>
          <Text style={styles.description}>
            The platform empowers citizens to actively participate in improving
            their surroundings, while providing authorities with structured data
            and analytical insights to make informed decisions.
          </Text>
        </View>

        {/* Core Values Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Our Core Values</Text>
          <View style={styles.valuesGrid}>
            {["Inclusivity", "Connectivity", "Efficiency", "Collaboration"].map(
              (value, index) => (
                <View key={index} style={styles.valueCard}>
                  <MaterialIcons
                    name="verified-user"
                    size={24}
                    color={colors.secondary}
                  />
                  <Text style={styles.valueText}>{value}</Text>
                </View>
              ),
            )}
          </View>
        </View>

        {/* Media Coverage Section */}
        <View style={[styles.section, { marginBottom: 40 }]}>
          <Text style={styles.sectionTitle}>Media Coverage</Text>
          <View style={styles.mediaGrid}>
            {IMPACT_IMAGES.map((img, index) => (
              <TouchableOpacity
                key={index}
                style={styles.imageWrapper}
                activeOpacity={0.8}
                onPress={() => setSelectedImage(img)}
              >
                <Image
                  source={img}
                  style={styles.newspaperImage}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            ))}
          </View>
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


      {/* Full-Screen Image Modal Viewer */}
      <Modal
        visible={selectedImage !== null}
        transparent={false}
        animationType="fade"
        onRequestClose={() => setSelectedImage(null)}
      >
        <SafeAreaView style={styles.modalContainer}>
          {/* Custom Back/Close Button Bar */}
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setSelectedImage(null)}
            >
              <MaterialIcons name="arrow-back" size={24} color="#ffffff" />
              <Text style={styles.closeButtonText}> </Text>
            </TouchableOpacity>
          </View>

          {/* Full-Screen Image Display */}
          <View style={styles.modalImageContainer}>
            {selectedImage && (
              <Image
                source={selectedImage}
                style={styles.fullScreenImage}
                resizeMode="contain"
              />
            )}
          </View>
        </SafeAreaView>
      </Modal>
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
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 0,
  },
  scrollView: {
    flex: 1,
    backgroundColor: colors.background,
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
    marginBottom: 12,
  },
  section: {
    marginTop: 8,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.primary,
    marginBottom: 16,
  },
  valuesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  valueCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    width: "47%",
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(192,200,205,0.2)",
  },
  valueText: {
    fontWeight: "600",
    color: colors.primary,
  },
  mediaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  imageWrapper: {
    width: "48%",
    height: 140,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: colors.surface,
    padding: 6,
    borderWidth: 1,
    borderColor: "rgba(192,200,205,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  newspaperImage: {
    width: "100%",
    height: "100%",
  },
  /* Modal Overlay Styling */
  modalContainer: {
    flex: 1,
    backgroundColor: "#121212", // Clean slate black backdrop for focus
  },
  modalHeader: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  closeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
  },
  closeButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  modalImageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  fullScreenImage: {
    width: "100%",
    height: "100%",
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
