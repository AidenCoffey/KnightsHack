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
  { iata: "STR", name: "Stuttgart Airport", city: "Stuttgart", country: "DE", lat: 48.689899, lon: 9.22196, type: "large_airport" },
  { iata: "CGN", name: "Cologne Bonn Airport", city: "Köln (Cologne)", country: "DE", lat: 50.865898, lon: 7.14274, type: "large_airport" },
  { iata: "NUE", name: "Nuremberg Airport", city: "Nuremberg", country: "DE", lat: 49.498699, lon: 11.078056, type: "large_airport" },
  { iata: "FKB", name: "Karlsruhe Baden-Baden Airport", city: "Karlsruhe / Baden-Baden", country: "DE", lat: 48.7794, lon: 8.0805, type: "large_airport" },
  { iata: "BSL", name: "EuroAirport Basel–Mulhouse–Freiburg", city: "Bâle / Mulhouse", country: "FR", lat: 47.60068, lon: 7.521117, type: "large_airport" },
  { iata: "SXB", name: "Strasbourg Airport", city: "Strasbourg", country: "FR", lat: 48.5383, lon: 7.62823, type: "large_airport" },
  { iata: "LUX", name: "Luxembourg-Findel International Airport", city: "Luxembourg", country: "LU", lat: 49.626845, lon: 6.212134, type: "large_airport" },
  { iata: "EIN", name: "Eindhoven Airport", city: "Eindhoven", country: "NL", lat: 51.4501, lon: 5.3745, type: "large_airport" },
  { iata: "CRL", name: "Brussels South Charleroi Airport", city: "Charleroi", country: "BE", lat: 50.462, lon: 4.4596, type: "large_airport" },
  { iata: "ZRH", name: "Zurich Airport", city: "Zurich", country: "CH", lat: 47.4647, lon: 8.5492, type: "large_airport" },
  { iata: "GVA", name: "Geneva Airport", city: "Geneva", country: "CH", lat: 46.2381, lon: 6.1089, type: "large_airport" },
  { iata: "VIE", name: "Vienna International Airport", city: "Vienna", country: "AT", lat: 48.1103, lon: 16.5697, type: "large_airport" },
  { iata: "PRG", name: "Václav Havel Airport Prague", city: "Prague", country: "CZ", lat: 50.1008, lon: 14.26, type: "large_airport" },
  { iata: "WAW", name: "Warsaw Chopin Airport", city: "Warsaw", country: "PL", lat: 52.1657, lon: 20.9671, type: "large_airport" },
  { iata: "KRK", name: "John Paul II Kraków-Balice Airport", city: "Krakow", country: "PL", lat: 50.0777, lon: 19.7848, type: "large_airport" },
  { iata: "BUD", name: "Budapest Ferenc Liszt Airport", city: "Budapest", country: "HU", lat: 47.4369, lon: 19.2556, type: "large_airport" },
  { iata: "BTS", name: "M. R. Štefánik Airport", city: "Bratislava", country: "SK", lat: 48.1702, lon: 17.2127, type: "large_airport" },
  { iata: "KSC", name: "Košice International Airport", city: "Košice", country: "SK", lat: 48.6631, lon: 21.2411, type: "medium_airport" },
  { iata: "BRQ", name: "Brno-Tuřany Airport", city: "Brno", country: "CZ", lat: 49.1513, lon: 16.6940, type: "medium_airport" },
  { iata: "OSR", name: "Leoš Janáček Airport Ostrava", city: "Ostrava", country: "CZ", lat: 49.6963, lon: 18.1111, type: "large_airport" },
  { iata: "LJU", name: "Ljubljana Jože Pučnik Airport", city: "Ljubljana", country: "SI", lat: 46.2237, lon: 14.4576, type: "large_airport" },
  { iata: "ZAG", name: "Zagreb Franjo Tuđman Airport", city: "Zagreb", country: "HR", lat: 45.7429, lon: 16.0688, type: "large_airport" },
  { iata: "SPU", name: "Split Airport", city: "Split", country: "HR", lat: 43.5389, lon: 16.2980, type: "large_airport" },
  { iata: "DBV", name: "Dubrovnik Airport", city: "Dubrovnik", country: "HR", lat: 42.5622, lon: 18.2655, type: "large_airport" },
  { iata: "BEG", name: "Belgrade Nikola Tesla Airport", city: "Belgrade", country: "RS", lat: 44.8184, lon: 20.3091, type: "large_airport" },
  { iata: "SJJ", name: "Sarajevo International Airport", city: "Sarajevo", country: "BA", lat: 43.8246, lon: 18.3315, type: "large_airport" },
  { iata: "SKP", name: "Skopje International Airport", city: "Skopje", country: "MK", lat: 41.9581, lon: 21.6226, type: "large_airport" },
  { iata: "TIA", name: "Tirana International Airport Mother Teresa", city: "Tirana", country: "AL", lat: 41.4147, lon: 19.7206, type: "large_airport" },
  { iata: "SOF", name: "Sofia Airport", city: "Sofia", country: "BG", lat: 42.6964, lon: 23.4177, type: "large_airport" },
  { iata: "OTP", name: "Bucharest Henri Coandă International Airport", city: "Bucharest", country: "RO", lat: 44.5718, lon: 26.1033, type: "large_airport" },
  { iata: "CLJ", name: "Cluj International Airport", city: "Cluj-Napoca", country: "RO", lat: 46.7860, lon: 23.6857, type: "large_airport" },
  { iata: "TSR", name: "Timișoara Traian Vuia International Airport", city: "Timișoara", country: "RO", lat: 45.8099, lon: 21.3379, type: "large_airport" },
  { iata: "KTW", name: "Katowice Airport", city: "Katowice", country: "PL", lat: 50.4760, lon: 19.0807, type: "large_airport" },
  { iata: "WRO", name: "Wrocław Airport", city: "Wrocław", country: "PL", lat: 51.1037, lon: 16.8821, type: "large_airport" },
  { iata: "GDN", name: "Gdańsk Lech Wałęsa Airport", city: "Gdańsk", country: "PL", lat: 54.3776, lon: 18.4662, type: "large_airport" },
  { iata: "POZ", name: "Poznań-Ławica Airport", city: "Poznań", country: "PL", lat: 52.4216, lon: 16.8234, type: "large_airport" },
  { iata: "WMI", name: "Warsaw Modlin Airport", city: "Warsaw / Modlin", country: "PL", lat: 52.4511, lon: 20.6518, type: "large_airport" },
  { iata: "SZG", name: "Salzburg Airport", city: "Salzburg", country: "AT", lat: 47.7933, lon: 13.0043, type: "large_airport" },
  { iata: "INN", name: "Innsbruck Airport", city: "Innsbruck", country: "AT", lat: 47.2602, lon: 11.3440, type: "large_airport" },
  { iata: "GRZ", name: "Graz Airport", city: "Graz", country: "AT", lat: 46.9911, lon: 15.4396, type: "large_airport" },
  { iata: "LNZ", name: "Linz Airport", city: "Linz", country: "AT", lat: 48.2354, lon: 14.1881, type: "large_airport" },
  { iata: "KLU", name: "Klagenfurt Airport", city: "Klagenfurt", country: "AT", lat: 46.6425, lon: 14.3377, type: "large_airport" },
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
  { iata: "DMK", name: "Don Mueang International Airport", city: "Bangkok", country: "TH", lat: 13.9126, lon: 100.6067, type: "large_airport" },
  { iata: "HKT", name: "Phuket International Airport", city: "Phuket", country: "TH", lat: 8.1132, lon: 98.3169, type: "large_airport" },
  { iata: "CNX", name: "Chiang Mai International Airport", city: "Chiang Mai", country: "TH", lat: 18.7668, lon: 98.9626, type: "large_airport" },
  { iata: "HKG", name: "Hong Kong International Airport", city: "Hong Kong", country: "HK", lat: 22.308, lon: 113.9185, type: "large_airport" },
  { iata: "NRT", name: "Narita International Airport", city: "Tokyo", country: "JP", lat: 35.7647, lon: 140.3864, type: "large_airport" },
  { iata: "HND", name: "Tokyo Haneda Airport", city: "Tokyo", country: "JP", lat: 35.5494, lon: 139.7798, type: "large_airport" },
  { iata: "KIX", name: "Kansai International Airport", city: "Osaka", country: "JP", lat: 34.4347, lon: 135.2442, type: "large_airport" },
  { iata: "FUK", name: "Fukuoka Airport", city: "Fukuoka", country: "JP", lat: 33.5859, lon: 130.4507, type: "large_airport" },
  { iata: "CTS", name: "New Chitose Airport", city: "Sapporo", country: "JP", lat: 42.7752, lon: 141.6923, type: "large_airport" },
  { iata: "NGO", name: "Chubu Centrair International Airport", city: "Nagoya", country: "JP", lat: 34.8584, lon: 136.8053, type: "large_airport" },
  { iata: "ITM", name: "Osaka International (Itami) Airport", city: "Osaka", country: "JP", lat: 34.7855, lon: 135.4382, type: "large_airport" },
  { iata: "OKA", name: "Naha Airport", city: "Okinawa", country: "JP", lat: 26.1958, lon: 127.6458, type: "large_airport" },
  { iata: "ICN", name: "Incheon International Airport", city: "Seoul", country: "KR", lat: 37.4691, lon: 126.4505, type: "large_airport" },
  { iata: "SYD", name: "Sydney Airport", city: "Sydney", country: "AU", lat: -33.9461, lon: 151.1772, type: "large_airport" },
  { iata: "MEL", name: "Melbourne Airport", city: "Melbourne", country: "AU", lat: -37.6690, lon: 144.8410, type: "large_airport" },
  { iata: "DEL", name: "Indira Gandhi International Airport", city: "New Delhi", country: "IN", lat: 28.5562, lon: 77.1000, type: "large_airport" },

  // North America
  { iata: "TPA", name: "Tampa International Airport", city: "Tampa", country: "US", lat: 27.9755, lon: -82.5332, type: "large_airport" },
  { iata: "PIE", name: "St. Pete-Clearwater International Airport", city: "St. Petersburg", country: "US", lat: 27.9102, lon: -82.6874, type: "medium_airport" },
  { iata: "SRQ", name: "Sarasota Bradenton International Airport", city: "Sarasota", country: "US", lat: 27.3954, lon: -82.5544, type: "medium_airport" },
  { iata: "MCO", name: "Orlando International Airport", city: "Orlando", country: "US", lat: 28.4294, lon: -81.3090, type: "large_airport" },
  { iata: "SFB", name: "Orlando Sanford International Airport", city: "Sanford", country: "US", lat: 28.7776, lon: -81.2375, type: "medium_airport" },
  { iata: "DAB", name: "Daytona Beach International Airport", city: "Daytona Beach", country: "US", lat: 29.1799, lon: -81.0580, type: "medium_airport" },
  { iata: "MIA", name: "Miami International Airport", city: "Miami", country: "US", lat: 25.7959, lon: -80.2870, type: "large_airport" },
  { iata: "FLL", name: "Fort Lauderdale-Hollywood International Airport", city: "Fort Lauderdale", country: "US", lat: 26.0726, lon: -80.1527, type: "large_airport" },
  { iata: "PBI", name: "Palm Beach International Airport", city: "West Palm Beach", country: "US", lat: 26.6832, lon: -80.0956, type: "large_airport" },
  { iata: "RSW", name: "Southwest Florida International Airport", city: "Fort Myers", country: "US", lat: 26.5362, lon: -81.7552, type: "large_airport" },
  { iata: "JAX", name: "Jacksonville International Airport", city: "Jacksonville", country: "US", lat: 30.4941, lon: -81.6879, type: "large_airport" },
  { iata: "JFK", name: "John F. Kennedy International Airport", city: "New York", country: "US", lat: 40.6413, lon: -73.7781, type: "large_airport" },
  { iata: "EWR", name: "Newark Liberty International Airport", city: "New York / Newark", country: "US", lat: 40.6895, lon: -74.1745, type: "large_airport" },
  { iata: "LGA", name: "LaGuardia Airport", city: "New York", country: "US", lat: 40.7769, lon: -73.8740, type: "large_airport" },
  { iata: "BOS", name: "Boston Logan International Airport", city: "Boston", country: "US", lat: 42.3656, lon: -71.0096, type: "large_airport" },
  { iata: "LAX", name: "Los Angeles International Airport", city: "Los Angeles", country: "US", lat: 33.9425, lon: -118.4081, type: "large_airport" },
  { iata: "SFO", name: "San Francisco International Airport", city: "San Francisco", country: "US", lat: 37.6213, lon: -122.3790, type: "large_airport" },
  { iata: "ORD", name: "O'Hare International Airport", city: "Chicago", country: "US", lat: 41.9742, lon: -87.9073, type: "large_airport" },
  { iata: "DFW", name: "Dallas/Fort Worth International Airport", city: "Dallas", country: "US", lat: 32.8998, lon: -97.0403, type: "large_airport" },
  { iata: "ATL", name: "Hartsfield-Jackson Atlanta Airport", city: "Atlanta", country: "US", lat: 33.6407, lon: -84.4277, type: "large_airport" },
  { iata: "SEA", name: "Seattle-Tacoma International Airport", city: "Seattle", country: "US", lat: 47.4502, lon: -122.3088, type: "large_airport" },
  { iata: "YYZ", name: "Toronto Pearson International Airport", city: "Toronto", country: "CA", lat: 43.6777, lon: -79.6248, type: "large_airport" },
  { iata: "YVR", name: "Vancouver International Airport", city: "Vancouver", country: "CA", lat: 49.1967, lon: -123.1815, type: "large_airport" },
];

/** Matches the Popular Destinations carousel — shown until the user starts typing. */
export const POPULAR_DESTINATION_IATAS = [
  "CDG",
  "FRA",
  "FCO",
  "MXP",
  "ZRH",
  "PRG",
  "BUD",
  "JFK",
  "MCO",
  "TPA",
  "NRT",
  "BKK",
] as const;

export function getAirportByIata(iata: string): Airport | undefined {
  return FALLBACK_AIRPORTS.find((a) => a.iata.toUpperCase() === iata.toUpperCase());
}

export function getPopularDestinations(maxResults = 12): Airport[] {
  return POPULAR_DESTINATION_IATAS.map((code) => getAirportByIata(code))
    .filter((a): a is Airport => Boolean(a))
    .slice(0, maxResults);
}

export function searchAirportsClient(query: string, maxResults = 10): Airport[] {
  const q = query.trim().toLowerCase();
  if (!q) return getPopularDestinations(maxResults);

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
