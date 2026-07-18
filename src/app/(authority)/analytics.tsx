import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AuthorityPageHeader from '../../components/authority/authority-page-header';
import {
  authorityAnalyticsSummary,
  authorityCategoryDistribution,
  authorityStatusDistribution,
  authorityUrgencyHotspots,
  authorityWeeklyTrend,
} from '../../components/authority/store-authority-analytics';

const periods = ['7 Days', '30 Days', 'This Year'] as const;

export default function AuthorityAnalytics() {
  const { width } = useWindowDimensions();
  const [period, setPeriod] = useState<(typeof periods)[number]>('30 Days');
  const [reportGenerated, setReportGenerated] = useState(false);
  const wide = width >= 900;
  const maxWeekly = useMemo(() => Math.max(...authorityWeeklyTrend.map((item) => item.value)), []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <AuthorityPageHeader title="Dashboard" />
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
              <Text style={styles.subtitle}>Review complaint trends, resolution performance, and urgency hotspots.</Text>
            </View>
            <TouchableOpacity style={styles.reportButton} onPress={() => setReportGenerated(true)}>
              <Ionicons name={reportGenerated ? 'checkmark-circle-outline' : 'document-text-outline'} size={19} color="#FFFFFF" />
              <Text style={styles.reportButtonText}>{reportGenerated ? 'Report Generated' : 'Generate Total Report'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.periodRow}>
            <Text style={styles.periodLabel}>Report period</Text>
            <View style={styles.periodButtons}>
              {periods.map((item) => (
                <Pressable
                  key={item}
                  onPress={() => setPeriod(item)}
                  style={[styles.periodButton, period === item && styles.periodButtonActive]}
                >
                  <Text style={[styles.periodButtonText, period === item && styles.periodButtonTextActive]}>{item}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.summaryGrid}>
            {authorityAnalyticsSummary.map((item) => (
              <View key={item.label} style={[styles.summaryCard, wide ? styles.summaryCardWide : styles.summaryCardCompact]}>
                <View style={[styles.summaryIcon, { backgroundColor: item.background }]}> 
                  <Ionicons name={item.icon} size={21} color={item.color} />
                </View>
                <Text style={styles.summaryLabel}>{item.label}</Text>
                <Text style={styles.summaryValue}>{item.value}</Text>
                <Text style={[styles.summaryChange, { color: item.color }]}>{item.change}</Text>
              </View>
            ))}
          </View>

          {reportGenerated && (
            <View style={styles.generatedReport}>
              <View style={styles.generatedIcon}>
                <Ionicons name="document-text" size={23} color="#FFFFFF" />
              </View>
              <View style={styles.generatedCopy}>
                <Text style={styles.generatedTitle}>Total authority report generated</Text>
                <Text style={styles.generatedText}>
                  The {period.toLowerCase()} report includes 128 complaints, status distribution, category trends,
                  resolution performance, and urgency hotspots.
                </Text>
              </View>
              <View style={styles.readyBadge}><Text style={styles.readyText}>READY</Text></View>
            </View>
          )}

          <View style={[styles.analyticsGrid, wide && styles.analyticsGridWide]}>
            <View style={styles.panel}>
              <View style={styles.panelHeader}>
                <View>
                  <Text style={styles.panelTitle}>Status Distribution</Text>
                  <Text style={styles.panelSubtitle}>128 assigned complaints</Text>
                </View>
                <Ionicons name="pie-chart-outline" size={21} color="#23435D" />
              </View>
              <View style={styles.statusBar}>
                {authorityStatusDistribution.map((item) => (
                  <View key={item.label} style={{ width: `${item.percent}%`, backgroundColor: item.color }} />
                ))}
              </View>
              <View style={styles.statusRows}>
                {authorityStatusDistribution.map((item) => (
                  <View key={item.label} style={styles.statusRow}>
                    <View style={[styles.dot, { backgroundColor: item.color }]} />
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
                  <Text style={styles.panelTitle}>Weekly Complaint Trend</Text>
                  <Text style={styles.panelSubtitle}>Reports received by day</Text>
                </View>
                <Ionicons name="trending-up-outline" size={21} color="#23435D" />
              </View>
              <View style={styles.chart}>
                {authorityWeeklyTrend.map((item) => (
                  <View key={item.label} style={styles.chartColumn}>
                    <Text style={styles.chartValue}>{item.value}</Text>
                    <View style={styles.chartTrack}>
                      <View style={[styles.chartBar, { height: `${Math.round((item.value / maxWeekly) * 100)}%` }]} />
                    </View>
                    <Text style={styles.chartLabel}>{item.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          <View style={[styles.analyticsGrid, wide && styles.analyticsGridWide]}>
            <View style={styles.panel}>
              <View style={styles.panelHeader}>
                <View>
                  <Text style={styles.panelTitle}>Top Categories</Text>
                  <Text style={styles.panelSubtitle}>Complaint volume by issue type</Text>
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
                      <View style={[styles.categoryBar, { width: `${item.percent}%`, backgroundColor: item.color }]} />
                    </View>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.panel}>
              <View style={styles.panelHeader}>
                <View>
                  <Text style={styles.panelTitle}>Urgency Hotspots</Text>
                  <Text style={styles.panelSubtitle}>Locations requiring faster action</Text>
                </View>
                <Ionicons name="flame-outline" size={21} color="#C57C1B" />
              </View>
              <View style={styles.hotspotList}>
                {authorityUrgencyHotspots.map((item, index) => (
                  <View key={item.location} style={styles.hotspotRow}>
                    <View style={styles.hotspotRank}><Text style={styles.hotspotRankText}>{index + 1}</Text></View>
                    <View style={styles.hotspotCopy}>
                      <Text style={styles.hotspotLocation}>{item.location}</Text>
                      <Text style={styles.hotspotCategory}>{item.category}</Text>
                    </View>
                    <View style={styles.signalBadge}>
                      <Ionicons name="arrow-up-circle" size={15} color="#C57C1B" />
                      <Text style={styles.signalText}>{item.signals}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F7F8FA' },
  scrollContent: { paddingBottom: 34 },
  container: { width: '100%', maxWidth: 1180, alignSelf: 'center', padding: 16, gap: 18 },
  hero: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 18 },
  heroCompact: { alignItems: 'flex-start', flexDirection: 'column' },
  heroCopy: { flex: 1 },
  eyebrow: { color: '#B9854B', fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  title: { color: '#111827', fontSize: 25, fontWeight: '800', marginTop: 3 },
  subtitle: { color: '#6B7280', fontSize: 12, marginTop: 5 },
  reportButton: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 17, borderRadius: 22, backgroundColor: '#23435D' },
  reportButtonText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  periodRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  periodLabel: { color: '#475467', fontSize: 11, fontWeight: '700' },
  periodButtons: { flexDirection: 'row', gap: 7 },
  periodButton: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E6EB' },
  periodButtonActive: { backgroundColor: '#23435D', borderColor: '#23435D' },
  periodButtonText: { color: '#667085', fontSize: 10, fontWeight: '700' },
  periodButtonTextActive: { color: '#FFFFFF' },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  summaryCard: { backgroundColor: '#FFFFFF', borderRadius: 13, padding: 14, borderWidth: 1, borderColor: '#ECEFF3', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' },
  summaryCardWide: { flex: 1, minWidth: 190 },
  summaryCardCompact: { width: '48%', minWidth: 150 },
  summaryIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  summaryLabel: { color: '#667085', fontSize: 10, fontWeight: '600', marginTop: 10 },
  summaryValue: { color: '#1F2937', fontSize: 21, fontWeight: '800', marginTop: 3, fontVariant: ['tabular-nums'] },
  summaryChange: { fontSize: 9, fontWeight: '700', marginTop: 4 },
  generatedReport: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 13, backgroundColor: '#EAF8F1', borderWidth: 1, borderColor: '#CDEBDE' },
  generatedIcon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: '#16845B' },
  generatedCopy: { flex: 1 },
  generatedTitle: { color: '#165C43', fontSize: 13, fontWeight: '800' },
  generatedText: { color: '#4C7565', fontSize: 10, lineHeight: 15, marginTop: 3 },
  readyBadge: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 11, backgroundColor: '#D5F0E4' },
  readyText: { color: '#16845B', fontSize: 8, fontWeight: '900' },
  analyticsGrid: { gap: 14 },
  analyticsGridWide: { flexDirection: 'row' },
  panel: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#ECEFF3', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' },
  panelHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 15 },
  panelTitle: { color: '#1F2937', fontSize: 15, fontWeight: '800' },
  panelSubtitle: { color: '#8A93A1', fontSize: 9, marginTop: 3 },
  statusBar: { height: 13, flexDirection: 'row', borderRadius: 7, overflow: 'hidden', backgroundColor: '#EEF1F4' },
  statusRows: { gap: 11, marginTop: 17 },
  statusRow: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  statusLabel: { flex: 1, color: '#475467', fontSize: 11, fontWeight: '600' },
  statusValue: { width: 34, color: '#1F2937', fontSize: 11, fontWeight: '800', textAlign: 'right', fontVariant: ['tabular-nums'] },
  statusPercent: { width: 38, color: '#8A93A1', fontSize: 9, textAlign: 'right', fontVariant: ['tabular-nums'] },
  chart: { height: 190, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 7 },
  chartColumn: { flex: 1, height: '100%', alignItems: 'center', justifyContent: 'flex-end' },
  chartValue: { color: '#5C6676', fontSize: 8, fontWeight: '700', marginBottom: 5 },
  chartTrack: { width: '72%', flex: 1, justifyContent: 'flex-end', borderRadius: 7, overflow: 'hidden', backgroundColor: '#F0F3F6' },
  chartBar: { width: '100%', minHeight: 8, borderRadius: 7, backgroundColor: '#3B82F6' },
  chartLabel: { color: '#7B8492', fontSize: 8, marginTop: 6 },
  categoryList: { gap: 13 },
  categoryRow: { gap: 5 },
  categoryTopLine: { flexDirection: 'row', justifyContent: 'space-between' },
  categoryLabel: { color: '#475467', fontSize: 10, fontWeight: '600' },
  categoryValue: { color: '#1F2937', fontSize: 10, fontWeight: '800', fontVariant: ['tabular-nums'] },
  categoryTrack: { height: 7, borderRadius: 4, backgroundColor: '#EEF1F4', overflow: 'hidden' },
  categoryBar: { height: '100%', borderRadius: 4 },
  hotspotList: { gap: 10 },
  hotspotRow: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 11, backgroundColor: '#FAFBFC' },
  hotspotRank: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF1E5' },
  hotspotRankText: { color: '#C57C1B', fontSize: 10, fontWeight: '900' },
  hotspotCopy: { flex: 1 },
  hotspotLocation: { color: '#293241', fontSize: 10, fontWeight: '700' },
  hotspotCategory: { color: '#8A93A1', fontSize: 9, marginTop: 3 },
  signalBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 12, backgroundColor: '#FFF7E8' },
  signalText: { color: '#A7640C', fontSize: 10, fontWeight: '900', fontVariant: ['tabular-nums'] },
});
