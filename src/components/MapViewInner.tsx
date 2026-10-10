"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import type { ScoredOrigin } from "@/types";
import { savingsColor } from "@/lib/scoring";
import { FALLBACK_AIRPORTS } from "@/lib/airport-data";
import { Layers, Crosshair, KeyRound, Check, ExternalLink, Radio } from "lucide-react";

interface MapViewInnerProps {
  results: ScoredOrigin[];
  selected: ScoredOrigin | null;
  onSelect: (r: ScoredOrigin) => void;
  homeAirport: string;
  destination?: string;
  isLoading: boolean;
}

type MapProvider = "dark" | "osm" | "aviation" | "satellite" | "mapbox";

interface TileConfig {
  name: string;
  url: string;
  attribution: string;
  maxZoom: number;
  requiresKey?: boolean;
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
  mapbox: {
    name: "Mapbox Light",
    url: "https://api.mapbox.com/styles/v1/mapbox/light-v11/tiles/{z}/{x}/{y}?access_token={accessToken}",
    attribution: '&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
    requiresKey: true,
  },
};

function formatPrice(price: number, currency: string): string {
  const symbol = currency === "EUR" ? "€" : currency === "GBP" ? "£" : "$";
  return `${symbol}${Math.round(price)}`;
}

export default function MapViewInner({
  results,
  selected,
  onSelect,
  homeAirport,
  destination,
  isLoading,
}: MapViewInnerProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const overlayLayerRef = useRef<L.LayerGroup | null>(null);
  const routeLayerRef = useRef<L.LayerGroup | null>(null);
  const baseTileLayerRef = useRef<L.TileLayer | null>(null);
  const referenceTileLayerRef = useRef<L.TileLayer | null>(null);
  const radarLayerRef = useRef<L.LayerGroup | null>(null);

  const [activeProvider, setActiveProvider] = useState<MapProvider>("aviation");
  const [radarActive, setRadarActive] = useState(false);
  const [livePlaneCount, setLivePlaneCount] = useState(0);
  const [showLayerMenu, setShowLayerMenu] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [mapboxKey, setMapboxKey] = useState<string>(
    typeof window !== "undefined"
      ? localStorage.getItem("flightdeck_mapbox_token") || process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ""
      : ""
  );
  const [keyInput, setKeyInput] = useState(mapboxKey);

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
      let tileUrl = cfg.url;

      if (provider === "mapbox") {
        const token = key || mapboxKey;
        if (!token) {
          // If no Mapbox key, fall back gracefully to OpenStreetMap
          setActiveProvider("osm");
          return;
        }
        tileUrl = tileUrl.replace("{accessToken}", token);
      }

      try {
        const newLayer = L.tileLayer(tileUrl, {
          attribution: cfg.attribution,
          maxZoom: cfg.maxZoom,
          tileSize: provider === "mapbox" ? 512 : 256,
          zoomOffset: provider === "mapbox" ? -1 : 0,
        }).addTo(mapRef.current);

        baseTileLayerRef.current = newLayer;

        // Add reference overlays for labels and borders
        if (provider === "dark") {
          const refLayer = L.tileLayer(
            "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}",
            { maxZoom: 16 }
          ).addTo(mapRef.current);
          referenceTileLayerRef.current = refLayer;
        } else if (provider === "aviation") {
          const refLayer = L.tileLayer(
            "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}",
            { maxZoom: 16 }
          ).addTo(mapRef.current);
          referenceTileLayerRef.current = refLayer;
        }
      } catch (err) {
        console.error("Tile layer error, falling back to OSM:", err);
        // Fallback to OSM
        L.tileLayer(TILE_CONFIGS.osm.url, {
          attribution: TILE_CONFIGS.osm.attribution,
          maxZoom: 19,
        }).addTo(mapRef.current);
      }
    },
    [mapboxKey]
  );

  // Initialize Map
  useEffect(() => {
    if (mapRef.current || !mapContainerRef.current) return;

    const home = FALLBACK_AIRPORTS.find((a) => a.iata === homeAirport) ?? FALLBACK_AIRPORTS[0];

    try {
      mapRef.current = L.map(mapContainerRef.current, {
        center: [home.lat, home.lon],
        zoom: 6,
        zoomControl: true,
      });

      overlayLayerRef.current = L.layerGroup().addTo(mapRef.current);
      routeLayerRef.current = L.layerGroup().addTo(mapRef.current);
      radarLayerRef.current = L.layerGroup().addTo(mapRef.current);

      updateTileLayer(activeProvider);

      // Invalidate size once DOM layout is settled
      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.invalidateSize();
        }
      }, 250);
    } catch (err) {
      console.error("Failed to initialize map:", err);
    }

    // Resize observer to ensure map stays sized correctly
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined" && mapContainerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        if (mapRef.current) {
          mapRef.current.invalidateSize();
        }
      });
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []); // Run once on mount

  // Live airborne flight radar effect (polls OpenSky Network)
  useEffect(() => {
    if (!radarActive || !mapRef.current || !radarLayerRef.current) {
      if (radarLayerRef.current) radarLayerRef.current.clearLayers();
      setLivePlaneCount(0);
      return;
    }

    let isSubscribed = true;

    const fetchPlanes = async () => {
      try {
        const res = await fetch("/api/radar");
        if (!res.ok) return;
        const data = await res.json();
        if (!isSubscribed || !data.planes || !radarLayerRef.current) return;

        radarLayerRef.current.clearLayers();
        setLivePlaneCount(data.planes.length);

        data.planes.forEach((p: {
          icao24: string;
          callsign: string;
          originCountry: string;
          lon: number;
          lat: number;
          altitudeMeters: number;
          velocityKmh: number;
          headingDeg: number;
        }) => {
          const planeIcon = L.divIcon({
            className: "live-plane-marker",
            html: `<div style="
              transform: rotate(${p.headingDeg - 45}deg);
              font-size: 15px;
              line-height: 1;
              cursor: pointer;
              filter: drop-shadow(0 2px 3px rgba(0,0,0,0.5));
            ">✈️</div>`,
            iconSize: [16, 16],
            iconAnchor: [8, 8],
          });

          L.marker([p.lat, p.lon], { icon: planeIcon })
            .bindPopup(`
              <div style="font-family: sans-serif; font-size: 12px; line-height: 1.4; min-width: 150px;">
                <div style="font-weight: bold; font-size: 13px; color: #2563eb;">${p.callsign}</div>
                <div style="color: #64748b; font-size: 11px;">${p.originCountry}</div>
                <hr style="margin: 4px 0; border: none; border-top: 1px solid #e2e8f0;"/>
                <div>Alt: <strong>${p.altitudeMeters.toLocaleString()} m</strong></div>
                <div>Speed: <strong>${p.velocityKmh} km/h</strong></div>
                <div>Heading: <strong>${p.headingDeg}°</strong></div>
              </div>
            `)
            .addTo(radarLayerRef.current!);
        });
      } catch (err) {
        console.warn("Radar fetch error:", err);
      }
    };

    fetchPlanes();
    const interval = setInterval(fetchPlanes, 8000);

    return () => {
      isSubscribed = false;
      clearInterval(interval);
      if (radarLayerRef.current) radarLayerRef.current.clearLayers();
    };
  }, [radarActive]);

  // Watch for provider change
  useEffect(() => {
    updateTileLayer(activeProvider);
  }, [activeProvider, updateTileLayer]);

  // Center on Home Airport when homeAirport changes
  useEffect(() => {
    if (!mapRef.current) return;
    const home = FALLBACK_AIRPORTS.find((a) => a.iata === homeAirport);
    if (home) {
      mapRef.current.setView([home.lat, home.lon], 6);
    }
  }, [homeAirport]);

  // Update Markers when results change
  useEffect(() => {
    if (!mapRef.current || !overlayLayerRef.current) return;

    overlayLayerRef.current.clearLayers();
    markersRef.current.clear();

    const destAirport = destination
      ? FALLBACK_AIRPORTS.find((a) => a.iata === destination)
      : null;

    results.forEach((r) => {
      if (!r.fare && !isLoading) return;

      const isSelected = selected?.airport.iata === r.airport.iata;
      const isSaving = r.fare && r.savingsVsHome > 0;
      const price = r.fare ? formatPrice(r.totalCost, r.fare.currency) : "N/A";

      const bubbleClass = `price-bubble${isSelected ? " selected" : isSaving ? " savings" : ""}`;

      const icon = L.divIcon({
        className: "",
        html: `<div class="${bubbleClass}">${price}</div>`,
        iconAnchor: [28, 14],
        iconSize: [56, 28],
      });

      const marker = L.marker([r.airport.lat, r.airport.lon], { icon })
        .bindPopup(`
          <div style="min-width:180px; font-family: -apple-system, BlinkMacSystemFont, Roboto, sans-serif; color: #0F172A;">
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
                ✈️ Flight: <strong>${formatPrice(r.fare.price, r.fare.currency)}</strong><br/>
                🚆 Overland: <strong>${formatPrice(r.groundLeg.price, r.groundLeg.currency)}</strong><br/>
                ⏱️ Time valuation: <strong>${formatPrice(r.breakdown.timeCost, r.fare.currency)}</strong>
              </div>
              ${
                r.savingsVsHome > 0
                  ? `<div style="font-size:12px;color:#92400E;background:#FEF3C7;padding:3px 8px;border-radius:8px;font-weight:700;margin-top:6px;display:inline-block;">Save ${formatPrice(
                      r.savingsVsHome,
                      r.fare.currency
                    )} vs home</div>`
                  : ""
              }
              <div style="font-size:10px;color:#64748B;margin-top:6px">Source: ${r.fare.source}</div>
            `
                : `<div style="color:#64748B">No fare found</div>`
            }
          </div>
        `)
        .on("click", () => onSelect(r));

      marker.addTo(overlayLayerRef.current!);
      markersRef.current.set(r.airport.iata, marker);
    });

    // Destination Marker in Venture Field Explorer style
    if (destAirport) {
      const destIcon = L.divIcon({
        className: "",
        html: `<div style="
          background:#0F172A;
          color:#FFFFFF;
          padding:5px 12px;
          border-radius:9999px;
          font-size:12px;
          font-weight:700;
          white-space:nowrap;
          box-shadow:0 4px 12px rgba(15,23,42,0.25);
          border:2px solid #F59E0B;
        ">📍 ${destAirport.iata} · ${destAirport.city}</div>`,
        iconAnchor: [36, 16],
        iconSize: [72, 32],
      });
      L.marker([destAirport.lat, destAirport.lon], { icon: destIcon })
        .bindPopup(`<strong style="color:#0F172A">${destAirport.city}</strong><br/><span style="color:#64748B">${destAirport.name}</span>`)
        .addTo(overlayLayerRef.current);
    }
  }, [results, destination, isLoading, onSelect, selected]);

  // Draw Route Lines when an origin is selected
  useEffect(() => {
    if (!mapRef.current || !routeLayerRef.current) return;
    routeLayerRef.current.clearLayers();

    if (!selected?.fare) return;

    const destAirport = destination
      ? FALLBACK_AIRPORTS.find((a) => a.iata === destination)
      : null;

    const homeAirportData = FALLBACK_AIRPORTS.find((a) => a.iata === homeAirport);

    // Ground leg: dashed navigational slate line
    if (homeAirportData && selected.airport.iata !== homeAirport) {
      L.polyline(
        [
          [homeAirportData.lat, homeAirportData.lon],
          [selected.airport.lat, selected.airport.lon],
        ],
        {
          color: "#64748B",
          weight: 3,
          dashArray: "6, 6",
          opacity: 0.9,
        }
      ).addTo(routeLayerRef.current);
    }

    // Flight arc: vibrant Atlas Teal curve
    if (destAirport) {
      const latlngs = createArc(
        [selected.airport.lat, selected.airport.lon],
        [destAirport.lat, destAirport.lon]
      );
      L.polyline(latlngs, {
        color: "#0D9488",
        weight: 3.5,
        opacity: 0.95,
      }).addTo(routeLayerRef.current);

      const bounds = L.latLngBounds([
        [selected.airport.lat, selected.airport.lon],
        [destAirport.lat, destAirport.lon],
        ...(homeAirportData ? [[homeAirportData.lat, homeAirportData.lon] as [number, number]] : []),
      ]);
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [selected, destination, homeAirport]);

  const handleCenterHome = () => {
    if (!mapRef.current) return;
    const home = FALLBACK_AIRPORTS.find((a) => a.iata === homeAirport);
    if (home) {
      mapRef.current.setView([home.lat, home.lon], 6);
    }
  };

  const handleSaveMapboxKey = () => {
    setMapboxKey(keyInput);
    if (typeof window !== "undefined") {
      localStorage.setItem("flightdeck_mapbox_token", keyInput);
    }
    setShowKeyModal(false);
    if (keyInput) {
      setActiveProvider("mapbox");
      updateTileLayer("mapbox", keyInput);
    }
  };

  return (
    <div className="relative h-full w-full">
      <div ref={mapContainerRef} className="h-full w-full bg-slate-100 dark:bg-slate-900" />

      {/* Floating Map Controls (Top Right) */}
      <div className="absolute top-3 right-3 z-[400] flex flex-col gap-2">
        {/* Layer Switcher & Center */}
        <div className="bg-card/90 backdrop-blur-md border border-border shadow-md rounded-xl p-1 flex items-center gap-1">
          <button
            onClick={() => setShowLayerMenu(!showLayerMenu)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-foreground hover:bg-muted transition-colors"
            title="Change Map Style"
          >
            <Layers className="h-3.5 w-3.5 text-primary" />
            <span>{TILE_CONFIGS[activeProvider].name}</span>
          </button>

          <button
            onClick={handleCenterHome}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Center on Home Airport"
          >
            <Crosshair className="h-3.5 w-3.5" />
          </button>

          {/* Live Radar Toggle */}
          <button
            onClick={() => setRadarActive(!radarActive)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              radarActive
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
            title="Toggle Live Airborne Flight Radar"
          >
            <Radio className={`h-3.5 w-3.5 ${radarActive ? "animate-pulse" : ""}`} />
            <span>{radarActive ? `Radar (${livePlaneCount})` : "Live Radar"}</span>
          </button>
        </div>

        {/* Dropdown Menu */}
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
                    if (prov === "mapbox" && !mapboxKey) {
                      setShowKeyModal(true);
                      setShowLayerMenu(false);
                      return;
                    }
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
                      {cfg.requiresKey ? "Mapbox Token required" : "100% Free · No key"}
                    </span>
                  </div>
                  {isSelected && <Check className="h-3.5 w-3.5" />}
                </button>
              );
            })}

            <div className="border-t border-border mt-1 pt-1">
              <button
                onClick={() => {
                  setShowKeyModal(true);
                  setShowLayerMenu(false);
                }}
                className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted text-left text-[11px]"
              >
                <KeyRound className="h-3 w-3" />
                <span>Configure Mapbox Token</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mapbox Token Modal */}
      {showKeyModal && (
        <div className="absolute inset-0 z-[500] bg-background/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl shadow-2xl p-5 max-w-sm w-full space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold">
              <KeyRound className="h-4 w-4 text-primary" />
              <span>Mapbox API Token</span>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              OpenStreetMap and Esri maps work free without any key. If you want Google Flights-style
              vector Mapbox Light tiles, enter your public token (starts with <code>pk.eyJ...</code>).
            </p>

            <input
              type="text"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="pk.eyJ1..."
              className="w-full px-3 py-2 rounded-lg border border-border bg-muted text-xs outline-none focus:border-primary font-mono"
            />

            <div className="flex items-center justify-between text-[11px]">
              <a
                href="https://account.mapbox.com/access-tokens/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline flex items-center gap-1"
              >
                Get free token at mapbox.com <ExternalLink className="h-2.5 w-2.5" />
              </a>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setShowKeyModal(false)}
                className="flex-1 py-1.5 rounded-lg border border-border text-xs hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveMapboxKey}
                className="flex-1 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 shadow-sm"
              >
                Save & Apply
              </button>
            </div>
          </div>
        </div>
      )}

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

/** Create a great-circle arc with intermediate points for a curved line */
function createArc(
  from: [number, number],
  to: [number, number],
  numPoints = 64
): [number, number][] {
  const points: [number, number][] = [];
  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    const lat = from[0] + (to[0] - from[0]) * t;
    const lon = from[1] + (to[1] - from[1]) * t;
    const arc = Math.sin(Math.PI * t) * 3;
    points.push([lat + arc * 0.5, lon]);
  }
  return points;
}
