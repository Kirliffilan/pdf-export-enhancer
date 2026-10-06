import { App, MarkdownView, getLanguage } from "obsidian";
import type { PdfExportSettings } from "../settings/settings";
import { getMarkdownSource } from "./pdf-source";
import { A4_WIDTH, A4_HEIGHT } from "./pagination";
import type { NativePdfSettings } from "./pdf-settings";
import { renderMarkdown } from "./preview/preview-renderer";
import {
  applyPreviewStyles,
  waitForIframeResources,
  writePreviewDocument,
} from "./preview/preview-document";
import { paginatePreview } from "./preview/preview-pagination";
import {
  renderNavigation,
  updateNavigation,
} from "./preview/preview-navigation";
export class PdfPreview {
  private app: App;
  private settings: PdfExportSettings;
  private container: HTMLElement;
  private nativeSettings: NativePdfSettings;
  private header: HTMLElement;
  private navigation: HTMLElement;
  private viewport: HTMLElement;
  private iframe: HTMLIFrameElement | null = null;
  private pageSwitchCover: HTMLElement | null = null;
  private currentPage = 0;
  private pageCount = 1;
  private refreshId = 0;
  private pageSwitchToken = 0;
  constructor(
    app: App,
    settings: PdfExportSettings,
    container: HTMLElement,
    nativeSettings: NativePdfSettings,
  ) {
    this.app = app;
    this.settings = settings;
    this.container = container;
    this.nativeSettings = nativeSettings;
    this.header = document.createElement("div");
    this.header.className = "pdf-export-preview-header";
    this.navigation = document.createElement("div");
    this.navigation.className = "pdf-export-preview-navigation";
    this.viewport = document.createElement("div");
    this.viewport.className = "pdf-export-preview-viewport";
    this.container.appendChild(this.header);
    this.container.appendChild(this.navigation);
    this.container.appendChild(this.viewport);
    this.header.textContent = this.getPreviewTitle();
  }
  setNativeSettings(settings: NativePdfSettings) {
    this.nativeSettings = settings;
  }
  async refresh() {
    const refreshId = ++this.refreshId;
    const requestedPage = this.currentPage;
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!view) {
      this.showError(
        this.isRussian()
          ? "Не удалось получить текущую заметку"
          : "Could not get the current note",
      );
      return;
    }
    const source = getMarkdownSource(view);
    if (!source) {
      this.showError(
        this.isRussian()
          ? "Не удалось получить текст заметки"
          : "Could not get note content",
      );
      return;
    }
    const html = await renderMarkdown(
      this.app,
      source.markdown,
      source.sourcePath,
    );
    if (refreshId !== this.refreshId) {
      return;
    }
    if (!html) {
      this.showError(
        this.isRussian()
          ? "Ошибка рендера Markdown"
          : "Markdown rendering error",
      );
      return;
    }
    await this.createIframe(html, source.sourcePath, refreshId, requestedPage);
  }
  private async createIframe(
    html: string,
    sourcePath: string,
    refreshId: number,
    requestedPage: number,
  ) {
    this.viewport.empty();
    this.iframe = null;
    this.pageSwitchCover = null;
    const iframe = document.createElement("iframe");
    iframe.className = "pdf-export-preview-iframe";
    iframe.setAttribute("frameborder", "0");
    iframe.setAttribute("scrolling", "no");
    iframe.style.opacity = "1";
    this.viewport.appendChild(iframe);
    this.iframe = iframe;
    const cover = document.createElement("div");
    cover.className = "pdf-export-preview-cover";
    cover.style.opacity = "1";
    this.viewport.appendChild(cover);
    this.pageSwitchCover = cover;
    const doc = iframe.contentDocument;
    if (!doc) {
      this.showError(
        this.isRussian()
          ? "Не удалось создать предпросмотр"
          : "Could not create preview",
      );
      return;
    }
    const fileName = sourcePath.split("/").pop()?.replace(/\.md$/i, "") ?? "";
    writePreviewDocument(
      doc,
      html,
      this.escapeHtml(document.documentElement.className),
      this.escapeHtml(document.body.className),
      this.nativeSettings.includeFileName ? fileName : "",
    );
    await applyPreviewStyles(doc, this.app, this.settings, this.nativeSettings);
    await waitForIframeResources(doc);
    if (refreshId !== this.refreshId) {
      return;
    }
    this.pageCount = paginatePreview(doc, this.getPageHeight());
    this.currentPage = Math.min(Math.max(requestedPage, 0), this.pageCount - 1);
    this.updateHeader();
    this.renderNavigation();
    this.updateIframePosition();
    this.showPage();
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!this.pageSwitchCover) {
          return;
        }
        this.pageSwitchCover.style.opacity = "0";
      });
    });
  }
  private updateHeader() {
    this.header.textContent = this.getPreviewTitle();
  }
  private getPreviewTitle(): string {
    const pageWord = this.pageWord(this.pageCount);
    return this.isRussian()
      ? `Предпросмотр PDF — ${this.pageCount} ${pageWord}`
      : `PDF Preview — ${this.pageCount} ${pageWord}`;
  }
  private renderNavigation() {
    renderNavigation(
      this.navigation,
      this.currentPage,
      this.pageCount,
      () => {
        if (this.currentPage <= 0) {
          return;
        }
        this.switchPage(this.currentPage - 1);
      },
      () => {
        if (this.currentPage >= this.pageCount - 1) {
          return;
        }
        this.switchPage(this.currentPage + 1);
      },
      (value) => {
        this.setPageFromInput(value);
      },
    );
  }
  private updateNavigation() {
    updateNavigation(this.navigation, this.currentPage, this.pageCount);
  }
  private switchPage(page: number) {
    if (!this.iframe || !this.pageSwitchCover) {
      return;
    }
    const token = ++this.pageSwitchToken;
    this.currentPage = Math.max(0, Math.min(page, this.pageCount - 1));
    this.pageSwitchCover.style.opacity = "1";
    this.showPage();
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (token !== this.pageSwitchToken) {
          return;
        }
        if (!this.iframe || !this.pageSwitchCover) {
          return;
        }
        this.pageSwitchCover.style.opacity = "0";
      });
    });
  }
  private setPageFromInput(value: string) {
    let page = Number.parseInt(value, 10);
    if (!Number.isFinite(page)) {
      page = this.currentPage + 1;
    }
    page = Math.max(1, Math.min(page, this.pageCount));
    this.switchPage(page - 1);
  }
  private updateIframePosition() {
    if (!this.iframe) {
      return;
    }
    const viewportWidth = this.viewport.clientWidth;
    const viewportHeight = this.viewport.clientHeight;
    if (viewportWidth <= 0 || viewportHeight <= 0) {
      return;
    }
    const pageWidth = this.getPageWidth();
    const pageHeight = this.getPageHeight();
    const scale = Math.min(
      viewportWidth / pageWidth,
      viewportHeight / pageHeight,
    );
    const width = pageWidth * scale;
    const height = pageHeight * scale;
    const left = (viewportWidth - width) / 2;
    const top = (viewportHeight - height) / 2;
    this.iframe.style.width = `${pageWidth}px`;
    this.iframe.style.height = `${pageHeight}px`;
    this.iframe.style.left = `${left}px`;
    this.iframe.style.top = `${top}px`;
    this.iframe.style.transform = `scale(${scale})`;
    this.iframe.style.transformOrigin = "top left";
  }
  private showPage() {
    if (!this.iframe) {
      return;
    }
    const doc = this.iframe.contentDocument;
    if (!doc) {
      return;
    }
    const pages = Array.from(
      doc.querySelectorAll(".pdf-preview-page"),
    ) as HTMLElement[];
    pages.forEach((page, index) => {
      const active = index === this.currentPage;
      page.style.opacity = active ? "1" : "0";
      page.style.zIndex = active ? "2" : "1";
    });
    doc.documentElement.style.overflow = "hidden";
    doc.body.style.overflow = "hidden";
    this.updateNavigation();
  }
  private getPageWidth(): number {
    return this.nativeSettings.landscape ? A4_HEIGHT : A4_WIDTH;
  }
  private getPageHeight(): number {
    return this.nativeSettings.landscape ? A4_WIDTH : A4_HEIGHT;
  }
  private showError(message: string) {
    this.iframe = null;
    this.pageSwitchCover = null;
    this.header.textContent = this.getPreviewTitle();
    this.navigation.empty();
    this.viewport.empty();
    const error = document.createElement("div");
    error.className = "pdf-export-preview-error";
    error.textContent = message;
    this.viewport.appendChild(error);
  }
  private isRussian(): boolean {
    return getLanguage() === "ru";
  }
  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
  private pageWord(count: number): string {
    if (this.isRussian()) {
      if (count % 10 === 1 && count % 100 !== 11) {
        return "страница";
      }
      if (
        count % 10 >= 2 &&
        count % 10 <= 4 &&
        (count % 100 < 10 || count % 100 >= 20)
      ) {
        return "страницы";
      }
      return "страниц";
    }
    return count === 1 ? "page" : "pages";
  }
  setHeight(height: number) {
    const availableWidth = this.container.clientWidth;
    const size = availableWidth > 0 ? Math.min(height, availableWidth) : height;
    this.viewport.style.width = `${size}px`;
    this.viewport.style.height = `${size}px`;
    requestAnimationFrame(() => {
      this.updateIframePosition();
      this.showPage();
    });
  }
  destroy() {
    this.refreshId++;
    this.pageSwitchToken++;
    this.iframe = null;
    this.pageSwitchCover = null;
    this.container.empty();
  }
}
