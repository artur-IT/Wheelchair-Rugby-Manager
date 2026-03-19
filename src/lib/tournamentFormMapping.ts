import type { Tournament } from "@/types";
import type { TournamentFormData } from "@/lib/validateInputs";

const ZIP_CODE_REGEX = /^\d{2}-\d{3}$/;

export function parseAddressParts(address: string): { street: string; zipCode: string; city: string } {
  const fallback = { street: "", zipCode: "00-000", city: "Miasto" };
  const normalized = (address ?? "").trim();
  if (!normalized) return fallback;

  const commaIndex = normalized.indexOf(",");
  const streetFromComma = commaIndex >= 0 ? normalized.slice(0, commaIndex).trim() : "";
  const restFromComma = commaIndex >= 0 ? normalized.slice(commaIndex + 1).trim() : normalized;

  const tokens = restFromComma.split(/\s+/).filter(Boolean);

  const zipIndex = tokens.findIndex((t) => ZIP_CODE_REGEX.test(t));
  if (zipIndex >= 0) {
    const zipCode = tokens[zipIndex] ?? fallback.zipCode;
    const city =
      tokens
        .slice(zipIndex + 1)
        .join(" ")
        .trim() || fallback.city;
    return { street: streetFromComma || normalized, zipCode, city };
  }

  // Last fallback: no ZIP found; try best-effort: "STREET ZIP CITY" without comma
  return { street: streetFromComma || normalized, zipCode: fallback.zipCode, city: restFromComma || fallback.city };
}

export function tournamentToTournamentFormDefaults(tournament: Tournament): TournamentFormData {
  const startDate = new Date(tournament.startDate);
  const validStart = !Number.isNaN(startDate.getTime()) ? startDate : new Date();

  const endDate = tournament.endDate ? new Date(tournament.endDate) : new Date(validStart.getTime() + 86400000);
  const validEnd = !Number.isNaN(endDate.getTime()) ? endDate : new Date(validStart.getTime() + 86400000);

  // Hall (venue) address — prefer explicit fields, then parsed
  const venue = tournament.venue;
  const venueAddress = venue?.address ?? "";
  const hallParts = parseAddressParts(venueAddress);
  const city = venue?.city ?? hallParts.city;
  const zipCode = venue?.postalCode ?? hallParts.zipCode;
  const street = venue?.street ?? (hallParts.street || "Brak danych");

  // Hotel (accommodation) address — parsed from single address string
  const accommodationAddress = tournament.accommodation?.address ?? "";
  const hotelParts = parseAddressParts(accommodationAddress);

  return {
    name: tournament.name,
    startDate: validStart,
    endDate: validEnd,
    hotel: tournament.accommodation?.name ?? "Brak danych",
    hotelCity: hotelParts.city,
    hotelZipCode: hotelParts.zipCode,
    hotelStreet: hotelParts.street || "Brak danych",
    mapLink: tournament.accommodation?.mapUrl ?? "",
    city,
    zipCode,
    street,
    catering: tournament.catering ?? "Brak danych",
    parking: tournament.parking ?? "",
    hallName: tournament.venue?.name ?? "Brak danych",
    hallMapLink: tournament.venue?.mapUrl ?? "",
  };
}
