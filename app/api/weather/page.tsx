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

export default async function Page({ city }: PageProps) {

    const response1 = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${process.env.OPEN_WEATHER_MAP_API_KEY}`
    );

    const locationData: WeatherResponse = await response1.json();

    return (
        <div>{JSON.stringify(locationData)}</div>
    )
}
