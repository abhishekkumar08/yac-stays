import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Button, NumberStepper, Popover } from "@kasumi/ui";
import { ChevronDown } from "lucide-react";
import { COPY } from "@/copy.js";
import { PriceBreakdown } from "@/components/PriceBreakdown.jsx";
import { StayCalendar } from "@/components/StayCalendar.jsx";
import { fieldDate, money } from "@/lib/format.js";
import { stayQuery } from "@/lib/stay.js";

export function BookingCard({ listing, availability, stay, setStay, quote, error }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(null);
  const guests = stay.adults + stay.children;
  const hasDates = stay.checkIn && stay.checkOut;

  function reserve() {
    if (!hasDates) return setOpen("dates");
    return navigate(`/book/${listing.id}${stayQuery(stay)}`);
  }

  const setGuest = (k) => (v) => setStay({ [k]: v });

  return (
    <div className="rounded-overlay border border-line bg-surface p-6 shadow-overlay">
      <p className="mb-6 text-title text-fg">
        {quote ? (
          <>
            {quote.originalTotal > quote.total && <s className="mr-2 font-normal text-fg-muted">{money(quote.originalTotal)}</s>}
            <span className="underline">{money(quote.total)}</span>{" "}
            <span className="text-body-lg font-normal text-fg-muted">{COPY.CARD.FOR_NIGHTS(quote.nights)}</span>
          </>
        ) : (
          <>
            {money(listing.nightly)} <span className="text-body-lg font-normal text-fg-muted">{COPY.BOOKING.PER_NIGHT}</span>
          </>
        )}
      </p>
      <div className="rounded-card border border-line-strong">
        <Popover
          open={open === "dates"}
          onOpenChange={(o) => setOpen(o ? "dates" : null)}
          label={COPY.SEARCH.WHEN}
          align="end"
          className="block"
          panelClassName="w-[min(46rem,94vw)] p-6"
          trigger={
            <Button variant="ghost" className="grid h-auto w-full grid-cols-2 gap-0 rounded-b-none p-0 text-left">
              <span className="border-r border-line-strong px-3 py-2">
                <span className="block text-[10px] font-bold uppercase text-fg">{COPY.SEARCH.CHECK_IN}</span>
                <span className="block text-body text-fg">{fieldDate(stay.checkIn)}</span>
              </span>
              <span className="px-3 py-2">
                <span className="block text-[10px] font-bold uppercase text-fg">{COPY.SEARCH.CHECK_OUT}</span>
                <span className="block text-body text-fg">{fieldDate(stay.checkOut)}</span>
              </span>
            </Button>
          }
        >
          <StayCalendar
            availability={availability}
            start={stay.checkIn}
            end={stay.checkOut}
            onChange={(r) => {
              setStay({ checkIn: r.start, checkOut: r.end });
              if (r.end) setOpen(null);
            }}
          />
          <div className="mt-4 flex items-center justify-between">
            <p className="text-caption text-fg-muted">{COPY.LISTING.MIN_STAY(listing.minNights)}</p>
            <Button variant="ghost" onClick={() => setStay({ checkIn: null, checkOut: null })}>{COPY.LISTING.CLEAR_DATES}</Button>
          </div>
        </Popover>
        <Popover
          open={open === "guests"}
          onOpenChange={(o) => setOpen(o ? "guests" : null)}
          label={COPY.BOOKING.GUESTS}
          className="block border-t border-line-strong"
          panelClassName="w-full min-w-72 px-5 py-2"
          trigger={
            <Button variant="ghost" className="flex h-auto w-full items-center justify-between rounded-t-none px-3 py-2 text-left">
              <span>
                <span className="block text-[10px] font-bold uppercase text-fg">{COPY.BOOKING.GUESTS}</span>
                <span className="block text-body text-fg">{COPY.SEARCH.GUESTS(guests)}</span>
              </span>
              <ChevronDown className="h-5 w-5" aria-hidden="true" />
            </Button>
          }
        >
          <div className="divide-y divide-line">
            <NumberStepper label={COPY.SEARCH.ADULTS} description={COPY.SEARCH.ADULTS_HINT} value={stay.adults} min={1} max={listing.maxGuests - stay.children} onChange={setGuest("adults")} />
            <NumberStepper label={COPY.SEARCH.CHILDREN} description={COPY.SEARCH.CHILDREN_HINT} value={stay.children} max={listing.maxGuests - stay.adults} onChange={setGuest("children")} />
            <NumberStepper label={COPY.SEARCH.INFANTS} description={COPY.SEARCH.INFANTS_HINT} value={stay.infants} max={5} onChange={setGuest("infants")} />
            <NumberStepper label={COPY.SEARCH.PETS} description={COPY.SEARCH.PETS_HINT} value={stay.pets} max={3} onChange={setGuest("pets")} />
          </div>
          <p className="py-3 text-caption text-fg-muted">{COPY.BOOKING.MAX_GUESTS(listing.maxGuests)}</p>
        </Popover>
      </div>
      {hasDates && error && error !== "invalid_dates" && (
        <Alert tone="error" variant="inline" className="mt-3">
          {COPY.BOOKING.ERRORS[error] ?? COPY.BOOKING.ERRORS.default}
        </Alert>
      )}
      <Button variant="primary" size="lg" className="mt-4 w-full" onClick={reserve} disabled={hasDates && !!error}>
        {!hasDates ? COPY.BOOKING.CHECK_AVAILABILITY : listing.instantBook ? COPY.BOOKING.RESERVE : COPY.BOOKING.REQUEST}
      </Button>
      {quote && (
        <>
          <p className="my-4 text-center text-body text-fg-muted">{COPY.BOOKING.NOT_CHARGED}</p>
          <PriceBreakdown quote={quote} />
        </>
      )}
    </div>
  );
}
