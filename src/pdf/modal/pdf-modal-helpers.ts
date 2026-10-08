import type { PdfPreview } from "../pdf-preview";
export function forceA4(modal: Element) {
  const settings = Array.from(modal.querySelectorAll(".setting-item"));
  const pageSetting = settings.find((setting) => {
    const select = setting.querySelector("select") as HTMLSelectElement | null;
    if (!select) {
      return false;
    }
    return Array.from(select.options).some(
      (option) => option.textContent?.trim().toLowerCase() === "a4",
    );
  });
  if (!pageSetting) {
    return;
  }
  const select = pageSetting.querySelector(
    "select",
  ) as HTMLSelectElement | null;
  if (select) {
    const a4 = Array.from(select.options).find(
      (option) => option.textContent?.trim().toLowerCase() === "a4",
    );
    if (a4) {
      select.value = a4.value;
      select.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }
  (pageSetting as HTMLElement).style.display = "none";
}
export function hideScaleSetting(modal: Element) {
  const settings = Array.from(modal.querySelectorAll(".setting-item"));
  const scaleSetting = settings.find((setting) =>
    setting.querySelector('input[type="range"]'),
  );
  if (!scaleSetting) {
    return;
  }
  (scaleSetting as HTMLElement).style.display = "none";
}
export function hideMarginSetting(modal: Element) {
  const settings = Array.from(modal.querySelectorAll(".setting-item"));
  const marginSetting = settings.find((setting) => {
    const select = setting.querySelector("select") as HTMLSelectElement | null;
    if (!select) {
      return false;
    }
    return !Array.from(select.options).some(
      (option) => option.textContent?.trim().toLowerCase() === "a4",
    );
  });
  if (!marginSetting) {
    return;
  }
  (marginSetting as HTMLElement).style.display = "none";
}
export function setPreviewHeight(preview: PdfPreview | null) {
  preview?.setHeight(540);
}
export function hideNativeCheckboxSettings(modal: Element) {
  const settings = Array.from(modal.querySelectorAll(".setting-item"));

  for (const setting of settings) {
    const checkbox = setting.querySelector('input[type="checkbox"]');

    if (!checkbox) {
      continue;
    }

    (setting as HTMLElement).style.display = "none";
  }
}
