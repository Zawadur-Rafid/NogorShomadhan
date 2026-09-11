import type { ResidentAnalyticsComplaint } from '@/services/resident.service';

export const residentAnalyticsPeriods = ['7 Days', '30 Days', 'This Year'] as const;
export type ResidentAnalyticsPeriod = (typeof residentAnalyticsPeriods)[number];

export type ResidentAnalyticsDistribution = {
  label: string;
  value: number;
  percent: number;
  color: string;
};

const colors = ['#23435D', '#3B82F6', '#B9854B', '#26A69A', '#7C6BC4', '#D66B8B'];

function periodStart(period: ResidentAnalyticsPeriod, now: Date) {
  if (period === 'This Year') return new Date(now.getFullYear(), 0, 1);
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (period === '7 Days' ? 6 : 29));
  return start;
}

function distribution(entries: [string, number][], total: number) {
  return entries
    .sort((first, second) => second[1] - first[1])
    .slice(0, 6)
    .map(([label, value], index) => ({
      label,
      value,
      percent: total === 0 ? 0 : Math.round((value / total) * 100),
      color: colors[index % colors.length],
    }));
}

export function getResidentAnalyticsArea(complaint: ResidentAnalyticsComplaint) {
  const avenue = complaint.avenue?.trim();
  if (avenue) return /^avenue\b/i.test(avenue) ? avenue : `Avenue ${avenue}`;
  const road = complaint.road?.trim();
  if (road) return /^road\b/i.test(road) ? road : `Road ${road}`;
  return 'Area not provided';
}

export function buildResidentAnalytics(
  complaints: ResidentAnalyticsComplaint[],
  period: ResidentAnalyticsPeriod,
) {
  const now = new Date();
  const start = periodStart(period, now).getTime();
  const visible = complaints.filter((complaint) => {
    const submitted = Date.parse(complaint.timestamp);
    return !Number.isNaN(submitted) && submitted >= start && submitted <= now.getTime();
  });
  const total = visible.length;
  const pending = visible.filter((complaint) => complaint.status === 'PENDING').length;
  const inProgress = visible.filter((complaint) => complaint.status === 'IN PROGRESS').length;
  const resolved = visible.filter((complaint) => complaint.status === 'RESOLVED').length;

  const categoryCounts = visible.reduce<Record<string, number>>((counts, complaint) => {
    counts[complaint.category] = (counts[complaint.category] ?? 0) + 1;
    return counts;
  }, {});
  const areaCounts = visible.reduce<Record<string, number>>((counts, complaint) => {
    const area = getResidentAnalyticsArea(complaint);
    counts[area] = (counts[area] ?? 0) + 1;
    return counts;
  }, {});

  const statusDistribution = [
    { label: 'Pending', value: pending, color: '#E0524D' },
    { label: 'In Progress', value: inProgress, color: '#C67B00' },
    { label: 'Resolved', value: resolved, color: '#2563EB' },
  ].map((item) => ({
    ...item,
    percent: total === 0 ? 0 : Math.round((item.value / total) * 100),
  }));

  return {
    visible,
    total,
    pending,
    inProgress,
    resolved,
    resolutionRate: total === 0 ? 0 : Math.round((resolved / total) * 100),
    statusDistribution,
    categoryDistribution: distribution(Object.entries(categoryCounts), total),
    areaDistribution: distribution(Object.entries(areaCounts), total),
  };
}

export type ResidentAnalyticsSnapshot = ReturnType<typeof buildResidentAnalytics>;
