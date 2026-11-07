import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api.js";

export function useApi(url) {
  const [state, setState] = useState({ data: null, error: null, loading: !!url });
  const load = useCallback(() => {
    if (!url) return undefined;
    let live = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    api.get(url).then(
      (data) => live && setState({ data, error: null, loading: false }),
      (error) => live && setState({ data: null, error, loading: false }),
    );
    return () => {
      live = false;
    };
  }, [url]);
  useEffect(load, [load]);
  return { ...state, reload: load };
}
