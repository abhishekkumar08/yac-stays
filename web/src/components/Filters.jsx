import { useEffect, useMemo, useState } from "react";
import { Button, Chip, Disclosure, Input, Modal, NumberStepper, Popover, SegmentedControl } from "@kasumi/ui";
import { Award, Building2, CalendarX, ChevronDown, Gem, Home, Hotel, KeyRound, PawPrint, SlidersHorizontal, UtensilsCrossed, Car, Waves, Zap } from "lucide-react";
import { COPY } from "@/copy.js";
import { amenity, FILTER_AMENITIES, QUICK_FILTERS } from "@/lib/amenities.js";
import { api } from "@/lib/api.js";
import { currencySymbol, fromDisplay, toDisplay } from "@/lib/currency.js";
import { FILTER_KEYS, listParam, searchApiUrl, toggleInList } from "@/lib/search.js";

const F = COPY.FILTERS;
const ROOM_OPTIONS = [
  { value: "", label: F.ANY_TYPE },
  { value: "private", label: F.PRIVATE },
  { value: "entire", label: F.ENTIRE },
];
const PROPERTY_TYPES = {
  house: { icon: Home, types: ["Villa", "Cottage", "Bungalow", "Cabin", "Chalet", "Treehouse", "Farm stay", "Haveli", "Heritage home"] },
  flat: { icon: Building2, types: ["Flat"] },
  guesthouse: { icon: Hotel, types: ["Guest suite", "Room"] },
};
const LANGUAGES = Object.keys(F.LANGUAGE_NAMES);
const RECOMMENDED = [
  { label: F.FREE_CANCEL, icon: CalendarX, on: (f) => !!f.freeCancel, toggle: (f) => ({ ...f, freeCancel: f.freeCancel ? "" : "1" }) },
  { label: amenity("kitchen").label, icon: UtensilsCrossed, on: (f) => listParam(f.amenities).includes("kitchen"), toggle: (f) => toggleInList(f, "amenities", "kitchen") },
  { label: amenity("free_parking").label, icon: Car, on: (f) => listParam(f.amenities).includes("free_parking"), toggle: (f) => toggleInList(f, "amenities", "free_parking") },
  { label: amenity("pool").label, icon: Waves, on: (f) => listParam(f.amenities).includes("pool"), toggle: (f) => toggleInList(f, "amenities", "pool") },
];
const anyOr = (v) => (v ? `${v}+` : F.ANY);

function Tile({ selected, icon: Icon, title, hint, onClick }) {
  return (
    <Button variant="outline" onClick={onClick} aria-pressed={selected} className={`h-auto flex-col items-start gap-2 rounded-overlay p-4 text-left ${selected ? "ring-2 ring-fg" : ""}`}>
      <Icon className="h-7 w-7" aria-hidden="true" />
      <span className="text-label text-fg">{title}</span>
      {hint && <span className="text-caption text-fg-muted">{hint}</span>}
    </Button>
  );
}

function Histogram({ prices, min, max }) {
  if (!prices?.buckets?.length) return null;
  const top = Math.max(...prices.buckets, 1);
  const step = (prices.max - prices.min) / prices.buckets.length;
  return (
    <div className="flex h-16 items-end gap-0.5" aria-hidden="true">
      {prices.buckets.map((n, i) => {
        const at = (prices.min + i * step) / 100;
        const inside = (!min || at >= Number(min)) && (!max || at <= Number(max));
        return <span key={i} className={`flex-1 rounded-t-sm ${inside ? "bg-accent" : "bg-line-strong"}`} style={{ height: `${Math.max(4, (n / top) * 100)}%` }} />;
      })}
    </div>
  );
}

const shown = (rupees) => (rupees ? String(toDisplay(Number(rupees))) : "");
const stored = (input) => (input ? String(fromDisplay(Number(input))) : "");

