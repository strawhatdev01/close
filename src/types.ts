export type Rail = "cash" | "transfer" | "paystack" | "pos";

export type Rider = {
  id: string;
  name: string;
  phone: string;
  active: boolean;
};

export type Drop = {
  id: string;
  date: string;
  riderId: string;
  order: string;
  place: string;
  amountDue: number;
  returned: number;
  rail: Rail | null;
  ref: string;
  returnedAt: string | null;
};

export type WaSend = {
  riderId: string;
  date: string;
  sentAt: string;
};

export type Desk = {
  name: string;
  bank: string;
  accountNumber: string;
  accountName: string;
};

export type Persisted = {
  v: 1;
  desk: Desk;
  riders: Rider[];
  drops: Drop[];
  waSends: WaSend[];
};

export type State = Persisted & {
  viewDate: string;
};

export type ReturnInput = {
  returned: number;
  rail: Rail;
  ref: string;
};

export const RAILS: { id: Rail; label: string }[] = [
  { id: "cash", label: "Cash" },
  { id: "transfer", label: "Transfer" },
  { id: "paystack", label: "Paystack" },
  { id: "pos", label: "POS" },
];
