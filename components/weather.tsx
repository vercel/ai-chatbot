"use client";

import cx from "classnames";
import { format, isWithinInterval } from "date-fns";
import { useEffect, useState } from "react";

const SunIcon = ({ size = 40 }: { size?: number }) => (
  <svg fill="none" height={size} viewBox="0 0 24 24" width={size}>
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
    <path
      d="M21 12.79A9 9 0 1 1 11.21 3A7 7 0 0 0 21 12.79z"
      fill="currentColor"
    />
  </svg>
);

const CloudIcon = ({ size = 24 }: { size?: number }) => (
  <svg fill="none" height={size} viewBox="0 0 24 24" width={size}>
    <path
      d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    />
  </svg>
);

type WeatherAtLocation = {
  latitude: number;
  longitude: number;
  generationtime_ms: number;
  utc_offset_seconds: number;
  timezone: string;
  timezone_abbreviation: string;
  elevation: number;
  cityName?: string;
  current_units: {
    time: string;
    interval: string;
    temperature_2m: string;
  };
  current: {
    time: string;
    interval: number;
    temperature_2m: number;
  };
  hourly_units: {
    time: string;
    temperature_2m: string;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
  };
  daily_units: {
    time: string;
    sunrise: string;
    sunset: string;
  };
  daily: {
    time: string[];
    sunrise: string[];
    sunset: string[];
  };
};

const SAMPLE = {
  latitude: 37.763_283,
  longitude: -122.412_86,
  generationtime_ms: 0.027_894_973_754_882_812,
  utc_offset_seconds: 0,
  timezone: "GMT",
  timezone_abbreviation: "GMT",
  elevation: 18,
  current_units: {
    time: "iso8601",
    interval: "seconds",
    temperature_2m: "°F",
  },
  current: { time: "2024-10-07T19:30", interval: 900, temperature_2m: 84.7 },
  hourly_units: { time: "iso8601", temperature_2m: "°F" },
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
      97.9, 91, 85.1, 83.5, 84.6, 82.8, 81.5, 79.9, 79.7, 78.8, 77, 74.3, 75,
      75.6, 73.2, 69.8, 75.2, 82.6, 88.5, 93, 89.8, 84, 80.4, 77.4, 73.4, 70,
      67.3, 65.5, 63.9, 62.2, 61.2, 59.9, 58.8, 57.9, 57.6, 56.7, 55.9, 55.2,
      54.5, 56.3, 60.4, 63.9, 67.3, 69.8, 71.4, 72.1, 71.6, 69.3, 66, 64.2,
      63.1, 62.6, 62.1, 61.2, 60.1, 59.4, 59, 59, 59.2, 58.6, 58.6, 58.8, 58.5,
      58.6, 59.5, 61.2, 64.2, 67.3, 68.9, 70.9, 69.8, 69.3, 66.7, 65.7, 65.1,
      64.2, 63.1, 62.6, 62.6, 62.2, 61.5, 61.2, 60.8, 60.4, 60.3, 59.7, 59.7,
      61, 62.1, 62.6, 65.5, 66.2, 67.1, 66.9, 65.3, 64.2, 63.5, 62.1, 61.3, 61,
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

function n(num: number): number {
  return Math.ceil(num);
}

export function Weather({
  weatherAtLocation = SAMPLE,
}: {
  weatherAtLocation?: WeatherAtLocation;
}) {
  // Validate that all required data is present, otherwise use SAMPLE data
  const data: WeatherAtLocation =
    weatherAtLocation?.hourly?.temperature_2m &&
    weatherAtLocation?.current?.temperature_2m !== undefined &&
    weatherAtLocation?.daily?.sunrise?.[0] &&
    weatherAtLocation?.daily?.sunset?.[0]
      ? weatherAtLocation
      : SAMPLE;

  const currentHigh = Math.max(...data.hourly.temperature_2m.slice(0, 24));
  const currentLow = Math.min(...data.hourly.temperature_2m.slice(0, 24));

  const isDay = isWithinInterval(new Date(data.current.time), {
    start: new Date(data.daily.sunrise[0]),
    end: new Date(data.daily.sunset[0]),
  });

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const hoursToShow = isMobile ? 5 : 6;

  const currentTimeIndex = data.hourly.time.findIndex(
    (time) => new Date(time) >= new Date(data.current.time)
  );

  const displayTimes = data.hourly.time.slice(
    currentTimeIndex,
    currentTimeIndex + hoursToShow
  );
  const displayTemperatures = data.hourly.temperature_2m.slice(
    currentTimeIndex,
    currentTimeIndex + hoursToShow
  );

  const location =
    data.cityName ||
    `${data.latitude?.toFixed(1)}°, ${data.longitude?.toFixed(1)}°`;

  return (
    <div
      className={cx(
        "relative flex w-full flex-col gap-6 overflow-hidden rounded-3xl p-6 shadow-lg backdrop-blur-sm",
        {
          "bg-linear-to-br from-sky-400 via-blue-500 to-blue-600": isDay,
        },
        {
          "bg-linear-to-br from-indigo-900 via-purple-900 to-slate-900": !isDay,
        }
      )}
    >
      <div className="absolute inset-0 bg-white/10 backdrop-blur-sm" />

      <div className="relative z-10">
        <div className="mb-4 flex items-center justify-between">
          <div className="font-medium text-sm text-white/80">{location}</div>
          <div className="text-white/60 text-xs">
            {format(new Date(data.current.time), "MMM d, h:mm a")}
          </div>
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
              {n(data.current.temperature_2m)}
              <span className="text-2xl text-white/80">
                {data.current_units.temperature_2m}
              </span>
            </div>
          </div>

          <div className="text-right">
            <div className="font-medium text-sm text-white/90">
              H: {n(currentHigh)}°
            </div>
            <div className="text-sm text-white/70">L: {n(currentLow)}°</div>
          </div>
        </div>

        <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
          <div className="mb-3 font-medium text-sm text-white/80">
            Hourly Forecast
          </div>
          <div className="flex justify-between gap-2">
            {displayTimes.map((time, index) => {
              const hourTime = new Date(time);
              const isCurrentHour =
                hourTime.getHours() === new Date().getHours();

              return (
                <div
                  className={cx(
                    "flex min-w-0 flex-1 flex-col items-center gap-2 rounded-lg px-1 py-2",
                    {
                      "bg-white/20": isCurrentHour,
                    }
                  )}
                  key={time}
                >
                  <div className="font-medium text-white/70 text-xs">
                    {index === 0 ? "Now" : format(hourTime, "ha")}
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
                    {n(displayTemperatures[index])}°
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-4 flex justify-between text-white/60 text-xs">
          <div>
            Sunrise: {format(new Date(data.daily.sunrise[0]), "h:mm a")}
          </div>
          <div>Sunset: {format(new Date(data.daily.sunset[0]), "h:mm a")}</div>
        </div>
      </div>
    </div>
  );
}
