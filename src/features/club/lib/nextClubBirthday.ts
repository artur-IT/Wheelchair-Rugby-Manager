import { startOfDay } from "date-fns";

export interface ClubPlayerBirthInput {
  firstName: string;
  lastName: string;
  birthDate?: string | null;
}

export interface NextClubBirthdayGroup {
  /** Full names, sorted alphabetically for stable UI */
  names: string[];
  /** Start of the next calendar day when the birthday occurs (local time) */
  nextOccurrence: Date;
}

/** YYYY-MM-DD month/day; rejects invalid calendar dates (e.g. Feb 30). */
export function parseBirthMonthDayFromIso(birthDate: string | null | undefined): { month: number; day: number } | null {
  if (!birthDate?.trim()) return null;
  const slice = birthDate.trim().slice(0, 10);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(slice);
  if (!match) return null;
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const probeYear = 2000;
  const test = new Date(probeYear, month - 1, day);
  if (test.getFullYear() !== probeYear || test.getMonth() !== month - 1 || test.getDate() !== day) return null;
  return { month, day };
}

function playerDisplayName(p: ClubPlayerBirthInput): string {
  const first = p.firstName?.trim() ?? "";
  const last = p.lastName?.trim() ?? "";
  const full = [first, last].filter(Boolean).join(" ");
  return full || first || last;
}

/** Next birthday on the calendar on or after `fromDay` (local, start of day). */
export function nextBirthdayOccurrence(month: number, day: number, fromDay: Date): Date {
  const start = startOfDay(fromDay);
  const y = start.getFullYear();
  let next = startOfDay(new Date(y, month - 1, day));
  if (next < start) {
    next = startOfDay(new Date(y + 1, month - 1, day));
  }
  return next;
}

/**
 * Among club players with a valid birthDate, finds the nearest next birthday (local calendar).
 * If several players share that same calendar day, all are included.
 */
export function findNextClubBirthdayGroup(
  players: ClubPlayerBirthInput[],
  referenceDate = new Date()
): NextClubBirthdayGroup | null {
  const today = startOfDay(referenceDate);
  interface CandidateRow {
    name: string;
    next: Date;
  }
  const candidates: CandidateRow[] = [];

  for (const p of players) {
    const md = parseBirthMonthDayFromIso(p.birthDate);
    if (!md) continue;
    const name = playerDisplayName(p);
    if (!name) continue;
    candidates.push({ name, next: nextBirthdayOccurrence(md.month, md.day, today) });
  }

  if (candidates.length === 0) return null;

  let minMs = Infinity;
  for (const c of candidates) {
    if (c.next.getTime() < minMs) minMs = c.next.getTime();
  }

  const winners = candidates.filter((c) => c.next.getTime() === minMs);
  const names = [...new Set(winners.map((w) => w.name))].sort((a, b) => a.localeCompare(b, "pl"));
  return { names, nextOccurrence: winners[0].next };
}

function formatPolishDayMonth(d: Date): string {
  return new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "long" }).format(d);
}

export interface NextClubBirthdayBannerParts {
  /** Opening clause (shown bold in the UI), without trailing space */
  lead: string;
  /** Space + name(s) + em dash + date + period */
  rest: string;
}

/** Split banner for styling; null if no player has a usable birth date. */
export function getNextClubBirthdayBannerParts(
  players: ClubPlayerBirthInput[],
  referenceDate = new Date()
): NextClubBirthdayBannerParts | null {
  const group = findNextClubBirthdayGroup(players, referenceDate);
  if (!group) return null;
  const dateLabel = formatPolishDayMonth(group.nextOccurrence);
  const namesList = group.names.join(", ");
  const rest = ` ${namesList} — ${dateLabel}.`;
  const lead = group.names.length === 1 ? "Niedługo swoje urodziny obchodzi:" : "Niedługo swoje urodziny obchodzą:";
  return { lead, rest };
}

/** Full banner sentence in Polish, or null if no player has a usable birth date. */
export function formatNextClubBirthdayBanner(
  players: ClubPlayerBirthInput[],
  referenceDate = new Date()
): string | null {
  const parts = getNextClubBirthdayBannerParts(players, referenceDate);
  if (!parts) return null;
  return `${parts.lead}${parts.rest}`;
}
