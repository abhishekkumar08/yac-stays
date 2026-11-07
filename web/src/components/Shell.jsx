import { Outlet, useLocation } from "react-router-dom";
import { Header } from "@/components/Header.jsx";
import { BottomBar } from "@/components/BottomBar.jsx";
import { Footer } from "@/components/Footer.jsx";

export function Shell() {
  const { pathname } = useLocation();
  const wide = pathname.startsWith("/s/") || pathname.startsWith("/messages") || pathname.startsWith("/become-a-host");
  return (
    <div className="flex min-h-dvh flex-col bg-canvas text-fg">
      <Header />
      <main id="main" className="flex-1 pb-16 md:pb-0">
        <Outlet />
      </main>
      {!wide && <Footer />}
      <BottomBar />
    </div>
  );
}
