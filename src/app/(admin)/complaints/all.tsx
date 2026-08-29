import AdminBottomNav from "@/components/AdminBottomNav";
import { supabase } from "@/lib/supabase";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
    Alert,
    Image,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

type ComplaintFilter = "All" | "Pending" | "In Progress" | "Resolved";
type ReviewSort = "latest" | "earliest";

type ReviewComplaint = {
  compId: string;
  accId: string | null;
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
  reporterName: string;
  reporterEmail: string;
  reporterNid: string;
  reporterPhone: string;
  evidenceImages: string[];
};

type NormalComplaint = {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  status: "PENDING" | "IN PROGRESS" | "RESOLVED";
  category: string;
  urgencyCount: number;
  urgencyLevel: string;
  evidence: string;
  images: string[];
  color: string;
  icon: string;

  image: string;
};

const theme = {
  background: "#f8f9fc",
  surface: "#ffffff",
  primary: "#00475e",
  primaryContainer: "#1a5f7a",
  onPrimaryContainer: "#9bd7f7",
  onSurface: "#191c1e",
  onSurfaceVariant: "#40484d",
  outline: "#70787d",
  outlineVariant: "#c0c8cd",
  surfaceContainerLow: "#f2f4f6",
  surfaceContainer: "#eceef0",
  pendingBg: "#ffdcc3",
  pendingText: "#713b00",
  progressBg: "#c0e8ff",
  progressText: "#004d66",
  resolvedBg: "#d1fadf",
  resolvedText: "#027a48",
  secondaryContainer: "#ffa454",
  onSecondaryContainer: "#713b00",
};

type ComplaintsListProps = {
  reviewMode?: boolean;
};

export default function AllComplaintsScreen() {
  return <ComplaintsListScreen />;
}

