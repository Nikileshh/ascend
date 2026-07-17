"use client";

import { useEffect, useState } from "react";
import { api } from "./api";
import { DEFAULT_COPY } from "./copy";

// One fetch per page load, shared by every section that renders copy.
let cached: Record<string, string> | null = null;
let inflight: Promise<Record<string, string>> | null = null;

function fetchCopy() {
  inflight ??= api<{ copy: Record<string, string> }>("/content")
    .then((r) => {
      cached = r.copy ?? {};
      return cached;
    })
    .catch(() => {
      inflight = null; // allow a retry on next mount
      return {};
    });
  return inflight;
}

/**
 * Returns the site wording: admin overrides merged over the defaults.
 * Renders defaults immediately, then swaps in overrides once loaded.
 */
export function useCopy() {
  const [copy, setCopy] = useState<Record<string, string>>(() =>
    cached ? { ...DEFAULT_COPY, ...cached } : DEFAULT_COPY,
  );

  useEffect(() => {
    if (cached) return;
    let alive = true;
    fetchCopy().then((overrides) => {
      if (alive && Object.keys(overrides).length)
        setCopy({ ...DEFAULT_COPY, ...overrides });
    });
    return () => {
      alive = false;
    };
  }, []);

  return copy;
}
