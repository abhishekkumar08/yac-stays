import { useState } from "react";
import { useParams } from "react-router-dom";
import { Alert, Button, IconButton, Input, SegmentedControl, Select, Switch, Textarea, useNotifications } from "@kasumi/ui";
import { Trash2 } from "lucide-react";
import { localMinute, todayIso } from "@shared/dates.js";
import { COPY } from "@/copy.js";
import { PageState } from "@/components/PageState.jsx";
import { Section } from "@/components/Section.jsx";
import { PhotoManager } from "@/pages/host/PhotoManager.jsx";
import { useHostEditor } from "@/pages/host/useHostEditor.js";
import { api, errorText } from "@/lib/api.js";
import { slotLabel } from "@/lib/format.js";

const F = COPY.HOST.FIELDS;
const EMPTY = {
  kind: "experience", providedAt: "", qualifications: "", offerings: [],
  title: "", description: "", category: "outdoors", city: "", area: "", lat: "", lng: "", durationMin: 120, pricePerGuest: 1500,
  maxGuests: 8, meetingPoint: "", whatToBring: "", activityLevel: "", guestRequirements: "", status: "listed", steps: [{ title: "", body: "" }],
};

const fromApi = (e) => ({
  kind: e.kind, providedAt: e.provided_at, qualifications: e.qualifications.join("\n"),
  offerings: e.offerings.map((o) => ({ id: o.id, title: o.title, description: o.description, pricePerGuest: o.price_per_guest / 100, durationMin: o.duration_min })),
  title: e.title, description: e.description, category: e.category, city: e.city, area: e.area, lat: e.lat, lng: e.lng, durationMin: e.duration_min,
  pricePerGuest: e.price_per_guest / 100, maxGuests: e.max_guests, meetingPoint: e.meeting_point, whatToBring: e.what_to_bring,
  activityLevel: e.activity_level, guestRequirements: e.guest_requirements, status: e.status, steps: e.steps.length ? e.steps : [{ title: "", body: "" }],
});

const toApi = (f) => ({
  ...f,
  lat: Number(f.lat), lng: Number(f.lng), durationMin: Number(f.durationMin), maxGuests: Number(f.maxGuests),
  pricePerGuest: Math.round(Number(f.pricePerGuest) * 100), steps: f.steps.filter((s) => s.title.trim()),
  qualifications: f.qualifications.split("\n").map((q) => q.trim()).filter(Boolean),
  offerings: f.offerings.filter((o) => o.title.trim()).map((o) => ({ ...o, pricePerGuest: Math.round(Number(o.pricePerGuest) * 100), durationMin: Number(o.durationMin) })),
});

function Offerings({ value, onChange }) {
  const H = COPY.HOST;
  const setAt = (i, k) => (e) => onChange(value.map((o, j) => (j === i ? { ...o, [k]: e.target.value } : o)));
  return (
    <div className="space-y-4">
      {value.map((o, i) => (
        <div key={i} className="grid gap-3 rounded-card border border-line p-4 sm:grid-cols-2">
          <Input label={H.OFFERING_TITLE} maxLength={80} value={o.title} onChange={setAt(i, "title")} />
          <Input label={H.OFFERING_DESC} maxLength={400} value={o.description} onChange={setAt(i, "description")} />
          <Input label={H.OFFERING_PRICE} type="number" min={100} value={o.pricePerGuest} onChange={setAt(i, "pricePerGuest")} />
          <div className="flex items-end gap-2">
            <Input label={H.OFFERING_DURATION} type="number" min={15} max={1440} value={o.durationMin} onChange={setAt(i, "durationMin")} containerClassName="flex-1" />
            <IconButton icon={Trash2} label={H.REMOVE} onClick={() => onChange(value.filter((_, j) => j !== i))} />
          </div>
        </div>
      ))}
      <Button variant="outline" size="sm" disabled={value.length >= 8} onClick={() => onChange([...value, { title: "", description: "", pricePerGuest: 2000, durationMin: 60 }])}>{H.ADD_OFFERING}</Button>
    </div>
  );
}

