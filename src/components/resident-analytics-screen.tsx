import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, useEffect, useMemo, useState, type ComponentProps, type ReactNode } from 'react';
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import BottomNav from '@/components/BottomNav';
import ResidentPageHeader from '@/components/resident-page-header';
import { buildResidentAnalytics, residentAnalyticsPeriods, type ResidentAnalyticsDistribution, type ResidentAnalyticsPeriod } from '@/components/resident-analytics';
import { generateResidentAnalyticsPdf } from '@/services/resident-analytics-report.service';
import { getAnalyticsData, type ResidentAnalyticsComplaint } from '@/services/resident.service';

type IconName = ComponentProps<typeof Ionicons>['name'];
type AnalyticsScope = 'ALL' | 'MY';

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

function Distribution({ items, emptyText }: { items: ResidentAnalyticsDistribution[]; emptyText: string }) {
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

export default function ResidentAnalyticsScreen() {
  const { width } = useWindowDimensions();
  const [scope, setScope] = useState<AnalyticsScope>('ALL');
  const [period, setPeriod] = useState<ResidentAnalyticsPeriod>('30 Days');
  const [data, setData] = useState<{ all: ResidentAnalyticsComplaint[]; my: ResidentAnalyticsComplaint[] }>({ all: [], my: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await getAnalyticsData());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load analytics.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    getAnalyticsData()
      .then((nextData) => {
        if (!cancelled) setData(nextData);
      })
      .catch((loadError) => {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load analytics.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const complaints = scope === 'ALL' ? data.all : data.my;
  const analytics = useMemo(() => buildResidentAnalytics(complaints, period), [complaints, period]);
  const wide = width >= 900;
  const scopeLabel = scope === 'ALL' ? 'All Complaints' : 'My Complaints';
  const summary: { label: string; value: string; detail: string; icon: IconName; color: string; background: string }[] = [
    { label: 'Total Complaints', value: String(analytics.total), detail: `${scopeLabel} submitted during ${period.toLowerCase()}`, icon: 'documents-outline', color: '#3B82F6', background: '#EEF6FF' },
    { label: 'Pending', value: String(analytics.pending), detail: 'Accepted and waiting for work to begin', icon: 'time-outline', color: '#E0524D', background: '#FEF2F2' },
    { label: 'In Progress', value: String(analytics.inProgress), detail: 'Complaints currently being handled', icon: 'construct-outline', color: '#C67B00', background: '#FFF7E8' },
    { label: 'Resolution Rate', value: `${analytics.resolutionRate}%`, detail: `${analytics.resolved} of ${analytics.total} resolved`, icon: 'checkmark-done-outline', color: '#16845B', background: '#EAF8F1' },
  ];

  const handleGeneratePdf = async () => {
    if (analytics.total === 0 || isGeneratingPdf) return;
    setIsGeneratingPdf(true);
    try {
      const result = await generateResidentAnalyticsPdf({ analytics, period, scope: scopeLabel });
      if (result.uri && !result.shared) Alert.alert('PDF created', `The report was created at ${result.uri}`);
    } catch (reportError) {
      console.error('Failed to generate resident analytics PDF:', reportError);
      Alert.alert('Report failed', 'Unable to create the analytics PDF. Please try again.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <ResidentPageHeader />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void loadData()} colors={['#23435D']} tintColor="#23435D" />}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.container}>
          <View style={styles.hero}>
            <View style={styles.heroIcon}><Ionicons name="analytics-outline" size={28} color="#FFFFFF" /></View>
            <View style={styles.heroCopy}>
              <Text style={styles.eyebrow}>COMMUNITY INSIGHTS</Text>
              <Text style={styles.title}>Complaint Analytics</Text>
              <Text style={styles.subtitle}>Understand complaint status, resolution, categories, and affected areas.</Text>
            </View>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={`Download ${scopeLabel.toLowerCase()} PDF`}
              accessibilityHint="Creates a data report for the selected scope and reporting period"
              disabled={analytics.total === 0 || isGeneratingPdf}
              onPress={() => void handleGeneratePdf()}
              style={[styles.reportButton, (analytics.total === 0 || isGeneratingPdf) && styles.reportButtonDisabled]}
            >
              {isGeneratingPdf ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Ionicons name="document-text-outline" size={18} color="#FFFFFF" />}
              <Text style={styles.reportButtonText}>{isGeneratingPdf ? 'Preparing PDF…' : scope === 'ALL' ? 'Download All PDF' : 'Download My PDF'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.selectionPanel}>
            <View>
              <Text style={styles.selectionLabel}>Complaint scope</Text>
              <View style={styles.scopeButtons}>
                {(['ALL', 'MY'] as const).map((item) => (
                  <Pressable key={item} onPress={() => setScope(item)} style={[styles.scopeButton, scope === item && styles.scopeButtonActive]}>
                    <Text style={[styles.scopeButtonText, scope === item && styles.scopeButtonTextActive]}>{item === 'ALL' ? 'All Complaints' : 'My Complaints'}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
            <View>
              <Text style={styles.selectionLabel}>Reporting period</Text>
              <View style={styles.periodButtons}>
                {residentAnalyticsPeriods.map((item) => (
                  <Pressable key={item} onPress={() => setPeriod(item)} style={[styles.periodButton, period === item && styles.periodButtonActive]}>
                    <Text style={[styles.periodButtonText, period === item && styles.periodButtonTextActive]}>{item}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>

          {error && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle-outline" size={20} color="#B42318" />
              <View style={styles.errorCopy}><Text style={styles.errorTitle}>Analytics could not be loaded</Text><Text style={styles.errorText}>{error}</Text></View>
              <TouchableOpacity onPress={() => void loadData()} style={styles.retry}><Text style={styles.retryText}>Retry</Text></TouchableOpacity>
            </View>
          )}

          {loading && data.all.length === 0 ? (
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

              <Panel title="Current Status" subtitle={`${analytics.total} ${scopeLabel.toLowerCase()} submitted in this period`} icon="pie-chart-outline">
                {analytics.total === 0 ? <Empty text="No accepted complaints were submitted in this period." /> : (
                  <>
                    <View style={styles.statusBar}>{analytics.statusDistribution.map((item) => <View key={item.label} style={{ width: `${item.percent}%`, backgroundColor: item.color }} />)}</View>
                    <View style={styles.statusRows}>{analytics.statusDistribution.map((item) => (
                      <View key={item.label} style={styles.statusRow}><View style={[styles.dot, { backgroundColor: item.color }]} /><Text style={styles.statusLabel}>{item.label}</Text><Text style={styles.statusValue}>{item.value}</Text><Text style={styles.statusPercent}>{item.percent}%</Text></View>
                    ))}</View>
                  </>
                )}
              </Panel>

              <View style={[styles.grid, wide && styles.gridWide]}>
                <Panel title="Top Complaint Categories" subtitle="Up to six categories by share of submitted complaints" icon="layers-outline">
                  <Distribution items={analytics.categoryDistribution} emptyText="Category data will appear when complaints are submitted." />
                </Panel>
                <Panel title="Top Complaint Areas" subtitle="Up to six areas; avenue first, otherwise road" icon="location-outline">
                  <Distribution items={analytics.areaDistribution} emptyText="Avenue and road data will appear here." />
                </Panel>
              </View>
            </>
          )}
        </View>
      </ScrollView>
      <BottomNav activeRoute="analytics" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F6F8FA' }, scrollContent: { paddingBottom: 38 }, container: { width: '100%', maxWidth: 1120, alignSelf: 'center', padding: 16, gap: 16 },
  hero: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 15, padding: 20, borderRadius: 18, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#EAEDF1' }, heroIcon: { width: 54, height: 54, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: '#23435D' }, heroCopy: { flex: 1, minWidth: 210 }, eyebrow: { color: '#B9854B', fontSize: 9, fontWeight: '900', letterSpacing: 0.8 }, title: { color: '#111827', fontSize: 25, fontWeight: '800', marginTop: 2 }, subtitle: { maxWidth: 720, color: '#667085', fontSize: 10, lineHeight: 16, marginTop: 5 },
  reportButton: { minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingHorizontal: 15, borderRadius: 21, backgroundColor: '#23435D' }, reportButtonDisabled: { opacity: 0.5 }, reportButtonText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800' },
  selectionPanel: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }, selectionLabel: { color: '#344054', fontSize: 10, fontWeight: '800', marginBottom: 6 }, scopeButtons: { flexDirection: 'row', padding: 4, borderRadius: 18, backgroundColor: '#E8EDF4' }, scopeButton: { paddingHorizontal: 13, paddingVertical: 7, borderRadius: 14 }, scopeButtonActive: { backgroundColor: '#23435D' }, scopeButtonText: { color: '#667085', fontSize: 9, fontWeight: '700' }, scopeButtonTextActive: { color: '#FFFFFF' }, periodButtons: { flexDirection: 'row', gap: 7 }, periodButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 17, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E6EB' }, periodButtonActive: { backgroundColor: '#23435D', borderColor: '#23435D' }, periodButtonText: { color: '#667085', fontSize: 10, fontWeight: '700' }, periodButtonTextActive: { color: '#FFF' },
  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 13, borderRadius: 13, backgroundColor: '#FEF3F2', borderWidth: 1, borderColor: '#FECDCA' }, errorCopy: { flex: 1 }, errorTitle: { color: '#912018', fontSize: 11, fontWeight: '800' }, errorText: { color: '#B42318', fontSize: 9, marginTop: 2 }, retry: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 15, backgroundColor: '#FFF' }, retryText: { color: '#B42318', fontSize: 9, fontWeight: '800' }, loading: { minHeight: 180, alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: 15, backgroundColor: '#FFF' }, loadingText: { color: '#667085', fontSize: 10 },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 }, summaryCard: { backgroundColor: '#FFF', borderRadius: 14, padding: 15, borderWidth: 1, borderColor: '#ECEFF3', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }, summaryWide: { flex: 1, minWidth: 205 }, summaryCompact: { width: '48%', minWidth: 150 }, summaryIcon: { width: 39, height: 39, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, summaryLabel: { color: '#667085', fontSize: 10, fontWeight: '700', marginTop: 11 }, summaryValue: { color: '#1F2937', fontSize: 21, fontWeight: '900', marginTop: 3 }, summaryDetail: { color: '#98A2B3', fontSize: 8, lineHeight: 12, marginTop: 4 },
  grid: { gap: 14 }, gridWide: { flexDirection: 'row' }, panel: { flex: 1, minWidth: 0, backgroundColor: '#FFF', borderRadius: 15, padding: 16, borderWidth: 1, borderColor: '#ECEFF3', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }, panelHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16 }, panelHeading: { flex: 1, minWidth: 0 }, panelTitle: { color: '#1F2937', fontSize: 15, fontWeight: '800' }, panelSubtitle: { color: '#8A93A1', fontSize: 9, lineHeight: 13, marginTop: 3 }, empty: { minHeight: 130, alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 20, borderRadius: 12, backgroundColor: '#F8FAFB' }, emptyText: { color: '#8A93A1', fontSize: 9, lineHeight: 14, textAlign: 'center' },
  statusBar: { height: 13, flexDirection: 'row', borderRadius: 7, overflow: 'hidden', backgroundColor: '#EEF1F4' }, statusRows: { gap: 11, marginTop: 17 }, statusRow: { flexDirection: 'row', alignItems: 'center' }, dot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 }, statusLabel: { flex: 1, color: '#475467', fontSize: 11, fontWeight: '600' }, statusValue: { width: 34, color: '#1F2937', fontSize: 11, fontWeight: '800', textAlign: 'right' }, statusPercent: { width: 42, color: '#8A93A1', fontSize: 9, textAlign: 'right' },
  distributionList: { gap: 14 }, distributionRow: { gap: 6 }, distributionHeading: { flexDirection: 'row', alignItems: 'center', gap: 10 }, distributionLabel: { flex: 1, color: '#475467', fontSize: 10, fontWeight: '600' }, distributionValue: { color: '#1F2937', fontSize: 9, fontWeight: '800' }, track: { height: 7, borderRadius: 4, backgroundColor: '#EEF1F4', overflow: 'hidden' }, distributionBar: { height: '100%', minWidth: 3, borderRadius: 4 },
});
