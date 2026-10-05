import { App } from "obsidian";
import { collectCoreRule, collectPluginThemeRule } from "./css/css-core";
import { getEnabledSnippets } from "./css/css-snippets";
import {
  absolutizeUrls,
  getMarkdownRoot,
  getSnippetBaseUrl,
  isOwnPluginStylesheet,
  isPluginOrThemeStylesheet,
  isSnippetStylesheet,
  splitPrintCss,
} from "./css/css-utils";
export async function getLoadedCss(app: App): Promise<string> {
  const markdownRoot = getMarkdownRoot();
  if (!markdownRoot) {
    return "";
  }
  const standard: string[] = [];
  const print: string[] = [];
  const pluginsAndThemes: string[] = [];
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
    } catch {}
  }
  const snippets = await getEnabledSnippets(app);
  const snippetCss: string[] = [];
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
    snippetCss.join("\n"),
  ]
    .filter((value) => value.trim())
    .join("\n");
}
