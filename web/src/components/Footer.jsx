import { COPY } from "@/copy.js";

const COLUMNS = [
  [COPY.FOOTER.SUPPORT, COPY.FOOTER.LINKS.SUPPORT],
  [COPY.FOOTER.HOSTING, COPY.FOOTER.LINKS.HOSTING],
  [COPY.FOOTER.COMPANY, COPY.FOOTER.LINKS.COMPANY],
];

export function Footer() {
  return (
    <footer className="mt-16 border-t border-line bg-surface-subtle">
      <div className="mx-auto grid max-w-screen-2xl gap-8 px-6 py-10 sm:grid-cols-3 lg:px-20">
        {COLUMNS.map(([title, links]) => (
          <section key={title}>
            <h2 className="mb-3 text-label text-fg">{title}</h2>
            <ul className="space-y-2">
              {links.map((l) => (
                <li key={l} className="text-body text-fg-muted">
                  {l}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <p className="border-t border-line px-6 py-6 text-center text-caption text-fg-muted lg:px-20">{COPY.FOOTER.NOTE}</p>
    </footer>
  );
}
