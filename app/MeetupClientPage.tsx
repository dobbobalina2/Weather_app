"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Cloud } from "lucide-react";

import { ErrorState } from "@/components/ErrorState";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { MeetupControls } from "@/components/MeetupControls";
import { WeekCompare } from "@/components/WeekCompare";
import { useForecast } from "@/hooks/useForecast";
import type { DayOfWeek, MeetupConfig, TimeWindowPreset } from "@/types/weather";

const defaultConfig: MeetupConfig = {
  location: "San Francisco, CA",
  day: "fri",
  window: "afternoon"
};

function configFromQuery(searchParams: URLSearchParams): MeetupConfig {
  const location = searchParams.get("location") ?? defaultConfig.location;
  const day = (searchParams.get("day") as DayOfWeek) ?? defaultConfig.day;
  const window = (searchParams.get("window") as TimeWindowPreset) ?? defaultConfig.window;

  return {
    location,
    day: ["sun", "mon", "tue", "wed", "thu", "fri", "sat"].includes(day) ? day : defaultConfig.day,
    window: ["morning", "afternoon", "evening"].includes(window) ? window : defaultConfig.window
  };
}

export default function MeetupClientPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams.toString();

  const resolvedInitial = useMemo(
    () => configFromQuery(new URLSearchParams(searchParamsString)),
    [searchParamsString]
  );
  const initialWeekOffset = useMemo(() => {
    const value = Number(searchParams.get("weekOffset") ?? "0");
    if (Number.isNaN(value)) {
      return 0;
    }
    return Math.min(8, Math.max(0, Math.trunc(value)));
  }, [searchParams]);

  const [config, setConfig] = useState<MeetupConfig>(() => resolvedInitial);
  const [weekOffset, setWeekOffset] = useState<number>(() => initialWeekOffset);

  useEffect(() => {
    setConfig((previousConfig) => {
      if (
        previousConfig.location === resolvedInitial.location &&
        previousConfig.day === resolvedInitial.day &&
        previousConfig.window === resolvedInitial.window
      ) {
        return previousConfig;
      }

      return resolvedInitial;
    });
    setWeekOffset(initialWeekOffset);
  }, [resolvedInitial, initialWeekOffset]);

  const query = useForecast({ ...config, weekOffset });
  const hasInvalidLocationError = query.error?.code === "UPSTREAM_BAD_REQUEST";

  const applyConfig = (nextConfig: MeetupConfig) => {
    setConfig(nextConfig);
    const params = new URLSearchParams({
      location: nextConfig.location,
      day: nextConfig.day,
      window: nextConfig.window,
      weekOffset: String(weekOffset)
    });
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const changeWeekOffset = (nextOffset: number) => {
    setWeekOffset(nextOffset);
    const params = new URLSearchParams({
      location: config.location,
      day: config.day,
      window: config.window,
      weekOffset: String(nextOffset)
    });
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <main className="mx-auto w-full max-w-[1400px] space-y-4 px-4 py-4 md:px-8 md:py-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-4 md:gap-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-[#9a8bde] text-white shadow-[0_10px_20px_rgba(117,104,189,0.35)] md:h-16 md:w-16">
            <Cloud className="h-7 w-7 md:h-8 md:w-8" strokeWidth={2.2} />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-[#1f2a40] md:text-[56px]">Weather Planner</h1>
            <p className="mt-1 text-[15px] font-bold text-[#4d596f] md:text-[20px]">Compare weekly event conditions</p>
          </div>
        </div>
      </header>

      <MeetupControls
        config={config}
        errorMessage={query.error?.code === "UPSTREAM_BAD_REQUEST" ? query.error.message : undefined}
        onApply={applyConfig}
      />

      {query.isLoading && <LoadingSkeleton />}
      {query.isFetching && !query.data && !query.isLoading && <LoadingSkeleton />}

      {query.error && !query.data && (
        <ErrorState
          message={query.error.message}
          onRetry={() => query.refetch()}
        />
      )}

      {query.error && query.data && <ErrorState message={query.error.message} onRetry={() => query.refetch()} />}

      {query.data && !hasInvalidLocationError && (
        <WeekCompare data={query.data} weekOffset={weekOffset} onChangeWeekOffset={changeWeekOffset} />
      )}
    </main>
  );
}
