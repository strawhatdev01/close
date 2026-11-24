import { prettyDate } from "./lagos";
import { naira } from "./money";
import { toWa } from "./phone";
import { shortage, type RiderBoard } from "./derive";
import type { Desk } from "./types";

export function morningText(desk: Desk, date: string, row: RiderBoard): string {
  const lines: string[] = [];
  lines.push(`Good morning ${firstName(row.rider.name)} — ${desk.name}, ${prettyDate(date)}`);
  lines.push("");

  if (row.today.length === 0) {
    lines.push("No new drops for you today.");
  } else {
    lines.push("Today");
    row.today.forEach((drop, i) => {
      const place = drop.place ? ` · ${drop.place}` : "";
      lines.push(`${i + 1}. ${drop.order}${place} · ${naira(drop.amountDue)}`);
    });
    lines.push("");
    lines.push(
      `${row.today.length} drop${row.today.length === 1 ? "" : "s"}. Bring back ${naira(row.expectedToday)}.`,
    );
  }

  if (row.priorShortage > 0) {
    lines.push("");
    lines.push(`You still have ${naira(row.priorShortage)} from earlier days:`);
    for (const drop of row.priorOpen) {
      lines.push(`- ${drop.order} · ${naira(shortage(drop))} still out`);
    }
    lines.push(`Total to return: ${naira(row.stillOut)}.`);
  }

  if (desk.bank && desk.accountNumber) {
    lines.push("");
    lines.push("Transfer:");
    lines.push(`${desk.bank} ${desk.accountNumber}`);
    if (desk.accountName) lines.push(desk.accountName);
    lines.push("Or cash to the desk. Send the transfer receipt or POS slip.");
  }

  return lines.join("\n");
}

export function waHref(phone: string, text: string): string {
  return `https://wa.me/${toWa(phone)}?text=${encodeURIComponent(text)}`;
}

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}
