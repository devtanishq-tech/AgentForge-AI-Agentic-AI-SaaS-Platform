"use client";

import { Cloud, Droplets, Eye, Gauge, Sun, Wind } from "lucide-react";
import { cn } from "@/lib/utils";

export type WeatherCardData = {
  location: {
    name: string;
    region: string;
    country: string;
  };
  temperature: number;
  feelsLike: number;
  condition: {
    text: string;
    icon: string;
  };
  humidity: number;
  wind: {
    speed: number;
    direction: string;
  };
  precipitation: number;
  rainChance: number;
  visibility: number;
  uvIndex: number;
  isDay: 0 | 1;
  lastUpdated: string;
};

function conditionTone(text: string) {
  const t = text.toLowerCase();
  if (t.includes("rain") || t.includes("drizzle") || t.includes("shower")) {
    return "rain";
  }
  if (t.includes("storm") || t.includes("thunder")) return "storm";
  if (t.includes("snow") || t.includes("sleet") || t.includes("ice")) {
    return "snow";
  }
  if (
    t.includes("cloud") ||
    t.includes("overcast") ||
    t.includes("fog") ||
    t.includes("mist")
  ) {
    return "cloud";
  }
  return "clear";
}

const GRADIENTS: Record<string, { day: string; night: string }> = {
  clear: {
    day: "from-[#3B82F6] to-[#7DD3FC]",
    night: "from-[#1E1B4B] to-[#312E81]",
  },
  cloud: {
    day: "from-[#64748B] to-[#94A3B8]",
    night: "from-[#1E293B] to-[#334155]",
  },
  rain: {
    day: "from-[#475569] to-[#64748B]",
    night: "from-[#0F172A] to-[#334155]",
  },
  storm: {
    day: "from-[#334155] to-[#1E293B]",
    night: "from-[#0B1220] to-[#1E1B4B]",
  },
  snow: {
    day: "from-[#93C5FD] to-[#E0F2FE]",
    night: "from-[#1E293B] to-[#475569]",
  },
};

function formatTime(lastUpdated: string) {
  const d = new Date(lastUpdated.replace(" ", "T"));
  if (Number.isNaN(d.getTime())) return lastUpdated;
  return d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function WeatherCard({ data }: { data: WeatherCardData }) {
  const tone = conditionTone(data.condition.text);
  const gradient = GRADIENTS[tone][data.isDay ? "day" : "night"];
  const isLight = data.isDay === 1 && (tone === "clear" || tone === "snow");

  const stats = [
    { label: "Feels like", value: `${Math.round(data.feelsLike)}°`, icon: Sun },
    { label: "Humidity", value: `${data.humidity}%`, icon: Droplets },
    {
      label: "Wind",
      value: `${data.wind.speed} km/h ${data.wind.direction}`,
      icon: Wind,
    },
    { label: "Chance of rain", value: `${data.rainChance}%`, icon: Cloud },
    { label: "Visibility", value: `${data.visibility} km`, icon: Eye },
    { label: "UV index", value: `${data.uvIndex}`, icon: Gauge },
  ];

  return (
    <div
      className={cn(
        "w-full max-w-sm overflow-hidden rounded-2xl bg-gradient-to-br shadow-lg",
        gradient,
      )}
    >
      <div className="p-5">
        {/* Header: location + condition */}
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <p
              className={cn(
                "truncate text-sm font-medium",
                isLight ? "text-slate-900/70" : "text-white/70",
              )}
            >
              {data.location.name}
              {data.location.region ? `, ${data.location.region}` : ""}
            </p>
            <p
              className={cn(
                "text-xs",
                isLight ? "text-slate-900/50" : "text-white/50",
              )}
            >
              {data.location.country}
            </p>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https:${data.condition.icon}`}
            alt={data.condition.text}
            width={40}
            height={40}
            className="shrink-0 drop-shadow"
          />
        </div>

        {/* Hero: temperature */}
        <div className="mt-4 flex items-end gap-3">
          <span
            className={cn(
              "text-6xl font-semibold leading-none tracking-tight",
              isLight ? "text-slate-900" : "text-white",
            )}
          >
            {Math.round(data.temperature)}°
          </span>
          <span
            className={cn(
              "mb-1.5 text-sm font-medium",
              isLight ? "text-slate-900/70" : "text-white/80",
            )}
          >
            {data.condition.text}
          </span>
        </div>

        {/* Stat grid */}
        <div
          className={cn(
            "mt-5 grid grid-cols-2 gap-x-4 gap-y-3 rounded-xl p-3",
            isLight ? "bg-white/30" : "bg-black/15",
          )}
        >
          {stats.map(({ label, value, icon: Icon }) => (
            <div key={label} className="flex items-center gap-2">
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0",
                  isLight ? "text-slate-900/60" : "text-white/60",
                )}
              />
              <div className="min-w-0">
                <p
                  className={cn(
                    "truncate text-xs",
                    isLight ? "text-slate-900/55" : "text-white/55",
                  )}
                >
                  {label}
                </p>
                <p
                  className={cn(
                    "truncate text-sm font-medium",
                    isLight ? "text-slate-900" : "text-white",
                  )}
                >
                  {value}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <p
          className={cn(
            "mt-4 text-right text-[11px]",
            isLight ? "text-slate-900/45" : "text-white/45",
          )}
        >
          Updated {formatTime(data.lastUpdated)}
        </p>
      </div>
    </div>
  );
}
