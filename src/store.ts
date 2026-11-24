import { lagosToday, nowIso } from "./lagos";
import { sampleDesk } from "./seed";
import type { Desk, Drop, Persisted, ReturnInput, Rider, State } from "./types";

const KEY = "close.desk.v1";

function uid(): string {
  return crypto.randomUUID();
}

function loadPersisted(): Persisted {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return sampleDesk(lagosToday());
    const parsed = JSON.parse(raw) as Persisted;
    if (parsed?.v !== 1 || !parsed.desk || !Array.isArray(parsed.riders)) {
      return sampleDesk(lagosToday());
    }
    return parsed;
  } catch {
    return sampleDesk(lagosToday());
  }
}

let persisted = loadPersisted();
let viewDate = lagosToday();
let current: State = { ...persisted, viewDate };
const listeners = new Set<() => void>();

function refresh(persist = true): void {
  current = { ...persisted, viewDate };
  if (persist) localStorage.setItem(KEY, JSON.stringify(persisted));
  listeners.forEach((listener) => listener());
}

function emit(): void {
  refresh(true);
}

export function getState(): State {
  return current;
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setViewDate(date: string): void {
  viewDate = date;
  refresh(false);
}

export function setDesk(patch: Partial<Desk>): void {
  persisted = { ...persisted, desk: { ...persisted.desk, ...patch } };
  emit();
}

export function addRider(name: string, phone: string): void {
  const rider: Rider = { id: uid(), name: name.trim(), phone: phone.trim(), active: true };
  persisted = { ...persisted, riders: [...persisted.riders, rider] };
  emit();
}

export function updateRider(id: string, patch: Partial<Pick<Rider, "name" | "phone" | "active">>): void {
  persisted = {
    ...persisted,
    riders: persisted.riders.map((rider) => (rider.id === id ? { ...rider, ...patch } : rider)),
  };
  emit();
}

export function addDrop(input: Pick<Drop, "riderId" | "order" | "place" | "amountDue">): void {
  const drop: Drop = {
    id: uid(),
    date: viewDate,
    riderId: input.riderId,
    order: input.order.trim(),
    place: input.place.trim(),
    amountDue: input.amountDue,
    returned: 0,
    rail: null,
    ref: "",
    returnedAt: null,
  };
  persisted = { ...persisted, drops: [...persisted.drops, drop] };
  emit();
}

export function removeDrop(id: string): void {
  persisted = { ...persisted, drops: persisted.drops.filter((drop) => drop.id !== id) };
  emit();
}

export function recordReturn(id: string, input: ReturnInput): void {
  persisted = {
    ...persisted,
    drops: persisted.drops.map((drop) =>
      drop.id === id
        ? {
            ...drop,
            returned: input.returned,
            rail: input.rail,
            ref: input.ref.trim(),
            returnedAt: nowIso(),
          }
        : drop,
    ),
  };
  emit();
}

export function clearReturn(id: string): void {
  persisted = {
    ...persisted,
    drops: persisted.drops.map((drop) =>
      drop.id === id ? { ...drop, returned: 0, rail: null, ref: "", returnedAt: null } : drop,
    ),
  };
  emit();
}

export function markWaSent(riderId: string, date: string): void {
  const without = persisted.waSends.filter((send) => !(send.riderId === riderId && send.date === date));
  persisted = {
    ...persisted,
    waSends: [...without, { riderId, date, sentAt: nowIso() }],
  };
  emit();
}

export function resetSample(): void {
  viewDate = lagosToday();
  persisted = sampleDesk(viewDate);
  emit();
}
