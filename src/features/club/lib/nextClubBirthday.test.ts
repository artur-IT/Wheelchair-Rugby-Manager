import { describe, expect, it } from "vitest";

import {
  findNextClubBirthdayGroup,
  formatNextClubBirthdayBanner,
  nextBirthdayOccurrence,
  parseBirthMonthDayFromIso,
} from "./nextClubBirthday";

describe("parseBirthMonthDayFromIso", () => {
  it("reads month and day from ISO date", () => {
    expect(parseBirthMonthDayFromIso("2010-03-15T00:00:00.000Z")).toEqual({ month: 3, day: 15 });
    expect(parseBirthMonthDayFromIso("2000-01-05")).toEqual({ month: 1, day: 5 });
  });

  it("returns null for invalid calendar dates", () => {
    expect(parseBirthMonthDayFromIso("2000-02-30")).toBeNull();
    expect(parseBirthMonthDayFromIso("")).toBeNull();
    expect(parseBirthMonthDayFromIso(null)).toBeNull();
  });
});

describe("nextBirthdayOccurrence", () => {
  it("uses this year when birthday is still ahead", () => {
    const ref = new Date(2026, 3, 10);
    const next = nextBirthdayOccurrence(5, 20, ref);
    expect(next.getFullYear()).toBe(2026);
    expect(next.getMonth()).toBe(4);
    expect(next.getDate()).toBe(20);
  });

  it("rolls to next year when birthday already passed", () => {
    const ref = new Date(2026, 5, 1);
    const next = nextBirthdayOccurrence(3, 15, ref);
    expect(next.getFullYear()).toBe(2027);
    expect(next.getMonth()).toBe(2);
    expect(next.getDate()).toBe(15);
  });

  it("includes today as the next occurrence", () => {
    const ref = new Date(2026, 3, 11);
    const next = nextBirthdayOccurrence(4, 11, ref);
    expect(next.getMonth()).toBe(3);
    expect(next.getDate()).toBe(11);
  });
});

describe("findNextClubBirthdayGroup", () => {
  it("picks the soonest birthday", () => {
    const ref = new Date(2026, 3, 10);
    const group = findNextClubBirthdayGroup(
      [
        { firstName: "Zosia", lastName: "Z", birthDate: "2000-12-01" },
        { firstName: "Adam", lastName: "A", birthDate: "2000-04-20" },
      ],
      ref
    );
    expect(group?.names).toEqual(["Adam A"]);
    expect(group?.nextOccurrence.getMonth()).toBe(3);
    expect(group?.nextOccurrence.getDate()).toBe(20);
  });

  it("groups players who share the same next calendar birthday", () => {
    const ref = new Date(2026, 3, 10);
    const group = findNextClubBirthdayGroup(
      [
        { firstName: "A", lastName: "One", birthDate: "1990-05-01" },
        { firstName: "B", lastName: "Two", birthDate: "1995-05-01" },
      ],
      ref
    );
    expect(group?.names).toEqual(["A One", "B Two"]);
  });
});

describe("formatNextClubBirthdayBanner", () => {
  it("returns null when no birth dates", () => {
    expect(formatNextClubBirthdayBanner([{ firstName: "X", lastName: "Y", birthDate: null }])).toBeNull();
  });

  it("uses singular verb for one player", () => {
    const ref = new Date(2026, 3, 10);
    const s = formatNextClubBirthdayBanner([{ firstName: "Jan", lastName: "Kowalski", birthDate: "2000-04-12" }], ref);
    expect(s).toContain("obchodzi:");
    expect(s).toContain("Jan Kowalski");
  });
});
