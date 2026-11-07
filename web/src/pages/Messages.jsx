import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Badge, Button, Chip, EmptyState, Textarea, useNotifications } from "@kasumi/ui";
import { ChevronLeft, MessageSquare } from "lucide-react";
import { COPY } from "@/copy.js";
import { PageState } from "@/components/PageState.jsx";
import { UserAvatar } from "@/components/UserAvatar.jsx";
import { api } from "@/lib/api.js";
import { useAuth, useSignedIn } from "@/lib/auth.jsx";
import { dateRange, money, photoUrl, shortDate } from "@/lib/format.js";
import { useApi } from "@/lib/useApi.js";

function Thread({ id, onSent }) {
  const { user } = useAuth();
  const { notify } = useNotifications();
  const { data, loading, error, reload } = useApi(`/api/threads/${id}`);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const end = useRef(null);

  useEffect(() => end.current?.scrollIntoView({ block: "end" }), [data]);

  async function send(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post(`/api/threads/${id}/messages`, { body: body.trim() });
      setBody("");
      reload();
      onSent();
    } catch {
      notify(COPY.COMMON.ERROR, "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <PageState loading={loading && !data} error={error} onRetry={reload}>
      {data && (
        <div className="grid h-full lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex h-full min-h-0 flex-col">
          <div className="flex items-center gap-3 border-b border-line px-6 py-4">
            <Button as={Link} to="/messages" variant="ghost" size="icon" aria-label={COPY.MESSAGES.BACK} className="md:hidden">
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </Button>
            <UserAvatar name={data.other.name} hue={data.other.avatarHue} />
            <div>
              <h2 className="text-label text-fg">{data.other.name}</h2>
              {data.item && (
                <Link to={data.kind === "listing" ? `/rooms/${data.item.id}` : `/experiences/${data.item.id}`} className="text-caption text-fg-muted underline">
                  {COPY.MESSAGES.ABOUT(data.item.title)}
                </Link>
              )}
            </div>
          </div>
          <ol className="flex-1 space-y-4 overflow-y-auto px-6 py-6">
            {data.messages.map((m) => {
              const mine = m.senderId === user?.id;
              return (
                <li key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] rounded-overlay px-4 py-3 text-body ${mine ? "bg-accent text-fg-on-accent" : "bg-surface-muted text-fg"}`}>
                    <p className="whitespace-pre-line">{m.body}</p>
                    <p className={`mt-1 text-caption ${mine ? "opacity-80" : "text-fg-muted"}`}>{mine ? COPY.MESSAGES.YOU : data.other.name} · {shortDate(m.createdAt)}</p>
                  </div>
                </li>
              );
            })}
            <li ref={end} aria-hidden="true" />
          </ol>
          <form onSubmit={send} className="flex items-end gap-3 border-t border-line p-4">
            <Textarea aria-label={COPY.MESSAGES.PLACEHOLDER} placeholder={COPY.MESSAGES.PLACEHOLDER} rows={2} maxLength={2000} value={body} onChange={(e) => setBody(e.target.value)} containerClassName="flex-1" />
            <Button type="submit" variant="primary" loading={busy} disabled={!body.trim()}>{COPY.MESSAGES.SEND}</Button>
          </form>
        </div>
        <ReservationPanel thread={data} />
        </div>
      )}
    </PageState>
  );
}

const FILTER_TEST = { all: () => true, unread: (t) => t.unread > 0, guest: (t) => t.role === "guest", host: (t) => t.role === "host" };

export function Messages() {
  const { id } = useParams();
  const user = useSignedIn();
  const { data, loading, error, reload } = useApi(user ? "/api/threads" : null);
  const [filter, setFilter] = useState("all");
  const threads = data?.filter(FILTER_TEST[filter]);

  return (
    <div className="mx-auto grid h-[calc(100dvh-81px)] max-w-screen-2xl md:grid-cols-[22rem_1fr]">
      <aside className={`${id ? "hidden md:block" : ""} overflow-y-auto border-r border-line`}>
        <h1 className="px-6 pt-6 text-headline text-fg">{COPY.MESSAGES.TITLE}</h1>
        <div className="ys-no-scrollbar flex gap-2 overflow-x-auto px-6 py-4">
          {Object.entries(COPY.MESSAGES.FILTERS).map(([k, label]) => (
            <Chip key={k} selected={filter === k} onClick={() => setFilter(k)} className="shrink-0">{label}</Chip>
          ))}
        </div>
        <PageState loading={loading || user === undefined} error={error} onRetry={reload}>
          {data?.length === 0 && <EmptyState icon={MessageSquare} size="sm" title={COPY.MESSAGES.NONE_TITLE} description={COPY.MESSAGES.NONE_BODY} />}
          {data?.length > 0 && threads.length === 0 && <p className="px-6 text-body text-fg-muted">{COPY.MESSAGES.NONE_IN_FILTER}</p>}
          <ul>
            {threads?.map((t) => (
              <li key={t.id}>
                <Link to={`/messages/${t.id}`} className={`flex gap-3 px-6 py-4 hover:bg-surface-muted ${String(t.id) === id ? "bg-surface-muted" : ""}`} aria-current={String(t.id) === id ? "page" : undefined}>
                  <UserAvatar name={t.otherName} hue={t.otherHue} />
                  <span className="min-w-0 flex-1">
                    <span className="flex justify-between gap-2">
                      <span className={`truncate text-label ${t.unread ? "text-fg" : "text-fg-muted"}`}>{t.otherName}</span>
                      <span className="shrink-0 text-caption text-fg-muted">{shortDate(t.lastAt)}</span>
                    </span>
                    <span className="block truncate text-body text-fg">{t.lastBody}</span>
                    <span className="block truncate text-caption text-fg-muted">{t.itemTitle}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </PageState>
      </aside>
      <section className={`${id ? "" : "hidden md:block"} min-h-0`}>
        {id ? <Thread key={id} id={id} onSent={reload} /> : <EmptyState icon={MessageSquare} title={COPY.MESSAGES.PICK} className="py-24" />}
      </section>
    </div>
  );
}

function ReservationPanel({ thread }) {
  const b = thread.booking;
  const link = thread.kind === "listing" ? `/rooms/${thread.item.id}` : `/experiences/${thread.item.id}`;
  return (
    <aside className="hidden overflow-y-auto border-l border-line p-6 lg:block">
      <h2 className="mb-4 text-title text-fg">{b ? COPY.MESSAGES.RESERVATION : COPY.MESSAGES.DETAILS}</h2>
      {thread.photo && <img src={photoUrl(thread.photo)} alt="" className="mb-4 aspect-[4/3] w-full rounded-card object-cover" />}
      <p className="text-label text-fg">{thread.item.title}</p>
      <p className="mb-4 text-body text-fg-muted">{thread.item.city}</p>
      {b && (
        <dl className="divide-y divide-line text-body">
          <div className="flex justify-between py-3"><dt className="text-fg-muted">{COPY.MESSAGES.STAY_DATES}</dt><dd className="text-fg">{dateRange(b.check_in, b.check_out)}</dd></div>
          <div className="flex justify-between py-3"><dt className="text-fg-muted">{COPY.MESSAGES.GUESTS}</dt><dd className="text-fg">{b.guests}</dd></div>
          <div className="flex justify-between py-3"><dt className="text-fg-muted">{COPY.MESSAGES.TOTAL}</dt><dd className="text-fg">{money(b.total)}</dd></div>
          <div className="flex justify-between py-3"><dt className="text-fg-muted">{COPY.MESSAGES.STATUS}</dt><dd><Badge>{COPY.TRIPS.STATUS[b.status === "pending" ? "requested" : b.status === "confirmed" ? "upcoming" : b.status]}</Badge></dd></div>
        </dl>
      )}
      <Button as={Link} to={thread.role === "guest" && b ? "/trips" : link} variant="outline" className="mt-4 w-full">{thread.role === "guest" && b ? COPY.MESSAGES.VIEW_TRIP : COPY.MESSAGES.VIEW_LISTING}</Button>
    </aside>
  );
}
