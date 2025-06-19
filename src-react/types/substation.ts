export interface Substation {
  country: string;
  geo_tags: string;
  id: string;
  name: string;
  tso: string;
}

export interface Substations {
  substations: Substation[];
}
