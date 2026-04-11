export interface ClubDto {
  id: string;
  ownerUserId: string;
  name: string;
  contactAddress?: string | null;
  contactCity?: string | null;
  contactPostalCode?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  websiteUrl?: string | null;
  logoUrl?: string | null;
  contactFirstName?: string | null;
  contactLastName?: string | null;
  hallName?: string | null;
  hallAddress?: string | null;
  hallCity?: string | null;
  hallPostalCode?: string | null;
  hallMapUrl?: string | null;
  createdAt: string;
}

export interface ClubCreatePayload {
  name: string;
  logoUrl?: string | null;
}

export interface ClubCoachDto {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
}

export interface ClubPlayerDto {
  id: string;
  firstName: string;
  lastName: string;
  classification?: number | null;
  number?: number | null;
  status?: "ACTIVE" | "INACTIVE" | "GUEST";
  birthDate?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  contactAddress?: string | null;
  contactCity?: string | null;
  contactPostalCode?: string | null;
  contactMapUrl?: string | null;
  speed?: number | null;
  strength?: number | null;
  endurance?: number | null;
  technique?: number | null;
  mentality?: number | null;
  tactics?: number | null;
}

export interface ClubVolunteerDto {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
}

export interface ClubRefereeDto {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
}

export interface ClubStaffDto {
  id: string;
  firstName: string;
  lastName: string;
  role: "VOLUNTEER" | "REFEREE" | "OTHER";
  email?: string | null;
  phone?: string | null;
}

export interface ClubTeamDto {
  id: string;
  name: string;
  formula: "WR4" | "WR5";
  coach?: ClubCoachDto | null;
  players: { player: ClubPlayerDto }[];
}
