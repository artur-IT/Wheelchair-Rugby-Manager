import { toTitleCase } from "@/lib/validateInputs";

/** Google Maps search URL; city/postal can live inside `address` with the street. */
export function buildGoogleMapsSearchUrl(parts: { name?: string; address?: string }): string | null {
  const name = parts.name?.trim() ?? "";
  const address = parts.address?.trim() ?? "";
  const chunks = [name, address].filter(Boolean);
  if (chunks.length === 0) {
    return null;
  }
  const query = chunks.join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

/** Prefer a stored map link; otherwise build a search URL from name and address. */
export function resolveMapsHref(params: { mapUrl?: string; name?: string; address?: string }): string | null {
  const manual = params.mapUrl?.trim();
  if (manual && /^https?:\/\//i.test(manual)) {
    return manual;
  }
  return buildGoogleMapsSearchUrl({ name: params.name, address: params.address });
}

/** Same as resolveMapsHref for a venue/accommodation object; returns null when place is missing. */
export function resolvePlaceMapsHref(
  place: { mapUrl?: string; name?: string; address?: string } | null | undefined
): string | null {
  if (!place) {
    return null;
  }
  return resolveMapsHref(place);
}

/** Splits "street, city postal" at the first comma into two display lines. */
export function getAddressLines(address: string): string[] {
  const comma = address.indexOf(",");
  if (comma === -1) {
    return address.trim() ? [address.trim()] : [];
  }
  const street = address.slice(0, comma).trim();
  const cityLine = address.slice(comma + 1).trim();
  return [street, cityLine].filter(Boolean);
}

/** Title-cases each line of a comma-split address for readable UI (fixes all-lowercase input). */
export function formatAddressForDisplay(address: string | null | undefined, lineJoin: "\n" | ", " = "\n"): string {
  const raw = (address ?? "").trim();
  if (!raw) {
    return "";
  }
  return getAddressLines(raw)
    .map((line) => toTitleCase(line))
    .join(lineJoin);
}
