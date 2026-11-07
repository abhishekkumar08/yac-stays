import { Award, Star } from "lucide-react";
import { COPY } from "@/copy.js";
import { MessageHostButton } from "@/components/MessageHost.jsx";
import { UserAvatar } from "@/components/UserAvatar.jsx";
import { rating, yearsSince } from "@/lib/format.js";

export function HostCard({ host, kind, itemId }) {
  const years = COPY.LISTING.YEARS_HOSTING(yearsSince(host.joined));
  return (
    <section aria-labelledby="host-title">
      <h2 id="host-title" className="text-title-lg text-fg">{COPY.LISTING.MEET_HOST}</h2>
      <div className="mt-6 grid gap-8 md:grid-cols-[20rem_1fr]">
        <div className="flex items-center gap-6 rounded-overlay bg-surface p-6 shadow-overlay">
          <div className="text-center">
            <UserAvatar name={host.name} hue={host.avatarHue} size="xl" />
            <p className="mt-2 text-title text-fg">{host.name}</p>
            {host.superhost && (
              <p className="flex items-center justify-center gap-1 text-caption text-fg-muted">
                <Award className="h-3.5 w-3.5" aria-hidden="true" /> {COPY.CARD.SUPERHOST}
              </p>
            )}
          </div>
          <ul className="divide-y divide-line text-caption text-fg-muted">
            {host.reviewCount != null && <li className="py-2"><strong className="block text-title text-fg">{host.reviewCount}</strong>{COPY.LISTING.REVIEWS(host.reviewCount)}</li>}
            {host.rating && <li className="flex flex-col py-2"><strong className="flex items-center gap-1 text-title text-fg">{rating(host.rating)}<Star className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true" /></strong></li>}
            <li className="py-2">{years}</li>
          </ul>
        </div>
        <div className="space-y-4">
          {host.city && <p className="text-body-lg text-fg">{host.city}</p>}
          {host.about && <p className="text-body-lg text-fg-muted">{host.about}</p>}
          <MessageHostButton kind={kind} itemId={itemId} hostName={host.name} />
        </div>
      </div>
    </section>
  );
}
