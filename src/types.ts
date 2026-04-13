// ─── Enums (mirror Prisma enums) ─────────────────────────────────────────────

export type UserRole = "COACH" | "ORGANIZER";
export type MatchStatus = "SCHEDULED" | "COMPLETED" | "CANCELLED";
export type MealLocation = "HALL" | "HOTEL";
export type RefereeRole = "REFEREE_1" | "REFEREE_2" | "TABLE_CLOCK" | "TABLE_PENALTY";

// ─── Entities ────────────────────────────────────────────────────────────────

// Shared base for Coach, Referee, Classifier
export interface Person {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  notes?: string;
}

export interface Season {
  id: string;
  name: string;
  year: number;
  description?: string;
}

export interface Team {
  id: string;
  name: string;
  websiteUrl?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  contactFirstName?: string;
  contactLastName?: string;
  contactEmail?: string;
  contactPhone?: string;
  seasonId: string;
  coachId?: string;
  refereeId?: string;
  coach?: Person | null;
  referee?: Person | null;
  players?: Player[];
  staff?: Staff[];
}

export interface Staff {
  id: string;
  firstName: string;
  lastName: string;
  seasonId: string;
}

export interface Player {
  id: string;
  firstName: string;
  lastName: string;
  number?: number;
  classification?: number;
  teamId: string;
}

export interface SportsHall {
  id: string;
  name: string;
  address?: string;
  city?: string;
  street?: string;
  postalCode?: string;
  notes?: string;
  mapUrl?: string;
  tournamentId: string;
}

export interface Accommodation {
  id: string;
  name: string;
  address?: string;
  notes?: string;
  mapUrl?: string;
  tournamentId: string;
}

export interface Tournament {
  id: string;
  name: string;
  venue?: SportsHall;
  accommodation?: Accommodation;
  catering?: string;
  breakfastServingTime?: string;
  breakfastLocation?: MealLocation;
  lunchServingTime?: string;
  lunchLocation?: MealLocation;
  dinnerServingTime?: string;
  dinnerLocation?: MealLocation;
  cateringNotes?: string;
  parking?: string;
  teams: Team[];
  referees: Person[];
  classifiers: Person[];
  volunteers?: Volunteer[];
  startDate: string;
  endDate?: string;
  seasonId: string;
}

export interface Match {
  id: string;
  scheduledAt: string;
  court?: string;
  jerseyInfo?: string;
  scoreA?: number;
  scoreB?: number;
  status: MatchStatus;
  tournamentId: string;
  teamAId: string;
  teamBId: string;
}

export interface RefereeAssignment {
  id: string;
  role: RefereeRole;
  matchId: string;
  refereeId: string;
}

export interface RefereePlanMatch {
  matchId: string;
  scheduledAt: string;
  court?: string;
  teamAId: string;
  teamBId: string;
  refereeAssignments: Partial<Record<RefereeRole, string>>;
}

export interface UpsertRefereePlanMatchDto {
  teamAId: string;
  teamBId: string;
  scheduledAt: string; // ISO
  court?: string;
  referee1Id?: string;
  referee2Id?: string;
  tablePenaltyId?: string;
  tableClockId?: string;
}

export interface ClassificationExam {
  id: string;
  scheduledAt?: string;
  location?: string;
  result?: number;
  notes?: string;
  tournamentId: string;
  classifierId: string;
  playerId: string;
}

export interface ClassifierPlanEntry {
  examId: string;
  playerId: string;
  scheduledAt: string;
  endsAt: string;
  classification?: number;
  observation: boolean;
}

export interface UpsertClassifierPlanEntryDto {
  playerId: string;
  scheduledAt: string; // ISO
  endsAt: string; // ISO
  classification?: number;
  observation?: boolean;
}

export interface Volunteer {
  id: string;
  firstName: string;
  lastName: string;
  phone?: string;
  tournamentId: string;
}

// ─── DTOs ────────────────────────────────────────────────────────────────────

export interface CreateSeasonDto {
  name: string;
  year: number;
  description?: string;
}

export interface CreateTeamDto {
  name: string;
  address?: string;
  city?: string;
  postalCode?: string;
  websiteUrl?: string;
  contactFirstName?: string;
  contactLastName?: string;
  contactEmail?: string;
  contactPhone?: string;
  seasonId: string;
  coachId?: string;
  refereeId?: string;
  staff?: { firstName: string; lastName: string }[];
  players?: { id?: string; firstName: string; lastName: string; classification?: number; number?: number }[];
}

/** Same shape as create; seasonId can be omitted (server keeps existing). */
export type UpdateTeamDto = Omit<CreateTeamDto, "seasonId"> & { seasonId?: string };

interface CreatePersonDto {
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  seasonId: string;
}

export type CreateCoachDto = CreatePersonDto;
export type CreateRefereeDto = CreatePersonDto;
export type CreateClassifierDto = CreatePersonDto;
