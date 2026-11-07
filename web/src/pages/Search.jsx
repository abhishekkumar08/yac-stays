import { Fragment, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Button, Card, Checkbox, EmptyState, Input, Pagination } from "@kasumi/ui";
import { List, Map as MapIcon } from "lucide-react";
import { COPY } from "@/copy.js";
import { FilterBar } from "@/components/Filters.jsx";
import { ListingCard } from "@/components/ListingCard.jsx";
import { MapView } from "@/components/MapView.jsx";
import { PageState } from "@/components/PageState.jsx";
import { qs } from "@/lib/api.js";
import { FILTER_KEYS, searchApiUrl } from "@/lib/search.js";
import { useApi } from "@/lib/useApi.js";

export function Search() {
  const { where: rawWhere = "anywhere" } = useParams();
  const where = rawWhere === "anywhere" ? "" : rawWhere;
  const [params, setParams] = useSearchParams();
  const [hovered, setHovered] = useState(null);
  const [moveSearch, setMoveSearch] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const q = useMemo(() => Object.fromEntries(params), [params]);
  const { data, loading, error, reload } = useApi(searchApiUrl(where, q));
  const search = useMemo(() => ({ checkin: q.checkin, checkout: q.checkout, adults: q.adults }), [q.checkin, q.checkout, q.adults]);

  const update = (next) => setParams(Object.fromEntries(Object.entries({ ...q, ...next, page: next.page ?? "" }).filter(([, v]) => v)));
  const setFilters = (f) => setParams(Object.fromEntries(Object.entries({ ...Object.fromEntries(Object.entries(q).filter(([k]) => !FILTER_KEYS.includes(k))), ...f, page: "" }).filter(([, v]) => v)));
  const totalPages = data ? Math.ceil(data.total / data.pageSize) : 0;
  const fitKey = `${where}|${q.checkin}|${q.checkout}|${q.flexKind}|${FILTER_KEYS.map((k) => q[k]).join("|")}|${q.page}`;
  const exact = data?.items.filter((l) => !l.shifted) ?? [];
  const similar = data?.items.filter((l) => l.shifted) ?? [];
  const showWindow = !!(q.flexKind || q.flex);

  return (
    <div className="px-6 lg:px-10">
      <div className="sticky top-[var(--header-h,81px)] z-dropdown -mx-6 border-b border-line bg-canvas px-6 py-3 lg:-mx-10 lg:px-10">
        <FilterBar where={where} query={q} onChange={setFilters} prices={data?.prices} />
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <section className={`${showMap ? "hidden lg:block" : ""} py-6`} aria-busy={loading}>
          <PageState loading={loading && !data} error={error} onRetry={reload}>
            {data && (
              <>
                <div className="mb-6 flex items-center justify-between">
                  <h1 className="text-title-lg text-fg">{where ? COPY.RESULTS.COUNT_IN(data.total, where) : COPY.RESULTS.COUNT(data.total)}</h1>
                  <p className="text-body text-fg-muted">{COPY.HOME.PRICES_INCLUDE_FEES}</p>
                </div>
                {data.total === 0 ? (
                  <EmptyState
                    title={COPY.RESULTS.NONE_TITLE}
                    description={COPY.RESULTS.NONE_BODY}
                    action={() => setFilters({ bbox: "" })}
                    actionLabel={COPY.RESULTS.REMOVE_FILTERS}
                  />
                ) : (
                  <>
                    <div className={`grid gap-x-6 gap-y-10 sm:grid-cols-2 xl:grid-cols-3 ${loading ? "opacity-60" : ""}`}>
                      {exact.map((l, i) => (
                        <Fragment key={l.id}>
                          {i === 12 && !q.minPrice && !q.maxPrice && <PriceRangeCard prices={data.prices} onApply={(range) => setFilters({ ...q, ...range })} />}
                          <ListingCard listing={l} search={search} showWindow={showWindow} onHover={setHovered} />
                        </Fragment>
                      ))}
                    </div>
                    {similar.length > 0 && (
                      <>
                        <h2 className="mb-6 mt-12 text-title-lg text-fg">{COPY.RESULTS.SIMILAR}</h2>
                        <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 xl:grid-cols-3">
                          {similar.map((l) => (
                            <ListingCard key={l.id} listing={l} search={search} showWindow onHover={setHovered} />
                          ))}
                        </div>
                      </>
                    )}
                  </>
                )}
                <Pagination
                  className="mt-10"
                  page={data.page}
                  totalPages={totalPages}
                  onPageChange={(p) => {
                    update({ page: String(p) });
                    window.scrollTo({ top: 0 });
                  }}
                  summary={data.total ? COPY.RESULTS.SUMMARY((data.page - 1) * data.pageSize + 1, Math.min(data.total, data.page * data.pageSize), data.total) : null}
                />
              </>
            )}
          </PageState>
        </section>
        <aside className={`${showMap ? "block" : "hidden lg:block"} py-6`}>
          <div className="sticky top-40 h-[calc(100dvh-12rem)]">
            <MapView items={data?.items ?? []} label={COPY.RESULTS.MAP} activeId={hovered} fitKey={fitKey} onMove={moveSearch ? (bbox) => update({ bbox }) : undefined} className="h-full" hrefOf={(i) => `/rooms/${i.id}${qs({ check_in: i.window?.checkIn ?? q.checkin, check_out: i.window?.checkOut ?? q.checkout })}`} />
            <div className="absolute left-4 top-4 z-[500] rounded-pill bg-surface px-4 py-2 shadow-raised">
              <Checkbox label={COPY.RESULTS.SEARCH_AS_MOVE} checked={moveSearch} onChange={(e) => setMoveSearch(e.target.checked)} />
            </div>
          </div>
        </aside>
      </div>
      <Button variant="primary" onClick={() => setShowMap((s) => !s)} className="fixed bottom-8 left-1/2 z-sticky -translate-x-1/2 rounded-pill shadow-overlay lg:hidden">
        {showMap ? <List className="h-4 w-4" aria-hidden="true" /> : <MapIcon className="h-4 w-4" aria-hidden="true" />}
        {showMap ? COPY.RESULTS.SHOW_LIST : COPY.RESULTS.SHOW_MAP}
      </Button>
    </div>
  );
}

