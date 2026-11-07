import { Link, useNavigate, useParams } from "react-router-dom";
import { Button, EmptyState, InlineConfirm, useNotifications } from "@kasumi/ui";
import { Heart } from "lucide-react";
import { COPY } from "@/copy.js";
import { ExperienceCard } from "@/components/ExperienceCard.jsx";
import { ListingCard } from "@/components/ListingCard.jsx";
import { PageState } from "@/components/PageState.jsx";
import { api } from "@/lib/api.js";
import { useSignedIn } from "@/lib/auth.jsx";
import { photoUrl } from "@/lib/format.js";
import { useSaved } from "@/lib/saved.jsx";
import { useApi } from "@/lib/useApi.js";

export function Wishlists() {
  const user = useSignedIn();
  const { data, loading, error, reload } = useApi(user ? "/api/wishlists" : null);
  const recent = useApi(user ? "/api/wishlists/recent" : null);
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="mb-8 text-headline text-fg">{COPY.WISHLIST.TITLE}</h1>
      <PageState loading={loading || user === undefined} error={error} onRetry={reload}>
        {data?.length === 0 && <EmptyState icon={Heart} title={COPY.WISHLIST.EMPTY_TITLE} description={COPY.WISHLIST.EMPTY_BODY} action={<Button as={Link} to="/" variant="primary">{COPY.WISHLIST.START_SEARCHING}</Button>} />}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {recent.data?.length > 0 && (
            <Link to="/wishlists/recent" className="rounded-overlay focus-ring">
              <div className="grid aspect-square grid-cols-2 grid-rows-2 gap-0.5 overflow-hidden rounded-overlay bg-surface-muted shadow-raised">
                {recent.data.slice(0, 4).map((l) => <img key={l.id} src={photoUrl(l.photos[0])} alt="" className="h-full w-full object-cover" />)}
              </div>
              <p className="mt-3 text-label text-fg">{COPY.WISHLIST.RECENT}</p>
              <p className="text-body text-fg-muted">{COPY.WISHLIST.SAVED_COUNT(recent.data.length)}</p>
            </Link>
          )}
          {data?.map((w) => (
            <Link key={w.id} to={`/wishlists/${w.id}`} className="rounded-overlay focus-ring">
              <div className="aspect-square overflow-hidden rounded-overlay bg-surface-muted shadow-raised">
                {w.cover && <img src={photoUrl(w.cover)} alt="" className="h-full w-full object-cover" />}
              </div>
              <p className="mt-3 text-label text-fg">{w.name}</p>
              <p className="text-body text-fg-muted">{COPY.WISHLIST.SAVED_COUNT(w.count)}</p>
            </Link>
          ))}
        </div>
      </PageState>
    </div>
  );
}

function RecentlyViewed() {
  const user = useSignedIn();
  const { data, loading, error, reload } = useApi(user ? "/api/wishlists/recent" : null);
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="mb-8 text-headline text-fg">{COPY.WISHLIST.RECENT}</h1>
      <PageState loading={loading || user === undefined} error={error} onRetry={reload}>
        {data?.length === 0 && <EmptyState icon={Heart} title={COPY.WISHLIST.RECENT} description={COPY.WISHLIST.RECENT_EMPTY} />}
        <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">{data?.map((l) => <ListingCard key={l.id} listing={l} />)}</div>
      </PageState>
    </div>
  );
}

export function Wishlist() {
  const { id } = useParams();
  return id === "recent" ? <RecentlyViewed /> : <SavedWishlist id={id} />;
}

function SavedWishlist({ id }) {
  const user = useSignedIn();
  const navigate = useNavigate();
  const { notify } = useNotifications();
  const { reload: reloadSaved } = useSaved();
  const { data, loading, error, reload } = useApi(user ? `/api/wishlists/${id}` : null);

  async function remove() {
    try {
      await api.del(`/api/wishlists/${id}`);
      reloadSaved();
      navigate("/wishlists");
    } catch {
      notify(COPY.COMMON.ERROR, "error");
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <PageState loading={loading || user === undefined} error={error} onRetry={reload}>
        {data && (
          <>
            <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
              <h1 className="text-headline text-fg">{data.name}</h1>
              <InlineConfirm question={COPY.WISHLIST.DELETE_CONFIRM} onConfirm={remove} variant="ghost" confirmVariant="destructive" size="sm">
                {COPY.WISHLIST.DELETE}
              </InlineConfirm>
            </div>
            {data.items.length === 0 ? (
              <EmptyState icon={Heart} title={COPY.WISHLIST.EMPTY_LIST} description={COPY.WISHLIST.EMPTY_LIST_BODY} />
            ) : (
              <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
                {data.items.map((i) => (i.kind === "listing" ? <ListingCard key={`l${i.id}`} listing={i} /> : <ExperienceCard key={`e${i.id}`} experience={i} />))}
              </div>
            )}
          </>
        )}
      </PageState>
    </div>
  );
}
