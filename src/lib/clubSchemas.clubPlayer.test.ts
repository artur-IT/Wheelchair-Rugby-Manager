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

  it("rejects birth dates in the future", () => {
    const parsed = ClubPlayerFieldsSchema.safeParse({
      clubId: "club-1",
      firstName: "Jan",
      lastName: "Nowak",
      classification: 1,
      number: "-",
      status: "ACTIVE",
      birthDate: "2099-01-01",
    });
    expect(parsed.success).toBe(false);
    if (parsed.success) return;
    expect(parsed.error.issues.some((i) => i.message.includes("przyszłości"))).toBe(true);
  });
});