function PriceRangeCard({ prices, onApply }) {
  const [range, setRange] = useState({ minPrice: "", maxPrice: "" });
  if (!prices?.buckets?.length) return null;
  const top = Math.max(...prices.buckets, 1);
  return (
    <Card padding="md" className="flex flex-col gap-4 sm:col-span-2 xl:col-span-1">
      <div>
        <h3 className="text-title text-fg">{COPY.RESULTS.PRICE_RANGE_TITLE}</h3>
        <p className="text-body text-fg-muted">{COPY.RESULTS.PRICE_RANGE_SUB}</p>
      </div>
      <div className="flex h-14 items-end gap-0.5" aria-hidden="true">
        {prices.buckets.map((n, i) => <span key={i} className="flex-1 rounded-t-sm bg-accent" style={{ height: `${Math.max(4, (n / top) * 100)}%` }} />)}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label={COPY.FILTERS.MINIMUM} type="number" leading="₹" placeholder={String(Math.floor(prices.min / 100))} value={range.minPrice} onChange={(e) => setRange((r) => ({ ...r, minPrice: e.target.value }))} />
        <Input label={COPY.FILTERS.MAXIMUM} type="number" leading="₹" placeholder={String(Math.ceil(prices.max / 100))} value={range.maxPrice} onChange={(e) => setRange((r) => ({ ...r, maxPrice: e.target.value }))} />
      </div>
      <Button variant="primary" onClick={() => onApply(range)}>{COPY.RESULTS.SHOW_RESULTS}</Button>
    </Card>
  );
}
