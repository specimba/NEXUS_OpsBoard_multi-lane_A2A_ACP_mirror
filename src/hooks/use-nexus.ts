"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refreshedAt: number | null;
}

/**
 * Polling JSON fetch hook for the NEXUS ops board.
 * @param url API route URL (relative).
 * @param intervalMs refresh interval (default 8s).
 */
export function useNexusFetch<T>(
  url: string,
  intervalMs = 8000,
): FetchState<T> & { refresh: () => void } {
  const [state, setState] = useState<FetchState<T>>({
    data: null,
    loading: true,
    error: null,
    refreshedAt: null,
  });
  const abortRef = useRef<AbortController | null>(null);

  const doFetch = useCallback(() => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    fetch(url, { signal: controller.signal, cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as T;
        setState({
          data: json,
          loading: false,
          error: null,
          refreshedAt: Date.now(),
        });
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        const message = err instanceof Error ? err.message : String(err);
        setState((s) => ({
          data: s.data,
          loading: false,
          error: message,
          refreshedAt: Date.now(),
        }));
      });
  }, [url]);

  useEffect(() => {
    doFetch();
    const id = setInterval(doFetch, intervalMs);
    return () => {
      clearInterval(id);
      abortRef.current?.abort();
    };
  }, [doFetch, intervalMs]);

  return { ...state, refresh: doFetch };
}
