export function configurePdfModalSize(modal: Element) {
  const modalEl = modal as HTMLElement;
  const size = "min(92vw, 92vh)";
  modalEl.style.setProperty("width", size, "important");
  modalEl.style.setProperty("height", size, "important");
  modalEl.style.setProperty("max-width", "92vw", "important");
  modalEl.style.setProperty("max-height", "92vh", "important");
  modalEl.style.setProperty("min-width", "0", "important");
  modalEl.style.setProperty("min-height", "0", "important");
  modalEl.style.setProperty("box-sizing", "border-box", "important");
  const content = modalEl.querySelector(".modal-content") as HTMLElement | null;
  if (!content) {
    return;
  }
  content.style.setProperty("width", "100%", "important");
  content.style.setProperty("height", "100%", "important");
  content.style.setProperty("min-width", "0", "important");
  content.style.setProperty("min-height", "0", "important");
  content.style.setProperty("box-sizing", "border-box", "important");
}
export function createPdfLayout(modal: Element): {
  left: HTMLElement;
  right: HTMLElement;
} | null {
  const content = modal.querySelector(".modal-content") as HTMLElement | null;
  if (!content) {
    return null;
  }
  const layout = document.createElement("div");
  layout.className = "pdf-export-layout";
  const left = document.createElement("div");
  left.className = "pdf-export-settings-left";
  const right = document.createElement("div");
  right.className = "pdf-export-preview-right";
  const children = Array.from(content.children);
  children.forEach((child) => {
    const text = child.textContent?.trim().toLowerCase() ?? "";
    if (text.startsWith("экспорт ") && text.includes(" в pdf")) {
      (child as HTMLElement).style.display = "none";
      return;
    }
    if (isNativeFileNameSetting(child) || isNativeLandscapeSetting(child)) {
      (child as HTMLElement).style.display = "none";
      return;
    }
    left.appendChild(child);
  });
  layout.appendChild(left);
  layout.appendChild(right);
  content.appendChild(layout);
  return { left, right };
}
function isNativeFileNameSetting(element: Element): boolean {
  const text = element.textContent?.trim().toLowerCase() ?? "";
  return (
    text.includes("имя файла") ||
    text.includes("include file name") ||
    text.includes("include filename")
  );
}
function isNativeLandscapeSetting(element: Element): boolean {
  const text = element.textContent?.trim().toLowerCase() ?? "";
  return text.includes("альбом") || text.includes("landscape");
}
