import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Button, Menu } from "@kasumi/ui";
import { Menu as MenuIcon, Search as SearchIcon } from "lucide-react";
import { COPY } from "@/copy.js";
import { Logo } from "@/brand/Logo.jsx";
import { BalloonIcon, BellIcon, GlobeIcon, HouseIcon } from "@/brand/TabIcons.jsx";
import { LocaleButton } from "@/components/LocaleModal.jsx";
import { SearchBar, useSearchState, whenLabel } from "@/components/SearchBar.jsx";
import { UserAvatar } from "@/components/UserAvatar.jsx";
import { useAuth } from "@/lib/auth.jsx";

const TABS = [
  { to: "/", label: COPY.NAV.ALL, icon: GlobeIcon, end: true },
  { to: "/homes", label: COPY.NAV.HOMES, icon: HouseIcon },
  { to: "/experiences", label: COPY.NAV.EXPERIENCES, icon: BalloonIcon },
  { to: "/services", label: COPY.NAV.SERVICES, icon: BellIcon },
];
const BIG_PAGES = ["/", "/homes", "/experiences", "/services"];
const COMPACT_AFTER = 48;

export function searchMode(pathname) {
  if (pathname.startsWith("/experiences")) return "experiences";
  if (pathname.startsWith("/services")) return "services";
  return "homes";
}

const MODE_ICON = { homes: HouseIcon, experiences: BalloonIcon, services: BellIcon };

function useScrolled() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > COMPACT_AFTER);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return scrolled;
}

export function Header() {
  const { pathname } = useLocation();
  const isHost = pathname.startsWith("/host");
  const scrolled = useScrolled();
  const bigPage = BIG_PAGES.includes(pathname);
  const mode = searchMode(pathname);
  const [expanded, setExpanded] = useState(false);
  const search = useSearchState();
  const big = (bigPage && !scrolled) || expanded;

  useEffect(() => setExpanded(false), [pathname, search.key]);

  return (
    <header className="sticky top-0 z-sticky border-b border-line bg-canvas">
      <div className="mx-auto flex max-w-screen-2xl items-center gap-2 px-4 py-3 sm:gap-4 sm:px-6 lg:px-20">
        <Link to={isHost ? "/host" : "/"} className="shrink-0 rounded-control focus-ring" aria-label={COPY.BRAND}>
          <Logo />
        </Link>
        <div className="flex min-w-0 flex-1 justify-center">
          {isHost ? null : big ? (
            <nav aria-label={COPY.NAV.HOMES} className="hidden items-center gap-6 md:flex">
              {TABS.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `group flex items-center gap-2 border-b-2 py-2 text-label focus-ring ${isActive ? "border-fg text-fg" : "border-transparent text-fg-muted hover:text-fg"}`
                  }
                >
                  <Icon />
                  {label}
                </NavLink>
              ))}
            </nav>
          ) : null}
          {!isHost && !big && <CompactPill search={search} mode={mode} onOpen={() => setExpanded(true)} />}
          {!isHost && big && (
            <div className="md:hidden">
              <CompactPill search={search} mode={mode} onOpen={() => setExpanded(true)} />
            </div>
          )}
        </div>
        <HostSwitch isHost={isHost} />
        <LocaleButton />
        <AccountMenu />
      </div>
      {!isHost && big && (
        <div className={`px-4 pb-5 ${expanded ? "" : "hidden md:block"}`}>
          <SearchBar key={mode + search.key} mode={mode} initial={search} />
        </div>
      )}
    </header>
  );
}

function CompactPill({ search, mode, onOpen }) {
  const Icon = MODE_ICON[mode];
  const where = search.where || COPY.SEARCH.ANYWHERE;
  const when = whenLabel(search) || COPY.SEARCH.ANYTIME;
  const guests = search.adults + search.children;
  const third = mode === "services" ? COPY.SERVICES.CATEGORIES[search.category] ?? COPY.SERVICES.ADD_SERVICE : guests ? COPY.SEARCH.GUESTS(guests) : COPY.SEARCH.ADD_GUESTS;
  return (
    <Button variant="outline" onClick={onOpen} className="group h-12 max-w-full gap-0 rounded-pill pl-3 pr-2 shadow-raised">
      <span className="mr-2 hidden sm:block [&_svg]:h-7 [&_svg]:w-7"><Icon /></span>
      <span className="truncate text-label text-fg">{mode === "homes" && search.where ? COPY.SEARCH.HOMES_IN(where) : where}</span>
      <span className="mx-3 h-6 w-px shrink-0 bg-line" aria-hidden="true" />
      <span className="shrink-0 text-label text-fg">{when}</span>
      <span className="mx-4 hidden h-6 w-px bg-line sm:block" aria-hidden="true" />
      <span className="hidden text-body text-fg-muted sm:inline">{third}</span>
      <span className="ml-3 grid h-8 w-8 shrink-0 place-items-center rounded-pill bg-accent text-fg-on-accent">
        <SearchIcon className="h-4 w-4" aria-hidden="true" />
      </span>
    </Button>
  );
}

function HostSwitch({ isHost }) {
  const { user } = useAuth();
  if (isHost) return <Button as={Link} to="/" variant="ghost" className="hidden md:inline-flex">{COPY.NAV.SWITCH_TO_TRAVELLING}</Button>;
  return (
    <Button as={Link} to={user?.isHost ? "/host" : "/become-a-host"} variant="ghost" className="hidden md:inline-flex">
      {user?.isHost ? COPY.NAV.SWITCH_TO_HOSTING : COPY.NAV.BECOME_HOST}
    </Button>
  );
}

function AccountMenu() {
  const { user, requireAuth, logout } = useAuth();
  const navigate = useNavigate();
  const trigger = (
    <Button variant="outline" aria-label={COPY.NAV.MENU} className="h-11 gap-2 rounded-pill px-2 sm:px-3">
      <MenuIcon className="hidden h-4 w-4 sm:block" aria-hidden="true" />
      <UserAvatar user={user} size="sm" />
    </Button>
  );
  const items = user
    ? [
        { label: COPY.NAV.MESSAGES, as: Link, to: "/messages" },
        { label: COPY.NAV.TRIPS, as: Link, to: "/trips" },
        { label: COPY.NAV.WISHLISTS, as: Link, to: "/wishlists" },
        { label: COPY.NAV.PROFILE, as: Link, to: `/users/${user.id}` },
        { label: COPY.NAV.ACCOUNT, as: Link, to: "/account" },
        { label: user.isHost ? COPY.NAV.HOSTING : COPY.NAV.BECOME_HOST, as: Link, to: user.isHost ? "/host" : "/become-a-host" },
        { label: COPY.NAV.LOG_OUT, onSelect: () => logout().then(() => navigate("/")) },
      ]
    : [
        { label: COPY.NAV.LOG_IN, onSelect: () => requireAuth() },
        { label: COPY.NAV.BECOME_HOST, as: Link, to: "/become-a-host" },
      ];
  return <Menu items={items} trigger={trigger} align="end" label={COPY.NAV.MENU} />;
}
