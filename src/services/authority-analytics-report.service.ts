import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import {
  formatAnalyticsDays,
  getAnalyticsArea,
  type AnalyticsDistribution,
  type AnalyticsPeriod,
  type AuthorityAnalyticsSnapshot,
} from '@/components/authority/authority-analytics';

type AuthorityAnalyticsReportResult = {
  uri: string | null;
  shared: boolean;
};

function escapeHtml(value: string | number) {
  return String(value).replace(
    /[&<>'"]/g,
    (character) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;',
      })[character] ?? character,
  );
}

function distributionRows(items: AnalyticsDistribution[]) {
  if (items.length === 0) {
    return '<tr><td colspan="3">No records in this period</td></tr>';
  }

  return items
    .map(
      (item) =>
        `<tr><td>${escapeHtml(item.label)}</td><td>${item.value}</td><td>${item.percent}%</td></tr>`,
    )
    .join('');
}

export function buildAuthorityAnalyticsReportHtml({
  analytics,
  period,
  generatedAt = new Date(),
}: {
  analytics: AuthorityAnalyticsSnapshot;
  period: AnalyticsPeriod;
  generatedAt?: Date;
}) {
  const pending =
    analytics.statusDistribution.find((item) => item.label === 'Pending')?.value ?? 0;
  const onTime =
    analytics.onTimeRate === null
      ? 'Not available'
      : `${analytics.onTimeRate}% (${analytics.withinDeadline} of ${analytics.deadlineResolved})`;

  const summaryRows = [
    ['Complaints submitted', analytics.total],
    ['Pending now', pending],
    ['In progress now', analytics.inProgress],
    ['Resolved', analytics.resolved],
    ['Resolution rate', `${analytics.resolutionRate}%`],
    [
      'Average time to start',
      analytics.startSampleSize === 0
        ? 'Not available'
        : `${formatAnalyticsDays(analytics.averageStartDays)} (${analytics.startSampleSize} records)`,
    ],
    [
      'Average resolution time',
      analytics.resolutionSampleSize === 0
        ? 'Not available'
        : `${formatAnalyticsDays(analytics.averageResolutionDays)} (${analytics.resolutionSampleSize} records)`,
    ],
    ['Open and overdue', analytics.overdueOpen],
    ['On-time resolution', onTime],
    ['Confirmed additional reports', analytics.totalAdditionalReports],
  ]
    .map(
      ([label, value]) =>
        `<tr><td>${escapeHtml(label)}</td><td>${escapeHtml(value)}</td></tr>`,
    )
    .join('');

  const statusRows = analytics.statusDistribution
    .map(
      (item) =>
        `<tr><td>${escapeHtml(item.label)}</td><td>${item.value}</td><td>${item.percent}%</td></tr>`,
    )
    .join('');

  const trendRows = analytics.trend
    .map(
      (item) =>
        `<tr><td>${escapeHtml(item.label)}</td><td>${item.value}</td></tr>`,
    )
    .join('');

  const additionalReportRows =
    analytics.additionalReports.length === 0
      ? '<tr><td colspan="5">No confirmed additional reports in this period</td></tr>'
      : analytics.additionalReports
          .map(
            (item) =>
              `<tr><td>${escapeHtml(item.displayId)}</td><td>${escapeHtml(item.title)}</td><td>${escapeHtml(item.category)}</td><td>${escapeHtml(getAnalyticsArea(item))}</td><td>${item.duplicateReportCount}</td></tr>`,
          )
          .join('');

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      @page { size: A4; margin: 24mm 18mm; }
      * { box-sizing: border-box; }
      body { margin: 0; color: #1F2937; font-family: Arial, sans-serif; font-size: 12px; line-height: 1.45; }
      h1 { margin: 0; color: #23435D; font-size: 24px; }
      h2 { margin: 22px 0 8px; color: #23435D; font-size: 16px; page-break-after: avoid; }
      p { margin: 5px 0; color: #667085; }
      table { width: 100%; border-collapse: collapse; margin-top: 8px; page-break-inside: avoid; }
      th { background: #23435D; color: #FFFFFF; text-align: left; }
      th, td { border: 1px solid #D0D5DD; padding: 7px 8px; vertical-align: top; }
      .meta { margin-top: 8px; font-size: 11px; }
      .note { margin-top: 22px; padding: 10px 12px; border-left: 3px solid #B9854B; background: #F8FAFC; font-size: 10px; }
    </style>
  </head>
  <body>
    <h1>Community Authority Complaint Analytics</h1>
    <p class="meta">Reporting period: ${escapeHtml(period)} (grouped by complaint submission date)</p>
    <p class="meta">Generated: ${escapeHtml(generatedAt.toLocaleString())}</p>

    <h2>Operational Summary</h2>
    <table><tr><th>Metric</th><th>Value</th></tr>${summaryRows}</table>

    <h2>Current Status of Submitted Complaints</h2>
    <table><tr><th>Status</th><th>Complaints</th><th>Share</th></tr>${statusRows}</table>

    <h2>Complaint Submissions Over Time</h2>
    <table><tr><th>Time bucket</th><th>Submitted complaints</th></tr>${trendRows}</table>

    <h2>Top Complaint Categories</h2>
    <table><tr><th>Category</th><th>Complaints</th><th>Share</th></tr>${distributionRows(analytics.categoryDistribution)}</table>

    <h2>Top Complaint Areas</h2>
    <table><tr><th>Area</th><th>Complaints</th><th>Share</th></tr>${distributionRows(analytics.areaDistribution)}</table>

    <h2>Complaints with the Most Confirmed Additional Reports</h2>
    <table><tr><th>ID</th><th>Complaint</th><th>Category</th><th>Area</th><th>Additional reports</th></tr>${additionalReportRows}</table>

    <p class="note">
      Method: only complaints submitted within the selected period are included.
      Average times use records with valid timestamps. On-time performance includes
      only resolved complaints with a recorded deadline. Category and area tables show
      up to six groups. The additional-report table shows up to five complaints and
      includes only admin-confirmed duplicates linked to the surviving complaint.
    </p>
  </body>
</html>`;
}

export async function generateAuthorityAnalyticsPdf({
  analytics,
  period,
}: {
  analytics: AuthorityAnalyticsSnapshot;
  period: AnalyticsPeriod;
}): Promise<AuthorityAnalyticsReportResult> {
  const html = buildAuthorityAnalyticsReportHtml({ analytics, period });

  if (Platform.OS === 'web') {
    await Print.printAsync({ html });
    return { uri: null, shared: false };
  }

  const { uri } = await Print.printToFileAsync({ html });
  const canShare = await Sharing.isAvailableAsync();

  if (canShare) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Save authority analytics report',
      UTI: 'com.adobe.pdf',
    });
  }

  return { uri, shared: canShare };
}
