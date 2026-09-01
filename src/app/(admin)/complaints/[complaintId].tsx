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
  contractors: Array<{
    eventId: string;
    name: string;
    phone: string;
    reason?: string | null;
    changedAt: string;
    isCurrent: boolean;
  }>;
  workUpdates: Array<{
    updateId: string;
    type: string;
    note?: string | null;
    budget?: number | string | null;
    deadline?: string | null;
    progressPercent?: number | null;
    createdAt: string;
    images: string[];
  }>;
  resolution: {
    resolvedAt: string;
    resolutionNote?: string | null;
    finalBudget?: number | string | null;
    finalDeadline?: string | null;
  } | null;
  duplicatesCount: number;
  statusHistory: Array<{
    historyId: string;
    fromStatus: string;
    toStatus: string;
    changedAt: string;
    note?: string | null;
  }>;
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

function formatCurrency(val: number | string | null | undefined): string {
  if (val === null || val === undefined || val === "") return "-";
  const num = typeof val === "string" ? parseFloat(val) : val;
  if (isNaN(num)) return "-";
  return `৳ ${num.toLocaleString()}`;
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  const parsed = new Date(dateStr);
  if (isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleString();
}

function getWorkTypeBadge(type: string) {
  switch (type) {
    case "start":
      return { label: "Work Started", color: "#1D4ED8", bg: "#EAF3FF" };
    case "progress_update":
      return { label: "Progress Update", color: "#027A48", bg: "#EAF8EF" };
    case "contractor_change":
      return { label: "Contractor Changed", color: "#B54708", bg: "#FFF4E5" };
    case "budget_deadline_change":
      return { label: "Budget / Deadline Updated", color: "#6938EF", bg: "#F4F3FF" };
    case "completion":
      return { label: "Completed", color: "#027A48", bg: "#D1FADF" };
    default:
      return { label: type, color: "#344054", bg: "#F2F4F7" };
  }
}

export default function AdminComplaintDetails() {
  const router = useRouter();
  const { complaintId } = useLocalSearchParams<{ complaintId?: string }>();
  const complaintIdValue = complaintId ?? "";

  const [dbComplaint, setDbComplaint] = useState<DbComplaintDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const fetchComplaint = async () => {
      if (!complaintIdValue) return;

      setLoading(true);
      setError(null);

      // Fetch primary complaint record (only selecting existing columns)
      const { data: complaintData, error: complaintError } = await supabase
        .from("complaints")
        .select(
          "comp_id,acc_id,title,description,category,status,house,road,avenue,nearby_landmark,additional_location_details,timestamp"
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
      };

      // Fetch associated details in parallel
      const [
        { data: evidenceData },
        { data: accountData },
        { data: contractorData },
        { data: workUpdatesData },
        { data: updateEvidenceData },
        { data: resolutionData },
        { data: duplicateData },
        { data: statusHistoryData },
      ] = await Promise.all([
        supabase.from("evidence").select("ev_id, img_url").eq("comp_id", complaintRow.comp_id),
        complaintRow.acc_id
          ? supabase
              .from("account")
              .select("full_name,email,nid,phone_num,house_num,road_number,avenue_num,username")
              .eq("acc_id", complaintRow.acc_id)
              .single()
          : Promise.resolve({ data: null }),
        supabase
          .from("contractor_history")
          .select("contractor_event_id,contractor_name,contractor_phone,change_reason,changed_at,is_current")
          .eq("comp_id", complaintRow.comp_id)
          .order("changed_at", { ascending: false }),
        supabase
          .from("complaint_work_updates")
          .select("update_id,update_type,note,budget,deadline,progress_percent,created_at")
          .eq("comp_id", complaintRow.comp_id)
          .order("created_at", { ascending: false }),
        supabase
          .from("complaint_update_evidence")
          .select("update_id,img_url")
          .eq("comp_id", complaintRow.comp_id),
        supabase
          .from("complaint_resolution")
          .select("resolved_at,resolution_note,final_budget,final_deadline")
          .eq("comp_id", complaintRow.comp_id)
          .maybeSingle(),
        supabase
          .from("duplicate")
          .select("dup_id")
          .eq("comp_id", complaintRow.comp_id),
        supabase
          .from("complaint_status_history")
          .select("history_id,from_status,to_status,changed_at,note")
          .eq("comp_id", complaintRow.comp_id)
          .order("changed_at", { ascending: false }),
      ]);

      // Group update evidence images by update_id
      const updateImagesMap = new Map<string, string[]>();
      for (const row of (updateEvidenceData ?? []) as Array<{ update_id: string; img_url: string }>) {
        const list = updateImagesMap.get(row.update_id) ?? [];
        list.push(row.img_url);
        updateImagesMap.set(row.update_id, list);
      }

      const contractors = ((contractorData ?? []) as Array<{
        contractor_event_id: string;
        contractor_name: string;
        contractor_phone: string;
        change_reason: string | null;
        changed_at: string;
        is_current: boolean;
      }>).map((c) => ({
        eventId: c.contractor_event_id,
        name: c.contractor_name,
        phone: c.contractor_phone,
        reason: c.change_reason,
        changedAt: c.changed_at,
        isCurrent: c.is_current,
      }));

      const workUpdates = ((workUpdatesData ?? []) as Array<{
        update_id: string;
        update_type: string;
        note: string | null;
        budget: number | string | null;
        deadline: string | null;
        progress_percent: number | null;
        created_at: string;
      }>).map((w) => ({
        updateId: w.update_id,
        type: w.update_type,
        note: w.note,
        budget: w.budget,
        deadline: w.deadline,
        progressPercent: w.progress_percent,
        createdAt: w.created_at,
        images: updateImagesMap.get(w.update_id) ?? [],
      }));

      const resolution = resolutionData
        ? {
            resolvedAt: (resolutionData as any).resolved_at,
            resolutionNote: (resolutionData as any).resolution_note,
            finalBudget: (resolutionData as any).final_budget,
            finalDeadline: (resolutionData as any).final_deadline,
          }
        : null;

      const statusHistory = ((statusHistoryData ?? []) as Array<{
        history_id: string;
        from_status: string;
        to_status: string;
        changed_at: string;
        note: string | null;
      }>).map((h) => ({
        historyId: h.history_id,
        fromStatus: h.from_status,
        toStatus: h.to_status,
        changedAt: h.changed_at,
        note: h.note,
      }));

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
        images: ((evidenceData ?? []) as Array<{ img_url: string }>).map((item) => item.img_url),
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
        contractors,
        workUpdates,
        resolution,
        duplicatesCount: (duplicateData ?? []).length,
        statusHistory,
      });

      setLoading(false);
    };

    void fetchComplaint();
  }, [complaintIdValue]);

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

  if (error || !dbComplaint) {
    return (
      <View style={styles.page}>
        <View style={styles.empty}>
          <Ionicons name="alert-circle-outline" size={42} color="#B42318" />
          <Text style={styles.emptyTitle}>Failed to load complaint</Text>
          <Text style={{ color: "#B42318", textAlign: "center" }}>{error ?? "Complaint not found"}</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>Back to complaints</Text>
          </TouchableOpacity>
        </View>
        <AdminBottomNav activeRoute="complaints" />
      </View>
    );
  }

  const theme = statusTheme[dbComplaint.status] || statusTheme.PENDING;
  const imageList = dbComplaint.images;

  // Latest contractor info
  const currentContractor = dbComplaint.contractors.find((c) => c.isCurrent) || dbComplaint.contractors[0];
  const previousContractors = dbComplaint.contractors.filter((c) => !c.isCurrent);

  // Latest progress %
  const latestProgress = dbComplaint.workUpdates.find((w) => w.progressPercent !== null && w.progressPercent !== undefined)?.progressPercent ?? (dbComplaint.status === "RESOLVED" ? 100 : 0);
  const latestBudget = dbComplaint.workUpdates.find((w) => w.budget)?.budget;
  const latestDeadline = dbComplaint.workUpdates.find((w) => w.deadline)?.deadline;

  const fullLocation = [
    dbComplaint.house && `House: ${dbComplaint.house}`,
    dbComplaint.road && `Road: ${dbComplaint.road}`,
    dbComplaint.avenue && `Avenue: ${dbComplaint.avenue}`,
    dbComplaint.nearby_landmark && `Landmark: ${dbComplaint.nearby_landmark}`,
    dbComplaint.additional_location_details,
  ]
    .filter(Boolean)
    .join(", ") || "Location not provided";

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : imageList.length - 1));
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev < imageList.length - 1 ? prev + 1 : 0));
  };

  return (
    <View style={styles.page}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Back Link */}
        <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
          <Ionicons name="arrow-back" size={18} color="#23435D" />
          <Text style={styles.backLinkText}>All complaints</Text>
        </TouchableOpacity>

        {/* Hero Banner */}
        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <View style={[styles.statusBadge, { backgroundColor: theme.background }]}>
              <Ionicons name={theme.icon} size={15} color={theme.color} />
              <Text style={[styles.statusText, { color: theme.color }]}>{dbComplaint.status}</Text>
            </View>
            <Text style={styles.complaintId}>#{dbComplaint.compId.slice(0, 8)}</Text>
          </View>
          <Text style={styles.title}>{dbComplaint.title}</Text>
          <Text style={styles.description}>{dbComplaint.description}</Text>
        </View>

        {/* Complaint Information Panel */}
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Complaint information</Text>
          <View style={styles.detailsGrid}>
            <Detail icon="layers-outline" label="Category" value={dbComplaint.category} />
            <Detail icon="location-outline" label="Location" value={fullLocation} />
            <Detail icon="calendar-outline" label="Submitted" value={formatDate(dbComplaint.timestamp)} />
            {dbComplaint.duplicatesCount > 0 ? (
              <Detail icon="copy-outline" label="Duplicate Reports" value={`${dbComplaint.duplicatesCount} resident duplicate(s) linked`} />
            ) : null}
          </View>
        </View>

        {/* Reporter Information Panel */}
        {dbComplaint.reporter ? (
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Reporter information</Text>
            <View style={styles.detailsGrid}>
              <Detail icon="person-outline" label="Full Name" value={dbComplaint.reporter.fullName || "-"} />
              <Detail icon="card-outline" label="NID" value={dbComplaint.reporter.nid || "-"} />
              <Detail icon="mail-outline" label="Email" value={dbComplaint.reporter.email || "-"} />
              <Detail icon="call-outline" label="Phone" value={dbComplaint.reporter.phoneNum || "-"} />
              <Detail icon="home-outline" label="House Number" value={dbComplaint.reporter.houseNum || "-"} />
              <Detail icon="map-outline" label="Road Number" value={dbComplaint.reporter.roadNumber || "-"} />
              <Detail icon="business-outline" label="Avenue Number" value={dbComplaint.reporter.avenueNum || "-"} />
              <Detail icon="at-outline" label="Username" value={dbComplaint.reporter.username || "-"} />
            </View>
          </View>
        ) : null}

        {/* Track Team / Contractor Information Panel */}
        <View style={styles.panel}>
          <View style={styles.panelHeaderRow}>
            <Text style={styles.panelTitle}>Track Team / Contractor</Text>
            <Ionicons name="people-outline" size={20} color="#00475E" />
          </View>

          {currentContractor ? (
            <View style={styles.activeContractorBox}>
              <View style={styles.contractorBadgeRow}>
                <View style={styles.currentTag}>
                  <Text style={styles.currentTagText}>ACTIVE CONTRACTOR</Text>
                </View>
                <Text style={styles.contractorDateText}>Assigned: {formatDate(currentContractor.changedAt)}</Text>
              </View>

              <View style={styles.contractorMainInfo}>
                <View style={styles.contractorAvatarCircle}>
                  <Ionicons name="person" size={22} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.contractorNameText}>{currentContractor.name}</Text>
                  <Text style={styles.contractorPhoneText}>{currentContractor.phone}</Text>
                </View>
              </View>

              {currentContractor.reason ? (
                <View style={styles.reasonBox}>
                  <Text style={styles.reasonLabel}>Assignment Note:</Text>
                  <Text style={styles.reasonValue}>{currentContractor.reason}</Text>
                </View>
              ) : null}
            </View>
          ) : (
            <View style={styles.noContractorBox}>
              <Ionicons name="person-remove-outline" size={32} color="#98A2B3" />
              <Text style={styles.noContractorTitle}>No Contractor Assigned</Text>
              <Text style={styles.noContractorSub}>The community authority has not assigned a contractor team to this complaint yet.</Text>
            </View>
          )}

          {/* Previous Contractor History */}
          {previousContractors.length > 0 ? (
            <View style={styles.historySection}>
              <Text style={styles.historySectionTitle}>Contractor Change History ({previousContractors.length})</Text>
              {previousContractors.map((c, idx) => (
                <View key={c.eventId || idx} style={styles.historyRow}>
                  <View style={styles.historyDot} />
                  <View style={{ flex: 1 }}>
                    <View style={styles.historyHeader}>
                      <Text style={styles.historyContractorName}>{c.name} ({c.phone})</Text>
                      <Text style={styles.historyDate}>{formatDate(c.changedAt)}</Text>
                    </View>
                    {c.reason ? <Text style={styles.historyReason}>Reason: {c.reason}</Text> : null}
                  </View>
                </View>
              ))}
            </View>
          ) : null}
        </View>

        {/* Work Progress & Authority Updates Panel */}
        <View style={styles.panel}>
          <View style={styles.panelHeaderRow}>
            <Text style={styles.panelTitle}>Work Progress & Authority Updates</Text>
            <Ionicons name="analytics-outline" size={20} color="#00475E" />
          </View>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Overall Completion</Text>
              <Text style={styles.progressPercentage}>{latestProgress}%</Text>
            </View>
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: `${Math.min(100, Math.max(0, latestProgress))}%` }]} />
            </View>
          </View>

          {/* Budget & Target Deadline Summary */}
          <View style={styles.summaryGrid}>
            <View style={styles.summaryCard}>
              <Ionicons name="cash-outline" size={18} color="#1D4ED8" />
              <View style={{ flex: 1 }}>
                <Text style={styles.summaryLabel}>Estimated Budget</Text>
                <Text style={styles.summaryValue}>{formatCurrency(latestBudget)}</Text>
              </View>
            </View>
            <View style={styles.summaryCard}>
              <Ionicons name="calendar-clear-outline" size={18} color="#B54708" />
              <View style={{ flex: 1 }}>
                <Text style={styles.summaryLabel}>Target Deadline</Text>
                <Text style={styles.summaryValue}>{formatDate(latestDeadline)}</Text>
              </View>
            </View>
          </View>

          {/* Work Updates Timeline */}
          {dbComplaint.workUpdates.length > 0 ? (
            <View style={styles.timelineSection}>
              <Text style={styles.timelineSectionTitle}>Updates Timeline ({dbComplaint.workUpdates.length})</Text>
              {dbComplaint.workUpdates.map((update) => {
                const badge = getWorkTypeBadge(update.type);
                return (
                  <View key={update.updateId} style={styles.timelineCard}>
                    <View style={styles.timelineCardTop}>
                      <View style={[styles.typeBadge, { backgroundColor: badge.bg }]}>
                        <Text style={[styles.typeBadgeText, { color: badge.color }]}>{badge.label}</Text>
                      </View>
                      <Text style={styles.timelineCardDate}>{formatDate(update.createdAt)}</Text>
                    </View>

                    {update.note ? <Text style={styles.timelineCardNote}>{update.note}</Text> : null}

                    <View style={styles.timelineMetaRow}>
                      {update.progressPercent !== null && update.progressPercent !== undefined ? (
                        <Text style={styles.timelineMetaText}>Progress: {update.progressPercent}%</Text>
                      ) : null}
                      {update.budget ? <Text style={styles.timelineMetaText}>Budget: {formatCurrency(update.budget)}</Text> : null}
                      {update.deadline ? <Text style={styles.timelineMetaText}>Deadline: {formatDate(update.deadline)}</Text> : null}
                    </View>

                    {/* Attached Update Evidence Images */}
                    {update.images.length > 0 ? (
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                        {update.images.map((img, i) => (
                          <Image key={i} source={{ uri: img }} style={styles.updateEvidenceThumb} />
                        ))}
                      </ScrollView>
                    ) : null}
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.noUpdatesBox}>
              <Text style={styles.noUpdatesText}>No work updates published by authority yet.</Text>
            </View>
          )}
        </View>

        {/* Resolution Details Panel (if resolved) */}
        {dbComplaint.resolution ? (
          <View style={[styles.panel, { backgroundColor: "#F0FDF4", borderColor: "#ABEFC6", borderWidth: 1 }]}>
            <View style={styles.panelHeaderRow}>
              <Text style={[styles.panelTitle, { color: "#027A48" }]}>Final Resolution</Text>
              <Ionicons name="checkmark-done-circle" size={24} color="#027A48" />
            </View>
            <View style={styles.detailsGrid}>
              <Detail icon="calendar-outline" label="Resolved At" value={formatDate(dbComplaint.resolution.resolvedAt)} />
              {dbComplaint.resolution.resolutionNote ? (
                <Detail icon="document-text-outline" label="Resolution Notes" value={dbComplaint.resolution.resolutionNote} />
              ) : null}
              {dbComplaint.resolution.finalBudget ? (
                <Detail icon="cash-outline" label="Final Budget" value={formatCurrency(dbComplaint.resolution.finalBudget)} />
              ) : null}
              {dbComplaint.resolution.finalDeadline ? (
                <Detail icon="time-outline" label="Completion Date" value={formatDate(dbComplaint.resolution.finalDeadline)} />
              ) : null}
            </View>
          </View>
        ) : null}

        {/* Resident Evidence Photos Panel */}
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
              <Image source={{ uri: imageList[currentImageIndex] }} style={styles.evidence} resizeMode="cover" />
            ) : (
              <View style={styles.noImagePlaceholder}>
                <Ionicons name="image-outline" size={40} color="#98A2B3" />
                <Text style={styles.noImageText}>No evidence photo uploaded</Text>
              </View>
            )}

            {imageList.length > 1 && (
              <>
                <TouchableOpacity style={styles.navButtonLeft} onPress={handlePrevImage} activeOpacity={0.8}>
                  <Ionicons name="chevron-back" size={26} color="#FFFFFF" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.navButtonRight} onPress={handleNextImage} activeOpacity={0.8}>
                  <Ionicons name="chevron-forward" size={26} color="#FFFFFF" />
                </TouchableOpacity>

                <View style={styles.counterBadge}>
                  <Ionicons name="images-outline" size={13} color="#FFFFFF" />
                  <Text style={styles.counterBadgeText}>
                    {currentImageIndex + 1} / {imageList.length}
                  </Text>
                </View>
              </>
            )}
          </View>

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
        </View>

        {/* Administrative Review Info */}
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Administrative review</Text>
          <Text style={styles.reviewText}>
            This report is managed by system administrators. You can monitor complaint status, team assignment history, and community authority progress updates directly from this page.
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
      <Ionicons name={icon} size={18} color="#00475E" />
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
  complaintId: { color: "#00475E", fontSize: 12, fontWeight: "600" },
  title: {
    marginTop: 13,
    color: "#00475E",
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  description: { marginTop: 7, color: "#40484D", fontSize: 14, lineHeight: 20 },
  panel: { padding: 18, borderRadius: 16, backgroundColor: "#FFFFFF" },
  panelHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  panelTitle: { color: "#191C1E", fontSize: 18, fontWeight: "700" },
  evidencePanelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  photoCountText: { fontSize: 13, fontWeight: "600", color: "#00475E" },
  detailsGrid: { marginTop: 12, gap: 15 },
  detail: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  detailCopy: { flex: 1 },
  detailLabel: { color: "#70787D", fontSize: 12, fontWeight: "600" },
  detailValue: { marginTop: 2, color: "#191C1E", fontSize: 14 },

  // Track Team & Contractor Styles
  activeContractorBox: {
    backgroundColor: "#F8F9FC",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 10,
  },
  contractorBadgeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  currentTag: {
    backgroundColor: "#00475E",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  currentTagText: { color: "#FFFFFF", fontSize: 10, fontWeight: "700" },
  contractorDateText: { color: "#70787D", fontSize: 11 },
  contractorMainInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  contractorAvatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#00475E",
    justifyContent: "center",
    alignItems: "center",
  },
  contractorNameText: { color: "#191C1E", fontSize: 16, fontWeight: "700" },
  contractorPhoneText: { color: "#40484D", fontSize: 13, marginTop: 2 },
  reasonBox: {
    backgroundColor: "#EFF6FF",
    padding: 10,
    borderRadius: 8,
    marginTop: 4,
  },
  reasonLabel: { fontSize: 11, fontWeight: "700", color: "#1D4ED8" },
  reasonValue: { fontSize: 12, color: "#1E3A8A", marginTop: 2 },
  noContractorBox: {
    padding: 24,
    alignItems: "center",
    backgroundColor: "#F8F9FC",
    borderRadius: 12,
    gap: 6,
  },
  noContractorTitle: { fontSize: 15, fontWeight: "700", color: "#40484D" },
  noContractorSub: { fontSize: 12, color: "#70787D", textAlign: "center" },

  // Contractor History Styles
  historySection: { marginTop: 14, gap: 8 },
  historySectionTitle: { fontSize: 13, fontWeight: "700", color: "#40484D" },
  historyRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F4F7",
  },
  historyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#98A2B3",
    marginTop: 5,
  },
  historyHeader: { flexDirection: "row", justifyContent: "space-between" },
  historyContractorName: { fontSize: 13, fontWeight: "600", color: "#344054" },
  historyDate: { fontSize: 11, color: "#98A2B3" },
  historyReason: { fontSize: 12, color: "#667085", marginTop: 2 },

  // Work Progress Styles
  progressContainer: { gap: 6, marginBottom: 12 },
  progressHeader: { flexDirection: "row", justifyContent: "space-between" },
  progressLabel: { fontSize: 13, fontWeight: "600", color: "#40484D" },
  progressPercentage: { fontSize: 14, fontWeight: "700", color: "#00475E" },
  progressBarTrack: {
    height: 10,
    borderRadius: 5,
    backgroundColor: "#EAECF0",
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 5,
    backgroundColor: "#00475E",
  },
  summaryGrid: { flexDirection: "row", gap: 10, marginBottom: 14 },
  summaryCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    backgroundColor: "#F8F9FC",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#EAECF0",
  },
  summaryLabel: { fontSize: 11, color: "#70787D" },
  summaryValue: { fontSize: 13, fontWeight: "700", color: "#191C1E", marginTop: 1 },

  // Timeline Styles
  timelineSection: { gap: 10 },
  timelineSectionTitle: { fontSize: 13, fontWeight: "700", color: "#40484D" },
  timelineCard: {
    padding: 12,
    backgroundColor: "#F8F9FC",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#EAECF0",
    gap: 6,
  },
  timelineCardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  typeBadgeText: { fontSize: 11, fontWeight: "700" },
  timelineCardDate: { fontSize: 11, color: "#70787D" },
  timelineCardNote: { fontSize: 13, color: "#191C1E", lineHeight: 18 },
  timelineMetaRow: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  timelineMetaText: { fontSize: 11, fontWeight: "600", color: "#40484D" },
  updateEvidenceThumb: { width: 50, height: 50, borderRadius: 6, marginRight: 6 },
  noUpdatesBox: { padding: 14, backgroundColor: "#F8F9FC", borderRadius: 8, alignItems: "center" },
  noUpdatesText: { fontSize: 12, color: "#70787D" },

  // Image & Evidence Styles
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
  activeThumbnailWrapper: { borderColor: "#00475E" },
  thumbnail: { width: "100%", height: "100%" },
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
