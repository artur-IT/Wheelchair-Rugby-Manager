import { prisma } from "@/lib/prisma";
import type { Match, Tournament } from "@/types";
import type { TournamentFormData } from "@/lib/validateInputs";

function mapMealLocationFromForm(location: TournamentFormData["breakfastLocation"]): "HALL" | "HOTEL" {
  return location === "hala" ? "HALL" : "HOTEL";
}

/** Creates a tournament with basic details plus accommodation, hall and meal plan. */
export async function createTournamentWithDetails(form: TournamentFormData) {
  const latestSeason = await prisma.season.findFirst({
    orderBy: { createdAt: "desc" },
  });

  if (!latestSeason) {
    throw new Error("NO_SEASON_AVAILABLE");
  }

  const hotelAddress = `${form.hotelStreet}, ${form.hotelZipCode} ${form.hotelCity}`;

  return prisma.$transaction(async (tx) => {
    const tournament = await tx.tournament.create({
      data: {
        name: form.name,
        startDate: form.startDate,
        endDate: form.endDate ?? null,
        catering: form.catering,
        breakfastServingTime: form.breakfastServingTime,
        breakfastLocation: mapMealLocationFromForm(form.breakfastLocation),
        lunchServingTime: form.lunchServingTime,
        lunchLocation: mapMealLocationFromForm(form.lunchLocation),
        dinnerServingTime: form.dinnerServingTime,
        dinnerLocation: mapMealLocationFromForm(form.dinnerLocation),
        cateringNotes: form.cateringNotes,
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
        city: form.city || null,
        street: form.street || null,
        postalCode: form.zipCode || null,
        notes: null,
        mapUrl: form.hallMapLink || null,
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
      volunteers: true,
      teams: {
        include: {
          team: {
            include: {
              players: {
                orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
              },
            },
          },
        },
      },
      referees: { include: { referee: true } },
      classifiers: { include: { classifier: true } },
    },
  });

  return tournaments.map((t) => {
    const primaryVenue = t.venues[0] ?? null;
    const primaryAccommodation = t.accommodations[0] ?? null;
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
            address:
              [primaryVenue.street, `${primaryVenue.postalCode ?? ""} ${primaryVenue.city ?? ""}`.trim()]
                .map((v) => (v ?? "").trim())
                .filter(Boolean)
                .join(", ") || undefined,
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
      catering: t.catering ?? undefined,
      breakfastServingTime: t.breakfastServingTime ?? undefined,
      breakfastLocation: t.breakfastLocation ?? undefined,
      lunchServingTime: t.lunchServingTime ?? undefined,
      lunchLocation: t.lunchLocation ?? undefined,
      dinnerServingTime: t.dinnerServingTime ?? undefined,
      dinnerLocation: t.dinnerLocation ?? undefined,
      cateringNotes: t.cateringNotes ?? undefined,
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
        players: tt.team.players.map((player) => ({
          id: player.id,
          firstName: player.firstName,
          lastName: player.lastName,
          number: player.number ?? undefined,
          classification: player.classification ?? undefined,
          teamId: player.teamId,
        })),
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
        catering: form.catering,
        breakfastServingTime: form.breakfastServingTime,
        breakfastLocation: mapMealLocationFromForm(form.breakfastLocation),
        lunchServingTime: form.lunchServingTime,
        lunchLocation: mapMealLocationFromForm(form.lunchLocation),
        dinnerServingTime: form.dinnerServingTime,
        dinnerLocation: mapMealLocationFromForm(form.dinnerLocation),
        cateringNotes: form.cateringNotes,
      },
    });

    // Replace tournament-specific details.
    await tx.sportsHall.deleteMany({ where: { tournamentId } });
    await tx.accommodation.deleteMany({ where: { tournamentId } });

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
        city: form.city || null,
        street: form.street || null,
        postalCode: form.zipCode || null,
        notes: null,
        mapUrl: form.hallMapLink || null,
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

const MATCH_DURATION_MS = 90 * 60 * 1000;

function normalizeCourt(court?: string) {
  const next = (court ?? "").trim();
  return next === "" ? null : next;
}

async function ensureNoCourtTimeConflict(args: {
  tournamentId: string;
  scheduledAt: Date;
  court: string;
  excludeMatchId?: string;
}) {
  const scheduledAtMs = args.scheduledAt.getTime();
  if (Number.isNaN(scheduledAtMs)) throw new Error("INVALID_SCHEDULED_AT");

  const endsAtMs = scheduledAtMs + MATCH_DURATION_MS;

  const existingMatches = await prisma.match.findMany({
    where: {
      tournamentId: args.tournamentId,
      court: args.court,
      id: args.excludeMatchId ? { not: args.excludeMatchId } : undefined,
    },
    select: { scheduledAt: true },
  });

  for (const m of existingMatches) {
    const startMs = m.scheduledAt.getTime();
    if (Number.isNaN(startMs)) continue;
    const endMs = startMs + MATCH_DURATION_MS;

    // overlap if: start < otherEnd && otherStart < end
    if (scheduledAtMs < endMs && startMs < endsAtMs) {
      throw new Error("COURT_TIME_CONFLICT");
    }
  }
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

  const scheduledAt = new Date(input.scheduledAt);
  if (Number.isNaN(scheduledAt.getTime())) throw new Error("INVALID_SCHEDULED_AT");

  // Ensure both teams are assigned to this tournament.
  const teams = await prisma.tournamentTeam.findMany({
    where: { tournamentId, teamId: { in: [input.teamAId, input.teamBId] } },
    select: { teamId: true },
  });

  if (teams.length !== 2 || input.teamAId === input.teamBId) {
    throw new Error("TEAM_NOT_IN_TOURNAMENT");
  }

  const normalizedCourt = normalizeCourt(input.court);
  if (normalizedCourt) {
    await ensureNoCourtTimeConflict({ tournamentId, scheduledAt, court: normalizedCourt });
  }

  await prisma.match.create({
    data: {
      tournamentId,
      scheduledAt,
      court: normalizedCourt,
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

  const scheduledAt = new Date(input.scheduledAt);
  if (Number.isNaN(scheduledAt.getTime())) throw new Error("INVALID_SCHEDULED_AT");

  // Ensure both teams are assigned to this tournament.
  const teams = await prisma.tournamentTeam.findMany({
    where: { tournamentId, teamId: { in: [input.teamAId, input.teamBId] } },
    select: { teamId: true },
  });

  if (teams.length !== 2 || input.teamAId === input.teamBId) {
    throw new Error("TEAM_NOT_IN_TOURNAMENT");
  }

  const normalizedCourt = normalizeCourt(input.court);
  if (normalizedCourt) {
    await ensureNoCourtTimeConflict({
      tournamentId,
      scheduledAt,
      court: normalizedCourt,
      excludeMatchId: matchId,
    });
  }

  await prisma.match.update({
    where: { id: matchId },
    data: {
      scheduledAt,
      court: normalizedCourt,
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
