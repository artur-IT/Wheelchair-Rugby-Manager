import { Team, Person, Tournament } from "./types";

export const MOCK_TEAMS: Team[] = [
  {
    id: "1",
    name: "Warsaw Dragons",
    address: "ul. Sportowa 1, Warszawa",
    contactPerson: { firstName: "Jan", lastName: "Kowalski", email: "jan@dragons.pl", phone: "123456789" },
    players: [
      { id: "p1", firstName: "Adam", lastName: "Nowak", email: "adam@test.com", phone: "111", classification: 2.0 },
      {
        id: "p2",
        firstName: "Piotr",
        lastName: "Zieliński",
        email: "piotr@test.com",
        phone: "222",
        classification: 3.5,
      },
    ],
    staff: [],
  },
  {
    id: "2",
    name: "Kraków Knights",
    address: "ul. Krakowska 10, Kraków",
    contactPerson: { firstName: "Marek", lastName: "Nowak", email: "marek@knights.pl", phone: "987654321" },
    players: [],
    staff: [],
  },
];

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
    venue: { name: "Hala Arena", address: "ul. Olimpijska 1", mapUrl: "https://maps.google.com" },
    accommodation: { name: "Hotel Sport", address: "ul. Hotelowa 5", mapUrl: "https://maps.google.com" },
    catering: "Pełne wyżywienie na hali",
    teams: ["1", "2"],
    referees: ["r1"],
    classifiers: ["c1"],
    volunteers: ["v1"],
    matches: [],
  },
];
