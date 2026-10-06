import { Plugin } from "obsidian";
import { DEFAULT_SETTINGS, PdfExportSettings } from "./settings/settings";
import { PdfModal } from "./pdf/modal/pdf-modal";
import { PdfExportSettingTab } from "./settings/settings-tab";
import { NativePdfExport } from "./pdf/export/native-export";
import { createPdfPrintStyle } from "./pdf/export/print-styles";
import styles from "./styles/styles.css";
export default class PdfExportPlugin extends Plugin {
  pdfSettings!: PdfExportSettings;
  private pdfModal!: PdfModal;
  private nativePdfExport!: NativePdfExport;
  private printStyle: HTMLStyleElement | null = null;
  async onload() {
    await this.loadSettings();
    this.applyPrintStyles();
    this.nativePdfExport = new NativePdfExport(() => this.pdfSettings);
    this.nativePdfExport.start();
    this.pdfModal = new PdfModal(this.app, this);
    this.pdfModal.start();
    this.addSettingTab(new PdfExportSettingTab(this.app, this));
    const style = document.createElement("style");
    style.id = "pdf-export-plugin-styles";
    style.textContent = styles;
    document.head.appendChild(style);
  }
  async loadSettings() {
    const data = (await this.loadData()) as Record<string, unknown> | null;
    if (data) {
      delete data.paragraphSpacing;
    }
    this.pdfSettings = Object.assign({}, DEFAULT_SETTINGS, data ?? {});
  }
  async saveSettings() {
    await this.saveData(this.pdfSettings);
    this.applyPrintStyles();
    this.pdfModal?.refresh();
  }
  private applyPrintStyles() {
    if (!this.printStyle) {
      this.printStyle = document.createElement("style");
      this.printStyle.id = "pdf-export-plugin-print-font";
      document.head.appendChild(this.printStyle);
    }
    this.printStyle.textContent = createPdfPrintStyle(this.pdfSettings);
  }
  onunload() {
    this.nativePdfExport?.destroy();
    this.pdfModal?.destroy();
    document.getElementById("pdf-export-plugin-styles")?.remove();
    this.printStyle?.remove();
    this.printStyle = null;
  }
}
