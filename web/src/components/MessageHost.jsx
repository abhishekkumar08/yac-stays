import { useState } from "react";
import { Button, Modal, Textarea, useNotifications } from "@kasumi/ui";
import { COPY } from "@/copy.js";
import { api } from "@/lib/api.js";
import { useAuth } from "@/lib/auth.jsx";

const label = COPY.LISTING.MESSAGE_HOST;

export function MessageHostButton({ kind, itemId, hostName }) {
  const { requireAuth, user } = useAuth();
  const { notify } = useNotifications();
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  async function send(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post("/api/threads", { kind, itemId, body: body.trim() });
      notify(COPY.LISTING.SENT, "success");
      setBody("");
      setOpen(false);
    } catch {
      notify(COPY.COMMON.ERROR, "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button variant="secondary" onClick={() => requireAuth(() => setOpen(true))}>
        {label}
      </Button>
      <Modal open={open && !!user} onClose={() => setOpen(false)} title={`${label} · ${hostName}`} size="md">
        <form onSubmit={send} className="space-y-4">
          <Textarea aria-label={label} rows={5} maxLength={2000} required placeholder={COPY.LISTING.MESSAGE_PLACEHOLDER} value={body} onChange={(e) => setBody(e.target.value)} autoFocus />
          <Button type="submit" variant="primary" loading={busy} disabled={!body.trim()}>
            {COPY.LISTING.SEND}
          </Button>
        </form>
      </Modal>
    </>
  );
}
