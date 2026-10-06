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

    this.applyPrintStyles();

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

    this.applyPrintStyles();

    this.pdfModal?.refresh();
  }

  private applyPrintStyles() {
    if (!this.printFontStyle) {
      this.printFontStyle = document.createElement("style");

      this.printFontStyle.id = "pdf-export-plugin-print-font";

      document.head.appendChild(this.printFontStyle);
    }

    const { fontSize, marginTop, marginBottom, marginLeft, marginRight } =
      this.pdfSettings;

    const pxPerMm = 96 / 25.4;

    const top = marginTop * pxPerMm;
    const bottom = marginBottom * pxPerMm;
    const left = marginLeft * pxPerMm;
    const right = marginRight * pxPerMm;

    this.printFontStyle.textContent = `
@media print {
  @page {
    margin: 0 !important;
  }

  html,
  body {
    margin: 0 !important;
    padding: 0 !important;
  }

  .markdown-preview-view {
    box-sizing: border-box !important;

    padding-top: ${top}px !important;
    padding-right: ${right}px !important;
    padding-bottom: ${bottom}px !important;
    padding-left: ${left}px !important;

    font-size: ${fontSize}px !important;
    --font-text-size: ${fontSize}px !important;
  }

  .markdown-preview-sizer {
    box-sizing: border-box !important;

    padding-top: 0 !important;
    padding-right: 0 !important;
    padding-bottom: 0 !important;
    padding-left: 0 !important;

    max-width: none !important;

    font-size: ${fontSize}px !important;
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
