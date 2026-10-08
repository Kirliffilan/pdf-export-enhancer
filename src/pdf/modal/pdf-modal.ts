import { App, PluginSettingTab } from "obsidian";
import type { PdfExportSettings } from "../../settings/settings";
import { PdfExportSettingTab } from "../../settings/settings-tab";
import { PdfPreview } from "../pdf-preview";
import type { NativePdfSettings } from "../pdf-settings";
import { loadNativePdfSettings } from "./pdf-modal-settings";
import {
  configurePdfModalSize,
  createFontSetting,
  createLineSpacingSetting,
  createMarginSettings,
  createMonochromeSetting,
  createNativeSettingsControls,
  createPageBreakSettings,
  createPageNumberSettings,
  createPdfLayout,
  forceA4,
  hideMarginSetting,
  hideNativeCheckboxSettings,
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
  private nativeSettingsLoaded = false;
  private nativeSettingsLoading: Promise<void> | null = null;

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

    void this.loadNativeSettings();
    void this.trySetup();
  }

  getNativeSettings(): NativePdfSettings | null {
    return this.nativePdfSettings;
  }

  private async loadNativeSettings() {
    if (this.nativeSettingsLoaded) {
      return;
    }

    if (this.nativeSettingsLoading) {
      await this.nativeSettingsLoading;
      return;
    }

    this.nativeSettingsLoading = (async () => {
      const settings = await loadNativePdfSettings(this.app);

      if (settings) {
        this.nativePdfSettings = settings;
        this.nativeSettingsLoaded = true;
      }
    })();

    try {
      await this.nativeSettingsLoading;
    } finally {
      this.nativeSettingsLoading = null;
    }
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

    const modalEl = modal as HTMLElement;

    const modalContainer = modalEl.closest(
      ".modal-container",
    ) as HTMLElement | null;

    const modalBg = modalContainer?.querySelector(
      ".modal-bg",
    ) as HTMLElement | null;

    this.hideDuringSetup(modalEl, modalContainer, modalBg);

    try {
      await this.loadNativeSettings();

      if (!this.nativePdfSettings) {
        this.showAfterSetup(modalEl, modalContainer, modalBg);

        return;
      }

      this.setup(modal);

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          this.showAfterSetup(modalEl, modalContainer, modalBg);
        });
      });
    } finally {
      this.setupInProgress = false;
    }
  }

  private hideDuringSetup(
    modal: HTMLElement,
    modalContainer: HTMLElement | null,
    modalBg: HTMLElement | null,
  ) {
    modal.style.setProperty("visibility", "hidden", "important");

    modal.style.setProperty("opacity", "0", "important");

    modal.style.setProperty("transition", "none", "important");

    if (modalContainer) {
      modalContainer.style.setProperty("transition", "none", "important");
    }

    if (modalBg) {
      modalBg.style.setProperty("visibility", "hidden", "important");

      modalBg.style.setProperty("opacity", "0", "important");

      modalBg.style.setProperty("transition", "none", "important");
    }
  }

  private showAfterSetup(
    modal: HTMLElement,
    modalContainer: HTMLElement | null,
    modalBg: HTMLElement | null,
  ) {
    if (modalBg) {
      modalBg.style.setProperty("visibility", "visible", "important");

      modalBg.style.setProperty("opacity", "1", "important");
    }

    if (modalContainer) {
      modalContainer.style.setProperty("visibility", "visible", "important");

      modalContainer.style.setProperty("opacity", "1", "important");
    }

    modal.style.setProperty("visibility", "visible", "important");

    modal.style.setProperty("opacity", "1", "important");
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

    const hasMarginSelect = selects.some(
      (select) =>
        !Array.from(select.options).some(
          (option) => option.textContent?.trim().toLowerCase() === "a4",
        ),
    );

    const hasScale = !!modal.querySelector('input[type="range"]');

    return hasA4Select && hasMarginSelect && hasScale;
  }

  private setup(modal: Element) {
    if (!this.nativePdfSettings) {
      return;
    }

    configurePdfModalSize(modal);
    forceA4(modal);
    hideScaleSetting(modal);
    hideMarginSetting(modal);
    hideNativeCheckboxSettings(modal);

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

    createFontSetting(layout.left, this.plugin.pdfSettings, () =>
      this.plugin.saveSettings(),
    );

    createMarginSettings(layout.left, this.plugin.pdfSettings, () =>
      this.plugin.saveSettings(),
    );

    createLineSpacingSetting(layout.left, this.plugin.pdfSettings, () =>
      this.plugin.saveSettings(),
    );

    createPageNumberSettings(layout.left, this.plugin.pdfSettings, () =>
      this.plugin.saveSettings(),
    );

    createPageBreakSettings(layout.left, this.plugin.pdfSettings, () =>
      this.plugin.saveSettings(),
    );

    createMonochromeSetting(layout.left, this.plugin.pdfSettings, () =>
      this.plugin.saveSettings(),
    );

    createNativeSettingsControls(
      layout.right,
      modal,
      this.nativePdfSettings,
      (
        changes: Partial<
          Pick<NativePdfSettings, "includeFileName" | "landscape">
        >,
      ) => {
        if (!this.nativePdfSettings) {
          return;
        }

        Object.assign(this.nativePdfSettings, changes);

        this.preview?.setNativeSettings(this.nativePdfSettings);

        void this.preview?.refresh();
      },
    );

    requestAnimationFrame(() => {
      setPreviewHeight(this.preview);
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
    this.nativeSettingsLoaded = false;
    this.nativeSettingsLoading = null;
    this.setupInProgress = false;

    document.querySelector(".pdf-export-layout")?.remove();

    document.getElementById("pdf-export-native-icon-styles")?.remove();
  }
}
