import { describe, expect, it } from "vitest";
import { ClubTeamSchema, ClubUpsertSchema } from "@/lib/clubSchemas";

describe("ClubUpsertSchema / ClubTeamSchema (name fields)", () => {
  it("does not change club name casing (only trims edges)", () => {
    const parsed = ClubUpsertSchema.parse({
      ownerUserId: "user-1",
      name: "  aRtUr mAtI  ",
      contactAddress: undefined,
      contactCity: undefined,
      contactPostalCode: undefined,
      contactEmail: "",
      contactPhone: undefined,
      websiteUrl: "",
      logoUrl: "",
      contactFirstName: undefined,
      contactLastName: undefined,
      hallName: undefined,
      hallAddress: undefined,
      hallCity: undefined,
      hallPostalCode: undefined,
      hallMapUrl: "",
    });

    expect(parsed.name).toBe("aRtUr mAtI");
  });

  it("does not change team name casing (only trims edges)", () => {
    const parsed = ClubTeamSchema.parse({
      clubId: "club-1",
      name: "  wR tEaM ",
      formula: "WR4",
      coachId: undefined,
      playerIds: [],
    });

    expect(parsed.name).toBe("wR tEaM");
  });
});
