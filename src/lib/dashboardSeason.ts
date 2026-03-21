import type { Tournament } from "@/types";

/** True if the tournament has not ended yet (calendar day of end >= today). */
export function isTournamentOngoingOrUpcoming(t: Pick<Tournament, "startDate" | "endDate">, now = new Date()): boolean {
  const end = t.endDate ? new Date(t.endDate) : new Date(t.startDate);
  const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return endDay.getTime() >= today.getTime();
}

export function sortTournamentsByStartDate(tournaments: Tournament[]): Tournament[] {
  return [...tournaments].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
}

/** True if the tournament has already ended (calendar day of end < today). */
export function isTournamentCompleted(t: Pick<Tournament, "startDate" | "endDate">, now = new Date()): boolean {
  return !isTournamentOngoingOrUpcoming(t, now);
}

/** Most recently ended first (by end date, else start date). */
export function sortTournamentsByEndDateDesc(tournaments: Tournament[]): Tournament[] {
  return [...tournaments].sort((a, b) => {
    const endA = a.endDate ? new Date(a.endDate) : new Date(a.startDate);
    const endB = b.endDate ? new Date(b.endDate) : new Date(b.startDate);
    return endB.getTime() - endA.getTime();
  });
}

export function totalVolunteersAcrossTournaments(tournaments: Tournament[]): number {
  return tournaments.reduce((sum, t) => sum + (t.volunteers?.length ?? 0), 0);
}

/** Formats ISO date range for dashboard list (Polish locale). */
export function formatTournamentDateRange(startIso: string, endIso?: string): string {
  const start = new Date(startIso);
  const end = endIso ? new Date(endIso) : start;
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" };
  const sameDay =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === end.getDate();
  if (endIso && !sameDay) {
    return `${start.toLocaleDateString("pl-PL", opts)} – ${end.toLocaleDateString("pl-PL", opts)}`;
  }
  return start.toLocaleDateString("pl-PL", opts);
}
