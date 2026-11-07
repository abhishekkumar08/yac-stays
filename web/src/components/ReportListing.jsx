import { useState } from "react";
import { Button, Modal, RadioGroup, Textarea, useNotifications } from "@kasumi/ui";
import { Flag } from "lucide-react";
import { COPY } from "@/copy.js";
import { api } from "@/lib/api.js";

export function ReportListing({ listingId }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const { notify } = useNotifications();

  async function send() {
    setBusy(true);
    try {
      await api.post(`/api/listings/${listingId}/report`, { reason, details: details.trim() || undefined });
      notify(COPY.LISTING.REPORT_THANKS, "success");
      setOpen(false);
      setReason("");
      setDetails("");
    } catch {
      notify(COPY.COMMON.ERROR, "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button variant="link" className="mx-auto mt-6 flex gap-2 text-fg-muted underline" onClick={() => setOpen(true)}>
        <Flag className="h-4 w-4" aria-hidden="true" />
        {COPY.LISTING.REPORT}
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={COPY.LISTING.REPORT_TITLE}
        description={COPY.LISTING.REPORT_HINT}
        size="md"
        footer={<Button variant="primary" loading={busy} disabled={!reason} onClick={send}>{COPY.LISTING.REPORT_SEND}</Button>}
      >
        <RadioGroup name="reason" options={COPY.LISTING.REPORT_REASONS.map((r) => ({ value: r, label: r }))} value={reason} onChange={setReason} />
        <Textarea label={COPY.LISTING.REPORT_DETAILS} rows={3} maxLength={1000} value={details} onChange={(e) => setDetails(e.target.value)} containerClassName="mt-4" />
      </Modal>
    </>
  );
}
