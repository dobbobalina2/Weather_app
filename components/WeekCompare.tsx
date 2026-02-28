"use client";

import { useMemo, useRef, type ReactNode } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Cloud,
  CloudRain,
  Snowflake,
  Sun,
  Sunrise,
  Sunset,
  ThermometerSun,
  Wind
} from "lucide-react";

import { ForecastChart } from "@/components/ForecastChart";
import { formatEpochToLocalTime } from "@/lib/time";
import type { CompareViewModel, OccurrenceSlice } from "@/types/weather";

interface Props {
  data: CompareViewModel;
  weekOffset: number;
  onChangeWeekOffset: (offset: number) => void;
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
const FEELS_LIKE_DELTA_TO_SHOW_F = 25;

export function WeekCompare({ data, weekOffset, onChangeWeekOffset }: Props) {
  const weekday = dayLabel[data.config.day] ?? "Friday";
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const slices = useMemo(
    () => [
      {
        id: "this" as const,
        title: `This ${weekday}`,
        value: data.thisOccurrence,
        background: "bg-[#b7dfca]",
        accent: "green" as const
      },
      {
        id: "next" as const,
        title: `Next ${weekday}`,
        value: data.nextOccurrence,
        background: "bg-[#b5cce8]",
        accent: "blue" as const
      }
    ],
    [data.nextOccurrence, data.thisOccurrence, weekday]
  );
  const mobileSlice = useMemo(
    () => ({
      title: weekOffset === 0 ? `This ${weekday}` : `${weekday} (Week +${weekOffset})`,
      value: data.thisOccurrence,
      background: "bg-[#b7dfca]",
      accent: "green" as const
    }),
    [data.thisOccurrence, weekday, weekOffset]
  );

  const goMobilePrevious = () => {
    if (weekOffset > 0) {
      onChangeWeekOffset(Math.max(0, weekOffset - 1));
    }
  };

  const goMobileNext = () => {
    if (weekOffset < 8) {
      onChangeWeekOffset(Math.min(8, weekOffset + 1));
    }
  };

  const mobilePrevDisabled = weekOffset === 0;
  const mobileNextDisabled = weekOffset >= 8;

  const handleTouchStart = (event: React.TouchEvent<HTMLElement>) => {
    const point = event.changedTouches[0];
    touchStart.current = { x: point.clientX, y: point.clientY };
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLElement>) => {
    if (!touchStart.current) {
      return;
    }

    const point = event.changedTouches[0];
    const deltaX = point.clientX - touchStart.current.x;
    const deltaY = point.clientY - touchStart.current.y;
    touchStart.current = null;

    if (Math.abs(deltaX) < 40 || Math.abs(deltaX) < Math.abs(deltaY)) {
      return;
    }

    if (deltaX < 0) {
      goMobileNext();
      return;
    }

    goMobilePrevious();
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center">
        <h2 className="text-2xl font-extrabold tracking-tight text-[#1e2a40] md:text-[50px]">Weather Comparison</h2>
      </div>

      <div className="grid grid-cols-[36px_minmax(0,1fr)_36px] items-stretch gap-2 md:hidden">
        <button
          className="my-auto flex h-10 w-10 items-center justify-center rounded-full border border-[#2f364333] bg-white/55 text-[#2f3951] shadow-[0_5px_12px_rgba(31,42,63,0.12)] transition hover:bg-white disabled:opacity-35"
          onClick={goMobilePrevious}
          type="button"
          disabled={mobilePrevDisabled}
          aria-label="Previous card"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <article
          className={`${mobileSlice.background} min-w-0 overflow-hidden rounded-[22px] p-3`}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <PanelHeader title={mobileSlice.title} slice={mobileSlice.value} />
          <ForecastChart accent={mobileSlice.accent} hours={mobileSlice.value.hours} dailyFallback={mobileSlice.value.dailyFallback} />
        </article>
        <button
          className="my-auto flex h-10 w-10 items-center justify-center rounded-full border border-[#2f364333] bg-white/55 text-[#2f3951] shadow-[0_5px_12px_rgba(31,42,63,0.12)] transition hover:bg-white disabled:opacity-35"
          onClick={goMobileNext}
          type="button"
          disabled={mobileNextDisabled}
          aria-label="Next card"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="hidden grid-cols-[52px_minmax(0,1fr)_52px] items-stretch gap-4 md:grid">
        <button
          className="my-auto flex h-12 w-12 items-center justify-center rounded-full border border-[#2f364333] bg-white/55 text-[#2f3951] shadow-[0_5px_12px_rgba(31,42,63,0.12)] transition hover:bg-white disabled:opacity-35"
          onClick={() => onChangeWeekOffset(Math.max(0, weekOffset - 1))}
          type="button"
          disabled={weekOffset === 0}
          aria-label="Previous week"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div className="grid min-w-0 gap-4 xl:grid-cols-2">
          {slices.map((slice) => (
            <article className={`${slice.background} min-w-0 overflow-hidden rounded-[26px] p-4 md:p-5`} key={slice.id}>
              <PanelHeader title={slice.title} slice={slice.value} />
              <ForecastChart accent={slice.accent} hours={slice.value.hours} dailyFallback={slice.value.dailyFallback} />
            </article>
          ))}
        </div>

        <button
          className="my-auto flex h-10 w-10 items-center justify-center rounded-full border border-[#2f364333] bg-white/55 text-[#2f3951] shadow-[0_5px_12px_rgba(31,42,63,0.12)] transition hover:bg-white md:h-12 md:w-12"
          onClick={() => onChangeWeekOffset(Math.min(8, weekOffset + 1))}
          type="button"
          disabled={weekOffset >= 8}
          aria-label="Next week"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </section>
  );
}

function PanelHeader({ title, slice }: { title: string; slice: OccurrenceSlice }) {
  const showFeelsLike = shouldShowFeelsLike(slice.metrics);
  const showSnow = shouldShowSnow(slice.metrics);

  return (
    <header className="mb-3">
      <h3 className="break-words text-2xl font-extrabold tracking-tight text-[#1d293f] md:truncate md:whitespace-nowrap md:text-[42px]">{title} {formatDateSuffix(slice.date)}</h3>
      <div className="mt-2 flex min-w-0 items-start gap-3">
        <WeatherIcon level={slice.decision.level} />
        <div className="min-w-0 space-y-1 text-[#2e3952]">
          <p className="break-words text-base font-bold leading-tight md:text-[22px]">{slice.summary}</p>
          <p className="text-sm font-semibold md:hidden">
            Avg {Math.round(slice.metrics.tempAvgF)}F • Rain {Math.round(slice.metrics.peakPrecipProb)}% • Wind {Math.round(slice.metrics.peakWindMph)} mph
          </p>
          <p className="hidden text-sm font-semibold md:block md:text-[18px]">Avg temp {Math.round(slice.metrics.tempAvgF)}F</p>
          {showFeelsLike && (
            <p className="hidden items-center gap-1 text-sm font-semibold md:flex md:text-[18px]">
              <ThermometerSun className="h-4 w-4" /> feels like {Math.round(slice.metrics.feelsLikeMinF)}-{Math.round(slice.metrics.feelsLikeMaxF)}F
            </p>
          )}
          <p className="hidden items-center gap-1 text-sm font-semibold md:flex md:text-[18px]">
            <Wind className="h-4 w-4" /> peak {Math.round(slice.metrics.peakWindMph)} mph
          </p>
          <p className="hidden text-sm font-semibold md:block md:text-[18px]">
            {Math.round(slice.metrics.peakPrecipProb)}% rain chance, {slice.metrics.totalPrecipIn.toFixed(1)}" precip
          </p>
          {showSnow && (
            <p className="hidden items-center gap-1 text-sm font-semibold md:flex md:text-[18px]">
              <Snowflake className="h-4 w-4" /> {slice.metrics.snowIn.toFixed(1)}" snow, {slice.metrics.snowDepthIn.toFixed(1)}" depth
            </p>
          )}
          {(slice.metrics.sunriseLabel || slice.metrics.sunsetLabel) && (
            <p className="hidden flex-wrap items-center gap-x-3 gap-y-1 text-sm font-semibold md:flex md:text-[18px]">
              {slice.metrics.sunriseLabel && (
                <span className="inline-flex items-center gap-1">
                  <Sunrise className="h-4 w-4" /> {slice.metrics.sunriseLabel}
                </span>
              )}
              {slice.metrics.sunsetLabel && (
                <span className="inline-flex items-center gap-1">
                  <Sunset className="h-4 w-4" /> {slice.metrics.sunsetLabel}
                </span>
              )}
            </p>
          )}
          <p className="hidden text-[11px] font-semibold uppercase tracking-[0.08em] text-[#4f5c75] md:block md:text-[13px]">
            Window {formatEpochToLocalTime(slice.startEpoch, slice.timezone)} - {formatEpochToLocalTime(slice.endEpoch, slice.timezone)}
          </p>
        </div>
      </div>
    </header>
  );
}

function WeatherIcon({ level }: { level: OccurrenceSlice["decision"]["level"] }) {
  if (level === "cancel") {
    return <CloudRain className="h-10 w-10 text-[#2f3d55] md:h-12 md:w-12" strokeWidth={2.2} />;
  }

  if (level === "caution") {
    return <Cloud className="h-10 w-10 text-[#2f3d55] md:h-12 md:w-12" strokeWidth={2.2} />;
  }

  return <Sun className="h-10 w-10 text-[#2f3d55] md:h-12 md:w-12" strokeWidth={2.2} />;
}

function formatDateSuffix(dateString: string): ReactNode {
  const date = new Date(`${dateString}T00:00:00`);
  const day = date.getDate();
  if (!day || Number.isNaN(day)) {
    return dateString;
  }

  const suffix = getOrdinalSuffix(day);
  return <span className="font-bold text-[#2d3a54]">the {day}{suffix}</span>;
}

function getOrdinalSuffix(day: number): string {
  const mod10 = day % 10;
  const mod100 = day % 100;

  if (mod10 === 1 && mod100 !== 11) {
    return "st";
  }
  if (mod10 === 2 && mod100 !== 12) {
    return "nd";
  }
  if (mod10 === 3 && mod100 !== 13) {
    return "rd";
  }

  return "th";
}

function shouldShowFeelsLike(metrics: OccurrenceSlice["metrics"]): boolean {
  const minDelta = Math.abs(metrics.feelsLikeMinF - metrics.tempMinF);
  const maxDelta = Math.abs(metrics.feelsLikeMaxF - metrics.tempMaxF);
  return Math.max(minDelta, maxDelta) >= FEELS_LIKE_DELTA_TO_SHOW_F;
}

function shouldShowSnow(metrics: OccurrenceSlice["metrics"]): boolean {
  return metrics.snowIn > 0 || metrics.snowDepthIn > 0;
}
