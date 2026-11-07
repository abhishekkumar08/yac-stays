import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button, Chip, Input, NumberStepper, Popover, RangeCalendar, SegmentedControl } from "@kasumi/ui";
import { MapPin, Search as SearchIcon } from "lucide-react";
import { addDays, addMonths, isIsoDate, todayIso } from "@shared/dates.js";
import { COPY } from "@/copy.js";
import { api, qs } from "@/lib/api.js";
import { dateRange, monthLabel, shortDate } from "@/lib/format.js";

const FLEX_DAYS = [0, 1, 2, 3, 7, 14];
const num = (v) => Math.max(0, Number(v) || 0);
const list = (v) => (v ? v.split(",").filter(Boolean) : []);

const shortMonth = (ym) => monthLabel(ym).split(" ")[0].slice(0, 3);

export function nextMonths(today, count = 12) {
  return Array.from({ length: count }, (_, i) => addMonths(`${today.slice(0, 7)}-01`, i).slice(0, 7));
}

export function useSearchState() {
  const { pathname, search } = useLocation();
  return useMemo(() => {
    const q = new URLSearchParams(search);
    const m = /^\/s\/([^/]+)\/homes/.exec(pathname);
    const where = m ? decodeURIComponent(m[1]) : q.get("where") ?? "";
    return {
      key: pathname + search,
      where: where === "anywhere" ? "" : where,
      checkin: q.get("checkin") ?? q.get("date") ?? "",
      checkout: q.get("checkout") ?? "",
      flex: num(q.get("flex")),
      flexKind: q.get("flexKind") ?? "",
      flexMonths: list(q.get("flexMonths")),
      category: q.get("category") ?? "",
      adults: num(q.get("adults")),
      children: num(q.get("children")),
      infants: num(q.get("infants")),
      pets: num(q.get("pets")),
    };
  }, [pathname, search]);
}

export function whenLabel(s) {
  if (s.flexKind) return COPY.SEARCH.FLEX_LABEL(COPY.SEARCH.FLEX_KINDS[s.flexKind], s.flexMonths.map(shortMonth).join(", "));
  if (s.checkin && s.checkout) return dateRange(s.checkin, s.checkout) + (s.flex ? COPY.SEARCH.FLEX_SUFFIX(s.flex) : "");
  return s.checkin ? shortDate(s.checkin) : "";
}

let placesCache = null;
function usePlaces() {
  const [places, setPlaces] = useState(placesCache ?? []);
  useEffect(() => {
    if (placesCache) return;
    api.get("/api/places").then(
      (d) => {
        placesCache = d.places;
        setPlaces(d.places);
      },
      () => setPlaces([]),
    );
  }, []);
  return places;
}

function Segment({ label, value, placeholder, active, className = "", ...props }) {
  return (
    <Button
      variant="ghost"
      className={`h-16 w-full flex-col items-start justify-center gap-0 rounded-pill px-7 text-left ${active ? "bg-surface shadow-overlay" : "hover:bg-surface-muted"} ${className}`}
      {...props}
    >
      <span className="text-caption font-semibold text-fg">{label}</span>
      <span className={`max-w-[13rem] truncate text-body ${value ? "text-fg" : "text-fg-muted"}`}>{value || placeholder}</span>
    </Button>
  );
}

