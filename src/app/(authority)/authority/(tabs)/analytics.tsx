import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useMemo, useState, type ComponentProps, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { analyticsPeriods, buildAuthorityAnalytics, formatAnalyticsDays, getAnalyticsArea, type AnalyticsDistribution, type AnalyticsPeriod } from '@/components/authority/authority-analytics';
import { useAuthorityComplaints } from '@/components/authority/authority-complaints-context';
import AuthorityPageHeader from '@/components/authority/authority-page-header';

type IconName = ComponentProps<typeof Ionicons>['name'];

function Panel({ title, subtitle, icon, children }: { title: string; subtitle: string; icon: IconName; children: ReactNode }) {
  return (
    <View style={styles.panel}>
      <View style={styles.panelHeader}>
        <View style={styles.panelHeading}>
          <Text style={styles.panelTitle}>{title}</Text>
          <Text style={styles.panelSubtitle}>{subtitle}</Text>
        </View>
        <Ionicons name={icon} size={21} color="#23435D" />
      </View>
      {children}
    </View>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <View style={styles.empty}>
      <Ionicons name="bar-chart-outline" size={24} color="#A7AFBA" />
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

function Distribution({ items, emptyText }: { items: AnalyticsDistribution[]; emptyText: string }) {
  if (items.length === 0) return <Empty text={emptyText} />;
  return (
    <View style={styles.distributionList}>
      {items.map((item) => (
        <View key={item.label} style={styles.distributionRow}>
          <View style={styles.distributionHeading}>
            <Text numberOfLines={1} style={styles.distributionLabel}>{item.label}</Text>
            <Text style={styles.distributionValue}>{item.value} · {item.percent}%</Text>
          </View>
          <View style={styles.track}>
            <View style={[styles.distributionBar, { width: `${item.percent}%`, backgroundColor: item.color }]} />
          </View>
        </View>
      ))}
    </View>
  );
}

export default function AuthorityAnalytics() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { complaints, loading, error, refreshComplaints } = useAuthorityComplaints();
  const [period, setPeriod] = useState<AnalyticsPeriod>('30 Days');
  const analytics = useMemo(() => buildAuthorityAnalytics(complaints, period), [complaints, period]);
  const wide = width >= 900;
  const maxTrend = Math.max(1, ...analytics.trend.map((item) => item.value));
  const trendTitle = period === '7 Days' ? 'Daily Complaint Trend' : period === '30 Days' ? 'Six-day Complaint Trend' : 'Monthly Complaint Trend';
  const summary: { label: string; value: string; detail: string; icon: IconName; color: string; background: string }[] = [
    { label: 'Total Complaints', value: String(analytics.total), detail: `Submitted during ${period.toLowerCase()}`, icon: 'documents-outline', color: '#3B82F6', background: '#EEF6FF' },
    { label: 'In Progress', value: String(analytics.inProgress), detail: 'Current status in this period', icon: 'construct-outline', color: '#C67B00', background: '#FFF7E8' },
    { label: 'Resolution Rate', value: `${analytics.resolutionRate}%`, detail: `${analytics.resolved} of ${analytics.total} resolved`, icon: 'checkmark-done-outline', color: '#16845B', background: '#EAF8F1' },
    { label: 'Average Resolution', value: formatAnalyticsDays(analytics.averageResolutionDays), detail: 'Submission to recorded resolution', icon: 'timer-outline', color: '#7C6BC4', background: '#F2EFFE' },
  ];

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <AuthorityPageHeader
        title="Home"
        icon="home-outline"
        onBack={() => router.navigate('/authority/dashboard' as never)}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void refreshComplaints()} colors={['#23435D']} tintColor="#23435D" />}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.container}>
          <View style={styles.hero}>
            <View style={styles.heroIcon}><Ionicons name="analytics-outline" size={28} color="#FFFFFF" /></View>
            <View style={styles.heroCopy}>
              <Text style={styles.eyebrow}>AUTHORITY PERFORMANCE</Text>
              <Text style={styles.title}>Complaint Analytics</Text>
              <Text style={styles.subtitle}>Live insights from complaint, work-update, resolution, deadline, location, and additional-report records.</Text>
            </View>
          </View>

          <View style={styles.periodRow}>
            <View><Text style={styles.periodLabel}>Analytics period</Text><Text style={styles.periodHint}>Grouped by complaint submission date</Text></View>
            <View style={styles.periodButtons}>
              {analyticsPeriods.map((item) => (
                <Pressable key={item} accessibilityRole="button" accessibilityState={{ selected: period === item }} onPress={() => setPeriod(item)} style={[styles.periodButton, period === item && styles.periodButtonActive]}>
                  <Text style={[styles.periodButtonText, period === item && styles.periodButtonTextActive]}>{item}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {error && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle-outline" size={20} color="#B42318" />
              <View style={styles.errorCopy}><Text style={styles.errorTitle}>Analytics could not be refreshed</Text><Text style={styles.errorText}>{error}</Text></View>
              <TouchableOpacity onPress={() => void refreshComplaints()} style={styles.retry}><Text style={styles.retryText}>Retry</Text></TouchableOpacity>
            </View>
          )}

          {loading && complaints.length === 0 ? (
            <View style={styles.loading}><ActivityIndicator color="#23435D" /><Text style={styles.loadingText}>Loading complaint analytics…</Text></View>
          ) : (
            <>
              <View style={styles.summaryGrid}>
                {summary.map((item) => (
                  <View key={item.label} style={[styles.summaryCard, wide ? styles.summaryWide : styles.summaryCompact]}>
                    <View style={[styles.summaryIcon, { backgroundColor: item.background }]}><Ionicons name={item.icon} size={21} color={item.color} /></View>
                    <Text style={styles.summaryLabel}>{item.label}</Text>
                    <Text style={styles.summaryValue}>{item.value}</Text>
                    <Text style={styles.summaryDetail}>{item.detail}</Text>
                  </View>
                ))}
              </View>

              <View style={[styles.grid, wide && styles.gridWide]}>
                <Panel title="Status Distribution" subtitle={`${analytics.total} complaints in this period`} icon="pie-chart-outline">
                  {analytics.total === 0 ? <Empty text="No complaints were submitted in this period." /> : (
                    <>
                      <View style={styles.statusBar}>{analytics.statusDistribution.map((item) => <View key={item.label} style={{ width: `${item.percent}%`, backgroundColor: item.color }} />)}</View>
                      <View style={styles.statusRows}>{analytics.statusDistribution.map((item) => (
                        <View key={item.label} style={styles.statusRow}><View style={[styles.dot, { backgroundColor: item.color }]} /><Text style={styles.statusLabel}>{item.label}</Text><Text style={styles.statusValue}>{item.value}</Text><Text style={styles.statusPercent}>{item.percent}%</Text></View>
                      ))}</View>
                    </>
                  )}
                </Panel>
                <Panel title={trendTitle} subtitle={`Complaint submissions during ${period.toLowerCase()}`} icon="trending-up-outline">
                  <View style={styles.chart}>{analytics.trend.map((item) => (
                    <View key={item.label} style={styles.chartColumn}><Text style={styles.chartValue}>{item.value}</Text><View style={styles.chartTrack}><View style={[styles.chartBar, { height: `${Math.max(5, Math.round((item.value / maxTrend) * 100))}%` }]} /></View><Text numberOfLines={1} style={styles.chartLabel}>{item.label}</Text></View>
                  ))}</View>
                </Panel>
              </View>

              <View style={[styles.grid, wide && styles.gridWide]}>
                <Panel title="Top Categories" subtitle="Share of complaints by issue type" icon="layers-outline">
                  <Distribution items={analytics.categoryDistribution} emptyText="Category data will appear when complaints are submitted." />
                </Panel>
                <Panel title="Complaints by Area" subtitle="Grouped by stored avenue, then road" icon="location-outline">
                  <Distribution items={analytics.areaDistribution} emptyText="Avenue and road data will appear here." />
                </Panel>
              </View>

              <View style={[styles.grid, wide && styles.gridWide]}>
                <Panel title="Operational Performance" subtitle="From work history, deadlines, and resolutions" icon="speedometer-outline">
                  <View style={styles.performanceGrid}>
                    <View style={styles.performanceStat}><Text style={styles.performanceValue}>{formatAnalyticsDays(analytics.averageStartDays)}</Text><Text style={styles.performanceLabel}>Average time to start</Text></View>
                    <View style={styles.performanceStat}><Text style={[styles.performanceValue, analytics.overdueOpen > 0 && styles.warning]}>{analytics.overdueOpen}</Text><Text style={styles.performanceLabel}>Open complaints overdue</Text></View>
                    <View style={styles.performanceStat}><Text style={styles.performanceValue}>{analytics.totalAdditionalReports}</Text><Text style={styles.performanceLabel}>Additional resident reports</Text></View>
                  </View>
                  <View style={styles.performanceHeading}><Text style={styles.performanceHeadingText}>On-time resolved complaints</Text><Text style={styles.performanceRate}>{analytics.onTimeRate === null ? '—' : `${analytics.onTimeRate}%`}</Text></View>
                  <View style={styles.performanceTrack}><View style={[styles.performanceBar, { width: `${analytics.onTimeRate ?? 0}%` }]} /></View>
                  <Text style={styles.performanceFootnote}>{analytics.deadlineResolved === 0 ? 'No resolved complaints in this period have a recorded deadline.' : `${analytics.withinDeadline} of ${analytics.deadlineResolved} complaints with deadlines were resolved on time.`}</Text>
                </Panel>

                <Panel title="Additional Reports" subtitle="Complaints also reported by other residents" icon="people-outline">
                  {analytics.additionalReports.length === 0 ? <Empty text="No additional resident reports were recorded in this period." /> : (
                    <View style={styles.reportList}>{analytics.additionalReports.map((item, index) => (
                      <TouchableOpacity key={item.id} onPress={() => router.push({ pathname: '/authority/complaints/[complaintId]', params: { complaintId: item.id } } as never)} style={styles.reportRow}>
                        <View style={styles.reportRank}><Text style={styles.reportRankText}>{index + 1}</Text></View>
                        <View style={styles.reportCopy}><Text numberOfLines={1} style={styles.reportTitle}>{item.title}</Text><Text numberOfLines={1} style={styles.reportMeta}>{item.category} · {getAnalyticsArea(item)}</Text></View>
                        <View style={styles.reportBadge}><Ionicons name="person-add-outline" size={14} color="#9A672C" /><Text style={styles.reportBadgeText}>{item.duplicateReportCount}</Text></View>
                      </TouchableOpacity>
                    ))}</View>
                  )}
                </Panel>
              </View>

              <View style={styles.feedbackPlaceholder}>
                <View style={styles.feedbackIcon}><Ionicons name="chatbox-ellipses-outline" size={26} color="#7C6BC4" /></View>
                <View style={styles.feedbackCopy}>
                  <View style={styles.feedbackTitleRow}><Text style={styles.feedbackTitle}>Resident Feedback Analytics</Text><View style={styles.futureBadge}><Text style={styles.futureText}>FUTURE</Text></View></View>
                  <Text style={styles.feedbackText}>Reserved for average ratings, satisfaction trends, rating distribution, and feedback coverage after the feedback table is added.</Text>
                </View>
                <View style={styles.feedbackMetrics}>{['Average rating', 'Satisfaction', 'Responses'].map((label) => <View key={label} style={styles.feedbackMetric}><Text style={styles.feedbackMetricValue}>—</Text><Text style={styles.feedbackMetricLabel}>{label}</Text></View>)}</View>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F6F8FA' }, scrollContent: { paddingBottom: 38 }, container: { width: '100%', maxWidth: 1120, alignSelf: 'center', padding: 16, gap: 16 },
  hero: { flexDirection: 'row', alignItems: 'center', gap: 15, padding: 20, borderRadius: 18, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#EAEDF1' }, heroIcon: { width: 54, height: 54, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: '#23435D' }, heroCopy: { flex: 1, minWidth: 0 }, eyebrow: { color: '#B9854B', fontSize: 9, fontWeight: '900', letterSpacing: 0.8 }, title: { color: '#111827', fontSize: 25, fontWeight: '800', marginTop: 2 }, subtitle: { maxWidth: 720, color: '#667085', fontSize: 10, lineHeight: 16, marginTop: 5 },
  periodRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }, periodLabel: { color: '#344054', fontSize: 11, fontWeight: '800' }, periodHint: { color: '#98A2B3', fontSize: 8, marginTop: 3 }, periodButtons: { flexDirection: 'row', gap: 7 }, periodButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 17, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E6EB' }, periodButtonActive: { backgroundColor: '#23435D', borderColor: '#23435D' }, periodButtonText: { color: '#667085', fontSize: 10, fontWeight: '700' }, periodButtonTextActive: { color: '#FFF' },
  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 13, borderRadius: 13, backgroundColor: '#FEF3F2', borderWidth: 1, borderColor: '#FECDCA' }, errorCopy: { flex: 1 }, errorTitle: { color: '#912018', fontSize: 11, fontWeight: '800' }, errorText: { color: '#B42318', fontSize: 9, marginTop: 2 }, retry: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 15, backgroundColor: '#FFF' }, retryText: { color: '#B42318', fontSize: 9, fontWeight: '800' }, loading: { minHeight: 180, alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: 15, backgroundColor: '#FFF' }, loadingText: { color: '#667085', fontSize: 10 },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 }, summaryCard: { backgroundColor: '#FFF', borderRadius: 14, padding: 15, borderWidth: 1, borderColor: '#ECEFF3', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }, summaryWide: { flex: 1, minWidth: 205 }, summaryCompact: { width: '48%', minWidth: 150 }, summaryIcon: { width: 39, height: 39, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, summaryLabel: { color: '#667085', fontSize: 10, fontWeight: '700', marginTop: 11 }, summaryValue: { color: '#1F2937', fontSize: 21, fontWeight: '900', marginTop: 3 }, summaryDetail: { color: '#98A2B3', fontSize: 8, lineHeight: 12, marginTop: 4 },
  grid: { gap: 14 }, gridWide: { flexDirection: 'row' }, panel: { flex: 1, minWidth: 0, backgroundColor: '#FFF', borderRadius: 15, padding: 16, borderWidth: 1, borderColor: '#ECEFF3', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }, panelHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16 }, panelHeading: { flex: 1, minWidth: 0 }, panelTitle: { color: '#1F2937', fontSize: 15, fontWeight: '800' }, panelSubtitle: { color: '#8A93A1', fontSize: 9, lineHeight: 13, marginTop: 3 }, empty: { minHeight: 130, alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 20, borderRadius: 12, backgroundColor: '#F8FAFB' }, emptyText: { color: '#8A93A1', fontSize: 9, lineHeight: 14, textAlign: 'center' },
  statusBar: { height: 13, flexDirection: 'row', borderRadius: 7, overflow: 'hidden', backgroundColor: '#EEF1F4' }, statusRows: { gap: 11, marginTop: 17 }, statusRow: { flexDirection: 'row', alignItems: 'center' }, dot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 }, statusLabel: { flex: 1, color: '#475467', fontSize: 11, fontWeight: '600' }, statusValue: { width: 34, color: '#1F2937', fontSize: 11, fontWeight: '800', textAlign: 'right' }, statusPercent: { width: 42, color: '#8A93A1', fontSize: 9, textAlign: 'right' },
  chart: { height: 190, flexDirection: 'row', alignItems: 'flex-end', gap: 5 }, chartColumn: { flex: 1, height: '100%', minWidth: 0, alignItems: 'center', justifyContent: 'flex-end' }, chartValue: { color: '#5C6676', fontSize: 8, fontWeight: '700', marginBottom: 5 }, chartTrack: { width: '70%', flex: 1, justifyContent: 'flex-end', borderRadius: 7, overflow: 'hidden', backgroundColor: '#F0F3F6' }, chartBar: { width: '100%', minHeight: 5, borderRadius: 7, backgroundColor: '#3B82F6' }, chartLabel: { width: '100%', color: '#7B8492', fontSize: 7, textAlign: 'center', marginTop: 6 },
  distributionList: { gap: 14 }, distributionRow: { gap: 6 }, distributionHeading: { flexDirection: 'row', alignItems: 'center', gap: 10 }, distributionLabel: { flex: 1, color: '#475467', fontSize: 10, fontWeight: '600' }, distributionValue: { color: '#1F2937', fontSize: 9, fontWeight: '800' }, track: { height: 7, borderRadius: 4, backgroundColor: '#EEF1F4', overflow: 'hidden' }, distributionBar: { height: '100%', minWidth: 3, borderRadius: 4 },
  performanceGrid: { flexDirection: 'row', gap: 8, marginBottom: 18 }, performanceStat: { flex: 1, minHeight: 82, justifyContent: 'center', padding: 11, borderRadius: 11, backgroundColor: '#F8FAFB' }, performanceValue: { color: '#16845B', fontSize: 16, fontWeight: '900' }, warning: { color: '#E0524D' }, performanceLabel: { color: '#7A8493', fontSize: 8, lineHeight: 12, fontWeight: '700', marginTop: 5 }, performanceHeading: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 }, performanceHeadingText: { color: '#475467', fontSize: 10, fontWeight: '700' }, performanceRate: { color: '#16845B', fontSize: 16, fontWeight: '900' }, performanceTrack: { height: 10, overflow: 'hidden', borderRadius: 5, backgroundColor: '#E6ECE9', marginTop: 8 }, performanceBar: { height: '100%', borderRadius: 5, backgroundColor: '#16845B' }, performanceFootnote: { color: '#8A93A1', fontSize: 8, lineHeight: 12, marginTop: 8 },
  reportList: { gap: 9 }, reportRow: { minHeight: 61, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 11, backgroundColor: '#FAFBFC' }, reportRank: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF4E8' }, reportRankText: { color: '#9A672C', fontSize: 10, fontWeight: '900' }, reportCopy: { flex: 1, minWidth: 0 }, reportTitle: { color: '#293241', fontSize: 10, fontWeight: '700' }, reportMeta: { color: '#8A93A1', fontSize: 8, marginTop: 4 }, reportBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 6, borderRadius: 12, backgroundColor: '#FFF4E8' }, reportBadgeText: { color: '#9A672C', fontSize: 10, fontWeight: '900' },
  feedbackPlaceholder: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 14, padding: 18, borderRadius: 16, backgroundColor: '#FAF9FE', borderWidth: 1, borderStyle: 'dashed', borderColor: '#CFC8EB' }, feedbackIcon: { width: 48, height: 48, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EEEAFB' }, feedbackCopy: { flex: 1, minWidth: 230 }, feedbackTitleRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 }, feedbackTitle: { color: '#3E365C', fontSize: 14, fontWeight: '800' }, futureBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, backgroundColor: '#EEEAFB' }, futureText: { color: '#6B5CA5', fontSize: 7, fontWeight: '900' }, feedbackText: { color: '#77708D', fontSize: 9, lineHeight: 14, marginTop: 5 }, feedbackMetrics: { flexDirection: 'row', gap: 8 }, feedbackMetric: { minWidth: 76, alignItems: 'center', padding: 10, borderRadius: 11, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E9E5F5' }, feedbackMetricValue: { color: '#8A82A1', fontSize: 17, fontWeight: '900' }, feedbackMetricLabel: { color: '#958DA8', fontSize: 7, fontWeight: '700', marginTop: 3 },
});
