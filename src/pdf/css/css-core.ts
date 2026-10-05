import { absolutizeUrls, ruleMatchesMarkdown } from "./css-utils";
export function collectCoreRule(
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
      const importedBaseUrl = imported.href || baseUrl;
      for (const nestedRule of Array.from(imported.cssRules)) {
        collectCoreRule(
          nestedRule,
          standard,
          print,
          importedBaseUrl,
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
      collectCoreRule(nestedRule, nested, [], baseUrl, markdownRoot);
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
      collectCoreRule(
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
export function collectPluginThemeRule(
  rule: CSSRule,
  result: string[],
  baseUrl: string,
  markdownRoot: HTMLElement,
) {
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
          markdownRoot,
        );
      }
    } catch {}
    return;
  }
  if (rule instanceof CSSMediaRule) {
    const nested: string[] = [];
    for (const nestedRule of Array.from(rule.cssRules)) {
      collectPluginThemeRule(nestedRule, nested, baseUrl, markdownRoot);
    }
    if (nested.length) {
      result.push(`@media ${rule.conditionText} {\n${nested.join("\n")}\n}`);
    }
    return;
  }
  if (rule instanceof CSSSupportsRule) {
    const nested: string[] = [];
    for (const nestedRule of Array.from(rule.cssRules)) {
      collectPluginThemeRule(nestedRule, nested, baseUrl, markdownRoot);
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
export function collectPrintRule(
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
