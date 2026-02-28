"use client";

import { useMemo, useState, type ReactNode } from "react";
import { CalendarDays, CloudRain, Droplets, Thermometer, Wind } from "lucide-react";

import { ForecastChart } from "@/components/ForecastChart";
import type { CompareViewModel, OccurrenceSlice } from "@/types/weather";

interface Props {
  data: CompareViewModel;
}

const dayLabel: Record<string, string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday"
};

export function WeekCompare({ data }: Props) {
  const [mobileView, setMobileView] = useState<"this" | "next">("this");

  const slices = useMemo(
    () => [
      {
        id: "this" as const,
        title: "This Week",
        subtitle: "Perfect weather - ideal conditions",
        value: data.thisOccurrence,
        background: "bg-[#b7dfca]",
        badge: "bg-[#99ddcc]",
        accent: "green" as const
      },
      {
        id: "next" as const,
        title: "Next Week",
        subtitle: "Nice day - good conditions expected",
        value: data.nextOccurrence,
        background: "bg-[#b5cce8]",
        badge: "bg-[#86b4e9]",
        accent: "blue" as const
      }
    ],
    [data.nextOccurrence, data.thisOccurrence]
  );

  const weekday = dayLabel[data.config.day] ?? "Friday";

  return (
    <section className="space-y-6">
      <h2 className="text-5xl font-extrabold tracking-tight text-[#1e2a40] md:text-6xl">Weather Comparison</h2>

      <div className="inline-flex rounded-full border border-white/65 bg-white/40 p-1 md:hidden">
        {slices.map((slice) => (
          <button
            key={slice.id}
            className={`rounded-full px-4 py-2 text-sm font-bold ${mobileView === slice.id ? "bg-[#9a8bde] text-white" : "text-[#455067]"}`}
            onClick={() => setMobileView(slice.id)}
            type="button"
          >
            {slice.title}
          </button>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {slices.map((slice) => {
          const hiddenOnMobile = mobileView !== slice.id ? "hidden md:block" : "block";
          return (
            <article className={`${slice.background} rounded-[42px] p-6 md:p-8 ${hiddenOnMobile}`} key={slice.id}>
              <div className="mb-5 flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <h3 className="text-6xl font-extrabold tracking-tight text-[#1d293f] md:text-7xl">{slice.title}</h3>
                  <p className="text-[36px] font-bold text-[#2d3a54] md:text-[40px]">{slice.subtitle}</p>
                </div>
                <div className={`${slice.badge} shrink-0 rounded-full px-5 py-3 text-[29px] font-extrabold text-[#2f3c54] flex items-center gap-2`}>
                  <CalendarDays className="h-7 w-7" strokeWidth={2.4} />
                  <span>{weekday}</span>
                </div>
              </div>

              <MetricsGrid slice={slice.value} />

              <ForecastChart accent={slice.accent} hours={slice.value.hours} />
            </article>
          );
        })}
      </div>
    </section>
  );
}

function MetricsGrid({ slice }: { slice: OccurrenceSlice }) {
  return (
    <div className="mb-6 grid gap-4 sm:grid-cols-2">
      <Metric bg="bg-[#ef949b]" icon={<Thermometer className="h-6 w-6" strokeWidth={2.3} />} label="Avg Temp" value={`${Math.round(slice.metrics.tempAvgF)}°F`} />
      <Metric bg="bg-[#81aadf]" icon={<CloudRain className="h-6 w-6" strokeWidth={2.3} />} label="Rain Chance" value={`${Math.round(slice.metrics.peakPrecipProb)}%`} />
      <Metric bg="bg-[#f2d2ae]" icon={<Droplets className="h-6 w-6" strokeWidth={2.3} />} label="Total Precip" value={`${slice.metrics.totalPrecipIn.toFixed(1)}\"`} />
      <Metric bg="bg-[#b99bd3]" icon={<Wind className="h-6 w-6" strokeWidth={2.3} />} label="Avg Wind" value={`${Math.round(slice.metrics.peakWindMph)} mph`} />
    </div>
  );
}

function Metric({ icon, label, value, bg }: { icon: ReactNode; label: string; value: string; bg: string }) {
  return (
    <section className={`metric-card ${bg} p-4 md:p-5 min-h-[200px]`}>
      <div className="mb-3 flex items-center gap-3 text-[29px] font-extrabold text-[#314058] md:text-[31px]">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/45 text-[21px]">{icon}</span>
        <span>{label}</span>
      </div>
      <p className="text-6xl font-black tracking-tight text-[#1d2a40] md:text-7xl">{value}</p>
    </section>
  );
}
