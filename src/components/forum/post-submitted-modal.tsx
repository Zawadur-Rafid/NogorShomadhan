import Ionicons from "@expo/vector-icons/Ionicons";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type ReviewStep = {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  title: string;
  detail: string;
};

const REVIEW_STEPS: ReviewStep[] = [
  {
    icon: "shield-checkmark-outline",
    title: "An admin is reviewing it",
    detail:
      "Your post is checked against the Community Guidelines to keep the forum respectful and useful.",
  },
  {
    icon: "people-outline",
    title: "Then the community sees it",
    detail:
      "Once approved, your post appears in the forum and your neighbours and the authority are notified.",
  },
  {
    icon: "notifications-outline",
    title: "You will hear back either way",
    detail:
      "You get a notification when it is approved. If it cannot be published, you will be told why.",
  },
];

/**
 * Persistent confirmation shown after a resident submits a forum post.
 * There is no timer and the backdrop is inert — only the button dismisses it.
 */
export default function PostSubmittedModal({
  visible,
  onDismiss,
}: {
  visible: boolean;
  onDismiss: () => void;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.successBadge}>
            <Ionicons name="checkmark-circle" size={40} color="#027A48" />
          </View>

          <Text style={styles.title}>Post submitted for review</Text>
          <Text style={styles.lead}>
            Thank you for contributing. Your post has been submitted
            successfully and is now waiting to be reviewed against our Community
            Guidelines.
          </Text>

          <ScrollView
            style={styles.stepsScroll}
            contentContainerStyle={styles.steps}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <Text style={styles.stepsLabel}>WHAT HAPPENS NEXT</Text>

            {REVIEW_STEPS.map((step) => (
              <View key={step.title} style={styles.step}>
                <View style={styles.stepIcon}>
                  <Ionicons name={step.icon} size={16} color="#00475E" />
                </View>
                <View style={styles.stepCopy}>
                  <Text style={styles.stepTitle}>{step.title}</Text>
                  <Text style={styles.stepDetail}>{step.detail}</Text>
                </View>
              </View>
            ))}
          </ScrollView>

          <Text style={styles.footnote}>
            Until it is approved, the post stays visible only to you, marked as
            pending.
          </Text>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={onDismiss}
            activeOpacity={0.85}
            accessibilityRole="button"
          >
            <Text style={styles.primaryButtonText}>Got it</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 10,
  },
  successBadge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#EAF8EF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1F2937",
    textAlign: "center",
  },
  lead: {
    marginTop: 8,
    color: "#40484D",
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },
  stepsScroll: {
    alignSelf: "stretch",
    marginTop: 16,
    flexGrow: 0,
  },
  steps: {
    gap: 13,
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#F8F9FC",
    borderWidth: 1,
    borderColor: "#EAECF0",
  },
  stepsLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#23435D",
    letterSpacing: 0.5,
  },
  step: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  stepIcon: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: "#EAF0F6",
    alignItems: "center",
    justifyContent: "center",
  },
  stepCopy: { flex: 1 },
  stepTitle: {
    color: "#191C1E",
    fontSize: 12,
    fontWeight: "700",
  },
  stepDetail: {
    marginTop: 2,
    color: "#667085",
    fontSize: 11,
    lineHeight: 16,
  },
  footnote: {
    alignSelf: "stretch",
    marginTop: 12,
    color: "#98A2B3",
    fontSize: 11,
    lineHeight: 16,
    textAlign: "center",
  },
  primaryButton: {
    alignSelf: "stretch",
    marginTop: 14,
    paddingVertical: 13,
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
