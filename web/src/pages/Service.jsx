import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Card, useNotifications } from "@kasumi/ui";
import { Award } from "lucide-react";
import { COPY } from "@/copy.js";
import { BookActivityModal } from "@/components/BookActivityModal.jsx";
import { HeartButton } from "@/components/HeartButton.jsx";
import { HostCard } from "@/components/HostCard.jsx";
import { MapView } from "@/components/MapView.jsx";
import { PageState } from "@/components/PageState.jsx";
import { Reviews } from "@/components/Reviews.jsx";
import { ShareButton } from "@/components/ShareButton.jsx";
import { RatingInline } from "@/components/Stars.jsx";
import { UserAvatar } from "@/components/UserAvatar.jsx";
import { useAuth } from "@/lib/auth.jsx";
import { money, photoUrl } from "@/lib/format.js";
import { useApi } from "@/lib/useApi.js";

export function Service() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { notify } = useNotifications();
  const { requireAuth } = useAuth();
  const { data: s, loading, error, reload } = useApi(`/api/experiences/${id}`);
  const [booking, setBooking] = useState(null);
  const open = (offering) => requireAuth(() => setBooking({ offering }));

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <PageState loading={loading} error={error} onRetry={reload}>
        {s && (
          <div className="grid gap-12 lg:grid-cols-[24rem_minmax(0,1fr)]">
            <aside>
              <div className="lg:sticky lg:top-28">
                <div className="relative">
                  <img src={photoUrl(s.photos[0])} alt="" className="aspect-[2/1] w-full rounded-overlay object-cover" />
                  <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 rounded-pill ring-4 ring-canvas">
                    <UserAvatar name={s.host.name} hue={s.host.avatarHue} size="xl" />
                  </span>
                </div>
                <div className="mt-14 text-center">
                  <h1 className="text-headline text-fg">{s.title}</h1>
                  <p className="mt-3 text-body-lg text-fg-muted">{s.description}</p>
                  <p className="mt-4 flex flex-wrap items-center justify-center gap-1 text-body text-fg">
                    <RatingInline value={s.rating} count={s.reviewCount} showCount={false} />
                    {s.reviewCount > 0 && <span>· {COPY.LISTING.REVIEWS(s.reviewCount)}</span>}
                    <span>· {COPY.SERVICES.PROVIDER_IN(COPY.SERVICES.PROVIDER[s.category], s.city)}</span>
                  </p>
                  {s.providedAt && <p className="text-body text-fg-muted">{s.providedAt}</p>}
                  <div className="mt-4 flex justify-center gap-2">
                    <ShareButton title={s.title} iconOnly />
                    <HeartButton kind="experience" id={s.id} title={s.title} onImage={false} />
                  </div>
                </div>
                <Card padding="md" className="mt-8 flex items-center justify-between gap-4 shadow-overlay">
                  <p className="text-title text-fg">
                    {COPY.EXPERIENCES.FROM(money(s.pricePerGuest))} <span className="text-body font-normal text-fg-muted">{COPY.EXPERIENCES.PER_GUEST}</span>
                  </p>
                  <Button variant="primary" size="lg" onClick={() => open(null)}>{COPY.SERVICES.SHOW_DATES}</Button>
                </Card>
              </div>
            </aside>
            <div className="space-y-10">
              <ul className="space-y-6">
                {s.offerings.map((o) => (
                  <li key={o.id}>
                    <Button variant="ghost" onClick={() => open(o)} className="flex h-auto w-full items-center justify-start gap-6 rounded-overlay bg-surface p-3 text-left shadow-raised hover:bg-surface hover:shadow-overlay">
                      {o.photo && <img src={photoUrl(o.photo)} alt="" className="h-36 w-40 shrink-0 rounded-card object-cover" />}
                      <span className="min-w-0">
                        <span className="block text-title text-fg">{o.title}</span>
                        <span className="mt-1 line-clamp-2 block text-body-lg text-fg-muted">{o.description}</span>
                        <span className="mt-3 block text-body text-fg">
                          <strong>{money(o.pricePerGuest)}</strong> <span className="text-fg-muted">{COPY.EXPERIENCES.PER_GUEST} · {COPY.EXPERIENCES.DURATION_SHORT(o.durationMin)}</span>
                        </span>
                      </span>
                    </Button>
                  </li>
                ))}
              </ul>
              <p className="text-body text-fg-muted">{COPY.SERVICES.CUSTOMISE(s.host.name)}</p>
              <hr className="border-line" />
              <Reviews rating={s.rating} count={s.reviewCount} reviews={s.reviews} />
              {s.qualifications.length > 0 && (
                <section aria-labelledby="quals">
                  <h2 id="quals" className="mb-4 text-title-lg text-fg">{COPY.SERVICES.QUALIFICATIONS}</h2>
                  <ul className="space-y-3">
                    {s.qualifications.map((q) => (
                      <li key={q} className="flex items-center gap-3 text-body-lg text-fg">
                        <Award className="h-5 w-5" aria-hidden="true" />
                        {q}
                      </li>
                    ))}
                  </ul>
                </section>
              )}
              <section aria-labelledby="portfolio">
                <h2 id="portfolio" className="mb-4 text-title-lg text-fg">{COPY.SERVICES.PORTFOLIO}</h2>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {[...s.photos, ...s.offerings.map((o) => o.photo).filter(Boolean)].map((p, i) => (
                    <img key={p} src={photoUrl(p)} alt={COPY.CARD.PHOTO_OF(i + 1, s.photos.length + s.offerings.length)} className="aspect-square w-full rounded-card object-cover" />
                  ))}
                </div>
              </section>
              <section aria-labelledby="come">
                <h2 id="come" className="mb-2 text-title-lg text-fg">{COPY.SERVICES.COME_TO_YOU}</h2>
                <p className="mb-4 text-body-lg text-fg-muted">{COPY.SERVICES.COME_TO_YOU_BODY(s.area, s.city)}</p>
                <MapView items={[s]} single label={COPY.SERVICES.COME_TO_YOU} className="h-72" />
              </section>
              <section aria-labelledby="svc-know">
                <h2 id="svc-know" className="mb-6 text-title-lg text-fg">{COPY.LISTING.THINGS_TO_KNOW}</h2>
                <div className="grid gap-8 md:grid-cols-3">
                  {[[COPY.EXPERIENCES.REQUIREMENTS, s.guestRequirements], [COPY.EXPERIENCES.ACCESSIBILITY, COPY.EXPERIENCES.ACCESSIBILITY_BODY], [COPY.EXPERIENCES.CANCEL, COPY.EXPERIENCES.CANCEL_BODY]].map(([k, v]) => (
                    <div key={k}>
                      <h3 className="mb-1 text-label text-fg">{k}</h3>
                      <p className="text-body text-fg-muted">{v}</p>
                    </div>
                  ))}
                </div>
              </section>
              <HostCard host={s.host} kind="experience" itemId={s.id} />
            </div>
            <BookActivityModal
              activity={s}
              open={!!booking}
              offering={booking?.offering ?? null}
              onClose={() => setBooking(null)}
              onBooked={() => {
                setBooking(null);
                notify(COPY.EXPERIENCES.BOOKED, "success");
                navigate("/trips");
              }}
            />
          </div>
        )}
      </PageState>
    </div>
  );
}
