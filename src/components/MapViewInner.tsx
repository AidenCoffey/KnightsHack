"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import L from "leaflet";
import type { ScoredOrigin, Airport } from "@/types";
import { savingsColor } from "@/lib/scoring";
import { FALLBACK_AIRPORTS } from "@/lib/airport-data";
import { formatCurrencyPrice } from "@/lib/currency";
import { Layers, Check, Crosshair } from "lucide-react";

interface MapViewInnerProps {
  results: ScoredOrigin[];
  selected: ScoredOrigin | null;
  onSelect: (r: ScoredOrigin) => void;
  /** When false, frame the search radius with no flight path */
  showRoute?: boolean;
  homeAirport: string;
  homeAirportData?: Airport | null;
  destination?: string;
  currency?: string;
  isLoading: boolean;
  radiusMiles?: number;
}

type MapProvider = "dark" | "osm" | "aviation" | "satellite";

interface TileConfig {
  name: string;
  url: string;
  attribution: string;
  maxZoom: number;
}

const TILE_CONFIGS: Record<MapProvider, TileConfig> = {
  dark: {
    name: "Dark Canvas",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ",
    maxZoom: 16,
  },
  osm: {
    name: "OpenStreetMap",
    url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  },
  aviation: {
    name: "Aviation Gray (Esri)",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ",
    maxZoom: 16,
  },
  satellite: {
    name: "Satellite (Esri)",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP",
    maxZoom: 18,
  },
};

const WORLD_MAX_BOUNDS: L.LatLngBoundsLiteral = [
  [-85.051129, -180],
  [85.051129, 180],
];

function formatPrice(price: number, currency: string = "EUR"): string {
  return formatCurrencyPrice(price, currency);
}

