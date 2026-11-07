import { NavLink } from "react-router-dom";
import { Heart, MessageSquare, Search, UserCircle2 } from "lucide-react";
import { COPY } from "@/copy.js";
import { LogoMark } from "@/brand/Logo.jsx";
import { useAuth } from "@/lib/auth.jsx";

export function BottomBar() {
  const { user, requireAuth } = useAuth();
  const items = user
    ? [["/", COPY.NAV.EXPLORE, Search], ["/wishlists", COPY.NAV.WISHLISTS, Heart], ["/trips", COPY.NAV.TRIPS, null], ["/messages", COPY.NAV.MESSAGES, MessageSquare], [`/users/${user.id}`, COPY.NAV.PROFILE, UserCircle2]]
    : [["/", COPY.NAV.EXPLORE, Search], ["/wishlists", COPY.NAV.WISHLISTS, Heart], ["/login", COPY.NAV.LOG_IN_SHORT, UserCircle2]];
  return (
    <nav aria-label={COPY.NAV.MENU} className="fixed inset-x-0 bottom-0 z-sticky flex justify-around border-t border-line bg-canvas pb-[env(safe-area-inset-bottom)] md:hidden">
      {items.map(([to, label, Icon]) => (
        <NavLink
          key={to}
          to={to === "/login" ? "#" : to}
          end={to === "/"}
          onClick={(e) => {
            if (to === "/login") {
              e.preventDefault();
              requireAuth();
            }
          }}
          className={({ isActive }) => `flex flex-col items-center gap-1 px-3 py-2 text-caption ${isActive && to !== "/login" ? "text-accent-fg" : "text-fg-muted"}`}
        >
          {Icon ? <Icon className="h-6 w-6" aria-hidden="true" /> : <LogoMark className="h-6 w-6" />}
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
