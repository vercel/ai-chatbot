'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Cloud, CloudRain, Sun, CloudSun, Wind, Droplets } from 'lucide-react';

interface WeatherData {
  location: string;
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  pressure?: number;
  visibility?: number;
  feelsLike?: number;
  source?: 'mcp' | 'simulated' | 'api-real' | 'fallback';
  forecast?: Array<{ 
    hour: string; 
    temp: number;
    chuva_chance?: number;
    precipitacao?: number;
    descricao?: string;
  }>;
  previsao?: Array<{
    hora: string;
    temp: number;
    chuva_chance: number;
    precipitacao: number;
    descricao: string;
    umidade: number;
  }>;
}

interface WeatherCardProps {
  data: WeatherData;
}

export function WeatherCard({ data }: WeatherCardProps) {
  const getWeatherIcon = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'ensolarado':
        return <Sun className="h-8 w-8 text-yellow-500" />;
      case 'nublado':
        return <Cloud className="h-8 w-8 text-gray-500" />;
      case 'chuvoso':
        return <CloudRain className="h-8 w-8 text-blue-500" />;
      case 'parcialmente nublado':
        return <CloudSun className="h-8 w-8 text-yellow-600" />;
      default:
        return <Sun className="h-8 w-8 text-yellow-500" />;
    }
  };

  return (
    <Card className="p-6 w-full max-w-2xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-2xl font-bold">{data.location}</h3>
          <p className="text-4xl font-bold mt-2">{Math.round(data.temperature)}°C</p>
          {data.feelsLike && (
            <p className="text-sm text-muted-foreground">Sensação térmica: {Math.round(data.feelsLike)}°C</p>
          )}
          <p className="text-lg text-muted-foreground capitalize mt-1">{data.condition}</p>
        </div>
        <div className="flex flex-col items-center">
          {getWeatherIcon(data.condition)}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="flex items-center gap-2">
          <Droplets className="h-4 w-4 text-blue-500" />
          <span className="text-sm">Umidade: {data.humidity}%</span>
        </div>
        <div className="flex items-center gap-2">
          <Wind className="h-4 w-4 text-gray-500" />
          <span className="text-sm">Vento: {data.windSpeed.toFixed(1)} m/s</span>
        </div>
        {data.pressure && (
          <div className="flex items-center gap-2">
            <span className="text-sm">Pressão: {data.pressure} hPa</span>
          </div>
        )}
        {data.visibility && (
          <div className="flex items-center gap-2">
            <span className="text-sm">Visibilidade: {data.visibility} km</span>
          </div>
        )}
      </div>

      {(data.previsao && data.previsao.length > 0) ? (
        <div className="mt-6 pt-4 border-t">
          <h4 className="text-sm font-semibold mb-3">Previsão Detalhada</h4>
          <div className="space-y-2">
            {data.previsao.map((item, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <span className="font-medium">{item.hora}</span>
                <div className="flex items-center gap-3">
                  <span>{item.temp}°C</span>
                  {item.chuva_chance > 0 && (
                    <span className={`text-xs ${item.chuva_chance > 50 ? 'text-red-600 font-semibold' : 'text-yellow-600'}`}>
                      💧 {item.chuva_chance}%
                    </span>
                  )}
                  {item.precipitacao > 0 && (
                    <span className="text-xs text-blue-600">
                      {item.precipitacao}mm
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : data.forecast && (
        <div className="mt-6 pt-4 border-t">
          <h4 className="text-sm font-semibold mb-3">Previsão Horária</h4>
          <div className="flex justify-between">
            {data.forecast.map((item, index) => (
              <div key={index} className="text-center">
                <p className="text-xs text-muted-foreground">{item.hour}</p>
                <p className="text-sm font-semibold mt-1">{item.temp}°</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}