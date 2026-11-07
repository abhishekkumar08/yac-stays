import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button, Chip, Input, Modal, Progress, Select } from "@kasumi/ui";
import { Search, Star } from "lucide-react";
import { COPY } from "@/copy.js";
import { Laurel } from "@/brand/Laurel.jsx";
import { UserAvatar } from "@/components/UserAvatar.jsx";
import { rating, shortDate } from "@/lib/format.js";

function ReviewCard({ r }) {
  return (
    <article>
      <div className="flex items-center gap-3">
        <UserAvatar name={r.author} hue={r.avatarHue} />
        <div>
          {r.authorId ? <Link to={`/users/${r.authorId}`} className="text-label text-fg hover:underline">{r.author}</Link> : <p className="text-label text-fg">{r.author}</p>}
          {r.authorCity && <p className="text-caption text-fg-muted">{r.authorCity}</p>}
        </div>
      </div>
      <p className="mt-2 flex items-center gap-1 text-caption text-fg-muted">
        {Array.from({ length: r.overall }, (_, i) => (
          <Star key={i} className="h-3 w-3 text-fg" fill="currentColor" aria-hidden="true" />
        ))}
        <span className="sr-only">{COPY.REVIEW.STARS(r.overall)}</span>
        <span className="ml-1">· {shortDate(r.createdAt)}</span>
      </p>
      <p className="mt-2 text-body-lg text-fg">{r.body}</p>
    </article>
  );
}

function Distribution({ distribution, count }) {
  return (
    <div>
      <p className="mb-2 text-label text-fg">{COPY.LISTING.RATING_BARS}</p>
      <ul className="space-y-1">
        {distribution.map((n, i) => (
          <li key={i} className="flex items-center gap-3 text-caption text-fg-muted">
            <span className="w-2">{5 - i}</span>
            <Progress value={count ? (n / count) * 100 : 0} showValue={false} className="flex-1" aria-label={COPY.LISTING.STARS_ROW(5 - i)} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function ReviewsDialog({ open, onClose, avg, count, distribution, scores, reviews }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("recent");
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = reviews.filter((r) => !q || r.body.toLowerCase().includes(q));
    if (sort === "highest") return [...list].sort((a, b) => b.overall - a.overall);
    if (sort === "lowest") return [...list].sort((a, b) => a.overall - b.overall);
    return list;
  }, [reviews, query, sort]);
  return (
    <Modal open={open} onClose={onClose} title={COPY.LISTING.REVIEWS_HEADING(rating(avg), count)} size="xl">
      <div className="grid gap-10 md:grid-cols-[16rem_1fr]">
        <div className="space-y-6">
          {distribution && <Distribution distribution={distribution} count={count} />}
          {scores && (
            <dl className="divide-y divide-line">
              {Object.entries(scores).filter(([, v]) => v != null).map(([k, v]) => (
                <div key={k} className="flex justify-between py-3 text-body">
                  <dt className="text-fg">{COPY.LISTING.SCORES[k]}</dt>
                  <dd className="text-fg">{v.toFixed(1)}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
        <div>
          <div className="mb-6 flex flex-wrap gap-3">
            <Input aria-label={COPY.LISTING.REVIEWS_SEARCH} placeholder={COPY.LISTING.REVIEWS_SEARCH} leading={<Search className="h-4 w-4" />} value={query} onChange={(e) => setQuery(e.target.value)} containerClassName="flex-1" />
            <Select aria-label={COPY.LISTING.REVIEWS_SORT} value={sort} onChange={(e) => setSort(e.target.value)} containerClassName="w-44">
              {Object.entries(COPY.LISTING.SORTS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </Select>
          </div>
          {shown.length === 0 ? <p className="text-body text-fg-muted">{COPY.LISTING.NO_MATCH}</p> : <div className="space-y-8">{shown.map((r) => <ReviewCard key={r.id} r={r} />)}</div>}
        </div>
      </div>
    </Modal>
  );
}

export function Reviews({ rating: avg, count, scores, tags, reviews, distribution, guestFavourite = false }) {
  const [all, setAll] = useState(false);
  if (!count) return <p className="text-body-lg text-fg-muted">{COPY.LISTING.NEW_LISTING}</p>;
  return (
    <section id="reviews" aria-labelledby="reviews-title">
      {guestFavourite ? (
        <div className="mb-10 text-center">
          <p className="flex items-center justify-center gap-2 text-fg">
            <Laurel className="h-24 w-12" />
            <span className="text-[4.5rem] font-semibold leading-none">{rating(avg)}</span>
            <Laurel flip className="h-24 w-12" />
          </p>
          <h2 id="reviews-title" className="mt-2 text-title-lg text-fg">{COPY.LISTING.FAVOURITE_TITLE}</h2>
          <p className="text-body-lg text-fg-muted">{COPY.LISTING.FAVOURITE_BODY(COPY.BRAND)}</p>
        </div>
      ) : (
        <h2 id="reviews-title" className="flex items-center gap-2 text-title-lg text-fg">
          <Star className="h-5 w-5" fill="currentColor" aria-hidden="true" />
          {COPY.LISTING.REVIEWS_HEADING(rating(avg), count)}
        </h2>
      )}
      {(scores || distribution) && (
        <div className="mt-6 grid gap-x-8 gap-y-4 border-b border-line pb-8 sm:grid-cols-3 lg:grid-cols-7">
          {distribution && <div className="sm:col-span-3 lg:col-span-1"><Distribution distribution={distribution} count={count} /></div>}
          {scores && Object.entries(scores).filter(([, v]) => v != null).map(([k, v]) => (
            <div key={k} className="lg:border-l lg:border-line lg:pl-4">
              <p className="text-label text-fg">{COPY.LISTING.SCORES[k]}</p>
              <p className="text-title text-fg">{v.toFixed(1)}</p>
            </div>
          ))}
        </div>
      )}
      {tags?.length > 0 && (
        <div className="mt-6" role="group" aria-label={COPY.LISTING.MENTIONS}>
          <p className="mb-2 text-label text-fg">{COPY.LISTING.MENTIONS}</p>
          <div className="flex flex-wrap gap-2">
            {tags.map((t) => (
              <Chip key={t}>{t}</Chip>
            ))}
          </div>
        </div>
      )}
      <div className="mt-8 grid gap-10 md:grid-cols-2">
        {reviews.slice(0, 6).map((r) => (
          <ReviewCard key={r.id} r={r} />
        ))}
      </div>
      {reviews.length > 0 && (
        <Button variant="outline" className="mt-8" onClick={() => setAll(true)}>
          {COPY.LISTING.SHOW_ALL_REVIEWS(reviews.length)}
        </Button>
      )}
      <ReviewsDialog open={all} onClose={() => setAll(false)} avg={avg} count={count} distribution={distribution} scores={scores} reviews={reviews} />
    </section>
  );
}
