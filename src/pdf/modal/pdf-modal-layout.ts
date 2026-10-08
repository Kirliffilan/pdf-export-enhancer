export function configurePdfModalSize(modal: Element) {
  const modalEl = modal as HTMLElement;

  modalEl.style.setProperty("width", "min(82vw, 1000px)", "important");

  modalEl.style.setProperty("height", "min(86vh, 880px)", "important");

  modalEl.style.setProperty("max-width", "82vw", "important");

  modalEl.style.setProperty("max-height", "calc(100vh - 20px)", "important");

  modalEl.style.setProperty("min-width", "0", "important");
  modalEl.style.setProperty("min-height", "0", "important");
  modalEl.style.setProperty("box-sizing", "border-box", "important");

  const content = modalEl.querySelector(".modal-content") as HTMLElement | null;

  if (content) {
    content.style.setProperty("width", "100%", "important");
    content.style.setProperty("height", "100%", "important");
    content.style.setProperty("min-width", "0", "important");
    content.style.setProperty("min-height", "0", "important");
    content.style.setProperty("box-sizing", "border-box", "important");
    content.style.setProperty("overflow", "hidden", "important");
    content.style.setProperty("display", "flex", "important");
    content.style.setProperty("align-items", "center", "important");
    content.style.setProperty("justify-content", "center", "important");
  }

  const title = modalEl.querySelector(".modal-title") as HTMLElement | null;

  if (title) {
    title.style.display = "none";
  }
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

  layout.style.setProperty("display", "flex", "important");
  layout.style.setProperty("align-items", "center", "important");
  layout.style.setProperty("justify-content", "center", "important");
  layout.style.setProperty("width", "100%", "important");
  layout.style.setProperty("height", "auto", "important");
  layout.style.setProperty("max-height", "100%", "important");
  layout.style.setProperty("min-height", "0", "important");
  layout.style.setProperty("min-width", "0", "important");
  layout.style.setProperty("box-sizing", "border-box", "important");
  layout.style.setProperty("gap", "16px", "important");
  layout.style.setProperty("flex-shrink", "0", "important");

  const left = document.createElement("div");
  left.className = "pdf-export-settings-left";

  left.style.setProperty("flex", "0 0 285px", "important");
  left.style.setProperty("width", "285px", "important");
  left.style.setProperty("min-width", "285px", "important");
  left.style.setProperty("max-width", "285px", "important");
  left.style.setProperty("height", "auto", "important");
  left.style.setProperty("min-height", "0", "important");
  left.style.setProperty("display", "flex", "important");
  left.style.setProperty("flex-direction", "column", "important");
  left.style.setProperty("justify-content", "flex-start", "important");
  left.style.setProperty("box-sizing", "border-box", "important");
  left.style.setProperty("overflow", "hidden", "important");
  left.style.setProperty("padding", "0 2px", "important");

  const right = document.createElement("div");
  right.className = "pdf-export-preview-right";

  right.style.setProperty("flex", "1 1 auto", "important");
  right.style.setProperty("width", "auto", "important");
  right.style.setProperty("min-width", "0", "important");
  right.style.setProperty("min-height", "0", "important");
  right.style.setProperty("height", "auto", "important");
  right.style.setProperty("box-sizing", "border-box", "important");
  right.style.setProperty("display", "flex", "important");
  right.style.setProperty("flex-direction", "column", "important");
  right.style.setProperty("align-items", "center", "important");
  right.style.setProperty("justify-content", "center", "important");

  const settingsInner = document.createElement("div");
  settingsInner.className = "pdf-export-settings-inner";

  settingsInner.style.setProperty("width", "100%", "important");
  settingsInner.style.setProperty("height", "auto", "important");
  settingsInner.style.setProperty("max-height", "100%", "important");
  settingsInner.style.setProperty("overflow-y", "auto", "important");
  settingsInner.style.setProperty("overflow-x", "hidden", "important");
  settingsInner.style.setProperty("box-sizing", "border-box", "important");

  const children = Array.from(content.children);

  children.forEach((child) => {
    if (child.querySelector("button")) {
      settingsInner.appendChild(child);
      return;
    }

    if (child.querySelector('input[type="checkbox"]')) {
      (child as HTMLElement).style.display = "none";
      settingsInner.appendChild(child);
      return;
    }

    child.remove();
  });

  left.appendChild(settingsInner);

  layout.appendChild(left);
  layout.appendChild(right);

  content.appendChild(layout);

  return {
    left,
    right,
  };
}