function formatDuration(hours: number): string {
  const totalMinutes = Math.round(hours * 60);
  if (totalMinutes < 60) {
    return `${totalMinutes} min`;
  }
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function getBestDeal(results: ScoredOrigin[]): ScoredOrigin | null {
  const withFares = results.filter((r) => r.fare !== null);
  if (withFares.length === 0) return null;
  return withFares.reduce((a, b) => (a.totalCost <= b.totalCost ? a : b));
}

/** Geographic bounds for a radius in meters — does not require the circle to be on a map. */
function latLngBoundsFromRadius(lat: number, lon: number, radiusMeters: number): L.LatLngBounds {
  const latDelta = radiusMeters / 111320;
  const lonScale = Math.cos((lat * Math.PI) / 180);
  const lonDelta = lonScale > 0.01 ? radiusMeters / (111320 * lonScale) : latDelta;
  return L.latLngBounds(
    [lat - latDelta, lon - lonDelta],
    [lat + latDelta, lon + lonDelta]
  );
}

type LatLon = [number, number];

const GROUND_DRAW_MS = 600;
const FLIGHT_DRAW_MS = 1100;
const GROUND_DASH = 6;
const GROUND_GAP = 6;

/** Dash pattern + trailing gap so stroke-dashoffset can reveal a line that stays dotted. */
function dashedRevealStrokeArray(length: number, dash = GROUND_DASH, gap = GROUND_GAP): string {
  const cycle = dash + gap;
  const cycles = Math.max(1, Math.ceil(length / cycle) + 2);
  const parts: number[] = [];
  for (let i = 0; i < cycles; i++) {
    parts.push(dash, gap);
  }
  parts.push(length);
  return parts.join(" ");
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/** Resolves once the map has no camera animation running (flyTo zooms re-render paths). */
function waitForMapIdle(map: L.Map, isMoving: () => boolean): Promise<void> {
  if (!isMoving()) return Promise.resolve();
  return new Promise((resolve) => {
    const done = () => {
      map.off("moveend", done);
      window.clearTimeout(fallback);
      // One extra frame so Leaflet finishes rewriting SVG paths at the new zoom
      requestAnimationFrame(() => resolve());
    };
    map.on("moveend", done);
    const fallback = window.setTimeout(done, 1600);
  });
}

/**
 * How much of the SVG path sits in (or just past) the current viewport.
 * Long-haul routes are mostly off-screen — animating the full length makes the
 * visible stub finish in a few frames and look like it "isn't animating".
 */
function visibleDrawLength(el: SVGPathElement, map: L.Map, total: number): number {
  if (total <= 0) return 0;
  const bounds = map.getBounds().pad(0.4);
  const step = Math.max(6, total / 180);
  let lastInside = 0;
  for (let d = 0; d <= total; d += step) {
    const pt = el.getPointAtLength(d);
    const ll = map.layerPointToLatLng(L.point(pt.x, pt.y));
    if (bounds.contains(ll)) {
      lastInside = d;
    } else if (d > 0) {
      // Draw a little past the edge so the line clearly exits the frame
      return Math.min(total, Math.max(lastInside, d) + step * 4);
    }
  }
  return total;
}

/**
 * rAF stroke reveal — avoids Leaflet setStyle (which wipes dasharray) and CSS transitions
 * (which often no-op when the SVG path is still being attached).
 */
function animateStrokeDraw(
  map: L.Map,
  polyline: L.Polyline,
  durationMs: number,
  signal: { cancelled: boolean },
  dotted = false
): Promise<void> {
  return new Promise((resolve) => {
    const opacity = dotted ? 0.9 : 0.95;
    let raf = 0;
    let done = false;

    const finish = (el: SVGPathElement | null) => {
      if (done) return;
      done = true;
      if (raf) cancelAnimationFrame(raf);
      if (el && !signal.cancelled) {
        el.style.transition = "none";
        el.style.strokeDashoffset = "0";
        if (dotted) {
          el.style.strokeDasharray = `${GROUND_DASH}, ${GROUND_GAP}`;
        } else {
          el.style.removeProperty("stroke-dasharray");
          el.removeAttribute("stroke-dasharray");
        }
        el.setAttribute("stroke-opacity", String(opacity));
        el.style.opacity = "1";
      }
      resolve();
    };

    const run = (el: SVGPathElement, length: number) => {
      // Touch the SVG node directly — never polyline.setStyle during the draw
      el.style.transition = "none";
      el.style.opacity = "1";
      el.setAttribute("stroke-opacity", String(opacity));
      el.style.strokeDasharray = dotted ? dashedRevealStrokeArray(length) : `${length}`;
      el.style.strokeDashoffset = `${length}`;
      void el.getBoundingClientRect();

      // Animate only the on-screen portion over the full duration, then show the rest
      const drawLen = Math.max(
        Math.min(length, visibleDrawLength(el, map, length)),
        Math.min(length, 24)
      );

      const t0 = performance.now();
      const tick = (now: number) => {
        if (signal.cancelled) {
          finish(null);
          return;
        }
        // If Leaflet replaced the node (zoom/pan), snap to finished on the new node
        const live = polyline.getElement() as SVGPathElement | null;
        if (!live) {
          finish(null);
          return;
        }
        if (live !== el) {
          finish(live);
          return;
        }

        const t = Math.min(1, (now - t0) / durationMs);
        const revealed = drawLen * easeOutCubic(t);
        live.style.strokeDashoffset = String(length - revealed);
        if (t < 1) {
          raf = requestAnimationFrame(tick);
        } else {
          finish(live);
        }
      };
      raf = requestAnimationFrame(tick);
    };

    const start = () => {
      if (signal.cancelled) {
        finish(null);
        return;
      }
      const el = polyline.getElement() as SVGPathElement | null;
      const length = el?.getTotalLength?.() ?? 0;
      if (el && length > 0) {
        run(el, length);
        return;
      }
      // Path not ready — one more try next frame
      raf = requestAnimationFrame(() => {
        if (signal.cancelled) {
          finish(null);
          return;
        }
        const retry = polyline.getElement() as SVGPathElement | null;
        const len = retry?.getTotalLength?.() ?? 0;
        if (!retry || !(len > 0)) {
          finish(retry);
          return;
        }
        run(retry, len);
      });
    };

    // Two frames: Leaflet must attach the <path> before getTotalLength works
    raf = requestAnimationFrame(() => {
      raf = requestAnimationFrame(start);
    });
  });
}

export default function MapViewInner({
  results,
  selected,
  onSelect,
  showRoute = false,
  homeAirport,
  homeAirportData: homeAirportProp,
  destination,
  currency = "EUR",
  isLoading,
  radiusMiles = 300,
}: MapViewInnerProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const overlayLayerRef = useRef<L.LayerGroup | null>(null);
  const routeLayerRef = useRef<L.LayerGroup | null>(null);
  const radiusLayerRef = useRef<L.LayerGroup | null>(null);
  const baseTileLayerRef = useRef<L.TileLayer | null>(null);
  const referenceTileLayerRef = useRef<L.TileLayer | null>(null);
  const lastCameraKeyRef = useRef<string>("");
  const hasFramedHubClusterRef = useRef(false);
  const groundLineRef = useRef<L.Polyline | null>(null);
  const flightLineRef = useRef<L.Polyline | null>(null);
  const lastDrawnRouteKeyRef = useRef<string>("");
  const cameraMovingRef = useRef(false);

  const [activeProvider, setActiveProvider] = useState<MapProvider>("aviation");
  const [showLayerMenu, setShowLayerMenu] = useState(false);

  const markCameraMoving = useCallback((map: L.Map) => {
    cameraMovingRef.current = true;
    map.once("moveend", () => {
      cameraMovingRef.current = false;
    });
  }, []);

  /** Smooth camera move — stops any in-flight pan/zoom first to avoid jitter. */
  const smoothFlyToBounds = useCallback(
    (
      bounds: L.LatLngBounds,
      options: { padding?: [number, number]; maxZoom?: number; duration?: number } = {}
    ) => {
      const map = mapRef.current;
      if (!map || !bounds?.isValid?.()) return;
      try {
        map.stop();
        markCameraMoving(map);
        map.flyToBounds(bounds, {
          padding: options.padding ?? [80, 80],
          maxZoom: options.maxZoom ?? 8,
          duration: options.duration ?? 1.15,
          easeLinearity: 0.2,
        });
      } catch (err) {
        console.warn("Map flyToBounds skipped:", err);
      }
    },
    [markCameraMoving]
  );

  const smoothFlyTo = useCallback(
    (center: L.LatLngExpression, zoom: number, duration = 1.15) => {
      const map = mapRef.current;
      if (!map) return;
      try {
        map.stop();
        markCameraMoving(map);
        map.flyTo(center, zoom, { duration, easeLinearity: 0.2 });
      } catch (err) {
        console.warn("Map flyTo skipped:", err);
      }
    },
    [markCameraMoving]
  );

  const airportCacheRef = useRef<Map<string, Airport>>(new Map());
  const [homeAirportObj, setHomeAirportObj] = useState<Airport | null>(null);
  const [destAirportObj, setDestAirportObj] = useState<Airport | null>(null);

  // Helper to reliably resolve airport coordinates from results, fallback list, cache, or props
  const resolveAirportData = useCallback(
    (code?: string): Airport | null => {
      if (!code) return null;
      const upper = code.trim().toUpperCase();
      if (homeAirportProp && homeAirportProp.iata.toUpperCase() === upper) {
        return homeAirportProp;
      }
      if (airportCacheRef.current.has(upper)) return airportCacheRef.current.get(upper)!;
      const inRes = results.find((r) => r.airport.iata.toUpperCase() === upper)?.airport;
      if (inRes) {
        airportCacheRef.current.set(upper, inRes);
        return inRes;
      }
      const inFb = FALLBACK_AIRPORTS.find((a) => a.iata.toUpperCase() === upper);
      if (inFb) {
        airportCacheRef.current.set(upper, inFb);
        return inFb;
      }
      return null;
    },
    [homeAirportProp, results]
  );

  const bestDeal = useMemo(() => getBestDeal(results), [results]);
  const bestDealIata = bestDeal?.airport.iata ?? null;

  // Asynchronously resolve home airport if not present in memory
  useEffect(() => {
    if (!homeAirport) {
      setHomeAirportObj(null);
      return;
    }
    const upper = homeAirport.trim().toUpperCase();
    const resolved = resolveAirportData(upper);
    if (resolved) {
      setHomeAirportObj(resolved);
    } else {
      fetch(`/api/airports?q=${encodeURIComponent(upper)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.airports && data.airports.length > 0) {
            const match = data.airports.find((a: Airport) => a.iata.toUpperCase() === upper) || data.airports[0];
            if (match) {
              airportCacheRef.current.set(upper, match);
              setHomeAirportObj(match);
            }
          }
        })
        .catch((e) => console.warn("Failed resolving home airport:", e));
    }
  }, [homeAirport, resolveAirportData]);

  // Asynchronously resolve destination airport if not present in memory
  useEffect(() => {
    if (!destination) {
      setDestAirportObj(null);
      return;
    }
    const upper = destination.trim().toUpperCase();
    const resolved = resolveAirportData(upper);
    if (resolved) {
      setDestAirportObj(resolved);
    } else {
      fetch(`/api/airports?q=${encodeURIComponent(upper)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.airports && data.airports.length > 0) {
            const match = data.airports.find((a: Airport) => a.iata.toUpperCase() === upper) || data.airports[0];
            if (match) {
              airportCacheRef.current.set(upper, match);
              setDestAirportObj(match);
            }
          }
        })
        .catch((e) => console.warn("Failed resolving destination airport:", e));
    }
  }, [destination, resolveAirportData]);

  // Safely configure icons on mount inside browser
  useEffect(() => {
    try {
      if (typeof window !== "undefined" && L.Icon && L.Icon.Default && L.Icon.Default.prototype) {
        delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
          iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
          shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        });
      }
    } catch (e) {
      console.warn("Leaflet icon setup notice:", e);
    }
  }, []);

  // Update base tile layer based on active provider
  const updateTileLayer = useCallback(
    (provider: MapProvider, key?: string) => {
      if (!mapRef.current) return;

      if (baseTileLayerRef.current) {
        mapRef.current.removeLayer(baseTileLayerRef.current);
        baseTileLayerRef.current = null;
      }
      if (referenceTileLayerRef.current) {
        mapRef.current.removeLayer(referenceTileLayerRef.current);
        referenceTileLayerRef.current = null;
      }

      const cfg = TILE_CONFIGS[provider];
      const tileUrl = cfg.url;

      try {
        const newLayer = L.tileLayer(tileUrl, {
          attribution: cfg.attribution,
          maxZoom: cfg.maxZoom,
          minZoom: 2,
          bounds: WORLD_MAX_BOUNDS,
          noWrap: true,
          tileSize: 256,
          zoomOffset: 0,
        }).addTo(mapRef.current);

        baseTileLayerRef.current = newLayer;

        // Add reference overlays for labels and borders
        if (provider === "dark") {
          const refLayer = L.tileLayer(
            "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}",
            { maxZoom: 16, minZoom: 2, bounds: WORLD_MAX_BOUNDS, noWrap: true }
          ).addTo(mapRef.current);
          referenceTileLayerRef.current = refLayer;
        } else if (provider === "aviation") {
          const refLayer = L.tileLayer(
            "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}",
            { maxZoom: 16, minZoom: 2, bounds: WORLD_MAX_BOUNDS, noWrap: true }
          ).addTo(mapRef.current);
          referenceTileLayerRef.current = refLayer;
        }
      } catch (err) {
        console.error("Tile layer error, falling back to OSM:", err);
        // Fallback to OSM
        L.tileLayer(TILE_CONFIGS.osm.url, {
          attribution: TILE_CONFIGS.osm.attribution,
          maxZoom: 19,
          minZoom: 2,
          bounds: WORLD_MAX_BOUNDS,
          noWrap: true,
        }).addTo(mapRef.current);
      }
    },
    []
  );

  // Initialize Map
  useEffect(() => {
    if (mapRef.current || !mapContainerRef.current) return;

    const upperHome = (homeAirport || "").trim().toUpperCase();
    const home =
      (homeAirportProp && homeAirportProp.iata.toUpperCase() === upperHome ? homeAirportProp : null) ||
      (upperHome ? results.find((r) => r.airport.iata.toUpperCase() === upperHome)?.airport : null) ||
      (upperHome ? airportCacheRef.current.get(upperHome) : null) ||
      (upperHome ? FALLBACK_AIRPORTS.find((a) => a.iata.toUpperCase() === upperHome) : null) ||
      FALLBACK_AIRPORTS.find((a) => a.iata === "BTS") ||
      FALLBACK_AIRPORTS[0];

    const initialRadiusMeters = (radiusMiles || 300) * 1609.34;
    const initialBounds = latLngBoundsFromRadius(home.lat, home.lon, initialRadiusMeters);

    try {
      const map = L.map(mapContainerRef.current, {
        center: [home.lat, home.lon],
        zoom: 7,
        minZoom: 2,
        maxBounds: WORLD_MAX_BOUNDS,
        maxBoundsViscosity: 1.0,
        bounceAtZoomLimits: false,
        zoomControl: false,
      });

      // Automatically set into place: fit the home hub and overland transit radius
      map.fitBounds(initialBounds, {
        padding: [36, 36],
        maxZoom: 8,
        animate: false,
      });

      mapRef.current = map;

      overlayLayerRef.current = L.layerGroup().addTo(mapRef.current);
      routeLayerRef.current = L.layerGroup().addTo(mapRef.current);
      radiusLayerRef.current = L.layerGroup().addTo(mapRef.current);

      updateTileLayer(activeProvider);

      // Invalidate size once DOM layout is settled and ensure cleanly framed in place
      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.invalidateSize({ animate: false });
          if (!hasFramedHubClusterRef.current && !showRoute) {
            const currentHome =
              (homeAirportProp && homeAirportProp.iata.toUpperCase() === upperHome ? homeAirportProp : null) ||
              (upperHome ? results.find((r) => r.airport.iata.toUpperCase() === upperHome)?.airport : null) ||
              (upperHome ? airportCacheRef.current.get(upperHome) : null) ||
              (upperHome ? FALLBACK_AIRPORTS.find((a) => a.iata.toUpperCase() === upperHome) : null) ||
              home;
            const currentRadiusMeters = (radiusMiles || 300) * 1609.34;
            mapRef.current.fitBounds(
              latLngBoundsFromRadius(currentHome.lat, currentHome.lon, currentRadiusMeters),
              {
                padding: [36, 36],
                maxZoom: 8,
                animate: false,
              }
            );
          }
        }
      }, 250);
    } catch (err) {
      console.error("Failed to initialize map:", err);
    }

    // Debounce size invalidation so rapid layout changes (toolbar open/close,
    // window drag) don't thrash Leaflet every animation frame.
    let resizeObserver: ResizeObserver | null = null;
    let resizeTimer: ReturnType<typeof setTimeout> | null = null;
    if (typeof ResizeObserver !== "undefined" && mapContainerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        if (resizeTimer) clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          mapRef.current?.invalidateSize({ animate: false });
        }, 120);
      });
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []); // Run once on mount

  // Watch for provider change
  useEffect(() => {
    updateTileLayer(activeProvider);
  }, [activeProvider, updateTileLayer]);

  // Reset camera guards when a new search clears results or home airport / radius changes
  useEffect(() => {
    lastCameraKeyRef.current = "";
    hasFramedHubClusterRef.current = false;
  }, [homeAirport, radiusMiles]);

  useEffect(() => {
    if (results.length === 0) {
      lastCameraKeyRef.current = "";
      hasFramedHubClusterRef.current = false;
    }
  }, [results.length]);

  // Center on Home Airport when homeAirport changes; auto-frame if no route is being inspected
  useEffect(() => {
    if (!mapRef.current) return;
    const home = homeAirportProp || homeAirportObj || resolveAirportData(homeAirport);
    if (home && !showRoute) {
      const radiusMeters = (radiusMiles || 300) * 1609.34;
      const bounds = latLngBoundsFromRadius(home.lat, home.lon, radiusMeters);
      const key = `home:${home.iata}:${radiusMiles}`;
      if (lastCameraKeyRef.current !== key) {
        lastCameraKeyRef.current = key;
        hasFramedHubClusterRef.current = true;
        smoothFlyToBounds(bounds, { padding: [36, 36], maxZoom: 8, duration: 0.9 });
      }
    }
  }, [homeAirport, homeAirportProp, homeAirportObj, radiusMiles, resolveAirportData, showRoute, smoothFlyToBounds]);

  // Draw refined, high-end Overland Transit Limit Radius Circle centered wherever the hub is
  useEffect(() => {
    if (!mapRef.current || !radiusLayerRef.current) return;
    radiusLayerRef.current.clearLayers();

    const homeAirportData = homeAirportProp || homeAirportObj || resolveAirportData(homeAirport);
    if (!homeAirportData) return;

    const effectiveRadiusMiles = radiusMiles || 300;
    const radiusMeters = effectiveRadiusMiles * 1609.34;

    // Single Perimeter Ring (Crisp dashed styling)
    L.circle([homeAirportData.lat, homeAirportData.lon], {
      radius: radiusMeters,
      color: "#B45309",
      weight: 1.8,
      opacity: 0.75,
      dashArray: "6, 7",
      fillColor: "#F59E0B",
      fillOpacity: 0.04,
      interactive: false,
    }).addTo(radiusLayerRef.current);
  }, [homeAirport, homeAirportProp, homeAirportObj, radiusMiles, resolveAirportData]);

  // Update Markers when results change
  useEffect(() => {
    if (!mapRef.current || !overlayLayerRef.current) return;

    overlayLayerRef.current.clearLayers();
    markersRef.current.clear();

    const homeAirportData = homeAirportProp || homeAirportObj || resolveAirportData(homeAirport);
    const destAirport = destAirportObj || resolveAirportData(destination);

    const validAirportCoords: [number, number][] = [];

    results.forEach((r) => {
      if (!r.fare && !isLoading) return;

      const isSelected = selected?.airport.iata === r.airport.iata;
      const isSaving = r.fare && r.savingsVsHome > 0;
      const isHome = r.airport.iata === homeAirport;
      const isBest = bestDealIata === r.airport.iata;
      const effectiveCurr = currency || r.fare?.currency || "EUR";
      const price = r.fare ? formatPrice(r.totalCost, effectiveCurr) : "N/A";

      const bubbleClass = [
        "price-bubble",
        isSelected ? "selected" : "",
        isBest && !isSelected ? "best-deal" : "",
        !isSelected && !isBest && isSaving ? "savings" : "",
        isHome ? "home-hub" : "",
      ]
        .filter(Boolean)
        .join(" ");

      const bestLabel =
        isBest && !isHome
          ? `<span style="font-size:9px;text-transform:uppercase;letter-spacing:0.04em;margin-right:4px;opacity:0.95;font-weight:800;">Best</span>`
          : "";
      const homeLabel = isHome
        ? `<span style="font-size:9px;text-transform:uppercase;letter-spacing:0.04em;margin-right:4px;opacity:0.9;font-weight:700;">Home</span>`
        : "";

      const icon = L.divIcon({
        className: "",
        html: `<div class="${bubbleClass}">${homeLabel}${bestLabel}${price}</div>`,
        iconAnchor: [isHome || isBest ? 40 : 28, 14],
        iconSize: [isHome || isBest ? 80 : 56, 28],
      });

      const marker = L.marker([r.airport.lat, r.airport.lon], { icon })
        .bindPopup(`
          <div style="min-width:180px; font-family: -apple-system, BlinkMacSystemFont, Roboto, sans-serif; color: #0F172A;">
            ${isHome ? `<div style="font-size:10px;font-weight:700;color:#1E3A8A;text-transform:uppercase;margin-bottom:2px">Home Departure Hub</div>` : ""}
            <div style="font-weight:700;font-size:14px;margin-bottom:2px;color:#0F172A;">
              ${r.airport.iata} — ${r.airport.city}
            </div>
            <div style="font-size:12px;color:#64748B;margin-bottom:8px">${r.airport.name}</div>
            ${
              r.fare
                ? `
              <div style="font-size:20px;font-weight:800;color:${isSaving ? "#92400E" : "#0F172A"};margin-bottom:2px">${price}</div>
              <div style="font-size:11px;color:#64748B;margin-bottom:8px">all-in route cost</div>
              <div style="font-size:12px;color:#334155;line-height:1.6;">
                ✈️ Flight: <strong>${formatPrice(r.fare.price, effectiveCurr)}</strong><br/>
                ${r.groundLeg.mode.toLowerCase().includes("bus") ? "🚌 Coach/Bus" : "🚆 Train/Rail"} (${formatDuration(r.groundLeg.duration)}): <strong>${formatPrice(r.groundLeg.price, effectiveCurr)}</strong><br/>
                ⏱️ Time valuation: <strong>${formatPrice(r.breakdown.timeCost, effectiveCurr)}</strong>
              </div>
              ${
                r.savingsVsHome > 0
                  ? `<div style="font-size:12px;color:#92400E;background:#FEF3C7;padding:3px 8px;border-radius:8px;font-weight:700;margin-top:6px;display:inline-block;">Save ${formatPrice(
                      r.savingsVsHome,
                      effectiveCurr
                    )} vs home</div>`
                  : ""
              }
              <div style="font-size:10px;color:#64748B;margin-top:6px">Source: ${r.fare.source}</div>
              <div style="margin-top:8px;padding-top:6px;border-top:1px solid #E2E8F0;">
                <button onclick="window.dispatchEvent(new CustomEvent('open-trip-modal', { detail: '${r.airport.iata}' }))" style="width:100%;padding:5px 8px;border-radius:6px;background:#F59E0B;color:#0F172A;font-weight:700;font-size:11px;border:none;cursor:pointer;">
                  Enlarge Route Details ↗
                </button>
              </div>
            `
                : `<div style="color:#64748B">No fare found</div>`
            }
          </div>
        `)
        .on("click", () => onSelect(r));

      marker.addTo(overlayLayerRef.current!);
      markersRef.current.set(r.airport.iata, marker);
      validAirportCoords.push([r.airport.lat, r.airport.lon]);
    });

    // If home airport is not present in results, display a clean, subtle badge for home
    const hasHomeInResults = results.some((r) => r.airport.iata === homeAirport && (r.fare || isLoading));
    if (!hasHomeInResults && homeAirportData) {
      const homeIcon = L.divIcon({
        className: "",
        html: `<div style="
          background:#1E3A8A;
          color:#FFFFFF;
          padding:4px 10px;
          border-radius:9999px;
          font-size:11px;
          font-weight:700;
          white-space:nowrap;
          box-shadow:0 2px 8px rgba(30,58,138,0.25);
          border:1.5px solid #3B82F6;
          display:flex;
          align-items:center;
          gap:4px;
          cursor:pointer;
        ">
          <span>Home (${homeAirportData.iata})</span>
        </div>`,
        iconAnchor: [45, 14],
        iconSize: [90, 28],
      });
      L.marker([homeAirportData.lat, homeAirportData.lon], { icon: homeIcon })
        .bindPopup(`<strong>Home Hub: ${homeAirportData.city} (${homeAirportData.iata})</strong><br/><span style="color:#64748B">${homeAirportData.name}</span>`)
        .addTo(overlayLayerRef.current!);
      validAirportCoords.push([homeAirportData.lat, homeAirportData.lon]);
    }

    // Destination Marker: Just the pin icon!
    if (destAirport) {
      const destIcon = L.divIcon({
        className: "",
        html: `
          <div style="
            display: flex;
            flex-direction: column;
            align-items: center;
            cursor: pointer;
            filter: drop-shadow(0 4px 8px rgba(15, 23, 42, 0.35));
            transition: transform 0.15s ease-out;
          ">
            <svg width="26" height="34" viewBox="0 0 24 31" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 0C5.37258 0 0 5.37258 0 12C0 19.5 10.8 29.8 11.25 30.25C11.65 30.65 12.35 30.65 12.75 30.25C13.2 29.8 24 19.5 24 12C24 5.37258 18.6274 0 12 0Z" fill="#0F172A"/>
              <path d="M12 1.5C6.20101 1.5 1.5 6.20101 1.5 12C1.5 18.5 11 27.5 12 28.5C13 27.5 22.5 18.5 22.5 12C22.5 6.20101 17.799 1.5 12 1.5Z" stroke="#F59E0B" stroke-width="1.8"/>
              <circle cx="12" cy="11.5" r="4" fill="#F59E0B"/>
            </svg>
          </div>
        `,
        iconAnchor: [13, 33],
        iconSize: [26, 34],
      });
      const destLon =
        destAirport.lon > 180 || destAirport.lon < -180
          ? ((destAirport.lon + 180) % 360 + 360) % 360 - 180
          : destAirport.lon;
      L.marker([destAirport.lat, destLon], { icon: destIcon })
        .bindPopup(`
          <div style="font-family: -apple-system, BlinkMacSystemFont, Roboto, sans-serif; min-width: 140px; text-align: center; padding: 4px;">
            <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #B45309; margin-bottom: 2px;">
              Destination
            </div>
            <div style="font-size: 14px; font-weight: 800; color: #0F172A; margin-bottom: 2px;">
              ${destAirport.city} (${destAirport.iata})
            </div>
            <div style="font-size: 11px; color: #64748B;">
              ${destAirport.name}
            </div>
          </div>
        `)
        .addTo(overlayLayerRef.current!);
    }

    // Initial load: frame the search radius (no flight path yet)
    if (
      !showRoute &&
      homeAirportData &&
      mapRef.current &&
      !hasFramedHubClusterRef.current &&
      (validAirportCoords.length > 0 || results.length > 0)
    ) {
      hasFramedHubClusterRef.current = true;
      const radiusMeters = (radiusMiles || 300) * 1609.34;
      const radiusBounds = latLngBoundsFromRadius(
        homeAirportData.lat,
        homeAirportData.lon,
        radiusMeters
      );
      lastCameraKeyRef.current = `radius:${homeAirportData.iata}:${radiusMiles}`;
      smoothFlyToBounds(radiusBounds, {
        padding: [36, 36],
        maxZoom: 8,
        duration: 0.8,
      });
    }
  }, [
    results,
    destination,
    destAirportObj,
    isLoading,
    onSelect,
    selected,
    showRoute,
    homeAirport,
    homeAirportProp,
    homeAirportObj,
    currency,
    resolveAirportData,
    bestDealIata,
    radiusMiles,
    smoothFlyTo,
    smoothFlyToBounds,
  ]);

  const selectedIata = selected?.airport.iata ?? "";
  const originLat = selected?.airport.lat;
  const originLon = selected?.airport.lon;
  const hasSelectedFare = !!selected?.fare;

  // Draw route lines in sequence: ground (if any), then flight — SVG stroke reveal (no grow/snap)
  useEffect(() => {
    if (!mapRef.current || !routeLayerRef.current) return;

    const clearRouteLines = () => {
      routeLayerRef.current?.clearLayers();
      groundLineRef.current = null;
      flightLineRef.current = null;
    };

    // Radius overview: no flight/ground paths attached
    if (!showRoute || !hasSelectedFare || originLat == null || originLon == null || !selectedIata) {
      clearRouteLines();
      lastDrawnRouteKeyRef.current = "";
      return;
    }

    const destAirport = destAirportObj || resolveAirportData(destination);
    const homeAirportData = homeAirportProp || homeAirportObj || resolveAirportData(homeAirport);
    const origin: LatLon = [originLat, originLon];
    const needsGround =
      !!homeAirportData && selectedIata.toUpperCase() !== homeAirport.trim().toUpperCase();

    // Key on stable primitives + rounded coords so object identity churn doesn't restart the draw
    const routeKey = [
      selectedIata,
      destination ?? "",
      needsGround ? "g" : "n",
      destAirport ? `${destAirport.lat.toFixed(3)},${destAirport.lon.toFixed(3)}` : "nodest",
      `${originLat.toFixed(3)},${originLon.toFixed(3)}`,
    ].join("|");

    // Same local camera for home base, best deal, and alternate hubs — radius / corridor only.
    const cameraKey = `${selectedIata}:local`;
    if (lastCameraKeyRef.current !== cameraKey) {
      lastCameraKeyRef.current = cameraKey;
      if (homeAirportData && needsGround) {
        const midLat = (homeAirportData.lat + originLat) / 2;
        const midLon = (homeAirportData.lon + originLon) / 2;
        const corridor = L.latLngBounds(
          [
            [homeAirportData.lat, homeAirportData.lon],
            [originLat, originLon],
          ]
        ).pad(0.55);
        corridor.extend([midLat, midLon]);
        smoothFlyToBounds(corridor, {
          padding: [130, 130],
          maxZoom: 8,
          duration: 1.15,
        });
      } else if (homeAirportData) {
        const radiusMeters = (radiusMiles || 300) * 1609.34;
        smoothFlyToBounds(
          latLngBoundsFromRadius(homeAirportData.lat, homeAirportData.lon, radiusMeters),
          {
            padding: [36, 36],
            maxZoom: 9,
            duration: 1.0,
          }
        );
      }
    }

    // Already finished this route — keep lines, ignore unrelated re-renders
    if (lastDrawnRouteKeyRef.current === routeKey) {
      return;
    }

    const layer = routeLayerRef.current;
    const signal = { cancelled: false };
    clearRouteLines();

    const groundPath: LatLon[] | null =
      needsGround && homeAirportData
        ? [
            [homeAirportData.lat, homeAirportData.lon],
            origin,
          ]
        : null;

    const flightPath: LatLon[] | null = destAirport
      ? createArc(origin, [destAirport.lat, destAirport.lon])
      : null;

    if (!groundPath && !flightPath) {
      return;
    }

    const map = mapRef.current;

    void (async () => {
      // Measuring during flyTo gives stale pixel lengths once Leaflet re-renders at the new zoom
      await waitForMapIdle(map, () => cameraMovingRef.current);
      if (signal.cancelled) return;

      if (groundPath) {
        const ground = L.polyline(groundPath, {
          color: "#64748B",
          weight: 3,
          opacity: 0,
          interactive: false,
          noClip: true,
        }).addTo(layer);
        groundLineRef.current = ground;
        await animateStrokeDraw(map, ground, GROUND_DRAW_MS, signal, true);
        if (signal.cancelled) return;
      }

      if (flightPath) {
        const flight = L.polyline(flightPath, {
          color: "#0D9488",
          weight: 3.5,
          opacity: 0,
          interactive: false,
          noClip: true,
        }).addTo(layer);
        flightLineRef.current = flight;
        await animateStrokeDraw(map, flight, FLIGHT_DRAW_MS, signal, false);
        if (signal.cancelled) return;
      }

      lastDrawnRouteKeyRef.current = routeKey;
    })();

    return () => {
      signal.cancelled = true;
      // Drop incomplete strokes so the next selection starts clean
      if (lastDrawnRouteKeyRef.current !== routeKey) {
        clearRouteLines();
      }
    };
  }, [
    selectedIata,
    originLat,
    originLon,
    hasSelectedFare,
    showRoute,
    destination,
    destAirportObj,
    homeAirport,
    homeAirportProp,
    homeAirportObj,
    radiusMiles,
    resolveAirportData,
    smoothFlyToBounds,
  ]);

  const handleCenterHome = () => {
    if (!mapRef.current) return;
    const home = homeAirportProp || homeAirportObj || resolveAirportData(homeAirport);
    if (home) {
      const radiusMeters = (radiusMiles || 300) * 1609.34;
      const bounds = latLngBoundsFromRadius(home.lat, home.lon, radiusMeters);
      lastCameraKeyRef.current = `home:${home.iata}:${radiusMiles}`;
      smoothFlyToBounds(bounds, { padding: [36, 36], maxZoom: 8, duration: 0.9 });
    }
  };

  return (
    <div className="relative h-full w-full">
      <div ref={mapContainerRef} className="h-full w-full bg-slate-100 dark:bg-slate-900" />

      {/* Floating Map Controls (Bottom Left) */}
      <div className="absolute bottom-3 left-3 z-[400] flex flex-col-reverse gap-2">
        {/* Layer Switcher & Re-center */}
        <div className="bg-card/90 backdrop-blur-md border border-border shadow-md rounded-xl p-1 flex items-center gap-1">
          <button
            onClick={() => setShowLayerMenu(!showLayerMenu)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-foreground hover:bg-muted transition-colors"
            title="Change Map Style"
          >
            <Layers className="h-3.5 w-3.5 text-primary" />
            <span>{TILE_CONFIGS[activeProvider].name}</span>
          </button>

          {/* Re-center on Home Hub */}
          <button
            onClick={handleCenterHome}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title={`Center on Home Hub (${homeAirport})`}
          >
            <Crosshair className="h-3.5 w-3.5 text-[#B45309]" />
          </button>
        </div>

        {/* Dropdown Menu (opens upward) */}
        {showLayerMenu && (
          <div className="bg-card/95 backdrop-blur-md border border-border shadow-xl rounded-xl p-1.5 w-56 flex flex-col gap-1 text-xs">
            <div className="px-2 py-1 text-[10px] uppercase font-bold text-muted-foreground">
              Map Style Options
            </div>

            {(Object.keys(TILE_CONFIGS) as MapProvider[]).map((prov) => {
              const cfg = TILE_CONFIGS[prov];
              const isSelected = activeProvider === prov;
              return (
                <button
                  key={prov}
                  onClick={() => {
                    setActiveProvider(prov);
                    setShowLayerMenu(false);
                  }}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-colors text-left ${
                    isSelected ? "bg-primary text-primary-foreground font-semibold" : "hover:bg-muted"
                  }`}
                >
                  <div className="flex flex-col">
                    <span>{cfg.name}</span>
                    <span className="text-[10px] opacity-75">
                      100% Free · No key
                    </span>
                  </div>
                  {isSelected && <Check className="h-3.5 w-3.5" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Loading Overlay Indicator */}
      {isLoading && (
        <div className="absolute top-3 left-3 z-[400] bg-card/90 backdrop-blur-md rounded-xl px-3 py-1.5 text-xs text-muted-foreground border border-border shadow-sm flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-primary animate-ping" />
          <span>Searching airports & fetching fares…</span>
        </div>
      )}

      {/* Empty State Banner */}
      {results.length === 0 && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[300]">
          <div className="bg-card/90 backdrop-blur-md rounded-2xl p-6 text-center border border-border shadow-xl max-w-xs space-y-2 pointer-events-auto">
            <div className="text-3xl">✈️</div>
            <div className="font-bold text-sm">Find the cheapest way to get there</div>
            <div className="text-xs text-muted-foreground leading-relaxed">
              Click <strong>&quot;Find cheapest origin&quot;</strong> above to scan candidate airports and view live
              price bubbles on the map.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function toDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

function haversineMiles(a: LatLon, b: LatLon): number {
  const R = 3958.8;
  const dLat = toRad(b[0] - a[0]);
  const dLon = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Shift `lon` by ±360 so it sits within 180° of `refLon` (keeps lines on one world copy). */
function unwrapLon(lon: number, refLon: number): number {
  let out = lon;
  while (out - refLon > 180) out -= 360;
  while (out - refLon < -180) out += 360;
  return out;
}

/**
 * Full great-circle route to the destination with continuous longitudes, so long-haul
 * routes (e.g. Florida → Tokyo over Canada/Alaska) render as one line ending at the pin.
 */
function createArc(from: LatLon, to: LatLon): LatLon[] {
  const lat1 = toRad(from[0]);
  const lon1 = toRad(from[1]);
  const lat2 = toRad(to[0]);
  const lon2 = toRad(to[1]);

  const x1 = Math.cos(lat1) * Math.cos(lon1);
  const y1 = Math.cos(lat1) * Math.sin(lon1);
  const z1 = Math.sin(lat1);
  const x2 = Math.cos(lat2) * Math.cos(lon2);
  const y2 = Math.cos(lat2) * Math.sin(lon2);
  const z2 = Math.sin(lat2);

  const omega = Math.acos(Math.max(-1, Math.min(1, x1 * x2 + y1 * y2 + z1 * z2)));
  if (omega < 1e-8) return [from, to];

  const miles = haversineMiles(from, to);
  const numPoints = Math.max(32, Math.min(256, Math.round(miles / 40)));
  const sinOmega = Math.sin(omega);
  const points: LatLon[] = [];
  let prevLon = from[1];
  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    const a = Math.sin((1 - t) * omega) / sinOmega;
    const b = Math.sin(t * omega) / sinOmega;
    const x = a * x1 + b * x2;
    const y = a * y1 + b * y2;
    const z = a * z1 + b * z2;
    const lat = toDeg(Math.atan2(z, Math.sqrt(x * x + y * y)));
    const lon = unwrapLon(toDeg(Math.atan2(y, x)), prevLon);
    points.push([lat, lon]);
    prevLon = lon;
  }
  return points;
}
