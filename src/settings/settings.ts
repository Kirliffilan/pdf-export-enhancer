export interface PdfExportSettings {
  fontSize: number;
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
}

export const DEFAULT_SETTINGS: PdfExportSettings = {
  fontSize: 16.5,

  marginTop: 15,
  marginBottom: 15,
  marginLeft: 15,
  marginRight: 15,
};
