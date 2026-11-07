import { Link } from "react-router-dom";
import { Button, Popover } from "@kasumi/ui";
import { COPY } from "@/copy.js";
import { HeartButton } from "@/components/HeartButton.jsx";
import { PhotoCarousel } from "@/components/PhotoCarousel.jsx";
import { PriceBreakdown } from "@/components/PriceBreakdown.jsx";
import { RatingInline } from "@/components/Stars.jsx";
import { qs } from "@/lib/api.js";
import { dateRange, money } from "@/lib/format.js";

export const listingName = (l) => COPY.CARD.IN(l.roomType === "private" ? COPY.CARD.ROOM : l.propertyType, l.area);
const TOP_FAVOURITE = 4.95;

export function ListingCard({ listing: l, search = {}, compact = false, showWindow = false, onHover }) {
  const checkIn = l.window?.checkIn ?? search.checkin;
  const checkOut = l.window?.checkOut ?? search.checkout;
  const href = `/rooms/${l.id}${qs({ check_in: checkIn, check_out: checkOut, adults: search.adults || undefined })}`;
  const badge = l.guestFavourite ? (l.rating >= TOP_FAVOURITE ? COPY.CARD.TOP_FAVOURITE : COPY.CARD.GUEST_FAVOURITE) : l.superhost ? COPY.CARD.SUPERHOST : null;
  const name = listingName(l);
  return (
    <article className="relative" onMouseEnter={() => onHover?.(l.id)} onMouseLeave={() => onHover?.(null)}>
      <PhotoCarousel photos={l.photos} title={name} href={href} className="aspect-[20/19]" />
      <Link to={href} className="block rounded-control focus-ring">
        <div className="mt-3 flex items-start justify-between gap-2">
          <h3 className="truncate text-label text-fg">{name}</h3>
          <RatingInline value={l.rating} count={l.reviewCount} className="shrink-0" showCount={!compact} />
        </div>
        {!compact && <p className="truncate text-body text-fg-muted">{l.title}</p>}
        {!compact && <p className="text-body text-fg-muted">{COPY.CARD.BEDS_LINE(l.bedrooms, l.beds, l.bathrooms)}</p>}
        {showWindow && l.window && <p className="text-body text-fg-muted">{dateRange(l.window.checkIn, l.window.checkOut)}</p>}
      </Link>
      <div className="mt-1 flex flex-wrap items-baseline gap-x-1 text-body text-fg">
        {l.price ? (
          <>
            {l.price.originalTotal > l.price.total && <s className="text-fg-muted" aria-label={COPY.CARD.ORIGINALLY(money(l.price.originalTotal))}>{money(l.price.originalTotal)}</s>}
            <Popover
              label={COPY.CARD.BREAKDOWN_TITLE}
              panelClassName="w-80 p-5"
              trigger={
                <Button variant="link" className="h-auto p-0 font-semibold text-fg underline" aria-label={`${money(l.price.total)} ${COPY.CARD.FOR_NIGHTS(l.price.nights)}. ${COPY.CARD.SHOW_BREAKDOWN}`}>
                  {money(l.price.total)}
                </Button>
              }
            >
              <p className="mb-4 text-title text-fg">{COPY.CARD.BREAKDOWN_TITLE}</p>
              <PriceBreakdown quote={l.price} />
            </Popover>
            <span className="text-fg-muted">{COPY.CARD.FOR_NIGHTS(l.price.nights)}</span>
          </>
        ) : (
          <>
            <span className="font-semibold">{money(l.nightly)}</span> <span className="text-fg-muted">{COPY.CARD.FOR_ONE_NIGHT}</span>
          </>
        )}
      </div>
      {!compact && (l.price?.discountKind || l.freeCancellation) && (
        <span className={`mt-2 inline-block rounded-control px-2 py-0.5 text-caption ${l.price?.discountKind ? "bg-success-subtle text-success-fg" : "bg-surface-muted text-fg-muted"}`}>
          {l.price?.discountKind ? COPY.CARD.DISCOUNT[l.price.discountKind] : COPY.CARD.FREE_CANCELLATION}
        </span>
      )}
      {badge && <span className="pointer-events-none absolute left-3 top-3 max-w-[calc(100%-4rem)] truncate whitespace-nowrap rounded-pill bg-surface px-3 py-1 text-caption font-semibold text-fg shadow-raised">{badge}</span>}
      <HeartButton kind="listing" id={l.id} title={name} className="absolute right-2 top-2" />
    </article>
  );
}
