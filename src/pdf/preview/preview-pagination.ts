import { A4_HEIGHT } from "../pagination";

export function paginatePreview(doc: Document): number {
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
    section.appendChild(node);

    if (!fitsPage(currentPage, section) && section.children.length > 1) {
      section.lastElementChild?.remove();
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
    page.style.setProperty(
      "display",
      index === 0 ? "block" : "none",
      "important",
    );
  });
  return Math.max(1, pages.length);
}

function fitsPage(page: HTMLElement, section: HTMLElement): boolean {
  const pageStyle = getComputedStyle(page);
  const paddingTop = parseFloat(pageStyle.paddingTop) || 0;
  const paddingBottom = parseFloat(pageStyle.paddingBottom) || 0;
  const availableHeight = A4_HEIGHT - paddingTop - paddingBottom;
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
