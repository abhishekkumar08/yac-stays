import { Link } from "react-router-dom";
import { Tabs } from "@kasumi/ui";
import { COPY } from "@/copy.js";
import { ExperienceCard } from "@/components/ExperienceCard.jsx";
import { ListingCard } from "@/components/ListingCard.jsx";
import { PageState } from "@/components/PageState.jsx";
import { Row, RowItem } from "@/components/Row.jsx";
import { useApi } from "@/lib/useApi.js";

const INSPIRATION = {
  popular: ["Goa", "Manali", "Jaipur", "Udaipur", "Munnar", "Pondicherry", "Rishikesh", "Coorg"],
  beach: ["Goa", "Pondicherry"],
  mountains: ["Manali", "Munnar", "Rishikesh", "Coorg"],
  heritage: ["Jaipur", "Udaipur", "Pondicherry"],
  countryside: ["Coorg", "Munnar", "Rishikesh"],
};

function Inspiration() {
  return (
    <section className="mt-16 border-t border-line pt-10" aria-labelledby="inspiration">
      <h2 id="inspiration" className="mb-4 text-title-lg text-fg">{COPY.HOME.INSPIRATION}</h2>
      <Tabs
        variant="underline"
        tabs={Object.entries(INSPIRATION).map(([id, cities]) => ({
          id,
          label: COPY.HOME.INSPIRATION_TABS[id],
          content: (
            <ul className="grid gap-x-6 gap-y-4 pt-6 sm:grid-cols-3 lg:grid-cols-6">
              {cities.map((c) => (
                <li key={c}>
                  <Link to={`/s/${c}/homes`} className="block rounded-control focus-ring">
                    <span className="block text-label text-fg">{c}</span>
                    <span className="block text-body text-fg-muted">{COPY.HOME.INSPIRATION_KIND[id]}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ),
        }))}
      />
    </section>
  );
}

export function Home({ tab = "all" }) {
  const homes = useApi("/api/home");
  const experiences = useApi(tab === "all" ? "/api/experiences" : null);
  const services = useApi(tab === "all" ? "/api/experiences?kind=service" : null);

  const homeRows = (homes.data?.rows ?? []).map((row) => (
    <Row key={`h-${row.city}`} title={COPY.HOME.PLACES_IN(row.city)} to={`/s/${encodeURIComponent(row.city)}/homes`} seeAllLabel={COPY.HOME.SEE_ALL(row.city)}>
      {row.items.map((l) => (
        <RowItem key={l.id}>
          <ListingCard listing={l} compact />
        </RowItem>
      ))}
    </Row>
  ));
  const activityRow = (prefix, title, row) => (
    <Row key={`${prefix}-${row.city}`} title={title(row.city)}>
      {row.items.map((e) => (
        <RowItem key={e.id}>
          <ExperienceCard experience={e} />
        </RowItem>
      ))}
    </Row>
  );
  const extra = tab === "all" ? [experiences.data?.cities?.[0] && activityRow("e", COPY.HOME.EXPERIENCES_IN, experiences.data.cities[0]), services.data?.cities?.[0] && activityRow("s", COPY.SERVICES.IN_CITY, services.data.cities[0])] : [];
  const rows = [...homeRows.slice(0, 2), extra[0], ...homeRows.slice(2, 4), extra[1], ...homeRows.slice(4)].filter(Boolean);

  return (
    <div className="mx-auto max-w-screen-2xl px-6 pb-8 lg:px-20">
      <PageState loading={homes.loading} error={homes.error} onRetry={homes.reload}>
        {rows}
        <p className="mt-10 text-center text-body text-fg-muted">{COPY.HOME.PRICES_INCLUDE_FEES}</p>
        <Inspiration />
      </PageState>
    </div>
  );
}