function WhenPanel({ mode, state, set, onDone }) {
  const today = todayIso();
  const months = nextMonths(today);
  const isStay = mode === "homes";
  const modes = Object.entries(COPY.SEARCH.DATE_MODES).map(([value, label]) => ({ value, label }));
  return (
    <div className="space-y-6">
      {isStay && (
        <div className="flex justify-center">
          <SegmentedControl label={COPY.SEARCH.WHEN} options={modes} value={state.dateMode} onChange={(v) => set({ dateMode: v })} />
        </div>
      )}
      {state.dateMode === "dates" || !isStay ? (
        <>
          <RangeCalendar
            start={state.start}
            end={isStay ? state.end : null}
            onChange={(r) => {
              set(isStay ? { start: r.start, end: r.end } : { start: r.start, end: null });
              if ((!isStay && r.start) || r.end) onDone();
            }}
          />
          {isStay && (
            <div className="flex flex-wrap gap-2">
              {FLEX_DAYS.map((n) => (
                <Chip key={n} selected={state.flex === n} onClick={() => set({ flex: n })}>
                  {n ? COPY.SEARCH.PLUS_MINUS(n) : COPY.SEARCH.EXACT}
                </Chip>
              ))}
            </div>
          )}
        </>
      ) : state.dateMode === "months" ? (
        <div className="mx-auto max-w-sm space-y-4 text-center">
          <h3 className="text-title text-fg">{COPY.SEARCH.TRIP_LENGTH}</h3>
          <NumberStepper label={COPY.SEARCH.MONTHS_LABEL} value={state.months} min={1} max={12} onChange={(v) => set({ months: v })} />
          <Input type="date" label={COPY.SEARCH.STARTING_ON} min={today} value={state.monthStart} onChange={(e) => isIsoDate(e.target.value) && set({ monthStart: e.target.value })} />
          <p className="text-body text-fg-muted">{COPY.SEARCH.MONTHS_RANGE(shortDate(state.monthStart), shortDate(addMonths(state.monthStart, state.months)))}</p>
        </div>
      ) : (
        <div className="space-y-6 text-center">
          <div>
            <h3 className="mb-3 text-title text-fg">{COPY.SEARCH.HOW_LONG}</h3>
            <div className="flex justify-center gap-2">
              {Object.entries(COPY.SEARCH.FLEX_KINDS).map(([k, label]) => (
                <Chip key={k} selected={state.flexKind === k} onClick={() => set({ flexKind: k })} className="h-10 px-5">
                  {label}
                </Chip>
              ))}
            </div>
          </div>
          <div>
            <h3 className="mb-3 text-title text-fg">{COPY.SEARCH.WHEN_GO}</h3>
            <div className="ys-no-scrollbar flex gap-3 overflow-x-auto pb-2">
              {months.map((m) => (
                <Chip
                  key={m}
                  selected={state.flexMonths.includes(m)}
                  onClick={() => set({ flexMonths: state.flexMonths.includes(m) ? state.flexMonths.filter((x) => x !== m) : [...state.flexMonths, m].sort() })}
                  className="h-24 w-24 shrink-0 flex-col justify-center rounded-overlay"
                >
                  <span className="block text-label">{monthLabel(m).split(" ")[0]}</span>
                  <span className="block text-caption text-fg-muted">{m.slice(0, 4)}</span>
                </Chip>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function SearchBar({ mode = "homes", initial }) {
  const navigate = useNavigate();
  const places = usePlaces();
  const today = todayIso();
  const [open, setOpen] = useState(null);
  const [where, setWhere] = useState(initial.where);
  const [when, setWhen] = useState({
    dateMode: initial.flexKind ? "flexible" : "dates",
    start: initial.checkin || null,
    end: initial.checkout || null,
    flex: initial.flex,
    months: 3,
    monthStart: initial.checkin || addDays(today, 7),
    flexKind: initial.flexKind || "weekend",
    flexMonths: initial.flexMonths.length ? initial.flexMonths : [today.slice(0, 7)],
  });
  const [guests, setGuests] = useState({ adults: initial.adults, children: initial.children, infants: initial.infants, pets: initial.pets });
  const [category, setCategory] = useState(initial.category);
  const total = guests.adults + guests.children;
  const isStay = mode === "homes";
  const setW = (patch) => setWhen((w) => ({ ...w, ...patch }));

  const suggestions = places.filter((p) => !where || `${p.city} ${p.state}`.toLowerCase().includes(where.toLowerCase())).slice(0, 8);
  const panel = (name) => ({ open: open === name, onOpenChange: (o) => setOpen(o ? name : null) });

  function submit() {
    setOpen(null);
    const g = Object.fromEntries(Object.entries(guests).map(([k, v]) => [k, v || undefined]));
    if (!isStay) {
      const base = mode === "services" ? "/services" : "/experiences";
      return navigate(`${base}${qs({ where, date: when.start, category: mode === "services" ? category : undefined })}`);
    }
    const dates =
      when.dateMode === "months"
        ? { checkin: when.monthStart, checkout: addMonths(when.monthStart, when.months) }
        : when.dateMode === "flexible"
          ? { flexKind: when.flexKind, flexMonths: when.flexMonths.join(",") }
          : { checkin: when.start, checkout: when.end, flex: when.start && when.end && when.flex ? when.flex : undefined };
    return navigate(`/s/${encodeURIComponent(where.trim() || "anywhere")}/homes${qs({ ...dates, ...g })}`);
  }

  const setGuest = (k) => (v) =>
    setGuests((g) => {
      const next = { ...g, [k]: v };
      if (k !== "adults" && v > 0 && next.adults === 0) next.adults = 1;
      return next;
    });

  const whenValue =
    when.dateMode === "months" && isStay
      ? COPY.SEARCH.MONTHS_RANGE(shortDate(when.monthStart), shortDate(addMonths(when.monthStart, when.months)))
      : when.dateMode === "flexible" && isStay
        ? whenLabel({ flexKind: when.flexKind, flexMonths: when.flexMonths })
        : whenLabel({ checkin: when.start ?? "", checkout: isStay ? when.end ?? "" : "", flex: when.flex, flexMonths: [] });

  return (
    <search className="mx-auto flex w-full max-w-3xl flex-col rounded-overlay border border-line bg-surface-muted shadow-raised md:flex-row md:items-center md:rounded-pill">
      <Popover {...panel("where")} label={COPY.SEARCH.WHERE} className="w-full md:flex-[1.3]" panelClassName="w-[min(26rem,90vw)] p-4" trigger={<Segment label={COPY.SEARCH.WHERE} value={where} placeholder={COPY.SEARCH.WHERE_PLACEHOLDER} active={open === "where"} />}>
        <Input aria-label={COPY.SEARCH.WHERE} placeholder={COPY.SEARCH.WHERE_PLACEHOLDER} value={where} onChange={(e) => setWhere(e.target.value)} autoFocus leading={<MapPin className="h-4 w-4" />} onKeyDown={(e) => e.key === "Enter" && setOpen("when")} />
        <p className="mb-2 mt-4 text-caption font-semibold text-fg-muted">{COPY.SEARCH.SUGGESTED}</p>
        <ul>
          {suggestions.map((p) => (
            <li key={p.city}>
              <Button
                variant="ghost"
                className="h-auto w-full justify-start gap-3 py-2"
                onClick={() => {
                  setWhere(p.city);
                  setOpen("when");
                }}
              >
                <span className="grid h-12 w-12 place-items-center rounded-card bg-surface-muted">
                  <MapPin className="h-5 w-5 text-fg-muted" aria-hidden="true" />
                </span>
                <span className="text-left">
                  <span className="block text-label text-fg">{p.city}</span>
                  <span className="block text-caption text-fg-muted">
                    {p.state} · {COPY.SEARCH.STAYS_IN(p.n)}
                  </span>
                </span>
              </Button>
            </li>
          ))}
        </ul>
      </Popover>
      <span className="hidden h-8 w-px bg-line md:block" aria-hidden="true" />
      <Popover {...panel("when")} label={COPY.SEARCH.WHEN} className="w-full md:flex-1" panelClassName="w-[min(48rem,94vw)] p-6" trigger={<Segment label={isStay ? COPY.SEARCH.WHEN : COPY.SEARCH.DATE} value={whenValue} placeholder={COPY.SEARCH.ADD_DATES} active={open === "when"} />}>
        <WhenPanel mode={mode} state={when} set={setW} onDone={() => setOpen(mode === "services" ? "type" : "who")} />
        <div className="mt-4 flex justify-end">
          <Button variant="ghost" onClick={() => setW({ start: null, end: null, flex: 0 })}>
            {COPY.SEARCH.CLEAR}
          </Button>
        </div>
      </Popover>
      <span className="hidden h-8 w-px bg-line md:block" aria-hidden="true" />
      <div className="relative flex w-full items-center md:flex-1">
        {mode === "services" ? (
          <Popover {...panel("type")} label={COPY.SERVICES.TYPE} align="end" className="flex-1" panelClassName="w-[min(22rem,90vw)] p-2" trigger={<Segment label={COPY.SERVICES.TYPE} value={COPY.SERVICES.CATEGORIES[category]} placeholder={COPY.SERVICES.ADD_SERVICE} active={open === "type"} className="pr-16" />}>
            <ul>
              {[["", COPY.SERVICES.ALL], ...Object.entries(COPY.SERVICES.CATEGORIES)].map(([k, label]) => (
                <li key={k || "all"}>
                  <Button variant="ghost" className={`w-full justify-start ${k === category ? "bg-surface-muted" : ""}`} onClick={() => { setCategory(k); setOpen(null); }}>
                    {label}
                  </Button>
                </li>
              ))}
            </ul>
          </Popover>
        ) : (
          <Popover {...panel("who")} label={COPY.SEARCH.WHO} align="end" className="flex-1" panelClassName="w-[min(24rem,90vw)] px-6 py-2" trigger={<Segment label={COPY.SEARCH.WHO} value={total ? COPY.SEARCH.GUESTS(total) : ""} placeholder={COPY.SEARCH.ADD_GUESTS} active={open === "who"} className="pr-16" />}>
            <div className="divide-y divide-line">
              <NumberStepper label={COPY.SEARCH.ADULTS} description={COPY.SEARCH.ADULTS_HINT} value={guests.adults} max={16} onChange={setGuest("adults")} />
              <NumberStepper label={COPY.SEARCH.CHILDREN} description={COPY.SEARCH.CHILDREN_HINT} value={guests.children} max={15} onChange={setGuest("children")} />
              <NumberStepper label={COPY.SEARCH.INFANTS} description={COPY.SEARCH.INFANTS_HINT} value={guests.infants} max={5} onChange={setGuest("infants")} />
              {isStay && <NumberStepper label={COPY.SEARCH.PETS} description={<span className="underline">{COPY.SEARCH.SERVICE_ANIMAL}</span>} value={guests.pets} max={5} onChange={setGuest("pets")} />}
            </div>
          </Popover>
        )}
        <Button variant="primary" onClick={submit} aria-label={COPY.SEARCH.SEARCH} className="absolute right-2 z-10 h-12 w-12 shrink-0 rounded-pill p-0">
          <SearchIcon className="h-5 w-5" aria-hidden="true" />
        </Button>
      </div>
    </search>
  );
}
