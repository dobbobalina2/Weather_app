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

  const [config, setConfig] = useState<MeetupConfig>(() => resolvedInitial);

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
  }, [resolvedInitial]);

  const query = useForecast(config);

  const applyConfig = (nextConfig: MeetupConfig) => {
    setConfig(nextConfig);
    const params = new URLSearchParams({
      location: nextConfig.location,
      day: nextConfig.day,
      window: nextConfig.window
    });
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <main className="mx-auto w-full max-w-[1700px] space-y-7 px-4 py-8 md:px-8 md:py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-4 md:gap-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-[30px] bg-[#9a8bde] text-white shadow-[0_14px_28px_rgba(117,104,189,0.35)] md:h-28 md:w-28">
            <Cloud className="h-10 w-10 md:h-14 md:w-14" strokeWidth={2.2} />
          </div>
          <div>
            <h1 className="text-5xl font-black tracking-tight text-[#1f2a40] md:text-8xl">Weather Planner</h1>
            <p className="mt-1 text-[24px] font-bold text-[#4d596f] md:text-[46px]">Compare weekly event conditions</p>
          </div>
        </div>
      </header>

      <MeetupControls
        config={config}
        errorMessage={query.error?.code === "UPSTREAM_BAD_REQUEST" ? query.error.message : undefined}
        isUpdating={query.isFetching}
        onApply={applyConfig}
      />

      {query.isLoading && <LoadingSkeleton />}

      {query.error && !query.data && (
        <ErrorState
          message={query.error.message}
          onRetry={() => query.refetch()}
        />
      )}

      {query.error && query.data && <ErrorState message={query.error.message} onRetry={() => query.refetch()} />}

      {query.data && <WeekCompare data={query.data} />}

      <section className="rounded-[34px] border border-white/60 bg-[#f7dda0] px-6 py-5 shadow-[0_12px_20px_rgba(31,42,63,0.1)] md:px-8 md:py-7">
        <h3 className="text-[36px] font-extrabold text-[#26344b] md:text-[42px]">Demo Mode</h3>
        <p className="mt-2 text-[28px] font-bold text-[#344059] md:text-[35px]">
          Using simulated data. Connect Visual Crossing API for live forecasts.
        </p>
      </section>
    </main>
  );
}
