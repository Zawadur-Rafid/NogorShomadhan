export const authorityAnalyticsSummary = [
  { label: 'Total Complaints', value: '128', change: '+12 this month', icon: 'documents-outline', color: '#3B82F6', background: '#EEF6FF' },
  { label: 'Resolution Rate', value: '59%', change: '+8% improvement', icon: 'checkmark-done-outline', color: '#16845B', background: '#EAF8F1' },
  { label: 'Average Resolution', value: '3.6 days', change: '0.7 day faster', icon: 'timer-outline', color: '#C67B00', background: '#FFF7E8' },
  { label: 'Urgency Hotspots', value: '3', change: '25+ signals', icon: 'flame-outline', color: '#E0524D', background: '#FFF1F1' },
] as const;

export const authorityStatusDistribution = [
  { label: 'Pending', value: 34, percent: 27, color: '#EF4444' },
  { label: 'In Progress', value: 19, percent: 15, color: '#C67B00' },
  { label: 'Resolved', value: 75, percent: 58, color: '#2563EB' },
];

export const authorityCategoryDistribution = [
  { label: 'Drainage', value: 32, percent: 100, color: '#23435D' },
  { label: 'Road Damage', value: 27, percent: 84, color: '#3B82F6' },
  { label: 'Streetlight', value: 24, percent: 75, color: '#B9854B' },
  { label: 'Water Supply', value: 19, percent: 59, color: '#26A69A' },
  { label: 'Waste', value: 16, percent: 50, color: '#7C6BC4' },
];

export const authorityWeeklyTrend = [
  { label: 'Mon', value: 11 },
  { label: 'Tue', value: 17 },
  { label: 'Wed', value: 13 },
  { label: 'Thu', value: 22 },
  { label: 'Fri', value: 18 },
  { label: 'Sat', value: 9 },
  { label: 'Sun', value: 14 },
];

export const authorityUrgencyHotspots = [
  { location: 'Road 7, Block C', category: 'Drainage', signals: 47 },
  { location: 'East Gate, Block A', category: 'Streetlight', signals: 35 },
  { location: 'Road 3, Block B', category: 'Water Supply', signals: 29 },
];
