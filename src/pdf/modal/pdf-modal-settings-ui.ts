import { Setting, getLanguage } from "obsidian";
import type {
  PdfExportSettings,
  PdfPageNumberPosition,
} from "../../settings/settings";
function compactSetting(settingEl: HTMLElement) {
  settingEl.style.setProperty("display", "grid", "important");
  settingEl.style.setProperty(
    "grid-template-columns",
    "minmax(0, 1fr) 76px",
    "important",
  );
  settingEl.style.setProperty("column-gap", "6px", "important");
  settingEl.style.setProperty("align-items", "center", "important");
  settingEl.style.setProperty("padding", "2px 0", "important");
  settingEl.style.setProperty("margin", "0", "important");
  settingEl.style.setProperty("min-height", "0", "important");
  settingEl.style.setProperty("box-sizing", "border-box", "important");
  const info = settingEl.querySelector(
    ".setting-item-info",
  ) as HTMLElement | null;
  if (info) {
    info.style.setProperty("width", "100%", "important");
    info.style.setProperty("min-width", "0", "important");
    info.style.setProperty("padding", "0", "important");
    info.style.setProperty("margin", "0", "important");
    info.style.setProperty("box-sizing", "border-box", "important");
    info.style.setProperty("overflow", "hidden", "important");
  }
  const control = settingEl.querySelector(
    ".setting-item-control",
  ) as HTMLElement | null;
  if (control) {
    control.style.setProperty("width", "76px", "important");
    control.style.setProperty("min-width", "0", "important");
    control.style.setProperty("max-width", "76px", "important");
    control.style.setProperty("padding", "0", "important");
    control.style.setProperty("margin", "0", "important");
    control.style.setProperty("justify-content", "flex-end", "important");
    control.style.setProperty("box-sizing", "border-box", "important");
  }
  const name = settingEl.querySelector(
    ".setting-item-name",
  ) as HTMLElement | null;
  if (name) {
    name.style.setProperty("font-size", "13px", "important");
    name.style.setProperty("line-height", "1.08", "important");
    name.style.setProperty("white-space", "normal", "important");
    name.style.setProperty("overflow-wrap", "break-word", "important");
  }
  const description = settingEl.querySelector(
    ".setting-item-description",
  ) as HTMLElement | null;
  if (description) {
    description.style.setProperty("display", "none", "important");
  }
}
function compactWrapper(wrapper: HTMLElement) {
  wrapper.style.setProperty("margin", "0", "important");
  wrapper.style.setProperty("padding", "0", "important");
  const title = wrapper.querySelector(
    ".pdf-export-margin-title",
  ) as HTMLElement | null;
  if (title) {
    title.style.setProperty("font-size", "14px", "important");
    title.style.setProperty("line-height", "1.1", "important");
    title.style.setProperty("font-weight", "600", "important");
    title.style.setProperty("margin", "5px 0 2px", "important");
    title.style.setProperty("padding", "0", "important");
  }
}
function configureTextInput(input: HTMLInputElement) {
  input.style.setProperty("width", "68px", "important");
  input.style.setProperty("min-width", "0", "important");
  input.style.setProperty("max-width", "68px", "important");
  input.style.setProperty("height", "30px", "important");
  input.style.setProperty("padding", "3px 6px", "important");
  input.style.setProperty("font-size", "12px", "important");
  input.style.setProperty("box-sizing", "border-box", "important");
}
function configureDropdown(select: HTMLSelectElement) {
  select.style.setProperty("width", "76px", "important");
  select.style.setProperty("min-width", "0", "important");
  select.style.setProperty("max-width", "76px", "important");
  select.style.setProperty("height", "30px", "important");
  select.style.setProperty("padding", "2px 4px", "important");
  select.style.setProperty("font-size", "11px", "important");
  select.style.setProperty("box-sizing", "border-box", "important");
}
export function createFontSetting(
  container: HTMLElement,
  settings: PdfExportSettings,
  saveSettings: () => Promise<void>,
) {
  const isRussian = getLanguage() === "ru";
  const wrapper = document.createElement("div");
  wrapper.className = "pdf-export-font-size-setting";
  compactWrapper(wrapper);
  const title = document.createElement("div");
  title.className = "pdf-export-margin-title";
  title.textContent = isRussian ? "Текст" : "Text";
  wrapper.appendChild(title);
  const setting = new Setting(wrapper)
    .setName(isRussian ? "Размер шрифта" : "Font size")
    .addText((text) => {
      text.inputEl.type = "number";
      text.inputEl.step = "0.5";
      text.inputEl.min = "1";
      text.setValue(String(settings.fontSize));
      configureTextInput(text.inputEl);
      text.onChange(async (value) => {
        const parsed = Number(value);
        if (!Number.isFinite(parsed) || parsed <= 0) {
          return;
        }
        settings.fontSize = parsed;
        await saveSettings();
      });
    });
  compactSetting(setting.settingEl);
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
  compactWrapper(wrapper);
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
  const setting = new Setting(container).setName(name).addText((text) => {
    text.inputEl.type = "number";
    text.inputEl.min = "0";
    text.inputEl.step = "1";
    text.setValue(String(settings[key]));
    configureTextInput(text.inputEl);
    text.onChange(async (value) => {
      const parsed = Number(value);
      if (!Number.isFinite(parsed) || parsed < 0) {
        return;
      }
      settings[key] = parsed;
      await saveSettings();
    });
  });
  compactSetting(setting.settingEl);
}
export function createLineSpacingSetting(
  container: HTMLElement,
  settings: PdfExportSettings,
  saveSettings: () => Promise<void>,
) {
  const isRussian = getLanguage() === "ru";
  const wrapper = document.createElement("div");
  wrapper.className = "pdf-export-margin-settings";
  compactWrapper(wrapper);
  const title = document.createElement("div");
  title.className = "pdf-export-margin-title";
  title.textContent = isRussian ? "Интервалы текста" : "Text spacing";
  wrapper.appendChild(title);
  const setting = new Setting(wrapper)
    .setName(isRussian ? "Межстрочный интервал" : "Line spacing")
    .addText((text) => {
      text.inputEl.type = "number";
      text.inputEl.min = "0.1";
      text.inputEl.step = "0.05";
      text.setValue(String(settings.lineHeight));
      configureTextInput(text.inputEl);
      text.onChange(async (value) => {
        const parsed = Number(value);
        if (!Number.isFinite(parsed) || parsed <= 0) {
          return;
        }
        settings.lineHeight = parsed;
        await saveSettings();
      });
    });
  compactSetting(setting.settingEl);
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
  compactWrapper(wrapper);
  const title = document.createElement("div");
  title.className = "pdf-export-margin-title";
  title.textContent = isRussian ? "Номера страниц" : "Page numbers";
  wrapper.appendChild(title);
  const showNumbers = new Setting(wrapper)
    .setName(isRussian ? "Показывать номера" : "Show page numbers")
    .addToggle((toggle) => {
      toggle.setValue(settings.showPageNumbers);
      toggle.onChange(async (value) => {
        settings.showPageNumbers = value;
        await saveSettings();
      });
    });
  compactSetting(showNumbers.settingEl);
  const position = new Setting(wrapper)
    .setName(isRussian ? "Положение" : "Position")
    .addDropdown((dropdown) => {
      dropdown.addOption("left", isRussian ? "Слева" : "Left");
      dropdown.addOption("center", isRussian ? "Центр" : "Center");
      dropdown.addOption("right", isRussian ? "Справа" : "Right");
      dropdown.setValue(settings.pageNumberPosition);
      configureDropdown(dropdown.selectEl);
      dropdown.onChange(async (value) => {
        settings.pageNumberPosition = value as PdfPageNumberPosition;
        await saveSettings();
      });
    });
  compactSetting(position.settingEl);
  const skipFirst = new Setting(wrapper)
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
  compactSetting(skipFirst.settingEl);
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
  compactWrapper(wrapper);
  const title = document.createElement("div");
  title.className = "pdf-export-margin-title";
  title.textContent = isRussian ? "Разрывы страниц" : "Page breaks";
  wrapper.appendChild(title);
  const h1 = new Setting(wrapper)
    .setName(isRussian ? "H1 с новой страницы" : "H1 on new page")
    .addToggle((toggle) => {
      toggle.setValue(settings.pageBreakH1);
      toggle.onChange(async (value) => {
        settings.pageBreakH1 = value;
        await saveSettings();
      });
    });
  compactSetting(h1.settingEl);
  const h2 = new Setting(wrapper)
    .setName(isRussian ? "H2 с новой страницы" : "H2 on new page")
    .addToggle((toggle) => {
      toggle.setValue(settings.pageBreakH2);
      toggle.onChange(async (value) => {
        settings.pageBreakH2 = value;
        await saveSettings();
      });
    });
  compactSetting(h2.settingEl);
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
  compactWrapper(wrapper);
  const setting = new Setting(wrapper)
    .setName(isRussian ? "Чёрно-белый PDF" : "Monochrome PDF")
    .addToggle((toggle) => {
      toggle.setValue(settings.monochrome);
      toggle.onChange(async (value) => {
        settings.monochrome = value;
        await saveSettings();
      });
    });
  compactSetting(setting.settingEl);
  container.appendChild(wrapper);
}
