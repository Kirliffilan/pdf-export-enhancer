import { Setting, getLanguage } from "obsidian";
import type {
  PdfExportSettings,
  PdfPageNumberPosition,
} from "../../settings/settings";
export function createFontSetting(
  container: HTMLElement,
  settings: PdfExportSettings,
  saveSettings: () => Promise<void>,
) {
  const isRussian = getLanguage() === "ru";
  const wrapper = document.createElement("div");
  wrapper.className = "pdf-export-font-size-setting";
  new Setting(wrapper)
    .setName(isRussian ? "Размер шрифта" : "Text size")
    .addText((text) => {
      text.inputEl.type = "number";
      text.inputEl.step = "0.5";
      text.inputEl.min = "1";
      text.setValue(String(settings.fontSize));
      text.onChange(async (value) => {
        const parsed = Number(value);
        if (!Number.isFinite(parsed) || parsed <= 0) {
          return;
        }
        settings.fontSize = parsed;
        await saveSettings();
      });
      text.inputEl.style.width = "90px";
    });
  container.appendChild(wrapper);
}
export function createMarginSettings(
  container: HTMLElement,
  settings: PdfExportSettings,
  saveSettings: () => Promise<void>,
) {
  const isRussian = getLanguage() === "ru";
  const wrapper = document.createElement("div");
  wrapper.className = "pdf-export-margin-settings";
  const title = document.createElement("div");
  title.className = "pdf-export-margin-title";
  title.textContent = isRussian ? "Поля страницы" : "Page margins";
  wrapper.appendChild(title);
  createMarginInput(
    wrapper,
    isRussian ? "Сверху" : "Top",
    settings,
    "marginTop",
    saveSettings,
  );
  createMarginInput(
    wrapper,
    isRussian ? "Снизу" : "Bottom",
    settings,
    "marginBottom",
    saveSettings,
  );
  createMarginInput(
    wrapper,
    isRussian ? "Слева" : "Left",
    settings,
    "marginLeft",
    saveSettings,
  );
  createMarginInput(
    wrapper,
    isRussian ? "Справа" : "Right",
    settings,
    "marginRight",
    saveSettings,
  );
  container.appendChild(wrapper);
}
function createMarginInput(
  container: HTMLElement,
  name: string,
  settings: PdfExportSettings,
  key: "marginTop" | "marginBottom" | "marginLeft" | "marginRight",
  saveSettings: () => Promise<void>,
) {
  new Setting(container).setName(name).addText((text) => {
    text.inputEl.type = "number";
    text.inputEl.min = "0";
    text.inputEl.step = "1";
    text.setValue(String(settings[key]));
    text.onChange(async (value) => {
      const parsed = Number(value);
      if (!Number.isFinite(parsed) || parsed < 0) {
        return;
      }
      settings[key] = parsed;
      await saveSettings();
    });
    text.inputEl.style.width = "90px";
  });
}
export function createLineSpacingSetting(
  container: HTMLElement,
  settings: PdfExportSettings,
  saveSettings: () => Promise<void>,
) {
  const isRussian = getLanguage() === "ru";
  const wrapper = document.createElement("div");
  wrapper.className = "pdf-export-margin-settings";
  const title = document.createElement("div");
  title.className = "pdf-export-margin-title";
  title.textContent = isRussian ? "Интервалы текста" : "Text spacing";
  wrapper.appendChild(title);
  new Setting(wrapper)
    .setName(isRussian ? "Межстрочный интервал" : "Line spacing")
    .addDropdown((dropdown) => {
      dropdown.addOption("1", "1");
      dropdown.addOption("1.15", "1.15");
      dropdown.addOption("1.25", "1.25");
      dropdown.addOption("1.5", "1.5");
      dropdown.addOption("2", "2");
      dropdown.setValue(String(settings.lineHeight));
      dropdown.onChange(async (value) => {
        const parsed = Number(value);
        if (!Number.isFinite(parsed) || parsed <= 0) {
          return;
        }
        settings.lineHeight = parsed;
        await saveSettings();
      });
    });
  container.appendChild(wrapper);
}
export function createPageNumberSettings(
  container: HTMLElement,
  settings: PdfExportSettings,
  saveSettings: () => Promise<void>,
) {
  const isRussian = getLanguage() === "ru";
  const wrapper = document.createElement("div");
  wrapper.className = "pdf-export-margin-settings";
  const title = document.createElement("div");
  title.className = "pdf-export-margin-title";
  title.textContent = isRussian ? "Номера страниц" : "Page numbers";
  wrapper.appendChild(title);
  new Setting(wrapper)
    .setName(isRussian ? "Показывать номера" : "Show page numbers")
    .addToggle((toggle) => {
      toggle.setValue(settings.showPageNumbers);
      toggle.onChange(async (value) => {
        settings.showPageNumbers = value;
        await saveSettings();
      });
    });
  new Setting(wrapper)
    .setName(isRussian ? "Положение" : "Position")
    .addDropdown((dropdown) => {
      dropdown.addOption("left", isRussian ? "Слева" : "Left");
      dropdown.addOption("center", isRussian ? "По центру" : "Center");
      dropdown.addOption("right", isRussian ? "Справа" : "Right");
      dropdown.setValue(settings.pageNumberPosition);
      dropdown.onChange(async (value) => {
        settings.pageNumberPosition = value as PdfPageNumberPosition;
        await saveSettings();
      });
    });
  new Setting(wrapper)
    .setName(
      isRussian ? "Не нумеровать первую страницу" : "Do not number first page",
    )
    .addToggle((toggle) => {
      toggle.setValue(settings.skipFirstPageNumber);
      toggle.onChange(async (value) => {
        settings.skipFirstPageNumber = value;
        await saveSettings();
      });
    });
  container.appendChild(wrapper);
}
export function createPageBreakSettings(
  container: HTMLElement,
  settings: PdfExportSettings,
  saveSettings: () => Promise<void>,
) {
  const isRussian = getLanguage() === "ru";
  const wrapper = document.createElement("div");
  wrapper.className = "pdf-export-margin-settings";
  const title = document.createElement("div");
  title.className = "pdf-export-margin-title";
  title.textContent = isRussian ? "Разрывы страниц" : "Page breaks";
  wrapper.appendChild(title);
  new Setting(wrapper)
    .setName(isRussian ? "H1 с новой страницы" : "H1 on new page")
    .addToggle((toggle) => {
      toggle.setValue(settings.pageBreakH1);
      toggle.onChange(async (value) => {
        settings.pageBreakH1 = value;
        await saveSettings();
      });
    });
  new Setting(wrapper)
    .setName(isRussian ? "H2 с новой страницы" : "H2 on new page")
    .addToggle((toggle) => {
      toggle.setValue(settings.pageBreakH2);
      toggle.onChange(async (value) => {
        settings.pageBreakH2 = value;
        await saveSettings();
      });
    });
  container.appendChild(wrapper);
}
export function createMonochromeSetting(
  container: HTMLElement,
  settings: PdfExportSettings,
  saveSettings: () => Promise<void>,
) {
  const isRussian = getLanguage() === "ru";
  const wrapper = document.createElement("div");
  wrapper.className = "pdf-export-margin-settings";
  new Setting(wrapper)
    .setName(isRussian ? "Чёрно-белый PDF" : "Monochrome PDF")
    .addToggle((toggle) => {
      toggle.setValue(settings.monochrome);
      toggle.onChange(async (value) => {
        settings.monochrome = value;
        await saveSettings();
      });
    });
  container.appendChild(wrapper);
}
