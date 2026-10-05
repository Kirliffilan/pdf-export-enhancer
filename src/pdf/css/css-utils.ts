import { App, normalizePath } from "obsidian";
export function getMarkdownRoot(): HTMLElement | null {
  return document.querySelector(".markdown-preview-view") as HTMLElement | null;
}
export function isOwnPluginStylesheet(sheet: CSSStyleSheet): boolean {
  const owner = sheet.ownerNode;
  if (owner instanceof HTMLStyleElement) {
    return owner.id === "pdf-export-plugin-styles";
  }
  if (owner instanceof HTMLLinkElement) {
    return owner.href.toLowerCase().includes("/plugins/pdf-export-settings/");
  }
  return false;
}
export function isPluginOrThemeStylesheet(sheet: CSSStyleSheet): boolean {
  const owner = sheet.ownerNode;
  if (owner instanceof HTMLLinkElement) {
    const href = owner.href.toLowerCase();
    return href.includes("/plugins/") || href.includes("/themes/");
  }
  if (owner instanceof HTMLStyleElement) {
    const id = owner.id.toLowerCase();
    return id.includes("plugin") || id.includes("theme");
  }
  return false;
}
export function isSnippetStylesheet(sheet: CSSStyleSheet): boolean {
  const owner = sheet.ownerNode;
  if (owner instanceof HTMLLinkElement) {
    return owner.href.toLowerCase().includes("/snippets/");
  }
  return false;
}
export function getSnippetBaseUrl(app: App, fileName: string): string {
  return `${document.baseURI}${normalizePath(
    `${app.vault.configDir}/snippets/${fileName}`,
  )}`;
}
export function ruleMatchesMarkdown(
  selector: string,
  markdownRoot: HTMLElement,
): boolean {
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
    } catch {}
  }
  return false;
}
export function splitSelectors(selector: string): string[] {
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
export function splitPrintCss(css: string): {
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
export function findMatchingBrace(text: string, openBrace: number): number {
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
export function absolutizeUrls(css: string, baseUrl: string): string {
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
