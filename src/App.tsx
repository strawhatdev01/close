import { useEffect, useMemo, useState, useSyncExternalStore, type FormEvent, type ReactNode } from "react";
import { dayBoard, railTotals, shortage, type RiderBoard } from "./derive";
import { lagosToday, prettyDate, shiftDate } from "./lagos";
import { naira, parseNaira } from "./money";
import { displayNg, isNgPhone } from "./phone";
import {
  addDrop,
  addRider,
  clearReturn,
  getState,
  markWaSent,
  recordReturn,
  removeDrop,
  resetSample,
  setDesk,
  setViewDate,
  subscribe,
  updateRider,
} from "./store";
import { RAILS, type Drop, type Rail } from "./types";
import { morningText, waHref } from "./whatsapp";

type Sheet = "wa" | "add" | "desk" | { drop: Drop } | null;

function useOnline(): boolean {
  const [online, setOnline] = useState(() => navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);
  return online;
}

export function App() {
  const state = useSyncExternalStore(subscribe, getState, getState);
  const online = useOnline();
  const board = useMemo(() => dayBoard(state), [state]);
  const [sheet, setSheet] = useState<Sheet>(null);
  const today = lagosToday();
  const viewingToday = state.viewDate === today;
  const returnedDrops = state.drops.filter(
    (drop) => drop.date === state.viewDate && drop.returned > 0,
  );
  const rails = railTotals(returnedDrops);
  const owingNames = board.owingRiders.map((row) => row.rider.name.split(" ")[0]);

  return (
    <div className="shell">
      <header className="top">
        <div>
          <p className="brand">Close</p>
          <p className="desk-name">{state.desk.name}</p>
        </div>
        <div className="top-actions">
          <span className={online ? "pill" : "pill pill-off"}>{online ? "Online" : "Network down"}</span>
          <button type="button" className="text-btn" onClick={() => setSheet("desk")}>
            Desk
          </button>
        </div>
      </header>

      <p className="demo-note">
        Sample Lagos desk. Numbers stay on this phone. Nobody else can see what you type.
      </p>

      {!online ? (
        <p className="offline-note">
          Network is down. Shortages stay on this phone. WhatsApp waits until you have data.
        </p>
      ) : null}

      <nav className="date-nav" aria-label="Day">
        <button type="button" onClick={() => setViewDate(shiftDate(state.viewDate, -1))} aria-label="Previous day">
          ‹
        </button>
        <div>
          <strong>{prettyDate(state.viewDate)}</strong>
          <span>{viewingToday ? "Today, Lagos" : "Not today"}</span>
        </div>
        <button
          type="button"
          onClick={() => setViewDate(shiftDate(state.viewDate, 1))}
          disabled={state.viewDate >= today}
          aria-label="Next day"
        >
          ›
        </button>
      </nav>

      <section className={board.stillOut > 0 ? "hero hero-owe" : "hero hero-clear"}>
        <p className="hero-kicker">
          {board.stillOut > 0 ? "Still with riders" : "Nothing outstanding"}
        </p>
        <p className="hero-amount">{naira(board.stillOut)}</p>
        {board.stillOut > 0 ? (
          <p className="hero-who">
            {owingNames.join(" · ")}
            {board.priorShortage > 0
              ? ` · ${naira(board.priorShortage)} of this is from before today`
              : null}
          </p>
        ) : (
          <p className="hero-who">Expected {naira(board.expectedToday)} is back.</p>
        )}
      </section>

      <dl className="stats">
        <div>
          <dt>Expected today</dt>
          <dd>{naira(board.expectedToday)}</dd>
        </div>
        <div>
          <dt>Back today</dt>
          <dd>{naira(board.returnedToday)}</dd>
        </div>
        <div>
          <dt>Today still out</dt>
          <dd>{naira(board.shortageToday)}</dd>
        </div>
      </dl>

      {rails.length > 0 ? (
        <p className="rails">
          Back as{" "}
          {rails
            .map((row) => `${railLabel(row.rail)} ${naira(row.amount)}`)
            .join(" · ")}
        </p>
      ) : null}

      <div className="actions">
        <button type="button" className="btn btn-primary" onClick={() => setSheet("wa")}>
          WhatsApp morning lists
        </button>
        <button type="button" className="btn" onClick={() => setSheet("add")}>
          Add a drop
        </button>
      </div>

      {board.owingRiders.length > 0 ? (
        <section>
          <h2>Who still has the money</h2>
          {board.owingRiders.map((row) => (
            <RiderCard
              key={row.rider.id}
              row={row}
              viewDate={state.viewDate}
              defaultOpen
              onReturn={(drop) => setSheet({ drop })}
              onRemove={removeDrop}
            />
          ))}
        </section>
      ) : null}

      {board.settledRiders.length > 0 ? (
        <section>
          <h2>Settled</h2>
          {board.settledRiders.map((row) => (
            <RiderCard
              key={row.rider.id}
              row={row}
              viewDate={state.viewDate}
              onReturn={(drop) => setSheet({ drop })}
              onRemove={removeDrop}
            />
          ))}
        </section>
      ) : null}

      {board.owingRiders.length === 0 && board.settledRiders.length === 0 ? (
        <p className="empty">
          No drops on {prettyDate(state.viewDate)}. Add the morning list, then WhatsApp each rider.
        </p>
      ) : null}

      {sheet === "wa" ? (
        <Sheet title="Morning lists" onClose={() => setSheet(null)}>
          <MorningLists
            rows={[...board.owingRiders, ...board.settledRiders, ...board.idleRiders].filter(
              (row) => row.today.length > 0 || row.priorShortage > 0,
            )}
            desk={state.desk}
            date={state.viewDate}
            online={online}
            onSent={(riderId) => markWaSent(riderId, state.viewDate)}
          />
        </Sheet>
      ) : null}

      {sheet === "add" ? (
        <Sheet title="Add a drop" onClose={() => setSheet(null)}>
          <AddDropForm
            riders={state.riders.filter((rider) => rider.active)}
            onDone={() => setSheet(null)}
          />
        </Sheet>
      ) : null}

      {sheet === "desk" ? (
        <Sheet title="Desk" onClose={() => setSheet(null)}>
          <DeskSettings />
        </Sheet>
      ) : null}

      {sheet && typeof sheet === "object" && "drop" in sheet ? (
        <Sheet title="Mark returned" onClose={() => setSheet(null)}>
          <ReturnForm
            drop={sheet.drop}
            riderName={state.riders.find((rider) => rider.id === sheet.drop.riderId)?.name ?? "Rider"}
            onDone={() => setSheet(null)}
          />
        </Sheet>
      ) : null}
    </div>
  );
}

