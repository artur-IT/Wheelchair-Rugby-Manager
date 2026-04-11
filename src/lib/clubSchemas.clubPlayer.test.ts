import { describe, expect, it } from "vitest";
import { ClubPlayerFieldsSchema } from "@/lib/clubSchemas";

describe("ClubPlayerFieldsSchema", () => {
  it("accepts explicit JSON null for optional skill ratings", () => {
    const parsed = ClubPlayerFieldsSchema.safeParse({
      clubId: "club-1",
      firstName: "Jan",
      lastName: "Nowak",
      classification: 1,
      number: "-",
      status: "ACTIVE",
      birthDate: null,
      contactEmail: null,
      contactPhone: null,
      speed: null,
      strength: null,
      endurance: null,
      technique: null,
      mentality: null,
      tactics: null,
      height: null,
    });
    expect(parsed.success).toBe(true);
  });
});
