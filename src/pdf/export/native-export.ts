import type { App } from "obsidian";
import type { PdfExportSettings } from "../../settings/settings";
import type { NativePdfSettings } from "../pdf-settings";
import {
  applyPrintLineSpacing,
  applyPrintPageBreaks,
  applyPrintMonochrome,
} from "./native-export-formatting";

export class NativePdfExport {
  private getSettings: () => PdfExportSettings;
  private getNativeSettings: () => NativePdfSettings | null;
  private app: App;

  private observer: MutationObserver | null = null;
  private exportStyleSnapshot = new Map<HTMLElement, string | null>();
  private insertedPageBreaks = new Set<HTMLElement>();
  private insertedFileNameTitles = new Set<HTMLElement>();
  private nativePrintStyle: HTMLStyleElement | null = null;
  private cleanupTimeout: number | null = null;

  constructor(
    getSettings: () => PdfExportSettings,
    getNativeSettings: () => NativePdfSettings | null,
    app: App,
  ) {
    this.getSettings = getSettings;
    this.getNativeSettings = getNativeSettings;
    this.app = app;
  }

  start() {
    if (this.observer) {
      return;
    }

    this.observer = new MutationObserver((mutations) => {
      if (mutations.some((mutation) => !this.isGeneratedMutation(mutation))) {
        this.prepareAllPrintRoots();
      }
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    window.addEventListener("beforeprint", this.handleBeforePrint);
    window.addEventListener("afterprint", this.handleAfterPrint);

    this.prepareAllPrintRoots();
  }

  destroy() {
    if (this.cleanupTimeout !== null) {
      window.clearTimeout(this.cleanupTimeout);
      this.cleanupTimeout = null;
    }

    this.cleanup(true);
    this.observer?.disconnect();
    this.observer = null;

    window.removeEventListener("beforeprint", this.handleBeforePrint);
    window.removeEventListener("afterprint", this.handleAfterPrint);
  }

  private isGeneratedMutation(mutation: MutationRecord): boolean {
    if (
      mutation.target instanceof Element &&
      mutation.target.closest(
        ".pdf-export-native-file-name-title, .pdf-export-native-page-break",
      )
    ) {
      return true;
    }

    const changedNodes = [
      ...Array.from(mutation.addedNodes),
      ...Array.from(mutation.removedNodes),
    ];

    return (
      changedNodes.length > 0 &&
      changedNodes.every((node) => this.isGeneratedNode(node))
    );
  }

  private isGeneratedNode(node: Node): boolean {
    if (!(node instanceof HTMLElement)) {
      return false;
    }

    return (
      node.classList.contains("pdf-export-native-file-name-title") ||
      node.classList.contains("pdf-export-native-page-break")
    );
  }

  private handleBeforePrint = () => {
    if (this.cleanupTimeout !== null) {
      window.clearTimeout(this.cleanupTimeout);
      this.cleanupTimeout = null;
    }

    this.prepareAllPrintRoots();
    this.applyNativePrintStyle();
  };

  private handleAfterPrint = () => {
    if (this.cleanupTimeout !== null) {
      window.clearTimeout(this.cleanupTimeout);
    }

    this.cleanupTimeout = window.setTimeout(() => {
      this.cleanup();
      this.cleanupTimeout = null;
    }, 300);
  };

  private prepareAllPrintRoots() {
    const roots = Array.from(
      document.querySelectorAll(".print"),
    ) as HTMLElement[];

    for (const root of roots) {
      this.preparePrintRoot(root);
    }

    this.applyNativePrintStyle();
  }

  private preparePrintRoot(root: HTMLElement) {
    const view = root.querySelector(
      ":scope > .markdown-preview-view",
    ) as HTMLElement | null;

    if (!view) {
      return;
    }

    const settings = this.getSettings();
    const nativeSettings = this.getNativeSettings();
    const saveStyle = (element: HTMLElement) => this.saveOriginalStyle(element);

    applyPrintLineSpacing(view, settings, saveStyle);
    applyPrintPageBreaks(view, settings, saveStyle, this.insertedPageBreaks);
    applyPrintMonochrome(view, settings, saveStyle);

    if (nativeSettings) {
      this.applyFileName(root, nativeSettings);
    }
  }

  private applyFileName(root: HTMLElement, nativeSettings: NativePdfSettings) {
    const file = this.app.workspace.getActiveFile();

    if (!file) {
      return;
    }

    const section = root.querySelector(
      ".markdown-preview-section",
    ) as HTMLElement | null;

    if (!section) {
      return;
    }

    const fileName = file.basename;

    const existingTitle = Array.from(section.querySelectorAll("h1")).find(
      (element) => element.textContent?.trim() === fileName,
    ) as HTMLElement | undefined;

    if (existingTitle) {
      this.saveOriginalStyle(existingTitle);

      existingTitle.style.setProperty(
        "display",
        nativeSettings.includeFileName ? "block" : "none",
        "important",
      );

      if (
        existingTitle.classList.contains("pdf-export-native-file-name-title")
      ) {
        this.insertedFileNameTitles.add(existingTitle);
      }

      return;
    }

    if (!nativeSettings.includeFileName) {
      return;
    }

    const title = document.createElement("h1");
    title.className = "pdf-export-native-file-name-title";
    title.textContent = fileName;

    section.prepend(title);
    this.insertedFileNameTitles.add(title);
  }

  private applyNativePrintStyle() {
    const nativeSettings = this.getNativeSettings();

    if (!nativeSettings) {
      return;
    }

    if (!this.nativePrintStyle) {
      this.nativePrintStyle = document.createElement("style");
      this.nativePrintStyle.id = "pdf-export-native-print-style";
      document.head.appendChild(this.nativePrintStyle);
    }

    this.nativePrintStyle.textContent = `
@media print {
  @page {
    size: A4 ${nativeSettings.landscape ? "landscape" : "portrait"};
  }

  .pdf-export-native-file-name-title {
    display: ${nativeSettings.includeFileName ? "block" : "none"} !important;
  }
}
`;
  }

  private saveOriginalStyle(element: HTMLElement) {
    if (this.exportStyleSnapshot.has(element)) {
      return;
    }

    this.exportStyleSnapshot.set(element, element.getAttribute("style"));
  }

  private cleanup(removePrintStyle = false) {
    for (const breakElement of this.insertedPageBreaks) {
      breakElement.remove();
    }

    this.insertedPageBreaks.clear();

    for (const titleElement of this.insertedFileNameTitles) {
      titleElement.remove();
    }

    this.insertedFileNameTitles.clear();

    for (const [element, originalStyle] of this.exportStyleSnapshot) {
      if (!element.isConnected) {
        continue;
      }

      if (originalStyle === null) {
        element.removeAttribute("style");
      } else {
        element.setAttribute("style", originalStyle);
      }
    }

    this.exportStyleSnapshot.clear();

    if (removePrintStyle) {
      this.nativePrintStyle?.remove();
      this.nativePrintStyle = null;
    }
  }
}
