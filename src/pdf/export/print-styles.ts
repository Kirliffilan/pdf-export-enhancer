import type { PdfExportSettings } from "../../settings/settings";

export function createPdfPrintStyle(settings: PdfExportSettings): string {
  const {
    fontSize,
    marginTop,
    marginBottom,
    marginLeft,
    marginRight,
    lineHeight,
    showPageNumbers,
    pageNumberPosition,
    skipFirstPageNumber,
    pageBreakH1,
    pageBreakH2,
    monochrome,
    landscape,
  } = settings;

  const pxPerMm = 96 / 25.4;

  const top = marginTop * pxPerMm;
  const bottom = marginBottom * pxPerMm;
  const left = marginLeft * pxPerMm;
  const right = marginRight * pxPerMm;

  const pageNumberRule = showPageNumbers
    ? `
  @bottom-${pageNumberPosition} {
    content: counter(page);
    font-size: 12pt;
    font-weight: 500;
    line-height: 1;
    color: #000000;
    font-family: sans-serif;
  }`
    : "";

  const firstPageNumberRule =
    showPageNumbers && skipFirstPageNumber
      ? `
  @page :first {
    @bottom-${pageNumberPosition} {
      content: none;
    }
  }`
      : "";

  const h1BreakCss = pageBreakH1
    ? `
  .print > .markdown-preview-view h1 {
    break-before: page !important;
    page-break-before: always !important;
  }`
    : "";

  const h2BreakCss = pageBreakH2
    ? `
  .print > .markdown-preview-view h2 {
    break-before: page !important;
    page-break-before: always !important;
  }`
    : "";

  const monochromeCss = monochrome
    ? `
  .print > .markdown-preview-view,
  .print > .markdown-preview-view *,
  .print > .markdown-preview-view *::before,
  .print > .markdown-preview-view *::after {
    color: #000000 !important;
    background-color: #ffffff !important;
    border-color: #000000 !important;
    box-shadow: none !important;
    text-shadow: none !important;
  }

  .print > .markdown-preview-view a,
  .print > .markdown-preview-view a:hover,
  .print > .markdown-preview-view a:visited {
    color: #000000 !important;
  }

  .print > .markdown-preview-view svg,
  .print > .markdown-preview-view svg * {
    color: #000000 !important;
    fill: #000000 !important;
    stroke: #000000 !important;
  }

  .print > .markdown-preview-view img {
    filter: grayscale(100%) !important;
    -webkit-filter: grayscale(100%) !important;
  }`
    : "";

  return `
@media print {
  @page {
    size: A4 ${landscape ? "landscape" : "portrait"};
    margin: ${top}px ${right}px ${bottom}px ${left}px;
    ${pageNumberRule}
  }

  ${firstPageNumberRule}

  html,
  body {
    margin: 0 !important;
    padding: 0 !important;
  }

  .print {
    margin: 0 !important;
    padding: 0 !important;
    width: 100% !important;
    max-width: none !important;
  }

  .print > .markdown-preview-view {
    box-sizing: border-box !important;
    width: 100% !important;
    max-width: none !important;
    margin: 0 !important;
    padding: 0 !important;
    font-size: ${fontSize}px !important;
    line-height: ${lineHeight} !important;
    --font-text-size: ${fontSize}px !important;
  }

  .print > .markdown-preview-view .markdown-preview-sizer {
    box-sizing: border-box !important;
    width: 100% !important;
    max-width: none !important;
    margin: 0 !important;
    padding: 0 !important;
    font-size: ${fontSize}px !important;
    line-height: ${lineHeight} !important;
    --font-text-size: ${fontSize}px !important;
  }

  .print > .markdown-preview-view .markdown-preview-section {
    box-sizing: border-box !important;
    width: 100% !important;
    max-width: none !important;
    margin: 0 !important;
    padding: 0 !important;
    font-size: ${fontSize}px !important;
    line-height: ${lineHeight} !important;
  }

  .print > .markdown-preview-view .markdown-preview-section > * {
    box-sizing: border-box !important;
  }

  .print > .markdown-preview-view .markdown-preview-section h1,
  .print > .markdown-preview-view .markdown-preview-section h2,
  .print > .markdown-preview-view .markdown-preview-section h3,
  .print > .markdown-preview-view .markdown-preview-section h4,
  .print > .markdown-preview-view .markdown-preview-section h5,
  .print > .markdown-preview-view .markdown-preview-section h6 {
    line-height: ${lineHeight} !important;
  }

  ${h1BreakCss}
  ${h2BreakCss}
  ${monochromeCss}
}
`;
}
