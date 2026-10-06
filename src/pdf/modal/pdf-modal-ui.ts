import { Setting, getLanguage } from "obsidian";
import type { PdfExportSettings } from "../../settings/settings";
import type { PdfPreview } from "../pdf-preview";

export function configurePdfModalSize(modal: Element) {
  const modalEl = modal as HTMLElement;

  modalEl.style.setProperty("width", "760px", "important");
  modalEl.style.setProperty("max-width", "90vw", "important");
  modalEl.style.setProperty("min-width", "0", "important");
  modalEl.style.setProperty("height", "80vh", "important");
  modalEl.style.setProperty("max-height", "80vh", "important");
  modalEl.style.setProperty("min-height", "0", "important");
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
    left.appendChild(child);
  });

  layout.appendChild(left);
  layout.appendChild(right);
  content.appendChild(layout);

  return {
    left,
    right,
  };
}

export function createFontSetting(
  container: HTMLElement,
  settings: PdfExportSettings,
  saveSettings: () => Promise<void>,
  preview: PdfPreview | null,
) {
  const isRussian = getLanguage() === "ru";

  const wrapper = document.createElement("div");
  wrapper.className = "pdf-export-font-size-setting";

  new Setting(wrapper)
    .setName(isRussian ? "Размер шрифта" : "Text size")
    .setDesc(
      isRussian
        ? "Размер текста при экспорте в PDF"
        : "Text size used when exporting to PDF",
    )
    .addText((text) => {
      text.inputEl.type = "number";
      text.inputEl.step = "0.5";
      text.inputEl.min = "1";
      text.setValue(String(settings.fontSize));

      text.onChange(async (value) => {
        const parsed = Number(value);

        if (!Number.isFinite(parsed) || parsed <= 0) {
          return;
        }

        settings.fontSize = parsed;
        await saveSettings();
        await preview?.refresh();
      });

      text.inputEl.style.width = "90px";
    });

  container.appendChild(wrapper);
}

export function forceA4(modal: Element) {
  const settings = Array.from(modal.querySelectorAll(".setting-item"));

  const pageSetting = settings.find((setting) => {
    const select = setting.querySelector("select") as HTMLSelectElement | null;

    if (!select) {
      return false;
    }

    return Array.from(select.options).some(
      (option) => option.textContent?.trim().toLowerCase() === "a4",
    );
  });

  if (!pageSetting) {
    return;
  }

  const select = pageSetting.querySelector(
    "select",
  ) as HTMLSelectElement | null;

  if (select) {
    const a4 = Array.from(select.options).find(
      (option) => option.textContent?.trim().toLowerCase() === "a4",
    );

    if (a4) {
      select.value = a4.value;
      select.dispatchEvent(
        new Event("change", {
          bubbles: true,
        }),
      );
    }
  }

  (pageSetting as HTMLElement).style.display = "none";
}

export function hideScaleSetting(modal: Element) {
  const settings = Array.from(modal.querySelectorAll(".setting-item"));

  const scaleSetting = settings.find((setting) =>
    setting.querySelector('input[type="range"]'),
  );

  if (!scaleSetting) {
    return;
  }

  (scaleSetting as HTMLElement).style.display = "none";
}

export function setPreviewHeight(preview: PdfPreview | null) {
  preview?.setHeight(540);
}