function RiderCard({
  row,
  viewDate,
  defaultOpen = false,
  onReturn,
  onRemove,
}: {
  row: RiderBoard;
  viewDate: string;
  defaultOpen?: boolean;
  onReturn: (drop: Drop) => void;
  onRemove: (id: string) => void;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <details
      className={row.stillOut > 0 ? "card card-owe" : "card"}
      open={open}
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary>
        <span>
          <strong>{row.rider.name}</strong>
          <em>{displayNg(row.rider.phone)}</em>
        </span>
        <span className={row.stillOut > 0 ? "money still" : "money ok"}>
          {row.stillOut > 0 ? `${naira(row.stillOut)} still` : "Settled"}
        </span>
      </summary>
      {row.priorOpen.length > 0 ? (
        <div className="prior">
          <p>From earlier days</p>
          {row.priorOpen.map((drop) => (
            <DropRow key={drop.id} drop={drop} onReturn={onReturn} onRemove={onRemove} showDate />
          ))}
        </div>
      ) : null}
      {row.today.length === 0 ? (
        <p className="muted">No drops on {prettyDate(viewDate)}.</p>
      ) : (
        row.today.map((drop) => (
          <DropRow key={drop.id} drop={drop} onReturn={onReturn} onRemove={onRemove} />
        ))
      )}
    </details>
  );
}

