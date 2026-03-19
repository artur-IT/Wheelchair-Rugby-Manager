import { describe, expect, it } from "vitest";

import type { Tournament } from "@/types";
import { tournamentToTournamentFormDefaults } from "./tournamentFormMapping";

describe("tournamentFormMapping", () => {
  it("parses address into street/zip/city and maps tournament defaults", () => {
    const tournamentFixture: Tournament = {
      id: "t1",
      name: "Turniej Otwarcia Sezonu",
      startDate: "2024-05-10",
      endDate: "2024-05-12",
      seasonId: "s1",
      venue: {
        id: "v1",
        tournamentId: "t1",
        name: "Hala Arena",
        address: "ul. Olimpijska 1, 00-123 Warszawa",
        mapUrl: "https://maps.google.com",
      },
      accommodation: {
        id: "a1",
        tournamentId: "t1",
        name: "Hotel Sport",
        address: "ul. Hotelowa 5, 11-222 Krakow",
        mapUrl: "https://maps.google.com",
      },
      catering: "Hotel + Catering na hali",
      teams: [],
      referees: [],
      classifiers: [],
      volunteers: [],
    };

    const defaults = tournamentToTournamentFormDefaults(tournamentFixture);

    expect(defaults.name).toBe("Turniej Otwarcia Sezonu");
    // Form "Hala Sportowa" uses venue (hall) address
    expect(defaults.street).toBe("ul. Olimpijska 1");
    expect(defaults.zipCode).toBe("00-123");
    expect(defaults.city).toBe("Warszawa");
    expect(defaults.hotel).toBe("Hotel Sport");
    expect(defaults.hotelCity).toBe("Krakow");
    expect(defaults.hotelZipCode).toBe("11-222");
    expect(defaults.hotelStreet).toBe("ul. Hotelowa 5");
    expect(defaults.hallName).toBe("Hala Arena");
    expect(defaults.catering).toBe("Hotel + Catering na hali");

    expect(defaults.startDate).toBeInstanceOf(Date);
    expect(defaults.endDate).toBeInstanceOf(Date);
    expect(defaults.startDate.getFullYear()).toBe(2024);
    expect(defaults.startDate.getMonth()).toBe(4); // 0-indexed
    expect(defaults.startDate.getDate()).toBe(10);
    expect(defaults.endDate.getFullYear()).toBe(2024);
    expect(defaults.endDate.getMonth()).toBe(4);
    expect(defaults.endDate.getDate()).toBe(12);
  });

  it("uses explicit venue city, street, postalCode when present", () => {
    const tournament: Tournament = {
      id: "t1",
      name: "Test",
      startDate: "2024-05-10",
      endDate: "2024-05-12",
      seasonId: "s1",
      venue: {
        id: "v1",
        tournamentId: "t1",
        name: "Hala",
        address: "ignored, 99-999 Other",
        city: "Poznan",
        street: "ul. Sportowa 10",
        postalCode: "61-001",
      },
      teams: [],
      referees: [],
      classifiers: [],
      volunteers: [],
    };

    const defaults = tournamentToTournamentFormDefaults(tournament);
    expect(defaults.city).toBe("Poznan");
    expect(defaults.zipCode).toBe("61-001");
    expect(defaults.street).toBe("ul. Sportowa 10");
  });
});
