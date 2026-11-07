import { useState } from "react";
import { Link } from "react-router-dom";
import { IconButton } from "@kasumi/ui";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { COPY } from "@/copy.js";
import { photoUrl } from "@/lib/format.js";

export function PhotoCarousel({ photos, title, href, className = "" }) {
  const [i, setI] = useState(0);
  const n = photos.length;
  const go = (d) => (e) => {
    e.preventDefault();
    setI((x) => Math.min(n - 1, Math.max(0, x + d)));
  };
  return (
    <div className={`group relative overflow-hidden rounded-overlay bg-surface-muted ${className}`}>
      <Link to={href} tabIndex={-1} aria-hidden="true" className="flex h-full transition-transform duration-slow ease-standard" style={{ transform: `translateX(-${i * 100}%)` }}>
        {photos.map((p) => (
          <img key={p} src={photoUrl(p)} alt="" loading="lazy" className="h-full w-full shrink-0 object-cover" />
        ))}
      </Link>
      {i > 0 && (
        <IconButton icon={ChevronLeft} size="xs" label={COPY.CARD.PREV_PHOTO(title)} onClick={go(-1)} className="absolute left-3 top-1/2 -translate-y-1/2 rounded-pill bg-surface/90 opacity-0 shadow-raised group-hover:opacity-100 focus-visible:opacity-100" />
      )}
      {i < n - 1 && (
        <IconButton icon={ChevronRight} size="xs" label={COPY.CARD.NEXT_PHOTO(title)} onClick={go(1)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-pill bg-surface/90 opacity-0 shadow-raised group-hover:opacity-100 focus-visible:opacity-100" />
      )}
      {n > 1 && (
        <div className="pointer-events-none absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5" aria-hidden="true">
          {photos.slice(0, 5).map((p, idx) => (
            <span key={p} className={`h-1.5 w-1.5 rounded-pill bg-white ${idx === Math.min(i, 4) ? "opacity-100" : "opacity-60"}`} />
          ))}
        </div>
      )}
    </div>
  );
}
