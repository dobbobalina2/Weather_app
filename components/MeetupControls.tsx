"use client";

import { useCallback, useEffect, useState } from "react";
import { Clock3, Crosshair, MapPin } from "lucide-react";

import type { DayOfWeek, MeetupConfig, TimeWindowPreset } from "@/types/weather";

const dayOptions: { label: string; value: DayOfWeek }[] = [
  { label: "Monday", value: "mon" },
  { label: "Tuesday", value: "tue" },
  { label: "Wednesday", value: "wed" },
  { label: "Thursday", value: "thu" },
  { label: "Friday", value: "fri" },
  { label: "Saturday", value: "sat" },
  { label: "Sunday", value: "sun" }
];

const windowOptions: { label: string; value: TimeWindowPreset }[] = [
  { label: "Morning", value: "morning" },
  { label: "Afternoon", value: "afternoon" },
  { label: "Evening", value: "evening" }
];

interface Props {
  config: MeetupConfig;
  errorMessage?: string;
  onApply: (config: MeetupConfig) => void;
}

const LOCATION_DEBOUNCE_MS = 550;

export function MeetupControls({ config, errorMessage, onApply }: Props) {
  const [localConfig, setLocalConfig] = useState(config);
  const [localError, setLocalError] = useState<string | undefined>();
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  const submitConfig = useCallback(
    (nextConfig: MeetupConfig, showValidationError = true) => {
      const trimmedLocation = nextConfig.location.trim();

      if (trimmedLocation.length < 2) {
        if (showValidationError) {
          setLocalError("Please enter a real location (for example: Austin, TX or 10001).");
        }
        return;
      }

      setLocalError(undefined);
      onApply({ ...nextConfig, location: trimmedLocation });
    },
    [onApply]
  );

  useEffect(() => {
    const nextLocation = localConfig.location.trim();
    const currentLocation = config.location.trim();

    if (nextLocation === currentLocation) {
      return;
    }

    const timer = window.setTimeout(() => {
      submitConfig(localConfig, false);
    }, LOCATION_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [config.location, localConfig, submitConfig]);

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submitConfig(localConfig, true);
  };

  const handleDayChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const next = { ...localConfig, day: event.target.value as DayOfWeek };
    setLocalConfig(next);
    submitConfig(next, true);
  };

  const handleWindowChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const next = { ...localConfig, window: event.target.value as TimeWindowPreset };
    setLocalConfig(next);
    submitConfig(next, true);
  };

  const handleUseCurrentLocation = async () => {
    if (!navigator.geolocation) {
      setLocalError("Current location is unavailable in this browser.");
      return;
    }

    setIsLocating(true);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10_000,
          maximumAge: 60_000
        });
      });

      const latitude = position.coords.latitude.toFixed(5);
      const longitude = position.coords.longitude.toFixed(5);
      const location = `${latitude},${longitude}`;
      const next = { ...localConfig, location };

      setLocalConfig(next);
      submitConfig(next, true);
    } catch {
      setLocalError("Could not read your current location. Please allow location access and retry.");
    } finally {
      setIsLocating(false);
    }
  };

  return (
    <form className="px-1 py-2 md:px-2 md:py-3" onSubmit={submit}>
      <div className="pb-3 md:pb-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto] lg:items-center">
          <label className="min-w-0" htmlFor="location-input">
            <span className="sr-only">Location</span>
            <div className="flex items-center gap-2 border-b border-[#2f36434a] px-1 py-2">
              <MapPin className="h-5 w-5 shrink-0 text-[#3d4761]" strokeWidth={2.3} />
              <input
                className="w-full min-w-0 appearance-none border-none bg-transparent text-[15px] font-semibold text-[#364058] placeholder:text-[#7f8799] focus:outline-none md:text-[16px]"
                id="location-input"
                placeholder="City, State • lat,long • exact address"
                type="text"
                value={localConfig.location}
                onChange={(event) => setLocalConfig((prev) => ({ ...prev, location: event.target.value }))}
              />
            </div>
            <button
              className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-[#4a5771] hover:text-[#2f3951] disabled:opacity-50 md:text-sm"
              onClick={handleUseCurrentLocation}
              type="button"
              disabled={isLocating}
            >
              <Crosshair className="h-3.5 w-3.5" />
              <span>{isLocating ? "Finding location..." : "Use current location"}</span>
            </button>
          </label>

          <label className="flex items-center gap-2 border-b border-[#2f36434a] px-1 py-2 text-[15px] font-bold text-[#2f3951] md:text-[16px]">
            <Clock3 className="h-4 w-4 shrink-0" />
            <span className="whitespace-nowrap">Every</span>
            <select
              className="rounded-md border-none bg-transparent pr-2 text-[15px] font-bold text-[#2f3951] focus:outline-none md:text-[16px]"
              value={localConfig.day}
              onChange={handleDayChange}
            >
              {dayOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center border-b border-[#2f36434a] px-1 py-2 text-[15px] font-bold text-[#2f3951] md:text-[16px]">
            <span className="sr-only">Time window</span>
            <select
              className="rounded-md border-none bg-transparent pr-2 text-[15px] font-bold text-[#2f3951] focus:outline-none md:text-[16px]"
              value={localConfig.window}
              onChange={handleWindowChange}
            >
              {windowOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {(localError || errorMessage) && (
        <p className="mt-3 rounded-2xl border border-rose-200 bg-rose-100 px-4 py-3 text-sm font-bold text-rose-700">
          {localError || errorMessage}
        </p>
      )}
    </form>
  );
}
