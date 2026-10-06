import { Plugin } from "obsidian";
import { DEFAULT_SETTINGS, PdfExportSettings } from "./settings/settings";
import { PdfModal } from "./pdf/modal/pdf-modal";
import { PdfExportSettingTab } from "./settings/settings-tab";
import styles from "./styles/styles.css";
export default class PdfExportPlugin extends Plugin {
  pdfSettings!: PdfExportSettings;
  private pdfModal!: PdfModal;
  private printFontStyle: HTMLStyleElement | null = null;
  async onload() {
    await this.loadSettings();
    this.applyPrintFontSize();
    this.pdfModal = new PdfModal(this.app, this);
    this.pdfModal.start();
    this.addSettingTab(new PdfExportSettingTab(this.app, this));
    const style = document.createElement("style");
    style.id = "pdf-export-plugin-styles";
    style.textContent = styles;
    document.head.appendChild(style);
  }
  async loadSettings() {
    this.pdfSettings = Object.assign(
      {},
      DEFAULT_SETTINGS,
      await this.loadData(),
    );
  }
  async saveSettings() {
    await this.saveData(this.pdfSettings);
    this.applyPrintFontSize();
    this.pdfModal?.refresh();
  }
  private applyPrintFontSize() {
    if (!this.printFontStyle) {
      this.printFontStyle = document.createElement("style");
      this.printFontStyle.id = "pdf-export-plugin-print-font";
      document.head.appendChild(this.printFontStyle);
    }
    const fontSize = this.pdfSettings.fontSize;
    this.printFontStyle.textContent = `
@media print {
	.markdown-preview-view,
	.markdown-preview-sizer {
		font-size: ${fontSize}px !important;
	}
	body {
		--font-text-size: ${fontSize}px !important;
	}
}
`;
  }
  onunload() {
    this.pdfModal?.destroy();
    document.getElementById("pdf-export-plugin-styles")?.remove();
    this.printFontStyle?.remove();
    this.printFontStyle = null;
  }
}
