export const A4_WIDTH = 794;
export const A4_HEIGHT = 1123;

export interface PaginationResult {
  height: number;
  pageCount: number;
}

export function calculatePages(element: HTMLElement): PaginationResult {
  const height = Math.max(
    element.scrollHeight,
    element.offsetHeight,
    element.getBoundingClientRect().height,
  );
  const pageCount = Math.max(1, Math.ceil(height / A4_HEIGHT));

  return {
    height,
    pageCount,
  };
}
