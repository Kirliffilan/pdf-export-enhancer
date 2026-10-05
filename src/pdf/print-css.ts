import { App, normalizePath, MarkdownView } from "obsidian";
interface AppearanceData {
  enabledCssSnippets?: string[];
}
interface SnippetSource {
  name: string;
  css: string;
}
export async function getLoadedCss(app: App): Promise<string> {
  const view = app.workspace.getActiveViewOfType(MarkdownView);
  const markdownRoot = view?.containerEl.querySelector(
    ".markdown-preview-view",
  ) as HTMLElement | null;
  if (!markdownRoot) {
    return "";
  }
  const standard: string[] = [];
  const print: string[] = [];
  for (const sheet of Array.from(document.styleSheets)) {
    if (isPluginStylesheet(sheet) || isSnippetStylesheet(sheet)) {
      continue;
    }
    try {
      const rules = sheet.cssRules;
      if (!rules) {
        continue;
      }
      const baseUrl = sheet.href || document.baseURI;
      for (const rule of Array.from(rules)) {
        collectRule(rule, standard, print, baseUrl, markdownRoot);
      }
    } catch {}
  }
  const snippets = await getEnabledSnippets(app);
  const snippetNormal: string[] = [];
  const snippetPrint: string[] = [];
  for (const snippet of snippets) {
    const split = splitPrintCss(snippet.css);
    if (split.normal.trim()) {
      collectCssText(
        split.normal,
        snippetNormal,
        markdownRoot,
        getSnippetBaseUrl(app, snippet.name),
      );
    }
    if (split.print.trim()) {
      collectCssText(
        split.print,
        snippetPrint,
        markdownRoot,
        getSnippetBaseUrl(app, snippet.name),
      );
    }
  }
  return [
    standard.join("\n"),
    print.join("\n"),
    snippetNormal.join("\n"),
    snippetPrint.join("\n"),
  ]
    .filter((value) => value.trim())
    .join("\n");
}
function collectRule(
  rule: CSSRule,
  standard: string[],
  print: string[],
  baseUrl: string,
  markdownRoot: HTMLElement,
) {
  if (rule instanceof CSSImportRule) {
    try {
      const imported = rule.styleSheet;
      if (!imported) {
        return;
      }
      for (const nestedRule of Array.from(imported.cssRules)) {
        collectRule(
          nestedRule,
          standard,
          print,
          imported.href || baseUrl,
          markdownRoot,
        );
      }
    } catch {}
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
    const nested: string[] = [];
    for (const nestedRule of Array.from(rule.cssRules)) {
      collectRule(nestedRule, nested, [], baseUrl, markdownRoot);
    }
    if (nested.length) {
      standard.push(`@media ${rule.conditionText} {\n${nested.join("\n")}\n}`);
    }
    return;
  }
  if (rule instanceof CSSSupportsRule) {
    const nestedStandard: string[] = [];
    const nestedPrint: string[] = [];
    for (const nestedRule of Array.from(rule.cssRules)) {
      collectRule(
        nestedRule,
        nestedStandard,
        nestedPrint,
        baseUrl,
        markdownRoot,
      );
    }
    if (nestedStandard.length) {
      standard.push(
        `@supports ${rule.conditionText} {\n${nestedStandard.join("\n")}\n}`,
      );
    }
    if (nestedPrint.length) {
      print.push(
        `@supports ${rule.conditionText} {\n${nestedPrint.join("\n")}\n}`,
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
function collectPrintRule(
  rule: CSSRule,
  result: string[],
  baseUrl: string,
  markdownRoot: HTMLElement,
) {
  if (rule instanceof CSSMediaRule) {
    for (const nestedRule of Array.from(rule.cssRules)) {
      collectPrintRule(nestedRule, result, baseUrl, markdownRoot);
    }
    return;
  }
  if (rule instanceof CSSSupportsRule) {
    const nested: string[] = [];
    for (const nestedRule of Array.from(rule.cssRules)) {
      collectPrintRule(nestedRule, nested, baseUrl, markdownRoot);
    }
    if (nested.length) {
      result.push(`@supports ${rule.conditionText} {\n${nested.join("\n")}\n}`);
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
function collectCssText(
  css: string,
  result: string[],
  markdownRoot: HTMLElement,
  baseUrl: string,
) {
  const style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);
  try {
    for (const rule of Array.from(style.sheet?.cssRules ?? [])) {
      if (rule instanceof CSSMediaRule) {
        const nested: string[] = [];
        for (const nestedRule of Array.from(rule.cssRules)) {
          collectPrintRule(nestedRule, nested, baseUrl, markdownRoot);
        }
        if (nested.length) {
          result.push(nested.join("\n"));
        }
        continue;
      }
      if (rule instanceof CSSStyleRule) {
        if (ruleMatchesMarkdown(rule.selectorText, markdownRoot)) {
          result.push(absolutizeUrls(rule.cssText, baseUrl));
        }
      }
    }
  } finally {
    style.remove();
  }
}
function ruleMatchesMarkdown(selector: string, root: HTMLElement): boolean {
  if (selector.includes("::")) {
    selector = selector.replace(/::[a-z-]+/gi, "");
  }
  const selectors = splitSelectors(selector);
  for (const part of selectors) {
    const value = part.trim();
    if (!value) {
      continue;
    }
    if (value === ":root") {
      return true;
    }
    if (/^html\b/i.test(value) || /^body\b/i.test(value)) {
      continue;
    }
    try {
      if (root.matches(value) || root.querySelector(value)) {
        return true;
      }
    } catch {}
  }
  return false;
}
function splitSelectors(selector: string): string[] {
  const result: string[] = [];
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
    if (char === '"' || char === "'") {
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
async function getEnabledSnippets(app: App): Promise<SnippetSource[]> {
  const appearancePath = normalizePath(
    `${app.vault.configDir}/appearance.json`,
  );
  let appearance: AppearanceData = {};
  try {
    const text = await app.vault.adapter.read(appearancePath);
    appearance = JSON.parse(text) as AppearanceData;
  } catch {
    return [];
  }
  const enabled = appearance.enabledCssSnippets ?? [];
  const result: SnippetSource[] = [];
  for (const name of enabled) {
    const fileName = name.toLowerCase().endsWith(".css") ? name : `${name}.css`;
    const path = normalizePath(`${app.vault.configDir}/snippets/${fileName}`);
    try {
      const css = await app.vault.adapter.read(path);
      result.push({
        name: fileName,
        css,
      });
    } catch {}
  }
  return result;
}
function isPluginStylesheet(sheet: CSSStyleSheet): boolean {
  const owner = sheet.ownerNode;
  if (owner instanceof HTMLStyleElement) {
    return owner.id === "pdf-export-plugin-styles";
  }
  return false;
}
function isSnippetStylesheet(sheet: CSSStyleSheet): boolean {
  const owner = sheet.ownerNode;
  if (owner instanceof HTMLLinkElement) {
    return owner.href.toLowerCase().includes("/snippets/");
  }
  return false;
}
function getSnippetBaseUrl(app: App, fileName: string): string {
  return `${document.baseURI}${normalizePath(
    `${app.vault.configDir}/snippets/${fileName}`,
  )}`;
}
function splitPrintCss(css: string): {
  normal: string;
  print: string;
} {
  const normal: string[] = [];
  const print: string[] = [];
  let position = 0;
  while (position < css.length) {
    const match = /@media\s+print[^{]*\{/gi.exec(css.slice(position));
    if (!match || match.index === undefined) {
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
    print: print.join("\n"),
  };
}
function findMatchingBrace(text: string, openBrace: number): number {
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
function absolutizeUrls(css: string, baseUrl: string): string {
  return css.replace(/url\(\s*(['"]?)(.*?)\1\s*\)/gi, (full, _quote, value) => {
    const url = String(value).trim();
    if (
      !url ||
      url.startsWith("data:") ||
      url.startsWith("blob:") ||
      url.startsWith("#") ||
      /^[a-z][a-z0-9+.-]*:/i.test(url)
    ) {
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
