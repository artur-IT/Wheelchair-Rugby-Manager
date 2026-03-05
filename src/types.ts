export type Role = "ADMIN" | "ORGANIZER";

export interface ContactPerson {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export interface Person {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export interface Player extends Person {
  classification: number;
}

export interface Team {
  id: string;
  name: string;
  logoUrl?: string;
  address: string;
  contactPerson: ContactPerson;
  players: Player[];
  coach?: Person;
  staff: Person[];
}

export interface Venue {
  name: string;
  address: string;
  mapUrl: string;
}

export interface Tournament {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  venue: Venue;
  accommodation: Venue;
  catering: string;
  teams: string[]; // IDs of teams
  referees: string[]; // IDs of referees
  classifiers: string[]; // IDs of classifiers
  volunteers: string[]; // IDs of volunteers
  matches: Match[];
}

export interface Match {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  time: string;
  court: string;
  referees: string[]; // IDs
}

export interface SeasonSettings {
  referees: Person[];
  classifiers: Person[];
  volunteers: Person[];
  teams: Team[];
}
