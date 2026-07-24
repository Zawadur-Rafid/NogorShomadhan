import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuthorityComplaints } from "@/components/authority/authority-complaints-context";
import AuthorityPageHeader from "@/components/authority/authority-page-header";
import type { AuthorityComplaintDetail } from "@/components/authority/store-authority-complaint-details";

const periods = ["7 Days", "30 Days", "This Year"] as const;
const distributionColors = [
  "#23435D",
  "#3B82F6",
  "#B9854B",
  "#26A69A",
  "#7C6BC4",
];

const getComplaintArea = (location: string) =>
  location.match(/Block\s+[A-Z0-9-]+/i)?.[0] ??
  location.split(",").at(-1)?.trim() ??
  location;

const parseAuthorityDate = (value?: string) => {
  if (!value) return Number.NaN;
  return Date.parse(value.replace(",", ""));
};

function buildTrendData(
  period: (typeof periods)[number],
  complaints: AuthorityComplaintDetail[],
) {
  if (period === "7 Days") {
    return [15, 16, 17, 18, 19, 20, 21].map((day) => ({
      label: `${day} Jul`,
      value: complaints.filter(
        (item) => Number(item.submittedAt.match(/^\d+/)?.[0]) === day,
      ).length,
    }));
  }

  if (period === "30 Days") {
    return [
      { label: "Week 1", start: 1, end: 7 },
      { label: "Week 2", start: 8, end: 14 },
      { label: "Week 3", start: 15, end: 21 },
      { label: "Week 4", start: 22, end: 31 },
    ].map((week) => ({
      label: week.label,
      value: complaints.filter((item) => {
        const day = Number(item.submittedAt.match(/^\d+/)?.[0]);
        return day >= week.start && day <= week.end;
      }).length,
    }));
  }

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return months.map((month) => ({
    label: month,
    value: complaints.filter((item) => item.submittedAt.includes(month)).length,
  }));
}

