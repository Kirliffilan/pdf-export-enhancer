import type { PdfExportSettings } from "../../settings/settings";
type SaveStyle = (element: HTMLElement) => void;
export function applyPrintLineSpacing(
  view: HTMLElement,
  settings: PdfExportSettings,
  saveStyle: SaveStyle,
) {
  const { fontSize, lineHeight } = settings;
  const baseElements = [
    view,
    ...Array.from(
      view.querySelectorAll(
        ".markdown-preview-sizer, .markdown-preview-section",
      ),
    ),
  ] as HTMLElement[];
  for (const element of baseElements) {
    saveStyle(element);
    element.style.setProperty("font-size", `${fontSize}px`, "important");
    element.style.setProperty("line-height", String(lineHeight), "important");
  }
  const headings = Array.from(
    view.querySelectorAll("h1, h2, h3, h4, h5, h6"),
  ) as HTMLElement[];
  for (const heading of headings) {
    saveStyle(heading);
    heading.style.setProperty("line-height", String(lineHeight), "important");
  }
}
export function applyPrintPageBreaks(
  view: HTMLElement,
  settings: PdfExportSettings,
  saveStyle: SaveStyle,
  insertedPageBreaks: Set<HTMLElement>,
) {
  const { pageBreakH1, pageBreakH2 } = settings;
  const headings = Array.from(view.querySelectorAll("h1, h2")) as HTMLElement[];
  for (const heading of headings) {
    const tag = heading.tagName.toLowerCase();
    const enabled =
      (tag === "h1" && pageBreakH1) || (tag === "h2" && pageBreakH2);
    if (!enabled) {
      continue;
    }
    const parent = heading.parentElement;
    if (!parent) {
      continue;
    }
    const previousElement = heading.previousElementSibling;
    if (!previousElement) {
      continue;
    }
    if (previousElement.classList.contains("pdf-export-native-page-break")) {
      continue;
    }
    const breakElement = document.createElement("div");
    breakElement.className = "pdf-export-native-page-break";
    breakElement.style.setProperty("display", "block", "important");
    breakElement.style.setProperty("width", "100%", "important");
    breakElement.style.setProperty("height", "0", "important");
    breakElement.style.setProperty("margin", "0", "important");
    breakElement.style.setProperty("padding", "0", "important");
    breakElement.style.setProperty("border", "0", "important");
    breakElement.style.setProperty("break-before", "page", "important");
    breakElement.style.setProperty("page-break-before", "always", "important");
    breakElement.style.setProperty(
      "-webkit-column-break-before",
      "always",
      "important",
    );
    parent.insertBefore(breakElement, heading);
    insertedPageBreaks.add(breakElement);
    saveStyle(heading);
    heading.style.setProperty("break-before", "page", "important");
    heading.style.setProperty("page-break-before", "always", "important");
    heading.style.setProperty(
      "-webkit-column-break-before",
      "always",
      "important",
    );
  }
}
export function applyPrintMonochrome(
  view: HTMLElement,
  settings: PdfExportSettings,
  saveStyle: SaveStyle,
) {
  if (!settings.monochrome) {
    return;
  }
  const elements = [
    view,
    ...Array.from(view.querySelectorAll("*")),
  ] as HTMLElement[];
  for (const element of elements) {
    saveStyle(element);
    element.style.setProperty("color", "#000000", "important");
    element.style.setProperty("background-color", "#ffffff", "important");
    element.style.setProperty("border-color", "#000000", "important");
    element.style.setProperty("box-shadow", "none", "important");
    element.style.setProperty("text-shadow", "none", "important");
  }
  const images = Array.from(view.querySelectorAll("img")) as HTMLImageElement[];
  for (const image of images) {
    saveStyle(image);
    image.style.setProperty("filter", "grayscale(100%)", "important");
    image.style.setProperty("-webkit-filter", "grayscale(100%)", "important");
  }
}
