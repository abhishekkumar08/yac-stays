import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Button, Input, NumberStepper, Progress, Select, Textarea, useNotifications } from "@kasumi/ui";
import {
  Building2, CalendarCheck, Castle, Home, Hotel, Landmark, Mountain, Tent, TreePine, Trees, Warehouse, Zap,
} from "lucide-react";
import { quoteStay } from "@shared/pricing.js";
import { COPY } from "@/copy.js";
import { LocationPicker } from "@/components/LocationPicker.jsx";
import { PhotoManager } from "@/pages/host/PhotoManager.jsx";
import { amenity, AMENITY_KEYS } from "@/lib/amenities.js";
import { api } from "@/lib/api.js";
import { useAuth } from "@/lib/auth.jsx";
import { money, photoUrl } from "@/lib/format.js";

const W = COPY.WIZARD;
const STRUCTURES = [
  ["House", Home], ["Flat", Building2], ["Villa", Castle], ["Cottage", Warehouse], ["Cabin", Mountain], ["Chalet", Mountain],
  ["Treehouse", TreePine], ["Farm stay", Trees], ["Haveli", Landmark], ["Guest suite", Hotel], ["Bungalow", Home], ["Heritage home", Landmark], ["Tent", Tent],
];
const CITIES = {
  Goa: { state: "Goa", lat: 15.55, lng: 73.76 },
  Manali: { state: "Himachal Pradesh", lat: 32.24, lng: 77.19 },
  Jaipur: { state: "Rajasthan", lat: 26.91, lng: 75.79 },
  Udaipur: { state: "Rajasthan", lat: 24.58, lng: 73.68 },
  Munnar: { state: "Kerala", lat: 10.09, lng: 77.06 },
  Pondicherry: { state: "Puducherry", lat: 11.93, lng: 79.83 },
  Rishikesh: { state: "Uttarakhand", lat: 30.09, lng: 78.27 },
  Coorg: { state: "Karnataka", lat: 12.42, lng: 75.74 },
};
const STEPS = ["intro", "structure", "privacy", "location", "basics", "amenities", "photos", "title", "highlights", "description", "booking", "price", "discounts", "review"];
const PHOTO_STEP = STEPS.indexOf("photos");
const PARTS = [STEPS.indexOf("structure"), STEPS.indexOf("amenities"), STEPS.indexOf("booking"), STEPS.length];
const MIN_PHOTOS = 5;

function Tile({ selected, icon: Icon, label, hint, onClick, wide = false }) {
  return (
    <Button
      variant="outline"
      aria-pressed={selected}
      onClick={onClick}
      className={`h-auto rounded-overlay p-4 text-left ${wide ? "w-full justify-between gap-6" : "flex-col items-start gap-3"} ${selected ? "bg-surface-muted ring-2 ring-fg" : ""}`}
    >
      {wide ? (
        <>
          <span>
            <span className="block text-title text-fg">{label}</span>
            {hint && <span className="block text-body text-fg-muted">{hint}</span>}
          </span>
          <Icon className="h-8 w-8 shrink-0" aria-hidden="true" />
        </>
      ) : (
        <>
          <Icon className="h-8 w-8" aria-hidden="true" />
          <span className="text-label text-fg">{label}</span>
        </>
      )}
    </Button>
  );
}

function StepTitle({ title, hint }) {
  return (
    <div className="mb-8">
      <h1 className="text-headline text-fg">{title}</h1>
      {hint && <p className="mt-2 text-body-lg text-fg-muted">{hint}</p>}
    </div>
  );
}

