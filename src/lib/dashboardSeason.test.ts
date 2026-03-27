import { describe, expect, it } from "vitest";

import {
  formatTournamentDateRange,
  isTournamentCompleted,
  isTournamentOngoingOrUpcoming,
  sortTournamentsByEndDateDesc,
  sortTournamentsByStartDate,
  totalVolunteersAcrossTournaments,
} from "./dashboardSeason";
import type { Tournament } from "@/types";

describe("dashboardSeason", () => {
  describe("isTournamentOngoingOrUpcoming", () => {
    it("returns false when tournament ended before today", () => {
      const now = new Date(2025, 2, 20, 12, 0, 0);
      expect(
        isTournamentOngoingOrUpcoming(
          {
            startDate: new Date(2025, 2, 10).toISOString(),
            endDate: new Date(2025, 2, 15).toISOString(),
          },
          now
        )
      ).toBe(false);
    });

    it("returns true when end date is on or after today", () => {
      const now = new Date(2025, 2, 20, 12, 0, 0);
      expect(
        isTournamentOngoingOrUpcoming(
          {
            startDate: new Date(2025, 2, 18).toISOString(),
            endDate: new Date(2025, 2, 22).toISOString(),
          },
          now
        )
      ).toBe(true);
    });

    it("uses startDate when endDate is missing", () => {
      const now = new Date(2025, 2, 20, 12, 0, 0);
      expect(isTournamentOngoingOrUpcoming({ startDate: new Date(2025, 2, 25).toISOString() }, now)).toBe(true);
    });
  });

  describe("isTournamentCompleted", () => {
    it("is the opposite of ongoing for the same reference date", () => {
      const now = new Date(2025, 2, 20, 12, 0, 0);
      const ended = {
        startDate: new Date(2025, 2, 10).toISOString(),
        endDate: new Date(2025, 2, 15).toISOString(),
      };
      expect(isTournamentCompleted(ended, now)).toBe(true);
      expect(isTournamentOngoingOrUpcoming(ended, now)).toBe(false);
    });
  });

  describe("sortTournamentsByEndDateDesc", () => {
    it("orders by end date descending", () => {
      const older: Tournament = {
        id: "old",
        name: "Old",
        startDate: new Date(2025, 1, 1).toISOString(),
        endDate: new Date(2025, 1, 5).toISOString(),
        seasonId: "s",
        teams: [],
        referees: [],
        classifiers: [],
      };
      const newer: Tournament = {
        id: "new",
        name: "New",
        startDate: new Date(2025, 3, 1).toISOString(),
        endDate: new Date(2025, 3, 10).toISOString(),
        seasonId: "s",
        teams: [],
        referees: [],
        classifiers: [],
      };
      expect(sortTournamentsByEndDateDesc([older, newer]).map((t) => t.id)).toEqual(["new", "old"]);
    });
  });

  describe("sortTournamentsByStartDate", () => {
    it("sorts by startDate ascending", () => {
      const a: Tournament = {
        id: "a",
        name: "A",
        startDate: new Date(2025, 5, 1).toISOString(),
        seasonId: "s",
        teams: [],
        referees: [],
        classifiers: [],
      };
      const b: Tournament = {
        id: "b",
        name: "B",
        startDate: new Date(2025, 3, 1).toISOString(),
        seasonId: "s",
        teams: [],
        referees: [],
        classifiers: [],
      };
      const sorted = sortTournamentsByStartDate([a, b]);
      expect(sorted.map((t) => t.id)).toEqual(["b", "a"]);
    });
  });

  describe("totalVolunteersAcrossTournaments", () => {
    it("sums volunteer counts", () => {
      const t: Tournament[] = [
        {
          id: "1",
          name: "T1",
          startDate: "",
          seasonId: "s",
          teams: [],
          referees: [],
          classifiers: [],
          volunteers: [{ id: "v1", firstName: "A", lastName: "B", phone: "123456789", tournamentId: "1" }],
        },
        {
          id: "2",
          name: "T2",
          startDate: "",
          seasonId: "s",
          teams: [],
          referees: [],
          classifiers: [],
          volunteers: [{ id: "v2", firstName: "C", lastName: "D", phone: "123456789", tournamentId: "2" }],
        },
      ];
      expect(totalVolunteersAcrossTournaments(t)).toBe(2);
    });
  });

  describe("formatTournamentDateRange", () => {
    it("returns single day when only start or same day", () => {
      const s = new Date(2025, 4, 10, 12, 0, 0).toISOString();
      expect(formatTournamentDateRange(s)).toMatch(/10/);
    });
  });
});
