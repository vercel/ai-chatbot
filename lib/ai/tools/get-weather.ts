import { tool } from "ai";
import { z } from "zod";

async function geocodeCity(city: string): Promise<{ latitude: number; longitude: number } | null> {
  try {
    const response = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    
    if (!data.results || data.results.length === 0) {
      return null;
    }
    
    const result = data.results[0];
    return {
      latitude: result.latitude,
      longitude: result.longitude,
    };
  } catch {
    return null;
  }
}

export const getWeather = tool({
  description: "Get the current weather at a location. You can provide either coordinates or a city name.",
  inputSchema: z.union([
    z.object({
      latitude: z.number(),
      longitude: z.number(),
    }),
    z.object({
      city: z.string().describe("City name (e.g., 'San Francisco', 'New York', 'London')"),
    }),
  ]),
  execute: async (input) => {
    let latitude: number;
    let longitude: number;

    if ("city" in input) {
      const coords = await geocodeCity(input.city);
      if (!coords) {
        return {
          error: `Could not find coordinates for "${input.city}". Please check the city name.`,
        };
      }
      latitude = coords.latitude;
      longitude = coords.longitude;
    } else {
      latitude = input.latitude;
      longitude = input.longitude;
    }

    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m&hourly=temperature_2m&daily=sunrise,sunset&timezone=auto`
    );

    const weatherData = await response.json();
    
    if ("city" in input) {
      weatherData.cityName = input.city;
    }
    
    return weatherData;
  },
});
