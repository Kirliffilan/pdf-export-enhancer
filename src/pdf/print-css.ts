import { App, normalizePath } from "obsidian";
interface AppearanceData {
  enabledCssSnippets?: string[];
}
interface SnippetSource {
  name: string;
  css: string;
}
export async function getLoadedCss(app: App): Promise<string> {
  const snippets = await getEnabledSnippets(app);
  const result: string[] = [];
  for (const snippet of snippets) {
    const split = splitPrintCss(snippet.css);
    if (split.normal.trim()) {
      result.push(split.normal);
    }
    if (split.print.trim()) {
      result.push(split.print);
    }
  }
  return result.join("\n");
}
async function getEnabledSnippets(app: App): Promise<SnippetSource[]> {
  const appearancePath = normalizePath(
    `${app.vault.configDir}/appearance.json`,
  );
  let appearance: AppearanceData = {};
  try {
    const text = await app.vault.adapter.read(appearancePath);
    appearance = JSON.parse(text) as AppearanceData;
  } catch (error) {
    console.warn("PDF Export Preview: failed to read appearance.json", error);
    return [];
  }
  const enabled = appearance.enabledCssSnippets ?? [];
  const result: SnippetSource[] = [];
  for (const snippetName of enabled) {
    const fileName = snippetName.toLowerCase().endsWith(".css")
      ? snippetName
      : `${snippetName}.css`;
    const snippetPath = normalizePath(
      `${app.vault.configDir}/snippets/${fileName}`,
    );
    try {
      const css = await app.vault.adapter.read(snippetPath);
      result.push({
        name: fileName,
        css,
      });
    } catch (error) {
      console.warn(
        `PDF Export Preview: failed to read snippet "${snippetName}"`,
        error,
      );
    }
  }
  return result;
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
