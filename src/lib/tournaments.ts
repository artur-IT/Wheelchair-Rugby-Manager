import { prisma } from "@/lib/prisma";
import type { Match, Tournament } from "@/types";
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
      referees: { include: { referee: true } },
      classifiers: { include: { classifier: true } },
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
      referees: t.referees.map((tr) => ({
        id: tr.referee.id,
        firstName: tr.referee.firstName,
        lastName: tr.referee.lastName,
        email: tr.referee.email ?? undefined,
        phone: tr.referee.phone ?? undefined,
      })),
      classifiers: t.classifiers.map((tc) => ({
        id: tc.classifier.id,
        firstName: tc.classifier.firstName,
        lastName: tc.classifier.lastName,
        email: tc.classifier.email ?? undefined,
        phone: tc.classifier.phone ?? undefined,
      })),
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
  await prisma.tournamentTeam.deleteMany({
    where: { tournamentId, teamId },
  });
  return tournamentId;
}

export async function addRefereesToTournament(tournamentId: string, refereeIds: string[]) {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { id: true, seasonId: true },
  });
  if (!tournament) throw new Error("TOURNAMENT_NOT_FOUND");

  const referees = await prisma.referee.findMany({
    where: { id: { in: refereeIds } },
    select: { id: true, seasonId: true },
  });
  if (referees.length !== refereeIds.length) throw new Error("REFEREE_NOT_FOUND");
  const wrongSeason = referees.find((r) => r.seasonId !== tournament.seasonId);
  if (wrongSeason) throw new Error("REFEREE_WRONG_SEASON");

  await prisma.tournamentReferee.createMany({
    data: refereeIds.map((refereeId) => ({ tournamentId, refereeId })),
    skipDuplicates: true,
  });
  return tournamentId;
}

export async function removeRefereeFromTournament(tournamentId: string, refereeId: string) {
  await prisma.tournamentReferee.deleteMany({
    where: { tournamentId, refereeId },
  });
  return tournamentId;
}

export async function addClassifiersToTournament(tournamentId: string, classifierIds: string[]) {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { id: true, seasonId: true },
  });
  if (!tournament) throw new Error("TOURNAMENT_NOT_FOUND");

  const classifiers = await prisma.classifier.findMany({
    where: { id: { in: classifierIds } },
    select: { id: true, seasonId: true },
  });
  if (classifiers.length !== classifierIds.length) throw new Error("CLASSIFIER_NOT_FOUND");
  const wrongSeason = classifiers.find((c) => c.seasonId !== tournament.seasonId);
  if (wrongSeason) throw new Error("CLASSIFIER_WRONG_SEASON");

  await prisma.tournamentClassifier.createMany({
    data: classifierIds.map((classifierId) => ({ tournamentId, classifierId })),
    skipDuplicates: true,
  });
  return tournamentId;
}

export async function removeClassifierFromTournament(tournamentId: string, classifierId: string) {
  await prisma.tournamentClassifier.deleteMany({
    where: { tournamentId, classifierId },
  });
  return tournamentId;
}

interface CreateMatchInput {
  teamAId: string;
  teamBId: string;
  scheduledAt: string;
  court?: string;
  jerseyInfo?: string;
  scoreA?: number;
  scoreB?: number;
}

export async function listMatchesForTournament(tournamentId: string): Promise<Match[]> {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { id: true },
  });

  if (!tournament) throw new Error("TOURNAMENT_NOT_FOUND");

  const matches = await prisma.match.findMany({
    where: { tournamentId },
    orderBy: { scheduledAt: "asc" },
    select: {
      id: true,
      scheduledAt: true,
      court: true,
      jerseyInfo: true,
      scoreA: true,
      scoreB: true,
      status: true,
      tournamentId: true,
      teamAId: true,
      teamBId: true,
    },
  });

  return matches.map((m) => ({
    id: m.id,
    scheduledAt: m.scheduledAt.toISOString(),
    court: m.court ?? undefined,
    jerseyInfo: m.jerseyInfo ?? undefined,
    scoreA: m.scoreA ?? undefined,
    scoreB: m.scoreB ?? undefined,
    status: m.status,
    tournamentId: m.tournamentId,
    teamAId: m.teamAId,
    teamBId: m.teamBId,
  }));
}

export async function createMatchForTournament(tournamentId: string, input: CreateMatchInput): Promise<string> {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { id: true },
  });

  if (!tournament) throw new Error("TOURNAMENT_NOT_FOUND");

  // Ensure both teams are assigned to this tournament.
  const teams = await prisma.tournamentTeam.findMany({
    where: { tournamentId, teamId: { in: [input.teamAId, input.teamBId] } },
    select: { teamId: true },
  });

  if (teams.length !== 2 || input.teamAId === input.teamBId) {
    throw new Error("TEAM_NOT_IN_TOURNAMENT");
  }

  await prisma.match.create({
    data: {
      tournamentId,
      scheduledAt: new Date(input.scheduledAt),
      court: input.court ?? null,
      jerseyInfo: input.jerseyInfo ?? null,
      scoreA: input.scoreA ?? null,
      scoreB: input.scoreB ?? null,
      teamAId: input.teamAId,
      teamBId: input.teamBId,
    },
  });

  return tournamentId;
}

export async function updateMatchForTournament(
  tournamentId: string,
  matchId: string,
  input: CreateMatchInput
): Promise<string> {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { id: true },
  });

  if (!tournament) throw new Error("TOURNAMENT_NOT_FOUND");

  const existingMatch = await prisma.match.findUnique({
    where: { id: matchId },
    select: { id: true, tournamentId: true },
  });

  if (!existingMatch || existingMatch.tournamentId !== tournamentId) throw new Error("MATCH_NOT_FOUND");

  // Ensure both teams are assigned to this tournament.
  const teams = await prisma.tournamentTeam.findMany({
    where: { tournamentId, teamId: { in: [input.teamAId, input.teamBId] } },
    select: { teamId: true },
  });

  if (teams.length !== 2 || input.teamAId === input.teamBId) {
    throw new Error("TEAM_NOT_IN_TOURNAMENT");
  }

  await prisma.match.update({
    where: { id: matchId },
    data: {
      scheduledAt: new Date(input.scheduledAt),
      court: input.court ?? null,
      jerseyInfo: input.jerseyInfo ?? null,
      scoreA: input.scoreA ?? null,
      scoreB: input.scoreB ?? null,
      teamAId: input.teamAId,
      teamBId: input.teamBId,
    },
  });

  return tournamentId;
}

export async function deleteMatchForTournament(tournamentId: string, matchId: string): Promise<string> {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { id: true },
  });

  if (!tournament) throw new Error("TOURNAMENT_NOT_FOUND");

  const existingMatch = await prisma.match.findUnique({
    where: { id: matchId },
    select: { id: true, tournamentId: true },
  });

  if (!existingMatch || existingMatch.tournamentId !== tournamentId) throw new Error("MATCH_NOT_FOUND");

  await prisma.match.delete({ where: { id: matchId } });
  return tournamentId;
}
