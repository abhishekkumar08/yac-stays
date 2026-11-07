import { useSearchParams } from "react-router-dom";
import { Chip, EmptyState } from "@kasumi/ui";
import { COPY } from "@/copy.js";
import { ExperienceCard } from "@/components/ExperienceCard.jsx";
import { PageState } from "@/components/PageState.jsx";
import { Row, RowItem } from "@/components/Row.jsx";
import { qs } from "@/lib/api.js";
import { useApi } from "@/lib/useApi.js";

const LABELS = {
  experience: { categories: COPY.EXPERIENCES.CATEGORY_SHORT, rows: (c) => COPY.EXPERIENCES.CATEGORIES[c.category], none: COPY.EXPERIENCES.NONE },
  service: { categories: COPY.SERVICES.CATEGORIES, rows: (c) => COPY.SERVICES.IN_CITY(c.city), none: COPY.SERVICES.NONE },
};

export function Activities({ kind }) {
  const [params, setParams] = useSearchParams();
  const where = params.get("where") ?? "";
  const category = params.get("category") ?? "";
  const { data, loading, error, reload } = useApi(`/api/experiences${qs({ kind, where, category })}`);
  const labels = LABELS[kind];
  const pick = (c) => setParams(Object.fromEntries(Object.entries({ where, category: c === category ? "" : c }).filter(([, v]) => v)));
  const rows = kind === "service" ? data?.cities : data?.categories;

  return (
    <div className="mx-auto max-w-screen-2xl px-6 pb-8 lg:px-20">
      <div className="ys-no-scrollbar flex gap-3 overflow-x-auto py-4">
        {Object.entries(labels.categories).map(([c, label]) => (
          <Chip key={c} selected={c === category} onClick={() => pick(c)} className="h-10 shrink-0 px-4">
            {label}
          </Chip>
        ))}
      </div>
      <PageState loading={loading && !data} error={error} onRetry={reload}>
        {data && data.items.length === 0 && <EmptyState title={labels.none} className="py-16" />}
        {data && (where || category) ? (
          <div className="mt-6 grid gap-x-6 gap-y-10 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            {data.items.map((e) => <ExperienceCard key={e.id} experience={e} />)}
          </div>
        ) : (
          rows?.map((row) => (
            <Row key={row.city ?? row.category} title={labels.rows(row)}>
              {row.items.map((e) => (
                <RowItem key={e.id}>
                  <ExperienceCard experience={e} />
                </RowItem>
              ))}
            </Row>
          ))
        )}
      </PageState>
    </div>
  );
}
