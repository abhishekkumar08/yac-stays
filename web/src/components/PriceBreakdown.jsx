import { COPY } from "@/copy.js";
import { money } from "@/lib/format.js";

export function PriceBreakdown({ quote }) {
  const rows = [
    [COPY.BOOKING.NIGHTS_X(money(quote.nightly), quote.nights), money(quote.subtotal)],
    quote.discount ? [COPY.CARD.DISCOUNT[quote.discountKind] ?? COPY.BOOKING.WEEKLY_DISCOUNT, `−${money(quote.discount)}`, "ys-highlight"] : null,
    quote.cleaningFee ? [COPY.BOOKING.CLEANING, money(quote.cleaningFee)] : null,
    [COPY.BOOKING.SERVICE, money(quote.serviceFee)],
  ].filter(Boolean);
  return (
    <dl className="space-y-3 text-body-lg">
      {rows.map(([k, v, cls]) => (
        <div key={k} className="flex justify-between gap-4">
          <dt className="text-fg underline decoration-line-strong">{k}</dt>
          <dd className={cls ?? "text-fg"}>{v}</dd>
        </div>
      ))}
      <div className="flex justify-between gap-4 border-t border-line pt-4 font-semibold">
        <dt className="text-fg">{COPY.BOOKING.TOTAL_INR}</dt>
        <dd className="text-fg">{money(quote.total)}</dd>
      </div>
    </dl>
  );
}
