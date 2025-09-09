import { Weather } from './weather';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';

const meta: Meta<typeof Weather> = {
  component: Weather,
  title: 'UI/Weather',
};
export default meta;

export const Default: StoryObj<typeof Weather> = {
  args: {},
};

export const WithCustomData: StoryObj<typeof Weather> = {
  args: {
    weatherAtLocation: {
      latitude: -23.5505,
      longitude: -46.6333,
      generationtime_ms: 0.0278949737548828,
      utc_offset_seconds: 0,
      timezone: 'America/Sao_Paulo',
      timezone_abbreviation: 'BRT',
      elevation: 760,
      current_units: {
        time: 'iso8601',
        interval: 'seconds',
        temperature_2m: '°C',
      },
      current: {
        time: '2024-01-15T12:00:00Z',
        interval: 900,
        temperature_2m: 28,
      },
      hourly_units: {
        time: 'iso8601',
        temperature_2m: '°C',
      },
      hourly: {
        time: Array.from({ length: 24 }, (_, i) => `2024-01-15T${i.toString().padStart(2, '0')}:00:00Z`),
        temperature_2m: Array.from({ length: 24 }, () => Math.floor(Math.random() * 10) + 20),
      },
      daily_units: {
        time: 'iso8601',
        sunrise: 'iso8601',
        sunset: 'iso8601',
      },
      daily: {
        time: ['2024-01-15T00:00:00Z'],
        sunrise: ['2024-01-15T06:00:00Z'],
        sunset: ['2024-01-15T18:00:00Z'],
      },
    },
  },
};