function DropRow({
  drop,
  onReturn,
  onRemove,
  showDate = false,
}: {
  drop: Drop;
  onReturn: (drop: Drop) => void;
  onRemove: (id: string) => void;
  showDate?: boolean;
}) {
  const due = shortage(drop);
  return (
    <div className="drop">
      <div>
        <strong>
          {drop.order}
          {showDate ? ` · ${prettyDate(drop.date)}` : ""}
        </strong>
        <span>
          {drop.place}
          {drop.rail ? ` · ${railLabel(drop.rail)}${drop.ref ? ` ${drop.ref}` : ""}` : ""}
        </span>
      </div>
      <div className="drop-amt">
        <span>
          {naira(drop.amountDue)}
          {drop.returned > 0 ? ` · back ${naira(drop.returned)}` : ""}
        </span>
        <span className={due > 0 ? "still" : "ok"}>{due > 0 ? `${naira(due)} out` : "Back"}</span>
      </div>
      <div className="drop-actions">
        <button type="button" onClick={() => onReturn(drop)}>
          {drop.returned > 0 ? "Edit return" : "Mark returned"}
        </button>
        {drop.returned === 0 ? (
          <button type="button" className="danger" onClick={() => onRemove(drop.id)}>
            Remove
          </button>
        ) : null}
      </div>
    </div>
  );
}

