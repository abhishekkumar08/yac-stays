import { EmptyState, ErrorState, LoadingState } from "@kasumi/ui";
import { COPY } from "@/copy.js";

export function PageState({ loading, error, onRetry, notFound, children }) {
  if (loading) return <LoadingState title={COPY.COMMON.LOADING} className="py-24" />;
  if (error?.status === 404 || notFound) {
    return <EmptyState titleAs="h1" title={notFound?.title ?? COPY.COMMON.NOT_FOUND} description={notFound?.body ?? COPY.COMMON.NOT_FOUND_BODY} className="py-24" />;
  }
  if (error) return <ErrorState title={COPY.COMMON.ERROR} onRetry={onRetry} className="py-24" />;
  return children;
}
