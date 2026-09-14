import Ionicons from "@expo/vector-icons/Ionicons";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  COMMUNITY_GUIDELINES,
  COMMUNITY_GUIDELINES_SUMMARY,
} from "@/constants/community-guidelines";

/**
 * Compact one-line reminder shown inside the resident post composer.
 * Tapping it opens the full guidelines.
 */
export function CommunityGuidelinesNotice({
  onPress,
}: {
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.notice}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel="View Community Guidelines"
    >
      <Ionicons name="shield-checkmark" size={16} color="#00475E" />
      <View style={styles.noticeCopy}>
        <Text style={styles.noticeText}>
          Every post is reviewed by an admin against our Community Guidelines.
        </Text>
        {/* Kept on its own short line so the underline never breaks across rows. */}
        <Text style={styles.noticeLink}>View guidelines</Text>
      </View>
      <Ionicons name="chevron-forward" size={14} color="#00475E" />
    </TouchableOpacity>
  );
}

/** Full guidelines list, opened from the composer notice. */
export function CommunityGuidelinesModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <View style={styles.iconBadge}>
                <Ionicons
                  name="shield-checkmark"
                  size={20}
                  color="#23435D"
                />
              </View>
              <View style={styles.headerCopy}>
                <Text style={styles.title}>Community Guidelines</Text>
                <Text style={styles.subtitle}>
                  What every post is checked against
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <Ionicons name="close" size={18} color="#667085" />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollBody}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.lead}>{COMMUNITY_GUIDELINES_SUMMARY}</Text>

            {COMMUNITY_GUIDELINES.map((guideline) => (
              <View key={guideline.title} style={styles.rule}>
                <View style={styles.ruleIcon}>
                  <Ionicons name={guideline.icon} size={16} color="#00475E" />
                </View>
                <View style={styles.ruleCopy}>
                  <Text style={styles.ruleTitle}>{guideline.title}</Text>
                  <Text style={styles.ruleDetail}>{guideline.detail}</Text>
                </View>
              </View>
            ))}
          </ScrollView>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={onClose}
            activeOpacity={0.85}
            accessibilityRole="button"
          >
            <Text style={styles.primaryButtonText}>Got it</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  notice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: "#EAF3FF",
  },
  noticeCopy: {
    flex: 1,
    gap: 2,
  },
  noticeText: {
    color: "#344054",
    fontSize: 11,
    lineHeight: 16,
  },
  noticeLink: {
    alignSelf: "flex-start",
    color: "#00475E",
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "700",
    textDecorationLine: "underline",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    maxHeight: "90%",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#EAECF0",
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 10,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#EAECF0",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  headerCopy: { flex: 1 },
  iconBadge: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#EAF0F6",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 17,
    fontWeight: "800",
    color: "#1F2937",
  },
  subtitle: {
    fontSize: 11,
    color: "#667085",
    marginTop: 2,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F2F4F7",
    alignItems: "center",
    justifyContent: "center",
  },
  scrollBody: {
    paddingTop: 14,
    paddingBottom: 6,
    gap: 14,
  },
  lead: {
    color: "#40484D",
    fontSize: 13,
    lineHeight: 19,
  },
  rule: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  ruleIcon: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: "#EAF0F6",
    alignItems: "center",
    justifyContent: "center",
  },
  ruleCopy: { flex: 1 },
  ruleTitle: {
    color: "#191C1E",
    fontSize: 13,
    fontWeight: "700",
  },
  ruleDetail: {
    marginTop: 2,
    color: "#667085",
    fontSize: 12,
    lineHeight: 17,
  },
  primaryButton: {
    marginTop: 14,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#00475E",
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
});
