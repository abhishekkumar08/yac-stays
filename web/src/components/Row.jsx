import { useRef } from "react";
import { Link } from "react-router-dom";
import { IconButton } from "@kasumi/ui";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { COPY } from "@/copy.js";

export function Row({ title, to, seeAllLabel, children }) {
  const ref = useRef(null);
  const scroll = (dir) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.9, behavior: "smooth" });
  return (
    <section className="mt-10">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="flex items-center gap-2 text-title-lg text-fg">
          {to ? (
            <Link to={to} className="inline-flex items-center gap-2 rounded-control focus-ring hover:underline" aria-label={seeAllLabel}>
              {title}
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Link>
          ) : (
            title
          )}
        </h2>
        <div className="hidden gap-2 sm:flex">
          <IconButton icon={ChevronLeft} label={COPY.HOME.PREVIOUS} variant="secondary" size="sm" className="rounded-pill" onClick={() => scroll(-1)} />
          <IconButton icon={ChevronRight} label={COPY.HOME.NEXT} variant="secondary" size="sm" className="rounded-pill" onClick={() => scroll(1)} />
        </div>
      </div>
      <div ref={ref} className="ys-no-scrollbar -mx-2 flex snap-x gap-4 overflow-x-auto px-2 pb-2">
        {children}
      </div>
    </section>
  );
}

export function RowItem({ children }) {
  return <div className="w-[70%] shrink-0 snap-start sm:w-[42%] md:w-[30%] lg:w-[calc((100%-5*1rem)/6)]">{children}</div>;
}
