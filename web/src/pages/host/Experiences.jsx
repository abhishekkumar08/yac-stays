import { Sparkles } from "lucide-react";
import { COPY } from "@/copy.js";
import { HostItemGrid } from "@/pages/host/HostItemGrid.jsx";
import { money } from "@/lib/format.js";

export function HostExperiences() {
  return (
    <HostItemGrid
      url="/api/host/experiences"
      title={COPY.HOST.EXPERIENCES}
      createLabel={COPY.HOST.CREATE_EXPERIENCE}
      createTo="/host/experiences/new"
      empty={{ icon: Sparkles, title: COPY.HOST.NO_EXPERIENCES, body: COPY.HOST.NO_EXPERIENCES_BODY }}
      editBase="/host/experiences"
      viewBase="/experiences"
      meta={(e) => `${e.city} · ${(e.kind === "service" ? COPY.SERVICES.CATEGORIES : COPY.EXPERIENCES.CATEGORY_SHORT)[e.category]} · ${money(e.price_per_guest)}`}
    />
  );
}
