import { App, PluginSettingTab, Setting, getLanguage } from "obsidian";
import type { PdfExportSettings } from "./settings";

export interface SettingsPlugin {
  pdfSettings: PdfExportSettings;
  saveSettings(): Promise<void>;
}

export class PdfExportSettingTab extends PluginSettingTab {
  private plugin: SettingsPlugin;

  constructor(app: App, plugin: SettingsPlugin) {
    super(app, plugin as any);
    this.plugin = plugin;
  }

  display() {
    const { containerEl } = this;
    containerEl.empty();
    const isRussian = getLanguage() === "ru";
    containerEl.createEl("h2", {
      text: isRussian ? "Настройки экспорта PDF" : "PDF Export Settings",
    });

    new Setting(containerEl)
      .setName(isRussian ? "Размер шрифта" : "Text size")
      .setDesc(
        isRussian
          ? "Размер текста при экспорте в PDF"
          : "Text size used when exporting to PDF",
      )
      .addText((text) => {
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
}
