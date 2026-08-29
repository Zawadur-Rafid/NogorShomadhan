import Ionicons from "@expo/vector-icons/Ionicons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import AdminBottomNav from "@/components/AdminBottomNav";
import { supabase } from "@/lib/supabase";

const statusTheme = {
  UNVERIFIED: {
    color: "#7A3E02",
    background: "#FFF1E8",
    icon: "help-circle-outline",
  },
  PENDING: { color: "#B54708", background: "#FFF4E5", icon: "time-outline" },
  "IN PROGRESS": {
    color: "#1D4ED8",
    background: "#EAF3FF",
    icon: "construct-outline",
  },
  RESOLVED: {
    color: "#027A48",
    background: "#EAF8EF",
    icon: "checkmark-circle-outline",
  },
} as const;

type DbComplaintDetails = {
  compId: string;
  accId: string | null;
  title: string;
  description: string;
  category: string;
  status: "UNVERIFIED" | "PENDING" | "IN PROGRESS" | "RESOLVED";
  house?: string;
  road?: string;
  avenue?: string;
  nearby_landmark?: string;
  additional_location_details?: string;
  timestamp: string | null;
  urgency: number;
  images: string[];
  reporter: {
    fullName: string;
    email: string;
    nid: string;
    phoneNum: string;
    houseNum: string;
    roadNumber: string;
    avenueNum: string;
    username: string;
  } | null;
};

function mapStatus(
  rawStatus: string | undefined,
): DbComplaintDetails["status"] {
  if (!rawStatus) return "UNVERIFIED";

  if (rawStatus === "resolved") return "RESOLVED";
  if (rawStatus === "pending") return "PENDING";
  if (rawStatus === "in progress") return "IN PROGRESS";

  return "UNVERIFIED";
}

function categoryToLabel(category: string): string {
  return category || "Community maintenance";
}