export default function AuthorityAnalytics() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { complaints } = useAuthorityComplaints();
  const [period, setPeriod] = useState<(typeof periods)[number]>("30 Days");
  const [reportGenerated, setReportGenerated] = useState(false);
  const wide = width >= 900;
  const {
    authorityAnalyticsSummary,
    authorityCategoryDistribution,
    authorityResolutionPerformance,
    authorityStatusDistribution,
    authorityUrgencyHotspots,
    authorityZoneDistribution,
  } = useMemo(() => {
    const total = complaints.length;
    const resolvedComplaints = complaints.filter(
      (item) => item.status === "RESOLVED",
    );
    const statusDistribution = [
      { label: "Pending", status: "PENDING", color: "#EF4444" },
      { label: "In Progress", status: "IN PROGRESS", color: "#C67B00" },
      { label: "Resolved", status: "RESOLVED", color: "#2563EB" },
    ].map((item) => {
      const value = complaints.filter(
        (complaint) => complaint.status === item.status,
      ).length;
      return {
        label: item.label,
        value,
        percent: total === 0 ? 0 : Math.round((value / total) * 100),
        color: item.color,
      };
    });

    const categoryCounts = Object.entries(
      complaints.reduce<Record<string, number>>((counts, item) => {
        counts[item.category] = (counts[item.category] ?? 0) + 1;
        return counts;
      }, {}),
    ).sort((first, second) => second[1] - first[1]);
    const maxCategory = Math.max(
      1,
      ...categoryCounts.map(([, count]) => count),
    );
    const categoryDistribution = categoryCounts.map(
      ([label, value], index) => ({
        label,
        value,
        percent: Math.round((value / maxCategory) * 100),
        color: distributionColors[index % distributionColors.length],
      }),
    );

    const zoneCounts = Object.entries(
      complaints.reduce<Record<string, number>>((counts, item) => {
        const area = getComplaintArea(item.location);
        counts[area] = (counts[area] ?? 0) + 1;
        return counts;
      }, {}),
    ).sort((first, second) => second[1] - first[1]);
    const maxZone = Math.max(1, ...zoneCounts.map(([, count]) => count));
    const zoneDistribution = zoneCounts.map(([label, value], index) => ({
      label,
      value,
      percent: Math.round((value / maxZone) * 100),
      color: distributionColors[index % distributionColors.length],
    }));

    const resolvedDurations = resolvedComplaints
      .map((item) => {
        const submitted = parseAuthorityDate(item.submittedAt);
        const completed = parseAuthorityDate(item.completedAt);
        return Number.isNaN(submitted) || Number.isNaN(completed)
          ? Number.NaN
          : Math.max(0, (completed - submitted) / 86_400_000);
      })
      .filter((value) => !Number.isNaN(value));
    const averageDays =
      resolvedDurations.length === 0
        ? 0
        : resolvedDurations.reduce((sum, value) => sum + value, 0) /
          resolvedDurations.length;
    const withinDeadline = resolvedComplaints.filter((item) => {
      const completed = parseAuthorityDate(item.completedAt);
      const deadline = parseAuthorityDate(item.deadline);
      return (
        !Number.isNaN(completed) &&
        !Number.isNaN(deadline) &&
        completed <= deadline + 86_399_999
      );
    }).length;
    const overdue = Math.max(0, resolvedComplaints.length - withinDeadline);
    const onTimeRate =
      resolvedComplaints.length === 0
        ? 0
        : Math.round((withinDeadline / resolvedComplaints.length) * 100);
    const urgencyHotspots = [...complaints]
      .sort((first, second) => second.urgency - first.urgency)
      .slice(0, 3)
      .map((item) => ({
        location: item.location,
        category: item.category,
        signals: item.urgency,
      }));
    const resolutionRate =
      total === 0 ? 0 : Math.round((resolvedComplaints.length / total) * 100);
    const hotspotCount = complaints.filter((item) => item.urgency >= 25).length;

    return {
      authorityAnalyticsSummary: [
        {
          label: "Total Complaints",
          value: String(total),
          change: "Live assigned records",
          icon: "documents-outline" as const,
          color: "#3B82F6",
          background: "#EEF6FF",
        },
        {
          label: "Resolution Rate",
          value: `${resolutionRate}%`,
          change: `${resolvedComplaints.length} resolved`,
          icon: "checkmark-done-outline" as const,
          color: "#16845B",
          background: "#EAF8F1",
        },
        {
          label: "Average Resolution",
          value: `${averageDays.toFixed(1)} days`,
          change: "From submission to completion",
          icon: "timer-outline" as const,
          color: "#C67B00",
          background: "#FFF7E8",
        },
        {
          label: "Urgency Hotspots",
          value: String(hotspotCount),
          change: "25+ resident signals",
          icon: "flame-outline" as const,
          color: "#E0524D",
          background: "#FFF1F1",
        },
      ],
      authorityStatusDistribution: statusDistribution,
      authorityCategoryDistribution: categoryDistribution,
      authorityZoneDistribution: zoneDistribution,
      authorityUrgencyHotspots: urgencyHotspots,
      authorityResolutionPerformance: {
        resolved: resolvedComplaints.length,
        withinDeadline,
        overdue,
        onTimeRate,
        averageDays: Number(averageDays.toFixed(1)),
        targetDays: 4,
      },
    };
  }, [complaints]);
  const trendData = useMemo(
    () => buildTrendData(period, complaints),
    [complaints, period],
  );
  const maxTrend = useMemo(
    () => Math.max(1, ...trendData.map((item) => item.value)),
    [trendData],
  );
  const trendTitle =
    period === "7 Days"
      ? "Daily Complaint Trend"
      : period === "30 Days"
        ? "Weekly Complaint Trend"
        : "Monthly Complaint Trend";

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.safeArea}>
      <AuthorityPageHeader
        title="Home"
        icon="home-outline"
        onBack={() => router.navigate("/(admin)/dashboard" as never)}
      />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.container}>
          <View style={[styles.hero, !wide && styles.heroCompact]}>
            <View style={styles.heroCopy}>
              <Text style={styles.eyebrow}>AUTHORITY PERFORMANCE</Text>
              <Text style={styles.title}>Analytics & Reports</Text>
              <Text style={styles.subtitle}>
                Review complaint trends, resolution performance and urgency
                hotspots.
              </Text>
            </View>
            <TouchableOpacity
              style={styles.reportButton}
              onPress={() => setReportGenerated(true)}
            >
              <Ionicons
                name={
                  reportGenerated
                    ? "checkmark-circle-outline"
                    : "document-text-outline"
                }
                size={19}
                color="#FFFFFF"
              />
              <Text style={styles.reportButtonText}>
                {reportGenerated ? "Report Generated" : "Generate Total Report"}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.periodRow}>
            <Text style={styles.periodLabel}>Report period</Text>
            <View style={styles.periodButtons}>
              {periods.map((item) => (
                <Pressable
                  key={item}
                  onPress={() => setPeriod(item)}
                  style={[
                    styles.periodButton,
                    period === item && styles.periodButtonActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.periodButtonText,
                      period === item && styles.periodButtonTextActive,
                    ]}
                  >
                    {item}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.summaryGrid}>
            {authorityAnalyticsSummary.map((item) => (
              <View
                key={item.label}
                style={[
                  styles.summaryCard,
                  wide ? styles.summaryCardWide : styles.summaryCardCompact,
                ]}
              >
                <View
                  style={[
                    styles.summaryIcon,
                    { backgroundColor: item.background },
                  ]}
                >
                  <Ionicons name={item.icon} size={21} color={item.color} />
                </View>
                <Text style={styles.summaryLabel}>{item.label}</Text>
                <Text style={styles.summaryValue}>{item.value}</Text>
                <Text style={[styles.summaryChange, { color: item.color }]}>
                  {item.change}
                </Text>
              </View>
            ))}
          </View>

          {reportGenerated && (
            <View style={styles.generatedReport}>
              <View style={styles.generatedIcon}>
                <Ionicons name="document-text" size={23} color="#FFFFFF" />
              </View>
              <View style={styles.generatedCopy}>
                <Text style={styles.generatedTitle}>
                  Total authority report generated
                </Text>
                <Text style={styles.generatedText}>
                  The {period.toLowerCase()} report includes {complaints.length}{" "}
                  complaints, status distribution, category trends, resolution
                  performance, and urgency hotspots.
                </Text>
              </View>
              <View style={styles.readyBadge}>
                <Text style={styles.readyText}>READY</Text>
              </View>
            </View>
          )}

          <View
            style={[styles.analyticsGrid, wide && styles.analyticsGridWide]}
          >
            <View style={styles.panel}>
              <View style={styles.panelHeader}>
                <View>
                  <Text style={styles.panelTitle}>Status Distribution</Text>
                  <Text style={styles.panelSubtitle}>
                    {complaints.length} assigned complaints
                  </Text>
                </View>
                <Ionicons name="pie-chart-outline" size={21} color="#23435D" />
              </View>
              <View style={styles.statusBar}>
                {authorityStatusDistribution.map((item) => (
                  <View
                    key={item.label}
                    style={{
                      width: `${item.percent}%`,
                      backgroundColor: item.color,
                    }}
                  />
                ))}
              </View>
              <View style={styles.statusRows}>
                {authorityStatusDistribution.map((item) => (
                  <View key={item.label} style={styles.statusRow}>
                    <View
                      style={[styles.dot, { backgroundColor: item.color }]}
                    />
                    <Text style={styles.statusLabel}>{item.label}</Text>
                    <Text style={styles.statusValue}>{item.value}</Text>
                    <Text style={styles.statusPercent}>{item.percent}%</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.panel}>
              <View style={styles.panelHeader}>
                <View>
                  <Text style={styles.panelTitle}>{trendTitle}</Text>
                  <Text style={styles.panelSubtitle}>
                    Reports received during {period.toLowerCase()}
                  </Text>
                </View>
                <Ionicons
                  name="trending-up-outline"
                  size={21}
                  color="#23435D"
                />
              </View>
              <View style={styles.chart}>
                {trendData.map((item) => (
                  <View key={item.label} style={styles.chartColumn}>
                    <Text style={styles.chartValue}>{item.value}</Text>
                    <View style={styles.chartTrack}>
                      <View
                        style={[
                          styles.chartBar,
                          {
                            height: `${Math.round((item.value / maxTrend) * 100)}%`,
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.chartLabel}>{item.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          <View
            style={[styles.analyticsGrid, wide && styles.analyticsGridWide]}
          >
            <View style={styles.panel}>
              <View style={styles.panelHeader}>
                <View>
                  <Text style={styles.panelTitle}>Top Categories</Text>
                  <Text style={styles.panelSubtitle}>
                    Complaint volume by issue type
                  </Text>
                </View>
                <Ionicons name="layers-outline" size={21} color="#23435D" />
              </View>
              <View style={styles.categoryList}>
                {authorityCategoryDistribution.map((item) => (
                  <View key={item.label} style={styles.categoryRow}>
                    <View style={styles.categoryTopLine}>
                      <Text style={styles.categoryLabel}>{item.label}</Text>
                      <Text style={styles.categoryValue}>{item.value}</Text>
                    </View>
                    <View style={styles.categoryTrack}>
                      <View
                        style={[
                          styles.categoryBar,
                          {
                            width: `${item.percent}%`,
                            backgroundColor: item.color,
                          },
                        ]}
                      />
                    </View>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.panel}>
              <View style={styles.panelHeader}>
                <View>
                  <Text style={styles.panelTitle}>Urgency Hotspots</Text>
                  <Text style={styles.panelSubtitle}>
                    Locations requiring faster action
                  </Text>
                </View>
                <Ionicons name="flame-outline" size={21} color="#C57C1B" />
              </View>
              <View style={styles.hotspotList}>
                {authorityUrgencyHotspots.map((item, index) => (
                  <View key={item.location} style={styles.hotspotRow}>
                    <View style={styles.hotspotRank}>
                      <Text style={styles.hotspotRankText}>{index + 1}</Text>
                    </View>
                    <View style={styles.hotspotCopy}>
                      <Text style={styles.hotspotLocation}>
                        {item.location}
                      </Text>
                      <Text style={styles.hotspotCategory}>
                        {item.category}
                      </Text>
                    </View>
                    <View style={styles.signalBadge}>
                      <Ionicons
                        name="arrow-up-circle"
                        size={15}
                        color="#C57C1B"
                      />
                      <Text style={styles.signalText}>{item.signals}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>

          <View
            style={[styles.analyticsGrid, wide && styles.analyticsGridWide]}
          >
            <View style={styles.panel}>
              <View style={styles.panelHeader}>
                <View>
                  <Text style={styles.panelTitle}>Area-wise Distribution</Text>
                  <Text style={styles.panelSubtitle}>
                    Assigned complaints by community block
                  </Text>
                </View>
                <Ionicons name="map-outline" size={21} color="#23435D" />
              </View>
              <View style={styles.categoryList}>
                {authorityZoneDistribution.map((item) => (
                  <View key={item.label} style={styles.categoryRow}>
                    <View style={styles.categoryTopLine}>
                      <Text style={styles.categoryLabel}>{item.label}</Text>
                      <Text style={styles.categoryValue}>{item.value}</Text>
                    </View>
                    <View style={styles.categoryTrack}>
                      <View
                        style={[
                          styles.categoryBar,
                          {
                            width: `${item.percent}%`,
                            backgroundColor: item.color,
                          },
                        ]}
                      />
                    </View>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.panel}>
              <View style={styles.panelHeader}>
                <View>
                  <Text style={styles.panelTitle}>Resolution Performance</Text>
                  <Text style={styles.panelSubtitle}>
                    Deadline compliance for resolved complaints
                  </Text>
                </View>
                <Ionicons
                  name="speedometer-outline"
                  size={21}
                  color="#16845B"
                />
              </View>

              <View style={styles.performanceGrid}>
                <View style={styles.performanceStat}>
                  <Text style={styles.performanceValue}>
                    {authorityResolutionPerformance.withinDeadline}
                  </Text>
                  <Text style={styles.performanceLabel}>Within deadline</Text>
                </View>
                <View style={styles.performanceStat}>
                  <Text style={[styles.performanceValue, styles.overdueValue]}>
                    {authorityResolutionPerformance.overdue}
                  </Text>
                  <Text style={styles.performanceLabel}>Overdue</Text>
                </View>
                <View style={styles.performanceStat}>
                  <Text style={styles.performanceValue}>
                    {authorityResolutionPerformance.averageDays}d
                  </Text>
                  <Text style={styles.performanceLabel}>Average time</Text>
                </View>
              </View>

              <View style={styles.performanceHeading}>
                <Text style={styles.performanceHeadingText}>
                  On-time resolution rate
                </Text>
                <Text style={styles.performanceRate}>
                  {authorityResolutionPerformance.onTimeRate}%
                </Text>
              </View>
              <View style={styles.performanceTrack}>
                <View
                  style={[
                    styles.performanceBar,
                    { width: `${authorityResolutionPerformance.onTimeRate}%` },
                  ]}
                />
              </View>
              <View style={styles.performanceFooter}>
                <Text style={styles.performanceFootnote}>
                  {authorityResolutionPerformance.resolved} complaints resolved
                </Text>
                <Text style={styles.performanceTarget}>
                  Target: ≤ {authorityResolutionPerformance.targetDays} days
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F7F8FA" },
  scrollContent: { paddingBottom: 34 },
  container: {
    width: "100%",
    maxWidth: 1180,
    alignSelf: "center",
    padding: 16,
    gap: 18,
  },
  hero: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 18,
  },
  heroCompact: { alignItems: "flex-start", flexDirection: "column" },
  heroCopy: { flex: 1 },
  eyebrow: {
    color: "#B9854B",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  title: { color: "#111827", fontSize: 25, fontWeight: "800", marginTop: 3 },
  subtitle: { color: "#6B7280", fontSize: 12, marginTop: 5 },
  reportButton: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 17,
    borderRadius: 22,
    backgroundColor: "#23435D",
  },
  reportButtonText: { color: "#FFFFFF", fontSize: 11, fontWeight: "800" },
  periodRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  periodLabel: { color: "#475467", fontSize: 11, fontWeight: "700" },
  periodButtons: { flexDirection: "row", gap: 7 },
  periodButton: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E6EB",
  },
  periodButtonActive: { backgroundColor: "#23435D", borderColor: "#23435D" },
  periodButtonText: { color: "#667085", fontSize: 10, fontWeight: "700" },
  periodButtonTextActive: { color: "#FFFFFF" },
  summaryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 13,
    padding: 14,
    borderWidth: 1,
    borderColor: "#ECEFF3",
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
  },
  summaryCardWide: { flex: 1, minWidth: 190 },
  summaryCardCompact: { width: "48%", minWidth: 150 },
  summaryIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryLabel: {
    color: "#667085",
    fontSize: 10,
    fontWeight: "600",
    marginTop: 10,
  },
  summaryValue: {
    color: "#1F2937",
    fontSize: 21,
    fontWeight: "800",
    marginTop: 3,
    fontVariant: ["tabular-nums"],
  },
  summaryChange: { fontSize: 9, fontWeight: "700", marginTop: 4 },
  generatedReport: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 13,
    backgroundColor: "#EAF8F1",
    borderWidth: 1,
    borderColor: "#CDEBDE",
  },
  generatedIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#16845B",
  },
  generatedCopy: { flex: 1 },
  generatedTitle: { color: "#165C43", fontSize: 13, fontWeight: "800" },
  generatedText: {
    color: "#4C7565",
    fontSize: 10,
    lineHeight: 15,
    marginTop: 3,
  },
  readyBadge: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 11,
    backgroundColor: "#D5F0E4",
  },
  readyText: { color: "#16845B", fontSize: 8, fontWeight: "900" },
  analyticsGrid: { gap: 14 },
  analyticsGridWide: { flexDirection: "row" },
  panel: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#ECEFF3",
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
  },
  panelHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 15,
  },
  panelTitle: { color: "#1F2937", fontSize: 15, fontWeight: "800" },
  panelSubtitle: { color: "#8A93A1", fontSize: 9, marginTop: 3 },
  statusBar: {
    height: 13,
    flexDirection: "row",
    borderRadius: 7,
    overflow: "hidden",
    backgroundColor: "#EEF1F4",
  },
  statusRows: { gap: 11, marginTop: 17 },
  statusRow: { flexDirection: "row", alignItems: "center" },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  statusLabel: { flex: 1, color: "#475467", fontSize: 11, fontWeight: "600" },
  statusValue: {
    width: 34,
    color: "#1F2937",
    fontSize: 11,
    fontWeight: "800",
    textAlign: "right",
    fontVariant: ["tabular-nums"],
  },
  statusPercent: {
    width: 38,
    color: "#8A93A1",
    fontSize: 9,
    textAlign: "right",
    fontVariant: ["tabular-nums"],
  },
  chart: {
    height: 190,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 7,
  },
  chartColumn: {
    flex: 1,
    height: "100%",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  chartValue: {
    color: "#5C6676",
    fontSize: 8,
    fontWeight: "700",
    marginBottom: 5,
  },
  chartTrack: {
    width: "72%",
    flex: 1,
    justifyContent: "flex-end",
    borderRadius: 7,
    overflow: "hidden",
    backgroundColor: "#F0F3F6",
  },
  chartBar: {
    width: "100%",
    minHeight: 8,
    borderRadius: 7,
    backgroundColor: "#3B82F6",
  },
  chartLabel: { color: "#7B8492", fontSize: 8, marginTop: 6 },
  categoryList: { gap: 13 },
  categoryRow: { gap: 5 },
  categoryTopLine: { flexDirection: "row", justifyContent: "space-between" },
  categoryLabel: { color: "#475467", fontSize: 10, fontWeight: "600" },
  categoryValue: {
    color: "#1F2937",
    fontSize: 10,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  categoryTrack: {
    height: 7,
    borderRadius: 4,
    backgroundColor: "#EEF1F4",
    overflow: "hidden",
  },
  categoryBar: { height: "100%", borderRadius: 4 },
  performanceGrid: { flexDirection: "row", gap: 8, marginBottom: 18 },
  performanceStat: {
    flex: 1,
    minHeight: 72,
    justifyContent: "center",
    padding: 11,
    borderRadius: 11,
    backgroundColor: "#F8FAFB",
  },
  performanceValue: {
    color: "#16845B",
    fontSize: 18,
    fontWeight: "900",
    fontVariant: ["tabular-nums"],
  },
  overdueValue: { color: "#E0524D" },
  performanceLabel: {
    color: "#7A8493",
    fontSize: 8,
    fontWeight: "700",
    marginTop: 4,
  },
  performanceHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  performanceHeadingText: { color: "#475467", fontSize: 10, fontWeight: "700" },
  performanceRate: { color: "#16845B", fontSize: 16, fontWeight: "900" },
  performanceTrack: {
    height: 10,
    overflow: "hidden",
    borderRadius: 5,
    backgroundColor: "#E6ECE9",
    marginTop: 8,
  },
  performanceBar: {
    height: "100%",
    borderRadius: 5,
    backgroundColor: "#16845B",
  },
  performanceFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    marginTop: 8,
  },
  performanceFootnote: { color: "#8A93A1", fontSize: 8 },
  performanceTarget: { color: "#16845B", fontSize: 8, fontWeight: "800" },
  hotspotList: { gap: 10 },
  hotspotRow: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 10,
    borderRadius: 11,
    backgroundColor: "#FAFBFC",
  },
  hotspotRank: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF1E5",
  },
  hotspotRankText: { color: "#C57C1B", fontSize: 10, fontWeight: "900" },
  hotspotCopy: { flex: 1 },
  hotspotLocation: { color: "#293241", fontSize: 10, fontWeight: "700" },
  hotspotCategory: { color: "#8A93A1", fontSize: 9, marginTop: 3 },
  signalBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: "#FFF7E8",
  },
  signalText: {
    color: "#A7640C",
    fontSize: 10,
    fontWeight: "900",
    fontVariant: ["tabular-nums"],
  },
});
