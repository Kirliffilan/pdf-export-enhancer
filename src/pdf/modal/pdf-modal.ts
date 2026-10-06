import { App, PluginSettingTab } from "obsidian";
import type { PdfExportSettings } from "../../settings/settings";
import { PdfExportSettingTab } from "../../settings/settings-tab";
import { PdfPreview } from "../pdf-preview";
import type { NativePdfSettings } from "../pdf-settings";
import { loadNativePdfSettings } from "./pdf-modal-settings";

import {
  configurePdfModalSize,
  createFontSetting,
  createMarginSettings,
  createPdfLayout,
  forceA4,
  hideMarginSetting,
  hideScaleSetting,
  setPreviewHeight,
} from "./pdf-modal-ui";

export interface PdfModalPlugin {
  pdfSettings: PdfExportSettings;
  saveSettings(): Promise<void>;
}

export class PdfModal {
  private app: App;
  private plugin: PdfModalPlugin;
  private observer: MutationObserver | null = null;
  private preview: PdfPreview | null = null;
  private nativePdfSettings: NativePdfSettings | null = null;
  private setupInProgress = false;

  constructor(app: App, plugin: PdfModalPlugin) {
    this.app = app;
    this.plugin = plugin;
  }

  start() {
    this.observer = new MutationObserver(() => {
      void this.trySetup();
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    void this.trySetup();
  }

  private async trySetup() {
    if (document.querySelector(".pdf-export-layout")) {
      return;
    }

    if (this.setupInProgress) {
      return;
    }

    const modals = Array.from(document.querySelectorAll(".modal"));

    const modal = modals.find((element) => this.isPdfModal(element));

    if (!modal) {
      return;
    }

    this.setupInProgress = true;

    try {
      this.nativePdfSettings = await loadNativePdfSettings(this.app);

      if (!this.nativePdfSettings) {
        return;
      }

      this.applyNativeSettingsToModal(modal);
      this.setup(modal);
    } finally {
      this.setupInProgress = false;
    }
  }

  private isPdfModal(modal: Element): boolean {
    const selects = Array.from(
      modal.querySelectorAll("select"),
    ) as HTMLSelectElement[];

    const hasA4Select = selects.some((select) =>
      Array.from(select.options).some(
        (option) => option.textContent?.trim().toLowerCase() === "a4",
      ),
    );

    const checkboxes = modal.querySelectorAll('input[type="checkbox"]');

    const hasTwoCheckboxes = checkboxes.length >= 2;

    const hasMarginSelect = selects.some(
      (select) =>
        !Array.from(select.options).some(
          (option) => option.textContent?.trim().toLowerCase() === "a4",
        ),
    );

    const hasScale = !!modal.querySelector('input[type="range"]');

    return hasA4Select && hasTwoCheckboxes && hasMarginSelect && hasScale;
  }

  private applyNativeSettingsToModal(modal: Element) {
    if (!this.nativePdfSettings) {
      return;
    }

    const checkboxes = Array.from(
      modal.querySelectorAll('input[type="checkbox"]'),
    ) as HTMLInputElement[];

    const fileNameCheckbox = checkboxes[0];
    const landscapeCheckbox = checkboxes[1];

    if (fileNameCheckbox) {
      fileNameCheckbox.checked = this.nativePdfSettings.includeFileName;
    }

    if (landscapeCheckbox) {
      landscapeCheckbox.checked = this.nativePdfSettings.landscape;
    }
  }

  private setup(modal: Element) {
    if (!this.nativePdfSettings) {
      return;
    }

    configurePdfModalSize(modal);
    forceA4(modal);
    hideScaleSetting(modal);

    hideMarginSetting(modal);

    const layout = createPdfLayout(modal);

    if (!layout) {
      return;
    }

    this.preview = new PdfPreview(
      this.app,
      this.plugin.pdfSettings,
      layout.right,
      this.nativePdfSettings,
    );

    createFontSetting(
      layout.left,
      this.plugin.pdfSettings,
      () => this.plugin.saveSettings(),
      this.preview,
    );

    createMarginSettings(layout.left, this.plugin.pdfSettings, () =>
      this.plugin.saveSettings(),
    );

    this.bindNativeSettings(modal);

    requestAnimationFrame(() => {
      setPreviewHeight(this.preview);

      void this.preview?.refresh();
    });
  }

  private bindNativeSettings(modal: Element) {
    const checkboxes = Array.from(
      modal.querySelectorAll('input[type="checkbox"]'),
    ) as HTMLInputElement[];

    const fileNameCheckbox = checkboxes[0];
    const landscapeCheckbox = checkboxes[1];

    fileNameCheckbox?.addEventListener("change", () => {
      if (!this.nativePdfSettings) {
        return;
      }

      this.nativePdfSettings.includeFileName = fileNameCheckbox.checked;

      this.preview?.setNativeSettings(this.nativePdfSettings);

      void this.preview?.refresh();
    });

    landscapeCheckbox?.addEventListener("change", () => {
      if (!this.nativePdfSettings) {
        return;
      }

      this.nativePdfSettings.landscape = landscapeCheckbox.checked;

      this.preview?.setNativeSettings(this.nativePdfSettings);

      void this.preview?.refresh();
    });
  }

  refresh() {
    void this.preview?.refresh();
  }

  createSettingTab(): PluginSettingTab {
    return new PdfExportSettingTab(this.app, this.plugin);
  }

  destroy() {
    this.observer?.disconnect();
    this.observer = null;
    this.preview?.destroy();
    this.preview = null;
    this.nativePdfSettings = null;
    this.setupInProgress = false;
    document.querySelector(".pdf-export-layout")?.remove();
  }
}
