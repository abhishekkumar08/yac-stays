import { Star } from "lucide-react";
import { COPY } from "@/copy.js";
import { rating } from "@/lib/format.js";

export function RatingInline({ value, count, showCount = true, className = "" }) {
  if (value == null) return <span className={`text-body text-fg ${className}`}>{COPY.CARD.NEW}</span>;
  return (
    <span className={`inline-flex items-center gap-1 text-body text-fg ${className}`} aria-label={COPY.CARD.RATING(rating(value), count)}>
      <Star className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true" />
      <span aria-hidden="true">
        {rating(value)}
        {showCount && ` (${count})`}
      </span>
    </span>
  );
}
