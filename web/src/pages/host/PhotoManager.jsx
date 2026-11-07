import { useState } from "react";
import { FileDropzone, IconButton, useNotifications } from "@kasumi/ui";
import { Star, Trash2 } from "lucide-react";
import { COPY } from "@/copy.js";
import { api } from "@/lib/api.js";
import { photoUrl } from "@/lib/format.js";

const readAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });

export function PhotoManager({ base, photos, onChange, canCover = true }) {
  const { notify } = useNotifications();
  const [busy, setBusy] = useState(false);

  async function upload(files) {
    setBusy(true);
    try {
      const dataUrls = await Promise.all(files.map(readAsDataUrl));
      for (const dataUrl of dataUrls) await api.post(`${base}/photos`, { dataUrl });
    } catch {
      notify(COPY.HOST.PHOTOS_HINT, "error");
    } finally {
      setBusy(false);
      onChange();
    }
  }

  async function act(fn) {
    try {
      await fn();
      onChange();
    } catch {
      notify(COPY.COMMON.ERROR, "error");
    }
  }

  return (
    <div className="space-y-4">
      <FileDropzone title={COPY.HOST.PHOTOS_DROP} hint={COPY.HOST.PHOTOS_HINT} accept="image/png,image/jpeg,image/webp" multiple disabled={busy} onFiles={upload} />
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {photos.map((p, i) => (
          <li key={p.id} className="relative overflow-hidden rounded-card">
            <img src={photoUrl(p.file)} alt="" className="aspect-[4/3] w-full object-cover" />
            {i === 0 && <span className="absolute left-2 top-2 rounded-pill bg-surface px-2 py-0.5 text-caption text-fg shadow-raised">{COPY.HOST.COVER}</span>}
            <div className="absolute right-2 top-2 flex gap-1">
              {canCover && i > 0 && <IconButton icon={Star} size="xs" label={COPY.HOST.MAKE_COVER} className="bg-surface/90" onClick={() => act(() => api.post(`${base}/photos/${p.id}/cover`))} />}
              <IconButton icon={Trash2} size="xs" label={COPY.HOST.DELETE_PHOTO} className="bg-surface/90" onClick={() => act(() => api.del(`${base}/photos/${p.id}`))} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
