import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Alert, Button, Input, Modal, useNotifications } from "@kasumi/ui";
import { COPY } from "@/copy.js";
import { api, ApiError } from "@/lib/api.js";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function useSignedIn() {
  const { user, requireAuth } = useAuth();
  useEffect(() => {
    if (user === null) requireAuth();
  }, [user, requireAuth]);
  return user;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined);
  const [prompt, setPrompt] = useState(null);
  const { notify } = useNotifications();

  const refresh = useCallback(
    () => api.get("/api/me").then((d) => setUser(d.user), () => setUser(null)),
    [],
  );
  useEffect(() => {
    refresh();
  }, [refresh]);

  const requireAuth = useCallback(
    (then) => {
      if (user) return then?.(user);
      setPrompt({ then });
      return undefined;
    },
    [user],
  );

  const logout = useCallback(async () => {
    try {
      await api.post("/api/auth/logout");
      setUser(null);
      notify(COPY.AUTH.LOGGED_OUT, "info");
    } catch {
      notify(COPY.COMMON.ERROR, "error");
    }
  }, [notify]);

  const value = useMemo(() => ({ user, setUser, refresh, requireAuth, logout }), [user, refresh, requireAuth, logout]);
  return (
    <AuthContext.Provider value={value}>
      {children}
      <AuthModal
        open={!!prompt}
        onClose={() => setPrompt(null)}
        onSignedIn={(u) => {
          setUser(u);
          const then = prompt?.then;
          setPrompt(null);
          then?.(u);
        }}
      />
    </AuthContext.Provider>
  );
}

function AuthModal({ open, onClose, onSignedIn }) {
  const [step, setStep] = useState("email");
  const [form, setForm] = useState({ email: "", password: "", name: "" });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  useEffect(() => {
    if (!open) {
      setStep("email");
      setError(null);
      setForm((f) => ({ ...f, password: "" }));
    }
  }, [open]);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (step === "email") {
        const { exists } = await api.post("/api/auth/check-email", { email: form.email.trim() });
        setStep(exists ? "login" : "signup");
      } else if (step === "login") {
        onSignedIn((await api.post("/api/auth/login", { email: form.email.trim(), password: form.password })).user);
      } else {
        onSignedIn((await api.post("/api/auth/signup", { email: form.email.trim(), name: form.name.trim(), password: form.password })).user);
      }
    } catch (err) {
      const code = err instanceof ApiError ? err.code : null;
      setError(code === "bad_credentials" ? COPY.AUTH.BAD_CREDENTIALS : code === "email_taken" ? COPY.AUTH.TAKEN : COPY.AUTH.ERROR);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={step === "signup" ? COPY.AUTH.FINISH_SIGNUP : COPY.AUTH.TITLE} size="sm">
      <form onSubmit={submit} className="space-y-4">
        {step === "email" && <h2 className="text-title text-fg">{COPY.AUTH.WELCOME(COPY.BRAND)}</h2>}
        <Input label={COPY.AUTH.EMAIL} type="email" autoComplete="email" required value={form.email} onChange={set("email")} disabled={step !== "email"} />
        {step === "signup" && <Input label={COPY.AUTH.NAME} autoComplete="given-name" required maxLength={80} value={form.name} onChange={set("name")} />}
        {step !== "email" && (
          <Input
            label={step === "signup" ? COPY.AUTH.CREATE_PASSWORD : COPY.AUTH.PASSWORD}
            hint={step === "signup" ? COPY.AUTH.PASSWORD_HINT : undefined}
            type="password"
            autoComplete={step === "signup" ? "new-password" : "current-password"}
            required
            minLength={step === "signup" ? 8 : 1}
            value={form.password}
            onChange={set("password")}
            autoFocus
          />
        )}
        {error && <Alert tone="error" variant="inline">{error}</Alert>}
        <Button type="submit" variant="primary" size="lg" className="w-full" loading={busy}>
          {step === "email" ? COPY.AUTH.CONTINUE : step === "login" ? COPY.AUTH.LOG_IN : COPY.AUTH.AGREE}
        </Button>
        {step !== "email" && (
          <Button type="button" variant="ghost" className="w-full" onClick={() => setStep("email")}>
            {COPY.AUTH.BACK}
          </Button>
        )}
        <p className="text-caption text-fg-muted">{COPY.AUTH.LOCAL_NOTE}</p>
      </form>
    </Modal>
  );
}
