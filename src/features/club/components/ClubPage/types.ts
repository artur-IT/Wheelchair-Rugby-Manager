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
}

export interface ClubPlayerDto {
  id: string;
  firstName: string;
  lastName: string;
}

export interface ClubTeamDto {
  id: string;
  name: string;
  formula: "WR4" | "WR5";
  coach?: ClubCoachDto | null;
  players: { player: ClubPlayerDto }[];
}