export default function AdminComplaintDetails() {
  const router = useRouter();
  const { complaintId } = useLocalSearchParams<{ complaintId?: string }>();
  const complaintIdValue = complaintId ?? "";

  const [dbComplaint, setDbComplaint] = useState<DbComplaintDetails | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const fetchComplaint = async () => {
      if (!complaintIdValue) return;

      setLoading(true);
      setError(null);

      const { data: complaintData, error: complaintError } = await supabase
        .from("complaints")
        .select(
          "comp_id,acc_id,title,description,category,status,house,road,avenue,nearby_landmark,additional_location_details,timestamp,urgency",
        )
        .eq("comp_id", complaintIdValue)
        .single();

      if (complaintError || !complaintData) {
        setError(complaintError?.message ?? "Complaint not found.");
        setLoading(false);
        return;
      }

      const complaintRow = complaintData as {
        comp_id: string;
        acc_id: string | null;
        title: string;
        description: string;
        category: string;
        status: string;
        house?: string;
        road?: string;
        avenue?: string;
        nearby_landmark?: string;
        additional_location_details?: string;
        timestamp: string | null;
        urgency: number;
      };

      const [
        { data: evidenceData, error: evidenceError },
        { data: accountData, error: accountError },
      ] = await Promise.all([
        supabase
          .from("evidence")
          .select("img_url")
          .eq("comp_id", complaintRow.comp_id),
        complaintRow.acc_id
          ? supabase
              .from("account")
              .select(
                "full_name,email,nid,phone_num,house_num,road_number,avenue_num,username",
              )
              .eq("acc_id", complaintRow.acc_id)
              .single()
          : Promise.resolve({ data: null, error: null }),
      ]);

      if (evidenceError) {
        setError(evidenceError.message);
        setLoading(false);
        return;
      }

      if (accountError) {
        setError(accountError.message);
        setLoading(false);
        return;
      }

      setDbComplaint({
        compId: complaintRow.comp_id,
        accId: complaintRow.acc_id,
        title: complaintRow.title,
        description: complaintRow.description,
        category: complaintRow.category,
        status: mapStatus(complaintRow.status),
        house: complaintRow.house,
        road: complaintRow.road,
        avenue: complaintRow.avenue,
        nearby_landmark: complaintRow.nearby_landmark,
        additional_location_details: complaintRow.additional_location_details,
        timestamp: complaintRow.timestamp,
        urgency: complaintRow.urgency,
        images: ((evidenceData ?? []) as Array<{ img_url: string }>).map(
          (item) => item.img_url,
        ),
        reporter: accountData
          ? {
              fullName: (accountData as any).full_name ?? "",
              email: (accountData as any).email ?? "",
              nid: (accountData as any).nid ?? "",
              phoneNum: (accountData as any).phone_num ?? "",
              houseNum: (accountData as any).house_num ?? "",
              roadNumber: (accountData as any).road_number ?? "",
              avenueNum: (accountData as any).avenue_num ?? "",
              username: (accountData as any).username ?? "",
            }
          : null,
      });
      setLoading(false);
    };

    void fetchComplaint();
  }, [complaintIdValue]);

  const complaint = dbComplaint
    ? {
        id: dbComplaint.compId,
        status: dbComplaint.status,
        title: dbComplaint.title,
        description: dbComplaint.description,
        date: dbComplaint.timestamp
          ? new Date(dbComplaint.timestamp).toLocaleString()
          : "Unknown date",
        location: [dbComplaint.house, dbComplaint.road, dbComplaint.avenue, dbComplaint.nearby_landmark, dbComplaint.additional_location_details].filter(Boolean).join(', ') || 'Location not provided',
        category: dbComplaint.category,
        icon: dbComplaint.category.toLowerCase(),
        image: dbComplaint.images[0],
        images: dbComplaint.images,
        evidence:
          dbComplaint.images.length > 0
            ? "Resident uploaded photo evidence"
            : "No image evidence uploaded",
      }
    : null;

  if (loading) {
    return (
      <View style={styles.page}>
        <View style={styles.empty}>
          <Ionicons name="time-outline" size={42} color="#98A2B3" />
          <Text style={styles.emptyTitle}>Loading complaint details...</Text>
        </View>
        <AdminBottomNav activeRoute="complaints" />
      </View>
    );
  }

  if (!complaint) {
    return (
      <View style={styles.page}>
        <View style={styles.empty}>
          <Ionicons name="document-text-outline" size={42} color="#98A2B3" />
          <Text style={styles.emptyTitle}>Complaint not found</Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>Back to complaints</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.page}>
        <View style={styles.empty}>
          <Ionicons name="alert-circle-outline" size={42} color="#B42318" />
          <Text style={styles.emptyTitle}>Failed to load complaint</Text>
          <Text style={{ color: "#B42318", textAlign: "center" }}>{error}</Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>Back to complaints</Text>
          </TouchableOpacity>
        </View>
        <AdminBottomNav activeRoute="complaints" />
      </View>
    );
  }

  const theme =
    statusTheme[complaint.status as keyof typeof statusTheme] ||
    statusTheme.PENDING;
  const category = dbComplaint
    ? categoryToLabel(dbComplaint.category)
    : complaint.icon.includes("water")
      ? "Water supply"
      : complaint.icon.includes("trash")
        ? "Waste management"
        : complaint.icon.includes("bulb")
          ? "Street lighting"
          : "Community maintenance";

  const imageList =
    complaint.images && complaint.images.length > 0
      ? complaint.images
      : complaint.image
        ? [complaint.image]
        : [];

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) =>
      prev > 0 ? prev - 1 : imageList.length - 1,
    );
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) =>
      prev < imageList.length - 1 ? prev + 1 : 0,
    );
  };

  return (
    <View style={styles.page}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
          <Ionicons name="arrow-back" size={18} color="#23435D" />
          <Text style={styles.backLinkText}>All complaints</Text>
        </TouchableOpacity>

        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: theme.background },
              ]}
            >
              <Ionicons name={theme.icon} size={15} color={theme.color} />
              <Text style={[styles.statusText, { color: theme.color }]}>
                {complaint.status}
              </Text>
            </View>
            <Text style={styles.complaintId}>{complaintId}</Text>
          </View>
          <Text style={styles.title}>{complaint.title}</Text>
          <Text style={styles.description}>{complaint.description}</Text>
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Complaint information</Text>
          <View style={styles.detailsGrid}>
            <Detail icon="layers-outline" label="Category" value={category} />
            <Detail
              icon="location-outline"
              label="Location"
              value={complaint.location}
            />
            <Detail
              icon="calendar-outline"
              label="Submitted"
              value={complaint.date}
            />

          </View>
        </View>

        {dbComplaint?.reporter ? (
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Reporter information</Text>
            <View style={styles.detailsGrid}>
              <Detail
                icon="person-outline"
                label="Full Name"
                value={dbComplaint.reporter.fullName || "-"}
              />
              <Detail
                icon="card-outline"
                label="NID"
                value={dbComplaint.reporter.nid || "-"}
              />
              <Detail
                icon="mail-outline"
                label="Email"
                value={dbComplaint.reporter.email || "-"}
              />
              <Detail
                icon="call-outline"
                label="Phone"
                value={dbComplaint.reporter.phoneNum || "-"}
              />
              <Detail
                icon="home-outline"
                label="House Number"
                value={dbComplaint.reporter.houseNum || "-"}
              />
              <Detail
                icon="map-outline"
                label="Road Number"
                value={dbComplaint.reporter.roadNumber || "-"}
              />
              <Detail
                icon="business-outline"
                label="Avenue Number"
                value={dbComplaint.reporter.avenueNum || "-"}
              />
              <Detail
                icon="at-outline"
                label="Username"
                value={dbComplaint.reporter.username || "-"}
              />
            </View>
          </View>
        ) : null}

        {/* Resident Evidence Panel with Image Navigation */}
        <View style={styles.panel}>
          <View style={styles.evidencePanelHeader}>
            <Text style={styles.panelTitle}>Resident evidence</Text>
            {imageList.length > 0 && (
              <Text style={styles.photoCountText}>
                {imageList.length} {imageList.length === 1 ? "Photo" : "Photos"}
              </Text>
            )}
          </View>

          <View style={styles.imageContainer}>
            {imageList.length > 0 ? (
              <Image
                source={{ uri: imageList[currentImageIndex] }}
                style={styles.evidence}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.noImagePlaceholder}>
                <Ionicons name="image-outline" size={40} color="#98A2B3" />
                <Text style={styles.noImageText}>
                  No evidence photo uploaded
                </Text>
              </View>
            )}

            {/* Previous / Next Overlay Navigation Buttons */}
            {imageList.length > 1 && (
              <>
                <TouchableOpacity
                  style={styles.navButtonLeft}
                  onPress={handlePrevImage}
                  activeOpacity={0.8}
                >
                  <Ionicons name="chevron-back" size={26} color="#FFFFFF" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.navButtonRight}
                  onPress={handleNextImage}
                  activeOpacity={0.8}
                >
                  <Ionicons name="chevron-forward" size={26} color="#FFFFFF" />
                </TouchableOpacity>

                {/* Counter Badge */}
                <View style={styles.counterBadge}>
                  <Ionicons name="images-outline" size={13} color="#FFFFFF" />
                  <Text style={styles.counterBadgeText}>
                    {currentImageIndex + 1} / {imageList.length}
                  </Text>
                </View>
              </>
            )}
          </View>

          {/* Horizontal Thumbnails Scrollbar */}
          {imageList.length > 1 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.thumbnailContainer}
            >
              {imageList.map((img, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.thumbnailWrapper,
                    currentImageIndex === idx && styles.activeThumbnailWrapper,
                  ]}
                  onPress={() => setCurrentImageIndex(idx)}
                >
                  <Image source={{ uri: img }} style={styles.thumbnail} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {complaint.evidence && (
            <Text style={styles.evidenceNote}>{complaint.evidence}</Text>
          )}
        </View>



        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Administrative review</Text>
          <Text style={styles.reviewText}>
            This report is visible to administrators for verification,
            assignment, and progress monitoring.
          </Text>
        </View>
      </ScrollView>
      <AdminBottomNav activeRoute="complaints" />
    </View>
  );
}

