import { MarkdownView } from "obsidian";
export interface PdfSource {
  markdown: string;
  sourcePath: string;
}
export function getMarkdownSource(view: MarkdownView): PdfSource | null {
  const markdown = view.getViewData();
  if (!markdown || !markdown.trim()) {
    return null;
  }
  return {
    markdown,
    sourcePath: view.file?.path ?? "",
  };
}
