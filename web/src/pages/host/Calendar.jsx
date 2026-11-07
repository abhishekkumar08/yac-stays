import { useEffect, useMemo, useState } from "react";
import { Button, Input, SegmentedControl, Select, useNotifications } from "@kasumi/ui";
import { addDays, eachNight } from "@shared/dates.js";
import { COPY } from "@/copy.js";
import { PageState } from "@/components/PageState.jsx";
import { api } from "@/lib/api.js";
import { dateRange, money, monthLabel } from "@/lib/format.js";
import { useApi } from "@/lib/useApi.js";

const H = COPY.HOST;
const MONTHS_SHOWN = 4;

function monthGrid(ym) {
  const first = `${ym}-01`;
  const lead = new Date(`${first}T00:00:00Z`).getUTCDay();
  const days = [];
  for (let d = first; d.startsWith(ym); d = addDays(d, 1)) days.push(d);
  return { lead, days };
}

function DayCell({ date, state, selected, onClick }) {
  const { price, custom, booking, blocked, past } = state;
  const disabled = past || !!booking;
  return (
    <Button
      variant="ghost"
      disabled={disabled}
      onClick={onClick}
      aria-pressed={selected}
      aria-label={`${date}. ${booking ? `${H.BOOKED} · ${booking}` : blocked ? H.BLOCKED_STATE : money(price)}`}
      className={`relative h-20 flex-col items-start justify-between rounded-control border p-2 text-left ${selected ? "border-fg bg-surface-muted ring-2 ring-fg" : "border-line"} ${blocked ? "bg-[repeating-linear-gradient(135deg,transparent,transparent_6px,rgb(var(--mw-line))_6px,rgb(var(--mw-line))_7px)]" : ""} ${past ? "opacity-40" : ""}`}
    >
      <span className={`text-label ${blocked ? "text-fg-muted line-through" : "text-fg"}`}>{Number(date.slice(8))}</span>
      {booking ? (
        <span className="w-full truncate rounded-pill bg-accent px-2 py-0.5 text-caption text-fg-on-accent">{booking}</span>
      ) : (
        <span className={`text-caption ${custom ? "font-semibold text-accent-fg" : "text-fg-muted"}`}>{blocked ? "" : money(price)}</span>
      )}
    </Button>
  );
}

export function HostCalendar() {
  const { notify } = useNotifications();
  const listings = useApi("/api/host/listings");
  const [listingId, setListingId] = useState(null);
  const cal = useApi(listingId ? `/api/host/listings/${listingId}/calendar` : null);
  const [sel, setSel] = useState({ start: null, end: null });
  const [price, setPrice] = useState("");

  useEffect(() => {
    if (!listingId && listings.data?.length) setListingId(String(listings.data[0].id));
  }, [listings.data, listingId]);

  const data = cal.data;
  const state = useMemo(() => {
    if (!data) return null;
    const bookings = new Map();
    for (const b of data.bookings) for (const n of eachNight(b.check_in, b.check_out)) bookings.set(n, b.status === "pending" ? `${H.PENDING} · ${b.guest_name}` : b.guest_name);
    const blocked = new Set(data.blocked);
    const months = Array.from({ length: MONTHS_SHOWN }, (_, i) => {
      const d = new Date(`${data.today.slice(0, 7)}-01T00:00:00Z`);
      d.setUTCMonth(d.getUTCMonth() + i);
      return d.toISOString().slice(0, 7);
    });
    const at = (date) => ({
      price: data.prices[date] ?? data.listing.nightly,
      custom: date in data.prices,
      booking: bookings.get(date),
      blocked: blocked.has(date),
      past: date < data.today,
    });
    return { months, at };
  }, [data]);

  const nights = sel.start ? eachNight(sel.start, addDays(sel.end ?? sel.start, 1)).filter((n) => state && !state.at(n).booking) : [];
  const allBlocked = nights.length > 0 && nights.every((n) => state.at(n).blocked);

  function pick(date) {
    if (!sel.start || sel.end || date < sel.start) setSel({ start: date, end: null });
    else setSel({ start: sel.start, end: date });
    setPrice("");
  }

  async function act(fn, done) {
    try {
      await fn();
      notify(done, "success");
      cal.reload();
    } catch {
      notify(COPY.COMMON.ERROR, "error");
    }
  }

  return (
    <PageState loading={listings.loading} error={listings.error} onRetry={listings.reload}>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-headline text-fg">{H.CALENDAR}</h1>
        {listings.data?.length > 0 && (
          <Select label={H.PICK_LISTING} value={listingId ?? ""} onChange={(e) => { setListingId(e.target.value); setSel({ start: null, end: null }); }} containerClassName="w-80">
            {listings.data.map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}
          </Select>
        )}
      </div>
      {state && (
        <div className="grid gap-10 lg:grid-cols-[1fr_22rem]">
          <div className="space-y-10">
            {state.months.map((m) => {
              const { lead, days } = monthGrid(m);
              return (
                <section key={m}>
                  <h2 className="mb-3 text-title text-fg">{monthLabel(m)}</h2>
                  <div className="grid grid-cols-7 gap-1 text-center text-caption text-fg-subtle" aria-hidden="true">
                    {H.WEEKDAY_SHORT.map((d, i) => <span key={i} className="py-1">{d}</span>)}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: lead }, (_, i) => <span key={i} />)}
                    {days.map((d) => (
                      <DayCell key={d} date={d} state={state.at(d)} selected={!!sel.start && d >= sel.start && d <= (sel.end ?? sel.start)} onClick={() => pick(d)} />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
          <aside>
            <div className="sticky top-28 space-y-5 rounded-overlay border border-line p-5">
              {nights.length === 0 ? (
                <>
                  <p className="text-body text-fg-muted">{H.CAL_HELP}</p>
                  <p className="text-label text-fg">{H.BASE_PRICE(money(data.listing.nightly))}</p>
                </>
              ) : (
                <>
                  <p className="text-label text-fg">{H.SELECTED_NIGHTS(nights.length, dateRange(nights[0], addDays(nights[nights.length - 1], 1)))}</p>
                  <SegmentedControl
                    label={H.AVAILABILITY}
                    options={[{ value: "open", label: H.OPEN }, { value: "blocked", label: H.BLOCKED_STATE }]}
                    value={allBlocked ? "blocked" : "open"}
                    onChange={(v) => act(() => api.post(`/api/host/listings/${listingId}/blocked`, { nights, blocked: v === "blocked" }), H.CALENDAR_UPDATED)}
                  />
                  <Input label={H.PRICE_PER_NIGHT} type="number" min={100} leading="₹" placeholder={String(Math.round(state.at(nights[0]).price / 100))} value={price} onChange={(e) => setPrice(e.target.value)} />
                  <div className="flex flex-wrap gap-2">
                    <Button variant="primary" disabled={!(Number(price) >= 100)} onClick={() => act(() => api.post(`/api/host/listings/${listingId}/prices`, { nights, price: Math.round(Number(price) * 100) }), H.CALENDAR_UPDATED)}>{H.SAVE_PRICE}</Button>
                    <Button variant="outline" onClick={() => act(() => api.post(`/api/host/listings/${listingId}/prices`, { nights, price: null }), H.CALENDAR_UPDATED)}>{H.RESET_PRICE}</Button>
                  </div>
                  <Button variant="link" className="px-0 underline" onClick={() => setSel({ start: null, end: null })}>{H.CLEAR_SELECTION}</Button>
                </>
              )}
            </div>
          </aside>
        </div>
      )}
    </PageState>
  );
}
