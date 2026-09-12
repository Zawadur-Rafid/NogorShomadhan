import type {
  AnalyticsPeriod,
  AuthorityAnalyticsSnapshot,
} from '@/components/authority/authority-analytics';
import { buildAuthorityAnalyticsReportHtml } from '@/services/authority-analytics-report.service';
import {
  exportHtmlReportAsPdf,
  type PdfReportResult,
} from '@/services/pdf-report-export.service';

export async function generateAdminAnalyticsPdf({
  analytics,
  period,
}: {
  analytics: AuthorityAnalyticsSnapshot;
  period: AnalyticsPeriod;
}): Promise<PdfReportResult> {
  const html = buildAuthorityAnalyticsReportHtml({
    analytics,
    period,
    reportOwner: 'Administration',
  });
  return exportHtmlReportAsPdf({
    html,
    fileName: 'NogorShomadhan_report',
    dialogTitle: 'Save administration complaint report',
  });
}
