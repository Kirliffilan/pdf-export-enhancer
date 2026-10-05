import { App, PluginSettingTab, Setting } from "obsidian";
import type { PdfExportSettings } from "../settings/settings";
import { PdfExportSettingTab } from "../settings/settings-tab";
import { PdfPreview } from "./pdf-preview";
export interface PdfModalPlugin {
  pdfSettings: PdfExportSettings;
  saveSettings(): Promise<void>;
}
export class PdfModal {
  private app: App;
  private plugin: PdfModalPlugin;
  private observer: MutationObserver | null = null;
  private preview: PdfPreview | null = null;
  constructor(app: App, plugin: PdfModalPlugin) {
    this.app = app;
    this.plugin = plugin;
  }
  start() {
    this.observer = new MutationObserver(() => {
      this.trySetup();
    });
    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
    this.trySetup();
  }
  private trySetup() {
    if (document.querySelector(".pdf-export-layout")) {
      return;
    }
    const modals = Array.from(document.querySelectorAll(".modal"));
    const modal = modals.find((element) => {
      const text = element.textContent ?? "";
      return text.includes("Экспорт в PDF") || text.includes("Export PDF");
    });
    if (!modal) {
      return;
    }
    this.setup(modal);
  }
  private setup(modal: Element) {
    const content = modal.querySelector(".modal-content") as HTMLElement | null;
    if (!content) {
      return;
    }
    const modalEl = modal as HTMLElement;
    modalEl.style.setProperty("width", "760px", "important");
    modalEl.style.setProperty("max-width", "90vw", "important");
    modalEl.style.setProperty("min-width", "0", "important");
    modalEl.style.setProperty("height", "80vh", "important");
    modalEl.style.setProperty("max-height", "80vh", "important");
    modalEl.style.setProperty("min-height", "0", "important");
    this.forceA4(modal);
    this.hideScaleSetting(modal);
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
    this.createFontSetting(left);
    this.preview = new PdfPreview(this.app, this.plugin.pdfSettings, right);
    requestAnimationFrame(() => {
      this.fitPreviewHeight();
      this.preview?.refresh();
    });
  }
  private createFontSetting(container: HTMLElement) {
    const wrapper = document.createElement("div");
    wrapper.className = "pdf-export-font-size-setting";
    new Setting(wrapper)
      .setName("Размер шрифта")
      .setDesc("Размер текста при экспорте в PDF")
      .addText((text) => {
        text.inputEl.type = "number";
        text.inputEl.step = "0.5";
        text.inputEl.min = "1";
        text.setValue(String(this.plugin.pdfSettings.fontSize));
        text.onChange(async (value) => {
          const parsed = Number(value);
          if (!Number.isFinite(parsed) || parsed <= 0) {
            return;
          }
          this.plugin.pdfSettings.fontSize = parsed;
          await this.plugin.saveSettings();
        });
        text.inputEl.style.width = "90px";
      });
    container.appendChild(wrapper);
  }
  private fitPreviewHeight() {
    if (!this.preview) {
      return;
    }
    this.preview.setHeight(540);
  }
  private forceA4(modal: Element) {
    const settings = Array.from(modal.querySelectorAll(".setting-item"));
    const pageSetting = settings.find((setting) =>
      (setting.textContent ?? "").includes("Размер страницы"),
    );
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
  private hideScaleSetting(modal: Element) {
    const settings = Array.from(modal.querySelectorAll(".setting-item"));
    const scaleSetting = settings.find((setting) =>
      (setting.textContent ?? "").includes("Масштабирование"),
    );
    if (!scaleSetting) {
      return;
    }
    (scaleSetting as HTMLElement).style.display = "none";
  }
  refresh() {
    this.preview?.refresh();
  }
  createSettingTab(): PluginSettingTab {
    return new PdfExportSettingTab(this.app, this.plugin);
  }
  destroy() {
    this.observer?.disconnect();
    this.observer = null;
    this.preview?.destroy();
    this.preview = null;
    document.querySelector(".pdf-export-layout")?.remove();
  }
}
