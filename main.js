var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => PdfExportPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian6 = require("obsidian");

// src/settings/settings.ts
var DEFAULT_SETTINGS = {
  fontSize: 16.5
};

// src/pdf/pdf-modal.ts
var import_obsidian5 = require("obsidian");

// src/settings/settings-tab.ts
var import_obsidian = require("obsidian");
var PdfExportSettingTab = class extends import_obsidian.PluginSettingTab {
  plugin;
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", {
      text: "PDF Export Settings"
    });
    new import_obsidian.Setting(containerEl).setName("\u0420\u0430\u0437\u043C\u0435\u0440 \u0448\u0440\u0438\u0444\u0442\u0430").setDesc("\u0420\u0430\u0437\u043C\u0435\u0440 \u0442\u0435\u043A\u0441\u0442\u0430 \u043F\u0440\u0438 \u044D\u043A\u0441\u043F\u043E\u0440\u0442\u0435 \u0432 PDF").addText((text) => {
      text.inputEl.type = "number";
      text.inputEl.step = "0.5";
      text.inputEl.min = "1";
      text.setValue(String(this.plugin.pdfSettings.fontSize));
      text.onChange(async (value) => {
        const parsed = Number(value);
        if (!Number.isFinite(parsed) || parsed <= 0) {
          return;
        }
        this.plugin.pdfSettings.fontSize = parsed;
        await this.plugin.saveSettings();
      });
    });
  }
};

// src/pdf/pdf-preview.ts
var import_obsidian4 = require("obsidian");

// src/pdf/pdf-source.ts
function getMarkdownSource(view) {
  const markdown = view.getViewData();
  if (!markdown || !markdown.trim()) {
    return null;
  }
  return {
    markdown,
    sourcePath: view.file?.path ?? ""
  };
}

