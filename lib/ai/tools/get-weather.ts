import type { Geo } from '@vercel/functions';
import { tool } from 'ai';
import { z } from 'zod';

export const getWeather = (geoLocation: Geo) =>
  tool({
    description: 'Get the current weather at a location',
    parameters: z.object({}),
    execute: async () => {
      const { latitude, longitude } = geoLocation;

      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m&hourly=temperature_2m&daily=sunrise,sunset&timezone=auto`,
      );

      const weatherData = await response.json();
      return weatherData;
    },
  });
