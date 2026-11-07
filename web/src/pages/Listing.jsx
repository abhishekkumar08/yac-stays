import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Button, Modal } from "@kasumi/ui";
import { BedDouble, CheckCircle2, ChevronRight, Star, Tag } from "lucide-react";
import { nightsBetween } from "@shared/dates.js";
import { COPY } from "@/copy.js";
import { BookingCard } from "@/components/BookingCard.jsx";
import { HeartButton } from "@/components/HeartButton.jsx";
import { HostCard } from "@/components/HostCard.jsx";
import { ListingCard } from "@/components/ListingCard.jsx";
import { MapView } from "@/components/MapView.jsx";
import { PageState } from "@/components/PageState.jsx";
import { PhotoGrid } from "@/components/PhotoGrid.jsx";
import { Reviews } from "@/components/Reviews.jsx";
import { Row, RowItem } from "@/components/Row.jsx";
import { StayCalendar } from "@/components/StayCalendar.jsx";
import { Laurel } from "@/brand/Laurel.jsx";
import { ReportListing } from "@/components/ReportListing.jsx";
import { ShareButton } from "@/components/ShareButton.jsx";
import { RatingInline } from "@/components/Stars.jsx";
import { UserAvatar } from "@/components/UserAvatar.jsx";
import { amenity } from "@/lib/amenities.js";
import { cancellationText, dateRange, money, photoUrl, rating, yearsSince } from "@/lib/format.js";
import { useListingStay } from "@/lib/stay.js";

const HEADER_PX = 81;
const Divider = () => <hr className="my-8 border-line" />;

function KnowItem({ title, items: raw }) {
  const [open, setOpen] = useState(false);
  const items = [...new Set(raw)];
  return (
    <div>
      <h3 className="mb-2 text-label text-fg">{title}</h3>
      <ul className="space-y-1 text-body text-fg-muted">
        {items.slice(0, 3).map((t) => <li key={t}>{t}</li>)}
      </ul>
      <Button variant="link" className="mt-2 gap-1 px-0 font-semibold text-fg underline" onClick={() => setOpen(true)}>
        {COPY.LISTING.SHOW_MORE}
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title={title} size="md">
        <ul className="divide-y divide-line">
          {items.map((t) => <li key={t} className="py-4 text-body-lg text-fg">{t}</li>)}
        </ul>
      </Modal>
    </div>
  );
}

function StickyNav({ listing, quote }) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const photos = document.getElementById("photos");
    if (!photos) return undefined;
    const io = new IntersectionObserver(([e]) => setShown(!e.isIntersecting && e.boundingClientRect.top < HEADER_PX), { rootMargin: `-${HEADER_PX}px 0px 0px 0px` });
    io.observe(photos);
    return () => io.disconnect();
  }, []);
  if (!shown) return null;
  const links = [["photos", COPY.LISTING.NAV.photos], ["offers-title", COPY.LISTING.NAV.amenities], ["reviews", COPY.LISTING.NAV.reviews], ["location", COPY.LISTING.NAV.location]];
  return (
    <div className="fixed inset-x-0 top-0 z-overlay hidden border-b border-line bg-canvas md:block">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6">
        <nav aria-label={COPY.LISTING.ABOUT} className="flex gap-6">
          {links.map(([id, label]) => (
            <a key={id} href={`#${id}`} className="border-b-4 border-transparent py-6 text-label text-fg hover:border-fg">{label}</a>
          ))}
        </nav>
        <div className="flex items-center gap-4">
          {quote && (
            <p className="text-body text-fg">
              <strong className="underline">{money(quote.total)}</strong> <span className="text-fg-muted">{COPY.CARD.FOR_NIGHTS(quote.nights)}</span>
            </p>
          )}
          <Button as="a" href="#book" variant="primary">{listing.instantBook ? COPY.BOOKING.RESERVE : COPY.BOOKING.REQUEST}</Button>
        </div>
      </div>
    </div>
  );
}

function AmenityItem({ name, className = "" }) {
  const { icon: Icon, label } = amenity(name);
  return (
    <li className={`flex items-center gap-4 text-body-lg text-fg ${className}`}>
      <Icon className="h-6 w-6" aria-hidden="true" />
      {label}
    </li>
  );
}

