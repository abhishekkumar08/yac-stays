import { Home } from "lucide-react";
import { COPY } from "@/copy.js";
import { HostItemGrid } from "@/pages/host/HostItemGrid.jsx";
import { money } from "@/lib/format.js";

export function HostListings() {
  return (
    <HostItemGrid
      url="/api/host/listings"
      title={COPY.HOST.LISTINGS}
      createLabel={COPY.HOST.CREATE_LISTING}
      createTo="/become-a-host"
      empty={{ icon: Home, title: COPY.HOST.NO_LISTINGS, body: COPY.HOST.NO_LISTINGS_BODY }}
      editBase="/host/listings"
      viewBase="/rooms"
      aside={(l) => COPY.HOST.UPCOMING_COUNT(l.upcoming)}
      meta={(l) => `${l.area}, ${l.city} · ${money(l.nightly)}`}
    />
  );
}
