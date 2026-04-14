/** Thin wrapper so tests can mock navigation without touching non-configurable `location.assign`. */
export function assignLocation(url: string): void {
  window.location.assign(url);
}
