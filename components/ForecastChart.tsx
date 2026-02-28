"use client";

import { useMemo } from "react";
import {
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import type { DailyFallback, ForecastHour } from "@/types/weather";

interface Props {
  hours: ForecastHour[];
  accent: "green" | "blue";
  dailyFallback?: DailyFallback;
}

const accentColor = {
  green: {
    titleDot: "#94e4c4",
    temp: "#ef959d",
    rain: "#7aa9e3",
    precip: "#35bb78"
  },
  blue: {
    titleDot: "#79aee8",
    temp: "#ef959d",
    rain: "#7aa9e3",
    precip: "#35bb78"
  }
} as const;

export function ForecastChart({ hours, accent, dailyFallback }: Props) {
  const palette = accentColor[accent];

  const data = useMemo(
    () =>
      hours.map((hour) => ({
        time: compactTime(hour.timeLabel),
        temp: Number(hour.tempF.toFixed(1)),
        rain: Number(hour.precipProb.toFixed(1)),
        precip: Number(hour.precipAmountIn.toFixed(3))
      })),
    [hours]
  );

  if (hours.length === 0) {
    return (
      <section className="chart-shell">
        <div className="rounded-2xl border border-[#2f364333] px-3 py-3 text-[#42506a]">
          <p className="text-sm font-extrabold uppercase tracking-[0.06em]">Daily summary</p>
          {dailyFallback ? (
            <div className="mt-2 grid gap-2 text-sm font-semibold md:grid-cols-2">
              <p>Temp {Math.round(dailyFallback.tempMinF)}-{Math.round(dailyFallback.tempMaxF)}F</p>
              <p>Rain {Math.round(dailyFallback.precipProb)}% ({dailyFallback.precipIn.toFixed(1)} in)</p>
              <p>Wind {Math.round(dailyFallback.windMph)} mph</p>
              <p className="truncate">{dailyFallback.conditions}</p>
            </div>
          ) : (
            <p className="mt-2 text-sm font-semibold">Hourly data unavailable for this window.</p>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="chart-shell">
      <div className="hidden md:block">
        <ChartTitle color={palette.titleDot} label="Weather Trend" />
      </div>

      <div className="mb-2 hidden flex-wrap items-center gap-3 text-[12px] font-bold text-[#3a465f] md:flex md:text-[13px]">
        <LegendChip color={palette.temp} label="Temperature (F)" />
        <LegendChip color={palette.rain} label="Rain Probability (%)" />
        <LegendChip color={palette.precip} label="Precipitation (in)" />
      </div>

      <div className="chart-box h-[230px] md:h-[185px]">
        <ResponsiveContainer height="100%" width="100%">
          <ComposedChart data={data} margin={{ top: 6, right: 12, bottom: 0, left: 0 }}>
            <CartesianGrid stroke="#cad0d6" strokeDasharray="4 4" />
            <XAxis dataKey="time" tick={{ fill: "#616973", fontSize: 10 }} />
            <YAxis
              yAxisId="left"
              tick={{ fill: "#616973", fontSize: 10 }}
              width={30}
              tickFormatter={(value) => `${value}`}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fill: "#616973", fontSize: 10 }}
              width={38}
              tickFormatter={(value) => `${value}`}
            />
            <Tooltip
              formatter={(value, name) => {
                const label = String(name ?? "");
                if (label === "Temperature (F)") {
                  return [`${value ?? 0} F`, label] as [string, string];
                }
                if (label === "Rain Probability (%)") {
                  return [`${value ?? 0}%`, label] as [string, string];
                }

                return [`${value ?? 0}\"`, label] as [string, string];
              }}
              contentStyle={{
                background: "#f7f8fa",
                border: "1px solid #d7dce2",
                borderRadius: 12,
                color: "#2c3243",
                fontSize: 13
              }}
            />
            <Line
              yAxisId="left"
              dataKey="temp"
              name="Temperature (F)"
              dot={false}
              stroke={palette.temp}
              strokeWidth={2.8}
              type="monotone"
            />
            <Line
              yAxisId="left"
              dataKey="rain"
              name="Rain Probability (%)"
              dot={false}
              stroke={palette.rain}
              strokeWidth={2.8}
              type="monotone"
            />
            <Line
              yAxisId="right"
              dataKey="precip"
              name="Precipitation (in)"
              dot={false}
              stroke={palette.precip}
              strokeWidth={2.8}
              type="monotone"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function LegendChip({ color, label }: { color: string; label: string }) {
  return (
    <div className="inline-flex items-center gap-2">
      <span className="h-3 w-3 rounded-full" style={{ background: color }} />
      <span>{label}</span>
    </div>
  );
}

function ChartTitle({ label, color }: { label: string; color: string }) {
  return (
    <div className="mb-2 flex items-center gap-2 text-[16px] font-extrabold text-[#2f3b53] md:text-[18px]">
      <span className="h-4 w-4 rounded-full shadow-[0_3px_8px_rgba(73,88,113,0.2)]" style={{ background: color }} />
      <span>{label}</span>
    </div>
  );
}

function compactTime(timeLabel: string): string {
  const [time, meridian] = timeLabel.split(" ");
  if (!time || !meridian) {
    return timeLabel;
  }

  const [hourPart] = time.split(":");
  const hour = Number(hourPart);
  if (Number.isNaN(hour)) {
    return timeLabel;
  }

  if (meridian === "AM" && hour === 12) {
    return "00:00";
  }

  if (meridian === "PM" && hour !== 12) {
    return `${String(hour + 12).padStart(2, "0")}:00`;
  }

  return `${String(hour).padStart(2, "0")}:00`;
}
