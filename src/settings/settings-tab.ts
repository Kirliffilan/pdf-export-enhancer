import { App, PluginSettingTab, Setting } from "obsidian";

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
    containerEl.createEl("h2", {
      text: "PDF Export Settings",
    });

    new Setting(containerEl)
      .setName("Размер шрифта")
      .setDesc("Размер текста при экспорте в PDF")
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