const toApi = (f) => ({
  title: f.title.trim() || `${f.propertyType} in ${f.area || f.city}`,
  description: f.description,
  propertyType: f.propertyType,
  roomType: f.roomType,
  city: f.city,
  area: f.area || f.city,
  state: CITIES[f.city].state,
  lat: f.lat,
  lng: f.lng,
  maxGuests: f.maxGuests,
  bedrooms: f.bedrooms,
  beds: f.beds,
  bathrooms: f.bathrooms,
  nightly: Math.round(Number(f.nightly) * 100),
  cleaningFee: 0,
  weeklyDiscountPct: Number(f.weeklyDiscountPct) || 0,
  monthlyDiscountPct: Number(f.monthlyDiscountPct) || 0,
  minNights: 1,
  instantBook: f.instantBook,
  cancellationPolicy: "flexible",
  houseRules: "",
  amenities: f.amenities,
  highlights: f.highlights.map((h) => ({ title: h, body: "" })),
  status: "unlisted",
});

export function BecomeHost() {
  const navigate = useNavigate();
  const { user, refresh, requireAuth } = useAuth();
  const { notify } = useNotifications();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [listing, setListing] = useState(null);
  const [form, setForm] = useState({
    propertyType: "", roomType: "", city: "Goa", area: "", lat: CITIES.Goa.lat, lng: CITIES.Goa.lng,
    maxGuests: 4, bedrooms: 1, beds: 1, bathrooms: 1, amenities: [], title: "", highlights: [], description: "",
    instantBook: false, nightly: 3000, weeklyDiscountPct: 10, monthlyDiscountPct: 20,
  });
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const name = STEPS[step];
  const photos = listing?.photos ?? [];

  const canNext = {
    structure: !!form.propertyType,
    privacy: !!form.roomType,
    location: !!form.city,
    photos: photos.length >= MIN_PHOTOS,
    title: form.title.trim().length >= 3,
    price: Number(form.nightly) >= 100,
  }[name] ?? true;

  async function save(status) {
    const body = { ...toApi(form), status };
    const saved = listing ? await api.put(`/api/host/listings/${listing.id}`, body) : await api.post("/api/host/listings", body);
    setListing(saved);
    return saved;
  }

  async function reloadListing() {
    if (listing) setListing(await api.get(`/api/host/listings/${listing.id}`));
  }

  async function next() {
    setError(null);
    if (name === "intro") {
      return requireAuth(async () => {
        try {
          if (!user?.isHost) {
            await api.post("/api/host/become");
            await refresh();
          }
          setStep(1);
        } catch {
          setError(COPY.COMMON.ERROR);
        }
      });
    }
    setBusy(true);
    try {
      if (step + 1 === PHOTO_STEP && !listing) await save("unlisted");
      if (name === "review") {
        await save("listed");
        notify(W.PUBLISHED, "success");
        navigate("/host/listings");
        return undefined;
      }
      setStep((s) => s + 1);
    } catch {
      setError(COPY.COMMON.ERROR);
    } finally {
      setBusy(false);
    }
    return undefined;
  }

  async function saveAndExit() {
    try {
      if (listing) await save("unlisted");
      navigate(listing ? "/host/listings" : "/host");
    } catch {
      setError(COPY.COMMON.ERROR);
    }
  }

  const guestQuote = quoteStay({ nightly: Math.round(Number(form.nightly) * 100) || 0, cleaningFee: 0 }, 1);
  const part = PARTS.findIndex((p) => step < p);

  return (
    <div className="flex min-h-[calc(100dvh-81px)] flex-col">
      <div className="flex justify-end px-6 pt-4">
        {step > 0 && <Button variant="outline" className="rounded-pill" onClick={saveAndExit}>{W.SAVE_EXIT}</Button>}
      </div>
      <div className="mx-auto w-full max-w-3xl flex-1 px-6 py-8">
        {name === "intro" && (
          <div className="grid items-center gap-10 md:grid-cols-2">
            <h1 className="text-display text-fg">{W.INTRO_TITLE}</h1>
            <ol className="divide-y divide-line">
              {W.INTRO_STEPS.map(([t, d], i) => (
                <li key={t} className="flex gap-4 py-6">
                  <span className="text-title text-fg">{i + 1}</span>
                  <div>
                    <p className="text-title text-fg">{t}</p>
                    <p className="text-body-lg text-fg-muted">{d}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        )}
        {name === "structure" && (
          <>
            <StepTitle title={W.STRUCTURE} />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {STRUCTURES.map(([type, icon]) => <Tile key={type} icon={icon} label={W.STRUCTURES[type]} selected={form.propertyType === type} onClick={() => set({ propertyType: type })} />)}
            </div>
          </>
        )}
        {name === "privacy" && (
          <>
            <StepTitle title={W.PRIVACY} />
            <div className="space-y-3">
              {Object.entries(COPY.HOST.ROOM_TYPES).map(([k, label]) => (
                <Tile key={k} wide icon={k === "entire" ? Home : k === "private" ? Hotel : Tent} label={label} hint={W.PRIVACY_HINTS[k]} selected={form.roomType === k} onClick={() => set({ roomType: k })} />
              ))}
            </div>
          </>
        )}
        {name === "location" && (
          <>
            <StepTitle title={W.LOCATION} hint={W.LOCATION_HINT} />
            <div className="mb-4 grid gap-4 sm:grid-cols-2">
              <Select label={W.CITY} value={form.city} onChange={(e) => set({ city: e.target.value, lat: CITIES[e.target.value].lat, lng: CITIES[e.target.value].lng })}>
                {Object.keys(CITIES).map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
              <Input label={COPY.HOST.FIELDS.area} maxLength={60} value={form.area} onChange={(e) => set({ area: e.target.value })} />
            </div>
            <LocationPicker lat={form.lat} lng={form.lng} label={W.LOCATION} onPick={(p) => set(p)} />
          </>
        )}
        {name === "basics" && (
          <>
            <StepTitle title={W.BASICS} hint={W.BASICS_HINT} />
            <div className="divide-y divide-line">
              <NumberStepper label={COPY.HOST.FIELDS.maxGuests} value={form.maxGuests} min={1} max={16} onChange={(v) => set({ maxGuests: v })} />
              <NumberStepper label={COPY.HOST.FIELDS.bedrooms} value={form.bedrooms} min={0} max={20} onChange={(v) => set({ bedrooms: v })} />
              <NumberStepper label={COPY.HOST.FIELDS.beds} value={form.beds} min={1} max={30} onChange={(v) => set({ beds: v })} />
              <NumberStepper label={COPY.HOST.FIELDS.bathrooms} value={form.bathrooms} min={0} max={20} step={0.5} onChange={(v) => set({ bathrooms: v })} />
            </div>
          </>
        )}
        {name === "amenities" && (
          <>
            <StepTitle title={W.AMENITIES} hint={W.AMENITIES_HINT} />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {AMENITY_KEYS.map((k) => {
                const { icon, label } = amenity(k);
                const on = form.amenities.includes(k);
                return <Tile key={k} icon={icon} label={label} selected={on} onClick={() => set({ amenities: on ? form.amenities.filter((a) => a !== k) : [...form.amenities, k] })} />;
              })}
            </div>
          </>
        )}
        {name === "photos" && listing && (
          <>
            <StepTitle title={W.PHOTOS} hint={W.PHOTOS_HINT} />
            <PhotoManager base={`/api/host/listings/${listing.id}`} photos={photos} onChange={reloadListing} />
          </>
        )}
        {name === "title" && (
          <>
            <StepTitle title={W.TITLE} hint={W.TITLE_HINT} />
            <Textarea aria-label={W.TITLE} rows={3} maxLength={50} value={form.title} onChange={(e) => set({ title: e.target.value })} hint={`${form.title.length}/50`} />
          </>
        )}
        {name === "highlights" && (
          <>
            <StepTitle title={W.HIGHLIGHTS} hint={W.HIGHLIGHTS_HINT} />
            <div className="flex flex-wrap gap-3">
              {W.HIGHLIGHT_OPTIONS.map((h) => {
                const on = form.highlights.includes(h);
                return (
                  <Button key={h} variant="outline" aria-pressed={on} disabled={!on && form.highlights.length >= 2} onClick={() => set({ highlights: on ? form.highlights.filter((x) => x !== h) : [...form.highlights, h] })} className={`rounded-pill ${on ? "ring-2 ring-fg" : ""}`}>
                    {h}
                  </Button>
                );
              })}
            </div>
          </>
        )}
        {name === "description" && (
          <>
            <StepTitle title={W.DESCRIPTION} hint={W.DESCRIPTION_HINT} />
            <Textarea aria-label={W.DESCRIPTION} rows={6} maxLength={500} value={form.description} onChange={(e) => set({ description: e.target.value })} hint={`${form.description.length}/500`} />
          </>
        )}
        {name === "booking" && (
          <>
            <StepTitle title={W.BOOKING} />
            <div className="space-y-3">
              <Tile wide icon={CalendarCheck} label={W.APPROVE} hint={W.APPROVE_HINT} selected={!form.instantBook} onClick={() => set({ instantBook: false })} />
              <Tile wide icon={Zap} label={W.INSTANT} hint={W.INSTANT_HINT} selected={form.instantBook} onClick={() => set({ instantBook: true })} />
            </div>
          </>
        )}
        {name === "price" && (
          <div className="text-center">
            <StepTitle title={W.PRICE} hint={W.PRICE_HINT} />
            <Input aria-label={W.PRICE} type="number" min={100} inputMode="numeric" leading="₹" value={form.nightly} onChange={(e) => set({ nightly: e.target.value })} className="text-center text-display" containerClassName="mx-auto max-w-xs" />
            <p className="mt-4 text-body-lg text-fg-muted">{W.GUEST_PRICE(money(guestQuote.total))}</p>
          </div>
        )}
        {name === "discounts" && (
          <>
            <StepTitle title={W.DISCOUNTS} hint={W.DISCOUNTS_HINT} />
            <div className="space-y-4">
              {[["weeklyDiscountPct", W.WEEKLY, W.WEEKLY_HINT], ["monthlyDiscountPct", W.MONTHLY, W.MONTHLY_HINT]].map(([k, label, hint]) => (
                <div key={k} className="flex items-center justify-between gap-6 rounded-overlay bg-surface-muted p-5">
                  <div>
                    <p className="text-title text-fg">{label}</p>
                    <p className="text-body text-fg-muted">{hint}</p>
                  </div>
                  <Input aria-label={label} type="number" min={0} max={90} trailing={W.PERCENT} value={form[k]} onChange={(e) => set({ [k]: e.target.value })} containerClassName="w-28" />
                </div>
              ))}
            </div>
          </>
        )}
        {name === "review" && (
          <>
            <StepTitle title={W.REVIEW} hint={W.REVIEW_HINT} />
            <div className="max-w-sm overflow-hidden rounded-overlay shadow-overlay">
              {photos[0] && <img src={photoUrl(photos[0].file)} alt="" className="aspect-square w-full object-cover" />}
              <div className="flex justify-between p-4">
                <p className="text-label text-fg">{toApi(form).title}</p>
                <p className="text-body text-fg"><strong>{money(Math.round(Number(form.nightly) * 100))}</strong> {COPY.BOOKING.PER_NIGHT}</p>
              </div>
            </div>
          </>
        )}
        {error && <Alert tone="error" className="mt-6">{error}</Alert>}
      </div>
      <footer className="sticky bottom-0 border-t border-line bg-canvas">
        {step > 0 && (
          <div className="grid grid-cols-3 gap-1" aria-hidden="true">
            {PARTS.slice(0, 3).map((end, i) => {
              const start = i === 0 ? 1 : PARTS[i - 1];
              const done = Math.min(1, Math.max(0, (step - start + 1) / (end - start)));
              return <Progress key={end} showValue={false} value={i < part ? 100 : i === part ? done * 100 : 0} />;
            })}
          </div>
        )}
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          {step > 0 ? <Button variant="link" className="font-semibold underline" onClick={() => setStep((s) => s - 1)}>{W.BACK}</Button> : <span />}
          <Button variant="primary" size="lg" loading={busy} disabled={!canNext} onClick={next}>
            {name === "intro" ? W.GET_STARTED : name === "review" ? W.PUBLISH : W.NEXT}
          </Button>
        </div>
      </footer>
    </div>
  );
}