// src/pdf/css/css-utils.ts
var import_obsidian2 = require("obsidian");
function getMarkdownRoot() {
  return document.querySelector(".markdown-preview-view");
}
function isOwnPluginStylesheet(sheet) {
  const owner = sheet.ownerNode;
  if (owner instanceof HTMLStyleElement) {
    return owner.id === "pdf-export-plugin-styles";
  }
  if (owner instanceof HTMLLinkElement) {
    return owner.href.toLowerCase().includes("/plugins/pdf-export-settings/");
  }
  return false;
}
function isPluginOrThemeStylesheet(sheet) {
  const owner = sheet.ownerNode;
  if (owner instanceof HTMLLinkElement) {
    const href = owner.href.toLowerCase();
    return href.includes("/plugins/") || href.includes("/themes/");
  }
  return false;
}
function isSnippetStylesheet(sheet) {
  const owner = sheet.ownerNode;
  if (owner instanceof HTMLLinkElement) {
    return owner.href.toLowerCase().includes("/snippets/");
  }
  return false;
}
function getSnippetBaseUrl(app, fileName) {
  return `${document.baseURI}${(0, import_obsidian2.normalizePath)(
    `${app.vault.configDir}/snippets/${fileName}`
  )}`;
}
function ruleMatchesMarkdown(selector, markdownRoot) {
  const selectors = splitSelectors(selector);
  for (const rawSelector of selectors) {
    const value = rawSelector.trim();
    if (!value) {
      continue;
    }
    if (value === ":root" || value === "html" || value === "body") {
      return true;
    }
    try {
      if (markdownRoot.matches(value) || markdownRoot.querySelector(value)) {
        return true;
      }
    } catch {
    }
  }
  return false;
}
function splitSelectors(selector) {
  const result = [];
  let current = "";
  let depth = 0;
  let quote = "";
  for (let i = 0; i < selector.length; i++) {
    const char = selector[i];
    if (quote) {
      current += char;
      if (char === quote && selector[i - 1] !== "\\") {
        quote = "";
      }
      continue;
    }
    if (char === "'" || char === '"') {
      quote = char;
      current += char;
      continue;
    }
    if (char === "(" || char === "[") {
      depth++;
      current += char;
      continue;
    }
    if (char === ")" || char === "]") {
      depth--;
      current += char;
      continue;
    }
    if (char === "," && depth === 0) {
      result.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  if (current.trim()) {
    result.push(current);
  }
  return result;
}
function splitPrintCss(css) {
  const normal = [];
  const print = [];
  let position = 0;
  while (position < css.length) {
    const match = /@media\s+print[^{]*\{/gi.exec(css.slice(position));
    if (!match || match.index === void 0) {
      normal.push(css.slice(position));
      break;
    }
    const start = position + match.index;
    const openBrace = position + match.index + match[0].lastIndexOf("{");
    normal.push(css.slice(position, start));
    const closeBrace = findMatchingBrace(css, openBrace);
    if (closeBrace === -1) {
      normal.push(css.slice(start));
      break;
    }
    print.push(css.slice(openBrace + 1, closeBrace));
    position = closeBrace + 1;
  }
  return {
    normal: normal.join("\n"),
    print: print.join("\n")
  };
}
function findMatchingBrace(text, openBrace) {
  let depth = 0;
  let quote = "";
  let comment = false;
  for (let i = openBrace; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];
    if (comment) {
      if (char === "*" && next === "/") {
        comment = false;
        i++;
      }
      continue;
    }
    if (!quote && char === "/" && next === "*") {
      comment = true;
      i++;
      continue;
    }
    if (quote) {
      if (char === "\\" && next) {
        i++;
        continue;
      }
      if (char === quote) {
        quote = "";
      }
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }
    if (char === "{") {
      depth++;
      continue;
    }
    if (char === "}") {
      depth--;
      if (depth === 0) {
        return i;
      }
    }
  }
  return -1;
}
function absolutizeUrls(css, baseUrl) {
  return css.replace(/url\(\s*(['"]?)(.*?)\1\s*\)/gi, (full, _quote, value) => {
    const url = String(value).trim();
    if (!url || url.startsWith("data:") || url.startsWith("blob:") || url.startsWith("#") || /^[a-z][a-z0-9+.-]*:/i.test(url)) {
      return full;
    }
    try {
      const absolute = new URL(url, baseUrl).href;
      return `url("${absolute}")`;
    } catch {
      return full;
    }
  });
}

// src/pdf/css/css-core.ts
function collectCoreRule(rule, standard, print, baseUrl, markdownRoot) {
  if (rule instanceof CSSImportRule) {
    try {
      const imported = rule.styleSheet;
      if (!imported) {
        return;
      }
      const importedBaseUrl = imported.href || baseUrl;
      for (const nestedRule of Array.from(imported.cssRules)) {
        collectCoreRule(
          nestedRule,
          standard,
          print,
          importedBaseUrl,
          markdownRoot
        );
      }
    } catch {
    }
    return;
  }
  if (rule instanceof CSSMediaRule) {
    const condition = rule.conditionText?.toLowerCase().trim() ?? "";
    if (condition.includes("print")) {
      for (const nestedRule of Array.from(rule.cssRules)) {
        collectPrintRule(nestedRule, print, baseUrl, markdownRoot);
      }
      return;
    }
    const nested = [];
    for (const nestedRule of Array.from(rule.cssRules)) {
      collectCoreRule(nestedRule, nested, [], baseUrl, markdownRoot);
    }
    if (nested.length) {
      standard.push(`@media ${rule.conditionText} {
${nested.join("\n")}
}`);
    }
    return;
  }
  if (rule instanceof CSSSupportsRule) {
    const nestedStandard = [];
    const nestedPrint = [];
    for (const nestedRule of Array.from(rule.cssRules)) {
      collectCoreRule(
        nestedRule,
        nestedStandard,
        nestedPrint,
        baseUrl,
        markdownRoot
      );
    }
    if (nestedStandard.length) {
      standard.push(
        `@supports ${rule.conditionText} {
${nestedStandard.join("\n")}
}`
      );
    }
    if (nestedPrint.length) {
      print.push(
        `@supports ${rule.conditionText} {
${nestedPrint.join("\n")}
}`
      );
    }
    return;
  }
  if (rule instanceof CSSStyleRule) {
    if (ruleMatchesMarkdown(rule.selectorText, markdownRoot)) {
      standard.push(absolutizeUrls(rule.cssText, baseUrl));
    }
    return;
  }
  if (rule instanceof CSSFontFaceRule) {
    standard.push(absolutizeUrls(rule.cssText, baseUrl));
    return;
  }
  if (rule instanceof CSSKeyframesRule) {
    standard.push(absolutizeUrls(rule.cssText, baseUrl));
  }
}
function collectPluginThemeRule(rule, result, baseUrl, markdownRoot) {
  if (rule instanceof CSSImportRule) {
    try {
      const imported = rule.styleSheet;
      if (!imported) {
        return;
      }
      const importedBaseUrl = imported.href || baseUrl;
      for (const nestedRule of Array.from(imported.cssRules)) {
        collectPluginThemeRule(
          nestedRule,
          result,
          importedBaseUrl,
          markdownRoot
        );
      }
    } catch {
    }
    return;
  }
  if (rule instanceof CSSMediaRule) {
    const nested = [];
    for (const nestedRule of Array.from(rule.cssRules)) {
      collectPluginThemeRule(nestedRule, nested, baseUrl, markdownRoot);
    }
    if (nested.length) {
      result.push(`@media ${rule.conditionText} {
${nested.join("\n")}
}`);
    }
    return;
  }
  if (rule instanceof CSSSupportsRule) {
    const nested = [];
    for (const nestedRule of Array.from(rule.cssRules)) {
      collectPluginThemeRule(nestedRule, nested, baseUrl, markdownRoot);
    }
    if (nested.length) {
      result.push(`@supports ${rule.conditionText} {
${nested.join("\n")}
}`);
    }
    return;
  }
  if (rule instanceof CSSStyleRule) {
    if (ruleMatchesMarkdown(rule.selectorText, markdownRoot)) {
      result.push(absolutizeUrls(rule.cssText, baseUrl));
    }
    return;
  }
  if (rule instanceof CSSFontFaceRule) {
    result.push(absolutizeUrls(rule.cssText, baseUrl));
  }
}
function collectPrintRule(rule, result, baseUrl, markdownRoot) {
  if (rule instanceof CSSMediaRule) {
    for (const nestedRule of Array.from(rule.cssRules)) {
      collectPrintRule(nestedRule, result, baseUrl, markdownRoot);
    }
    return;
  }
  if (rule instanceof CSSSupportsRule) {
    const nested = [];
    for (const nestedRule of Array.from(rule.cssRules)) {
      collectPrintRule(nestedRule, nested, baseUrl, markdownRoot);
    }
    if (nested.length) {
      result.push(`@supports ${rule.conditionText} {
${nested.join("\n")}
}`);
    }
    return;
  }
  if (rule instanceof CSSStyleRule) {
    if (ruleMatchesMarkdown(rule.selectorText, markdownRoot)) {
      result.push(absolutizeUrls(rule.cssText, baseUrl));
    }
    return;
  }
  if (rule instanceof CSSFontFaceRule) {
    result.push(absolutizeUrls(rule.cssText, baseUrl));
  }
}

// src/pdf/css/css-snippets.ts
var import_obsidian3 = require("obsidian");
async function getEnabledSnippets(app) {
  const appearancePath = (0, import_obsidian3.normalizePath)(
    `${app.vault.configDir}/appearance.json`
  );
  let appearance = {};
  try {
    const text = await app.vault.adapter.read(appearancePath);
    appearance = JSON.parse(text);
  } catch {
    return [];
  }
  const enabled = appearance.enabledCssSnippets ?? [];
  const result = [];
  for (const name of enabled) {
    const fileName = name.toLowerCase().endsWith(".css") ? name : `${name}.css`;
    const path = (0, import_obsidian3.normalizePath)(`${app.vault.configDir}/snippets/${fileName}`);
    try {
      const css = await app.vault.adapter.read(path);
      result.push({
        name: fileName,
        css
      });
    } catch {
    }
  }
  return result;
}

// src/pdf/print-css.ts
async function getLoadedCss(app) {
  const markdownRoot = getMarkdownRoot();
  if (!markdownRoot) {
    return "";
  }
  const standard = [];
  const print = [];
  const pluginsAndThemes = [];
  for (const sheet of Array.from(document.styleSheets)) {
    if (isOwnPluginStylesheet(sheet) || isSnippetStylesheet(sheet)) {
      continue;
    }
    try {
      const rules = sheet.cssRules;
      if (!rules) {
        continue;
      }
      const baseUrl = sheet.href || document.baseURI;
      if (isPluginOrThemeStylesheet(sheet)) {
        for (const rule of Array.from(rules)) {
          collectPluginThemeRule(rule, pluginsAndThemes, baseUrl, markdownRoot);
        }
        continue;
      }
      for (const rule of Array.from(rules)) {
        collectCoreRule(rule, standard, print, baseUrl, markdownRoot);
      }
    } catch {
    }
  }
  const snippets = await getEnabledSnippets(app);
  const snippetCss = [];
  for (const snippet of snippets) {
    const baseUrl = getSnippetBaseUrl(app, snippet.name);
    const split = splitPrintCss(snippet.css);
    if (split.normal.trim()) {
      snippetCss.push(absolutizeUrls(split.normal, baseUrl));
    }
    if (split.print.trim()) {
      snippetCss.push(absolutizeUrls(split.print, baseUrl));
    }
  }
  return [
    standard.join("\n"),
    print.join("\n"),
    pluginsAndThemes.join("\n"),
    snippetCss.join("\n")
  ].filter((value) => value.trim()).join("\n");
}

// src/pdf/pagination.ts
var A4_WIDTH = 794;
var A4_HEIGHT = 1123;

// src/pdf/pdf-preview.ts
var PdfPreview = class {
  app;
  settings;
  container;
  header;
  navigation;
  viewport;
  iframe = null;
  currentPage = 0;
  pageCount = 1;
  constructor(app, settings, container) {
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
    this.header.textContent = "\u041F\u0440\u0435\u0434\u043F\u0440\u043E\u0441\u043C\u043E\u0442\u0440 PDF";
  }
  async refresh() {
    const view = this.app.workspace.getActiveViewOfType(import_obsidian4.MarkdownView);
    if (!view) {
      this.showError("\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043F\u043E\u043B\u0443\u0447\u0438\u0442\u044C \u0442\u0435\u043A\u0443\u0449\u0443\u044E \u0437\u0430\u043C\u0435\u0442\u043A\u0443");
      return;
    }
    const source = getMarkdownSource(view);
    if (!source) {
      this.showError("\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043F\u043E\u043B\u0443\u0447\u0438\u0442\u044C \u0442\u0435\u043A\u0441\u0442 \u0437\u0430\u043C\u0435\u0442\u043A\u0438");
      return;
    }
    this.currentPage = 0;
    const html = await this.renderMarkdown(source.markdown, source.sourcePath);
    if (!html) {
      this.showError("\u041E\u0448\u0438\u0431\u043A\u0430 \u0440\u0435\u043D\u0434\u0435\u0440\u0430 Markdown");
      return;
    }
    await this.createIframe(html);
  }
  async renderMarkdown(markdown, sourcePath) {
    const component = new import_obsidian4.Component();
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
      await import_obsidian4.MarkdownRenderer.render(
        this.app,
        markdown,
        content,
        sourcePath,
        component
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
  async createIframe(html) {
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
      this.showError("\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0441\u043E\u0437\u0434\u0430\u0442\u044C preview");
      return;
    }
    doc.open();
    doc.write(
      `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body><div id="pdf-preview-source"><div class="markdown-preview-view markdown-rendered"><div class="markdown-preview-sizer"><div class="markdown-preview-section">${html}</div></div></div></div></body></html>`
    );
    doc.close();
    await this.applyStyles(doc);
    await this.waitForIframeResources(doc);
    this.paginate(doc);
    this.updateHeader();
    this.renderNavigation();
    this.showPage();
  }
  async applyStyles(doc) {
    const css = await getLoadedCss(this.app);
    if (css.trim()) {
      const style2 = doc.createElement("style");
      style2.textContent = css;
      doc.head.appendChild(style2);
    }
    const style = doc.createElement("style");
    style.textContent = this.getPreviewCss();
    doc.head.appendChild(style);
  }
  getPreviewCss() {
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
  paginate(doc) {
    const sourceSection = doc.querySelector(
      "#pdf-preview-source .markdown-preview-section"
    );
    if (!sourceSection) {
      this.pageCount = 1;
      return;
    }
    const nodes = Array.from(sourceSection.children);
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
        ".markdown-preview-section"
      );
      if (!section) {
        continue;
      }
      section.appendChild(node);
      if (currentPage.scrollHeight > currentPage.clientHeight && section.children.length > 1) {
        section.lastElementChild?.remove();
        currentPage = this.createPage(doc);
        pagesContainer.appendChild(currentPage);
        const nextSection = currentPage.querySelector(
          ".markdown-preview-section"
        );
        nextSection?.appendChild(node);
      }
    }
    const pages = Array.from(
      pagesContainer.querySelectorAll(".pdf-preview-page")
    );
    this.pageCount = Math.max(1, pages.length);
    pages.forEach((page, index) => {
      page.dataset.page = String(index);
      page.style.setProperty(
        "display",
        index === this.currentPage ? "block" : "none",
        "important"
      );
    });
  }
  createPage(doc) {
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
  async waitForLayout() {
    await new Promise((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          resolve();
        });
      });
    });
  }
  async waitForIframeResources(doc) {
    try {
      await doc.fonts.ready;
    } catch {
    }
    await this.waitForIframeLayout();
  }
  async waitForIframeLayout() {
    await new Promise((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          resolve();
        });
      });
    });
  }
  updateHeader() {
    this.header.textContent = `\u041F\u0440\u0435\u0434\u043F\u0440\u043E\u0441\u043C\u043E\u0442\u0440 PDF \u2014 ${this.pageCount} ${this.pageWord(this.pageCount)}`;
  }
  renderNavigation() {
    this.navigation.empty();
    const previous = document.createElement("button");
    previous.type = "button";
    previous.className = "pdf-preview-arrow";
    previous.textContent = "\u2190";
    previous.title = "\u041F\u0440\u0435\u0434\u044B\u0434\u0443\u0449\u0430\u044F \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0430";
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
    input.setAttribute("aria-label", "\u041D\u043E\u043C\u0435\u0440 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u044B");
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
    next.textContent = "\u2192";
    next.title = "\u0421\u043B\u0435\u0434\u0443\u044E\u0449\u0430\u044F \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0430";
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
  updateNavigation() {
    const input = this.navigation.querySelector(
      ".pdf-preview-page-input"
    );
    if (input) {
      input.value = String(this.currentPage + 1);
    }
    const buttons = this.navigation.querySelectorAll(".pdf-preview-arrow");
    const previous = buttons[0];
    const next = buttons[1];
    if (previous) {
      previous.disabled = this.currentPage <= 0;
    }
    if (next) {
      next.disabled = this.currentPage >= this.pageCount - 1;
    }
  }
  setPageFromInput(value) {
    let page = Number.parseInt(value, 10);
    if (!Number.isFinite(page)) {
      page = this.currentPage + 1;
    }
    page = Math.max(1, Math.min(page, this.pageCount));
    this.currentPage = page - 1;
    this.updateNavigation();
    this.showPage();
  }
  showPage() {
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
      viewportHeight / A4_HEIGHT
    );
    const width = A4_WIDTH * scale;
    const left = (viewportWidth - width) / 2;
    const doc = this.iframe.contentDocument;
    if (!doc) {
      return;
    }
    const pages = Array.from(
      doc.querySelectorAll(".pdf-preview-page")
    );
    pages.forEach((page, index) => {
      page.style.setProperty(
        "display",
        index === this.currentPage ? "block" : "none",
        "important"
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
  showError(message) {
    this.iframe = null;
    this.header.textContent = "\u041F\u0440\u0435\u0434\u043F\u0440\u043E\u0441\u043C\u043E\u0442\u0440 PDF";
    this.navigation.empty();
    this.viewport.empty();
    const error = document.createElement("div");
    error.className = "pdf-export-preview-error";
    error.textContent = message;
    this.viewport.appendChild(error);
  }
  escapeHtml(value) {
    return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }
  pageWord(count) {
    if (count % 10 === 1 && count % 100 !== 11) {
      return "\u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0430";
    }
    if (count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 10 || count % 100 >= 20)) {
      return "\u0441\u0442\u0440\u0430\u043D\u0438\u0446\u044B";
    }
    return "\u0441\u0442\u0440\u0430\u043D\u0438\u0446";
  }
  setHeight(height) {
    this.viewport.style.height = `${height}px`;
    const width = height * A4_WIDTH / A4_HEIGHT;
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
};

// src/pdf/pdf-modal.ts
var PdfModal = class {
  app;
  plugin;
  observer = null;
  preview = null;
  constructor(app, plugin) {
    this.app = app;
    this.plugin = plugin;
  }
  start() {
    this.observer = new MutationObserver(() => {
      this.trySetup();
    });
    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    this.trySetup();
  }
  trySetup() {
    if (document.querySelector(".pdf-export-layout")) {
      return;
    }
    const modals = Array.from(document.querySelectorAll(".modal"));
    const modal = modals.find((element) => {
      const text = element.textContent ?? "";
      return text.includes("\u042D\u043A\u0441\u043F\u043E\u0440\u0442 \u0432 PDF") || text.includes("Export PDF");
    });
    if (!modal) {
      return;
    }
    this.setup(modal);
  }
  setup(modal) {
    const content = modal.querySelector(".modal-content");
    if (!content) {
      return;
    }
    const modalEl = modal;
    modalEl.style.setProperty("width", "760px", "important");
    modalEl.style.setProperty("max-width", "90vw", "important");
    modalEl.style.setProperty("min-width", "0", "important");
    modalEl.style.setProperty("height", "80vh", "important");
    modalEl.style.setProperty("max-height", "80vh", "important");
    modalEl.style.setProperty("min-height", "0", "important");
    this.forceA4(modal);
    this.hideScaleSetting(modal);
    const layout = document.createElement("div");
    layout.className = "pdf-export-layout";
    const left = document.createElement("div");
    left.className = "pdf-export-settings-left";
    const right = document.createElement("div");
    right.className = "pdf-export-preview-right";
    const children = Array.from(content.children);
    children.forEach((child) => {
      left.appendChild(child);
    });
    layout.appendChild(left);
    layout.appendChild(right);
    content.appendChild(layout);
    this.createFontSetting(left);
    this.preview = new PdfPreview(this.app, this.plugin.pdfSettings, right);
    requestAnimationFrame(() => {
      this.fitPreviewHeight();
      this.preview?.refresh();
    });
  }
  createFontSetting(container) {
    const wrapper = document.createElement("div");
    wrapper.className = "pdf-export-font-size-setting";
    new import_obsidian5.Setting(wrapper).setName("\u0420\u0430\u0437\u043C\u0435\u0440 \u0448\u0440\u0438\u0444\u0442\u0430").setDesc("\u0420\u0430\u0437\u043C\u0435\u0440 \u0442\u0435\u043A\u0441\u0442\u0430 \u043F\u0440\u0438 \u044D\u043A\u0441\u043F\u043E\u0440\u0442\u0435 \u0432 PDF").addText((text) => {
      text.inputEl.type = "number";
      text.inputEl.step = "0.5";
      text.inputEl.min = "1";
      text.setValue(String(this.plugin.pdfSettings.fontSize));
      text.onChange(async (value) => {
        const parsed = Number(value);
        if (!Number.isFinite(parsed) || parsed <= 0) {
          return;
        }
        this.plugin.pdfSettings.fontSize = parsed;
        await this.plugin.saveSettings();
      });
      text.inputEl.style.width = "90px";
    });
    container.appendChild(wrapper);
  }
  fitPreviewHeight() {
    if (!this.preview) {
      return;
    }
    this.preview.setHeight(540);
  }
  forceA4(modal) {
    const settings = Array.from(modal.querySelectorAll(".setting-item"));
    const pageSetting = settings.find(
      (setting) => (setting.textContent ?? "").includes("\u0420\u0430\u0437\u043C\u0435\u0440 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u044B")
    );
    if (!pageSetting) {
      return;
    }
    const select = pageSetting.querySelector(
      "select"
    );
    if (select) {
      const a4 = Array.from(select.options).find(
        (option) => option.textContent?.trim().toLowerCase() === "a4"
      );
      if (a4) {
        select.value = a4.value;
        select.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }
    pageSetting.style.display = "none";
  }
  hideScaleSetting(modal) {
    const settings = Array.from(modal.querySelectorAll(".setting-item"));
    const scaleSetting = settings.find(
      (setting) => (setting.textContent ?? "").includes("\u041C\u0430\u0441\u0448\u0442\u0430\u0431\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u0435")
    );
    if (!scaleSetting) {
      return;
    }
    scaleSetting.style.display = "none";
  }
  refresh() {
    this.preview?.refresh();
  }
  createSettingTab() {
    return new PdfExportSettingTab(this.app, this.plugin);
  }
  destroy() {
    this.observer?.disconnect();
    this.observer = null;
    this.preview?.destroy();
    this.preview = null;
    document.querySelector(".pdf-export-layout")?.remove();
  }
};

// src/styles/styles.css
var styles_default = ".pdf-export-layout {\r\n  display: flex !important;\r\n  align-items: flex-start !important;\r\n  gap: 18px !important;\r\n  width: 100% !important;\r\n  height: 100% !important;\r\n  box-sizing: border-box !important;\r\n}\r\n.pdf-export-settings-left {\r\n  flex: 0 0 270px !important;\r\n  width: 270px !important;\r\n  min-width: 0 !important;\r\n  height: 100% !important;\r\n  overflow-y: auto !important;\r\n  overflow-x: hidden !important;\r\n}\r\n.pdf-export-preview-right {\r\n  flex: 0 0 390px !important;\r\n  width: 390px !important;\r\n  min-width: 0 !important;\r\n  display: flex;\r\n  flex-direction: column;\r\n  align-items: center;\r\n}\r\n.pdf-export-preview-header {\r\n  width: 100%;\r\n  text-align: center;\r\n  font-size: 15px;\r\n  font-weight: 600;\r\n  margin-bottom: 8px;\r\n  white-space: nowrap;\r\n}\r\n.pdf-export-preview-navigation {\r\n  display: flex;\r\n  align-items: center;\r\n  justify-content: center;\r\n  gap: 6px;\r\n  margin-bottom: 8px;\r\n  min-height: 30px;\r\n}\r\n.pdf-preview-arrow {\r\n  width: 32px;\r\n  height: 30px;\r\n  padding: 0;\r\n  display: flex;\r\n  align-items: center;\r\n  justify-content: center;\r\n  border: 1px solid var(--background-modifier-border);\r\n  border-radius: 5px;\r\n  background: var(--background-secondary);\r\n  color: var(--text-normal);\r\n  cursor: pointer;\r\n  font-size: 17px;\r\n  line-height: 1;\r\n}\r\n.pdf-preview-arrow:hover:not(:disabled) {\r\n  background: var(--background-modifier-hover);\r\n}\r\n.pdf-preview-arrow:disabled {\r\n  opacity: 0.4;\r\n  cursor: default;\r\n}\r\n.pdf-preview-page-input {\r\n  width: 48px;\r\n  height: 30px;\r\n  padding: 0 5px;\r\n  box-sizing: border-box;\r\n  text-align: center;\r\n  border: 1px solid var(--background-modifier-border);\r\n  border-radius: 5px;\r\n  background: var(--background-primary);\r\n  color: var(--text-normal);\r\n  font-size: 14px;\r\n}\r\n.pdf-preview-page-input:focus {\r\n  border-color: var(--interactive-accent);\r\n  outline: none;\r\n}\r\n.pdf-preview-page-total {\r\n  font-size: 14px;\r\n  color: var(--text-muted);\r\n}\r\n.pdf-export-preview-viewport {\r\n  position: relative;\r\n  overflow: hidden !important;\r\n  background: var(--background-secondary);\r\n  border-radius: 6px;\r\n  box-sizing: border-box;\r\n  margin: 0 auto;\r\n  flex: none !important;\r\n}\r\n.pdf-export-preview-iframe {\r\n  display: block;\r\n  position: absolute;\r\n  border: 0 !important;\r\n  margin: 0;\r\n  padding: 0;\r\n  background: white;\r\n  overflow: hidden !important;\r\n  box-shadow: 0 1px 5px rgba(0, 0, 0, 0.18);\r\n}\r\n.pdf-export-font-size-setting {\r\n  margin-top: 0;\r\n}\r\n.pdf-export-settings-left .setting-item {\r\n  padding-top: 5px;\r\n  padding-bottom: 5px;\r\n}\r\n.pdf-export-settings-left .setting-item-info {\r\n  min-width: 0;\r\n}\r\n.pdf-export-settings-left .setting-item-name {\r\n  font-size: 14px;\r\n}\r\n.pdf-export-settings-left .setting-item-description {\r\n  font-size: 12px;\r\n}\r\n.pdf-export-settings-left .setting-item-control {\r\n  flex-shrink: 0;\r\n}\r\n.pdf-export-preview-error {\r\n  padding: 20px;\r\n  color: var(--text-error);\r\n  font-size: 14px;\r\n}\r\n@media (max-width: 800px) {\r\n  .pdf-export-layout {\r\n    flex-direction: column !important;\r\n    height: auto !important;\r\n  }\r\n  .pdf-export-settings-left {\r\n    flex: none !important;\r\n    width: 100% !important;\r\n    height: auto !important;\r\n    overflow: visible !important;\r\n  }\r\n  .pdf-export-preview-right {\r\n    flex: none !important;\r\n    width: 100% !important;\r\n  }\r\n  .pdf-export-preview-viewport {\r\n    max-width: 100% !important;\r\n  }\r\n}\r\n";

// src/main.ts
var PdfExportPlugin = class extends import_obsidian6.Plugin {
  pdfSettings;
  pdfModal;
  printFontStyle = null;
  async onload() {
    await this.loadSettings();
    this.applyPrintFontSize();
    this.pdfModal = new PdfModal(this.app, this);
    this.pdfModal.start();
    this.addSettingTab(new PdfExportSettingTab(this.app, this));
    const style = document.createElement("style");
    style.id = "pdf-export-plugin-styles";
    style.textContent = styles_default;
    document.head.appendChild(style);
  }
  async loadSettings() {
    this.pdfSettings = Object.assign(
      {},
      DEFAULT_SETTINGS,
      await this.loadData()
    );
  }
  async saveSettings() {
    await this.saveData(this.pdfSettings);
    this.applyPrintFontSize();
    this.pdfModal?.refresh();
  }
  applyPrintFontSize() {
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
};
