# Data360 Chart Components

This directory contains reusable chart components for Data360 visualizations.

## Components

### `TimeSeriesChart`

A line chart component for displaying time series data with multiple series (e.g., multiple countries).

#### Props

- `data: TimeSeriesDataPoint[]` - Array of data points with country, date, and value
- `minValue: number` - Minimum value for Y-axis
- `maxValue: number` - Maximum value for Y-axis
- `title?: string` - Optional chart title
- `height?: number` - Chart height in pixels (default: 180)
- `showLegend?: boolean` - Show legend when multiple series (default: true)
- `showStats?: boolean` - Show min/max stats below chart (default: true)
- `dateFormatter?: (date: string) => string` - Custom date formatter for X-axis (default: shows last 2 digits)

#### Example Usage

```tsx
import { TimeSeriesChart } from "./charts";

<TimeSeriesChart
  data={[
    { country: "USA", date: "2020", value: 10.5 },
    { country: "USA", date: "2021", value: 11.2 },
    { country: "UK", date: "2020", value: 8.3 },
    { country: "UK", date: "2021", value: 8.9 },
  ]}
  minValue={0}
  maxValue={15}
  title="GDP Growth Over Time"
  height={200}
  showLegend
  showStats
  dateFormatter={(date) => date.slice(-2)}
/>
```

## Adding New Chart Types

When adding new chart components:

1. Create a new file in this directory (e.g., `bar-chart.tsx`)
2. Export the component and its types from `index.ts`
3. Follow the same pattern as `TimeSeriesChart` for consistency
4. Use Recharts for charting library
5. Support theming via CSS variables (e.g., `hsl(var(--primary))`)
