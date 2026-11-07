import { useEffect, useState } from "react";
import { Button, Input, Textarea, useNotifications } from "@kasumi/ui";
import { COPY } from "@/copy.js";
import { UserAvatar } from "@/components/UserAvatar.jsx";
import { api } from "@/lib/api.js";
import { useAuth, useSignedIn } from "@/lib/auth.jsx";
import { shortDate } from "@/lib/format.js";

export function Account() {
  const { setUser } = useAuth();
  const user = useSignedIn();
  const { notify } = useNotifications();
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) setForm({ name: user.name, city: user.city, about: user.about });
  }, [user]);

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    try {
      setUser((await api.patch("/api/me", form)).user);
      notify(COPY.ACCOUNT.SAVED, "success");
    } catch {
      notify(COPY.COMMON.ERROR, "error");
    } finally {
      setBusy(false);
    }
  }

  if (!user || !form) return null;
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  return (
    <div className="mx-auto max-w-xl px-6 py-10">
      <div className="mb-8 flex items-center gap-4">
        <UserAvatar user={user} size="xl" />
        <div>
          <h1 className="text-headline text-fg">{user.name}</h1>
          <p className="text-body text-fg-muted">{user.email} · {COPY.ACCOUNT.JOINED(shortDate(user.createdAt))}</p>
        </div>
      </div>
      <form onSubmit={save} className="space-y-4">
        <Input label={COPY.ACCOUNT.NAME} required maxLength={80} value={form.name} onChange={set("name")} />
        <Input label={COPY.ACCOUNT.CITY} maxLength={80} value={form.city} onChange={set("city")} />
        <Textarea label={COPY.ACCOUNT.ABOUT} rows={4} maxLength={1000} value={form.about} onChange={set("about")} />
        <Button type="submit" variant="primary" loading={busy}>{COPY.ACCOUNT.SAVE}</Button>
      </form>
    </div>
  );
}
