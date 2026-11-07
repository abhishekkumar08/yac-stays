import { useState } from "react";
import { Badge, EmptyState, InlineConfirm, SegmentedControl, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, useNotifications } from "@kasumi/ui";
import { COPY } from "@/copy.js";
import { PageState } from "@/components/PageState.jsx";
import { api } from "@/lib/api.js";
import { dateRange, money } from "@/lib/format.js";
import { useApi } from "@/lib/useApi.js";

const TONE = { requested: "warning", upcoming: "success", current: "info", past: "neutral", cancelled: "error" };
const FILTERS = Object.entries(COPY.HOST.FILTER).map(([value, label]) => ({ value, label }));

export function Reservations() {
  const { data, loading, error, reload } = useApi("/api/host/reservations");
  const { notify } = useNotifications();
  const [filter, setFilter] = useState("upcoming");
  const rows = data?.filter((b) => filter === "all" || b.phase === filter) ?? [];

  async function cancel(id) {
    try {
      await api.post(`/api/host/bookings/${id}/cancel`);
      notify(COPY.HOST.CANCELLED, "success");
      reload();
    } catch {
      notify(COPY.COMMON.ERROR, "error");
    }
  }

  return (
    <PageState loading={loading} error={error} onRetry={reload}>
      <h1 className="mb-6 text-headline text-fg">{COPY.HOST.RESERVATIONS}</h1>
      <SegmentedControl label={COPY.HOST.RESERVATIONS} options={FILTERS} value={filter} onChange={setFilter} className="mb-6" />
      {rows.length === 0 ? (
        <EmptyState size="sm" title={COPY.HOST.NO_RESERVATIONS} />
      ) : (
        <Table caption={COPY.HOST.RESERVATIONS}>
          <TableHead>
            <TableRow>
              <TableHeader>{COPY.HOST.GUEST}</TableHeader>
              <TableHeader>{COPY.HOST.LISTING}</TableHeader>
              <TableHeader>{COPY.HOST.DATES}</TableHeader>
              <TableHeader>{COPY.HOST.STATUS_LABEL}</TableHeader>
              <TableHeader numeric>{COPY.HOST.TOTAL}</TableHeader>
              <TableHeader />
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((b) => (
              <TableRow key={b.id}>
                <TableCell>{b.guest_name}</TableCell>
                <TableCell>{b.listing_title}</TableCell>
                <TableCell>{dateRange(b.check_in, b.check_out)}</TableCell>
                <TableCell><Badge tone={TONE[b.phase]}>{b.phase === "cancelled" ? COPY.TRIPS.STATUS[b.status] : COPY.TRIPS.STATUS[b.phase]}</Badge></TableCell>
                <TableCell numeric>{money(b.total)}</TableCell>
                <TableCell>
                  {b.phase === "upcoming" && (
                    <InlineConfirm question={COPY.HOST.CANCEL_Q} onConfirm={() => cancel(b.id)} size="xs" variant="ghost" confirmVariant="destructive">{COPY.HOST.CANCEL_RES}</InlineConfirm>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </PageState>
  );
}
