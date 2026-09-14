import Ionicons from "@expo/vector-icons/Ionicons";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type PostRejectedModalProps = {
  visible: boolean;
  title: string;
  note: string | null;
  onDismiss: () => void;
  onViewGuidelines: () => void;
};

/**
 * Shown when an author opens the notification for a post that was not approved.
 * The post itself is no longer in the forum, so this is where the reason lives.
 */
export default function PostRejectedModal({
  visible,
  title,
  note,
  onDismiss,
  onViewGuidelines,
}: PostRejectedModalProps) {
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
          <View style={styles.iconBadge}>
            <Ionicons name="close-circle" size={38} color="#B42318" />
          </View>

          <Text style={styles.heading}>Your post was not approved</Text>
          <Text style={styles.lead}>
            It was reviewed against the Community Guidelines and has been
            removed from the forum, so no one else can see it.
          </Text>

          <ScrollView
            style={styles.bodyScroll}
            contentContainerStyle={styles.body}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <Text style={styles.label}>YOUR POST</Text>
            <Text style={styles.postTitle}>{title}</Text>

            <Text style={[styles.label, styles.labelSpaced]}>
              REASON GIVEN BY THE ADMIN
            </Text>
            <Text style={styles.note}>
              {note?.trim() || "No reason was provided."}
            </Text>
          </ScrollView>

          <Text style={styles.footnote}>
            You are welcome to write a new post that follows the guidelines.
          </Text>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={onDismiss}
            activeOpacity={0.85}
            accessibilityRole="button"
          >
            <Text style={styles.primaryButtonText}>Got it</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={onViewGuidelines}
            activeOpacity={0.7}
            accessibilityRole="button"
          >
            <Text style={styles.secondaryButtonText}>
              Read the Community Guidelines
            </Text>
            <Ionicons name="chevron-forward" size={14} color="#00475E" />
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
  iconBadge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#FFF1F0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  heading: {
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
  bodyScroll: {
    alignSelf: "stretch",
    marginTop: 16,
    flexGrow: 0,
  },
  body: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#F8F9FC",
    borderWidth: 1,
    borderColor: "#EAECF0",
  },
  label: {
    fontSize: 10,
    fontWeight: "800",
    color: "#23435D",
    letterSpacing: 0.5,
  },
  labelSpaced: { marginTop: 12 },
  postTitle: {
    marginTop: 4,
    color: "#191C1E",
    fontSize: 14,
    fontWeight: "700",
  },
  note: {
    marginTop: 4,
    color: "#B42318",
    fontSize: 13,
    lineHeight: 19,
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
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 10,
    marginTop: 2,
  },
  secondaryButtonText: {
    color: "#00475E",
    fontSize: 12,
    fontWeight: "700",
  },
});
