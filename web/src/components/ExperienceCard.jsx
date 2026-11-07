import { Link } from "react-router-dom";
import { COPY } from "@/copy.js";
import { HeartButton } from "@/components/HeartButton.jsx";
import { RatingInline } from "@/components/Stars.jsx";
import { money, photoUrl } from "@/lib/format.js";

export function ExperienceCard({ experience: e }) {
  return (
    <article className="relative">
      <Link to={`/${e.kind === "service" ? "services" : "experiences"}/${e.id}`} className="block rounded-overlay focus-ring">
        <div className="aspect-[3/4] overflow-hidden rounded-overlay bg-surface-muted">
          {e.photos[0] && <img src={photoUrl(e.photos[0])} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-slow hover:scale-[1.03]" />}
        </div>
        <h3 className="mt-3 line-clamp-2 text-label text-fg">{e.title}</h3>
        <p className="text-body text-fg-muted">
          {COPY.CARD.FROM_PER_GUEST(money(e.pricePerGuest))} · <RatingInline value={e.rating} count={e.reviewCount} showCount={false} className="text-fg-muted" />
        </p>
      </Link>
      <HeartButton kind="experience" id={e.id} title={e.title} className="absolute right-2 top-2" />
      {e.reviewCount >= 20 && e.rating >= 4.9 && <span className="pointer-events-none absolute left-3 top-3 rounded-pill bg-surface px-3 py-1 text-caption font-semibold text-fg shadow-raised">{COPY.CARD.POPULAR}</span>}
    </article>
  );
}
