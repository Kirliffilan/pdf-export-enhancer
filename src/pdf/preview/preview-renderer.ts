import { App, Component, MarkdownRenderer } from "obsidian";
export async function renderMarkdown(
  app: App,
  markdown: string,
  sourcePath: string,
): Promise<string> {
  const component = new Component();
  component.load();
  const root = document.createElement("div");
  const content = document.createElement("div");
  root.style.position = "fixed";
  root.style.left = "-100000px";
  root.style.top = "0";
  root.style.width = "794px";
  root.style.visibility = "hidden";
  root.style.pointerEvents = "none";
  root.appendChild(content);
  document.body.appendChild(root);
  try {
    await MarkdownRenderer.render(
      app,
      markdown,
      content,
      sourcePath,
      component,
    );
    await waitForLayout();
    return content.innerHTML.trim();
  } catch (error) {
    console.error("PDF Export Preview: Markdown render error", error);
    return "";
  } finally {
    root.remove();
    component.unload();
  }
}
async function waitForLayout() {
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        resolve();
      });
    });
  });
}
