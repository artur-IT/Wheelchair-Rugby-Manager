import { Person, Tournament } from "./types";

export const MOCK_REFEREES: Person[] = [
  { id: "r1", firstName: "Sędzia", lastName: "Główny", email: "sedzia@rugby.pl", phone: "555666777" },
];

export const MOCK_CLASSIFIERS: Person[] = [
  { id: "c1", firstName: "Anna", lastName: "Klasyfikator", email: "anna@med.pl", phone: "444333222" },
];

export const MOCK_VOLUNTEERS: Person[] = [
  { id: "v1", firstName: "Tomek", lastName: "Pomocny", email: "tomek@vol.pl", phone: "111222333" },
];

export const MOCK_TOURNAMENTS: Tournament[] = [
  {
    id: "t1",
    name: "Turniej Otwarcia Sezonu",
    startDate: "2024-05-10",
    endDate: "2024-05-12",
    venue: {
      id: "v1",
      tournamentId: "t1",
      name: "Hala Arena",
      address: "ul. Olimpijska 1",
      mapUrl: "https://maps.google.com",
    },
    accommodation: {
      id: "a1",
      tournamentId: "t1",
      name: "Hotel Sport",
      address: "ul. Hotelowa 5",
      mapUrl: "https://maps.google.com",
    },
    teams: [],
    referees: [{ id: "r1", firstName: "Sędzia", lastName: "Główny", email: "sedzia@rugby.pl", phone: "555666777" }],
    classifiers: [{ id: "c1", firstName: "Anna", lastName: "Klasyfikator", email: "anna@med.pl", phone: "444333222" }],
    volunteers: [{ id: "v1", firstName: "Tomek", lastName: "Pomocny", email: "tomek@vol.pl", phone: "111222333" }],
    seasonId: "s1",
  },
];
