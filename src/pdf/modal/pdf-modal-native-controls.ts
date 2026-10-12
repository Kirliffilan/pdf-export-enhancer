import { setIcon } from "obsidian";
import type { NativePdfSettings } from "../pdf-settings";

type NativeSettingChanges = Partial<
  Pick<NativePdfSettings, "includeFileName" | "landscape">
>;

export function createNativeSettingsControls(
  container: HTMLElement,
  modal: Element,
  settings: NativePdfSettings,
  onChange: (changes: NativeSettingChanges) => void,
) {
  const settingsContainer =
    modal.querySelector(".pdf-export-settings-inner") ?? modal;
  const settingItems = Array.from(
    settingsContainer.querySelectorAll(".setting-item"),
  ) as HTMLElement[];

  const fileNameCheckbox = findNativeCheckbox(
    settingItems,
    /include\s*name|file\s*name|filename|имя.{0,24}(файл|заметк)|назван.{0,24}(файл|заметк)|(добав|включ|показыв).{0,24}имя/i,
  );
  const landscapeCheckbox = findNativeCheckbox(
    settingItems,
    /landscape|альбомн/i,
  );

  const wrapper = document.createElement("div");
  wrapper.className = "pdf-export-native-icon-controls";

  // These values are initialized from app.json by loadNativePdfSettings.
  // Do not replace them with the hidden checkboxes' initial DOM state:
  // Obsidian can render those checkboxes with stale values.
  let includeFileName = settings.includeFileName;
  let landscape = settings.landscape;

  const fileButton = createIconButton(
    "Имя файла в заголовке",
    "info",
    includeFileName,
    false,
  );

  const landscapeButton = createIconButton(
    "Альбомная ориентация",
    "file",
    landscape,
    true,
  );

  fileButton.disabled = !fileNameCheckbox;
  landscapeButton.disabled = !landscapeCheckbox;

  fileButton.addEventListener("click", () => {
    if (!fileNameCheckbox) {
      return;
    }

    // Keep the visual state tied to the app.json-derived state, not to
    // checkbox.checked, which may be stale when the modal is first opened.
    fileNameCheckbox.click();
    includeFileName = !includeFileName;
    settings.includeFileName = includeFileName;
    updateButtonState(fileButton, includeFileName, false);
    onChange({ includeFileName });
  });

  landscapeButton.addEventListener("click", () => {
    if (!landscapeCheckbox) {
      return;
    }

    landscapeCheckbox.click();
    landscape = !landscape;
    settings.landscape = landscape;
    updateButtonState(landscapeButton, landscape, true);
    onChange({ landscape });
  });

  wrapper.appendChild(fileButton);
  wrapper.appendChild(landscapeButton);
  container.appendChild(wrapper);

  ensureNativeIconStyles();
}

function findNativeCheckbox(
  settingItems: HTMLElement[],
  pattern: RegExp,
): HTMLInputElement | null {
  for (const item of settingItems) {
    const checkbox = item.querySelector(
      'input[type="checkbox"]',
    ) as HTMLInputElement | null;

    if (!checkbox) {
      continue;
    }

    const label = [
      item.querySelector(".setting-item-name")?.textContent,
      item.querySelector(".setting-item-description")?.textContent,
      item.getAttribute("aria-label"),
      checkbox.getAttribute("aria-label"),
      checkbox.getAttribute("title"),
      item.textContent,
    ]
      .filter(Boolean)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    if (pattern.test(label)) {
      return checkbox;
    }
  }

  return null;
}

function createIconButton(
  label: string,
  iconName: string,
  active: boolean,
  rotates: boolean,
): HTMLButtonElement {
  const button = document.createElement("button");

  button.type = "button";
  button.className = "pdf-export-native-icon-button";
  button.setAttribute("aria-label", label);
  button.setAttribute("title", label);
  button.setAttribute("aria-pressed", String(active));

  if (active) {
    button.classList.add("is-active");
  }

  if (rotates && active) {
    button.classList.add("is-landscape");
  }

  setIcon(button, iconName);
  return button;
}

function updateButtonState(
  button: HTMLButtonElement,
  active: boolean,
  rotates: boolean,
) {
  button.classList.toggle("is-active", active);
  button.setAttribute("aria-pressed", String(active));

  if (rotates) {
    button.classList.toggle("is-landscape", active);
  }
}

function ensureNativeIconStyles() {
  if (document.getElementById("pdf-export-native-icon-styles")) {
    return;
  }

  const style = document.createElement("style");
  style.id = "pdf-export-native-icon-styles";
  style.textContent = `
.pdf-export-native-icon-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  width: 100%;
  padding: 14px 0 4px;
}
.pdf-export-native-icon-button {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  padding: 0;
  margin: 0;
  border: 1px solid var(--background-modifier-border);
  border-radius: 10px;
  background: var(--background-secondary);
  color: var(--text-muted);
  cursor: pointer;
  box-shadow: var(--shadow-s, none);
  transition:
    color 160ms ease,
    background-color 160ms ease,
    border-color 160ms ease,
    transform 160ms ease;
}
.pdf-export-native-icon-button:hover {
  background: var(--background-modifier-hover);
  color: var(--text-normal);
}
.pdf-export-native-icon-button:active {
  transform: scale(0.94);
}
.pdf-export-native-icon-button.is-active {
  color: var(--text-accent);
  border-color: var(--interactive-accent);
  background: color-mix(
    in srgb,
    var(--interactive-accent) 12%,
    var(--background-secondary)
  );
}
.pdf-export-native-icon-button.is-active:hover {
  color: var(--text-accent);
  background: color-mix(
    in srgb,
    var(--interactive-accent) 18%,
    var(--background-secondary)
  );
}
.pdf-export-native-icon-button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.pdf-export-native-icon-button svg {
  width: 22px;
  height: 22px;
  display: block;
  stroke-width: 1.8px;
  transition: transform 280ms cubic-bezier(.2,.8,.2,1);
}
.pdf-export-native-icon-button.is-landscape svg {
  transform: rotate(-90deg);
}
`;

  document.head.appendChild(style);
}
