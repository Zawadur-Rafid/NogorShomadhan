import Ionicons from "@expo/vector-icons/Ionicons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { supabase } from "@/lib/supabase";
import { confirmDuplicate, rejectDuplicate } from "@/services/admin.service";
import { confirmAction } from "@/utils/confirm";

type Complaint = {
  comp_id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  house?: string | null;
  road?: string | null;
  avenue?: string | null;
  nearby_landmark?: string | null;
  additional_location_details?: string | null;
  timestamp?: string | null;
  images: string[];
};

type DuplicateReview = {
  dup_id: string;
  comp_id: string | null;
  matched_comp_id: string;
  ai_score: number;
  ai_reason: string | null;
  admin_status: string;
};

const locationText = (complaint: Complaint) =>
  [
    complaint.house,
    complaint.road,
    complaint.avenue,
    complaint.nearby_landmark,
    complaint.additional_location_details,
  ]
    .filter(Boolean)
    .join(", ") || "Location not provided";

export default function DuplicateReviewScreen() {
  const router = useRouter();
  const { duplicateId } = useLocalSearchParams<{ duplicateId: string }>();
  const [review, setReview] = useState<DuplicateReview | null>(null);
  const [candidate, setCandidate] = useState<Complaint | null>(null);
  const [canonical, setCanonical] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadReview = useCallback(async () => {
    if (!duplicateId) return;
    const { data, error } = await supabase
      .from("duplicate")
      .select("dup_id,comp_id,matched_comp_id,ai_score,ai_reason,admin_status")
      .eq("dup_id", duplicateId)
      .single();

    if (error || !data) {
      setReview(null);
      setLoading(false);
      return;
    }

    const duplicate = data as DuplicateReview;
    const ids = [duplicate.comp_id, duplicate.matched_comp_id].filter(Boolean);
    const { data: complaints, error: complaintsError } = await supabase
      .from("complaints")
      .select(
        "comp_id,title,description,category,status,house,road,avenue,nearby_landmark,additional_location_details,timestamp,evidence(img_url)",
      )
      .in("comp_id", ids);

    if (complaintsError) {
      Alert.alert("Unable to load complaints", complaintsError.message);
    }

    const rows = (complaints ?? []) as Array<
      Complaint & { evidence?: Array<{ img_url: string }> }
    >;
    const mapComplaint = (id: string | null) => {
      const row = rows.find((item) => item.comp_id === id);
      return row
        ? {
            ...row,
            images: (row.evidence ?? []).map((item) => item.img_url),
          }
        : null;
    };

    setReview(duplicate);
    setCandidate(mapComplaint(duplicate.comp_id));
    setCanonical(mapComplaint(duplicate.matched_comp_id));
    setLoading(false);
  }, [duplicateId]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      void loadReview();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [loadReview]);

  const handleAccept = async () => {
    if (!review) return;

    const approved = await confirmAction(
      "Are you sure you want to accept this duplicate match? The newly submitted complaint will be deleted, and the resident will be directed to the existing complaint.",
      undefined,
      "Accept duplicate complaint?",
    );
    if (!approved) return;

    setSaving(true);
    try {
      await confirmDuplicate(review.dup_id);
      setReview((current) =>
        current ? { ...current, admin_status: "confirmed" } : current,
      );
      Alert.alert(
        "Duplicate accepted",
        "The newly submitted complaint was deleted because it matched the existing complaint.",
      );
    } catch (error) {
      Alert.alert(
        "Could not accept duplicate",
        error instanceof Error ? error.message : "Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleReject = async () => {
    if (!review) return;

    const approved = await confirmAction(
      "Are you sure you want to reject this duplicate match? The submitted complaint will be kept as a separate complaint and moved to All Complaints.",
      undefined,
      "Reject duplicate match?",
    );
    if (!approved) return;

    setSaving(true);
    try {
      await rejectDuplicate(review.dup_id);
      setReview((current) =>
        current ? { ...current, admin_status: "rejected" } : current,
      );
      Alert.alert(
        "Duplicate rejected",
        "The complaint was kept and moved to All Complaints for normal processing.",
      );
    } catch (error) {
      Alert.alert(
        "Could not reject duplicate",
        error instanceof Error ? error.message : "Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#23435D" />
        <Text style={styles.loadingText}>Loading duplicate comparison...</Text>
      </View>
    );
  }

  if (!review || !candidate || !canonical) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={44} color="#B42318" />
        <Text style={styles.emptyTitle}>Duplicate review unavailable</Text>
        <Text style={styles.emptyText}>
          One of the complaint records may have been removed.
        </Text>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <View style={styles.headingRow}>
        <View style={styles.headingCopy}>
          <Text style={styles.eyebrow}>AI DUPLICATE REVIEW</Text>
          <Text style={styles.title}>Compare complaints</Text>
          <Text style={styles.subtitle}>
            Review the AI match before deciding what happens to the submitted
            complaint.
          </Text>
        </View>
        <View style={styles.scoreBadge}>
          <Text style={styles.scoreValue}>{Math.round(review.ai_score)}%</Text>
          <Text style={styles.scoreLabel}>match</Text>
        </View>
      </View>

      <View style={styles.aiCard}>
        <View style={styles.aiIcon}>
          <Ionicons name="sparkles-outline" size={20} color="#23435D" />
        </View>
        <View style={styles.aiCopy}>
          <Text style={styles.aiTitle}>Why AI flagged this</Text>
          <Text style={styles.aiReason}>
            {review.ai_reason ||
              "The complaints appear to describe the same issue and location."}
          </Text>
          <Pressable
            style={styles.aiLink}
            onPress={() =>
              router.push(`/(admin)/complaints/${canonical.comp_id}`)
            }
          >
            <Ionicons name="open-outline" size={14} color="#23435D" />
            <Text style={styles.aiLinkText}>View existing complaint</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.compareRow}>
        <ComplaintPanel
          title="Submitted complaint"
          complaint={candidate}
          accent="#C67B00"
        />
        <ComplaintPanel
          title="Existing complaint"
          complaint={canonical}
          accent="#23435D"
        />
      </View>

      {review.admin_status === "pending" ? (
        <View style={styles.actionsCard}>
          <Text style={styles.actionTitle}>Review decision</Text>
          <Text style={styles.actionHint}>
            Accept deletes the newly submitted copy. Reject keeps it as a separate
            complaint and moves it to All Complaints.
          </Text>
          <View style={styles.actions}>
            <Pressable
              disabled={saving}
              style={[styles.actionButton, styles.rejectButton, saving && styles.disabledButton]}
              onPress={handleReject}
            >
              <Ionicons name="close-circle-outline" size={19} color="#B42318" />
              <Text style={styles.rejectText}>
                {saving ? "Working..." : "Reject as duplicate"}
              </Text>
            </Pressable>
            <Pressable
              disabled={saving}
              style={[styles.actionButton, styles.acceptButton, saving && styles.disabledButton]}
              onPress={handleAccept}
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={19}
                color="#FFFFFF"
              />
              <Text style={styles.acceptText}>
                {saving ? "Working..." : "Accept and delete"}
              </Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <View style={styles.decisionCard}>
          <Ionicons
            name={review.admin_status === "confirmed" ? "checkmark-circle" : "arrow-forward-circle"}
            size={24}
            color={review.admin_status === "confirmed" ? "#027A48" : "#23435D"}
          />
          <View style={styles.decisionCopy}>
            <Text style={styles.decisionTitle}>Decision recorded</Text>
            <Text style={styles.decisionText}>
              {review.admin_status === "confirmed"
                ? "The duplicate was accepted and the submitted copy was removed."
                : "The duplicate match was rejected and the complaint will continue separately."}
            </Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

function ComplaintPanel({
  title,
  complaint,
  accent,
}: {
  title: string;
  complaint: Complaint;
  accent: string;
}) {
  return (
    <View style={styles.complaintPanel}>
      <View style={styles.panelHeading}>
        <View style={[styles.panelDot, { backgroundColor: accent }]} />
        <Text style={styles.panelTitle}>{title}</Text>
      </View>
      <Text style={styles.complaintTitle}>{complaint.title}</Text>
      <Text style={styles.category}>
        {complaint.category} · {complaint.status}
      </Text>
      <Text style={styles.description}>{complaint.description}</Text>
      <View style={styles.detailRow}>
        <Ionicons name="location-outline" size={15} color="#667085" />
        <Text style={styles.detailText}>{locationText(complaint)}</Text>
      </View>
      {complaint.images.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.imageStrip}
        >
          {complaint.images.slice(0, 3).map((image) => (
            <Image key={image} source={{ uri: image }} style={styles.image} />
          ))}
        </ScrollView>
      ) : (
        <Text style={styles.noImage}>No evidence image attached</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#F7F8FA" },
  content: { padding: 20, gap: 16, paddingBottom: 40 },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#F7F8FA",
  },
  loadingText: { marginTop: 12, color: "#667085", fontFamily: "System" },
  headingRow: { flexDirection: "row", alignItems: "flex-start", gap: 16 },
  headingCopy: { flex: 1 },
  eyebrow: {
    color: "#B9854B",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    fontFamily: "System",
  },
  title: {
    color: "#23435D",
    fontSize: 28,
    fontWeight: "800",
    marginTop: 4,
    fontFamily: "System",
  },
  subtitle: {
    color: "#667085",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
    fontFamily: "System",
  },
  scoreBadge: {
    backgroundColor: "#EAF8F1",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: "center",
  },
  scoreValue: {
    color: "#16845B",
    fontSize: 22,
    fontWeight: "800",
    fontFamily: "System",
  },
  scoreLabel: {
    color: "#16845B",
    fontSize: 10,
    fontWeight: "700",
    fontFamily: "System",
  },
  aiCard: {
    flexDirection: "row",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#EAF0F6",
    borderWidth: 1,
    borderColor: "#D7E2EC",
  },
  aiIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  aiCopy: { flex: 1 },
  aiTitle: {
    color: "#23435D",
    fontWeight: "800",
    fontSize: 14,
    fontFamily: "System",
  },
  aiReason: {
    color: "#52606D",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 3,
    fontFamily: "System",
  },
  aiLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    marginTop: 9,
    paddingVertical: 2,
  },
  aiLinkText: {
    color: "#23435D",
    fontSize: 12,
    fontWeight: "800",
    fontFamily: "System",
    textDecorationLine: "underline",
  },
  compareRow: { flexDirection: "row", gap: 12 },
  complaintPanel: {
    flex: 1,
    minWidth: 0,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E5EAF0",
  },
  panelHeading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 12,
  },
  panelDot: { width: 9, height: 9, borderRadius: 5 },
  panelTitle: {
    color: "#667085",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    fontFamily: "System",
  },
  complaintTitle: {
    color: "#1F2937",
    fontSize: 16,
    fontWeight: "800",
    lineHeight: 21,
    fontFamily: "System",
  },
  category: {
    color: "#23435D",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 5,
    fontFamily: "System",
  },
  description: {
    color: "#52606D",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 10,
    fontFamily: "System",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 5,
    marginTop: 12,
  },
  detailText: {
    flex: 1,
    color: "#667085",
    fontSize: 11,
    lineHeight: 16,
    fontFamily: "System",
  },
  imageStrip: { marginTop: 12 },
  image: {
    width: 76,
    height: 76,
    borderRadius: 8,
    marginRight: 7,
    backgroundColor: "#EEF2F6",
  },
  noImage: {
    color: "#98A2B3",
    fontSize: 11,
    marginTop: 12,
    fontFamily: "System",
  },
  actionsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5EAF0",
  },
  actionTitle: {
    color: "#1F2937",
    fontSize: 16,
    fontWeight: "800",
    fontFamily: "System",
  },
  actionHint: {
    color: "#667085",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 5,
    fontFamily: "System",
  },
  actions: { flexDirection: "row", gap: 10, marginTop: 15 },
  actionButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingHorizontal: 8,
  },
  rejectButton: {
    backgroundColor: "#FEF3F2",
    borderWidth: 1,
    borderColor: "#FDA29B",
  },
  acceptButton: { backgroundColor: "#23435D" },
  disabledButton: { opacity: 0.55 },
  rejectText: {
    color: "#B42318",
    fontSize: 12,
    fontWeight: "800",
    fontFamily: "System",
  },
  acceptText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
    fontFamily: "System",
  },
  decisionCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#D0D5DD",
    backgroundColor: "#FFFFFF",
  },
  decisionCopy: { flex: 1 },
  decisionTitle: {
    color: "#1F2937",
    fontSize: 15,
    fontWeight: "800",
    fontFamily: "System",
  },
  decisionText: {
    color: "#667085",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 3,
    fontFamily: "System",
  },
  emptyTitle: {
    color: "#1F2937",
    fontSize: 18,
    fontWeight: "800",
    marginTop: 12,
    fontFamily: "System",
  },
  emptyText: {
    color: "#667085",
    fontSize: 13,
    textAlign: "center",
    marginTop: 5,
    fontFamily: "System",
  },
  backButton: {
    marginTop: 18,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#23435D",
  },
  backButtonText: { color: "#FFFFFF", fontWeight: "700", fontFamily: "System" },
});
