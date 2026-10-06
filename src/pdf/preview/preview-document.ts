import { App } from "obsidian";
import type { PdfExportSettings } from "../../settings/settings";
import { getLoadedCss } from "../print-css";
import { A4_WIDTH, A4_HEIGHT } from "../pagination";
import type { NativePdfSettings } from "../pdf-settings";

export function writePreviewDocument(
  doc: Document,
  html: string,
  htmlClasses: string,
  bodyClasses: string,
  fileName: string = "",
) {
  const titleHtml = fileName ? `<h1>${escapeHtml(fileName)}</h1>` : "";

  doc.open();

  doc.write(
    `<!DOCTYPE html>
<html class="${htmlClasses}">
<head>
<meta charset="UTF-8">
<base href="${escapeAttribute(document.baseURI)}">
</head>
<body class="${bodyClasses}">
<div id="pdf-preview-source">
  <div class="markdown-preview-view markdown-rendered">
    <div class="markdown-preview-sizer">
      <div class="markdown-preview-section">
        ${titleHtml}
        ${html}
      </div>
    </div>
  </div>
</div>
</body>
</html>`,
  );

  doc.close();
}

export async function applyPreviewStyles(
  doc: Document,
  app: App,
  settings: PdfExportSettings,
  nativeSettings: NativePdfSettings,
) {
  await appendParentStyles(doc);

  const css = await getLoadedCss(app);

  if (css.trim()) {
    const style = doc.createElement("style");
    style.textContent = css;
    doc.head.appendChild(style);
  }

  const previewStyle = doc.createElement("style");

  previewStyle.textContent = getPreviewCss(settings, nativeSettings);

  doc.head.appendChild(previewStyle);
}

async function appendParentStyles(doc: Document) {
  const stylesheetLinks: HTMLLinkElement[] = [];

  for (const node of Array.from(document.head.children)) {
    if (node instanceof HTMLLinkElement) {
      if (!isStylesheetLink(node)) {
        continue;
      }

      if (isOwnPluginLink(node)) {
        continue;
      }

      const link = doc.createElement("link");
      link.rel = "stylesheet";
      link.href = node.href;

      if (node.media) {
        link.media = node.media;
      }

      doc.head.appendChild(link);
      stylesheetLinks.push(link);

      continue;
    }

    if (node instanceof HTMLStyleElement) {
      if (isOwnPluginStyle(node)) {
        continue;
      }

      const style = doc.createElement("style");
      style.textContent = node.textContent || "";
      doc.head.appendChild(style);
    }
  }

  await Promise.all(stylesheetLinks.map((link) => waitForStylesheet(link)));
}

function isStylesheetLink(node: HTMLLinkElement): boolean {
  const rel = node.rel.toLowerCase().split(/\s+/).filter(Boolean);

  return rel.includes("stylesheet");
}

function isOwnPluginLink(node: HTMLLinkElement): boolean {
  return node.href.toLowerCase().includes("/plugins/pdf-export-settings/");
}

function isOwnPluginStyle(node: HTMLStyleElement): boolean {
  return (
    node.id === "pdf-export-plugin-styles" ||
    node.id === "pdf-export-plugin-print-font"
  );
}

function waitForStylesheet(link: HTMLLinkElement): Promise<void> {
  return new Promise<void>((resolve) => {
    let settled = false;

    const finish = () => {
      if (settled) {
        return;
      }

      settled = true;
      resolve();
    };

    link.addEventListener("load", finish, {
      once: true,
    });

    link.addEventListener("error", finish, {
      once: true,
    });

    window.setTimeout(finish, 3000);
  });
}

