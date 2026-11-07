import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Alert, Button, RadioGroup, Textarea, useNotifications } from "@kasumi/ui";
import { ChevronLeft } from "lucide-react";
import { COPY } from "@/copy.js";
import { listingName } from "@/components/ListingCard.jsx";
import { PageState } from "@/components/PageState.jsx";
import { PriceBreakdown } from "@/components/PriceBreakdown.jsx";
import { RatingInline } from "@/components/Stars.jsx";
import { api, ApiError, errorText } from "@/lib/api.js";
import { useAuth, useSignedIn } from "@/lib/auth.jsx";
import { cancellationText, dateRange, photoUrl } from "@/lib/format.js";
import { PAY_OPTIONS } from "@/lib/payments.js";
import { stayQuery, useListingStay } from "@/lib/stay.js";

export function Book() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { requireAuth } = useAuth();
  const user = useSignedIn();
  const { notify } = useNotifications();
  const { detail, avail, listing: l, availability, stay, quote, error } = useListingStay(id);
  const [paidWith, setPaidWith] = useState("mock_card");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const backTo = `/rooms/${id}${stayQuery(stay)}`;
  const isRequest = l && !l.instantBook;

  async function submit(e) {
    e.preventDefault();
    if (!user) return requireAuth();
    setBusy(true);
    setSubmitError(null);
    try {
      const b = await api.post("/api/bookings", {
        listingId: Number(id), checkIn: stay.checkIn, checkOut: stay.checkOut, guests: stay.adults + stay.children, paidWith, message: message.trim() || undefined,
      });
      notify(b.status === "pending" ? COPY.CHECKOUT.REQUESTED : COPY.CHECKOUT.BOOKED, "success");
      navigate("/trips");
    } catch (err) {
      setSubmitError(errorText(err));
      if (err instanceof ApiError && err.code === "unavailable") avail.reload();
    } finally {
      setBusy(false);
    }
    return undefined;
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <PageState loading={detail.loading || avail.loading} error={detail.error ?? avail.error} onRetry={detail.reload}>
        {l && availability && (
          <>
            <div className="mb-10 flex items-center gap-4">
              <Button as={Link} to={backTo} variant="ghost" size="icon" aria-label={COPY.CHECKOUT.BACK} className="rounded-pill"><ChevronLeft className="h-5 w-5" aria-hidden="true" /></Button>
              <h1 className="text-headline text-fg">{isRequest ? COPY.CHECKOUT.TITLE_REQUEST : COPY.CHECKOUT.TITLE_CONFIRM}</h1>
            </div>
            <div className="grid gap-16 lg:grid-cols-[minmax(0,1fr)_28rem]">
              <form onSubmit={submit} className="space-y-8">
                <section>
                  <h2 className="mb-4 text-title-lg text-fg">{COPY.CHECKOUT.YOUR_TRIP}</h2>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-label text-fg">{COPY.CHECKOUT.DATES}</p>
                      <p className="text-body text-fg-muted">{stay.checkIn && stay.checkOut ? dateRange(stay.checkIn, stay.checkOut) : COPY.SEARCH.ADD_DATES}</p>
                    </div>
                    <Button as={Link} to={backTo} variant="link" className="font-semibold underline">{COPY.CHECKOUT.EDIT}</Button>
                  </div>
                  <div className="mt-4 flex items-start justify-between">
                    <div>
                      <p className="text-label text-fg">{COPY.BOOKING.GUESTS}</p>
                      <p className="text-body text-fg-muted">{COPY.SEARCH.GUESTS(stay.adults + stay.children)}</p>
                    </div>
                    <Button as={Link} to={backTo} variant="link" className="font-semibold underline">{COPY.CHECKOUT.EDIT}</Button>
                  </div>
                  {error && error !== "invalid_dates" && <Alert tone="error" className="mt-4">{COPY.BOOKING.ERRORS[error]}</Alert>}
                </section>
                <hr className="border-line" />
                <section>
                  <h2 className="mb-4 text-title-lg text-fg">{COPY.CHECKOUT.PAY_WITH}</h2>
                  <RadioGroup name="paidWith" options={PAY_OPTIONS} value={paidWith} onChange={setPaidWith} />
                  <Alert tone="info" variant="inline" className="mt-3">{COPY.CHECKOUT.MOCK_NOTE}</Alert>
                </section>
                <hr className="border-line" />
                <section>
                  <h2 className="mb-2 text-title-lg text-fg">{COPY.CHECKOUT.MESSAGE_HOST}</h2>
                  <p className="mb-4 text-body text-fg-muted">{COPY.CHECKOUT.MESSAGE_HINT}</p>
                  <Textarea aria-label={COPY.CHECKOUT.MESSAGE_HOST} rows={4} maxLength={2000} required={isRequest} value={message} onChange={(e) => setMessage(e.target.value)} hint={isRequest ? COPY.CHECKOUT.REQUIRED_MESSAGE : undefined} />
                </section>
                <hr className="border-line" />
                <section>
                  <h2 className="mb-2 text-title-lg text-fg">{COPY.CHECKOUT.CANCELLATION}</h2>
                  <p className="text-body text-fg-muted">
                    {cancellationText(l.cancellationPolicy, stay.checkIn)}
                  </p>
                </section>
                <section>
                  <h2 className="mb-2 text-title-lg text-fg">{COPY.CHECKOUT.GROUND_RULES}</h2>
                  <p className="text-body text-fg-muted">{COPY.CHECKOUT.GROUND_RULES_BODY}</p>
                </section>
                {isRequest && <Alert tone="neutral">{COPY.CHECKOUT.REQUEST_NOTE}</Alert>}
                {submitError && <Alert tone="error">{submitError}</Alert>}
                <Button type="submit" variant="primary" size="lg" loading={busy} disabled={!quote || busy}>
                  {isRequest ? COPY.BOOKING.REQUEST : COPY.CHECKOUT.CONFIRM}
                </Button>
              </form>
              <aside>
                <div className="sticky top-28 rounded-overlay border border-line p-6">
                  <div className="flex gap-4">
                    <img src={photoUrl(l.photos[0])} alt="" className="h-24 w-28 rounded-card object-cover" />
                    <div>
                      <p className="text-label text-fg">{l.title}</p>
                      <p className="text-body text-fg-muted">{listingName(l)}</p>
                      <RatingInline value={l.rating} count={l.reviewCount} className="mt-1 text-caption" />
                    </div>
                  </div>
                  <hr className="my-6 border-line" />
                  <h2 className="mb-4 text-title text-fg">{COPY.CHECKOUT.PRICE_DETAILS}</h2>
                  {quote ? <PriceBreakdown quote={quote} /> : <p className="text-body text-fg-muted">{COPY.LISTING.ADD_DATES_FOR_PRICES}</p>}
                </div>
              </aside>
            </div>
          </>
        )}
      </PageState>
    </div>
  );
}
