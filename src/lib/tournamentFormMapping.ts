import type { Tournament } from "@/types";
import type { TournamentFormData } from "@/lib/validateInputs";

function calendarDayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function calendarKeyFromIso(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return calendarDayKey(d);
}

/** End date used for comparison when API has no endDate — matches `tournamentToTournamentFormDefaults`. */
function effectiveEndIsoForEditComparison(prev: Tournament): string {
  if (prev.endDate) return prev.endDate;
  const start = new Date(prev.startDate);
  if (Number.isNaN(start.getTime())) return prev.startDate;
  return new Date(start.getTime() + 86400000).toISOString();
}

/** True when submitted form dates differ from saved tournament (local calendar day). */
export function tournamentDatesChangedForEdit(prev: Tournament, next: TournamentFormData): boolean {
  const nextStart = next.startDate instanceof Date ? next.startDate : new Date(next.startDate);
  const nextEnd = next.endDate instanceof Date ? next.endDate : new Date(next.endDate);
  if (Number.isNaN(nextStart.getTime()) || Number.isNaN(nextEnd.getTime())) return true;

  if (calendarKeyFromIso(prev.startDate) !== calendarDayKey(nextStart)) return true;

  return calendarKeyFromIso(effectiveEndIsoForEditComparison(prev)) !== calendarDayKey(nextEnd);
}

const ZIP_CODE_REGEX = /^\d{2}-\d{3}$/;
const DEFAULT_MEAL_LOCATION = "hotel";

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

function mapMealLocationToForm(location: Tournament["breakfastLocation"]): "hotel" | "hala" {
  if (location === "HALL") return "hala";
  return DEFAULT_MEAL_LOCATION;
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
    catering: tournament.catering ?? "",
    breakfastServingTime: tournament.breakfastServingTime ?? "",
    breakfastLocation: mapMealLocationToForm(tournament.breakfastLocation),
    lunchServingTime: tournament.lunchServingTime ?? "",
    lunchLocation: mapMealLocationToForm(tournament.lunchLocation),
    dinnerServingTime: tournament.dinnerServingTime ?? "",
    dinnerLocation: mapMealLocationToForm(tournament.dinnerLocation),
    cateringNotes: tournament.cateringNotes ?? "",
    parking: tournament.parking ?? "",
    hallName: tournament.venue?.name ?? "Brak danych",
    hallMapLink: tournament.venue?.mapUrl ?? "",
  };
}