function PriceFields({ value, onChange, prices }) {
  const symbol = currencySymbol();
  return (
    <div className="space-y-4">
      <Histogram prices={prices} min={value.minPrice} max={value.maxPrice} />
      <div className="grid grid-cols-2 gap-4">
        <Input label={F.MINIMUM} type="number" min={0} inputMode="numeric" leading={symbol} placeholder={prices ? String(toDisplay(Math.floor(prices.min / 100))) : ""} value={shown(value.minPrice)} onChange={(e) => onChange({ ...value, minPrice: stored(e.target.value) })} />
        <Input label={F.MAXIMUM} type="number" min={0} inputMode="numeric" leading={symbol} placeholder={prices ? `${toDisplay(Math.ceil(prices.max / 100))}+` : ""} value={shown(value.maxPrice)} onChange={(e) => onChange({ ...value, maxPrice: stored(e.target.value) })} />
      </div>
    </div>
  );
}

function RoomFields({ value, onChange }) {
  return (
    <div className="divide-y divide-line">
      {["bedrooms", "beds", "bathrooms"].map((k) => (
        <NumberStepper key={k} label={F[k.toUpperCase()]} value={Number(value[k]) || 0} max={8} formatValue={anyOr} onChange={(v) => onChange({ ...value, [k]: v ? String(v) : "" })} />
      ))}
    </div>
  );
}

function DropdownFilter({ label, active, children, onApply, onClear, onOpen }) {
  const [open, setOpen] = useState(false);
  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        if (o) onOpen();
        setOpen(o);
      }}
      label={label}
      panelClassName="w-[min(24rem,90vw)] p-5"
      trigger={
        <Chip selected={active} className="h-10 shrink-0 gap-1 px-4">
          {label}
          <ChevronDown className="h-4 w-4" aria-hidden="true" />
        </Chip>
      }
    >
      {children}
      <div className="mt-5 flex justify-between">
        <Button variant="ghost" onClick={() => { onClear(); setOpen(false); }}>{F.CLEAR_ALL}</Button>
        <Button variant="primary" onClick={() => { onApply(); setOpen(false); }}>{F.APPLY}</Button>
      </div>
    </Popover>
  );
}

function useLiveCount(where, query, enabled) {
  const [count, setCount] = useState(null);
  useEffect(() => {
    if (!enabled) return undefined;
    const t = setTimeout(() => {
      api.get(searchApiUrl(where, query)).then((d) => setCount(d.total ?? 0), () => setCount(null));
    }, 250);
    return () => clearTimeout(t);
  }, [where, query, enabled]);
  return count;
}

