import { useParams } from "react-router-dom";
import { Alert, Button, Checkbox, Input, Select, Switch, Textarea } from "@kasumi/ui";
import { POLICIES } from "@shared/cancellation.js";
import { COPY } from "@/copy.js";
import { PageState } from "@/components/PageState.jsx";
import { Section } from "@/components/Section.jsx";
import { PhotoManager } from "@/pages/host/PhotoManager.jsx";
import { useHostEditor } from "@/pages/host/useHostEditor.js";
import { amenity, AMENITY_KEYS } from "@/lib/amenities.js";

const F = COPY.HOST.FIELDS;
const EMPTY = {
  title: "", description: "", propertyType: "Flat", roomType: "entire", city: "", area: "", state: "", lat: "", lng: "",
  maxGuests: 2, bedrooms: 1, beds: 1, bathrooms: 1, nightly: 2500, cleaningFee: 500, weeklyDiscountPct: 0, minNights: 1,
  instantBook: true, cancellationPolicy: "moderate", houseRules: "", amenities: [], status: "listed",
};

const fromApi = (l) => ({
  title: l.title, description: l.description, propertyType: l.property_type, roomType: l.room_type, city: l.city, area: l.area, state: l.state,
  lat: l.lat, lng: l.lng, maxGuests: l.max_guests, bedrooms: l.bedrooms, beds: l.beds, bathrooms: l.bathrooms, nightly: l.nightly / 100,
  cleaningFee: l.cleaning_fee / 100, weeklyDiscountPct: l.weekly_discount_pct, minNights: l.min_nights, instantBook: !!l.instant_book,
  cancellationPolicy: l.cancellation_policy, houseRules: l.house_rules, amenities: l.amenities, status: l.status,
});

const toApi = (f) => ({
  ...f,
  lat: Number(f.lat), lng: Number(f.lng), maxGuests: Number(f.maxGuests), bedrooms: Number(f.bedrooms), beds: Number(f.beds), bathrooms: Number(f.bathrooms),
  nightly: Math.round(Number(f.nightly) * 100), cleaningFee: Math.round(Number(f.cleaningFee) * 100), weeklyDiscountPct: Number(f.weeklyDiscountPct), minNights: Number(f.minNights),
});

export function ListingEditor() {
  const { id } = useParams();
  const { existing, form, setForm, set, busy, error, save } = useHostEditor({
    id, apiBase: "/api/host/listings", pageBase: "/host/listings", empty: EMPTY, fromApi, toApi, createdMessage: COPY.HOST.LISTING_CREATED,
  });

  const toggleAmenity = (a) => setForm((f) => ({ ...f, amenities: f.amenities.includes(a) ? f.amenities.filter((x) => x !== a) : [...f.amenities, a] }));

  return (
    <PageState loading={existing.loading || !form} error={existing.error} onRetry={existing.reload}>
      {form && (
        <form onSubmit={save} className="mx-auto max-w-3xl space-y-6">
          <h1 className="text-headline text-fg">{id ? form.title : COPY.HOST.CREATE_LISTING}</h1>
          <Section title={COPY.HOST.SECTIONS.basics}>
            <Input label={F.title} required minLength={3} maxLength={80} value={form.title} onChange={set("title")} />
            <Textarea label={F.description} rows={5} maxLength={4000} value={form.description} onChange={set("description")} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label={F.propertyType} required maxLength={40} value={form.propertyType} onChange={set("propertyType")} />
              <Select label={F.roomType} value={form.roomType} onChange={set("roomType")}>
                {Object.entries(COPY.HOST.ROOM_TYPES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </Select>
            </div>
          </Section>
          <Section title={COPY.HOST.SECTIONS.location}>
            <div className="grid gap-4 sm:grid-cols-3">
              <Input label={F.city} required value={form.city} onChange={set("city")} />
              <Input label={F.area} required value={form.area} onChange={set("area")} />
              <Input label={F.state} required value={form.state} onChange={set("state")} />
              <Input label={F.lat} type="number" step="any" min={-90} max={90} required value={form.lat} onChange={set("lat")} />
              <Input label={F.lng} type="number" step="any" min={-180} max={180} required value={form.lng} onChange={set("lng")} />
            </div>
          </Section>
          <Section title={COPY.HOST.SECTIONS.details}>
            <div className="grid gap-4 sm:grid-cols-4">
              {["maxGuests", "bedrooms", "beds", "bathrooms"].map((k) => (
                <Input key={k} label={F[k]} type="number" min={k === "bedrooms" || k === "bathrooms" ? 0 : 1} max={50} step={k === "bathrooms" ? 0.5 : 1} required value={form[k]} onChange={set(k)} />
              ))}
            </div>
          </Section>
          <Section title={COPY.HOST.SECTIONS.pricing}>
            <div className="grid gap-4 sm:grid-cols-3">
              <Input label={F.nightly} type="number" min={100} required value={form.nightly} onChange={set("nightly")} />
              <Input label={F.cleaningFee} type="number" min={0} value={form.cleaningFee} onChange={set("cleaningFee")} />
              <Input label={F.weeklyDiscountPct} type="number" min={0} max={90} value={form.weeklyDiscountPct} onChange={set("weeklyDiscountPct")} />
            </div>
          </Section>
          <Section title={COPY.HOST.SECTIONS.rules}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label={F.minNights} type="number" min={1} max={30} value={form.minNights} onChange={set("minNights")} />
              <Select label={F.cancellationPolicy} value={form.cancellationPolicy} onChange={set("cancellationPolicy")}>
                {POLICIES.map((p) => <option key={p} value={p}>{COPY.CANCEL_POLICY.NAMES[p]}</option>)}
              </Select>
            </div>
            <p className="text-caption text-fg-muted">{COPY.CANCEL_POLICY.SUMMARY[form.cancellationPolicy]}</p>
            <Switch label={F.instantBook} description={F.instantBookHint} checked={form.instantBook} onChange={set("instantBook")} />
            <Textarea label={F.houseRules} rows={3} maxLength={2000} value={form.houseRules} onChange={set("houseRules")} />
            <Switch label={COPY.HOST.PUBLISH} checked={form.status === "listed"} onChange={(c) => setForm((f) => ({ ...f, status: c ? "listed" : "unlisted" }))} />
          </Section>
          <Section title={COPY.HOST.SECTIONS.amenities}>
            <div className="grid gap-3 sm:grid-cols-3">
              {AMENITY_KEYS.map((k) => (
                <Checkbox key={k} label={amenity(k).label} checked={form.amenities.includes(k)} onChange={() => toggleAmenity(k)} />
              ))}
            </div>
          </Section>
          <Section title={COPY.HOST.SECTIONS.photos}>
            {id && existing.data ? <PhotoManager base={`/api/host/listings/${id}`} photos={existing.data.photos} onChange={existing.reload} /> : <p className="text-body text-fg-muted">{COPY.HOST.SAVE_FIRST}</p>}
          </Section>
          {error && <Alert tone="error">{error}</Alert>}
          <div className="sticky bottom-0 -mx-6 border-t border-line bg-canvas px-6 py-4">
            <Button type="submit" variant="primary" loading={busy}>{id ? COPY.HOST.SAVE : COPY.HOST.CREATE_LISTING}</Button>
          </div>
        </form>
      )}
    </PageState>
  );
}
