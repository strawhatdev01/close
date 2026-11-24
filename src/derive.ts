import { shortageOf } from "./money";
import type { Drop, Rider, State, WaSend } from "./types";

export function shortage(drop: Drop): number {
  return shortageOf(drop.amountDue, drop.returned);
}

export type RiderBoard = {
  rider: Rider;
  today: Drop[];
  priorOpen: Drop[];
  expectedToday: number;
  returnedToday: number;
  shortageToday: number;
  priorShortage: number;
  stillOut: number;
  waSent: boolean;
};

export type DayBoard = {
  expectedToday: number;
  returnedToday: number;
  shortageToday: number;
  priorShortage: number;
  stillOut: number;
  owingRiders: RiderBoard[];
  settledRiders: RiderBoard[];
  idleRiders: RiderBoard[];
};

function sum(drops: Drop[], pick: (drop: Drop) => number): number {
  return drops.reduce((total, drop) => total + pick(drop), 0);
}

function sentOn(sends: WaSend[], riderId: string, date: string): boolean {
  return sends.some((send) => send.riderId === riderId && send.date === date);
}

export function riderBoard(state: State, rider: Rider): RiderBoard {
  const today = state.drops
    .filter((drop) => drop.riderId === rider.id && drop.date === state.viewDate)
    .sort((a, b) => a.order.localeCompare(b.order));
  const priorOpen = state.drops
    .filter((drop) => drop.riderId === rider.id && drop.date < state.viewDate && shortage(drop) > 0)
    .sort((a, b) => a.date.localeCompare(b.date) || a.order.localeCompare(b.order));
  const expectedToday = sum(today, (drop) => drop.amountDue);
  const returnedToday = sum(today, (drop) => drop.returned);
  const shortageToday = sum(today, shortage);
  const priorShortage = sum(priorOpen, shortage);
  return {
    rider,
    today,
    priorOpen,
    expectedToday,
    returnedToday,
    shortageToday,
    priorShortage,
    stillOut: shortageToday + priorShortage,
    waSent: sentOn(state.waSends, rider.id, state.viewDate),
  };
}

export function dayBoard(state: State): DayBoard {
  const active = state.riders.filter((rider) => rider.active);
  const rows = active
    .map((rider) => riderBoard(state, rider))
    .sort((a, b) => b.stillOut - a.stillOut || a.rider.name.localeCompare(b.rider.name));

  const owingRiders = rows.filter((row) => row.stillOut > 0);
  const settledRiders = rows.filter(
    (row) => row.stillOut === 0 && (row.today.length > 0 || row.priorOpen.length > 0),
  );
  const idleRiders = rows.filter((row) => row.today.length === 0 && row.priorOpen.length === 0);

  return {
    expectedToday: rows.reduce((n, row) => n + row.expectedToday, 0),
    returnedToday: rows.reduce((n, row) => n + row.returnedToday, 0),
    shortageToday: rows.reduce((n, row) => n + row.shortageToday, 0),
    priorShortage: rows.reduce((n, row) => n + row.priorShortage, 0),
    stillOut: rows.reduce((n, row) => n + row.stillOut, 0),
    owingRiders,
    settledRiders,
    idleRiders,
  };
}

export function railTotals(drops: Drop[]): { rail: Drop["rail"]; amount: number }[] {
  const today = drops.filter((drop) => drop.returned > 0);
  const map = new Map<Drop["rail"], number>();
  for (const drop of today) {
    map.set(drop.rail, (map.get(drop.rail) ?? 0) + drop.returned);
  }
  return [...map.entries()].map(([rail, amount]) => ({ rail, amount }));
}