function FiltersModal({ open, onClose, where, query, draft, setDraft, onApply, prices }) {
  const [moreAmenities, setMoreAmenities] = useState(false);
  const liveQuery = useMemo(() => ({ ...query, ...draft, page: "" }), [query, draft]);
  const count = useLiveCount(where, liveQuery, open);
  const chipToggle = (key, value) => setDraft(toggleInList(draft, key, value));
  const amenityChips = moreAmenities ? FILTER_AMENITIES : FILTER_AMENITIES.slice(0, 6);
  const typesOn = (k) => PROPERTY_TYPES[k].types.every((t) => listParam(draft.types).includes(t));
  const toggleTypes = (k) => {
    const current = new Set(listParam(draft.types));
    const on = typesOn(k);
    for (const t of PROPERTY_TYPES[k].types) on ? current.delete(t) : current.add(t);
    setDraft({ ...draft, types: [...current].join(",") });
  };
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={F.FILTERS}
      size="lg"
      footer={
        <div className="flex w-full items-center justify-between">
          <Button variant="ghost" onClick={() => setDraft(Object.fromEntries(Object.entries(draft).filter(([k]) => !FILTER_KEYS.includes(k))))}>{F.CLEAR_ALL}</Button>
          <Button variant="primary" onClick={onApply}>{count == null ? F.APPLY : F.SHOW_COUNT(count)}</Button>
        </div>
      }
    >
      <div className="space-y-8 divide-y divide-line [&>section]:pt-8 [&>section:first-child]:pt-0">
        <section>
          <h3 className="mb-4 text-title text-fg">{F.RECOMMENDED}</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {RECOMMENDED.map((r) => <Tile key={r.label} icon={r.icon} title={r.label} selected={r.on(draft)} onClick={() => setDraft(r.toggle(draft))} />)}
          </div>
        </section>
        <section>
          <h3 className="mb-4 text-title text-fg">{F.TYPE_OF_PLACE}</h3>
          <SegmentedControl label={F.TYPE_OF_PLACE} options={ROOM_OPTIONS} value={draft.roomType ?? ""} onChange={(v) => setDraft({ ...draft, roomType: v })} />
        </section>
        <section>
          <h3 className="text-title text-fg">{F.PRICE}</h3>
          <p className="mb-4 text-body text-fg-muted">{F.PRICE_SUB}</p>
          <PriceFields value={draft} onChange={setDraft} prices={prices} />
        </section>
        <section>
          <h3 className="mb-2 text-title text-fg">{F.ROOMS_AND_BEDS}</h3>
          <RoomFields value={draft} onChange={setDraft} />
        </section>
        <section>
          <h3 className="mb-4 text-title text-fg">{F.AMENITIES}</h3>
          <div className="flex flex-wrap gap-2">
            {amenityChips.map((a) => {
              const { icon, label } = amenity(a);
              return <Chip key={a} icon={icon} selected={listParam(draft.amenities).includes(a)} onClick={() => chipToggle("amenities", a)} className="h-10 px-4">{label}</Chip>;
            })}
          </div>
          <Button variant="link" className="mt-3 px-0 font-semibold underline" onClick={() => setMoreAmenities((m) => !m)}>{moreAmenities ? F.SHOW_LESS : F.SHOW_MORE}</Button>
        </section>
        <section>
          <h3 className="mb-4 text-title text-fg">{F.BOOKING_OPTIONS}</h3>
          <div className="flex flex-wrap gap-2">
            <Chip icon={Zap} selected={!!draft.instant} onClick={() => setDraft({ ...draft, instant: draft.instant ? "" : "1" })} className="h-10 px-4">{F.INSTANT}</Chip>
            <Chip icon={KeyRound} selected={listParam(draft.amenities).includes("self_checkin")} onClick={() => chipToggle("amenities", "self_checkin")} className="h-10 px-4">{F.SELF_CHECKIN}</Chip>
            <Chip icon={CalendarX} selected={!!draft.freeCancel} onClick={() => setDraft({ ...draft, freeCancel: draft.freeCancel ? "" : "1" })} className="h-10 px-4">{F.FREE_CANCEL}</Chip>
            <Chip icon={PawPrint} selected={listParam(draft.amenities).includes("pets_allowed")} onClick={() => chipToggle("amenities", "pets_allowed")} className="h-10 px-4">{F.ALLOWS_PETS}</Chip>
          </div>
        </section>
        <section>
          <h3 className="mb-4 text-title text-fg">{F.STANDOUT}</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <Tile icon={Award} title={F.FAVOURITE} hint={F.FAVOURITE_HINT} selected={!!draft.favourite} onClick={() => setDraft({ ...draft, favourite: draft.favourite ? "" : "1" })} />
            <Tile icon={Gem} title={F.LUXE} hint={F.LUXE_HINT} selected={!!draft.luxe} onClick={() => setDraft({ ...draft, luxe: draft.luxe ? "" : "1" })} />
          </div>
        </section>
        <section>
          <Disclosure title={F.PROPERTY_TYPE}>
            <div className="grid grid-cols-3 gap-3 pt-4">
              {Object.entries(PROPERTY_TYPES).map(([k, { icon }]) => <Tile key={k} icon={icon} title={F.PROPERTY_TYPES[k]} selected={typesOn(k)} onClick={() => toggleTypes(k)} />)}
            </div>
          </Disclosure>
        </section>
        <section>
          <Disclosure title={F.ACCESSIBILITY}>
            <div className="flex flex-wrap gap-2 pt-4">
              <Chip selected={listParam(draft.amenities).includes("step_free_access")} onClick={() => chipToggle("amenities", "step_free_access")} className="h-10 px-4">{amenity("step_free_access").label}</Chip>
            </div>
          </Disclosure>
        </section>
        <section>
          <Disclosure title={F.HOST_LANGUAGE}>
            <div className="flex flex-wrap gap-2 pt-4">
              {LANGUAGES.map((l) => <Chip key={l} selected={listParam(draft.languages).includes(l)} onClick={() => chipToggle("languages", l)} className="h-10 px-4">{F.LANGUAGE_NAMES[l]}</Chip>)}
            </div>
          </Disclosure>
        </section>
      </div>
    </Modal>
  );
}

