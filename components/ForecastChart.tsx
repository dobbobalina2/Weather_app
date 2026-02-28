"use client";

import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import type { ForecastHour } from "@/types/weather";

interface Props {
  hours: ForecastHour[];
  accent: "green" | "blue";
}

const accentColor = {
  green: {
    dot: "#94e4c4",
    rain: "#7aa9e3",
    temp: "#ef959d",
    area: "#7aa9e3"
  },
  blue: {
    dot: "#79aee8",
    rain: "#7aa9e3",
    temp: "#ef959d",
    area: "#7aa9e3"
  }
} as const;

export function ForecastChart({ hours, accent }: Props) {
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
      <div className="chart-shell">
        <p className="rounded-2xl bg-white/55 px-4 py-4 text-sm font-semibold text-[#596179]">
          Hourly details unavailable for this window. Using daily summary fallback.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section className="chart-shell">
        <ChartTitle color={palette.dot} label="Temperature & Rain Probability" />
        <div className="chart-box">
          <ResponsiveContainer height={250} width="100%">
            <LineChart data={data} margin={{ top: 6, right: 10, bottom: 0, left: 0 }}>
              <CartesianGrid stroke="#cad0d6" strokeDasharray="4 4" />
              <XAxis dataKey="time" tick={{ fill: "#616973", fontSize: 22 }} />
              <YAxis tick={{ fill: "#616973", fontSize: 22 }} width={52} />
              <Tooltip
                contentStyle={{
                  background: "#f7f8fa",
                  border: "1px solid #d7dce2",
                  borderRadius: 12,
                  color: "#2c3243",
                  fontSize: 14
                }}
              />
              <Line dataKey="temp" dot={{ r: 7 }} stroke={palette.temp} strokeWidth={5} type="monotone" />
              <Line dataKey="rain" dot={{ r: 7 }} stroke={palette.rain} strokeWidth={5} type="monotone" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="chart-shell">
        <ChartTitle color="#f6cb98" label="Precipitation Amount" />
        <div className="chart-box">
          <ResponsiveContainer height={230} width="100%">
            <AreaChart data={data} margin={{ top: 6, right: 10, bottom: 0, left: 0 }}>
              <CartesianGrid stroke="#cad0d6" strokeDasharray="4 4" />
              <XAxis dataKey="time" tick={{ fill: "#616973", fontSize: 22 }} />
              <YAxis tick={{ fill: "#616973", fontSize: 22 }} width={64} />
              <Tooltip
                formatter={(value: number | string | undefined) => `${value ?? 0}"`}
                contentStyle={{
                  background: "#f7f8fa",
                  border: "1px solid #d7dce2",
                  borderRadius: 12,
                  color: "#2c3243",
                  fontSize: 14
                }}
              />
              <Area
                dataKey="precip"
                fill="rgba(122, 169, 227, 0.28)"
                stroke={palette.area}
                strokeWidth={4}
                type="monotone"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}

function ChartTitle({ label, color }: { label: string; color: string }) {
  return (
    <div className="mb-4 flex items-center gap-3 text-[40px] font-extrabold text-[#2f3b53]">
      <span className="h-6 w-6 rounded-full shadow-[0_3px_8px_rgba(73,88,113,0.2)]" style={{ background: color }} />
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
