import type { AuthorityComplaintDetail } from './store-authority-complaint-details';

export const analyticsPeriods = ['7 Days', '30 Days', 'This Year'] as const;
export type AnalyticsPeriod = (typeof analyticsPeriods)[number];

const dayInMilliseconds = 86_400_000;
const colors = ['#23435D', '#3B82F6', '#B9854B', '#26A69A', '#7C6BC4', '#D66B8B'];

export type AnalyticsDistribution = {
  label: string;
  value: number;
  percent: number;
  color: string;
};

export function getAnalyticsArea(complaint: AuthorityComplaintDetail) {
  const avenue = complaint.avenue?.trim();
  if (avenue) return /^avenue\b/i.test(avenue) ? avenue : `Avenue ${avenue}`;

  const road = complaint.road?.trim();
  if (road) return /^road\b/i.test(road) ? road : `Road ${road}`;

  return 'Area not provided';
}

function timestamp(value?: string | null) {
  return value ? Date.parse(value) : Number.NaN;
}

function periodStart(period: AnalyticsPeriod, now: Date) {
  if (period === 'This Year') return new Date(now.getFullYear(), 0, 1);
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (period === '7 Days' ? 6 : 29));
  return start;
}

function inRange(value: string | null | undefined, start: Date, end: Date) {
  const time = timestamp(value);
  return !Number.isNaN(time) && time >= start.getTime() && time <= end.getTime();
}

function dateLabel(date: Date) {
  return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
}

function buildTrend(period: AnalyticsPeriod, complaints: AuthorityComplaintDetail[], now: Date) {
  const start = periodStart(period, now);

  if (period === '7 Days') {
    return Array.from({ length: 7 }, (_, index) => {
      const bucketStart = new Date(start);
      bucketStart.setDate(bucketStart.getDate() + index);
      const bucketEnd = new Date(bucketStart);
      bucketEnd.setHours(23, 59, 59, 999);
      return {
        label: dateLabel(bucketStart),
        value: complaints.filter((item) => inRange(item.timestamp, bucketStart, bucketEnd)).length,
      };
    });
  }

  if (period === '30 Days') {
    return Array.from({ length: 5 }, (_, index) => {
      const bucketStart = new Date(start);
      bucketStart.setDate(bucketStart.getDate() + index * 6);
      const bucketEnd = new Date(bucketStart);
      bucketEnd.setDate(bucketEnd.getDate() + 5);
      bucketEnd.setHours(23, 59, 59, 999);
      return {
        label: dateLabel(bucketStart),
        value: complaints.filter((item) => inRange(item.timestamp, bucketStart, bucketEnd)).length,
      };
    });
  }

  return Array.from({ length: 12 }, (_, month) => {
    const bucketStart = new Date(now.getFullYear(), month, 1);
    const bucketEnd = new Date(now.getFullYear(), month + 1, 0, 23, 59, 59, 999);
    return {
      label: bucketStart.toLocaleDateString('en-US', { month: 'short' }),
      value: complaints.filter((item) => inRange(item.timestamp, bucketStart, bucketEnd)).length,
    };
  });
}

function distribution(entries: [string, number][], total: number): AnalyticsDistribution[] {
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

function average(values: number[]) {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function formatAnalyticsDays(value: number | null) {
  return value === null ? '—' : `${value.toFixed(1)} days`;
}

export function buildAuthorityAnalytics(
  complaints: AuthorityComplaintDetail[],
  period: AnalyticsPeriod,
) {
  const now = new Date();
  const start = periodStart(period, now);
  const visible = complaints.filter((item) => inRange(item.timestamp, start, now));
  const total = visible.length;
  const resolved = visible.filter((item) => item.status === 'RESOLVED');

  const statusDistribution = [
    { label: 'Pending', status: 'PENDING', color: '#E0524D' },
    { label: 'In Progress', status: 'IN PROGRESS', color: '#C67B00' },
    { label: 'Resolved', status: 'RESOLVED', color: '#2563EB' },
  ].map((entry) => {
    const value = visible.filter((item) => item.status === entry.status).length;
    return { ...entry, value, percent: total === 0 ? 0 : Math.round((value / total) * 100) };
  });

  const categoryCounts = visible.reduce<Record<string, number>>((counts, item) => {
    const category = item.category || 'Uncategorized';
    counts[category] = (counts[category] ?? 0) + 1;
    return counts;
  }, {});
  const areaCounts = visible.reduce<Record<string, number>>((counts, item) => {
    const area = getAnalyticsArea(item);
    counts[area] = (counts[area] ?? 0) + 1;
    return counts;
  }, {});

  const resolutionDays = resolved.map((item) => {
    const submitted = timestamp(item.timestamp);
    const completed = timestamp(item.resolvedAt);
    return Number.isNaN(submitted) || Number.isNaN(completed)
      ? Number.NaN
      : Math.max(0, (completed - submitted) / dayInMilliseconds);
  }).filter((value) => !Number.isNaN(value));

  const startDays = visible.map((item) => {
    const submitted = timestamp(item.timestamp);
    const started = timestamp(item.startedAt);
    return Number.isNaN(submitted) || Number.isNaN(started)
      ? Number.NaN
      : Math.max(0, (started - submitted) / dayInMilliseconds);
  }).filter((value) => !Number.isNaN(value));

  const deadlineResolved = resolved.filter(
    (item) => item.deadline && !Number.isNaN(timestamp(item.resolvedAt)),
  );
  const withinDeadline = deadlineResolved.filter((item) => {
    const deadlineEnd = Date.parse(`${item.deadline}T23:59:59.999`);
    return !Number.isNaN(deadlineEnd) && timestamp(item.resolvedAt) <= deadlineEnd;
  }).length;

  const overdueOpen = visible.filter((item) => {
    if (item.status === 'RESOLVED' || !item.deadline) return false;
    const deadlineEnd = Date.parse(`${item.deadline}T23:59:59.999`);
    return !Number.isNaN(deadlineEnd) && deadlineEnd < now.getTime();
  }).length;

  const additionalReports = [...visible]
    .filter((item) => item.duplicateReportCount > 0)
    .sort((first, second) => second.duplicateReportCount - first.duplicateReportCount)
    .slice(0, 5);
  const totalAdditionalReports = visible.reduce((sum, item) => sum + item.duplicateReportCount, 0);

  return {
    visible,
    total,
    inProgress: visible.filter((item) => item.status === 'IN PROGRESS').length,
    resolved: resolved.length,
    resolutionRate: total === 0 ? 0 : Math.round((resolved.length / total) * 100),
    averageResolutionDays: average(resolutionDays),
    averageStartDays: average(startDays),
    statusDistribution,
    categoryDistribution: distribution(Object.entries(categoryCounts), total),
    areaDistribution: distribution(Object.entries(areaCounts), total),
    trend: buildTrend(period, visible, now),
    deadlineResolved: deadlineResolved.length,
    withinDeadline,
    onTimeRate: deadlineResolved.length === 0
      ? null
      : Math.round((withinDeadline / deadlineResolved.length) * 100),
    overdueOpen,
    additionalReports,
    totalAdditionalReports,
  };
}
