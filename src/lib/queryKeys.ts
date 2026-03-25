/**
 * Central query keys for TanStack Query — use factories so keys stay consistent.
 */
export const queryKeys = {
  tournaments: {
    all: ["tournaments"] as const,
    list: () => [...queryKeys.tournaments.all, "list"] as const,
    detail: (id: string) => [...queryKeys.tournaments.all, "detail", id] as const,
    matches: (id: string) => [...queryKeys.tournaments.all, "detail", id, "matches"] as const,
    refereePlan: (id: string) => [...queryKeys.tournaments.all, "detail", id, "refereePlan"] as const,
    classifierPlan: (id: string) => [...queryKeys.tournaments.all, "detail", id, "classifierPlan"] as const,
  },
  seasons: {
    all: ["seasons"] as const,
    list: () => [...queryKeys.seasons.all, "list"] as const,
    detail: (id: string) => [...queryKeys.seasons.all, "detail", id] as const,
  },
  teams: {
    all: ["teams"] as const,
    detail: (id: string) => [...queryKeys.teams.all, "detail", id] as const,
    bySeason: (seasonId: string) => [...queryKeys.teams.all, "list", seasonId] as const,
  },
  referees: {
    all: ["referees"] as const,
    bySeason: (seasonId: string) => [...queryKeys.referees.all, "list", seasonId] as const,
  },
  classifiers: {
    all: ["classifiers"] as const,
    bySeason: (seasonId: string) => [...queryKeys.classifiers.all, "list", seasonId] as const,
  },
  dashboard: {
    all: ["dashboard"] as const,
    /** Season-scoped dashboard bundle (tournaments + teams + referees for one season). */
    season: (seasonId: string) => [...queryKeys.dashboard.all, "season", seasonId] as const,
  },
} as const;