export function Listing() {
  const { id } = useParams();
  const { detail, avail, listing: l, availability, stay, setStay, quote, error } = useListingStay(id);
  const [moreText, setMoreText] = useState(false);
  const [allAmenities, setAllAmenities] = useState(false);

  return (
    <div className="mx-auto max-w-6xl px-6 py-6">
      <PageState loading={detail.loading || avail.loading} error={detail.error ?? avail.error} onRetry={detail.reload} notFound={detail.error?.status === 404 && { title: COPY.LISTING.NOT_FOUND, body: COPY.LISTING.NOT_FOUND_BODY }}>
        {l && availability && (
          <>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <h1 className="text-headline text-fg">{l.title}</h1>
              <div className="flex gap-2">
                <ShareButton title={l.title} photo={photoUrl(l.photos[0])} />
                <HeartButton kind="listing" id={l.id} title={l.title} onImage={false} />
              </div>
            </div>
            <PhotoGrid photos={l.photos} rooms={l.photoRooms} title={l.title} />
            <StickyNav listing={l} quote={quote} />

            <div className="mt-10 grid gap-16 lg:grid-cols-[minmax(0,1fr)_23rem]">
              <div>
                <h2 className="text-title-lg text-fg">{l.roomType === "private" ? COPY.LISTING.ROOM_IN(l.propertyType, `${l.area}, ${l.city}`) : COPY.LISTING.ENTIRE(l.propertyType, `${l.area}, ${l.city}`)}</h2>
                <p className="mt-1 text-body-lg text-fg">{COPY.LISTING.CAPACITY(l.maxGuests, l.bedrooms, l.beds, l.bathrooms)}</p>
                <p className="mt-1 flex items-center gap-2 text-body-lg text-fg">
                  <RatingInline value={l.rating} count={l.reviewCount} showCount={false} className="text-body-lg font-semibold" />
                  {l.reviewCount > 0 && (
                    <a href="#reviews" className="font-semibold underline">
                      {COPY.LISTING.REVIEWS(l.reviewCount)}
                    </a>
                  )}
                </p>
                {l.guestFavourite && (
                  <a href="#reviews" className="mt-6 grid grid-cols-[auto_1fr_auto_auto] items-center gap-4 rounded-overlay border border-line p-5 focus-ring">
                    <span className="flex items-center text-label text-fg">
                      <Laurel className="h-9 w-4" />
                      <span className="px-1 text-center leading-tight">{COPY.LISTING.FAVOURITE_TITLE}</span>
                      <Laurel flip className="h-9 w-4" />
                    </span>
                    <span className="text-body text-fg">{COPY.LISTING.FAVOURITE_BODY(COPY.BRAND)}</span>
                    <span className="border-l border-line pl-4 text-center">
                      <span className="block text-title text-fg">{rating(l.rating)}</span>
                      <span className="flex text-fg" aria-hidden="true">{Array.from({ length: 5 }, (_, i) => <Star key={i} className="h-2.5 w-2.5" fill="currentColor" />)}</span>
                    </span>
                    <span className="border-l border-line pl-4 text-center">
                      <span className="block text-title text-fg">{l.reviewCount}</span>
                      <span className="block text-caption text-fg underline">{COPY.LISTING.FAVOURITE_REVIEWS}</span>
                    </span>
                  </a>
                )}
                <Divider />
                <div className="flex items-center gap-4">
                  <UserAvatar name={l.host.name} hue={l.host.avatarHue} size="lg" />
                  <div>
                    <p className="text-label text-fg">{COPY.LISTING.HOSTED_BY(l.host.name)}</p>
                    <p className="text-body text-fg-muted">
                      {[l.host.superhost && COPY.CARD.SUPERHOST, COPY.LISTING.YEARS_HOSTING(yearsSince(l.host.joined))].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                </div>
                <Divider />
                <ul className="space-y-6">
                  {l.highlights.map((h) => (
                    <li key={h.title} className="flex gap-5">
                      <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-fg" aria-hidden="true" />
                      <div>
                        <p className="text-label text-fg">{h.title}</p>
                        <p className="text-body text-fg-muted">{h.body}</p>
                      </div>
                    </li>
                  ))}
                </ul>
                <Divider />
                <h2 className="sr-only">{COPY.LISTING.ABOUT}</h2>
                <p className={`whitespace-pre-line text-body-lg text-fg ${moreText ? "" : "line-clamp-4"}`}>{l.description}</p>
                <Button variant="link" className="mt-2 px-0 font-semibold underline" onClick={() => setMoreText((m) => !m)}>
                  {moreText ? COPY.LISTING.SHOW_LESS : COPY.LISTING.SHOW_MORE}
                </Button>
                {l.sleeping.length > 0 && (
                  <>
                    <Divider />
                    <section aria-labelledby="sleep-title">
                      <h2 id="sleep-title" className="mb-6 text-title-lg text-fg">{COPY.LISTING.WHERE_SLEEP}</h2>
                      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                        {l.sleeping.map((s) => (
                          <div key={s.room} className="rounded-card border border-line p-5">
                            <BedDouble className="h-7 w-7 text-fg" aria-hidden="true" />
                            <p className="mt-3 text-label text-fg">{s.room}</p>
                            <p className="text-body text-fg-muted">{s.beds}</p>
                          </div>
                        ))}
                      </div>
                    </section>
                  </>
                )}
                <Divider />
                <section aria-labelledby="offers-title">
                  <h2 id="offers-title" className="mb-6 scroll-mt-40 text-title-lg text-fg">{COPY.LISTING.OFFERS}</h2>
                  <ul className="grid gap-4 sm:grid-cols-2">
                    {l.amenities.slice(0, 10).map((a) => (
                      <AmenityItem key={a} name={a} />
                    ))}
                  </ul>
                  {l.amenities.length > 10 && (
                    <Button variant="outline" className="mt-8" onClick={() => setAllAmenities(true)}>
                      {COPY.LISTING.SHOW_ALL_AMENITIES(l.amenities.length)}
                    </Button>
                  )}
                  <Modal open={allAmenities} onClose={() => setAllAmenities(false)} title={COPY.LISTING.OFFERS} size="md">
                    <ul className="divide-y divide-line">
                      {l.amenities.map((a) => (
                        <AmenityItem key={a} name={a} className="py-4" />
                      ))}
                    </ul>
                  </Modal>
                </section>
                <Divider />
                <section aria-labelledby="cal-title">
                  <h2 id="cal-title" className="text-title-lg text-fg">
                    {stay.checkIn && stay.checkOut ? COPY.LISTING.NIGHTS_IN(nightsBetween(stay.checkIn, stay.checkOut), l.city) : stay.checkIn ? COPY.LISTING.SELECT_CHECK_OUT : COPY.LISTING.SELECT_CHECK_IN}
                  </h2>
                  <p className="mb-6 text-body text-fg-muted">
                    {stay.checkIn && stay.checkOut ? dateRange(stay.checkIn, stay.checkOut) : COPY.LISTING.ADD_DATES_FOR_PRICES}
                  </p>
                  <StayCalendar availability={availability} start={stay.checkIn} end={stay.checkOut} onChange={(r) => setStay({ checkIn: r.start, checkOut: r.end })} />
                  <div className="mt-2 flex justify-end">
                    <Button variant="link" className="font-semibold underline" onClick={() => setStay({ checkIn: null, checkOut: null })}>
                      {COPY.LISTING.CLEAR_DATES}
                    </Button>
                  </div>
                </section>
              </div>
              <aside>
                <div className="sticky top-28 space-y-6" id="book">
                  <p className="flex items-center justify-center gap-3 rounded-overlay border border-line px-4 py-3 text-body text-fg shadow-raised">
                    <Tag className="h-5 w-5 ys-highlight" aria-hidden="true" />
                    {COPY.HOME.PRICES_INCLUDE_FEES}
                  </p>
                  <BookingCard listing={l} availability={availability} stay={stay} setStay={setStay} quote={quote} error={error} />
                  <ReportListing listingId={l.id} />
                </div>
              </aside>
            </div>

            <Divider />
            <Reviews rating={l.rating} count={l.reviewCount} scores={l.scores} tags={l.tags} reviews={l.reviews} distribution={l.distribution} guestFavourite={l.guestFavourite} />
            <Divider />
            <section aria-labelledby="map-title" id="location" className="scroll-mt-28">
              <h2 id="map-title" className="text-title-lg text-fg">{COPY.LISTING.WHERE_YOU_BE}</h2>
              <p className="mb-6 mt-1 text-body-lg text-fg">{`${l.area}, ${l.city}, ${l.state}`}</p>
              <MapView items={[l]} single label={COPY.LISTING.WHERE_YOU_BE} className="h-[26rem]" />
            </section>
            <Divider />
            <HostCard host={l.host} kind="listing" itemId={l.id} />
            <Divider />
            <section aria-labelledby="know-title">
              <h2 id="know-title" className="mb-6 text-title-lg text-fg">{COPY.LISTING.THINGS_TO_KNOW}</h2>
              <div className="grid gap-8 md:grid-cols-3">
                <KnowItem title={COPY.LISTING.HOUSE_RULES} items={l.houseRules.split("·").map((r) => r.trim()).filter(Boolean)} />
                <KnowItem title={COPY.LISTING.SAFETY} items={[COPY.LISTING.SAFETY_BODY, ...l.amenities.filter((a) => ["smoke_alarm", "first_aid"].includes(a)).map((a) => amenity(a).label)]} />
                <KnowItem title={COPY.LISTING.CANCELLATION} items={[cancellationText(l.cancellationPolicy, stay.checkIn), COPY.CANCEL_POLICY.SUMMARY[l.cancellationPolicy]]} />
              </div>
            </section>
            {l.similar.length > 0 && (
              <Row title={COPY.LISTING.MORE_IN(l.city)}>
                {l.similar.map((s) => (
                  <RowItem key={s.id}>
                    <ListingCard listing={s} compact />
                  </RowItem>
                ))}
              </Row>
            )}
          </>
        )}
      </PageState>
    </div>
  );
}
