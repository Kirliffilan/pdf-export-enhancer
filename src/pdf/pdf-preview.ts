import { App, MarkdownView, getLanguage } from "obsidian";
import type { PdfExportSettings } from "../settings/settings";
import { getMarkdownSource } from "./pdf-source";
import { A4_WIDTH, A4_HEIGHT } from "./pagination";
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
  private header: HTMLElement;
  private navigation: HTMLElement;
  private viewport: HTMLElement;
  private iframe: HTMLIFrameElement | null = null;
  private currentPage = 0;
  private pageCount = 1;

  constructor(app: App, settings: PdfExportSettings, container: HTMLElement) {
    this.app = app;
    this.settings = settings;
    this.container = container;

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

  async refresh() {
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

    this.currentPage = 0;

    const html = await renderMarkdown(
      this.app,
      source.markdown,
      source.sourcePath,
    );

    if (!html) {
      this.showError(
        this.isRussian()
          ? "Ошибка рендера Markdown"
          : "Markdown rendering error",
      );
      return;
    }
    await this.createIframe(html);
  }

  private async createIframe(html: string) {
    this.viewport.empty();
    this.iframe = null;

    const iframe = document.createElement("iframe");

    iframe.className = "pdf-export-preview-iframe";
    iframe.setAttribute("frameborder", "0");
    iframe.setAttribute("scrolling", "no");

    this.viewport.appendChild(iframe);
    this.iframe = iframe;

    const doc = iframe.contentDocument;

    if (!doc) {
      this.showError(
        this.isRussian()
          ? "Не удалось создать предпросмотр"
          : "Could not create preview",
      );
      return;
    }

    writePreviewDocument(
      doc,
      html,
      this.escapeHtml(document.documentElement.className),
      this.escapeHtml(document.body.className),
    );

    await applyPreviewStyles(doc, this.app, this.settings);
    await waitForIframeResources(doc);
    this.pageCount = paginatePreview(doc);
    this.updateHeader();
    this.renderNavigation();
    this.showPage();
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

        this.currentPage--;
        this.updateNavigation();
        this.showPage();
      },
      () => {
        if (this.currentPage >= this.pageCount - 1) {
          return;
        }

        this.currentPage++;
        this.updateNavigation();
        this.showPage();
      },
      (value) => {
        this.setPageFromInput(value);
      },
    );
  }

  private updateNavigation() {
    updateNavigation(this.navigation, this.currentPage, this.pageCount);
  }

  private setPageFromInput(value: string) {
    let page = Number.parseInt(value, 10);

    if (!Number.isFinite(page)) {
      page = this.currentPage + 1;
    }

    page = Math.max(1, Math.min(page, this.pageCount));
    this.currentPage = page - 1;
    this.updateNavigation();
    this.showPage();
  }

  private showPage() {
    if (!this.iframe) {
      return;
    }

    const viewportWidth = this.viewport.clientWidth;
    const viewportHeight = this.viewport.clientHeight;

    if (viewportWidth <= 0 || viewportHeight <= 0) {
      return;
    }

    const scale = Math.min(
      viewportWidth / A4_WIDTH,
      viewportHeight / A4_HEIGHT,
    );

    const width = A4_WIDTH * scale;
    const left = (viewportWidth - width) / 2;
    const doc = this.iframe.contentDocument;
    if (!doc) {
      return;
    }

    const pages = Array.from(
      doc.querySelectorAll(".pdf-preview-page"),
    ) as HTMLElement[];

    pages.forEach((page, index) => {
      page.style.setProperty(
        "display",
        index === this.currentPage ? "block" : "none",
        "important",
      );
    });

    this.iframe.style.width = `${A4_WIDTH}px`;
    this.iframe.style.height = `${A4_HEIGHT}px`;
    this.iframe.style.left = `${left}px`;
    this.iframe.style.top = "0";
    this.iframe.style.transform = `scale(${scale})`;
    this.iframe.style.transformOrigin = "top left";
    doc.documentElement.style.overflow = "hidden";
    doc.body.style.overflow = "hidden";
    this.updateNavigation();
  }

  private showError(message: string) {
    this.iframe = null;

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
    this.viewport.style.height = `${height}px`;
    const width = (height * A4_WIDTH) / A4_HEIGHT;
    this.viewport.style.width = `${width}px`;
    this.viewport.style.maxWidth = "100%";
    requestAnimationFrame(() => {
      this.showPage();
    });
  }

  destroy() {
    this.iframe = null;
    this.container.empty();
  }
}