function Slots({ experience, onChange }) {
  const { notify } = useNotifications();
  const [startsAt, setStartsAt] = useState("");
  const [capacity, setCapacity] = useState(experience.max_guests);
  const today = todayIso();

  async function add(e) {
    e.preventDefault();
    try {
      await api.post(`/api/host/experiences/${experience.id}/slots`, { startsAt, capacity: Number(capacity) });
      setStartsAt("");
      onChange();
    } catch (err) {
      notify(errorText(err), "error");
    }
  }

  async function remove(id) {
    try {
      await api.del(`/api/host/slots/${id}`);
      onChange();
    } catch {
      notify(COPY.COMMON.ERROR, "error");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <Input label={COPY.HOST.SLOT_START} type="datetime-local" min={localMinute()} value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
        <Input label={COPY.HOST.SLOT_CAPACITY} type="number" min={1} max={100} value={capacity} onChange={(e) => setCapacity(e.target.value)} containerClassName="w-28" />
        <Button variant="outline" onClick={add} disabled={!startsAt}>{COPY.HOST.ADD_SLOT}</Button>
      </div>
      <ul className="divide-y divide-line">
        {experience.slots.map((s) => {
          const l = slotLabel(s.starts_at, s.ends_at, today);
          return (
            <li key={s.id} className="flex items-center justify-between py-2">
              <span className="text-body text-fg">{l.day} · {l.time}</span>
              <span className="flex items-center gap-3 text-caption text-fg-muted">
                {COPY.HOST.BOOKED_OF(s.seats_taken, s.capacity)}
                {s.seats_taken === 0 && <IconButton icon={Trash2} size="xs" label={COPY.HOST.DELETE_SLOT} onClick={() => remove(s.id)} />}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function ExperienceEditor() {
  const { id } = useParams();
  const { existing, form, setForm, set, busy, error, save } = useHostEditor({
    id, apiBase: "/api/host/experiences", pageBase: "/host/experiences", empty: EMPTY, fromApi, toApi, createdMessage: COPY.HOST.EXPERIENCE_CREATED,
  });

  const setStep = (i, k) => (e) => setForm((f) => ({ ...f, steps: f.steps.map((s, j) => (j === i ? { ...s, [k]: e.target.value } : s)) }));

  return (
    <PageState loading={existing.loading || !form} error={existing.error} onRetry={existing.reload}>
      {form && (
        <form onSubmit={save} className="mx-auto max-w-3xl space-y-6">
          <h1 className="text-headline text-fg">{id ? form.title : COPY.HOST.CREATE_EXPERIENCE}</h1>
          <Section title={COPY.HOST.SECTIONS.basics}>
            <SegmentedControl label={COPY.HOST.KIND} options={Object.entries(COPY.HOST.KINDS).map(([value, label]) => ({ value, label }))} value={form.kind} onChange={(v) => setForm((f) => ({ ...f, kind: v, category: v === "service" ? "photography" : "outdoors" }))} />
            <Input label={F.title} required minLength={3} maxLength={80} value={form.title} onChange={set("title")} />
            <Textarea label={F.description} rows={4} maxLength={4000} value={form.description} onChange={set("description")} />
            <div className="grid gap-4 sm:grid-cols-3">
              <Select label={F.category} value={form.category} onChange={set("category")}>
                {Object.entries(form.kind === "service" ? COPY.SERVICES.CATEGORIES : COPY.EXPERIENCES.CATEGORY_SHORT).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </Select>
              <Input label={F.durationMin} type="number" min={15} max={1440} required value={form.durationMin} onChange={set("durationMin")} />
              <Input label={F.maxGuestsExp} type="number" min={1} max={100} required value={form.maxGuests} onChange={set("maxGuests")} />
              <Input label={F.pricePerGuest} type="number" min={100} required value={form.pricePerGuest} onChange={set("pricePerGuest")} />
            </div>
          </Section>
          <Section title={COPY.HOST.SECTIONS.location}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label={F.city} required value={form.city} onChange={set("city")} />
              <Input label={F.area} required value={form.area} onChange={set("area")} />
              <Input label={F.lat} type="number" step="any" required value={form.lat} onChange={set("lat")} />
              <Input label={F.lng} type="number" step="any" required value={form.lng} onChange={set("lng")} />
            </div>
            <Input label={F.meetingPoint} maxLength={200} value={form.meetingPoint} onChange={set("meetingPoint")} />
          </Section>
          {form.kind === "service" && (
            <Section title={COPY.HOST.OFFERINGS}>
              <Offerings value={form.offerings} onChange={(offerings) => setForm((f) => ({ ...f, offerings }))} />
              <Input label={COPY.HOST.PROVIDED_AT} maxLength={120} value={form.providedAt} onChange={set("providedAt")} />
              <Textarea label={COPY.HOST.QUALIFICATIONS} rows={3} value={form.qualifications} onChange={set("qualifications")} />
            </Section>
          )}
          <Section title={COPY.HOST.SECTIONS.steps}>
            {form.steps.map((s, i) => (
              <div key={i} className="grid gap-3 sm:grid-cols-[1fr_2fr_auto] sm:items-end">
                <Input label={F.stepTitle} maxLength={80} value={s.title} onChange={setStep(i, "title")} />
                <Input label={F.stepBody} maxLength={400} value={s.body} onChange={setStep(i, "body")} />
                <IconButton icon={Trash2} label={COPY.HOST.REMOVE} disabled={form.steps.length === 1} onClick={() => setForm((f) => ({ ...f, steps: f.steps.filter((_, j) => j !== i) }))} />
              </div>
            ))}
            <Button variant="outline" size="sm" disabled={form.steps.length >= 10} onClick={() => setForm((f) => ({ ...f, steps: [...f.steps, { title: "", body: "" }] }))}>{COPY.HOST.ADD_STEP}</Button>
          </Section>
          <Section title={COPY.LISTING.THINGS_TO_KNOW}>
            <Input label={F.whatToBring} maxLength={1000} value={form.whatToBring} onChange={set("whatToBring")} />
            <Input label={F.activityLevel} maxLength={200} value={form.activityLevel} onChange={set("activityLevel")} />
            <Input label={F.guestRequirements} maxLength={1000} value={form.guestRequirements} onChange={set("guestRequirements")} />
            <Switch label={COPY.HOST.PUBLISH} checked={form.status === "listed"} onChange={(c) => setForm((f) => ({ ...f, status: c ? "listed" : "unlisted" }))} />
          </Section>
          <Section title={COPY.HOST.SECTIONS.photos}>
            {id && existing.data ? <PhotoManager base={`/api/host/experiences/${id}`} photos={existing.data.photos} onChange={existing.reload} /> : <p className="text-body text-fg-muted">{COPY.HOST.SAVE_FIRST}</p>}
          </Section>
          {id && existing.data && (
            <Section title={COPY.HOST.SECTIONS.slots}>
              <Slots experience={existing.data} onChange={existing.reload} />
            </Section>
          )}
          {error && <Alert tone="error">{error}</Alert>}
          <div className="sticky bottom-0 -mx-6 border-t border-line bg-canvas px-6 py-4">
            <Button type="submit" variant="primary" loading={busy}>{id ? COPY.HOST.SAVE : COPY.HOST.CREATE_EXPERIENCE}</Button>
          </div>
        </form>
      )}
    </PageState>
  );
}
