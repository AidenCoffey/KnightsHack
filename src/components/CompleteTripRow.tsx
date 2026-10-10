"use client";

import { Car, ShieldCheck, Wifi, Navigation, ExternalLink, BookOpen } from "lucide-react";
import { getCountryNameFromCode } from "@/lib/cultural-utils";

interface PartnerLink {
  name: string;
  category: string;
  tagline: string;
  url?: string;
  icon: React.ReactNode;
  isCulturalGuide?: boolean;
}

export function CompleteTripRow({
  origin,
  destination,
  onOpenCulturalGuide,
}: {
  origin?: string;
  destination?: string;
  onOpenCulturalGuide?: () => void;
}) {
  const countryName = destination ? getCountryNameFromCode(destination) : "Destination";

  const partners: PartnerLink[] = [
    {
      name: `${countryName} Guide`,
      category: "Venture",
      tagline: "Culture, packing & phrases",
      icon: <BookOpen className="h-4 w-4 text-amber-500" />,
      isCulturalGuide: true,
    },
    {
      name: "GigSky",
      category: "eSIM",
      tagline: "Global data without roaming",
      url: "https://www.gigsky.com",
      icon: <Wifi className="h-4 w-4 text-emerald-500" />,
    },
    {
      name: "GetTransfer",
      category: "Transfers",
      tagline: "Airport rides & shuttles",
      url: "https://gettransfer.com",
      icon: <Navigation className="h-4 w-4 text-blue-500" />,
    },
    {
      name: "AutoEurope",
      category: "Car Rental",
      tagline: "Compare car hire deals",
      url: "https://www.autoeurope.com",
      icon: <Car className="h-4 w-4 text-indigo-500" />,
    },
    {
      name: "EKTA",
      category: "Insurance",
      tagline: "Global travel insurance",
      url: "https://ektatraveling.com",
      icon: <ShieldCheck className="h-4 w-4 text-purple-500" />,
    },
  ];

  return (
    <div className="rounded-xl border border-border bg-card p-3 shadow-sm space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-foreground">Complete Your Trip</span>
          <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded font-medium">
            Add-ons & Travel Guide
          </span>
        </div>
        <span className="text-[10px] text-muted-foreground">Pre-checkout tools</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {partners.map((partner) => {
          if (partner.isCulturalGuide) {
            return (
              <button
                key={partner.name}
                type="button"
                onClick={onOpenCulturalGuide}
                className="group flex flex-col p-2.5 rounded-lg border border-border hover:border-amber-500/50 hover:bg-amber-500/5 transition-all text-left"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="p-1 rounded-md bg-muted group-hover:bg-amber-500/10 transition-colors">
                    {partner.icon}
                  </div>
                  <span className="text-[9px] font-bold text-amber-500 bg-amber-500/10 px-1 rounded">
                    Free
                  </span>
                </div>
                <div className="text-xs font-semibold text-foreground truncate">{partner.name}</div>
                <div className="text-[10px] text-muted-foreground leading-tight mt-0.5">
                  {partner.tagline}
                </div>
              </button>
            );
          }

          const redirectUrl = `/api/go?url=${encodeURIComponent(partner.url || "")}${
            origin ? `&origin=${origin}` : ""
          }${destination ? `&destination=${destination}` : ""}`;

          return (
            <a
              key={partner.name}
              href={redirectUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col p-2.5 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/40 transition-all text-left"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="p-1 rounded-md bg-muted group-hover:bg-background transition-colors">
                  {partner.icon}
                </div>
                <ExternalLink className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <div className="text-xs font-semibold text-foreground">{partner.name}</div>
              <div className="text-[10px] text-muted-foreground leading-tight mt-0.5">
                {partner.tagline}
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
