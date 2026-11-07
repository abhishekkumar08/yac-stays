import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, useNotifications } from "@kasumi/ui";
import { Clock, MapPin, Users } from "lucide-react";
import { todayIso } from "@shared/dates.js";
import { COPY } from "@/copy.js";
import { BookActivityModal } from "@/components/BookActivityModal.jsx";
import { ExperienceCard } from "@/components/ExperienceCard.jsx";
import { HeartButton } from "@/components/HeartButton.jsx";
import { HostCard } from "@/components/HostCard.jsx";
import { MapView } from "@/components/MapView.jsx";
import { PageState } from "@/components/PageState.jsx";
import { Reviews } from "@/components/Reviews.jsx";
import { Row, RowItem } from "@/components/Row.jsx";
import { RatingInline } from "@/components/Stars.jsx";
import { useAuth } from "@/lib/auth.jsx";
import { money, photoUrl, slotLabel } from "@/lib/format.js";
import { useApi } from "@/lib/useApi.js";

export function Experience() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { notify } = useNotifications();
  const { requireAuth } = useAuth();
  const { data: e, loading, error, reload } = useApi(`/api/experiences/${id}`);
  const [showAll, setShowAll] = useState(false);
  const [slot, setSlot] = useState(null);
  const today = todayIso();

  return (
    <div className="mx-auto max-w-6xl px-6 py-6">
      <PageState loading={loading} error={error} onRetry={reload}>
        {e && (
          <>
            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-headline text-fg">{e.title}</h1>
                <p className="mt-1 flex items-center gap-2 text-body text-fg-muted">
                  <RatingInline value={e.rating} count={e.reviewCount} /> · {e.area}, {e.city}
                </p>
              </div>
              <HeartButton kind="experience" id={e.id} title={e.title} onImage={false} />
            </div>
            <div className="ys-no-scrollbar flex gap-2 overflow-x-auto rounded-overlay">
              {e.photos.map((p, i) => (
                <img key={p} src={photoUrl(p)} alt={COPY.CARD.PHOTO_OF(i + 1, e.photos.length)} className="h-80 w-[min(26rem,80vw)] shrink-0 object-cover first:rounded-l-overlay last:rounded-r-overlay" />
              ))}
            </div>
            <div className="mt-10 grid gap-16 lg:grid-cols-[minmax(0,1fr)_23rem]">
              <div className="space-y-10">
                <ul className="space-y-4">
                  <li className="flex items-center gap-4 text-body-lg text-fg"><Users className="h-6 w-6" aria-hidden="true" />{COPY.EXPERIENCES.HOSTED_BY(e.host.name)}</li>
                  <li className="flex items-center gap-4 text-body-lg text-fg"><Clock className="h-6 w-6" aria-hidden="true" />{COPY.EXPERIENCES.DURATION(e.durationMin)}</li>
                  <li className="flex items-center gap-4 text-body-lg text-fg"><MapPin className="h-6 w-6" aria-hidden="true" />{e.meetingPoint}</li>
                </ul>
                <p className="text-body-lg text-fg">{e.description}</p>
                <section aria-labelledby="do-title">
                  <h2 id="do-title" className="mb-6 text-title-lg text-fg">{COPY.EXPERIENCES.WHAT_YOU_DO}</h2>
                  <ol className="space-y-6">
                    {e.steps.map((s, i) => (
                      <li key={s.title} className="flex gap-5">
                        <span className="grid h-16 w-16 shrink-0 place-items-center rounded-card bg-surface-muted text-title text-fg">{i + 1}</span>
                        <div>
                          <h3 className="text-label text-fg">{s.title}</h3>
                          <p className="text-body text-fg-muted">{s.body}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </section>
              </div>
              <aside>
                <div className="sticky top-28 rounded-overlay border border-line p-6 shadow-overlay">
                  <p className="text-title text-fg">
                    {COPY.EXPERIENCES.FROM(money(e.pricePerGuest))} <span className="text-body font-normal text-fg-muted">{COPY.EXPERIENCES.PER_GUEST}</span>
                  </p>
                  <h2 className="mb-3 mt-5 text-label text-fg">{COPY.EXPERIENCES.SLOTS}</h2>
                  {e.slots.length === 0 && <p className="text-body text-fg-muted">{COPY.EXPERIENCES.NO_SLOTS}</p>}
                  <ul className="space-y-2">
                    {e.slots.slice(0, showAll ? 60 : 5).map((s) => {
                      const l = slotLabel(s.startsAt, s.endsAt, today);
                      return (
                        <li key={s.id}>
                          <Button variant="outline" disabled={s.seatsLeft === 0} onClick={() => requireAuth(() => setSlot(s))} className="h-auto w-full flex-col items-start gap-0 py-3 text-left">
                            <span className="text-label text-fg">{l.day}</span>
                            <span className="text-body text-fg-muted">{l.time} · {COPY.EXPERIENCES.SEATS_LEFT(s.seatsLeft)}</span>
                          </Button>
                        </li>
                      );
                    })}
                  </ul>
                  {e.slots.length > 5 && (
                    <Button variant="ghost" className="mt-3 w-full" onClick={() => setShowAll((x) => !x)}>
                      {showAll ? COPY.EXPERIENCES.SHOW_FEWER : COPY.EXPERIENCES.SHOW_ALL_DATES}
                    </Button>
                  )}
                </div>
              </aside>
            </div>
            <hr className="my-10 border-line" />
            <Reviews rating={e.rating} count={e.reviewCount} reviews={e.reviews} />
            <hr className="my-10 border-line" />
            <section aria-labelledby="meet-title">
              <h2 id="meet-title" className="mb-2 text-title-lg text-fg">{COPY.EXPERIENCES.MEETING}</h2>
              <p className="mb-6 text-body-lg text-fg">{e.meetingPoint}</p>
              <MapView items={[e]} single label={COPY.EXPERIENCES.MEETING} className="h-80" />
            </section>
            <hr className="my-10 border-line" />
            <HostCard host={e.host} kind="experience" itemId={e.id} />
            <hr className="my-10 border-line" />
            <section aria-labelledby="exp-know">
              <h2 id="exp-know" className="mb-6 text-title-lg text-fg">{COPY.LISTING.THINGS_TO_KNOW}</h2>
              <div className="grid gap-8 md:grid-cols-3">
                {[[COPY.EXPERIENCES.REQUIREMENTS, e.guestRequirements], [COPY.EXPERIENCES.ACTIVITY, e.activityLevel], [COPY.EXPERIENCES.BRING, e.whatToBring], [COPY.EXPERIENCES.ACCESSIBILITY, COPY.EXPERIENCES.ACCESSIBILITY_BODY], [COPY.EXPERIENCES.CANCEL, COPY.EXPERIENCES.CANCEL_BODY]].filter(([, v]) => v).map(([k, v]) => (
                  <div key={k}>
                    <h3 className="mb-1 text-label text-fg">{k}</h3>
                    <p className="text-body text-fg-muted">{v}</p>
                  </div>
                ))}
              </div>
            </section>
            {e.more.length > 0 && (
              <Row title={COPY.EXPERIENCES.MORE_IN(e.city)}>
                {e.more.map((m) => <RowItem key={m.id}><ExperienceCard experience={m} /></RowItem>)}
              </Row>
            )}
            <BookActivityModal
              activity={e}
              open={!!slot}
              slot={slot}
              onClose={() => setSlot(null)}
              onBooked={() => {
                setSlot(null);
                notify(COPY.EXPERIENCES.BOOKED, "success");
                navigate("/trips");
              }}
            />
          </>
        )}
      </PageState>
    </div>
  );
}
