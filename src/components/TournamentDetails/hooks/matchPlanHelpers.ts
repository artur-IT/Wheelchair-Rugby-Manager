export interface MatchDayOption {
  timestamp: number;
  label: string;
}

export const MATCH_DURATION_MINUTES = 90;
export const MATCH_DURATION_MS = MATCH_DURATION_MINUTES * 60 * 1000;

export function buildMatchDayOptions(startIso: string, endIso?: string) {
  const startDate = new Date(startIso);
  const endDate = endIso ? new Date(endIso) : startDate;
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return [];

  const first = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const last = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

  const formatter = new Intl.DateTimeFormat("pl-PL", { weekday: "long" });
  const options: MatchDayOption[] = [];

  const cur = new Date(first);
  while (cur <= last) {
    const label = `${formatter.format(cur)} (${cur.toLocaleDateString("pl-PL")})`;
    options.push({ timestamp: cur.getTime(), label });
    cur.setDate(cur.getDate() + 1);
  }

  return options;
}

export function formatDayOptionLabel(timestamp: number) {
  const d = new Date(timestamp);
  const formatter = new Intl.DateTimeFormat("pl-PL", { weekday: "long" });
  return `${formatter.format(d)} (${d.toLocaleDateString("pl-PL")})`;
}

export function getMatchDayTimestamp(scheduledAtIso: string) {
  const d = new Date(scheduledAtIso);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

export function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export function minutesToTime(minutes: number) {
  const normalized = ((minutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const hour = Math.floor(normalized / 60);
  const minute = normalized % 60;
  return `${pad2(hour)}:${pad2(minute)}`;
}

export function timeToMinutes(time: string) {
  const [hourRaw, minuteRaw] = time.split(":");
  const hour = Number(hourRaw);
  const minute = Number(minuteRaw);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  return hour * 60 + minute;
}

export function parseJerseyInfo(jerseyInfo?: string) {
  const fallbackA: "jasne" | "ciemne" = "jasne";
  const fallbackB: "jasne" | "ciemne" = "ciemne";
  if (!jerseyInfo) return { teamA: fallbackA, teamB: fallbackB };

  const normalized = jerseyInfo.toLowerCase();
  const tokenToValue = (token?: string): "jasne" | "ciemne" | undefined => {
    if (!token) return undefined;
    const t = token.toLowerCase();
    if (t === "jasne" || t === "jasny") return "jasne";
    if (t === "ciemne" || t === "ciemny") return "ciemne";
    return undefined;
  };

  const aToken = normalized.match(/team a:\s*(jasne|jasny|ciemne|ciemny)/)?.[1] as string | undefined;
  const bToken = normalized.match(/team b:\s*(jasne|jasny|ciemne|ciemny)/)?.[1] as string | undefined;

  return {
    teamA: tokenToValue(aToken) ?? fallbackA,
    teamB: tokenToValue(bToken) ?? fallbackB,
  };
}
