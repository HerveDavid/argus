export interface TelemetryCurves {
  curves: TelemetryData;
}

export interface TelemetryData {
  values: Record<string, number>;
  time: number;
}
  