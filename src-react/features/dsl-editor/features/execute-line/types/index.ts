export interface ExecuteCallback {
  (lineNumber: number, lineContent: string): void;
}
