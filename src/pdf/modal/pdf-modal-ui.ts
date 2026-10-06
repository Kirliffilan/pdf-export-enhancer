import { Setting, getLanguage } from "obsidian";
import type { PdfExportSettings } from "../../settings/settings";
import type { PdfPreview } from "../pdf-preview";

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
  if (content) {
    content.style.setProperty("width", "100%", "important");
    content.style.setProperty("height", "100%", "important");
    content.style.setProperty("min-width", "0", "important");
    content.style.setProperty("min-height", "0", "important");
    content.style.setProperty("box-sizing", "border-box", "important");
  }
}

export function createPdfLayout(
  modal: Element,
): { left: HTMLElement; right: HTMLElement } | null {
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
  return { left, right };
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
      });
      text.inputEl.style.width = "90px";
    });
  container.appendChild(wrapper);
}

export function createMarginSettings(
  container: HTMLElement,
  settings: PdfExportSettings,
  saveSettings: () => Promise<void>,
) {
  const isRussian = getLanguage() === "ru";
  const wrapper = document.createElement("div");
  wrapper.className = "pdf-export-margin-settings";
  const title = document.createElement("div");
  title.className = "pdf-export-margin-title";
  title.textContent = isRussian ? "Поля страницы" : "Page margins";
  wrapper.appendChild(title);
  createMarginInput(
    wrapper,
    isRussian ? "Сверху" : "Top",
    settings,
    "marginTop",
    saveSettings,
  );
  createMarginInput(
    wrapper,
    isRussian ? "Снизу" : "Bottom",
    settings,
    "marginBottom",
    saveSettings,
  );
  createMarginInput(
    wrapper,
    isRussian ? "Слева" : "Left",
    settings,
    "marginLeft",
    saveSettings,
  );
  createMarginInput(
    wrapper,
    isRussian ? "Справа" : "Right",
    settings,
    "marginRight",
    saveSettings,
  );
  container.appendChild(wrapper);
}

function createMarginInput(
  container: HTMLElement,
  name: string,
  settings: PdfExportSettings,
  key: "marginTop" | "marginBottom" | "marginLeft" | "marginRight",
  saveSettings: () => Promise<void>,
) {
  new Setting(container).setName(name).addText((text) => {
    text.inputEl.type = "number";
    text.inputEl.min = "0";
    text.inputEl.step = "1";
    text.setValue(String(settings[key]));
    text.onChange(async (value) => {
      const parsed = Number(value);
      if (!Number.isFinite(parsed) || parsed < 0) {
        return;
      }
      settings[key] = parsed;
      await saveSettings();
    });
    text.inputEl.style.width = "90px";
  });
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
      select.dispatchEvent(new Event("change", { bubbles: true }));
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

export function hideMarginSetting(modal: Element) {
  const settings = Array.from(modal.querySelectorAll(".setting-item"));
  const marginSetting = settings.find((setting) => {
    const select = setting.querySelector("select") as HTMLSelectElement | null;
    if (!select) {
      return false;
    }
    return !Array.from(select.options).some(
      (option) => option.textContent?.trim().toLowerCase() === "a4",
    );
  });
  if (!marginSetting) {
    return;
  }
  (marginSetting as HTMLElement).style.display = "none";
}

export function setPreviewHeight(preview: PdfPreview | null) {
  preview?.setHeight(540);
}
