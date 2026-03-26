import { createPrismaClient } from "./prismaClient.mjs";

const prisma = createPrismaClient();

async function seedDb() {
  const user = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {
      name: "Admin",
      // Demo only. In real auth this should be an Argon2 hash.
      password: "demo-password",
      role: "ORGANIZER",
    },
    create: {
      name: "Admin",
      email: "admin@example.com",
      // Demo only. In real auth this should be an Argon2 hash.
      password: "demo-password",
      role: "ORGANIZER",
    },
  });

  const season = await prisma.season.create({
    data: {
      name: "Sezon demo",
      year: new Date().getFullYear(),
      description: "Przykładowe dane do klikania w aplikacji.",
    },
  });

  const coach = await prisma.coach.create({
    data: {
      seasonId: season.id,
      firstName: "Kamil",
      lastName: "Rdest",
      email: "coach@example.com",
      phone: "500600700",
    },
  });

  const refereeNameSeeds = [
    ["Robert", "Kwiecień"],
    ["Natalia", "Żmija"],
    ["Marek", "Szron"],
    ["Agnieszka", "Cisza"],
    ["Tomasz", "Bursztyn"],
    ["Kasia", "Mimoza"],
    ["Piotr", "Szept"],
    ["Ewa", "Prószyńska"],
    ["Łukasz", "Drzazga"],
    ["Karolina", "Wicher"],
  ];

  const referees = await Promise.all(
    refereeNameSeeds.map(([firstName, lastName], idx) =>
      prisma.referee.create({
        data: {
          seasonId: season.id,
          firstName,
          lastName,
          email: `ref${idx + 1}@example.com`,
          phone: `501502${String(100 + idx).slice(-3)}`,
        },
      })
    )
  );

  const classifierNameSeeds = [
    ["Klaudia", "Paproć"],
    ["Bartek", "Miedź"],
    ["Monika", "Kometka"],
    ["Rafał", "Dymny"],
    ["Magda", "Zagajnik"],
  ];

  const classifiers = await Promise.all(
    classifierNameSeeds.map(([firstName, lastName], idx) =>
      prisma.classifier.create({
        data: {
          seasonId: season.id,
          firstName,
          lastName,
          email: `cls${idx + 1}@example.com`,
          phone: `700800${String(100 + idx).slice(-3)}`,
        },
      })
    )
  );

  const teamSeeds = [
    { name: "Warszawa Warriors", city: "Warszawa", postalCode: "00-001", address: "ul. Przykładowa 1" },
    { name: "Kraków Crushers", city: "Kraków", postalCode: "30-001", address: "ul. Testowa 2" },
    { name: "Gdańsk Gryphons", city: "Gdańsk", postalCode: "80-001", address: "ul. Morska 3" },
    { name: "Wrocław Wolves", city: "Wrocław", postalCode: "50-001", address: "ul. Stadionowa 4" },
    { name: "Poznań Panthers", city: "Poznań", postalCode: "60-001", address: "ul. Sportowa 5" },
  ];

  const teams = await Promise.all(
    teamSeeds.map((t, idx) =>
      prisma.team.create({
        data: {
          seasonId: season.id,
          name: t.name,
          city: t.city,
          postalCode: t.postalCode,
          address: t.address,
          websiteUrl: "https://example.com",
          coachId: coach.id,
          refereeId: referees[idx % referees.length].id,
          contactFirstName: ["Ala", "Olek", "Iza", "Natan", "Pola"][idx],
          contactLastName: ["Błysk", "Czajka", "Mchy", "Kruka", "Zorza"][idx],
          contactEmail: `kontakt+team${idx + 1}@example.com`,
          contactPhone: `600700${String(100 + idx).slice(-3)}`,
        },
      })
    )
  );

  const firstNames = [
    "Jan",
    "Michał",
    "Ada",
    "Kacper",
    "Mateusz",
    "Filip",
    "Oskar",
    "Karol",
    "Paweł",
    "Marcin",
    "Lena",
    "Nela",
    "Inez",
    "Mila",
    "Noah",
    "Mori",
    "Vera",
    "Róża",
    "Sonia",
    "Teo",
    "Maja",
    "Kaja",
    "Oliwier",
    "Tymon",
    "Bruno",
    "Sara",
    "Iga",
    "Emil",
    "Hugo",
    "Kira",
  ];

  const lastNames = [
    "Kowalski",
    "Nowak",
    "Wójcik",
    "Kamiński",
    "Lewandowski",
    "Zając",
    "Szymański",
    "Woźniak",
    "Dąbrowski",
    "Kozłowski",
    "Kwiat",
    "Północ",
    "Mgiełka",
    "Rzeka",
    "Sosna",
    "Pióro",
    "Wątek",
    "Pustelnik",
    "Jagoda",
    "Koral",
    "Nurt",
    "Iskra",
    "Okruch",
    "Młynarz",
    "Sowa",
    "Wróbel",
    "Cień",
    "Brzeg",
    "Kruk",
    "Zorza",
  ];
  const classifications = [0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5];

  const playersByTeam = await Promise.all(
    teams.map((team, teamIdx) =>
      Promise.all(
        Array.from({ length: 10 }, (_, i) => {
          const number = i + 1; // unique per team (@@unique([teamId, number]))
          const firstName = firstNames[(i + teamIdx) % firstNames.length];
          const lastName = lastNames[(i * 2 + teamIdx) % lastNames.length];
          const classification = classifications[(i + teamIdx) % classifications.length];

          return prisma.player.create({
            data: { teamId: team.id, firstName, lastName, number, classification },
          });
        })
      )
    )
  );

  const staffNamePool = [
    ["Basia", "Gwiazdowska"],
    ["Ewa", "Koralik"],
    ["Marek", "Cisowski"],
    ["Iga", "Słomka"],
    ["Kamil", "Dębowy"],
    ["Aneta", "Wstążka"],
    ["Ola", "Płomień"],
    ["Bartek", "Piórkowski"],
    ["Monika", "Szyszkowa"],
    ["Rafał", "Szum"],
    ["Magda", "Pręcik"],
    ["Nina", "Bursztynowa"],
    ["Igor", "Kamyk"],
    ["Sara", "Drzewna"],
    ["Teodor", "Cichy"],
  ];

  const staffByTeam = await Promise.all(
    teams.map((team, teamIdx) =>
      Promise.all(
        Array.from({ length: 3 }, (_, i) => {
          const [firstName, lastName] = staffNamePool[(teamIdx * 3 + i) % staffNamePool.length];
          return prisma.staff.create({ data: { teamId: team.id, firstName, lastName } });
        })
      )
    )
  );

  const tournament = await prisma.tournament.create({
    data: {
      seasonId: season.id,
      name: "Turniej demo",
      startDate: new Date("2026-05-10T09:00:00.000Z"),
      endDate: new Date("2026-05-12T18:00:00.000Z"),
      catering: "Pelne wyzywienie dla uczestnikow turnieju.",
      breakfastServingTime: "07:00 - 09:00",
      breakfastLocation: "HOTEL",
      lunchServingTime: "12:00 - 14:00",
      lunchLocation: "HALL",
      dinnerServingTime: "18:00 - 20:00",
      dinnerLocation: "HOTEL",
      cateringNotes: "Opcje bezglutenowe po wczesniejszym zgloszeniu.",
      venues: {
        create: [
          {
            name: "Hala Arena",
            address: "ul. Olimpijska 1, 00-123 Warszawa",
            mapUrl: "https://maps.google.com",
          },
        ],
      },
      accommodations: {
        create: [
          {
            name: "Hotel Sport",
            address: "ul. Hotelowa 5, 11-222 Kraków",
            mapUrl: "https://maps.google.com",
          },
        ],
      },
      volunteers: {
        create: [{ firstName: "Wiktor", lastName: "Słoneczko", phone: "555666777" }],
      },
    },
  });

  await prisma.tournamentTeam.createMany({
    data: teams.map((team) => ({ tournamentId: tournament.id, teamId: team.id })),
  });

  await prisma.tournamentReferee.createMany({
    data: referees.map((r) => ({ tournamentId: tournament.id, refereeId: r.id })),
  });

  await prisma.tournamentClassifier.createMany({
    data: classifiers.map((c) => ({ tournamentId: tournament.id, classifierId: c.id })),
  });

  await prisma.tournamentPlayer.createMany({
    data: playersByTeam.flat().map((p) => ({ tournamentId: tournament.id, playerId: p.id })),
  });

  await prisma.tournamentStaff.createMany({
    data: staffByTeam.flat().map((s) => ({ tournamentId: tournament.id, staffId: s.id })),
  });

  const [teamA, teamB] = teams;
  const [referee1, referee2] = referees;
  const [classifier] = classifiers;
  const [playersA] = playersByTeam;

  const match = await prisma.match.create({
    data: {
      tournamentId: tournament.id,
      scheduledAt: new Date("2026-05-10T12:00:00.000Z"),
      court: "A",
      jerseyInfo: "Team A: jasne, Team B: ciemne",
      status: "SCHEDULED",
      teamAId: teamA.id,
      teamBId: teamB.id,
    },
  });

  await prisma.refereeAssignment.createMany({
    data: [
      { matchId: match.id, refereeId: referee1.id, role: "REFEREE_1" },
      { matchId: match.id, refereeId: referee2.id, role: "TABLE_CLOCK" },
    ],
  });

  await prisma.classificationExam.create({
    data: {
      tournamentId: tournament.id,
      classifierId: classifier.id,
      playerId: playersA[0].id,
      scheduledAt: new Date("2026-05-10T10:00:00.000Z"),
      location: "Pokój klasyfikacji",
      result: 2.0,
      notes: "Demo exam.",
    },
  });

  return { userId: user.id, seasonId: season.id, tournamentId: tournament.id };
}

try {
  const ids = await seedDb();
  // eslint-disable-next-line no-console, no-undef
  console.log("✅ Seed completed.", ids);
} catch (err) {
  // eslint-disable-next-line no-console, no-undef
  console.error("❌ Failed to seed database:", err);
  // eslint-disable-next-line no-undef
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
