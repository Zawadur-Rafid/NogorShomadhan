import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PieChart, BarChart } from 'react-native-chart-kit';
import Ionicons from '@expo/vector-icons/Ionicons';
import TopNav from '../../components/TopNav';
import BottomNav from '../../components/BottomNav';
import { dummyComplaints } from '../../components/store/store_complaint';

const screenWidth = Dimensions.get('window').width;

export default function Analytics() {
  const [filter, setFilter] = useState<'ALL' | 'MY'>('ALL');

  // Filter complaints based on the selected tab
  const activeComplaints = filter === 'ALL'
    ? dummyComplaints
    : dummyComplaints.filter(c => c.isMyComplaint);

  // Compute stats
  const total = activeComplaints.length;
  const pending = activeComplaints.filter(c => c.status === 'PENDING').length;
  const inProgress = activeComplaints.filter(c => c.status === 'IN PROGRESS').length;
  const resolved = activeComplaints.filter(c => c.status === 'RESOLVED').length;

  // Prepare data for Pie Chart (Status Distribution)
  const pieData = [
    {
      name: 'Pending',
      population: pending,
      color: '#EF4444',
      legendFontColor: '#374151',
      legendFontSize: 12,
    },
    {
      name: 'In Progress',
      population: inProgress,
      color: '#B45309',
      legendFontColor: '#374151',
      legendFontSize: 12,
    },
    {
      name: 'Resolved',
      population: resolved,
      color: '#3B82F6',
      legendFontColor: '#374151',
      legendFontSize: 12,
    },
  ].filter(item => item.population > 0); // Hide if 0 to avoid rendering issues

  // Prepare data for Bar Chart (Category Distribution)
  const categoryCounts: { [key: string]: number } = {};
  activeComplaints.forEach(c => {
    categoryCounts[c.category] = (categoryCounts[c.category] || 0) + 1;
  });

  const categories = Object.keys(categoryCounts);
  const barData = {
    labels: categories, // Use full category names
    datasets: [
      {
        data: categories.map(c => categoryCounts[c]),
      },
    ],
  };

  const chartConfig = {
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    color: (opacity = 1) => `rgba(35, 67, 93, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
    decimalPlaces: 0,
    propsForLabels: {
      fontSize: 10,
      fontFamily: 'Inter',
    },
    propsForBackgroundLines: {
      strokeWidth: 1,
      stroke: '#e3e3e3',
      strokeDasharray: '0',
    },
  };

  const maxCount = Math.max(...(barData.datasets[0].data.length > 0 ? barData.datasets[0].data : [0]), 1);
  const segments = maxCount < 5 ? maxCount : 4;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <TopNav />
        
        <View style={styles.header}>
          <Text style={styles.title}>Analytics</Text>
          <Text style={styles.subtitle}>Track complaint statistics</Text>
        </View>

        {/* Custom Tab Switcher */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, filter === 'ALL' && styles.activeTab]}
            onPress={() => setFilter('ALL')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, filter === 'ALL' && styles.activeTabText]}>
              All Complaints
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, filter === 'MY' && styles.activeTab]}
            onPress={() => setFilter('MY')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, filter === 'MY' && styles.activeTabText]}>
              My Complaints
            </Text>
          </TouchableOpacity>
        </View>

        {/* Summary Cards */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: '#F3F4F6' }]}>
            <Ionicons name="document-text-outline" size={18} color="#3B82F6" />
            <Text style={styles.statLabel}>Total</Text>
            <Text style={[styles.statValue, { color: '#111827' }]}>{total}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#FEF2F2' }]}>
            <Ionicons name="sad-outline" size={18} color="#EF4444" />
            <Text style={styles.statLabel}>Pending</Text>
            <Text style={[styles.statValue, { color: '#EF4444' }]}>{pending}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#FFFBEB' }]}>
            <Ionicons name="people-outline" size={18} color="#C67B00" />
            <Text style={styles.statLabel}>In Progress</Text>
            <Text style={[styles.statValue, { color: '#D97706' }]}>{inProgress}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#EFF6FF' }]}>
            <Ionicons name="checkmark-circle-outline" size={18} color="#2563EB" />
            <Text style={styles.statLabel}>Resolved</Text>
            <Text style={[styles.statValue, { color: '#3B82F6' }]}>{resolved}</Text>
          </View>
        </View>

        {/* Pie Chart Section */}
        <View style={styles.chartSection}>
          <Text style={styles.sectionTitle}>Status Distribution</Text>
          {total > 0 ? (
            <PieChart
              data={pieData}
              width={screenWidth - 32}
              height={220}
              chartConfig={chartConfig}
              accessor={'population'}
              backgroundColor={'transparent'}
              paddingLeft={'15'}
              center={[10, 0]}
              absolute
            />
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No data available</Text>
            </View>
          )}
        </View>

        {/* Bar Chart Section */}
        <View style={styles.chartSection}>
          <Text style={styles.sectionTitle}>Complaints by Category</Text>
          {categories.length > 0 ? (
            <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} style={{ marginHorizontal: 16 }}>
              <BarChart
                data={barData}
                width={Math.max(screenWidth - 32, categories.length * 80)} // Dynamic width for slider
                height={220}
                yAxisLabel=""
                yAxisSuffix=""
                fromZero={true}
                chartConfig={chartConfig}
                style={styles.barChartStyle}
                showValuesOnTopOfBars={true}
                segments={segments}
                withInnerLines={true}
              />
            </ScrollView>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No data available</Text>
            </View>
          )}
        </View>
        
        {/* Extra padding at the bottom for scroll clearance */}
        <View style={{ height: 40 }} />
      </ScrollView>

      <BottomNav activeRoute="data" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'Inter',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
    fontFamily: 'Inter',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#E8EDF4',
    borderRadius: 12,
    marginHorizontal: 16,
    padding: 4,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#23435D',
  },
  tabText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    fontFamily: 'Inter',
    textAlign: 'center',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  statCard: {
    width: '48%',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  statLabel: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
    fontFamily: 'Inter',
  },
  statValue: {
    fontSize: 26,
    fontWeight: '700',
    marginTop: 8,
    fontFamily: 'Inter',
  },
  chartSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 16,
    paddingVertical: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    alignSelf: 'flex-start',
    paddingHorizontal: 20,
    marginBottom: 12,
    fontFamily: 'Inter',
  },
  barChartStyle: {
    borderRadius: 16,
    marginVertical: 8,
  },
  emptyState: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateText: {
    color: '#9CA3AF',
    fontFamily: 'Inter',
    fontSize: 14,
  },
});
