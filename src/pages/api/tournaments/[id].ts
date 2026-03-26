import type { APIRoute } from "astro";
import { z } from "zod";
import { json } from "@/lib/api";
import {
  requiredCateringSchema,
  requiredCitySchema,
  requiredHallNameSchema,
  requiredHotelNameSchema,
  requiredPostalCodeSchema,
  requiredTournamentNameSchema,
  requiredAddressSchema,
  optionalMapLinkSchema,
  optionalParkingSchema,
} from "@/lib/validateInputs";
import { deleteTournament, listTournamentsWithDetails, updateTournamentWithDetails } from "@/lib/tournaments";

const TournamentPayloadSchema = z
  .object({
    name: requiredTournamentNameSchema,
    startDate: z.string().datetime(),
    endDate: z.string().datetime().optional().nullable(),
    hotel: requiredHotelNameSchema,
    hotelCity: requiredCitySchema,
    hotelZipCode: requiredPostalCodeSchema,
    hotelStreet: requiredAddressSchema,
    mapLink: optionalMapLinkSchema,
    catering: requiredCateringSchema,
    breakfastServingTime: z.string(),
    breakfastLocation: z.enum(["hotel", "hala"]),
    lunchServingTime: z.string(),
    lunchLocation: z.enum(["hotel", "hala"]),
    dinnerServingTime: z.string(),
    dinnerLocation: z.enum(["hotel", "hala"]),
    cateringNotes: z.string(),
    parking: optionalParkingSchema,
    hallName: requiredHallNameSchema,
    city: requiredCitySchema,
    zipCode: requiredPostalCodeSchema,
    street: requiredAddressSchema,
    hallMapLink: optionalMapLinkSchema,
  })
  .refine(
    (data) => {
      if (!data.endDate) return true;
      return new Date(data.endDate) > new Date(data.startDate);
    },
    {
      message: "Data zakończenia musi być później niż data rozpoczęcia",
      path: ["endDate"],
    }
  );

export const GET: APIRoute = async ({ params }) => {
  const { id } = params;
  if (!id) return json({ error: "Brak id turnieju" }, 400);

  const tournaments = await listTournamentsWithDetails();
  const tournament = tournaments.find((t) => t.id === id) ?? null;

  if (!tournament) {
    return json({ error: "Nie znaleziono turnieju" }, 404);
  }

  return json(tournament);
};

export const PUT: APIRoute = async ({ params, request }) => {
  const { id } = params;
  if (!id) return json({ error: "Brak id turnieju" }, 400);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Nieprawidłowy format JSON" }, 400);
  }

  const parsed = TournamentPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return json({ error: parsed.error.flatten() }, 400);
  }

  const payload = parsed.data;

  try {
    await updateTournamentWithDetails(id, {
      name: payload.name,
      startDate: new Date(payload.startDate),
      endDate: payload.endDate ? new Date(payload.endDate) : undefined,
      hotel: payload.hotel,
      hotelCity: payload.hotelCity,
      hotelZipCode: payload.hotelZipCode,
      hotelStreet: payload.hotelStreet,
      mapLink: payload.mapLink ?? "",
      catering: payload.catering,
      breakfastServingTime: payload.breakfastServingTime,
      breakfastLocation: payload.breakfastLocation,
      lunchServingTime: payload.lunchServingTime,
      lunchLocation: payload.lunchLocation,
      dinnerServingTime: payload.dinnerServingTime,
      dinnerLocation: payload.dinnerLocation,
      cateringNotes: payload.cateringNotes,
      parking: payload.parking ?? "",
      hallName: payload.hallName,
      city: payload.city,
      zipCode: payload.zipCode,
      street: payload.street,
      hallMapLink: payload.hallMapLink ?? "",
    });

    return json({ ok: true }, 200);
  } catch (error) {
    if (error instanceof Error && error.message === "TOURNAMENT_NOT_FOUND") {
      return json({ error: "Nie znaleziono turnieju" }, 404);
    }

    return json({ error: "Nie udało się zapisać turnieju" }, 500);
  }
};

export const DELETE: APIRoute = async ({ params }) => {
  const { id } = params;
  if (!id) return json({ error: "Brak id turnieju" }, 400);

  try {
    await deleteTournament(id);
    return json({ ok: true }, 200);
  } catch (error) {
    if (error instanceof Error && error.message === "TOURNAMENT_NOT_FOUND") {
      return json({ error: "Nie znaleziono turnieju" }, 404);
    }

    return json({ error: "Nie udało się usunąć turnieju" }, 500);
  }
};
