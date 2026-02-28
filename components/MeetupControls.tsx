"use client";

import { useEffect, useState } from "react";
import { MapPin } from "lucide-react";

import type { DayOfWeek, MeetupConfig, TimeWindowPreset } from "@/types/weather";

const dayOptions: { label: string; short: string; value: DayOfWeek }[] = [
  { label: "Monday", short: "Mon", value: "mon" },
  { label: "Tuesday", short: "Tue", value: "tue" },
  { label: "Wednesday", short: "Wed", value: "wed" },
  { label: "Thursday", short: "Thu", value: "thu" },
  { label: "Friday", short: "Fri", value: "fri" },
  { label: "Saturday", short: "Sat", value: "sat" },
  { label: "Sunday", short: "Sun", value: "sun" }
];

const windowOptions: { label: string; value: TimeWindowPreset; hours: string; bg: string }[] = [
  { label: "Morning", value: "morning", hours: "6 AM - 12 PM", bg: "bg-[#f4de8f]" },
  { label: "Afternoon", value: "afternoon", hours: "12 PM - 6 PM", bg: "bg-[#e8b5c8]" },
  { label: "Evening", value: "evening", hours: "6 PM - 12 AM", bg: "bg-[#a7c1de]" }
];

interface Props {
  config: MeetupConfig;
  errorMessage?: string;
  isUpdating: boolean;
  onApply: (config: MeetupConfig) => void;
}

export function MeetupControls({ config, errorMessage, isUpdating, onApply }: Props) {
  const [localConfig, setLocalConfig] = useState(config);
  const [localError, setLocalError] = useState<string | undefined>();

  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (localConfig.location.trim().length < 2) {
      setLocalError("Please enter a real location (for example: Austin, TX or 10001). ");
      return;
    }

    setLocalError(undefined);
    onApply({ ...localConfig, location: localConfig.location.trim() });
  };

  return (
    <form className="card space-y-8 p-6 md:p-10" onSubmit={submit}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h2 className="text-5xl font-extrabold tracking-tight text-[#1e2a40] md:text-6xl">Event Settings</h2>
        <button
          className="rounded-2xl bg-[#9a8bde] px-5 py-3 text-sm font-bold text-white shadow-[0_8px_18px_rgba(137,119,215,0.34)] transition hover:bg-[#8e7dda]"
          type="submit"
        >
          {isUpdating ? "Updating..." : "Update Forecast"}
        </button>
      </div>

      <div className="space-y-3">
        <label className="block text-[37px] font-bold text-[#34405a]" htmlFor="location-input">
          Event Location
        </label>
        <div className="flex items-center gap-4 rounded-full bg-[#ececef] px-5 py-3 shadow-[inset_0_1px_3px_rgba(20,25,35,0.08)]">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f5c3d7] text-lg text-[#4b4f69]">
            <MapPin className="h-6 w-6" strokeWidth={2.4} />
          </span>
          <input
            className="w-full border-none bg-transparent text-[30px] font-semibold text-[#42485c] placeholder:text-[#878da0] focus:outline-none"
            id="location-input"
            placeholder="San Francisco, CA"
            type="text"
            value={localConfig.location}
            onChange={(event) => setLocalConfig((prev) => ({ ...prev, location: event.target.value }))}
          />
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-[34px] font-bold text-[#34405a]">Event Day</p>
        <div className="flex flex-wrap gap-3">
          {dayOptions.map((option) => {
            const selected = localConfig.day === option.value;
            return (
              <button
                key={option.value}
                className={`h-[84px] min-w-[98px] rounded-3xl px-5 text-[32px] font-bold transition ${
                  selected
                    ? "bg-[#9a8bde] text-white shadow-[0_8px_16px_rgba(142,125,218,0.35)]"
                    : "bg-[#f2f2f3] text-[#3c4658] shadow-[0_6px_12px_rgba(30,35,45,0.08)]"
                }`}
                onClick={() => setLocalConfig((prev) => ({ ...prev, day: option.value }))}
                type="button"
                aria-label={option.label}
              >
                {option.short}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-[34px] font-bold text-[#34405a]">Time Range</p>
        <div className="grid gap-4 lg:grid-cols-4">
          {windowOptions.map((option) => {
            const selected = localConfig.window === option.value;
            return (
              <button
                key={option.value}
                className={`metric-card min-h-[132px] p-5 text-left transition ${option.bg} ${selected ? "ring-4 ring-white/55" : "opacity-85 hover:opacity-100"}`}
                onClick={() => setLocalConfig((prev) => ({ ...prev, window: option.value }))}
                type="button"
              >
                <div className="text-[35px] font-extrabold text-[#2c3a53]">{option.label}</div>
                <div className="mt-1 text-[30px] font-bold text-[#445068]">{option.hours}</div>
              </button>
            );
          })}
          <div className="metric-card min-h-[132px] bg-[#acd9c1] p-5 opacity-80">
            <div className="text-[35px] font-extrabold text-[#2c3a53]">All Day</div>
            <div className="mt-1 text-[30px] font-bold text-[#445068]">6 AM - 12 AM</div>
          </div>
        </div>
      </div>

      <p className="text-[24px] font-semibold text-[#6d7383]">Examples: Seattle, WA, 94105, 40.7128,-74.0060</p>

      {(localError || errorMessage) && (
        <p className="rounded-2xl border border-rose-200 bg-rose-100 px-4 py-3 text-[24px] font-bold text-rose-700">
          {localError || errorMessage}
        </p>
      )}
    </form>
  );
}
