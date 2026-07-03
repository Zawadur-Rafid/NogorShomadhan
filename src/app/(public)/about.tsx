import { MaterialIcons } from "@expo/vector-icons";
import { Link } from "expo-router";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const colors = {
  background: "#f8f9fc",
  surface: "#ffffff",
  panel: "#d8e0ea",
  primary: "#00475e",
  primaryContainer: "#355c8a",
  onPrimary: "#ffffff",
  onSurface: "#191c1e",
  onSurfaceVariant: "#40484d",
  outlineVariant: "#c0c8cd",
};

const commitments = [
  {
    id: "01",
    title: "Reliable",
    body: "Ensuring complaints are handled properly",
  },
  {
    id: "02",
    title: "Secure",
    body: "Protecting user data and system integrity",
  },
  {
    id: "03",
    title: "Accessible",
    body: "Easy to use for people of all backgrounds",
  },
  {
    id: "04",
    title: "Impactful",
    body: "Making real improvements in everyday urban life",
  },
];

const reasons = [
  "Ensuring accountability through visible tracking",
  "Encouraging active citizen participation",
  "Improving efficiency in public service delivery",
  "Supporting data-driven urban planning",
];

export default function AboutScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topNav}>
          <Text style={styles.brand}>Nogor Shomadhan</Text>
          <View style={styles.navLinks}>
            <Link href="/" asChild>
              <TouchableOpacity>
                <Text style={styles.navLink}>Home</Text>
              </TouchableOpacity>
            </Link>
            <Link href="/(public)/about" asChild>
              <TouchableOpacity style={styles.navActivePill}>
                <Text style={styles.navActiveText}>About</Text>
              </TouchableOpacity>
            </Link>
            <Link href="/(public)/impact" asChild>
              <TouchableOpacity>
                <Text style={styles.navLink}>Impact</Text>
              </TouchableOpacity>
            </Link>
          </View>
          <View style={styles.authActions}>
            <Link href="/(public)/sign-in" asChild>
              <TouchableOpacity style={styles.loginBtn}>
                <Text style={styles.loginText}>Login</Text>
              </TouchableOpacity>
            </Link>
            <Link href="/(public)/register" asChild>
              <TouchableOpacity style={styles.registerBtn}>
                <Text style={styles.registerText}>Register</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>

        <View style={styles.heroGrid}>
          <View style={styles.leftColumn}>
            <View style={styles.headingPill}>
              <Text style={styles.heading}>About Nogor Shomadhan</Text>
            </View>
            <Text style={styles.leadText}>
              To empower citizens by giving them a voice while enabling
              authorities to respond more effectively through structured data
              and prioritization.
            </Text>

            <Text style={styles.sectionTitle}>Who are we?</Text>
            <View style={styles.identityCard}>
              <Text style={styles.identityText}>
                Nogor Shomadhan is a smart civic complaint management platform
                developed to bridge the gap between citizens and local
                authorities. We are a technology-driven initiative focused on
                improving urban living by enabling efficient reporting,
                tracking, and resolution of civic issues.
              </Text>
            </View>
          </View>

          <View style={styles.rightColumn}>
            <Image
              source={require("../../../assets/images/about1.png")}
              style={styles.heroImage}
            />
            <Image
              source={require("../../../assets/images/about2.png")}
              style={styles.heroImage}
            />
          </View>
        </View>

        <View style={styles.missionSection}>
          <Text style={styles.missionTitle}>Our Mission</Text>
          <View style={styles.missionCard}>
            <Text style={styles.missionText}>
              We envision a future where urban governance is data-driven,
              responsive, and inclusive, allowing cities to evolve into smarter
              and more sustainable environments. Nogor Shomadhan strives to
              become a key tool in building trust between citizens and
              authorities.
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitleLarge}>Who is this for?</Text>
        <View style={styles.audienceRow}>
          <View style={styles.audienceChip}>
            <MaterialIcons name="apartment" size={20} color="#efe8c7" />
            <Text style={styles.audienceText}>Citizens</Text>
          </View>
          <View style={styles.audienceChipPrimary}>
            <MaterialIcons name="account-balance" size={20} color="#efe8c7" />
            <Text style={styles.audienceText}>Administrators</Text>
          </View>
          <View style={styles.audienceChip}>
            <MaterialIcons name="verified-user" size={20} color="#efe8c7" />
            <Text style={styles.audienceText}>Local Authorities</Text>
          </View>
        </View>

        <Text style={styles.commitmentTitle}>Our Commitment</Text>
        <View style={styles.commitmentWrap}>
          {commitments.map((item) => (
            <View key={item.id} style={styles.commitmentCard}>
              <View style={styles.commitmentBadge}>
                <Text style={styles.commitmentBadgeText}>{item.id}</Text>
              </View>
              <Text style={styles.commitmentHead}>{item.title}</Text>
              <Text style={styles.commitmentBody}>{item.body}</Text>
            </View>
          ))}
        </View>

        <View style={styles.impactRow}>
          <Image
            source={require("../../../assets/images/about3.png")}
            style={styles.impactImage}
          />

          <View style={styles.impactPanel}>
            <Text style={styles.impactHeader}>Why we matter?</Text>
            {reasons.map((reason) => (
              <View key={reason} style={styles.reasonPill}>
                <Text style={styles.reasonText}>{reason}</Text>
              </View>
            ))}
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
  content: {
    paddingHorizontal: 12,
    paddingBottom: 24,
    gap: 14,
  },
  topNav: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    paddingVertical: 8,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    rowGap: 8,
    marginTop: 2,
  },
  brand: {
    fontFamily: "Inter",
    fontWeight: "700",
    fontSize: 20,
    color: colors.onSurface,
  },
  navLinks: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  navLink: {
    fontFamily: "Inter",
    fontWeight: "500",
    fontSize: 12,
    color: colors.onSurfaceVariant,
  },
  navActivePill: {
    backgroundColor: "#e9edf1",
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  navActiveText: {
    fontFamily: "Inter",
    fontWeight: "700",
    fontSize: 12,
    color: colors.onSurface,
  },
  authActions: {
    flexDirection: "row",
    gap: 8,
  },
  loginBtn: {
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 14,
    paddingVertical: 6,
    paddingHorizontal: 16,
    backgroundColor: "#f2f4f6",
  },
  loginText: {
    fontFamily: "Inter",
    fontWeight: "600",
    fontSize: 12,
    color: colors.onSurface,
  },
  registerBtn: {
    borderRadius: 14,
    paddingVertical: 6,
    paddingHorizontal: 16,
    backgroundColor: "#355c8a",
  },
  registerText: {
    fontFamily: "Inter",
    fontWeight: "600",
    fontSize: 12,
    color: colors.onPrimary,
  },
  heroGrid: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },
  leftColumn: {
    flex: 1,
    minWidth: 250,
  },
  rightColumn: {
    flex: 1,
    minWidth: 220,
    gap: 10,
  },
  headingPill: {
    alignSelf: "flex-start",
    backgroundColor: "#bbd5e5",
    borderRadius: 10,
    paddingVertical: 3,
    paddingHorizontal: 10,
    marginBottom: 8,
  },
  heading: {
    fontFamily: "Inter",
    fontWeight: "700",
    fontSize: 38,
    lineHeight: 44,
    color: colors.onSurface,
  },
  leadText: {
    fontFamily: "Inter",
    fontWeight: "400",
    fontSize: 14,
    color: colors.onSurfaceVariant,
    lineHeight: 22,
    marginBottom: 12,
    maxWidth: 560,
  },
  sectionTitle: {
    fontFamily: "Inter",
    fontWeight: "800",
    fontSize: 36,
    lineHeight: 40,
    color: colors.onSurface,
    marginBottom: 8,
  },
  identityCard: {
    backgroundColor: "#4c6f99",
    borderRadius: 10,
    padding: 12,
  },
  identityText: {
    fontFamily: "Inter",
    fontWeight: "400",
    fontSize: 13,
    lineHeight: 20,
    color: "#dfe9f4",
  },
  heroImage: {
    width: "100%",
    height: 190,
    borderRadius: 10,
  },
  missionSection: {
    backgroundColor: "#c2cfdd",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  missionTitle: {
    fontFamily: "Inter",
    fontWeight: "800",
    fontSize: 38,
    lineHeight: 44,
    color: colors.onSurface,
    textAlign: "center",
    marginBottom: 6,
  },
  missionCard: {
    backgroundColor: "#eceff3",
    borderRadius: 10,
    padding: 14,
  },
  missionText: {
    fontFamily: "Inter",
    fontWeight: "500",
    fontSize: 14,
    lineHeight: 24,
    color: "#30363a",
  },
  sectionTitleLarge: {
    fontFamily: "Inter",
    fontWeight: "800",
    fontSize: 42,
    lineHeight: 48,
    color: colors.onSurface,
    marginTop: 4,
  },
  audienceRow: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },
  audienceChip: {
    backgroundColor: "#72829a",
    borderRadius: 999,
    minHeight: 54,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  audienceChipPrimary: {
    backgroundColor: "#355c8a",
    borderRadius: 999,
    minHeight: 54,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  audienceText: {
    fontFamily: "Inter",
    fontWeight: "700",
    fontSize: 18,
    color: colors.onPrimary,
  },
  commitmentTitle: {
    fontFamily: "Inter",
    fontWeight: "700",
    fontSize: 40,
    lineHeight: 44,
    color: "#355c8a",
    textAlign: "center",
    marginTop: 2,
  },
  commitmentWrap: {
    backgroundColor: "#c9d9eb",
    borderRadius: 14,
    padding: 10,
    gap: 8,
    flexDirection: "row",
    flexWrap: "wrap",
  },
  commitmentCard: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 10,
    flexGrow: 1,
    flexBasis: 180,
    minHeight: 124,
  },
  commitmentBadge: {
    backgroundColor: "#e4ecf6",
    borderRadius: 6,
    alignSelf: "flex-start",
    paddingVertical: 2,
    paddingHorizontal: 6,
    marginBottom: 8,
  },
  commitmentBadgeText: {
    fontFamily: "Inter",
    fontWeight: "700",
    fontSize: 12,
    color: "#52647a",
  },
  commitmentHead: {
    fontFamily: "Inter",
    fontWeight: "700",
    fontSize: 16,
    color: colors.onSurface,
    marginBottom: 6,
  },
  commitmentBody: {
    fontFamily: "Inter",
    fontWeight: "500",
    fontSize: 13,
    lineHeight: 18,
    color: colors.onSurfaceVariant,
  },
  impactRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    alignItems: "stretch",
  },
  impactImage: {
    flex: 1,
    minWidth: 220,
    height: 210,
    borderRadius: 10,
  },
  impactPanel: {
    flex: 2,
    minWidth: 250,
    backgroundColor: "#3d6cab",
    borderRadius: 10,
    padding: 8,
    gap: 6,
  },
  impactHeader: {
    fontFamily: "Inter",
    fontWeight: "700",
    fontSize: 20,
    color: colors.onPrimary,
    textAlign: "center",
    marginBottom: 2,
  },
  reasonPill: {
    backgroundColor: "#d6e4f3",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  reasonText: {
    fontFamily: "Inter",
    fontWeight: "500",
    fontSize: 15,
    color: "#2b435c",
    textAlign: "left",
  },
});
