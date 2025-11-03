"use client";

import cx from "classnames";
import { format, isWithinInterval } from "date-fns";
import { useEffect, useState } from "react";
import type {
  WeatherToolOutput,
  WeatherToolSuccess,
} from "@/lib/ai/tools/get-weather";

const parseDate = (value: string | undefined): Date | null => {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const SunIcon = ({ size = 40 }: { size?: number }) => (
  <svg fill="none" height={size} viewBox="0 0 24 24" width={size}>
    <title>Sun icon</title>
    <circle cx="12" cy="12" fill="currentColor" r="5" />
    <line stroke="currentColor" strokeWidth="2" x1="12" x2="12" y1="1" y2="3" />
    <line
      stroke="currentColor"
      strokeWidth="2"
      x1="12"
      x2="12"
      y1="21"
      y2="23"
    />
    <line
      stroke="currentColor"
      strokeWidth="2"
      x1="4.22"
      x2="5.64"
      y1="4.22"
      y2="5.64"
    />
    <line
      stroke="currentColor"
      strokeWidth="2"
      x1="18.36"
      x2="19.78"
      y1="18.36"
      y2="19.78"
    />
    <line stroke="currentColor" strokeWidth="2" x1="1" x2="3" y1="12" y2="12" />
    <line
      stroke="currentColor"
      strokeWidth="2"
      x1="21"
      x2="23"
      y1="12"
      y2="12"
    />
    <line
      stroke="currentColor"
      strokeWidth="2"
      x1="4.22"
      x2="5.64"
      y1="19.78"
      y2="18.36"
    />
    <line
      stroke="currentColor"
      strokeWidth="2"
      x1="18.36"
      x2="19.78"
      y1="5.64"
      y2="4.22"
    />
  </svg>
);

const MoonIcon = ({ size = 40 }: { size?: number }) => (
  <svg fill="none" height={size} viewBox="0 0 24 24" width={size}>
    <title>Moon icon</title>
    <path
      d="M21 12.79A9 9 0 1 1 11.21 3A7 7 0 0 0 21 12.79z"
      fill="currentColor"
    />
  </svg>
);

const CloudIcon = ({ size = 24 }: { size?: number }) => (
  <svg fill="none" height={size} viewBox="0 0 24 24" width={size}>
    <title>Cloud icon</title>
    <path
      d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    />
  </svg>
);

const SAMPLE: WeatherToolSuccess = {
  latitude: 37.763_283,
  longitude: -122.412_86,
  generationtime_ms: 0.027_894_973_754_882_812,
  utc_offset_seconds: 0,
  timezone: "GMT",
  timezone_abbreviation: "GMT",
  elevation: 18,
  current_units: { time: "iso8601", interval: "seconds", temperature_2m: "°C" },
  current: { time: "2024-10-07T19:30", interval: 900, temperature_2m: 29.3 },
  hourly_units: { time: "iso8601", temperature_2m: "°C" },
  hourly: {
    time: [
      "2024-10-07T00:00",
      "2024-10-07T01:00",
      "2024-10-07T02:00",
      "2024-10-07T03:00",
      "2024-10-07T04:00",
      "2024-10-07T05:00",
      "2024-10-07T06:00",
      "2024-10-07T07:00",
      "2024-10-07T08:00",
      "2024-10-07T09:00",
      "2024-10-07T10:00",
      "2024-10-07T11:00",
      "2024-10-07T12:00",
      "2024-10-07T13:00",
      "2024-10-07T14:00",
      "2024-10-07T15:00",
      "2024-10-07T16:00",
      "2024-10-07T17:00",
      "2024-10-07T18:00",
      "2024-10-07T19:00",
      "2024-10-07T20:00",
      "2024-10-07T21:00",
      "2024-10-07T22:00",
      "2024-10-07T23:00",
      "2024-10-08T00:00",
      "2024-10-08T01:00",
      "2024-10-08T02:00",
      "2024-10-08T03:00",
      "2024-10-08T04:00",
      "2024-10-08T05:00",
      "2024-10-08T06:00",
      "2024-10-08T07:00",
      "2024-10-08T08:00",
      "2024-10-08T09:00",
      "2024-10-08T10:00",
      "2024-10-08T11:00",
      "2024-10-08T12:00",
      "2024-10-08T13:00",
      "2024-10-08T14:00",
      "2024-10-08T15:00",
      "2024-10-08T16:00",
      "2024-10-08T17:00",
      "2024-10-08T18:00",
      "2024-10-08T19:00",
      "2024-10-08T20:00",
      "2024-10-08T21:00",
      "2024-10-08T22:00",
      "2024-10-08T23:00",
      "2024-10-09T00:00",
      "2024-10-09T01:00",
      "2024-10-09T02:00",
      "2024-10-09T03:00",
      "2024-10-09T04:00",
      "2024-10-09T05:00",
      "2024-10-09T06:00",
      "2024-10-09T07:00",
      "2024-10-09T08:00",
      "2024-10-09T09:00",
      "2024-10-09T10:00",
      "2024-10-09T11:00",
      "2024-10-09T12:00",
      "2024-10-09T13:00",
      "2024-10-09T14:00",
      "2024-10-09T15:00",
      "2024-10-09T16:00",
      "2024-10-09T17:00",
      "2024-10-09T18:00",
      "2024-10-09T19:00",
      "2024-10-09T20:00",
      "2024-10-09T21:00",
      "2024-10-09T22:00",
      "2024-10-09T23:00",
      "2024-10-10T00:00",
      "2024-10-10T01:00",
      "2024-10-10T02:00",
      "2024-10-10T03:00",
      "2024-10-10T04:00",
      "2024-10-10T05:00",
      "2024-10-10T06:00",
      "2024-10-10T07:00",
      "2024-10-10T08:00",
      "2024-10-10T09:00",
      "2024-10-10T10:00",
      "2024-10-10T11:00",
      "2024-10-10T12:00",
      "2024-10-10T13:00",
      "2024-10-10T14:00",
      "2024-10-10T15:00",
      "2024-10-10T16:00",
      "2024-10-10T17:00",
      "2024-10-10T18:00",
      "2024-10-10T19:00",
      "2024-10-10T20:00",
      "2024-10-10T21:00",
      "2024-10-10T22:00",
      "2024-10-10T23:00",
      "2024-10-11T00:00",
      "2024-10-11T01:00",
      "2024-10-11T02:00",
      "2024-10-11T03:00",
    ],
    temperature_2m: [
      36.6, 32.8, 29.5, 28.6, 29.2, 28.2, 27.5, 26.6, 26.5, 26, 25, 23.5, 23.9,
      24.2, 22.9, 21, 24, 28.1, 31.4, 33.9, 32.1, 28.9, 26.9, 25.2, 23, 21.1,
      19.6, 18.6, 17.7, 16.8, 16.2, 15.5, 14.9, 14.4, 14.2, 13.7, 13.3, 12.9,
      12.5, 13.5, 15.8, 17.7, 19.6, 21, 21.9, 22.3, 22, 20.7, 18.9, 17.9, 17.3,
      17, 16.7, 16.2, 15.6, 15.2, 15, 15, 15.1, 14.8, 14.8, 14.9, 14.7, 14.8,
      15.3, 16.2, 17.9, 19.6, 20.5, 21.6, 21, 20.7, 19.3, 18.7, 18.4, 17.9,
      17.3, 17, 17, 16.8, 16.4, 16.2, 16, 15.8, 15.7, 15.4, 15.4, 16.1, 16.7,
      17, 18.6, 19, 19.5, 19.4, 18.5, 17.9, 17.5, 16.7, 16.3, 16.1,
    ],
  },
  daily_units: {
    time: "iso8601",
    sunrise: "iso8601",
    sunset: "iso8601",
  },
  daily: {
    time: [
      "2024-10-07",
      "2024-10-08",
      "2024-10-09",
      "2024-10-10",
      "2024-10-11",
    ],
    sunrise: [
      "2024-10-07T07:15",
      "2024-10-08T07:16",
      "2024-10-09T07:17",
      "2024-10-10T07:18",
      "2024-10-11T07:19",
    ],
    sunset: [
      "2024-10-07T19:00",
      "2024-10-08T18:58",
      "2024-10-09T18:57",
      "2024-10-10T18:55",
      "2024-10-11T18:54",
    ],
  },
};

const ceilTemperature = (temperature: number): number => Math.ceil(temperature);

export function Weather({
  weatherAtLocation,
}: {
  weatherAtLocation?: WeatherToolOutput;
}) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (weatherAtLocation && "error" in weatherAtLocation) {
    const errorMessage =
      typeof weatherAtLocation.error === "string"
        ? weatherAtLocation.error
        : "Unable to retrieve weather data.";

    return (
      <div className="flex w-full flex-col gap-2 rounded-3xl border border-red-200 bg-red-50 p-6 text-red-800">
        <p className="font-semibold text-sm">Weather unavailable</p>
        <p className="text-red-700 text-xs">{errorMessage}</p>
      </div>
    );
  }

  const data: WeatherToolSuccess = weatherAtLocation ?? SAMPLE;

  const currentDate = parseDate(data.current.time);
  const sunrise = parseDate(data.daily.sunrise.at(0));
  const sunset = parseDate(data.daily.sunset.at(0));

  const hasValidDayWindow =
    currentDate !== null && sunrise !== null && sunset !== null;

  const isDay = hasValidDayWindow
    ? isWithinInterval(currentDate, { start: sunrise, end: sunset })
    : true;

  const hoursToShow = isMobile ? 5 : 6;

  const referenceDate = currentDate ?? parseDate(data.hourly.time.at(0));

  const currentTimeIndex = referenceDate
    ? data.hourly.time.findIndex((time) => {
        const hourlyDate = parseDate(time);
        return (
          hourlyDate !== null && hourlyDate.getTime() >= referenceDate.getTime()
        );
      })
    : 0;

  const startIndex = currentTimeIndex === -1 ? 0 : currentTimeIndex;

  const timeSlice = data.hourly.time.slice(
    startIndex,
    startIndex + hoursToShow
  );
  const temperatureSlice = data.hourly.temperature_2m.slice(
    startIndex,
    startIndex + hoursToShow
  );

  const displayEntriesBase = timeSlice
    .map((time, index) => {
      const temperature = temperatureSlice.at(index);

      if (typeof temperature !== "number") {
        return null;
      }

      return { time, temperature };
    })
    .filter(
      (entry): entry is { time: string; temperature: number } => entry !== null
    );

  const displayEntries =
    displayEntriesBase.length > 0
      ? displayEntriesBase
      : [
          {
            time: data.current.time,
            temperature: data.current.temperature_2m,
          },
        ];

  const currentDayTemperatures =
    data.hourly.temperature_2m.slice(0, 24).length > 0
      ? data.hourly.temperature_2m.slice(0, 24)
      : [data.current.temperature_2m];

  const currentHigh = Math.max(...currentDayTemperatures);
  const currentLow = Math.min(...currentDayTemperatures);

  const location =
    data.cityName ??
    `${data.latitude.toFixed(1)}°, ${data.longitude.toFixed(1)}°`;

  const sunriseLabel = sunrise ? format(sunrise, "h:mm a") : "—";
  const sunsetLabel = sunset ? format(sunset, "h:mm a") : "—";
  const currentTimestampLabel = currentDate
    ? format(currentDate, "MMM d, h:mm a")
    : "Time unavailable";
  const clientNow = new Date();

  return (
    <div
      className={cx(
        "relative flex w-full flex-col gap-6 overflow-hidden rounded-3xl p-6 shadow-lg backdrop-blur-sm",
        {
          "bg-gradient-to-br from-sky-400 via-blue-500 to-blue-600": isDay,
        },
        {
          "bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900":
            !isDay,
        }
      )}
    >
      <div className="absolute inset-0 bg-white/10 backdrop-blur-sm" />

      <div className="relative z-10">
        <div className="mb-4 flex items-center justify-between">
          <div className="font-medium text-sm text-white/80">{location}</div>
          <div className="text-white/60 text-xs">{currentTimestampLabel}</div>
        </div>

        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className={cx("text-white/90", {
                "text-yellow-200": isDay,
                "text-blue-200": !isDay,
              })}
            >
              {isDay ? <SunIcon size={48} /> : <MoonIcon size={48} />}
            </div>
            <div className="font-light text-5xl text-white">
              {ceilTemperature(data.current.temperature_2m)}
              <span className="text-2xl text-white/80">
                {data.current_units.temperature_2m}
              </span>
            </div>
          </div>

          <div className="text-right">
            <div className="font-medium text-sm text-white/90">
              H: {ceilTemperature(currentHigh)}°
            </div>
            <div className="text-sm text-white/70">
              L: {ceilTemperature(currentLow)}°
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
          <div className="mb-3 font-medium text-sm text-white/80">
            Hourly Forecast
          </div>
          <div className="flex justify-between gap-2">
            {displayEntries.map((entry, index) => {
              const hourDate = parseDate(entry.time);
              const isCurrentHour =
                hourDate !== null &&
                hourDate.getHours() === clientNow.getHours() &&
                hourDate.getDate() === clientNow.getDate() &&
                hourDate.getMonth() === clientNow.getMonth() &&
                hourDate.getFullYear() === clientNow.getFullYear();

              return (
                <div
                  className={cx(
                    "flex min-w-0 flex-1 flex-col items-center gap-2 rounded-lg px-1 py-2",
                    {
                      "bg-white/20": isCurrentHour,
                    }
                  )}
                  key={`${entry.time}-${index}`}
                >
                  <div className="font-medium text-white/70 text-xs">
                    {index === 0
                      ? "Now"
                      : hourDate
                        ? format(hourDate, "ha")
                        : "—"}
                  </div>

                  <div
                    className={cx("text-white/60", {
                      "text-yellow-200": isDay,
                      "text-blue-200": !isDay,
                    })}
                  >
                    <CloudIcon size={20} />
                  </div>

                  <div className="font-medium text-sm text-white">
                    {Number.isFinite(entry.temperature)
                      ? `${ceilTemperature(entry.temperature)}°`
                      : "—"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-4 flex justify-between text-white/60 text-xs">
          <div>Sunrise: {sunriseLabel}</div>
          <div>Sunset: {sunsetLabel}</div>
        </div>
      </div>
    </div>
  );
}
