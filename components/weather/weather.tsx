import React from 'react'

interface WeatherResponse {
    coord: {
        lon: number;
        lat: number;
    };
    weather: {
        id: number;
        main: string;
        description: string;
        icon: string;
    }[];
    base: string;
    main: {
        temp: number;
        pressure: number;
        humidity: number;
        temp_min: number;
        temp_max: number;
    };
    visibility: number;
    wind: {
        speed: number;
        deg: number;
    };
    clouds: {
        all: number;
    };
    dt: number;
    sys: {
        type: number;
        id: number;
        message: number;
        country: string;
        sunrise: number;
        sunset: number;
    };
    id: number;
    name: string;
    cod: number;
}

interface PageProps {
    city: string;
}

export default async function WeatherCard({ city }: PageProps) {

    const response1 = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${process.env.OPEN_WEATHER_MAP_API_KEY}`
    );

    const locationData: WeatherResponse = await response1.json();

    return (
        <div className="border border-neutral-200 p-4 rounded-lg max-w-fit">
            <h2 className="text-2xl font-bold mb-4">{locationData.name}</h2>
            <div className="flex items-center mb-4">
            <img
                src={`https://openweathermap.org/img/wn/${locationData.weather[0].icon}.png`}
                alt={locationData.weather[0].description}
                className="w-10 h-10 mr-2"
            />
            <span className="text-lg">{locationData.weather[0].main}</span>
            </div>
            <div>
            <span className="font-bold">Temperature:</span> {locationData.main.temp}°C
            </div>
            <div>
            <span className="font-bold">Humidity:</span> {locationData.main.humidity}%
            </div>
            <div>
            <span className="font-bold">Wind Speed:</span> {locationData.wind.speed} m/s
            </div>
        </div>
    )
}

