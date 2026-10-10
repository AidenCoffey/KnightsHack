"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Database, Clock, Zap, Calculator } from "lucide-react";
import type { ScoredOrigin } from "@/types";

interface DebugDrawerProps {
  open: boolean;
  onClose: () => void;
  selected: ScoredOrigin | null;
  timeValue: number;
}

function Row({ label, value, mono = false }: { label: string; value: string | number | boolean; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5 border-b border-border last:border-0">
      <span className="text-xs text-muted-foreground flex-shrink-0">{label}</span>
      <span className={`text-xs font-medium text-right ${mono ? "font-mono" : ""}`}>
        {String(value)}
      </span>
    </div>
  );
}

export function DebugDrawer({ open, onClose, selected, timeValue }: DebugDrawerProps) {
  const debug = selected?.providerDebug;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-2xl max-h-80 overflow-y-auto"
        >
          <div className="max-w-screen-2xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Database className="h-4 w-4 text-primary" />
                Debug Panel
                {selected && (
                  <span className="text-muted-foreground font-normal">
                    — {selected.airport.iata} / {selected.airport.city}
                  </span>
                )}
              </div>
              <button
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {!selected ? (
              <p className="text-xs text-muted-foreground">
                Select an airport from the map or results list to see debug info.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Provider info */}
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-xs font-semibold mb-2 text-primary">
                    <Zap className="h-3.5 w-3.5" />
                    Provider
                  </div>
                  {debug && (
                    <>
                      <Row label="Provider" value={debug.provider} />
                      <Row label="Response time" value={`${debug.responseTimeMs}ms`} />
                      <Row label="Cache hit" value={debug.cacheHit ? "Yes ✅" : "No — live fetch"} />
                      <Row label="Freshness" value={debug.freshness} />
                      <Row label="Fare source" value={selected.fare?.source ?? "N/A"} />
                      <Row label="Ground source" value={selected.groundLeg.source} />
                    </>
                  )}
                </div>

                {/* Scoring formula */}
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-xs font-semibold mb-2 text-primary">
                    <Calculator className="h-3.5 w-3.5" />
                    Scoring Formula
                  </div>
                  {debug && (
                    <>
                      <Row label="Fare (f)" value={`€${debug.formulaInputs.fare.toFixed(2)}`} />
                      <Row label="Ground cost (g)" value={`€${debug.formulaInputs.groundCost.toFixed(2)}`} />
                      <Row label="Ground hours (h)" value={`${debug.formulaInputs.groundHours.toFixed(2)}h`} />
                      <Row label="Time value (v)" value={`$${timeValue}/hr`} />
                      <Row label="Time cost (h × v)" value={`€${(debug.formulaInputs.groundHours * timeValue).toFixed(2)}`} />
                      <Row label="Total = f + g + (h×v)" value={`€${(debug.formulaInputs.fare + debug.formulaInputs.groundCost + debug.formulaInputs.groundHours * timeValue).toFixed(2)}`} mono />
                    </>
                  )}
                </div>

                {/* Airport data */}
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-xs font-semibold mb-2 text-primary">
                    <Clock className="h-3.5 w-3.5" />
                    Airport Data
                  </div>
                  <Row label="IATA" value={selected.airport.iata} mono />
                  <Row label="City" value={selected.airport.city} />
                  <Row label="Country" value={selected.airport.country} />
                  <Row label="Coordinates" value={`${selected.airport.lat.toFixed(4)}, ${selected.airport.lon.toFixed(4)}`} mono />
                  <Row label="Distance" value={`${Math.round(selected.distanceMiles)} mi`} />
                  <Row label="Ground mode" value={selected.groundLeg.mode} />
                  {selected.groundLeg.captureDate && (
                    <Row label="Fare captured" value={selected.groundLeg.captureDate} />
                  )}
                </div>
              </div>
            )}

            <p className="text-[10px] text-muted-foreground mt-3 pt-2 border-t border-border">
              Press D to close • Formula: Total = Fare + Ground + (Ground hours × $/hr time value)
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
