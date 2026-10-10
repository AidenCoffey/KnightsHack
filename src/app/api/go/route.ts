/**
 * /api/go — Safe affiliate redirect
 *
 * Validates the target URL against an allowlist of booking domains,
 * appends the Travelpayouts affiliate marker and UTM params,
 * then issues a 302 redirect that opens in a new tab.
 *
 * Security: Never pass target URLs to the client before validation.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const MARKER = process.env.TRAVELPAYOUTS_MARKER ?? "";

// Allowlist of booking domains we'll redirect to
const ALLOWED_DOMAINS = new Set([
  "aviasales.com",
  "aviasales.ru",
  "www.aviasales.com",
  "www.aviasales.ru",
  "tp.media",
  "ryanair.com",
  "www.ryanair.com",
  "easyjet.com",
  "www.easyjet.com",
  "booking.com",
  "www.booking.com",
  "kiwi.com",
  "www.kiwi.com",
  "skyscanner.net",
  "www.skyscanner.net",
  "gettransfer.com",
  "www.gettransfer.com",
  "autoeurope.com",
  "www.autoeurope.com",
  "ektatraveling.com",
  "www.ektatraveling.com",
  "gigsky.com",
  "www.gigsky.com",
]);

const GoSchema = z.object({
  url: z.string().url(),
  origin: z.string().length(3).optional(),
  destination: z.string().length(3).optional(),
  date: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rawParams = Object.fromEntries(searchParams.entries());

  const parsed = GoSchema.safeParse(rawParams);
  if (!parsed.success) {
    return new Response("Invalid params", { status: 400 });
  }

  const { url, origin, destination, date } = parsed.data;

  // Validate against allowlist
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return new Response("Invalid URL", { status: 400 });
  }

  const hostname = parsedUrl.hostname.toLowerCase();
  if (!ALLOWED_DOMAINS.has(hostname)) {
    console.warn(`[/go] Blocked redirect to unlisted domain: ${hostname}`);
    return new Response(`Domain not allowed: ${hostname}`, { status: 403 });
  }

  // Append affiliate marker if we have one
  if (MARKER) {
    parsedUrl.searchParams.set("marker", MARKER);
  }

  // UTM params for analytics
  parsedUrl.searchParams.set("utm_source", "flightdeck");
  parsedUrl.searchParams.set("utm_medium", "affiliate");
  parsedUrl.searchParams.set("utm_campaign", "reverse-search");
  if (origin) parsedUrl.searchParams.set("utm_content", `${origin}-${destination ?? ""}`);

  return NextResponse.redirect(parsedUrl.toString(), {
    status: 302,
    headers: {
      // Open in new tab is handled client-side (target="_blank")
      "X-Robots-Tag": "noindex",
    },
  });
}
