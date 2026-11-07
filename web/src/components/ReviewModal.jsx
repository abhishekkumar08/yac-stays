import { useState } from "react";
import { Button, Modal, SegmentedControl, Textarea, useNotifications } from "@kasumi/ui";
import { COPY } from "@/copy.js";
import { api } from "@/lib/api.js";

const STARS = ["1", "2", "3", "4", "5"].map((v) => ({ value: v, label: `${v}★` }));
const SUBS = ["cleanliness", "accuracy", "checkin", "communication", "location", "value"];

export function ReviewModal({ target, onClose, onDone }) {
  const [scores, setScores] = useState({ overall: "5" });
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const { notify } = useNotifications();
  const isListing = target?.kind === "listing";

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const subs = isListing ? Object.fromEntries(SUBS.map((k) => [k, Number(scores[k] ?? scores.overall)])) : {};
      await api.post("/api/reviews", { kind: target.kind, bookingId: target.bookingId, overall: Number(scores.overall), body: body.trim(), ...subs });
      notify(COPY.REVIEW.THANKS, "success");
      setBody("");
      onDone();
    } catch {
      notify(COPY.COMMON.ERROR, "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={!!target} onClose={onClose} title={target ? COPY.REVIEW.TITLE(target.title) : ""} size="md">
      <form onSubmit={submit} className="space-y-5">
        <SegmentedControl label={COPY.REVIEW.OVERALL} options={STARS} value={scores.overall} onChange={(v) => setScores((s) => ({ ...s, overall: v }))} />
        {isListing &&
          SUBS.map((k) => (
            <div key={k} className="flex items-center justify-between gap-4">
              <span className="text-body text-fg">{COPY.LISTING.SCORES[k]}</span>
              <SegmentedControl label={COPY.LISTING.SCORES[k]} options={STARS} value={scores[k] ?? scores.overall} onChange={(v) => setScores((s) => ({ ...s, [k]: v }))} />
            </div>
          ))}
        <Textarea label={COPY.REVIEW.BODY} hint={COPY.REVIEW.BODY_HINT} rows={4} minLength={10} maxLength={2000} required value={body} onChange={(e) => setBody(e.target.value)} />
        <Button type="submit" variant="primary" loading={busy} disabled={body.trim().length < 10}>
          {COPY.REVIEW.SUBMIT}
        </Button>
      </form>
    </Modal>
  );
}
