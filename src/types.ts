// ─── Enums (mirror Prisma enums) ─────────────────────────────────────────────

export type UserRole = "COACH" | "ORGANIZER";
export type MatchStatus = "SCHEDULED" | "COMPLETED" | "CANCELLED";
export type MealLocation = "HALL" | "HOTEL" | "OTHER";
export type RefereeRole = "REFEREE_1" | "REFEREE_2" | "TABLE_CLOCK" | "TABLE_PENALTY";

// ─── Entities ────────────────────────────────────────────────────────────────

// Shared base for Coach, Referee, Classifier
export interface Person {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string | null;
}

export interface Season {
  id: string;
  name: string;
  year?: number;
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
  teamId: string;
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

export interface MealPlan {
  id: string;
  location: MealLocation;
  details?: string;
  tournamentId: string;
}

export interface Tournament {
  id: string;
  name: string;
  venue?: SportsHall;
  accommodation?: Accommodation;
  teams: Team[];
  referees: Person[];
  classifiers: Person[];
  volunteers?: Person[];
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
  players?: { firstName: string; lastName: string; classification?: number; number?: number }[];
}

/** Same shape as create; seasonId can be omitted (server keeps existing). */
export type UpdateTeamDto = Omit<CreateTeamDto, "seasonId"> & { seasonId?: string };

interface CreatePersonDto {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  seasonId: string;
}

export type CreateCoachDto = CreatePersonDto;
export type CreateRefereeDto = CreatePersonDto;
export type CreateClassifierDto = CreatePersonDto;
