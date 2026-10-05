import { App, normalizePath } from "obsidian";
export interface AppearanceData {
  enabledCssSnippets?: string[];
}
export interface SnippetSource {
  name: string;
  css: string;
}
export async function getEnabledSnippets(app: App): Promise<SnippetSource[]> {
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
