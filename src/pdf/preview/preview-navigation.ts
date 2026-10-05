export function renderNavigation(
  container: HTMLElement,
  currentPage: number,
  pageCount: number,
  onPrevious: () => void,
  onNext: () => void,
  onSetPage: (value: string) => void,
) {
  container.empty();
  const previous = document.createElement("button");
  previous.type = "button";
  previous.className = "pdf-preview-arrow";
  previous.textContent = "←";
  previous.title = "Предыдущая страница";
  previous.disabled = currentPage <= 0;
  previous.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    onPrevious();
  });
  const input = document.createElement("input");
  input.type = "number";
  input.className = "pdf-preview-page-input";
  input.min = "1";
  input.max = String(pageCount);
  input.value = String(currentPage + 1);
  input.setAttribute("aria-label", "Номер страницы");
  input.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") {
      return;
    }
    event.preventDefault();
    onSetPage(input.value);
    input.blur();
  });
  input.addEventListener("change", () => {
    onSetPage(input.value);
  });
  const total = document.createElement("span");
  total.className = "pdf-preview-page-total";
  total.textContent = `/ ${pageCount}`;
  const next = document.createElement("button");
  next.type = "button";
  next.className = "pdf-preview-arrow";
  next.textContent = "→";
  next.title = "Следующая страница";
  next.disabled = currentPage >= pageCount - 1;
  next.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    onNext();
  });
  container.appendChild(previous);
  container.appendChild(input);
  container.appendChild(total);
  container.appendChild(next);
}
export function updateNavigation(
  container: HTMLElement,
  currentPage: number,
  pageCount: number,
) {
  const input = container.querySelector(
    ".pdf-preview-page-input",
  ) as HTMLInputElement | null;
  if (input) {
    input.value = String(currentPage + 1);
    input.max = String(pageCount);
  }
  const buttons = container.querySelectorAll(".pdf-preview-arrow");
  const previous = buttons[0] as HTMLButtonElement | undefined;
  const next = buttons[1] as HTMLButtonElement | undefined;
  if (previous) {
    previous.disabled = currentPage <= 0;
  }
  if (next) {
    next.disabled = currentPage >= pageCount - 1;
  }
}
