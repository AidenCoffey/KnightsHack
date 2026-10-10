// Static airport data — safe to import in both client and server components
// This file has NO Node.js-only imports

import type { Airport } from "@/types";

export const FALLBACK_AIRPORTS: Airport[] = [
  // Italy
  { iata: "FCO", name: "Leonardo da Vinci–Fiumicino Airport", city: "Rome", country: "IT", lat: 41.8003, lon: 12.2389, type: "large_airport" },
  { iata: "CIA", name: "Ciampino Airport", city: "Rome", country: "IT", lat: 41.7994, lon: 12.5949, type: "medium_airport" },
  { iata: "NAP", name: "Naples International Airport", city: "Naples", country: "IT", lat: 40.886, lon: 14.2908, type: "large_airport" },
  { iata: "MXP", name: "Milan Malpensa Airport", city: "Milan", country: "IT", lat: 45.6306, lon: 8.7281, type: "large_airport" },
  { iata: "LIN", name: "Milan Linate Airport", city: "Milan", country: "IT", lat: 45.4455, lon: 9.2768, type: "large_airport" },
  { iata: "BGY", name: "Milan Bergamo Airport", city: "Bergamo", country: "IT", lat: 45.6739, lon: 9.7042, type: "medium_airport" },
  { iata: "VCE", name: "Venice Marco Polo Airport", city: "Venice", country: "IT", lat: 45.5053, lon: 12.3519, type: "large_airport" },
  { iata: "TSF", name: "Venice Treviso Airport", city: "Treviso", country: "IT", lat: 45.6484, lon: 12.1944, type: "medium_airport" },
  { iata: "BLQ", name: "Bologna Guglielmo Marconi Airport", city: "Bologna", country: "IT", lat: 44.5354, lon: 11.2887, type: "large_airport" },
  { iata: "FLR", name: "Florence Airport", city: "Florence", country: "IT", lat: 43.81, lon: 11.2051, type: "medium_airport" },
  { iata: "PSA", name: "Pisa International Airport", city: "Pisa", country: "IT", lat: 43.683, lon: 10.3927, type: "medium_airport" },
  { iata: "PMO", name: "Palermo Airport", city: "Palermo", country: "IT", lat: 38.1759, lon: 13.0909, type: "large_airport" },
  { iata: "CTA", name: "Catania Fontanarossa Airport", city: "Catania", country: "IT", lat: 37.4668, lon: 15.0664, type: "large_airport" },
  { iata: "BRI", name: "Bari Karol Wojtyla Airport", city: "Bari", country: "IT", lat: 41.1389, lon: 16.7606, type: "large_airport" },
  { iata: "TRN", name: "Turin Airport", city: "Turin", country: "IT", lat: 45.2006, lon: 7.6497, type: "large_airport" },
  { iata: "GEN", name: "Genoa Cristoforo Colombo Airport", city: "Genoa", country: "IT", lat: 44.4133, lon: 8.8375, type: "medium_airport" },
  
  // Western / Central Europe
  { iata: "LHR", name: "London Heathrow Airport", city: "London", country: "GB", lat: 51.4775, lon: -0.4614, type: "large_airport" },
  { iata: "LGW", name: "London Gatwick Airport", city: "London", country: "GB", lat: 51.1537, lon: -0.1821, type: "large_airport" },
  { iata: "STN", name: "London Stansted Airport", city: "London", country: "GB", lat: 51.8860, lon: 0.2389, type: "large_airport" },
  { iata: "LTN", name: "London Luton Airport", city: "London", country: "GB", lat: 51.8747, lon: -0.3683, type: "large_airport" },
  { iata: "MAN", name: "Manchester Airport", city: "Manchester", country: "GB", lat: 53.3537, lon: -2.2750, type: "large_airport" },
  { iata: "EDI", name: "Edinburgh Airport", city: "Edinburgh", country: "GB", lat: 55.9500, lon: -3.3725, type: "large_airport" },
  { iata: "DUB", name: "Dublin Airport", city: "Dublin", country: "IE", lat: 53.4264, lon: -6.2499, type: "large_airport" },
  { iata: "CDG", name: "Paris Charles de Gaulle Airport", city: "Paris", country: "FR", lat: 49.0097, lon: 2.5479, type: "large_airport" },
  { iata: "ORY", name: "Paris Orly Airport", city: "Paris", country: "FR", lat: 48.7262, lon: 2.3652, type: "large_airport" },
  { iata: "NCE", name: "Nice Côte d'Azur Airport", city: "Nice", country: "FR", lat: 43.6584, lon: 7.2159, type: "large_airport" },
  { iata: "LYS", name: "Lyon-Saint Exupéry Airport", city: "Lyon", country: "FR", lat: 45.7256, lon: 5.0811, type: "large_airport" },
  { iata: "MAD", name: "Madrid Barajas Airport", city: "Madrid", country: "ES", lat: 40.4936, lon: -3.5668, type: "large_airport" },
  { iata: "BCN", name: "Barcelona El Prat Airport", city: "Barcelona", country: "ES", lat: 41.2971, lon: 2.0785, type: "large_airport" },
  { iata: "AGP", name: "Málaga Airport", city: "Malaga", country: "ES", lat: 36.6749, lon: -4.4991, type: "large_airport" },
  { iata: "VLC", name: "Valencia Airport", city: "Valencia", country: "ES", lat: 39.4893, lon: -0.4816, type: "large_airport" },
  { iata: "LIS", name: "Humberto Delgado Airport", city: "Lisbon", country: "PT", lat: 38.7756, lon: -9.1354, type: "large_airport" },
  { iata: "OPO", name: "Francisco Sá Carneiro Airport", city: "Porto", country: "PT", lat: 41.2421, lon: -8.6781, type: "large_airport" },
  { iata: "AMS", name: "Amsterdam Schiphol Airport", city: "Amsterdam", country: "NL", lat: 52.3086, lon: 4.7639, type: "large_airport" },
  { iata: "BRU", name: "Brussels Airport", city: "Brussels", country: "BE", lat: 50.9014, lon: 4.4844, type: "large_airport" },
  { iata: "FRA", name: "Frankfurt Airport", city: "Frankfurt", country: "DE", lat: 50.0379, lon: 8.5622, type: "large_airport" },
  { iata: "MUC", name: "Munich Airport", city: "Munich", country: "DE", lat: 48.3538, lon: 11.7861, type: "large_airport" },
  { iata: "BER", name: "Berlin Brandenburg Airport", city: "Berlin", country: "DE", lat: 52.3667, lon: 13.5033, type: "large_airport" },
  { iata: "HAM", name: "Hamburg Airport", city: "Hamburg", country: "DE", lat: 53.6304, lon: 9.9882, type: "large_airport" },
  { iata: "DUS", name: "Düsseldorf Airport", city: "Dusseldorf", country: "DE", lat: 51.2895, lon: 6.7668, type: "large_airport" },
  { iata: "ZRH", name: "Zurich Airport", city: "Zurich", country: "CH", lat: 47.4647, lon: 8.5492, type: "large_airport" },
  { iata: "GVA", name: "Geneva Airport", city: "Geneva", country: "CH", lat: 46.2381, lon: 6.1089, type: "large_airport" },
  { iata: "VIE", name: "Vienna International Airport", city: "Vienna", country: "AT", lat: 48.1103, lon: 16.5697, type: "large_airport" },
  { iata: "PRG", name: "Václav Havel Airport Prague", city: "Prague", country: "CZ", lat: 50.1008, lon: 14.26, type: "large_airport" },
  { iata: "WAW", name: "Warsaw Chopin Airport", city: "Warsaw", country: "PL", lat: 52.1657, lon: 20.9671, type: "large_airport" },
  { iata: "KRK", name: "John Paul II Kraków-Balice Airport", city: "Krakow", country: "PL", lat: 50.0777, lon: 19.7848, type: "large_airport" },
  { iata: "BUD", name: "Budapest Ferenc Liszt Airport", city: "Budapest", country: "HU", lat: 47.4369, lon: 19.2556, type: "large_airport" },
  { iata: "ATH", name: "Athens International Airport", city: "Athens", country: "GR", lat: 37.9364, lon: 23.9445, type: "large_airport" },
  { iata: "CPH", name: "Copenhagen Airport", city: "Copenhagen", country: "DK", lat: 55.6180, lon: 12.6560, type: "large_airport" },
  { iata: "OSL", name: "Oslo Gardermoen Airport", city: "Oslo", country: "NO", lat: 60.1976, lon: 11.1004, type: "large_airport" },
  { iata: "ARN", name: "Stockholm Arlanda Airport", city: "Stockholm", country: "SE", lat: 59.6519, lon: 17.9186, type: "large_airport" },
  { iata: "HEL", name: "Helsinki Vantaa Airport", city: "Helsinki", country: "FI", lat: 60.3172, lon: 24.9633, type: "large_airport" },
  { iata: "IST", name: "Istanbul Airport", city: "Istanbul", country: "TR", lat: 41.2608, lon: 28.7418, type: "large_airport" },
  { iata: "SAW", name: "Istanbul Sabiha Gökçen Airport", city: "Istanbul", country: "TR", lat: 40.8986, lon: 29.3092, type: "large_airport" },

  // Middle East
  { iata: "DXB", name: "Dubai International Airport", city: "Dubai", country: "AE", lat: 25.2532, lon: 55.3657, type: "large_airport" },
  { iata: "AUH", name: "Zayed International Airport", city: "Abu Dhabi", country: "AE", lat: 24.4330, lon: 54.6511, type: "large_airport" },
  { iata: "DOH", name: "Hamad International Airport", city: "Doha", country: "QA", lat: 25.2731, lon: 51.6081, type: "large_airport" },

  // Asia / Pacific
  { iata: "SIN", name: "Singapore Changi Airport", city: "Singapore", country: "SG", lat: 1.3644, lon: 103.9915, type: "large_airport" },
  { iata: "BKK", name: "Suvarnabhumi Airport", city: "Bangkok", country: "TH", lat: 13.6811, lon: 100.7473, type: "large_airport" },
  { iata: "HKG", name: "Hong Kong International Airport", city: "Hong Kong", country: "HK", lat: 22.308, lon: 113.9185, type: "large_airport" },
  { iata: "NRT", name: "Narita International Airport", city: "Tokyo", country: "JP", lat: 35.7647, lon: 140.3864, type: "large_airport" },
  { iata: "HND", name: "Tokyo Haneda Airport", city: "Tokyo", country: "JP", lat: 35.5494, lon: 139.7798, type: "large_airport" },
  { iata: "KIX", name: "Kansai International Airport", city: "Osaka", country: "JP", lat: 34.4347, lon: 135.2442, type: "large_airport" },
  { iata: "ICN", name: "Incheon International Airport", city: "Seoul", country: "KR", lat: 37.4691, lon: 126.4505, type: "large_airport" },
  { iata: "SYD", name: "Sydney Airport", city: "Sydney", country: "AU", lat: -33.9461, lon: 151.1772, type: "large_airport" },
  { iata: "MEL", name: "Melbourne Airport", city: "Melbourne", country: "AU", lat: -37.6690, lon: 144.8410, type: "large_airport" },
  { iata: "DEL", name: "Indira Gandhi International Airport", city: "New Delhi", country: "IN", lat: 28.5562, lon: 77.1000, type: "large_airport" },

  // North America
  { iata: "JFK", name: "John F. Kennedy International Airport", city: "New York", country: "US", lat: 40.6413, lon: -73.7781, type: "large_airport" },
  { iata: "EWR", name: "Newark Liberty International Airport", city: "New York / Newark", country: "US", lat: 40.6895, lon: -74.1745, type: "large_airport" },
  { iata: "LGA", name: "LaGuardia Airport", city: "New York", country: "US", lat: 40.7769, lon: -73.8740, type: "large_airport" },
  { iata: "BOS", name: "Boston Logan International Airport", city: "Boston", country: "US", lat: 42.3656, lon: -71.0096, type: "large_airport" },
  { iata: "LAX", name: "Los Angeles International Airport", city: "Los Angeles", country: "US", lat: 33.9425, lon: -118.4081, type: "large_airport" },
  { iata: "SFO", name: "San Francisco International Airport", city: "San Francisco", country: "US", lat: 37.6213, lon: -122.3790, type: "large_airport" },
  { iata: "ORD", name: "O'Hare International Airport", city: "Chicago", country: "US", lat: 41.9742, lon: -87.9073, type: "large_airport" },
  { iata: "MIA", name: "Miami International Airport", city: "Miami", country: "US", lat: 25.7959, lon: -80.2870, type: "large_airport" },
  { iata: "DFW", name: "Dallas/Fort Worth International Airport", city: "Dallas", country: "US", lat: 32.8998, lon: -97.0403, type: "large_airport" },
  { iata: "ATL", name: "Hartsfield-Jackson Atlanta Airport", city: "Atlanta", country: "US", lat: 33.6407, lon: -84.4277, type: "large_airport" },
  { iata: "SEA", name: "Seattle-Tacoma International Airport", city: "Seattle", country: "US", lat: 47.4502, lon: -122.3088, type: "large_airport" },
  { iata: "YYZ", name: "Toronto Pearson International Airport", city: "Toronto", country: "CA", lat: 43.6777, lon: -79.6248, type: "large_airport" },
  { iata: "YVR", name: "Vancouver International Airport", city: "Vancouver", country: "CA", lat: 49.1967, lon: -123.1815, type: "large_airport" },
];

export function getAirportByIata(iata: string): Airport | undefined {
  return FALLBACK_AIRPORTS.find((a) => a.iata.toUpperCase() === iata.toUpperCase());
}

export function searchAirportsClient(query: string, maxResults = 10): Airport[] {
  const q = query.trim().toLowerCase();
  if (!q) return FALLBACK_AIRPORTS.slice(0, maxResults);

  const matched = FALLBACK_AIRPORTS.filter((a) => {
    return (
      a.iata.toLowerCase().includes(q) ||
      a.city.toLowerCase().includes(q) ||
      a.name.toLowerCase().includes(q) ||
      a.country.toLowerCase() === q
    );
  });

  return matched.slice(0, maxResults);
}
