import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "@kasumi/ui";
import { COPY } from "@/copy.js";
import { api } from "@/lib/api.js";
import { useApi } from "@/lib/useApi.js";

export function useHostEditor({ id, apiBase, pageBase, empty, fromApi, toApi, createdMessage }) {
  const navigate = useNavigate();
  const { notify } = useNotifications();
  const existing = useApi(id ? `${apiBase}/${id}` : null);
  const [form, setForm] = useState(id ? null : empty);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (existing.data) setForm(fromApi(existing.data));
  }, [existing.data, fromApi]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e?.target ? e.target.value : e }));

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (id) {
        await api.put(`${apiBase}/${id}`, toApi(form));
        notify(COPY.HOST.SAVED, "success");
        existing.reload();
      } else {
        const created = await api.post(apiBase, toApi(form));
        notify(createdMessage, "success");
        navigate(`${pageBase}/${created.id}`, { replace: true });
      }
    } catch {
      setError(COPY.COMMON.ERROR);
    } finally {
      setBusy(false);
    }
  }

  return { existing, form, setForm, set, busy, error, save };
}
