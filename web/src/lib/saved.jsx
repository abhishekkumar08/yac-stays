import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Button, Input, Modal, useNotifications } from "@kasumi/ui";
import { COPY } from "@/copy.js";
import { api } from "@/lib/api.js";
import { useAuth } from "@/lib/auth.jsx";
import { photoUrl } from "@/lib/format.js";

const SavedContext = createContext(null);
export const useSaved = () => useContext(SavedContext);

export function SavedProvider({ children }) {
  const { user, requireAuth } = useAuth();
  const { notify } = useNotifications();
  const [saved, setSaved] = useState({ listing: new Set(), experience: new Set() });
  const [picking, setPicking] = useState(null);

  const load = useCallback(() => {
    if (!user) return setSaved({ listing: new Set(), experience: new Set() });
    return api.get("/api/wishlists/saved").then(
      (d) => setSaved({ listing: new Set(d.listing), experience: new Set(d.experience) }),
      () => notify(COPY.COMMON.ERROR, "error"),
    );
  }, [user, notify]);
  useEffect(() => {
    load();
  }, [load]);

  const isSaved = useCallback((kind, id) => saved[kind].has(id), [saved]);

  const toggle = useCallback(
    (kind, id) =>
      requireAuth(async () => {
        if (!saved[kind].has(id)) return setPicking({ kind, id });
        try {
          await api.del(`/api/saved/${kind}/${id}`);
          notify(COPY.WISHLIST.REMOVED, "info");
          load();
        } catch {
          notify(COPY.COMMON.ERROR, "error");
        }
        return undefined;
      }),
    [requireAuth, saved, notify, load],
  );

  const value = useMemo(() => ({ isSaved, toggle, reload: load }), [isSaved, toggle, load]);
  return (
    <SavedContext.Provider value={value}>
      {children}
      <WishlistPicker
        item={picking}
        onClose={() => setPicking(null)}
        onSaved={(name) => {
          setPicking(null);
          notify(COPY.WISHLIST.SAVED(name), "success");
          load();
        }}
      />
    </SavedContext.Provider>
  );
}

function WishlistPicker({ item, onClose, onSaved }) {
  const [lists, setLists] = useState(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const { notify } = useNotifications();

  useEffect(() => {
    if (!item) return;
    setName("");
    api.get("/api/wishlists").then(
      (l) => {
        setLists(l);
        setCreating(l.length === 0);
      },
      () => notify(COPY.COMMON.ERROR, "error"),
    );
  }, [item, notify]);

  async function addTo(list) {
    try {
      await api.post(`/api/wishlists/${list.id}/items`, { kind: item.kind, id: item.id });
      onSaved(list.name);
    } catch {
      notify(COPY.COMMON.ERROR, "error");
    }
  }

  async function create(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const w = await api.post("/api/wishlists", { name: name.trim(), item: { kind: item.kind, id: item.id } });
      onSaved(w.name);
    } catch {
      notify(COPY.COMMON.ERROR, "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={!!item} onClose={onClose} title={creating ? COPY.WISHLIST.CREATE : COPY.WISHLIST.SAVE_TO} size="md">
      {creating ? (
        <form onSubmit={create} className="space-y-4">
          <Input label={COPY.WISHLIST.NAME} hint={COPY.WISHLIST.NAME_HINT} maxLength={50} required value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          <Button type="submit" variant="primary" className="w-full" loading={busy} disabled={!name.trim()}>
            {COPY.WISHLIST.CREATE_BUTTON}
          </Button>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {lists?.map((l) => (
              <Button key={l.id} variant="ghost" onClick={() => addTo(l)} className="h-auto flex-col items-start gap-2 p-1 text-left">
                <span className="block aspect-square w-full overflow-hidden rounded-card bg-surface-muted">
                  {l.cover && <img src={photoUrl(l.cover)} alt="" className="h-full w-full object-cover" />}
                </span>
                <span className="text-label text-fg">{l.name}</span>
                <span className="text-caption text-fg-muted">{COPY.WISHLIST.SAVED_COUNT(l.count)}</span>
              </Button>
            ))}
          </div>
          <Button variant="primary" className="w-full" onClick={() => setCreating(true)}>
            {COPY.WISHLIST.CREATE}
          </Button>
        </div>
      )}
    </Modal>
  );
}
