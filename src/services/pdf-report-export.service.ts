import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

export type PdfReportResult = {
  uri: string | null;
  shared: boolean;
};

function printReportDocumentOnWeb(html: string, fileName: string) {
  return new Promise<void>((resolve, reject) => {
    if (typeof document === 'undefined') {
      reject(new Error('PDF export is not available in this environment.'));
      return;
    }

    // Two approaches were tried and rejected before this one:
    //  - A near-zero-size hidden <iframe> (1px, opacity 0): several browsers
    //    refuse to print a frame with no real layout box and silently fall
    //    back to printing the visible app page instead -- this is why the
    //    exported PDF used to contain a screenshot of the app.
    //  - `window.open()` + `document.write()`: this avoids the sizing issue,
    //    but real browsers frequently treat it as a popup and block it
    //    outright, even when it is called synchronously from a click
    //    handler.
    // A same-window, properly-sized (but off-screen) <iframe> avoids both:
    // it is never treated as a popup (it's just DOM inside the current
    // page), and because it has real dimensions and is `srcdoc`-loaded
    // (same-origin), `contentWindow.print()` reliably prints its own
    // document rather than the parent page.
    const frame = document.createElement('iframe');
    frame.setAttribute('aria-hidden', 'true');
    frame.style.position = 'fixed';
    frame.style.top = '0';
    frame.style.left = '-10000px';
    frame.style.width = '820px';
    frame.style.height = '1160px';
    frame.style.border = '0';

    const cleanup = () => {
      if (frame.parentNode) frame.parentNode.removeChild(frame);
    };

    frame.onerror = () => {
      cleanup();
      reject(new Error('The PDF report document could not be prepared.'));
    };

    frame.onload = () => {
      const reportWindow = frame.contentWindow;
      const reportDocument = reportWindow?.document;
      if (!reportWindow || !reportDocument) {
        cleanup();
        reject(new Error('The PDF report window could not be opened.'));
        return;
      }

      reportDocument.title = fileName;
      reportWindow.addEventListener('afterprint', cleanup, { once: true });

      // Grow the frame to fit the full report so no content is clipped
      // before print, then give it one more frame to settle before printing.
      const contentHeight = reportDocument.documentElement?.scrollHeight ?? 0;
      if (contentHeight > 0) {
        frame.style.height = `${contentHeight}px`;
      }

      reportWindow.requestAnimationFrame(() => {
        reportWindow.focus();
        reportWindow.print();
        globalThis.setTimeout(cleanup, 60_000);
        resolve();
      });
    };

    frame.srcdoc = html;
    document.body.appendChild(frame);
  });
}

export async function exportHtmlReportAsPdf({
  html,
  fileName,
  dialogTitle,
}: {
  html: string;
  fileName: string;
  dialogTitle: string;
}): Promise<PdfReportResult> {
  if (Platform.OS === 'web') {
    // expo-print's web shim prints the current app page even when HTML is
    // supplied, so the report is printed from an isolated iframe instead
    // (see printReportDocumentOnWeb for why).
    await printReportDocumentOnWeb(html, fileName);
    return { uri: null, shared: false };
  }

  const { uri } = await Print.printToFileAsync({ html, width: 595, height: 842 });
  const canShare = await Sharing.isAvailableAsync();

  if (canShare) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle,
      UTI: 'com.adobe.pdf',
    });
  }

  return { uri, shared: canShare };
}
