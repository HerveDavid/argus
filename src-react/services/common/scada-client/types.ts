export interface ScadaOutput {
  id: string;
  dynawo_id: string;
  tase2: string;
  source: string;
  destination: string;
  topic: string;
  graphical_id: string;
  publish_on_change: boolean | null;
}