function MorningLists({
  rows,
  desk,
  date,
  online,
  onSent,
}: {
  rows: RiderBoard[];
  desk: ReturnType<typeof getState>["desk"];
  date: string;
  online: boolean;
  onSent: (riderId: string) => void;
}) {
  if (rows.length === 0) {
    return <p className="muted">Add drops first, then send each rider their list.</p>;
  }
  return (
    <ul className="wa-list">
      {rows.map((row) => {
        const text = morningText(desk, date, row);
        const href = waHref(row.rider.phone, text);
        return (
          <li key={row.rider.id}>
            <div>
              <strong>{row.rider.name}</strong>
              <span>
                {row.today.length} today · {naira(row.stillOut)} to return
                {row.waSent ? " · sent" : ""}
              </span>
            </div>
            <div className="wa-actions">
              {online && isNgPhone(row.rider.phone) ? (
                <a
                  className="btn btn-primary"
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => onSent(row.rider.id)}
                >
                  WhatsApp
                </a>
              ) : (
                <span className="muted">{online ? "Need a phone number" : "Waiting for data"}</span>
              )}
              <button
                type="button"
                className="btn"
                onClick={() => {
                  void navigator.clipboard.writeText(text);
                }}
              >
                Copy
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function AddDropForm({
  riders,
  onDone,
}: {
  riders: ReturnType<typeof getState>["riders"];
  onDone: () => void;
}) {
  const [order, setOrder] = useState("");
  const [place, setPlace] = useState("");
  const [riderId, setRiderId] = useState(riders[0]?.id ?? "");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    const amountDue = parseNaira(amount);
    if (!order.trim()) {
      setError("Order needs a name or number.");
      return;
    }
    if (!riderId) {
      setError("Pick a rider.");
      return;
    }
    if (amountDue === null || amountDue === 0) {
      setError("Amount due is the naira the rider should bring back.");
      return;
    }
    addDrop({ riderId, order, place, amountDue });
    onDone();
  }

  if (riders.length === 0) {
    return <p className="muted">Add a rider on the desk page first.</p>;
  }

  return (
    <form className="form" onSubmit={submit}>
      <label>
        Order
        <input value={order} onChange={(e) => setOrder(e.target.value)} placeholder="ORD-420 or Mrs Ade" autoFocus />
      </label>
      <label>
        Area
        <input value={place} onChange={(e) => setPlace(e.target.value)} placeholder="Yaba, Lekki…" />
      </label>
      <label>
        Rider
        <select value={riderId} onChange={(e) => setRiderId(e.target.value)}>
          {riders.map((rider) => (
            <option key={rider.id} value={rider.id}>
              {rider.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Amount due
        <input
          inputMode="numeric"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="4500"
        />
      </label>
      {error ? <p className="error">{error}</p> : null}
      <button type="submit" className="btn btn-primary">
        Add drop
      </button>
    </form>
  );
}

function ReturnForm({
  drop,
  riderName,
  onDone,
}: {
  drop: Drop;
  riderName: string;
  onDone: () => void;
}) {
  const remaining = shortage(drop) || drop.amountDue;
  const [amount, setAmount] = useState(String(drop.returned || remaining));
  const [rail, setRail] = useState<Rail>(drop.rail ?? "cash");
  const [ref, setRef] = useState(drop.ref);
  const [error, setError] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    const returned = parseNaira(amount);
    if (returned === null) {
      setError("Enter what came back.");
      return;
    }
    if (returned > drop.amountDue) {
      setError(`Due is ${naira(drop.amountDue)}.`);
      return;
    }
    recordReturn(drop.id, { returned, rail, ref });
    onDone();
  }

  return (
    <form className="form" onSubmit={submit}>
      <p className="muted">
        {riderName} · {drop.order}
        {drop.place ? ` · ${drop.place}` : ""} · due {naira(drop.amountDue)}
      </p>
      <fieldset className="rails-pick">
        <legend>How it came back</legend>
        {RAILS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={rail === item.id ? "rail on" : "rail"}
            onClick={() => setRail(item.id)}
          >
            {item.label}
          </button>
        ))}
      </fieldset>
      <label>
        Amount returned
        <input inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} />
      </label>
      {rail !== "cash" ? (
        <label>
          Ref or slip
          <input
            value={ref}
            onChange={(e) => setRef(e.target.value)}
            placeholder={rail === "paystack" ? "Paystack ref" : "Last 4 or alert"}
          />
        </label>
      ) : null}
      {error ? <p className="error">{error}</p> : null}
      <div className="actions">
        <button type="submit" className="btn btn-primary">
          Save return
        </button>
        {drop.returned > 0 ? (
          <button
            type="button"
            className="btn"
            onClick={() => {
              clearReturn(drop.id);
              onDone();
            }}
          >
            Clear
          </button>
        ) : null}
      </div>
    </form>
  );
}

function DeskSettings() {
  const state = useSyncExternalStore(subscribe, getState, getState);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [riderError, setRiderError] = useState("");

  function add(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      setRiderError("Name is required.");
      return;
    }
    if (!isNgPhone(phone)) {
      setRiderError("Use a Nigerian number, like 0803 123 4567.");
      return;
    }
    addRider(name, phone);
    setName("");
    setPhone("");
    setRiderError("");
  }

  return (
    <div className="desk-form">
      <label>
        Desk name
        <input
          value={state.desk.name}
          onChange={(e) => setDesk({ name: e.target.value })}
        />
      </label>
      <label>
        Bank
        <input
          value={state.desk.bank}
          onChange={(e) => setDesk({ bank: e.target.value })}
          placeholder="GTBank"
        />
      </label>
      <label>
        Account number
        <input
          value={state.desk.accountNumber}
          onChange={(e) => setDesk({ accountNumber: e.target.value })}
          inputMode="numeric"
        />
      </label>
      <label>
        Account name
        <input
          value={state.desk.accountName}
          onChange={(e) => setDesk({ accountName: e.target.value })}
        />
      </label>

      <h3>Riders</h3>
      <p className="muted">Name and WhatsApp only. The desk is billed, not the rider.</p>
      <ul className="rider-edit">
        {state.riders.map((rider) => (
          <li key={rider.id} className={rider.active ? undefined : "dim"}>
            <span>
              {rider.name}
              <em>{displayNg(rider.phone)}</em>
            </span>
            <button type="button" onClick={() => updateRider(rider.id, { active: !rider.active })}>
              {rider.active ? "Hide" : "Show"}
            </button>
          </li>
        ))}
      </ul>
      <form className="form inline" onSubmit={add}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Rider name" />
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="0803 000 0000"
          inputMode="tel"
        />
        <button type="submit" className="btn">
          Add rider
        </button>
      </form>
      {riderError ? <p className="error">{riderError}</p> : null}

      <p className="price">₦1,000–2,000 per rider a month, charged to this desk.</p>
      <button type="button" className="text-btn" onClick={resetSample}>
        Reload the sample day
      </button>
    </div>
  );
}

function Sheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="overlay" onClick={onClose} role="presentation">
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sheet-head">
          <h2>{title}</h2>
          <button type="button" className="text-btn" onClick={onClose}>
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function railLabel(rail: Drop["rail"]): string {
  if (!rail) return "Unmarked";
  return RAILS.find((item) => item.id === rail)?.label ?? rail;
}
