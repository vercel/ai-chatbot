"""
Weather tool - Get current weather for a location.
Ported from lib/ai/tools/get-weather.ts
"""

from typing import Any, Dict, Optional

import httpx


async def geocode_city(city: str) -> Optional[Dict[str, float]]:
    """Geocode a city name to get coordinates."""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://geocoding-api.open-meteo.com/v1/search",
                params={
                    "name": city,
                    "count": 1,
                    "language": "en",
                    "format": "json",
                },
                timeout=10.0,
            )

            if response.status_code != 200:
                return None

            data = response.json()

            if not data.get("results") or len(data["results"]) == 0:
                return None

            result = data["results"][0]
            return {
                "latitude": result["latitude"],
                "longitude": result["longitude"],
            }
    except Exception:
        return None


async def get_weather(
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    city: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Get the current weather at a location.
    You can provide either coordinates or a city name.

    Args:
        latitude: Latitude coordinate (optional)
        longitude: Longitude coordinate (optional)
        city: City name (e.g., 'San Francisco', 'New York', 'London') (optional)

    Returns:
        Weather data dictionary or error dictionary
    """
    # Determine coordinates
    if city:
        coords = await geocode_city(city)
        if not coords:
            return {
                "error": f'Could not find coordinates for "{city}". Please check the city name.',
            }
        latitude = coords["latitude"]
        longitude = coords["longitude"]
    elif latitude is not None and longitude is not None:
        # Use provided coordinates
        pass
    else:
        return {
            "error": "Please provide either a city name or both latitude and longitude coordinates.",
        }

    # Fetch weather data
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://api.open-meteo.com/v1/forecast",
                params={
                    "latitude": latitude,
                    "longitude": longitude,
                    "current": "temperature_2m",
                    "hourly": "temperature_2m",
                    "daily": "sunrise,sunset",
                    "timezone": "auto",
                },
                timeout=10.0,
            )

            weather_data = response.json()

            # Add city name if provided
            if city:
                weather_data["cityName"] = city

            return weather_data
    except Exception as e:
        return {"error": f"Failed to fetch weather data: {str(e)}"}


# Tool definition for OpenAI format
GET_WEATHER_TOOL_DEFINITION = {
    "type": "function",
    "function": {
        "name": "getWeather",
        "description": "Get the current weather at a location. You can provide either coordinates or a city name.",
        "parameters": {
            "type": "object",
            "properties": {
                "latitude": {
                    "type": "number",
                    "description": "Latitude coordinate",
                },
                "longitude": {
                    "type": "number",
                    "description": "Longitude coordinate",
                },
                "city": {
                    "type": "string",
                    "description": "City name (e.g., 'San Francisco', 'New York', 'London')",
                },
            },
            "required": [],
            "additionalProperties": False,
        },
    },
    "strict": True,
}
