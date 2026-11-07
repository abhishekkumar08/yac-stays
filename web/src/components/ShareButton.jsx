import { useState } from "react";
import { Button, IconButton, Modal, useNotifications } from "@kasumi/ui";
import { Copy, Mail, MessageCircle, Share } from "lucide-react";
import { COPY } from "@/copy.js";

export function ShareButton({ title, photo, iconOnly = false }) {
  const [open, setOpen] = useState(false);
  const { notify } = useNotifications();
  const url = window.location.href;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      notify(COPY.LISTING.LINK_COPIED, "success");
      setOpen(false);
    } catch {
      notify(COPY.COMMON.ERROR, "error");
    }
  }

  return (
    <>
      {iconOnly ? (
        <IconButton icon={Share} label={COPY.LISTING.SHARE} onClick={() => setOpen(true)} />
      ) : (
        <Button variant="ghost" onClick={() => setOpen(true)}>
          <Share className="h-4 w-4" aria-hidden="true" />
          <span className="underline">{COPY.LISTING.SHARE}</span>
        </Button>
      )}
      <Modal open={open} onClose={() => setOpen(false)} title={COPY.SHARE.TITLE} size="md">
        <div className="mb-6 flex items-center gap-4">
          {photo && <img src={photo} alt="" className="h-16 w-16 rounded-card object-cover" />}
          <p className="text-label text-fg">{title}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" size="lg" className="justify-start" onClick={copy}>
            <Copy className="h-5 w-5" aria-hidden="true" />
            {COPY.SHARE.COPY_LINK}
          </Button>
          <Button variant="outline" size="lg" className="justify-start" as="a" href={`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}`}>
            <Mail className="h-5 w-5" aria-hidden="true" />
            {COPY.SHARE.EMAIL}
          </Button>
          <Button variant="outline" size="lg" className="justify-start" as="a" href={`sms:?&body=${encodeURIComponent(`${title} ${url}`)}`}>
            <MessageCircle className="h-5 w-5" aria-hidden="true" />
            {COPY.SHARE.MESSAGES}
          </Button>
        </div>
      </Modal>
    </>
  );
}
