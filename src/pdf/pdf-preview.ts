import { App, Component, MarkdownRenderer, MarkdownView } from "obsidian";
import type { PdfExportSettings } from "../settings/settings";
import { getMarkdownSource } from "./pdf-source";
import { getLoadedCss } from "./print-css";
import { A4_WIDTH, A4_HEIGHT } from "./pagination";
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
    this.header.textContent = "Предпросмотр PDF";
  }
  async refresh() {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!view) {
      this.showError("Не удалось получить текущую заметку");
      return;
    }
    const source = getMarkdownSource(view);
    if (!source) {
      this.showError("Не удалось получить текст заметки");
      return;
    }
    this.currentPage = 0;
    const html = await this.renderMarkdown(source.markdown, source.sourcePath);
    if (!html) {
      this.showError("Ошибка рендера Markdown");
      return;
    }
    await this.createIframe(html);
  }
  private async renderMarkdown(
    markdown: string,
    sourcePath: string,
  ): Promise<string> {
    const component = new Component();
    component.load();
    const root = document.createElement("div");
    const content = document.createElement("div");
    root.style.position = "fixed";
    root.style.left = "-100000px";
    root.style.top = "0";
    root.style.width = `${A4_WIDTH}px`;
    root.style.visibility = "hidden";
    root.style.pointerEvents = "none";
    root.appendChild(content);
    document.body.appendChild(root);
    try {
      await MarkdownRenderer.render(
        this.app,
        markdown,
        content,
        sourcePath,
        component,
      );
      await this.waitForLayout();
      const html = content.innerHTML.trim();
      return html;
    } catch (error) {
      console.error("PDF Export Preview: Markdown render error", error);
      return "";
    } finally {
      root.remove();
      component.unload();
    }
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
      this.showError("Не удалось создать preview");
      return;
    }
    doc.open();
    doc.write(
      `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body><div id="pdf-preview-source"><div class="markdown-preview-view markdown-rendered"><div class="markdown-preview-sizer"><div class="markdown-preview-section">${html}</div></div></div></div></body></html>`,
    );
    doc.close();
    await this.applyStyles(doc);
    await this.waitForIframeResources(doc);
    this.paginate(doc);
    this.updateHeader();
    this.renderNavigation();
    this.showPage();
  }
  private async applyStyles(doc: Document) {
    const css = await getLoadedCss(this.app);
    if (css.trim()) {
      const style = doc.createElement("style");
      style.textContent = css;
      doc.head.appendChild(style);
    }
    const style = doc.createElement("style");
    style.textContent = this.getPreviewCss();
    doc.head.appendChild(style);
  }
  private getPreviewCss(): string {
    return `
* {
	box-sizing: border-box;
}
html {
	margin: 0;
	padding: 0;
}
body {
	margin: 0;
	padding: 0;
	width: ${A4_WIDTH}px;
}
#pdf-preview-source {
	width: ${A4_WIDTH}px;
	margin: 0;
	padding: 0;
}
.pdf-preview-pages {
	width: ${A4_WIDTH}px;
	margin: 0;
	padding: 0;
}
.pdf-preview-page {
	width: ${A4_WIDTH}px;
	height: ${A4_HEIGHT}px;
	min-height: ${A4_HEIGHT}px;
	max-height: ${A4_HEIGHT}px;
	box-sizing: border-box;
	overflow: hidden;
	position: relative;
}
.pdf-preview-page .markdown-preview-view {
	width: 100%;
	max-width: none;
	min-width: 0;
	height: auto;
	min-height: 0;
	margin: 0;
	padding: 0;
	overflow: visible;
	font-size: ${this.settings.fontSize}px !important;
}
.pdf-preview-page .markdown-preview-sizer {
	width: 100%;
	max-width: none;
	min-width: 0;
	height: auto;
	min-height: 0;
	margin: 0;
	padding: 0;
	overflow: visible;
	font-size: ${this.settings.fontSize}px !important;
}
.pdf-preview-page .markdown-preview-section {
	width: 100%;
	max-width: none;
	min-width: 0;
	height: auto;
	min-height: 0;
	margin: 0;
	padding: 0;
	overflow: visible;
}
.pdf-preview-page img {
	max-width: 100%;
	height: auto;
}
`;
  }
  private paginate(doc: Document) {
    const sourceSection = doc.querySelector(
      "#pdf-preview-source .markdown-preview-section",
    ) as HTMLElement | null;
    if (!sourceSection) {
      this.pageCount = 1;
      return;
    }
    const nodes = Array.from(sourceSection.children) as HTMLElement[];
    const pagesContainer = doc.createElement("div");
    pagesContainer.className = "pdf-preview-pages";
    const sourceRoot = doc.querySelector("#pdf-preview-source");
    if (!sourceRoot) {
      this.pageCount = 1;
      return;
    }
    sourceRoot.replaceChildren(pagesContainer);
    let currentPage = this.createPage(doc);
    pagesContainer.appendChild(currentPage);
    for (const node of nodes) {
      const section = currentPage.querySelector(
        ".markdown-preview-section",
      ) as HTMLElement | null;
      if (!section) {
        continue;
      }
      section.appendChild(node);
      if (
        currentPage.scrollHeight > currentPage.clientHeight &&
        section.children.length > 1
      ) {
        section.lastElementChild?.remove();
        currentPage = this.createPage(doc);
        pagesContainer.appendChild(currentPage);
        const nextSection = currentPage.querySelector(
          ".markdown-preview-section",
        ) as HTMLElement | null;
        nextSection?.appendChild(node);
      }
    }
    const pages = Array.from(
      pagesContainer.querySelectorAll(".pdf-preview-page"),
    ) as HTMLElement[];
    this.pageCount = Math.max(1, pages.length);
    pages.forEach((page, index) => {
      page.dataset.page = String(index);
      page.style.setProperty(
        "display",
        index === this.currentPage ? "block" : "none",
        "important",
      );
    });
  }
  private createPage(doc: Document): HTMLElement {
    const page = doc.createElement("div");
    page.className = "pdf-preview-page";
    const view = doc.createElement("div");
    view.className = "markdown-preview-view markdown-rendered";
    const sizer = doc.createElement("div");
    sizer.className = "markdown-preview-sizer";
    const section = doc.createElement("div");
    section.className = "markdown-preview-section";
    view.appendChild(sizer);
    sizer.appendChild(section);
    page.appendChild(view);
    return page;
  }
  private async waitForLayout() {
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          resolve();
        });
      });
    });
  }
  private async waitForIframeResources(doc: Document) {
    try {
      await doc.fonts.ready;
    } catch {}
    await this.waitForIframeLayout();
  }
  private async waitForIframeLayout() {
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          resolve();
        });
      });
    });
  }
  private updateHeader() {
    this.header.textContent = `Предпросмотр PDF — ${this.pageCount} ${this.pageWord(this.pageCount)}`;
  }
  private renderNavigation() {
    this.navigation.empty();
    const previous = document.createElement("button");
    previous.type = "button";
    previous.className = "pdf-preview-arrow";
    previous.textContent = "←";
    previous.title = "Предыдущая страница";
    previous.disabled = this.currentPage <= 0;
    previous.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (this.currentPage <= 0) {
        return;
      }
      this.currentPage--;
      this.updateNavigation();
      this.showPage();
    });
    const input = document.createElement("input");
    input.type = "number";
    input.className = "pdf-preview-page-input";
    input.min = "1";
    input.max = String(this.pageCount);
    input.value = String(this.currentPage + 1);
    input.setAttribute("aria-label", "Номер страницы");
    input.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") {
        return;
      }
      event.preventDefault();
      this.setPageFromInput(input.value);
      input.blur();
    });
    input.addEventListener("change", () => {
      this.setPageFromInput(input.value);
    });
    const total = document.createElement("span");
    total.className = "pdf-preview-page-total";
    total.textContent = `/ ${this.pageCount}`;
    const next = document.createElement("button");
    next.type = "button";
    next.className = "pdf-preview-arrow";
    next.textContent = "→";
    next.title = "Следующая страница";
    next.disabled = this.currentPage >= this.pageCount - 1;
    next.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (this.currentPage >= this.pageCount - 1) {
        return;
      }
      this.currentPage++;
      this.updateNavigation();
      this.showPage();
    });
    this.navigation.appendChild(previous);
    this.navigation.appendChild(input);
    this.navigation.appendChild(total);
    this.navigation.appendChild(next);
  }
  private updateNavigation() {
    const input = this.navigation.querySelector(
      ".pdf-preview-page-input",
    ) as HTMLInputElement | null;
    if (input) {
      input.value = String(this.currentPage + 1);
    }
    const buttons = this.navigation.querySelectorAll(".pdf-preview-arrow");
    const previous = buttons[0] as HTMLButtonElement | undefined;
    const next = buttons[1] as HTMLButtonElement | undefined;
    if (previous) {
      previous.disabled = this.currentPage <= 0;
    }
    if (next) {
      next.disabled = this.currentPage >= this.pageCount - 1;
    }
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
    this.header.textContent = "Предпросмотр PDF";
    this.navigation.empty();
    this.viewport.empty();
    const error = document.createElement("div");
    error.className = "pdf-export-preview-error";
    error.textContent = message;
    this.viewport.appendChild(error);
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
