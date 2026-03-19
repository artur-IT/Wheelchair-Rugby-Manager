import { prisma } from "@/lib/prisma";
import type { Tournament } from "@/types";
import type { TournamentFormData } from "@/lib/validateInputs";

/** Creates a tournament with basic details plus accommodation, hall and meal plan. */
export async function createTournamentWithDetails(form: TournamentFormData) {
  const latestSeason = await prisma.season.findFirst({
    orderBy: { createdAt: "desc" },
  });

  if (!latestSeason) {
    throw new Error("NO_SEASON_AVAILABLE");
  }

  const hotelAddress = `${form.hotelStreet}, ${form.hotelZipCode} ${form.hotelCity}`;
  const hallAddress = `${form.street}, ${form.zipCode} ${form.city}`;

  return prisma.$transaction(async (tx) => {
    const tournament = await tx.tournament.create({
      data: {
        name: form.name,
        startDate: form.startDate,
        endDate: form.endDate ?? null,
        seasonId: latestSeason.id,
      },
    });

    await tx.accommodation.create({
      data: {
        name: form.hotel,
        address: hotelAddress,
        notes: form.parking || null,
        mapUrl: form.mapLink || null,
        tournamentId: tournament.id,
      },
    });

    await tx.sportsHall.create({
      data: {
        name: form.hallName,
        address: hallAddress,
        city: form.city || null,
        street: form.street || null,
        postalCode: form.zipCode || null,
        notes: null,
        mapUrl: form.hallMapLink || null,
        tournamentId: tournament.id,
      },
    });

    await tx.mealPlan.create({
      data: {
        location: "OTHER",
        details: form.catering,
        tournamentId: tournament.id,
      },
    });

    return tournament;
  });
}

/** Returns tournaments with basic venue/accommodation info mapped to shared `Tournament` type. */
export async function listTournamentsWithDetails(): Promise<Tournament[]> {
  const tournaments = await prisma.tournament.findMany({
    orderBy: { startDate: "asc" },
    include: {
      venues: { orderBy: { id: "asc" } },
      accommodations: { orderBy: { id: "asc" } },
      mealPlans: { orderBy: { id: "asc" } },
      volunteers: true,
      teams: { include: { team: true } },
    },
  });

  return tournaments.map((t) => {
    const primaryVenue = t.venues[0] ?? null;
    const primaryAccommodation = t.accommodations[0] ?? null;
    const cateringMeal = t.mealPlans.find((m) => (m.details ?? "").trim().length > 0) ?? t.mealPlans[0] ?? null;

    return {
      id: t.id,
      name: t.name,
      startDate: t.startDate.toISOString(),
      endDate: t.endDate ? t.endDate.toISOString() : undefined,
      seasonId: t.seasonId,
      venue: primaryVenue
        ? {
            id: primaryVenue.id,
            name: primaryVenue.name,
            address: primaryVenue.address ?? undefined,
            city: primaryVenue.city ?? undefined,
            street: primaryVenue.street ?? undefined,
            postalCode: primaryVenue.postalCode ?? undefined,
            notes: primaryVenue.notes ?? undefined,
            mapUrl: primaryVenue.mapUrl ?? undefined,
            tournamentId: primaryVenue.tournamentId,
          }
        : undefined,
      accommodation: primaryAccommodation
        ? {
            id: primaryAccommodation.id,
            name: primaryAccommodation.name,
            address: primaryAccommodation.address ?? undefined,
            notes: primaryAccommodation.notes ?? undefined,
            mapUrl: primaryAccommodation.mapUrl ?? undefined,
            tournamentId: primaryAccommodation.tournamentId,
          }
        : undefined,
      catering: cateringMeal?.details ?? undefined,
      parking: primaryAccommodation?.notes ?? undefined,
      teams: t.teams.map((tt) => ({
        id: tt.team.id,
        name: tt.team.name,
        websiteUrl: tt.team.websiteUrl ?? undefined,
        address: tt.team.address ?? undefined,
        city: tt.team.city ?? undefined,
        postalCode: tt.team.postalCode ?? undefined,
        contactFirstName: tt.team.contactFirstName ?? undefined,
        contactLastName: tt.team.contactLastName ?? undefined,
        contactEmail: tt.team.contactEmail ?? undefined,
        contactPhone: tt.team.contactPhone ?? undefined,
        seasonId: tt.team.seasonId,
        coachId: tt.team.coachId ?? undefined,
        refereeId: tt.team.refereeId ?? undefined,
      })),
      referees: [],
      classifiers: [],
      volunteers: t.volunteers.map((v) => ({
        id: v.id,
        firstName: v.firstName,
        lastName: v.lastName,
        phone: v.phone ?? undefined,
        tournamentId: v.tournamentId,
      })),
    };
  });
}

