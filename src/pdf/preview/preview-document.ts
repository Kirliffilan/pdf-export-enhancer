import { App } from "obsidian";
import type { PdfExportSettings } from "../../settings/settings";
import { getLoadedCss } from "../print-css";
import { A4_WIDTH, A4_HEIGHT } from "../pagination";

export function writePreviewDocument(
  doc: Document,
  html: string,
  htmlClasses: string,
  bodyClasses: string,
) {
  doc.open();

  doc.write(
    `<!DOCTYPE html><html class="${htmlClasses}"><head><meta charset="UTF-8"><base href="${escapeAttribute(document.baseURI)}"></head><body class="${bodyClasses}"><div id="pdf-preview-source"><div class="markdown-preview-view markdown-rendered"><div class="markdown-preview-sizer"><div class="markdown-preview-section">${html}</div></div></div></div></body></html>`,
  );

  doc.close();
}

export async function applyPreviewStyles(
  doc: Document,
  app: App,
  settings: PdfExportSettings,
) {
  await appendParentStyles(doc);

  const css = await getLoadedCss(app);

  if (css.trim()) {
    const style = doc.createElement("style");
    style.textContent = css;
    doc.head.appendChild(style);
  }

  const previewStyle = doc.createElement("style");
  previewStyle.textContent = getPreviewCss(settings);
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

function getPreviewCss(settings: PdfExportSettings): string {
  return `
* {
	box-sizing: border-box;
}
html {
	margin: 0 !important;
	padding: 0 !important;
	width: ${A4_WIDTH}px !important;
	min-width: ${A4_WIDTH}px !important;
	background: white !important;
}
body {
	margin: 0 !important;
	padding: 0 !important;
	width: ${A4_WIDTH}px !important;
	min-width: ${A4_WIDTH}px !important;
	background: white !important;
	overflow: visible !important;
	font-size: ${settings.fontSize}px !important;
	--font-text-size: ${settings.fontSize}px !important;
}
#pdf-preview-source {
	width: ${A4_WIDTH}px !important;
	margin: 0 !important;
	padding: 0 !important;
}
.pdf-preview-pages {
	width: ${A4_WIDTH}px !important;
	margin: 0 !important;
	padding: 0 !important;
}
.pdf-preview-page {
	width: ${A4_WIDTH}px !important;
	height: ${A4_HEIGHT}px !important;
	min-height: ${A4_HEIGHT}px !important;
	max-height: ${A4_HEIGHT}px !important;
	box-sizing: border-box !important;
	position: relative !important;
	overflow: hidden !important;
	margin: 0 !important;
	padding: 48px !important;
	background: white !important;
	color: black !important;
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
