import type { PdfExportSettings } from "../../settings/settings";
export function paginatePreview(
  doc: Document,
  pageHeight: number,
  settings: PdfExportSettings,
): number {
  const sourceSection = doc.querySelector(
    "#pdf-preview-source .markdown-preview-section",
  ) as HTMLElement | null;
  if (!sourceSection) {
    return 1;
  }
  const nodes = Array.from(sourceSection.children) as HTMLElement[];
  const pagesContainer = doc.createElement("div");
  pagesContainer.className = "pdf-preview-pages";
  const sourceRoot = doc.querySelector("#pdf-preview-source");
  if (!sourceRoot) {
    return 1;
  }
  sourceRoot.replaceChildren(pagesContainer);
  let currentPage = createPage(doc);
  pagesContainer.appendChild(currentPage);
  for (const node of nodes) {
    const section = currentPage.querySelector(
      ".markdown-preview-section",
    ) as HTMLElement | null;
    if (!section) {
      continue;
    }
    const isHeadingBreak =
      shouldBreakBefore(node, settings) && section.children.length > 0;
    if (isHeadingBreak) {
      currentPage = createPage(doc);
      pagesContainer.appendChild(currentPage);
    }
    const targetSection = currentPage.querySelector(
      ".markdown-preview-section",
    ) as HTMLElement | null;
    if (!targetSection) {
      continue;
    }
    targetSection.appendChild(node);
    if (
      !fitsPage(currentPage, targetSection, pageHeight) &&
      targetSection.children.length > 1
    ) {
      targetSection.lastElementChild?.remove();
      currentPage = createPage(doc);
      pagesContainer.appendChild(currentPage);
      const nextSection = currentPage.querySelector(
        ".markdown-preview-section",
      ) as HTMLElement | null;
      nextSection?.appendChild(node);
    }
  }
  const pages = Array.from(
    pagesContainer.querySelectorAll(".pdf-preview-page"),
  ) as HTMLElement[];
  pages.forEach((page, index) => {
    page.dataset.page = String(index);
    page.style.setProperty("position", "absolute", "important");
    page.style.setProperty("top", "0", "important");
    page.style.setProperty("left", "0", "important");
    page.style.setProperty("width", "100%", "important");
    page.style.setProperty("height", "100%", "important");
    page.style.setProperty("box-sizing", "border-box", "important");
    page.style.setProperty("opacity", index === 0 ? "1" : "0", "important");
    page.style.setProperty("z-index", index === 0 ? "2" : "1", "important");
    page.style.setProperty("transition", "none", "important");
    const shouldShowNumber =
      settings.showPageNumbers &&
      !(settings.skipFirstPageNumber && index === 0);
    if (shouldShowNumber) {
      addPageNumber(doc, page, index + 1, pages.length, settings);
    }
  });
  return Math.max(1, pages.length);
}
function shouldBreakBefore(
  node: HTMLElement,
  settings: PdfExportSettings,
): boolean {
  if (node.classList.contains("pdf-preview-file-name-title")) {
    return false;
  }
  if (settings.pageBreakH1 && node.tagName.toLowerCase() === "h1") {
    return true;
  }
  if (settings.pageBreakH2 && node.tagName.toLowerCase() === "h2") {
    return true;
  }
  return false;
}
function addPageNumber(
  doc: Document,
  page: HTMLElement,
  pageNumber: number,
  pageCount: number,
  settings: PdfExportSettings,
) {
  const number = doc.createElement("div");
  number.className = "pdf-preview-page-number";
  number.textContent = String(pageNumber);
  number.dataset.pageCount = String(pageCount);
  const bottomPx = Math.max(10, settings.marginBottom * (96 / 25.4) * 0.35);
  number.style.setProperty("position", "absolute", "important");
  number.style.setProperty("bottom", `${bottomPx}px`, "important");
  number.style.setProperty("width", "auto", "important");
  number.style.setProperty("margin", "0", "important");
  number.style.setProperty("padding", "0", "important");
  number.style.setProperty("font-size", "18px", "important");
  number.style.setProperty("font-weight", "500", "important");
  number.style.setProperty("line-height", "1", "important");
  number.style.setProperty("color", "#000000", "important");
  number.style.setProperty("pointer-events", "none", "important");
  if (settings.pageNumberPosition === "left") {
    number.style.setProperty("left", "0", "important");
    number.style.setProperty("right", "auto", "important");
    number.style.setProperty("transform", "none", "important");
    number.style.setProperty("text-align", "left", "important");
  } else if (settings.pageNumberPosition === "right") {
    number.style.setProperty("left", "auto", "important");
    number.style.setProperty("right", "0", "important");
    number.style.setProperty("transform", "none", "important");
    number.style.setProperty("text-align", "right", "important");
  } else {
    number.style.setProperty("left", "50%", "important");
    number.style.setProperty("right", "auto", "important");
    number.style.setProperty("transform", "translateX(-50%)", "important");
    number.style.setProperty("text-align", "center", "important");
  }
  page.appendChild(number);
}
function fitsPage(
  page: HTMLElement,
  section: HTMLElement,
  pageHeight: number,
): boolean {
  const pageStyle = getComputedStyle(page);
  const paddingTop = parseFloat(pageStyle.paddingTop) || 0;
  const paddingBottom = parseFloat(pageStyle.paddingBottom) || 0;
  const availableHeight = pageHeight - paddingTop - paddingBottom;
  const contentHeight = section.scrollHeight;
  return contentHeight <= availableHeight + 1;
}
function createPage(doc: Document): HTMLElement {
  const page = doc.createElement("div");
  page.className = "pdf-preview-page";
  const view = doc.createElement("div");
  view.className = "markdown-preview-view markdown-rendered";
  const sizer = doc.createElement("div");
  sizer.className = "markdown-preview-sizer";
  const section = doc.createElement("div");
  section.className = "markdown-preview-section";
  view.appendChild(sizer);
  sizer.appendChild(section);
  page.appendChild(view);
  return page;
}
