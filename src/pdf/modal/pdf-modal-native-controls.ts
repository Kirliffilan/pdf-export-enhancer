import { setIcon } from "obsidian";
import type { NativePdfSettings } from "../pdf-settings";

export function createNativeSettingsControls(
  container: HTMLElement,
  modal: Element,
  settings: NativePdfSettings,
  onChange: (
    changes: Partial<Pick<NativePdfSettings, "includeFileName" | "landscape">>,
  ) => void,
) {
  const checkboxes = Array.from(
    modal.querySelectorAll('.setting-item input[type="checkbox"]'),
  ) as HTMLInputElement[];

  const fileNameCheckbox = checkboxes[0] ?? null;
  const landscapeCheckbox = checkboxes[1] ?? null;

  const wrapper = document.createElement("div");
  wrapper.className = "pdf-export-native-icon-controls";

  const fileButton = createIconButton(
    "Имя файла в заголовке",
    "info",
    fileNameCheckbox?.checked ?? settings.includeFileName,
    false,
    () => {
      if (!fileNameCheckbox) {
        return;
      }

      fileNameCheckbox.click();

      const value = fileNameCheckbox.checked;

      settings.includeFileName = value;

      updateButtonState(fileButton, value, false);

      onChange({
        includeFileName: value,
      });
    },
  );

  const landscapeButton = createIconButton(
    "Альбомная ориентация",
    "file",
    landscapeCheckbox?.checked ?? settings.landscape,
    true,
    () => {
      if (!landscapeCheckbox) {
        return;
      }

      landscapeCheckbox.click();

      const value = landscapeCheckbox.checked;

      settings.landscape = value;

      updateButtonState(landscapeButton, value, true);

      onChange({
        landscape: value,
      });
    },
  );

  wrapper.appendChild(fileButton);
  wrapper.appendChild(landscapeButton);

  container.appendChild(wrapper);

  ensureNativeIconStyles();
}

function createIconButton(
  label: string,
  iconName: string,
  active: boolean,
  rotates: boolean,
  onClick: () => void,
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

  button.addEventListener("click", onClick);

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

.pdf-export-native-icon-button svg {
  width: 22px;
  height: 22px;
  display: block;
  stroke-width: 1.8px;
  transition:
    transform 280ms cubic-bezier(.2,.8,.2,1);
}

.pdf-export-native-icon-button.is-landscape svg {
  transform: rotate(-90deg);
}
`;

  document.head.appendChild(style);
}
