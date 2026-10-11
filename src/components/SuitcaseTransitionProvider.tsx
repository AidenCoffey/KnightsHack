"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { SuitcaseTransitionOverlay } from "@/components/SuitcaseTransitionOverlay";
import { FALLBACK_AIRPORTS } from "@/lib/airport-data";

export interface TransitionParams {
  targetIata?: string;
  targetCity?: string;
  targetUrl?: string;
  origin?: string;
}

export interface SuitcaseTransitionContextType {
  triggerTransition: (params?: TransitionParams) => void;
  isTransitionActive: boolean;
}

const SuitcaseTransitionContext = createContext<SuitcaseTransitionContextType | undefined>(undefined);

export function useSuitcaseTransition() {
  const context = useContext(SuitcaseTransitionContext);
  if (!context) {
    throw new Error("useSuitcaseTransition must be used within a SuitcaseTransitionProvider");
  }
  return context;
}

export function SuitcaseTransitionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isActive, setIsActive] = useState(false);
  const [targetIata, setTargetIata] = useState("ZRH");
  const [targetCity, setTargetCity] = useState("Zurich");
  const [targetUrl, setTargetUrl] = useState("/travel-readiness");

  const isActiveRef = useRef(false);
  isActiveRef.current = isActive;

  const targetUrlRef = useRef(targetUrl);
  targetUrlRef.current = targetUrl;

  const triggerTransition = useCallback((params?: TransitionParams) => {
    if (isActiveRef.current) return;

    let destCode = (params?.targetIata || "").trim().toUpperCase();
    let destCity = params?.targetCity || "";
    let url = params?.targetUrl || "/travel-readiness";

    // If destination code was not provided directly but targetUrl has query params, extract it
    if (!destCode && url.includes("dest=")) {
      try {
        const parsedUrl = new URL(url, "http://localhost");
        const urlDest = parsedUrl.searchParams.get("dest");
        if (urlDest) destCode = urlDest.trim().toUpperCase();
      } catch {
        // fallback
      }
    }

    if (!destCode) {
      destCode = "ZRH";
    }

    if (!destCity) {
      const match = FALLBACK_AIRPORTS.find((a) => a.iata.toUpperCase() === destCode);
      destCity = match?.city || destCode;
    }

    setTargetIata(destCode);
    setTargetCity(destCity);
    setTargetUrl(url);
    setIsActive(true);
  }, []);

  const handleComplete = useCallback(() => {
    const destUrl = targetUrlRef.current || "/travel-readiness";
    // Swap the route while the solid cover is still up, then hard-cut
    // the overlay (no fade) so the page change never shows through the blur.
    router.push(destUrl);
    requestAnimationFrame(() => {
      setTimeout(() => {
        setIsActive(false);
      }, 80);
    });
  }, [router]);

  // Global click listener to intercept ANY link navigating to /travel-readiness across the entire app
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (isActiveRef.current) {
        // If already animating, prevent any repeated clicks
        const clickedEl = (e.target as HTMLElement)?.closest?.("a, button");
        if (clickedEl) {
          e.preventDefault();
          e.stopPropagation();
        }
        return;
      }

      // Ignore non-primary click or modified clicks (cmd/ctrl for new tab)
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      const anchor = (e.target as HTMLElement)?.closest?.("a");
      if (anchor) {
        const href = anchor.getAttribute("href");
        if (href && (href === "/travel-readiness" || href.startsWith("/travel-readiness?") || href.startsWith("/travel-readiness/"))) {
          e.preventDefault();
          e.stopPropagation();

          let dest = "ZRH";
          let origin = "";
          try {
            const parsedUrl = new URL(href, window.location.origin);
            dest = parsedUrl.searchParams.get("dest")?.toUpperCase() || "ZRH";
            origin = parsedUrl.searchParams.get("origin") || "";
          } catch {
            // ignore
          }

          const match = FALLBACK_AIRPORTS.find((a) => a.iata.toUpperCase() === dest);
          const city = match?.city || dest;

          triggerTransition({
            targetIata: dest,
            targetCity: city,
            targetUrl: href,
            origin: origin || undefined,
          });
        }
      }
    };

    window.addEventListener("click", handleClick, { capture: true });
    return () => {
      window.removeEventListener("click", handleClick, { capture: true });
    };
  }, [triggerTransition]);

  return (
    <SuitcaseTransitionContext.Provider value={{ triggerTransition, isTransitionActive: isActive }}>
      {children}
      <SuitcaseTransitionOverlay
        isActive={isActive}
        targetIata={targetIata}
        targetCity={targetCity}
        onComplete={handleComplete}
      />
    </SuitcaseTransitionContext.Provider>
  );
}
