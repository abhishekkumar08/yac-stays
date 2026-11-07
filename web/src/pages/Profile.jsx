import { Link, useParams } from "react-router-dom";
import { Button, Card } from "@kasumi/ui";
import { Award, Briefcase, Globe2, Home as HomeIcon, Star } from "lucide-react";
import { COPY } from "@/copy.js";
import { ListingCard } from "@/components/ListingCard.jsx";
import { PageState } from "@/components/PageState.jsx";
import { Row, RowItem } from "@/components/Row.jsx";
import { UserAvatar } from "@/components/UserAvatar.jsx";
import { useAuth } from "@/lib/auth.jsx";
import { rating, shortDate, yearsSince } from "@/lib/format.js";
import { useApi } from "@/lib/useApi.js";

export function Profile() {
  const { id } = useParams();
  const { user } = useAuth();
  const { data: p, loading, error, reload } = useApi(`/api/users/${id}`);
  const first = p?.name.split(" ")[0];

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <PageState loading={loading} error={error} onRetry={reload}>
        {p && (
          <div className="grid gap-12 lg:grid-cols-[22rem_minmax(0,1fr)]">
            <aside className="space-y-6">
              <Card padding="md" className="grid grid-cols-[1fr_auto] items-center gap-6 shadow-overlay">
                <div className="text-center">
                  <UserAvatar name={p.name} hue={p.avatarHue} size="xl" />
                  <h1 className="mt-3 text-title-lg text-fg">{first}</h1>
                  <p className="flex items-center justify-center gap-1 text-caption text-fg-muted">
                    {p.superhost && <Award className="h-3.5 w-3.5" aria-hidden="true" />}
                    {p.superhost ? COPY.CARD.SUPERHOST : p.isHost ? COPY.NAV.HOSTING : COPY.PROFILE.GUEST}
                  </p>
                </div>
                <dl className="divide-y divide-line text-caption text-fg-muted">
                  <div className="py-2"><dt className="sr-only">{COPY.PROFILE.REVIEWS}</dt><dd><strong className="block text-title text-fg">{p.reviewCount}</strong>{COPY.PROFILE.REVIEWS}</dd></div>
                  {p.rating && <div className="py-2"><dt className="sr-only">{COPY.PROFILE.RATING}</dt><dd><strong className="flex items-center gap-1 text-title text-fg">{rating(p.rating)}<Star className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true" /></strong>{COPY.PROFILE.RATING}</dd></div>}
                  <div className="py-2"><dt className="sr-only">{COPY.PROFILE.YEARS}</dt><dd><strong className="block text-title text-fg">{yearsSince(p.joined)}</strong>{COPY.PROFILE.YEARS}</dd></div>
                </dl>
              </Card>
              {user?.id === p.id && <Button as={Link} to="/account" variant="outline" className="w-full">{COPY.PROFILE.EDIT}</Button>}
            </aside>
            <div className="space-y-10">
              <section>
                <h2 className="mb-4 text-headline text-fg">{COPY.PROFILE.ABOUT(first)}</h2>
                <ul className="space-y-3 text-body-lg text-fg">
                  {p.work && <li className="flex items-center gap-3"><Briefcase className="h-5 w-5" aria-hidden="true" />{COPY.PROFILE.WORK(p.work)}</li>}
                  <li className="flex items-center gap-3"><Globe2 className="h-5 w-5" aria-hidden="true" />{COPY.PROFILE.SPEAKS(p.languages.join(", "))}</li>
                  {p.city && <li className="flex items-center gap-3"><HomeIcon className="h-5 w-5" aria-hidden="true" />{COPY.PROFILE.LIVES(p.city)}</li>}
                </ul>
                {p.about && <p className="mt-6 text-body-lg text-fg">{p.about}</p>}
              </section>
              {p.reviews.length > 0 && (
                <Row title={COPY.PROFILE.REVIEWS_ABOUT(first)}>
                  {p.reviews.map((r) => (
                    <RowItem key={r.id}>
                      <Card padding="md" className="h-full">
                        <p className="line-clamp-5 text-body text-fg">{r.body}</p>
                        <div className="mt-4 flex items-center gap-3">
                          <UserAvatar name={r.author} hue={r.avatarHue} size="sm" />
                          <div>
                            <Link to={`/users/${r.authorId}`} className="text-label text-fg hover:underline">{r.author}</Link>
                            <p className="text-caption text-fg-muted">{shortDate(r.createdAt)}</p>
                          </div>
                        </div>
                      </Card>
                    </RowItem>
                  ))}
                </Row>
              )}
              {p.listings.length > 0 && (
                <Row title={COPY.PROFILE.LISTINGS(first)}>
                  {p.listings.map((l) => (
                    <RowItem key={l.id}>
                      <ListingCard listing={l} compact />
                    </RowItem>
                  ))}
                </Row>
              )}
            </div>
          </div>
        )}
      </PageState>
    </div>
  );
}
