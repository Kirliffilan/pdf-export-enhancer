# PDF Export Enhancer

Enhance Obsidian's PDF export with a custom text size setting and an A4 page preview before exporting it to PDF.

## Preview

![PDF Export Enhancer preview](./screenshots/pdf-preview.png)

The preview shows how the note will be laid out on A4 pages before exporting it to PDF.

The preview preserves your existing Obsidian styles, including theme settings, Style Settings, and CSS snippets. No additional styling is imposed by the plugin.

The preview also reflects the selected Obsidian PDF export settings, including:

- File name as title
- Landscape orientation
- Page margins

## Features

- Custom text size for PDF export
- A4 PDF preview
- Page-by-page navigation
- Support for Obsidian themes
- Support for Style Settings
- Support for CSS snippets
- Support for native Obsidian PDF export settings
- Preview updates when PDF settings change

## Usage

Open Obsidian's standard **Export to PDF** dialog.

PDF Export Enhancer adds a **text size setting** and an **A4 PDF preview** to the existing export dialog.

The preview updates automatically when the PDF export settings are changed.

### PDF export settings

The plugin uses the existing Obsidian PDF export settings:

- **Include file name as title** — displays the note file name in the preview when enabled.
- **Landscape** — changes the preview orientation to landscape when enabled.
- **Margin** — applies the selected page margin to the preview.
- **Page size** — the preview uses A4 page size.
- **Text size** — controls the text size used for the PDF export.

## Settings

The text size can be configured directly in the PDF export dialog.

Native Obsidian PDF settings remain available in the standard export dialog and are reflected in the preview.

## Compatibility

The plugin is designed for the desktop version of Obsidian.

## Requirements

- Obsidian 1.8.0 or later
- Desktop version of Obsidian

## License

This project is provided as-is for use with Obsidian.
