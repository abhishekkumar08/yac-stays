import { useEffect, useState } from "react";
import { Alert, Button, Modal, NumberStepper, RadioGroup } from "@kasumi/ui";
import { quoteExperience } from "@shared/pricing.js";
import { todayIso } from "@shared/dates.js";
import { COPY } from "@/copy.js";
import { api, errorText } from "@/lib/api.js";
import { money, slotLabel } from "@/lib/format.js";
import { PAY_OPTIONS } from "@/lib/payments.js";

export function BookActivityModal({ activity, slot: presetSlot, offering: presetOffering, open, onClose, onBooked }) {
  const [offering, setOffering] = useState(null);
  const [slot, setSlot] = useState(null);
  const [guests, setGuests] = useState(1);
  const [paidWith, setPaidWith] = useState("mock_card");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const offerings = activity.offerings ?? [];
  const onlyOffering = activity.offerings?.length === 1 ? activity.offerings[0] : null;
  const today = todayIso();

  useEffect(() => {
    if (!open) return;
    setOffering(presetOffering ?? onlyOffering);
    setSlot(presetSlot ?? null);
    setGuests(1);
    setError(null);
  }, [open, presetOffering, presetSlot, onlyOffering]);

  if (!open) return null;
  const needOffering = offerings.length > 0 && !offering;
  const price = offering?.pricePerGuest ?? activity.pricePerGuest;
  const q = quoteExperience(price, guests);

  async function book() {
    setBusy(true);
    setError(null);
    try {
      await api.post("/api/experience-bookings", { slotId: slot.id, guests, paidWith, offeringId: offering?.id });
      onBooked();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  const title = needOffering ? COPY.SERVICES.CHOOSE_OFFERING : !slot ? COPY.EXPERIENCES.SLOTS : COPY.EXPERIENCES.CONFIRM_TITLE;
  const footer = slot && !needOffering ? <Button variant="primary" loading={busy} onClick={book}>{COPY.CHECKOUT.CONFIRM}</Button> : null;

  return (
    <Modal open onClose={onClose} title={title} size="md" footer={footer}>
      {needOffering ? (
        <ul className="space-y-2">
          {offerings.map((o) => (
            <li key={o.id}>
              <Button variant="outline" onClick={() => setOffering(o)} className="h-auto w-full flex-col items-start gap-0 py-3 text-left">
                <span className="text-label text-fg">{o.title}</span>
                <span className="text-body text-fg-muted">{COPY.EXPERIENCES.PRICE_LINE(money(o.pricePerGuest), COPY.EXPERIENCES.DURATION_SHORT(o.durationMin))}</span>
              </Button>
            </li>
          ))}
        </ul>
      ) : !slot ? (
        <ul className="space-y-2">
          {activity.slots.length === 0 && <p className="text-body text-fg-muted">{COPY.EXPERIENCES.NO_SLOTS}</p>}
          {activity.slots.map((s) => {
            const l = slotLabel(s.startsAt, s.endsAt, today);
            return (
              <li key={s.id}>
                <Button variant="outline" disabled={s.seatsLeft === 0} onClick={() => setSlot(s)} className="h-auto w-full flex-col items-start gap-0 py-3 text-left">
                  <span className="text-label text-fg">{l.day}</span>
                  <span className="text-body text-fg-muted">{l.time} · {COPY.EXPERIENCES.SEATS_LEFT(s.seatsLeft)}</span>
                </Button>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="space-y-5">
          <div>
            <p className="text-label text-fg">{offering ? `${activity.title} · ${offering.title}` : activity.title}</p>
            <p className="text-body text-fg-muted">{slotLabel(slot.startsAt, slot.endsAt, today).day} · {slotLabel(slot.startsAt, slot.endsAt, today).time}</p>
          </div>
          <NumberStepper label={COPY.BOOKING.GUESTS} value={guests} min={1} max={Math.min(slot.seatsLeft, activity.maxGuests)} onChange={setGuests} />
          <RadioGroup legend={COPY.CHECKOUT.PAY_WITH} name="paidWith" options={PAY_OPTIONS} value={paidWith} onChange={setPaidWith} />
          <Alert tone="info" variant="inline">{COPY.CHECKOUT.MOCK_NOTE}</Alert>
          <dl className="space-y-2 border-t border-line pt-4 text-body-lg">
            <div className="flex justify-between"><dt>{COPY.EXPERIENCES.PRICE_X(money(price), guests)}</dt><dd>{money(q.subtotal)}</dd></div>
            <div className="flex justify-between"><dt>{COPY.BOOKING.SERVICE}</dt><dd>{money(q.serviceFee)}</dd></div>
            <div className="flex justify-between font-semibold"><dt>{COPY.BOOKING.TOTAL_INR}</dt><dd>{money(q.total)}</dd></div>
          </dl>
          {error && <Alert tone="error">{error}</Alert>}
        </div>
      )}
    </Modal>
  );
}
