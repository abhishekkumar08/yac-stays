import { Link } from "react-router-dom";
import { Badge, Button, Card, EmptyState } from "@kasumi/ui";
import { COPY } from "@/copy.js";
import { PageState } from "@/components/PageState.jsx";
import { photoUrl } from "@/lib/format.js";
import { useApi } from "@/lib/useApi.js";

export function HostItemGrid({ url, title, createLabel, createTo, empty, editBase, viewBase, meta, aside }) {
  const { data, loading, error, reload } = useApi(url);
  return (
    <PageState loading={loading} error={error} onRetry={reload}>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-headline text-fg">{title}</h1>
        <Button as={Link} to={createTo} variant="primary">{createLabel}</Button>
      </div>
      {data?.length === 0 && <EmptyState icon={empty.icon} title={empty.title} description={empty.body} />}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {data?.map((item) => (
          <Card key={item.id} padding="none" className="overflow-hidden">
            <div className="aspect-[4/3] bg-surface-muted">{item.cover && <img src={photoUrl(item.cover)} alt="" className="h-full w-full object-cover" />}</div>
            <div className="space-y-2 p-4">
              <div className="flex items-center gap-2">
                <Badge tone={item.status === "listed" ? "success" : "neutral"}>{COPY.HOST.STATUS[item.status]}</Badge>
                {aside && <span className="text-caption text-fg-muted">{aside(item)}</span>}
              </div>
              <p className="truncate text-label text-fg">{item.title}</p>
              <p className="text-body text-fg-muted">{meta(item)}</p>
              <div className="flex gap-2 pt-1">
                <Button as={Link} to={`${editBase}/${item.id}`} size="sm" variant="outline">{COPY.HOST.EDIT}</Button>
                <Button as={Link} to={`${viewBase}/${item.id}`} size="sm" variant="ghost">{COPY.HOST.VIEW}</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </PageState>
  );
}
