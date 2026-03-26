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
  optionalParkingSchema,
} from "@/lib/validateInputs";
import { createTournamentWithDetails, listTournamentsWithDetails } from "@/lib/tournaments";

const TournamentPayloadSchema = z
  .object({
    name: requiredTournamentNameSchema,
    startDate: z.string().datetime(),
    endDate: z.string().datetime().optional().nullable(),
    hotel: requiredHotelNameSchema,
    hotelCity: requiredCitySchema,
    hotelZipCode: requiredPostalCodeSchema,
    hotelStreet: requiredAddressSchema,
    mapLink: z.string().optional(),
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
    hallMapLink: z.string().optional(),
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

export const GET: APIRoute = async () => {
  try {
    const tournaments = await listTournamentsWithDetails();
    return json(tournaments);
  } catch {
    return json({ error: "Nie udało się pobrać turniejów." }, 500);
  }
};

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json().catch(() => null);
  const parsed = TournamentPayloadSchema.safeParse(body);

  if (!parsed.success) {
    return json({ error: parsed.error.flatten() }, 400);
  }

  const payload = parsed.data;

  try {
    const tournament = await createTournamentWithDetails({
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

    return json(tournament, 201);
  } catch (error) {
    if (error instanceof Error && error.message === "NO_SEASON_AVAILABLE") {
      return json({ error: "Brak sezonu. Utwórz sezon przed dodaniem turnieju." }, 400);
    }

    return json({ error: "Nie udało się zapisać turnieju." }, 500);
  }
};
