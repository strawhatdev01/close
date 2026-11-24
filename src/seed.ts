import { shiftDate } from "./lagos";
import type { Drop, Persisted, Rider } from "./types";

const riders: Rider[] = [
  { id: "r1", name: "Tunde Balogun", phone: "08034412281", active: true },
  { id: "r2", name: "Blessing Okeke", phone: "08162041190", active: true },
  { id: "r3", name: "Chinedu Eze", phone: "07085539012", active: true },
  { id: "r4", name: "Aisha Bello", phone: "09017764308", active: true },
  { id: "r5", name: "Kelvin Adeyemi", phone: "08029186674", active: true },
  { id: "r6", name: "Seyi Adebayo", phone: "08103321456", active: true },
  { id: "r7", name: "Maryam Yusuf", phone: "08056672290", active: true },
  { id: "r8", name: "Ibrahim Musa", phone: "09134408812", active: true },
];

function drop(
  id: string,
  date: string,
  riderId: string,
  order: string,
  place: string,
  amountDue: number,
  returned = 0,
  rail: Drop["rail"] = null,
  ref = "",
  returnedAt: string | null = null,
): Drop {
  return { id, date, riderId, order, place, amountDue, returned, rail, ref, returnedAt };
}

export function sampleDesk(today: string): Persisted {
  const yesterday = shiftDate(today, -1);
  const afternoon = `${today}T13:40:00.000Z`;

  return {
    v: 1,
    desk: {
      name: "Yaba Runners",
      bank: "GTBank",
      accountNumber: "0581234567",
      accountName: "Yaba Runners",
    },
    riders,
    waSends: [
      { riderId: "r1", date: today, sentAt: `${today}T06:42:00.000Z` },
      { riderId: "r2", date: today, sentAt: `${today}T06:43:00.000Z` },
      { riderId: "r6", date: today, sentAt: `${today}T06:44:00.000Z` },
    ],
    drops: [
      drop("d1", yesterday, "r3", "ORD-381", "Surulere", 3200),
      drop("d2", today, "r1", "ORD-402", "Lekki Phase 1", 4500, 4500, "cash", "", afternoon),
      drop("d3", today, "r1", "ORD-407", "Ajah", 3200, 3200, "transfer", "GTB-8821", afternoon),
      drop("d4", today, "r2", "ORD-403", "Yaba Market", 2100, 2100, "transfer", "GTB-8824", afternoon),
      drop("d5", today, "r2", "ORD-409", "Unilag", 4500, 4500, "paystack", "PSK-19F2", afternoon),
      drop("d6", today, "r2", "ORD-414", "Jibowu", 1800, 1800, "cash", "", afternoon),
      drop("d7", today, "r3", "ORD-404", "Palmgrove", 4200),
      drop("d8", today, "r3", "ORD-411", "Maryland", 3800),
      drop("d9", today, "r4", "ORD-405", "Ikeja GRA", 8000, 2800, "pos", "MON-4401", afternoon),
      drop("d10", today, "r5", "ORD-406", "VI", 6500),
      drop("d11", today, "r5", "ORD-412", "Ikoyi", 5900),
      drop("d12", today, "r6", "ORD-408", "Gbagada", 5500, 5500, "paystack", "PSK-20AB", afternoon),
      drop("d13", today, "r7", "ORD-410", "Bariga", 3500),
      drop("d14", today, "r7", "ORD-415", "Obanikoro", 7200, 7200, "cash", "", afternoon),
      drop("d15", today, "r8", "ORD-413", "Ojodu", 4100, 4100, "pos", "MON-4418", afternoon),
      drop("d16", today, "r8", "ORD-416", "Magodo", 2300, 2300, "transfer", "GTB-8830", afternoon),
    ],
  };
}