export function ComplaintsListScreen({
  reviewMode = false,
}: ComplaintsListProps) {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<ComplaintFilter>("All");
  const [reviewSort, setReviewSort] = useState<ReviewSort>("latest");
  const [complaints, setComplaints] = useState<NormalComplaint[]>([]);
  const [complaintsLoading, setComplaintsLoading] = useState(false);
  const [complaintsError, setComplaintsError] = useState<string | null>(null);
  const [reviewComplaints, setReviewComplaints] = useState<ReviewComplaint[]>(
    [],
  );
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const confirmAction = async (
    title: string,
    message: string,
    confirmLabel: string,
  ) => {
    if (Platform.OS === "web") {
      if (typeof globalThis.confirm === "function") {
        return globalThis.confirm(`${title}\n\n${message}`);
      }
      return true;
    }

    return new Promise<boolean>((resolve) => {
      Alert.alert(
        title,
        message,
        [
          {
            text: "Cancel",
            style: "cancel",
            onPress: () => resolve(false),
          },
          {
            text: confirmLabel,
            onPress: () => resolve(true),
          },
        ],
        {
          cancelable: true,
          onDismiss: () => resolve(false),
        },
      );
    });
  };

  const getMaterialIconFromCategory = (
    category: string,
  ): keyof typeof MaterialIcons.glyphMap => {
    const value = category.toLowerCase();

    if (value.includes("water") || value.includes("drain")) return "water-drop";
    if (value.includes("road") || value.includes("traffic"))
      return "directions-car";
    if (value.includes("light") || value.includes("electrical"))
      return "lightbulb";
    if (value.includes("garbage") || value.includes("waste")) return "delete";
    if (value.includes("park")) return "park";
    if (value.includes("animal")) return "pets";

    return "report-problem";
  };

  const formatComplaintDate = (dateValue: string | null) => {
    if (!dateValue) return "Unknown date";
    const parsed = new Date(dateValue);
    if (Number.isNaN(parsed.getTime())) return "Unknown date";

    return parsed.toLocaleString();
  };

  const fetchAllComplaints = async () => {
    setComplaintsLoading(true);
    setComplaintsError(null);

    const { data: complaintData, error: complaintError } = await supabase
      .from("complaints")
      .select("comp_id,title,description,category,status,house,road,avenue,nearby_landmark,additional_location_details,timestamp")
      .in("status", ["pending", "in progress", "resolved"])
      .order("timestamp", { ascending: false });

    if (complaintError) {
      setComplaintsError(complaintError.message);
      setComplaintsLoading(false);
      return;
    }

    const rows = (complaintData ?? []) as Array<{
      comp_id: string; title: string; description: string; category: string;
      status: string; house?: string; road?: string; avenue?: string; nearby_landmark?: string; additional_location_details?: string; timestamp: string | null;
    }>;
    const complaintIds = rows.map((item) => item.comp_id);
    const { data: evidenceData, error: evidenceError } = complaintIds.length
      ? await supabase.from("evidence").select("comp_id,img_url").in("comp_id", complaintIds)
      : { data: [], error: null };

    if (evidenceError) {
      setComplaintsError(evidenceError.message);
      setComplaintsLoading(false);
      return;
    }

    const firstEvidence = new Map<string, string>();
    for (const evidence of (evidenceData ?? []) as Array<{ comp_id: string; img_url: string }>) {
      if (!firstEvidence.has(evidence.comp_id)) firstEvidence.set(evidence.comp_id, evidence.img_url);
    }

    setComplaints(rows.map((item) => ({
      id: item.comp_id,
      title: item.title,
      description: item.description,
      date: formatComplaintDate(item.timestamp),
      location: [item.house, item.road, item.avenue, item.nearby_landmark].filter(Boolean).join(', ') || 'Location not provided',
      status: (item.status === "in progress" ? "IN PROGRESS" : item.status.toUpperCase()) as "PENDING" | "IN PROGRESS" | "RESOLVED",
      category: item.category,
      urgencyCount: 0,
      urgencyLevel: "LOW",
      evidence: firstEvidence.has(item.comp_id) ? "Resident uploaded photo evidence" : "No image evidence uploaded",
      images: firstEvidence.has(item.comp_id) ? [firstEvidence.get(item.comp_id)!] : [],
      color: "#60A5FA",
      icon: item.category.toLowerCase(),

      image: firstEvidence.get(item.comp_id) ?? "",
    })));
    setComplaintsLoading(false);
  };
  const fetchReviewComplaints = async () => {
    setReviewLoading(true);
    setReviewError(null);

    const { data: complaintsData, error: complaintsError } = await supabase
      .from("complaints")
      .select(
        "comp_id,acc_id,title,description,category,status,house,road,avenue,nearby_landmark,additional_location_details,timestamp,urgency",
      )
      .eq("status", "unverified");

    if (complaintsError) {
      setReviewError(complaintsError.message);
      setReviewLoading(false);
      return;
    }

    const complaintRows = (complaintsData ?? []) as Array<{
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
    }>;

    const accountIds = Array.from(
      new Set(
        complaintRows
          .map((item) => item.acc_id)
          .filter((item): item is string => Boolean(item)),
      ),
    );
    const complaintIds = complaintRows.map((item) => item.comp_id);

    const [
      { data: accountsData, error: accountsError },
      { data: evidenceData, error: evidenceError },
    ] = await Promise.all([
      accountIds.length
        ? supabase
            .from("account")
            .select(
              "acc_id,full_name,email,nid,phone_num,house_num,road_number,avenue_num,username",
            )
            .in("acc_id", accountIds)
        : Promise.resolve({ data: [], error: null }),
      complaintIds.length
        ? supabase
            .from("evidence")
            .select("comp_id,img_url")
            .in("comp_id", complaintIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (accountsError) {
      setReviewError(accountsError.message);
      setReviewLoading(false);
      return;
    }

    if (evidenceError) {
      setReviewError(evidenceError.message);
      setReviewLoading(false);
      return;
    }

    const accountMap = new Map(
      (accountsData ?? []).map((item: any) => [item.acc_id, item]),
    );
    const evidenceMap = new Map<string, string[]>();

    for (const row of (evidenceData ?? []) as Array<{
      comp_id: string;
      img_url: string;
    }>) {
      const current = evidenceMap.get(row.comp_id) ?? [];
      current.push(row.img_url);
      evidenceMap.set(row.comp_id, current);
    }

    const mapped: ReviewComplaint[] = complaintRows.map((item) => {
      const account = item.acc_id ? accountMap.get(item.acc_id) : null;

      return {
        compId: item.comp_id,
        accId: item.acc_id,
        title: item.title,
        description: item.description,
        category: item.category,
        status: item.status,
        house: item.house,
        road: item.road,
        avenue: item.avenue,
        nearby_landmark: item.nearby_landmark,
        additional_location_details: item.additional_location_details,
        timestamp: item.timestamp,
        urgency: item.urgency,
        reporterName: account?.full_name ?? "Unknown resident",
        reporterEmail: account?.email ?? "",
        reporterNid: account?.nid ?? "",
        reporterPhone: account?.phone_num ?? "",
        evidenceImages: evidenceMap.get(item.comp_id) ?? [],
      };
    });

    setReviewComplaints(mapped);
    setReviewLoading(false);
  };

  useEffect(() => {
    if (reviewMode) {
      void fetchReviewComplaints();
    } else {
      void fetchAllComplaints();
    }
  }, [reviewMode]);

  const filteredComplaints = useMemo(() => {
    if (activeFilter === "All") {
      return complaints;
    }
    return complaints.filter(
      (complaint) =>
        complaint.status.toUpperCase() === activeFilter.toUpperCase(),
    );
  }, [activeFilter, complaints]);

  const sortedReviewComplaints = useMemo(() => {
    const rows = [...reviewComplaints];

    rows.sort((a, b) => {
      const aTime = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const bTime = b.timestamp ? new Date(b.timestamp).getTime() : 0;

      return reviewSort === "latest" ? bTime - aTime : aTime - bTime;
    });

    return rows;
  }, [reviewComplaints, reviewSort]);

  const handleAcceptReviewComplaint = (complaintId: string) => {
    void (async () => {
      const confirmed = await confirmAction(
        "Accept complaint",
        "Move this complaint to pending status?",
        "Accept",
      );

      if (!confirmed) {
        return;
      }

      setActionLoadingId(complaintId);
      setActionMessage(null);
      setActionError(null);

      const { error } = await supabase
        .from("complaints")
        .update({ status: "pending" })
        .eq("comp_id", complaintId);

      if (error) {
        setActionError(`Accept failed: ${error.message}`);
        setActionLoadingId(null);
        return;
      }

      setReviewComplaints((current) =>
        current.filter((item) => item.compId !== complaintId),
      );
      setActionMessage("Complaint accepted and moved to pending.");
      setActionLoadingId(null);
    })();
  };

  const handleDeleteReviewComplaint = (complaintId: string) => {
    void (async () => {
      const confirmed = await confirmAction(
        "Delete complaint",
        "Delete this complaint permanently?",
        "Delete",
      );

      if (!confirmed) {
        return;
      }

      setActionLoadingId(complaintId);
      setActionMessage(null);
      setActionError(null);

      const { error } = await supabase
        .from("complaints")
        .delete()
        .eq("comp_id", complaintId);

      if (error) {
        setActionError(`Delete failed: ${error.message}`);
        setActionLoadingId(null);
        return;
      }

      setReviewComplaints((current) =>
        current.filter((item) => item.compId !== complaintId),
      );
      setActionMessage("Complaint deleted from review.");
      setActionLoadingId(null);
    })();
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Header Section */}
        <View style={styles.pageIntro}>
          <Text style={styles.title}>
            {reviewMode ? "Review Complaints" : "All Complaints"}
          </Text>
          <Text style={styles.subtitle}>
            {reviewMode
              ? "Verify newly submitted resident reports before they enter the system."
              : "Track and manage reported city issues."}
          </Text>
        </View>

        {/* Filter Controls */}
        {reviewMode ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterScroll}
            contentContainerStyle={styles.filterContainer}
          >
            <TouchableOpacity
              style={[
                styles.filterBtn,
                reviewSort === "latest"
                  ? styles.activeFilter
                  : styles.inactiveFilter,
              ]}
              onPress={() => setReviewSort("latest")}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.filterText,
                  reviewSort === "latest"
                    ? styles.activeFilterText
                    : styles.inactiveFilterText,
                ]}
              >
                Latest First
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterBtn,
                reviewSort === "earliest"
                  ? styles.activeFilter
                  : styles.inactiveFilter,
              ]}
              onPress={() => setReviewSort("earliest")}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.filterText,
                  reviewSort === "earliest"
                    ? styles.activeFilterText
                    : styles.inactiveFilterText,
                ]}
              >
                Earliest First
              </Text>
            </TouchableOpacity>
          </ScrollView>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterScroll}
            contentContainerStyle={styles.filterContainer}
          >
            {(
              ["All", "Pending", "In Progress", "Resolved"] as ComplaintFilter[]
            ).map((filter) => {
              const isActive = activeFilter === filter;
              return (
                <TouchableOpacity
                  key={filter}
                  style={[
                    styles.filterBtn,
                    isActive ? styles.activeFilter : styles.inactiveFilter,
                  ]}
                  onPress={() => setActiveFilter(filter)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.filterText,
                      isActive
                        ? styles.activeFilterText
                        : styles.inactiveFilterText,
                    ]}
                  >
                    {filter}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* Complaint List */}
        <View style={styles.listContainer}>
          {!reviewMode && complaintsError ? (
            <Text style={styles.errorText}>Failed to load complaints: {complaintsError}</Text>
          ) : null}
          {!reviewMode && complaintsLoading ? (
            <Text style={styles.emptyDesc}>Loading complaints...</Text>
          ) : null}
          {reviewMode && actionMessage ? (
            <Text style={styles.successText}>{actionMessage}</Text>
          ) : null}
          {reviewMode && actionError ? (
            <Text style={styles.errorText}>{actionError}</Text>
          ) : null}
          {reviewMode && reviewLoading ? (
            <Text style={styles.emptyDesc}>
              Loading unverified complaints...
            </Text>
          ) : null}
          {(
            reviewMode
              ? !reviewLoading && sortedReviewComplaints.length === 0
              : !complaintsLoading && filteredComplaints.length === 0
          ) ? (
            <View style={styles.emptyState}>
              <MaterialIcons
                name="error-outline"
                size={64}
                color={theme.outlineVariant}
                style={{ marginBottom: 16 }}
              />
              <Text style={styles.emptyTitle}>No complaints found</Text>
              <Text style={styles.emptyDesc}>
                {reviewMode
                  ? "There are no unverified complaints to review right now."
                  : "There are no reports in this category."}
              </Text>
            </View>
          ) : (
            (reviewMode ? sortedReviewComplaints : filteredComplaints).map(
              (item) => {
                const reviewItem = reviewMode
                  ? (item as ReviewComplaint)
                  : null;
                const normalItem = reviewMode
                  ? null
                  : (item as NormalComplaint);

                const itemId = reviewMode ? reviewItem!.compId : normalItem!.id;
                const isBusy = actionLoadingId === itemId;
                const itemTitle = reviewMode
                  ? reviewItem!.title
                  : normalItem!.title;
                const itemDescription = reviewMode
                  ? reviewItem!.description
                  : normalItem!.description;
                const itemDate = reviewMode
                  ? formatComplaintDate(reviewItem!.timestamp)
                  : normalItem!.date;
                const itemImage = reviewMode
                  ? reviewItem!.evidenceImages[0]
                  : normalItem!.image;

                // Status colors mapping
                const displayStatus = reviewMode
                  ? "UNVERIFIED"
                  : normalItem!.status;
                let badgeBg = theme.pendingBg;
                let badgeText = theme.pendingText;
                let statusLabel = reviewMode ? "Unverified" : "Pending";
                if (displayStatus === "IN PROGRESS") {
                  badgeBg = theme.progressBg;
                  badgeText = theme.progressText;
                  statusLabel = "In Progress";
                } else if (displayStatus === "RESOLVED") {
                  badgeBg = theme.resolvedBg;
                  badgeText = theme.resolvedText;
                  statusLabel = "Resolved";
                }

                // Icon mapping from string to MaterialIcons
                let materialIcon: keyof typeof MaterialIcons.glyphMap =
                  "report-problem";
                if (reviewMode) {
                  materialIcon = getMaterialIconFromCategory(
                    reviewItem!.category,
                  );
                } else {
                  if (normalItem!.icon.includes("water"))
                    materialIcon = "water-drop";
                  if (normalItem!.icon.includes("construct"))
                    materialIcon = "construction";
                  if (normalItem!.icon.includes("bulb"))
                    materialIcon = "lightbulb";
                  if (normalItem!.icon.includes("trash"))
                    materialIcon = "delete";
                  if (
                    normalItem!.icon.includes("bicycle") ||
                    normalItem!.icon.includes("car")
                  )
                    materialIcon = "directions-car";
                  if (normalItem!.icon.includes("leaf")) materialIcon = "park";
                  if (normalItem!.icon.includes("paw")) materialIcon = "pets";
                  if (normalItem!.icon.includes("warning"))
                    materialIcon = "warning";
                }

                return (
                  <View key={itemId} style={styles.card}>
                    <View style={styles.cardHeader}>
                      <View style={styles.cardHeaderLeft}>
                        <View style={styles.iconCircle}>
                          <MaterialIcons
                            name={materialIcon}
                            size={24}
                            color={theme.primary}
                          />
                        </View>
                        <View style={styles.titleArea}>
                          <Text style={styles.cardTitle}>{itemTitle}</Text>
                          <Text style={styles.cardMeta}>
                            {itemDate} â€¢{" "}
                            {reviewMode
                              ? itemId.slice(0, 8)
                              : `#${normalItem!.id.slice(0, 8)}`}
                          </Text>
                        </View>
                      </View>
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: badgeBg },
                        ]}
                      >
                        <Text
                          style={[styles.statusBadgeText, { color: badgeText }]}
                        >
                          {statusLabel}
                        </Text>
                      </View>
                    </View>

                    {itemImage && (
                      <Image
                        source={{ uri: itemImage }}
                        style={styles.evidenceImage}
                      />
                    )}

                    <Text style={styles.cardDesc} numberOfLines={2}>
                      {itemDescription}
                    </Text>

                    <View style={styles.actionRow}>
                      <TouchableOpacity
                        style={styles.viewBtn}
                        onPress={() =>
                          router.push({
                            pathname: "/(admin)/complaints/[complaintId]",
                            params: {
                              complaintId: reviewMode
                                ? reviewItem!.compId
                                : normalItem!.id,
                            },
                          } as never)
                        }
                      >
                        <Text style={styles.viewBtnText}>View Details</Text>
                      </TouchableOpacity>
                      {reviewMode ? (
                        <>
                          <TouchableOpacity
                            style={styles.acceptBtn}
                            onPress={() =>
                              handleAcceptReviewComplaint(reviewItem!.compId)
                            }
                            disabled={isBusy}
                          >
                            <MaterialIcons
                              name="check"
                              size={16}
                              color="#FFFFFF"
                            />
                            <Text style={styles.acceptBtnText}>
                              {isBusy ? "Processing" : "Accept"}
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.deleteBtn}
                            onPress={() =>
                              handleDeleteReviewComplaint(reviewItem!.compId)
                            }
                            disabled={isBusy}
                          >
                            <MaterialIcons
                              name="delete-outline"
                              size={16}
                              color="#B42318"
                            />
                            <Text style={styles.deleteBtnText}>
                              {isBusy ? "Processing" : "Delete"}
                            </Text>
                          </TouchableOpacity>
                        </>
                      ) : (
                        normalItem!.status === "IN PROGRESS" && (
                          <TouchableOpacity style={styles.trackBtn}>
                            <Text style={styles.trackBtnText}>Track Team</Text>
                          </TouchableOpacity>
                        )
                      )}
                      {!reviewMode && normalItem!.status === "RESOLVED" && (
                        <TouchableOpacity style={styles.closedBtn} disabled>
                          <Text style={styles.closedBtnText}>Case Closed</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              },
            )
          )}
          {reviewMode && reviewError ? (
            <Text style={[styles.emptyDesc, { color: "#B42318" }]}>
              {reviewError}
            </Text>
          ) : null}
        </View>
      </ScrollView>

      <AdminBottomNav activeRoute="complaints" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    height: 64,
    backgroundColor: theme.surfaceContainerLow,
    borderBottomWidth: 1,
    borderBottomColor: theme.outlineVariant + "40",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  iconButton: {
    padding: 8,
    borderRadius: 999,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: theme.primary,
    // No fontFamily - uses system default (SF Pro/Roboto)
  },
  content: {
    paddingTop: 24,
    paddingBottom: 100,
  },
  pageIntro: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: theme.primary,
    marginBottom: 4,
    letterSpacing: -0.5,
    // No fontFamily - uses system default (SF Pro/Roboto)
  },
  subtitle: {
    fontSize: 14,
    color: theme.onSurfaceVariant,
    // No fontFamily - uses system default (SF Pro/Roboto)
  },
  filterScroll: {
    marginBottom: 24,
    maxHeight: 40,
  },
  filterContainer: {
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 8,
  },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
  },
  activeFilter: {
    backgroundColor: theme.primary,
    shadowColor: theme.primary,
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  inactiveFilter: {
    backgroundColor: theme.surfaceContainer,
  },
  filterText: {
    fontSize: 12,
    fontWeight: "600",
    // No fontFamily - uses system default (SF Pro/Roboto)
  },
  activeFilterText: {
    color: "#fff",
  },
  inactiveFilterText: {
    color: theme.onSurfaceVariant,
  },
  listContainer: {
    paddingHorizontal: 16,
    gap: 16,
  },
  card: {
    backgroundColor: theme.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.outlineVariant + "4D",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 16,
    marginRight: 8,
  },
  iconCircle: {
    width: 48,
    height: 48,
    backgroundColor: theme.primary + "1A",
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  titleArea: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: theme.onSurface,
    // No fontFamily - uses system default (SF Pro/Roboto)
  },
  cardMeta: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.outline,
    marginTop: 2,
    // No fontFamily - uses system default (SF Pro/Roboto)
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    // No fontFamily - uses system default (SF Pro/Roboto)
  },
  evidenceImage: {
    width: "100%",
    height: 180,
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: theme.surfaceContainer,
  },
  cardDesc: {
    fontSize: 14,
    color: theme.onSurfaceVariant,
    lineHeight: 20,
    marginBottom: 16,
    // No fontFamily - uses system default (SF Pro/Roboto)
  },
  actionRow: {
    flexDirection: "row",
    gap: 8,
  },
  viewBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.outlineVariant,
    justifyContent: "center",
    alignItems: "center",
  },
  viewBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.primary,
    // No fontFamily - uses system default (SF Pro/Roboto)
  },
  trackBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: theme.primaryContainer,
    justifyContent: "center",
    alignItems: "center",
  },
  trackBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.onPrimaryContainer,
    // No fontFamily - uses system default (SF Pro/Roboto)
  },
  acceptBtn: {
    flex: 1,
    flexDirection: "row",
    gap: 4,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#16845B",
    justifyContent: "center",
    alignItems: "center",
  },
  acceptBtnText: { color: "#FFFFFF", fontSize: 12, fontWeight: "600" },
  deleteBtn: {
    flex: 1,
    flexDirection: "row",
    gap: 4,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FDA29B",
    backgroundColor: "#FFF1F0",
    justifyContent: "center",
    alignItems: "center",
  },
  deleteBtnText: { color: "#B42318", fontSize: 12, fontWeight: "600" },
  closedBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: theme.surfaceContainer + "80",
    justifyContent: "center",
    alignItems: "center",
  },
  closedBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.onSurfaceVariant,
    // No fontFamily - uses system default (SF Pro/Roboto)
  },
  emptyState: {
    paddingVertical: 64,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: theme.onSurface,
    marginBottom: 4,
    // No fontFamily - uses system default (SF Pro/Roboto)
  },
  emptyDesc: {
    fontSize: 14,
    color: theme.onSurfaceVariant,
    // No fontFamily - uses system default (SF Pro/Roboto)
  },
  successText: {
    fontSize: 14,
    color: "#027A48",
    fontWeight: "600",
  },
  errorText: {
    fontSize: 14,
    color: "#B42318",
    fontWeight: "600",
  },
});
