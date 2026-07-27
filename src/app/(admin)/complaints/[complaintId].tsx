import React, { useState } from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import AdminBottomNav from "@/components/AdminBottomNav";
import MapViewComponent from "@/components/MapView";
import { dummyComplaints } from "@/components/store/store_complaint";

const statusTheme = {
  PENDING: { color: "#B54708", background: "#FFF4E5", icon: "time-outline" },
  "IN PROGRESS": { color: "#1D4ED8", background: "#EAF3FF", icon: "construct-outline" },
  RESOLVED: { color: "#027A48", background: "#EAF8EF", icon: "checkmark-circle-outline" },
} as const;

export default function AdminComplaintDetails() {
  const router = useRouter();
  const { complaintId } = useLocalSearchParams<{ complaintId?: string }>();
  const recordId = complaintId?.replace("CMP-", "").replace(/^0+/, "") ?? "";
  const complaint = dummyComplaints.find((item) => item.id === recordId);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (!complaint) {
    return (
      <View style={styles.page}>
        <View style={styles.empty}>
          <Ionicons name="document-text-outline" size={42} color="#98A2B3" />
          <Text style={styles.emptyTitle}>Complaint not found</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>Back to complaints</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const theme = statusTheme[complaint.status as keyof typeof statusTheme] || statusTheme.PENDING;
  const category = complaint.icon.includes("water")
    ? "Water supply"
    : complaint.icon.includes("trash")
      ? "Waste management"
      : complaint.icon.includes("bulb")
        ? "Street lighting"
        : "Community maintenance";

  const imageList = complaint.images && complaint.images.length > 0
    ? complaint.images
    : (complaint.image ? [complaint.image] : []);

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : imageList.length - 1));
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev < imageList.length - 1 ? prev + 1 : 0));
  };

  return (
    <View style={styles.page}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
          <Ionicons name="arrow-back" size={18} color="#23435D" />
          <Text style={styles.backLinkText}>All complaints</Text>
        </TouchableOpacity>

        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <View style={[styles.statusBadge, { backgroundColor: theme.background }]}>
              <Ionicons name={theme.icon} size={15} color={theme.color} />
              <Text style={[styles.statusText, { color: theme.color }]}>{complaint.status}</Text>
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
            <Detail icon="location-outline" label="Location" value={complaint.location} />
            <Detail icon="calendar-outline" label="Submitted" value={complaint.date} />
            <Detail icon="navigate-outline" label="Coordinates" value={`${complaint.lat.toFixed(4)}, ${complaint.lng.toFixed(4)}`} />
          </View>
        </View>

        {/* Resident Evidence Panel with Image Navigation */}
        <View style={styles.panel}>
          <View style={styles.evidencePanelHeader}>
            <Text style={styles.panelTitle}>Resident evidence</Text>
            {imageList.length > 0 && (
              <Text style={styles.photoCountText}>
                {imageList.length} {imageList.length === 1 ? 'Photo' : 'Photos'}
              </Text>
            )}
          </View>

          <View style={styles.imageContainer}>
            {imageList.length > 0 ? (
              <Image source={{ uri: imageList[currentImageIndex] }} style={styles.evidence} resizeMode="cover" />
            ) : (
              <View style={styles.noImagePlaceholder}>
                <Ionicons name="image-outline" size={40} color="#98A2B3" />
                <Text style={styles.noImageText}>No evidence photo uploaded</Text>
              </View>
            )}

            {/* Previous / Next Overlay Navigation Buttons */}
            {imageList.length > 1 && (
              <>
                <TouchableOpacity style={styles.navButtonLeft} onPress={handlePrevImage} activeOpacity={0.8}>
                  <Ionicons name="chevron-back" size={26} color="#FFFFFF" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.navButtonRight} onPress={handleNextImage} activeOpacity={0.8}>
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
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbnailContainer}>
              {imageList.map((img, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[styles.thumbnailWrapper, currentImageIndex === idx && styles.activeThumbnailWrapper]}
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
          <Text style={styles.panelTitle}>Map location</Text>
          <Text style={styles.mapSubtitle}>{complaint.location}</Text>
          <View style={styles.map}>
            <MapViewComponent locations={[complaint]} />
          </View>
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Administrative review</Text>
          <Text style={styles.reviewText}>
            This report is visible to administrators for verification, assignment, and progress monitoring.
          </Text>
        </View>
      </ScrollView>
      <AdminBottomNav activeRoute="complaints" />
    </View>
  );
}

function Detail({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
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
  content: { width: "100%", maxWidth: 920, alignSelf: "center", padding: 16, paddingBottom: 102, gap: 15 },
  backLink: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 7, paddingVertical: 5 },
  backLinkText: { color: "#23435D", fontSize: 13, fontWeight: "600" },
  hero: { padding: 20, borderRadius: 16, backgroundColor: "#FFFFFF" },
  heroTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 9, paddingVertical: 6, borderRadius: 14 },
  statusText: { fontSize: 12, fontWeight: "600" },
  complaintId: { color: "#3B82F6", fontSize: 12, fontWeight: "600" },
  title: { marginTop: 13, color: "#00475E", fontSize: 32, fontWeight: "700", letterSpacing: -0.5 },
  description: { marginTop: 7, color: "#40484D", fontSize: 14, lineHeight: 20 },
  panel: { padding: 18, borderRadius: 16, backgroundColor: "#FFFFFF" },
  panelTitle: { color: "#191C1E", fontSize: 20, fontWeight: "600" },
  evidencePanelHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  photoCountText: { fontSize: 13, fontWeight: "600", color: "#3B82F6" },
  detailsGrid: { marginTop: 16, gap: 15 },
  detail: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  detailCopy: { flex: 1 },
  detailLabel: { color: "#70787D", fontSize: 12, fontWeight: "600" },
  detailValue: { marginTop: 2, color: "#191C1E", fontSize: 14 },
  imageContainer: { position: "relative", width: "100%", height: 250, marginTop: 14, borderRadius: 12, overflow: "hidden", backgroundColor: "#EAECF0" },
  evidence: { width: "100%", height: "100%" },
  noImagePlaceholder: { flex: 1, justifyContent: "center", alignItems: "center", gap: 8 },
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
  thumbnailWrapper: { width: 56, height: 56, borderRadius: 8, overflow: "hidden", marginRight: 8, borderWidth: 2, borderColor: "transparent" },
  activeThumbnailWrapper: { borderColor: "#3B82F6" },
  thumbnail: { width: "100%", height: "100%" },
  evidenceNote: { marginTop: 10, color: "#40484D", fontSize: 13, fontStyle: "italic" },
  mapSubtitle: { marginTop: 4, color: "#40484D", fontSize: 14 },
  map: { height: 250, marginTop: 14, borderRadius: 12, overflow: "hidden" },
  reviewText: { marginTop: 9, color: "#40484D", fontSize: 14, lineHeight: 20 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10, padding: 24 },
  emptyTitle: { color: "#191C1E", fontSize: 20, fontWeight: "600" },
  backButton: { marginTop: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8, backgroundColor: "#EAF3FF" },
  backButtonText: { color: "#23435D", fontWeight: "600" },
});
