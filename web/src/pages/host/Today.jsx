import { Link } from "react-router-dom";
import { Button, Card, useNotifications } from "@kasumi/ui";
import { COPY } from "@/copy.js";
import { PageState } from "@/components/PageState.jsx";
import { UserAvatar } from "@/components/UserAvatar.jsx";
import { api, errorText } from "@/lib/api.js";
import { useAuth } from "@/lib/auth.jsx";
import { dateRange, money } from "@/lib/format.js";
import { useApi } from "@/lib/useApi.js";

function StayList({ title, items }) {
  return (
    <section>
      <h2 className="mb-3 text-title text-fg">{title}</h2>
      {items.length === 0 ? (
        <p className="text-body text-fg-muted">{COPY.HOST.NOTHING}</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((b) => (
            <li key={b.id}>
              <Card padding="sm" className="flex items-center gap-3">
                <UserAvatar name={b.guest_name} hue={b.guest_hue} />
                <div className="min-w-0">
                  <p className="truncate text-label text-fg">{b.guest_name}</p>
                  <p className="truncate text-caption text-fg-muted">{b.listing_title} · {dateRange(b.check_in, b.check_out)}</p>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function HostToday() {
  const { user } = useAuth();
  const { notify } = useNotifications();
  const { data, loading, error, reload } = useApi("/api/host/today");

  async function respond(id, decision) {
    try {
      await api.post(`/api/host/bookings/${id}/respond`, { decision });
      notify(decision === "accept" ? COPY.HOST.ACCEPTED : COPY.HOST.DECLINED, "success");
    } catch (err) {
      notify(errorText(err), "error");
    }
    reload();
  }

  return (
    <PageState loading={loading} error={error} onRetry={reload}>
      {data && (
        <div className="space-y-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-headline text-fg">{COPY.HOST.WELCOME(user.name)}</h1>
            <div className="flex gap-2">
              <Button as={Link} to="/become-a-host" variant="primary">{COPY.HOST.CREATE_LISTING}</Button>
              <Button as={Link} to="/host/experiences/new" variant="outline">{COPY.HOST.CREATE_EXPERIENCE}</Button>
            </div>
          </div>
          <section>
            <h2 className="mb-3 text-title text-fg">{COPY.HOST.REQUESTS}</h2>
            {data.requests.length === 0 ? (
              <p className="text-body text-fg-muted">{COPY.HOST.NO_REQUESTS}</p>
            ) : (
              <ul className="grid gap-4 md:grid-cols-2">
                {data.requests.map((b) => (
                  <li key={b.id}>
                    <Card padding="md" className="space-y-3">
                      <div className="flex items-center gap-3">
                        <UserAvatar name={b.guest_name} hue={b.guest_hue} />
                        <div>
                          <p className="text-label text-fg">{b.guest_name}</p>
                          <p className="text-caption text-fg-muted">{b.listing_title} · {dateRange(b.check_in, b.check_out)} · {money(b.total)}</p>
                        </div>
                      </div>
                      {b.message && <p className="rounded-card bg-surface-muted p-3 text-body text-fg">{b.message}</p>}
                      <p className="text-caption text-fg-muted">{COPY.HOST.EXPIRES}</p>
                      <div className="flex gap-2">
                        <Button variant="primary" size="sm" onClick={() => respond(b.id, "accept")}>{COPY.HOST.ACCEPT}</Button>
                        <Button variant="outline" size="sm" onClick={() => respond(b.id, "decline")}>{COPY.HOST.DECLINE}</Button>
                      </div>
                    </Card>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <StayList title={COPY.HOST.CHECKING_OUT} items={data.checkingOut} />
          <StayList title={COPY.HOST.CURRENT} items={data.current} />
          <StayList title={COPY.HOST.UPCOMING} items={data.upcoming} />
        </div>
      )}
    </PageState>
  );
}
