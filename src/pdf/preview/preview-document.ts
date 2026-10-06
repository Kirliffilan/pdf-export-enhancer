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
  const titleHtml = fileName
    ? `<h1 class="pdf-preview-file-name-title">${escapeHtml(fileName)}</h1>`
    : "";
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
    link.addEventListener("load", finish, { once: true });
    link.addEventListener("error", finish, { once: true });
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
  const headingBreakCss = `
#pdf-preview-source .pdf-preview-page .markdown-preview-section h1 {
  break-before: ${settings.pageBreakH1 ? "page" : "auto"} !important;
  page-break-before: ${settings.pageBreakH1 ? "always" : "auto"} !important;
}
#pdf-preview-source .pdf-preview-page .markdown-preview-section h2 {
  break-before: ${settings.pageBreakH2 ? "page" : "auto"} !important;
  page-break-before: ${settings.pageBreakH2 ? "always" : "auto"} !important;
}`;
  const monochromeCss = settings.monochrome
    ? `
#pdf-preview-source .pdf-preview-page,
#pdf-preview-source .pdf-preview-page *,
#pdf-preview-source .pdf-preview-page *::before,
#pdf-preview-source .pdf-preview-page *::after {
  color: #000000 !important;
  background-color: #ffffff !important;
  border-color: #000000 !important;
  box-shadow: none !important;
  text-shadow: none !important;
}
#pdf-preview-source .pdf-preview-page a,
#pdf-preview-source .pdf-preview-page a:hover,
#pdf-preview-source .pdf-preview-page a:visited {
  color: #000000 !important;
}
#pdf-preview-source .pdf-preview-page svg,
#pdf-preview-source .pdf-preview-page svg * {
  color: #000000 !important;
  fill: #000000 !important;
  stroke: #000000 !important;
}
#pdf-preview-source .pdf-preview-page img {
  filter: grayscale(100%) !important;
  -webkit-filter: grayscale(100%) !important;
}
#pdf-preview-source .pdf-preview-page .callout,
#pdf-preview-source .pdf-preview-page pre,
#pdf-preview-source .pdf-preview-page code,
#pdf-preview-source .pdf-preview-page blockquote,
#pdf-preview-source .pdf-preview-page table,
#pdf-preview-source .pdf-preview-page th,
#pdf-preview-source .pdf-preview-page td {
  background-color: #ffffff !important;
  color: #000000 !important;
  border-color: #000000 !important;
}`
    : "";
  return `
* {
  box-sizing: border-box;
}
@page {
  size: A4 ${nativeSettings.landscape ? "landscape" : "portrait"};
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
  line-height: ${settings.lineHeight} !important;
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
  line-height: ${settings.lineHeight} !important;
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
  font-size: ${settings.fontSize}px !important;
  line-height: ${settings.lineHeight} !important;
  --font-text-size: ${settings.fontSize}px !important;
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
  font-size: ${settings.fontSize}px !important;
  line-height: ${settings.lineHeight} !important;
}
.pdf-preview-page .markdown-preview-section h1,
.pdf-preview-page .markdown-preview-section h2,
.pdf-preview-page .markdown-preview-section h3,
.pdf-preview-page .markdown-preview-section h4,
.pdf-preview-page .markdown-preview-section h5,
.pdf-preview-page .markdown-preview-section h6 {
  line-height: ${settings.lineHeight} !important;
}
.pdf-preview-page img {
  max-width: 100% !important;
  height: auto !important;
}
.pdf-preview-page .pdf-preview-page-number {
  position: absolute !important;
  bottom: ${Math.max(10, marginBottom * 0.35)}px !important;
  width: auto !important;
  margin: 0 !important;
  padding: 0 !important;
  font-size: 18px !important;
  font-weight: 500 !important;
  line-height: 1 !important;
  color: #000000 !important;
  pointer-events: none !important;
}
${headingBreakCss}
${monochromeCss}
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
