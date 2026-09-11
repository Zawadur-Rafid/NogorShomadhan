import type {
  ResidentAnalyticsDistribution,
  ResidentAnalyticsPeriod,
  ResidentAnalyticsSnapshot,
} from '@/components/resident-analytics';
import { getResidentAnalyticsArea } from '@/components/resident-analytics';
import { exportHtmlReportAsPdf } from '@/services/pdf-report-export.service';

function escapeHtml(value: string | number) {
  return String(value).replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;',
  })[character] ?? character);
}

function distributionRows(items: ResidentAnalyticsDistribution[]) {
  if (items.length === 0) return '<tr><td colspan="3">No records in this period</td></tr>';
  return items.map((item) =>
    `<tr><td>${escapeHtml(item.label)}</td><td>${item.value}</td><td>${item.percent}%</td></tr>`,
  ).join('');
}

export function buildResidentAnalyticsReportHtml({
  analytics,
  period,
  scope,
  generatedAt = new Date(),
}: {
  analytics: ResidentAnalyticsSnapshot;
  period: ResidentAnalyticsPeriod;
  scope: 'All Complaints' | 'My Complaints';
  generatedAt?: Date;
}) {
  const summaryRows = [
    ['Complaints submitted', analytics.total],
    ['Pending now', analytics.pending],
    ['In progress now', analytics.inProgress],
    ['Resolved', analytics.resolved],
    ['Resolution rate', `${analytics.resolutionRate}%`],
  ].map(([label, value]) =>
    `<tr><td>${escapeHtml(label)}</td><td>${escapeHtml(value)}</td></tr>`,
  ).join('');
  const statusRows = analytics.statusDistribution.map((item) =>
    `<tr><td>${escapeHtml(item.label)}</td><td>${item.value}</td><td>${item.percent}%</td></tr>`,
  ).join('');
  const complaintRows = analytics.visible.length === 0
    ? '<tr><td colspan="6">No complaints in this reporting period</td></tr>'
    : analytics.visible.map((complaint) => `<tr>
      <td class="nowrap">${escapeHtml(complaint.displayId)}</td>
      <td><strong>${escapeHtml(complaint.title)}</strong><div class="secondary">${escapeHtml(complaint.description)}</div></td>
      <td>${escapeHtml(complaint.category)}</td>
      <td class="nowrap">${escapeHtml(complaint.status)}</td>
      <td class="nowrap">${escapeHtml(new Date(complaint.timestamp).toLocaleDateString())}</td>
      <td>${escapeHtml(getResidentAnalyticsArea(complaint))}</td>
    </tr>`).join('');

  return `<!doctype html>
<html><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Nogor Shomadhan - ${escapeHtml(scope)} Report</title>
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
.complaints th:nth-child(2) { width: 30%; }
.complaints th:nth-child(3) { width: 13%; }
.complaints th:nth-child(4) { width: 12%; }
.complaints th:nth-child(5) { width: 14%; }
.complaints th:nth-child(6) { width: 22%; }
.nowrap { white-space: nowrap; }
.secondary { margin-top: 3px; color: #667085; font-size: 8px; line-height: 1.35; }
.meta { margin-top: 8px; font-size: 11px; }
.note { margin-top: 22px; padding: 10px 12px; border-left: 3px solid #B9854B; background: #F8FAFC; font-size: 10px; }
</style></head><body>
<h1>Resident Complaint Analytics</h1>
<p class="meta">Scope: ${escapeHtml(scope)}</p>
<p class="meta">Reporting period: ${escapeHtml(period)} (by complaint submission date)</p>
<p class="meta">Generated: ${escapeHtml(generatedAt.toLocaleString())}</p>
<h2>Summary</h2><table><tr><th>Metric</th><th>Value</th></tr>${summaryRows}</table>
<h2>Current Status</h2><table><tr><th>Status</th><th>Complaints</th><th>Share</th></tr>${statusRows}</table>
<h2>Top Complaint Categories</h2><table><tr><th>Category</th><th>Complaints</th><th>Share</th></tr>${distributionRows(analytics.categoryDistribution)}</table>
<h2>Top Complaint Areas</h2><table><tr><th>Area</th><th>Complaints</th><th>Share</th></tr>${distributionRows(analytics.areaDistribution)}</table>
<h2>Complaint Records</h2>
<p>Values for every ${scope === 'My Complaints' ? 'resident complaint you submitted' : 'accepted community complaint'} included in this report.</p>
<table class="complaints">
<thead><tr><th>ID</th><th>Complaint</th><th>Category</th><th>Status</th><th>Submitted</th><th>Area</th></tr></thead>
<tbody>${complaintRows}</tbody>
</table>
<p class="note">Only accepted complaints submitted within the selected period are included. Category and area tables show up to six groups.</p>
</body></html>`;
}

export async function generateResidentAnalyticsPdf(input: {
  analytics: ResidentAnalyticsSnapshot;
  period: ResidentAnalyticsPeriod;
  scope: 'All Complaints' | 'My Complaints';
}) {
  const html = buildResidentAnalyticsReportHtml(input);
  const scopeSlug = input.scope === 'My Complaints' ? 'my-complaints' : 'all-complaints';
  const periodSlug = input.period.toLowerCase().replace(/\s+/g, '-');
  return exportHtmlReportAsPdf({
    html,
    fileName: `nogor-shomadhan-resident-${scopeSlug}-${periodSlug}`,
    dialogTitle: `Save resident ${input.scope.toLowerCase()} report`,
  });
}
