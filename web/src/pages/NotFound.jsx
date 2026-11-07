import { Link } from "react-router-dom";
import { Button, EmptyState } from "@kasumi/ui";
import { COPY } from "@/copy.js";

export function NotFound() {
  return <EmptyState titleAs="h1" title={COPY.COMMON.NOT_FOUND} description={COPY.COMMON.NOT_FOUND_BODY} action={<Button as={Link} to="/" variant="primary">{COPY.COMMON.HOME}</Button>} className="py-24" />;
}