function Detail({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.detail}>
      <Ionicons name={icon} size={18} color="#3B82F6" />
      <View style={styles.detailCopy}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#F7F8FA" },
  content: {
    width: "100%",
    maxWidth: 920,
    alignSelf: "center",
    padding: 16,
    paddingBottom: 102,
    gap: 15,
  },
  backLink: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingVertical: 5,
  },
  backLinkText: { color: "#23435D", fontSize: 13, fontWeight: "600" },
  hero: { padding: 20, borderRadius: 16, backgroundColor: "#FFFFFF" },
  heroTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 14,
  },
  statusText: { fontSize: 12, fontWeight: "600" },
  complaintId: { color: "#3B82F6", fontSize: 12, fontWeight: "600" },
  title: {
    marginTop: 13,
    color: "#00475E",
    fontSize: 32,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  description: { marginTop: 7, color: "#40484D", fontSize: 14, lineHeight: 20 },
  panel: { padding: 18, borderRadius: 16, backgroundColor: "#FFFFFF" },
  panelTitle: { color: "#191C1E", fontSize: 20, fontWeight: "600" },
  evidencePanelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  photoCountText: { fontSize: 13, fontWeight: "600", color: "#3B82F6" },
  detailsGrid: { marginTop: 16, gap: 15 },
  detail: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  detailCopy: { flex: 1 },
  detailLabel: { color: "#70787D", fontSize: 12, fontWeight: "600" },
  detailValue: { marginTop: 2, color: "#191C1E", fontSize: 14 },
  imageContainer: {
    position: "relative",
    width: "100%",
    height: 250,
    marginTop: 14,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#EAECF0",
  },
  evidence: { width: "100%", height: "100%" },
  noImagePlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  noImageText: { color: "#70787D", fontSize: 14 },
  navButtonLeft: {
    position: "absolute",
    left: 10,
    top: "50%",
    marginTop: -18,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  navButtonRight: {
    position: "absolute",
    right: 10,
    top: "50%",
    marginTop: -18,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  counterBadge: {
    position: "absolute",
    bottom: 10,
    left: 10,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  counterBadgeText: { color: "#FFFFFF", fontSize: 12, fontWeight: "600" },
  thumbnailContainer: { flexDirection: "row", marginTop: 12 },
  thumbnailWrapper: {
    width: 56,
    height: 56,
    borderRadius: 8,
    overflow: "hidden",
    marginRight: 8,
    borderWidth: 2,
    borderColor: "transparent",
  },
  activeThumbnailWrapper: { borderColor: "#3B82F6" },
  thumbnail: { width: "100%", height: "100%" },
  evidenceNote: {
    marginTop: 10,
    color: "#40484D",
    fontSize: 13,
    fontStyle: "italic",
  },
  mapSubtitle: { marginTop: 4, color: "#40484D", fontSize: 14 },
  map: { height: 250, marginTop: 14, borderRadius: 12, overflow: "hidden" },
  reviewText: { marginTop: 9, color: "#40484D", fontSize: 14, lineHeight: 20 },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 24,
  },
  emptyTitle: { color: "#191C1E", fontSize: 20, fontWeight: "600" },
  backButton: {
    marginTop: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#EAF3FF",
  },
  backButtonText: { color: "#23435D", fontWeight: "600" },
});
