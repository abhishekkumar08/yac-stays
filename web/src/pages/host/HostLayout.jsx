import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { Button, EmptyState, useNotifications } from "@kasumi/ui";
import { Home } from "lucide-react";
import { COPY } from "@/copy.js";
import { api } from "@/lib/api.js";
import { useAuth } from "@/lib/auth.jsx";

const NAV = [
  ["/host", COPY.HOST.TODAY, true],
  ["/host/calendar", COPY.HOST.CALENDAR],
  ["/host/listings", COPY.HOST.LISTINGS],
  ["/host/experiences", COPY.HOST.EXPERIENCES],
  ["/host/reservations", COPY.HOST.RESERVATIONS],
  ["/host/earnings", COPY.HOST.EARNINGS],
  ["/messages", COPY.HOST.MESSAGES],
];

export function HostLayout() {
  const { user, refresh, requireAuth } = useAuth();
  const { notify } = useNotifications();
  const [busy, setBusy] = useState(false);

  if (user === undefined) return null;
  if (!user?.isHost) {
    const start = () =>
      requireAuth(async () => {
        setBusy(true);
        try {
          await api.post("/api/host/become");
          await refresh();
        } catch {
          notify(COPY.COMMON.ERROR, "error");
        } finally {
          setBusy(false);
        }
      });
    return (
      <EmptyState
        icon={Home}
        titleAs="h1"
        title={COPY.HOST.BECOME_TITLE}
        description={COPY.HOST.BECOME_BODY}
        action={<Button variant="primary" loading={busy} onClick={start}>{COPY.HOST.BECOME_ACTION}</Button>}
        className="py-24"
      />
    );
  }

  return (
    <div className="mx-auto max-w-screen-xl px-6 py-6">
      <nav aria-label={COPY.NAV.HOSTING} className="ys-no-scrollbar mb-8 flex gap-1 overflow-x-auto border-b border-line">
        {NAV.map(([to, label, end]) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `shrink-0 border-b-2 px-4 py-3 text-label focus-ring ${isActive ? "border-fg text-fg" : "border-transparent text-fg-muted hover:text-fg"}`}
          >
            {label}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </div>
  );
}
