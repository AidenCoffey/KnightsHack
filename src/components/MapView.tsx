"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type { ScoredOrigin } from "@/types";

const MapViewInner = dynamic(() => import("./MapViewInner"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-slate-50 dark:bg-slate-900/40">
      <div className="flex flex-col items-center gap-2">
        <span className="h-6 w-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        <span className="text-muted-foreground text-xs font-medium">Initializing Map…</span>
      </div>
    </div>
  ),
});

interface MapViewProps {
  results: ScoredOrigin[];
  selected: ScoredOrigin | null;
  onSelect: (r: ScoredOrigin) => void;
  homeAirport: string;
  destination?: string;
  isLoading: boolean;
}

export function MapView(props: MapViewProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-slate-50 dark:bg-slate-900/40">
        <span className="text-muted-foreground text-xs font-medium">Loading Map…</span>
      </div>
    );
  }

  return <MapViewInner {...props} />;
}
