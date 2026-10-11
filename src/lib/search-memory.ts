/**
 * In-memory search draft for origin / destination.
 * Survives soft client navigations within the same JS runtime;
 * clears on hard refresh / new tab load.
 */

let memoryHomeAirport = "";
let memoryDestination = "";

export function getMemoryHomeAirport(): string {
  return memoryHomeAirport;
}

export function getMemoryDestination(): string {
  return memoryDestination;
}

export function setMemoryHomeAirport(iata: string): void {
  memoryHomeAirport = (iata || "").trim().toUpperCase();
}

export function setMemoryDestination(iata: string): void {
  memoryDestination = (iata || "").trim().toUpperCase();
}
