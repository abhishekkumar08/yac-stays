import { EmptyState, StatCard, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@kasumi/ui";
import { Wallet } from "lucide-react";
import { COPY } from "@/copy.js";
import { PageState } from "@/components/PageState.jsx";
import { money, monthLabel } from "@/lib/format.js";
import { useApi } from "@/lib/useApi.js";

export function Earnings() {
  const { data, loading, error, reload } = useApi("/api/host/earnings");
  return (
    <PageState loading={loading} error={error} onRetry={reload}>
      {data && (
        <div className="space-y-6">
          <h1 className="text-headline text-fg">{COPY.HOST.EARNINGS}</h1>
          <StatCard label={COPY.HOST.EARNINGS_TOTAL} value={money(data.total)} icon={Wallet} hint={COPY.HOST.EARNINGS_NOTE} className="max-w-md" />
          {data.months.length === 0 ? (
            <EmptyState size="sm" title={COPY.HOST.NO_EARNINGS} />
          ) : (
            <Table caption={COPY.HOST.EARNINGS}>
              <TableHead>
                <TableRow>
                  <TableHeader>{COPY.HOST.MONTH}</TableHeader>
                  <TableHeader numeric>{COPY.HOST.STAYS}</TableHeader>
                  <TableHeader numeric>{COPY.HOST.EXPERIENCE_BOOKINGS}</TableHeader>
                  <TableHeader numeric>{COPY.HOST.PAYOUT}</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {[...data.months].reverse().map((m) => (
                  <TableRow key={m.month}>
                    <TableCell>{monthLabel(m.month)}</TableCell>
                    <TableCell numeric>{m.stays}</TableCell>
                    <TableCell numeric>{m.experiences}</TableCell>
                    <TableCell numeric>{money(m.payout)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      )}
    </PageState>
  );
}
