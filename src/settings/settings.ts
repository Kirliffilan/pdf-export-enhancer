export type PdfPageNumberPosition = "left" | "center" | "right";

export interface PdfExportSettings {
  fontSize: number;
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
  lineHeight: number;
  showPageNumbers: boolean;
  pageNumberPosition: PdfPageNumberPosition;
  skipFirstPageNumber: boolean;
  pageBreakH1: boolean;
  pageBreakH2: boolean;
  monochrome: boolean;
  includeFileName: boolean;
  landscape: boolean;
}

export const DEFAULT_SETTINGS: PdfExportSettings = {
  fontSize: 16.5,
  marginTop: 15,
  marginBottom: 15,
  marginLeft: 15,
  marginRight: 15,
  lineHeight: 1.15,
  showPageNumbers: false,
  pageNumberPosition: "center",
  skipFirstPageNumber: true,
  pageBreakH1: false,
  pageBreakH2: false,
  monochrome: false,
  includeFileName: false,
  landscape: false,
};