/** Updates tournament basic details plus accommodation, hall and meal plan. */
export async function updateTournamentWithDetails(tournamentId: string, form: TournamentFormData) {
  const hotelAddress = `${form.hotelStreet}, ${form.hotelZipCode} ${form.hotelCity}`;
  const hallAddress = `${form.street}, ${form.zipCode} ${form.city}`;

  return prisma.$transaction(async (tx) => {
    const existing = await tx.tournament.findUnique({
      where: { id: tournamentId },
      select: { id: true },
    });

    if (!existing) {
      throw new Error("TOURNAMENT_NOT_FOUND");
    }

    await tx.tournament.update({
      where: { id: tournamentId },
      data: {
        name: form.name,
        startDate: form.startDate,
        endDate: form.endDate ?? null,
      },
    });

    // Replace tournament-specific details.
    await tx.sportsHall.deleteMany({ where: { tournamentId } });
    await tx.accommodation.deleteMany({ where: { tournamentId } });
    await tx.mealPlan.deleteMany({ where: { tournamentId } });

    await tx.accommodation.create({
      data: {
        name: form.hotel,
        address: hotelAddress,
        notes: form.parking || null,
        mapUrl: form.mapLink || null,
        tournamentId,
      },
    });

    await tx.sportsHall.create({
      data: {
        name: form.hallName,
        address: hallAddress,
        city: form.city || null,
        street: form.street || null,
        postalCode: form.zipCode || null,
        notes: null,
        mapUrl: form.hallMapLink || null,
        tournamentId,
      },
    });

    await tx.mealPlan.create({
      data: {
        location: "OTHER",
        details: form.catering,
        tournamentId,
      },
    });

    return tournamentId;
  });
}

export async function deleteTournament(tournamentId: string) {
  const existing = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { id: true },
  });

  if (!existing) {
    throw new Error("TOURNAMENT_NOT_FOUND");
  }

  await prisma.tournament.delete({ where: { id: tournamentId } });
  return tournamentId;
}

export async function addTeamsToTournament(tournamentId: string, teamIds: string[]) {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { id: true, seasonId: true },
  });

  if (!tournament) {
    throw new Error("TOURNAMENT_NOT_FOUND");
  }

  const teams = await prisma.team.findMany({
    where: { id: { in: teamIds } },
    select: { id: true, seasonId: true },
  });

  if (teams.length !== teamIds.length) {
    throw new Error("TEAM_NOT_FOUND");
  }

  const wrongSeason = teams.find((t) => t.seasonId !== tournament.seasonId);
  if (wrongSeason) {
    throw new Error("TEAM_WRONG_SEASON");
  }

  await prisma.tournamentTeam.createMany({
    data: teamIds.map((teamId) => ({ tournamentId, teamId })),
    skipDuplicates: true,
  });

  return tournamentId;
}

export async function removeTeamFromTournament(tournamentId: string, teamId: string) {
  // Delete relation row directly. If it doesn't exist, we treat it as a no-op.
  // This keeps the API safe for repeated clicks / stale UI state.
  await prisma.tournamentTeam.deleteMany({
    where: { tournamentId, teamId },
  });

  return tournamentId;
}
