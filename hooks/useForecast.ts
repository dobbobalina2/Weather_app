"use client";

import { useQuery } from "@tanstack/react-query";

import type { CompareViewModel } from "@/types/weather";

export class ForecastError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

export function useForecast(params: {
  location: string;
  day: string;
  window: string;
  weekOffset: number;
}) {
  return useQuery<CompareViewModel, ForecastError>({
    queryKey: ["forecast", params],
    queryFn: async () => {
      const query = new URLSearchParams({
        location: params.location,
        day: params.day,
        window: params.window,
        weekOffset: String(params.weekOffset)
      });
      const response = await fetch(`/api/forecast?${query.toString()}`);

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: { code?: string; message?: string } }
          | null;
        throw new ForecastError(
          payload?.error?.code ?? "UNKNOWN",
          payload?.error?.message ?? "Unable to fetch forecast"
        );
      }

      return (await response.json()) as CompareViewModel;
    },
    enabled: params.location.trim().length >= 2,
    retry: false
  });
}
