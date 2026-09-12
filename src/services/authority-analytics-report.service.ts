import {
  formatAnalyticsDays,
  type AnalyticsDistribution,
  type AnalyticsPeriod,
  type AuthorityAnalyticsSnapshot,
} from '@/components/authority/authority-analytics';
import { exportHtmlReportAsPdf, type PdfReportResult } from '@/services/pdf-report-export.service';

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
  reportOwner = 'Community Authority',
}: {
  analytics: AuthorityAnalyticsSnapshot;
  period: AnalyticsPeriod;
  generatedAt?: Date;
  reportOwner?: string;
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

  const complaintRows = analytics.visible.length === 0
    ? '<tr><td colspan="7">No complaints in this reporting period</td></tr>'
    : analytics.visible.map((complaint) => {
      const submitted = complaint.timestamp
        ? new Date(complaint.timestamp).toLocaleDateString()
        : complaint.date;
      const deadline = complaint.deadline || 'Not set';
      return `<tr>
        <td class="nowrap">${escapeHtml(complaint.displayId)}</td>
        <td><strong>${escapeHtml(complaint.title)}</strong><div class="secondary">${escapeHtml(complaint.description)}</div></td>
        <td>${escapeHtml(complaint.category || 'Uncategorized')}</td>
        <td class="nowrap">${escapeHtml(complaint.status)}</td>
        <td class="nowrap">${escapeHtml(submitted)}</td>
        <td>${escapeHtml(complaint.location || 'Not provided')}</td>
        <td><span class="nowrap">${escapeHtml(`${complaint.progress}% complete`)}</span><div class="secondary">Deadline: ${escapeHtml(deadline)}</div></td>
      </tr>`;
    }).join('');

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Nogor Shomadhan - ${escapeHtml(reportOwner)} Complaint Report</title>
    <style>
      @page { size: A4; margin: 24mm 18mm; }
      * { box-sizing: border-box; }
      body { margin: 0; color: #1F2937; font-family: Arial, sans-serif; font-size: 12px; line-height: 1.45; }
      h1 { margin: 0; color: #23435D; font-size: 24px; }
      h2 { margin: 22px 0 8px; color: #23435D; font-size: 16px; page-break-after: avoid; }
      p { margin: 5px 0; color: #667085; }
      table { width: 100%; border-collapse: collapse; margin-top: 8px; }
      thead { display: table-header-group; }
      tr { break-inside: avoid; page-break-inside: avoid; }
      th { background: #23435D; color: #FFFFFF; text-align: left; }
      th, td { border: 1px solid #D0D5DD; padding: 7px 8px; vertical-align: top; }
      .complaints { table-layout: fixed; font-size: 9px; }
      .complaints th, .complaints td { overflow-wrap: anywhere; }
      .complaints th:nth-child(1) { width: 9%; }
      .complaints th:nth-child(2) { width: 23%; }
      .complaints th:nth-child(3) { width: 14%; }
      .complaints th:nth-child(4) { width: 11%; }
      .complaints th:nth-child(5) { width: 12%; }
      .complaints th:nth-child(6) { width: 18%; }
      .complaints th:nth-child(7) { width: 13%; }
      .nowrap { white-space: nowrap; }
      .secondary { margin-top: 3px; color: #667085; font-size: 8px; line-height: 1.35; }
      .meta { margin-top: 8px; font-size: 11px; }
      .note { margin-top: 22px; padding: 10px 12px; border-left: 3px solid #B9854B; background: #F8FAFC; font-size: 10px; }
    </style>
  </head>
  <body>
    <h1>${escapeHtml(reportOwner)} Complaint Analytics</h1>
    <p class="meta">Reporting period: ${escapeHtml(period)} (grouped by complaint submission date)</p>
    <p class="meta">Generated: ${escapeHtml(generatedAt.toLocaleString())}</p>

    <h2>Operational Summary</h2>
    <table><tr><th>Metric</th><th>Value</th></tr>${summaryRows}</table>

    <h2>Current Status of Submitted Complaints</h2>
    <table><tr><th>Status</th><th>Complaints</th><th>Share</th></tr>${statusRows}</table>

    <h2>Top Complaint Categories</h2>
    <table><tr><th>Category</th><th>Complaints</th><th>Share</th></tr>${distributionRows(analytics.categoryDistribution)}</table>

    <h2>Top Complaint Areas</h2>
    <table><tr><th>Area</th><th>Complaints</th><th>Share</th></tr>${distributionRows(analytics.areaDistribution)}</table>

    <h2>Complaint Records</h2>
    <p>Values for every complaint included in this report.</p>
    <table class="complaints">
      <thead><tr><th>ID</th><th>Complaint</th><th>Category</th><th>Status</th><th>Submitted</th><th>Location</th><th>Work</th></tr></thead>
      <tbody>${complaintRows}</tbody>
    </table>

    <p class="note">
      Method: only complaints submitted within the selected period are included.
      Average times use records with valid timestamps. On-time performance includes
      only resolved complaints with a recorded deadline. Category and area tables show
      up to six groups.
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
}): Promise<PdfReportResult> {
  const html = buildAuthorityAnalyticsReportHtml({ analytics, period });
  return exportHtmlReportAsPdf({
    html,
    fileName: 'NogorShomadhan_report',
    dialogTitle: 'Save authority complaint report',
  });
}
