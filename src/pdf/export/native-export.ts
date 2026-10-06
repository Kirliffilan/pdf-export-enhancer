import type { PdfExportSettings } from "../../settings/settings";
import {
  applyPrintLineSpacing,
  applyPrintPageBreaks,
  applyPrintMonochrome,
} from "./native-export-formatting";
export class NativePdfExport {
  private getSettings: () => PdfExportSettings;
  private observer: MutationObserver | null = null;
  private exportStyleSnapshot = new Map<HTMLElement, string | null>();
  private insertedPageBreaks = new Set<HTMLElement>();
  constructor(getSettings: () => PdfExportSettings) {
    this.getSettings = getSettings;
  }
  start() {
    if (this.observer) {
      return;
    }
    this.observer = new MutationObserver(() => {
      this.prepareAllPrintRoots();
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
    this.cleanup();
    this.observer?.disconnect();
    this.observer = null;
    window.removeEventListener("beforeprint", this.handleBeforePrint);
    window.removeEventListener("afterprint", this.handleAfterPrint);
  }
  private handleBeforePrint = () => {
    this.prepareAllPrintRoots();
  };
  private handleAfterPrint = () => {
    window.setTimeout(() => {
      this.cleanup();
    }, 300);
  };
  private prepareAllPrintRoots() {
    const roots = Array.from(
      document.querySelectorAll(".print"),
    ) as HTMLElement[];
    for (const root of roots) {
      this.preparePrintRoot(root);
    }
  }
  private preparePrintRoot(root: HTMLElement) {
    const view = root.querySelector(
      ":scope > .markdown-preview-view",
    ) as HTMLElement | null;
    if (!view) {
      return;
    }
    const settings = this.getSettings();
    const saveStyle = (element: HTMLElement) => this.saveOriginalStyle(element);
    applyPrintLineSpacing(view, settings, saveStyle);
    applyPrintPageBreaks(view, settings, saveStyle, this.insertedPageBreaks);
    applyPrintMonochrome(view, settings, saveStyle);
  }
  private saveOriginalStyle(element: HTMLElement) {
    if (this.exportStyleSnapshot.has(element)) {
      return;
    }
    this.exportStyleSnapshot.set(element, element.getAttribute("style"));
  }
  private cleanup() {
    for (const breakElement of this.insertedPageBreaks) {
      breakElement.remove();
    }
    this.insertedPageBreaks.clear();
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
  }
}
