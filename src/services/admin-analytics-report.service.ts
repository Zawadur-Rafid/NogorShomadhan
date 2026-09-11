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
  const periodSlug = period.toLowerCase().replace(/\s+/g, '-');

  return exportHtmlReportAsPdf({
    html,
    fileName: `nogor-shomadhan-admin-complaints-${periodSlug}`,
    dialogTitle: 'Save administration complaint report',
  });
}
