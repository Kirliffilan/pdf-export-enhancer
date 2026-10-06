export type NativePdfMargin = "default" | "minimal" | "none";

export interface NativePdfSettings {
  includeFileName: boolean;
  landscape: boolean;
  margin: NativePdfMargin;
}