function escapeAttribute(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function mmToPx(value: number): number {
  return value * (96 / 25.4);
}

function getPreviewCss(
  settings: PdfExportSettings,
  nativeSettings: NativePdfSettings,
): string {
  const pageWidth = nativeSettings.landscape ? A4_HEIGHT : A4_WIDTH;

  const pageHeight = nativeSettings.landscape ? A4_WIDTH : A4_HEIGHT;

  const marginTop = mmToPx(settings.marginTop);
  const marginBottom = mmToPx(settings.marginBottom);
  const marginLeft = mmToPx(settings.marginLeft);
  const marginRight = mmToPx(settings.marginRight);

  const orientation = nativeSettings.landscape ? "landscape" : "portrait";

  return `
* {
  box-sizing: border-box;
}

@page {
  size: A4 ${orientation};
  margin: 0;
}

html {
  margin: 0 !important;
  padding: 0 !important;
  width: ${pageWidth}px !important;
  min-width: ${pageWidth}px !important;
  background: white !important;
}

body {
  margin: 0 !important;
  padding: 0 !important;
  width: ${pageWidth}px !important;
  min-width: ${pageWidth}px !important;
  background: white !important;
  overflow: visible !important;
  font-size: ${settings.fontSize}px !important;
  --font-text-size: ${settings.fontSize}px !important;
}

#pdf-preview-source {
  width: ${pageWidth}px !important;
  margin: 0 !important;
  padding: 0 !important;
}

.pdf-preview-pages {
  width: ${pageWidth}px !important;
  margin: 0 !important;
  padding: 0 !important;
}

.pdf-preview-page {
  width: ${pageWidth}px !important;
  height: ${pageHeight}px !important;
  min-height: ${pageHeight}px !important;
  max-height: ${pageHeight}px !important;

  box-sizing: border-box !important;
  position: relative !important;
  overflow: hidden !important;

  margin: 0 !important;

  padding:
    ${marginTop}px
    ${marginRight}px
    ${marginBottom}px
    ${marginLeft}px !important;

  background: white !important;
}

.pdf-preview-page .markdown-preview-view {
  width: 100% !important;
  max-width: none !important;
  min-width: 0 !important;

  height: auto !important;
  min-height: 0 !important;

  margin: 0 !important;
  padding: 0 !important;

  overflow: visible !important;
  background: transparent !important;

  font-size: ${settings.fontSize}px !important;
  --font-text-size: ${settings.fontSize}px !important;
}

.pdf-preview-page .markdown-preview-sizer {
  width: 100% !important;
  max-width: none !important;
  min-width: 0 !important;

  height: auto !important;
  min-height: 0 !important;

  margin: 0 !important;
  padding: 0 !important;

  overflow: visible !important;
}

.pdf-preview-page .markdown-preview-section {
  width: 100% !important;
  max-width: none !important;
  min-width: 0 !important;

  height: auto !important;
  min-height: 0 !important;

  margin: 0 !important;
  padding: 0 !important;

  overflow: visible !important;
}

.pdf-preview-page img {
  max-width: 100% !important;
  height: auto !important;
}

/*
 * Реальный PDF.
 *
 * Стандартный Obsidian margin уже выставлен в none.
 * Поэтому наши поля задаются через padding контента.
 */
@media print {
  @page {
    size: A4 ${orientation};
    margin: 0;
  }

  html,
  body {
    margin: 0 !important;
    padding: 0 !important;
  }

  .markdown-preview-view,
  .markdown-preview-sizer {
    box-sizing: border-box !important;

    padding-top: ${marginTop}px !important;
    padding-right: ${marginRight}px !important;
    padding-bottom: ${marginBottom}px !important;
    padding-left: ${marginLeft}px !important;
  }

  .markdown-preview-view {
    font-size: ${settings.fontSize}px !important;
    --font-text-size: ${settings.fontSize}px !important;
  }

  .markdown-preview-sizer {
    max-width: none !important;
  }
}
`;
}

export async function waitForIframeResources(doc: Document) {
  try {
    await doc.fonts.ready;
  } catch {}

  await waitForIframeLayout();
}

async function waitForIframeLayout() {
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        resolve();
      });
    });
  });
}
