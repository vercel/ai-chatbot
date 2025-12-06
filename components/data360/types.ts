// Shared types for Data360 widgets

export type IndicatorDataPoint = {
  country: string;
  date: string;
  value: number;
  claim_id: string;
};

export type Indicator = {
  indicator_id: string;
  indicator_name: string;
  data: IndicatorDataPoint[];
};

export type Data360Output = {
  data: Indicator[];
  note?: Record<string, string>;
};

