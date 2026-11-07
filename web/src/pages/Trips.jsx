import { useState } from "react";
import { Link } from "react-router-dom";
import { Badge, Button, Card, EmptyState, InlineConfirm, Tabs, useNotifications } from "@kasumi/ui";
import { Luggage } from "lucide-react";
import { COPY } from "@/copy.js";
import { listingName } from "@/components/ListingCard.jsx";
import { PageState } from "@/components/PageState.jsx";
import { ReviewModal } from "@/components/ReviewModal.jsx";
import { api } from "@/lib/api.js";
import { useSignedIn } from "@/lib/auth.jsx";
import { dateRange, money, photoUrl, slotLabel } from "@/lib/format.js";
import { useApi } from "@/lib/useApi.js";

const TONE = { requested: "warning", upcoming: "success", current: "info", past: "neutral", cancelled: "error" };

function statusText(b) {
  return b.phase === "cancelled" ? COPY.TRIPS.STATUS[b.status] : COPY.TRIPS.STATUS[b.phase];
}

function StayRow({ b, onChanged, onReview }) {
  const { notify } = useNotifications();

  async function cancel() {
    try {
      await api.post(`/api/bookings/${b.id}/cancel`);
      notify(COPY.TRIPS.CANCELLED_TOAST, "success");
      onChanged();
    } catch {
      notify(COPY.COMMON.ERROR, "error");
    }
  }

  return (
    <Card padding="none" className="flex flex-col overflow-hidden sm:flex-row">
      <Link to={`/rooms/${b.listing_id}`} className="sm:w-56">
        <img src={photoUrl(b.listing.photos[0])} alt="" className="h-40 w-full object-cover sm:h-full" />
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={TONE[b.phase]}>{statusText(b)}</Badge>
          <span className="text-caption text-fg-muted">{COPY.TRIPS.GUESTS_COUNT(b.guests)}</span>
        </div>
        <Link to={`/rooms/${b.listing_id}`} className="text-title text-fg hover:underline">{b.listing.title}</Link>
        <p className="text-body text-fg-muted">{listingName(b.listing)} · {dateRange(b.check_in, b.check_out)}</p>
        <p className="text-body text-fg">{money(b.total)}{b.refund > 0 && <span className="ml-2 text-fg-muted">{COPY.TRIPS.REFUND(money(b.refund))}</span>}</p>
        <div className="mt-auto flex flex-wrap gap-2 pt-2">
          {b.refundPreview != null && (
            <InlineConfirm question={COPY.TRIPS.CANCEL_Q(money(b.refundPreview))} onConfirm={cancel} variant="outline" size="sm" confirmVariant="destructive">
              {COPY.TRIPS.CANCEL}
            </InlineConfirm>
          )}
          {b.canReview && <Button size="sm" variant="primary" onClick={() => onReview({ kind: "listing", bookingId: b.id, title: b.listing.title })}>{COPY.TRIPS.REVIEW}</Button>}
        </div>
      </div>
    </Card>
  );
}

function ExperienceRow({ e, today, onChanged, onReview }) {
  const { notify } = useNotifications();
  const past = e.ends_at.slice(0, 10) < today;
  const slot = slotLabel(e.starts_at, e.ends_at, today);
  const href = `/${e.kind === "service" ? "services" : "experiences"}/${e.experience_id}`;
  async function cancel() {
    try {
      await api.post(`/api/experience-bookings/${e.id}/cancel`);
      notify(COPY.TRIPS.CANCELLED_TOAST, "success");
      onChanged();
    } catch {
      notify(COPY.COMMON.ERROR, "error");
    }
  }
  return (
    <Card padding="none" className="flex overflow-hidden">
      <Link to={href} className="w-32 shrink-0">
        {e.photo && <img src={photoUrl(e.photo)} alt="" className="h-full w-full object-cover" />}
      </Link>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <Badge tone={e.status === "cancelled" ? "error" : past ? "neutral" : "success"} className="self-start">
          {e.status === "cancelled" ? COPY.TRIPS.STATUS.cancelled : past ? COPY.TRIPS.STATUS.past : COPY.TRIPS.STATUS.upcoming}
        </Badge>
        <Link to={href} className="text-label text-fg hover:underline">{e.offering_title ? `${e.title} · ${e.offering_title}` : e.title}</Link>
        <p className="text-body text-fg-muted">{slot.day} · {slot.time} · {COPY.TRIPS.GUESTS_COUNT(e.guests)}</p>
        <div className="mt-2 flex gap-2">
          {e.status === "confirmed" && !past && (
            <InlineConfirm question={COPY.TRIPS.CANCEL_Q(money(e.total))} onConfirm={cancel} variant="outline" size="sm" confirmVariant="destructive">{COPY.TRIPS.CANCEL}</InlineConfirm>
          )}
          {e.status === "confirmed" && past && !e.reviewed && (
            <Button size="sm" variant="primary" onClick={() => onReview({ kind: "experience", bookingId: e.id, title: e.title })}>{COPY.TRIPS.REVIEW}</Button>
          )}
        </div>
      </div>
    </Card>
  );
}

export function Trips() {
  const user = useSignedIn();
  const { data, loading, error, reload } = useApi(user ? "/api/trips" : null);
  const [review, setReview] = useState(null);

  const group = (phases) => data?.stays.filter((b) => phases.includes(b.phase)) ?? [];
  const list = (items) =>
    items.length ? (
      <div className="grid gap-4 lg:grid-cols-2">{items.map((b) => <StayRow key={b.id} b={b} onChanged={reload} onReview={setReview} />)}</div>
    ) : (
      <EmptyState icon={Luggage} title={COPY.TRIPS.NONE_TITLE} description={COPY.TRIPS.NONE_BODY} action={<Button as={Link} to="/" variant="primary">{COPY.TRIPS.START}</Button>} />
    );

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="mb-8 text-headline text-fg">{COPY.TRIPS.TITLE}</h1>
      <PageState loading={loading || user === undefined} error={error} onRetry={reload}>
        {data && (
          <>
            <Tabs
              variant="underline"
              tabs={[
                { id: "upcoming", label: COPY.TRIPS.UPCOMING, content: list(group(["requested", "upcoming", "current"]).reverse()) },
                { id: "past", label: COPY.TRIPS.PAST, content: list(group(["past"])) },
                { id: "cancelled", label: COPY.TRIPS.CANCELLED, content: list(group(["cancelled"])) },
              ]}
            />
            {data.experiences.length > 0 && (
              <section className="mt-12">
                <h2 className="mb-4 text-title-lg text-fg">{COPY.TRIPS.EXPERIENCES}</h2>
                <div className="grid gap-4 lg:grid-cols-2">
                  {data.experiences.map((e) => <ExperienceRow key={e.id} e={e} today={data.today} onChanged={reload} onReview={setReview} />)}
                </div>
              </section>
            )}
          </>
        )}
      </PageState>
      <ReviewModal target={review} onClose={() => setReview(null)} onDone={() => { setReview(null); reload(); }} />
    </div>
  );
}