export function FilterBar({ where, query, onChange, prices }) {
  const [draft, setDraft] = useState(query);
  const [modal, setModal] = useState(false);
  const active = FILTER_KEYS.filter((k) => query[k]).length;
  const sync = () => setDraft(query);
  const clear = (keys) => onChange(Object.fromEntries(Object.entries(query).filter(([k]) => !keys.includes(k))));

  return (
    <div className="ys-no-scrollbar flex items-center gap-3 overflow-x-auto py-1">
      <Chip selected={active > 0} count={active || undefined} icon={SlidersHorizontal} onClick={() => { sync(); setModal(true); }} className="h-10 shrink-0 px-4">
        {F.FILTERS}
      </Chip>
      <span className="h-8 w-px shrink-0 bg-line" aria-hidden="true" />
      <DropdownFilter label={F.PRICE} active={!!(query.minPrice || query.maxPrice)} onOpen={sync} onApply={() => onChange(draft)} onClear={() => clear(["minPrice", "maxPrice"])}>
        <p className="mb-3 text-body text-fg-muted">{F.PRICE_SUB}</p>
        <PriceFields value={draft} onChange={setDraft} prices={prices} />
      </DropdownFilter>
      {QUICK_FILTERS.map((a) => (
        <Chip key={a} selected={listParam(query.amenities).includes(a)} onClick={() => onChange(toggleInList(query, "amenities", a))} className="h-10 shrink-0 px-4">
          {amenity(a).label}
        </Chip>
      ))}
      <Chip selected={!!query.favourite} onClick={() => onChange({ ...query, favourite: query.favourite ? "" : "1" })} className="h-10 shrink-0 px-4">
        {F.FAVOURITE}
      </Chip>
      <Chip selected={!!query.freeCancel} onClick={() => onChange({ ...query, freeCancel: query.freeCancel ? "" : "1" })} className="h-10 shrink-0 px-4">
        {F.FREE_CANCEL}
      </Chip>
      <DropdownFilter label={F.TYPE_OF_PLACE} active={!!query.roomType} onOpen={sync} onApply={() => onChange(draft)} onClear={() => clear(["roomType"])}>
        <SegmentedControl label={F.TYPE_OF_PLACE} options={ROOM_OPTIONS} value={draft.roomType ?? ""} onChange={(v) => setDraft({ ...draft, roomType: v })} />
      </DropdownFilter>
      <DropdownFilter label={F.ROOMS_AND_BEDS} active={!!(query.bedrooms || query.beds || query.bathrooms)} onOpen={sync} onApply={() => onChange(draft)} onClear={() => clear(["bedrooms", "beds", "bathrooms"])}>
        <RoomFields value={draft} onChange={setDraft} />
      </DropdownFilter>
      <FiltersModal
        open={modal}
        onClose={() => setModal(false)}
        where={where}
        query={query}
        draft={draft}
        setDraft={setDraft}
        prices={prices}
        onApply={() => {
          onChange(draft);
          setModal(false);
        }}
      />
    </div>
  );
}
