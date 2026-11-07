import { useState } from "react";
import { Alert, Button, IconButton, Modal, Tabs } from "@kasumi/ui";
import { Globe } from "lucide-react";
import { COPY } from "@/copy.js";
import { currentCurrency, currentLocale, savePreferences } from "@/lib/currency.js";

function Choice({ selected, title, sub, onClick }) {
  return (
    <Button variant="ghost" onClick={onClick} aria-pressed={selected} className={`h-auto flex-col items-start gap-0 rounded-card px-3 py-2 text-left ${selected ? "ring-1 ring-fg" : ""}`}>
      <span className="text-body text-fg">{title}</span>
      <span className="text-body text-fg-muted">{sub}</span>
    </Button>
  );
}

export function LocaleButton() {
  const [open, setOpen] = useState(false);
  const locale = currentLocale();
  const currency = currentCurrency();
  const choose = (prefs) => {
    if (savePreferences(prefs)) window.location.reload();
  };
  return (
    <>
      <IconButton icon={Globe} label={COPY.NAV.LOCALE} onClick={() => setOpen(true)} className="hidden rounded-pill md:inline-flex" />
      <Modal open={open} onClose={() => setOpen(false)} title={COPY.LOCALE.TITLE} size="lg">
        <Tabs
          variant="underline"
          tabs={[
            {
              id: "language",
              label: COPY.LOCALE.LANGUAGE,
              content: (
                <div className="grid gap-2 pt-4 sm:grid-cols-3">
                  {COPY.LOCALE.LANGUAGES.map(([code, name, region]) => (
                    <Choice key={code} selected={code === locale} title={name} sub={region} onClick={() => choose({ locale: code })} />
                  ))}
                </div>
              ),
            },
            {
              id: "currency",
              label: COPY.LOCALE.CURRENCY,
              content: (
                <div className="space-y-4 pt-4">
                  <div className="grid gap-2 sm:grid-cols-3">
                    {Object.entries(COPY.LOCALE.CURRENCIES).map(([code, name]) => (
                      <Choice key={code} selected={code === currency} title={name} sub={code} onClick={() => choose({ currency: code })} />
                    ))}
                  </div>
                  <Alert tone="neutral" variant="inline">{COPY.LOCALE.NOTE}</Alert>
                </div>
              ),
            },
          ]}
        />
      </Modal>
    </>
  );
}
