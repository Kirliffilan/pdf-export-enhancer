import type { App } from "obsidian";
import type { NativePdfMargin, NativePdfSettings } from "../pdf-settings";
interface ObsidianPdfExportSettings {
  includeName?: boolean;
  pageSize?: string;
  landscape?: boolean;
  margin?: string;
  downscalePercent?: number;
}
interface ObsidianAppConfig {
  pdfExportSettings?: ObsidianPdfExportSettings;
}
export async function loadNativePdfSettings(
  app: App,
): Promise<NativePdfSettings | null> {
  try {
    const raw = await app.vault.adapter.read(".obsidian/app.json");
    const config = JSON.parse(raw) as ObsidianAppConfig;
    const settings = config.pdfExportSettings;
    if (!settings) {
      return null;
    }
    return {
      includeFileName: settings.includeName ?? false,
      landscape: settings.landscape ?? false,
      margin: parseNativePdfMargin(settings.margin),
    };
  } catch {
    return null;
  }
}
export function parseNativePdfMargin(value?: string): NativePdfMargin {
  if (value === "2") {
    return "minimal";
  }
  if (value === "1") {
    return "none";
  }
  return "default";
}
