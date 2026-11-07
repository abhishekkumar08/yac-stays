import { Route, Routes } from "react-router-dom";
import { Shell } from "@/components/Shell.jsx";
import { Home } from "@/pages/Home.jsx";
import { Search } from "@/pages/Search.jsx";
import { Listing } from "@/pages/Listing.jsx";
import { Book } from "@/pages/Book.jsx";
import { Trips } from "@/pages/Trips.jsx";
import { Wishlists, Wishlist } from "@/pages/Wishlists.jsx";
import { Messages } from "@/pages/Messages.jsx";
import { Experience } from "@/pages/Experience.jsx";
import { Activities } from "@/pages/Activities.jsx";
import { Service } from "@/pages/Service.jsx";
import { Account } from "@/pages/Account.jsx";
import { Profile } from "@/pages/Profile.jsx";
import { BecomeHost } from "@/pages/host/BecomeHost.jsx";
import { NotFound } from "@/pages/NotFound.jsx";
import { HostLayout } from "@/pages/host/HostLayout.jsx";
import { HostToday } from "@/pages/host/Today.jsx";
import { HostListings } from "@/pages/host/Listings.jsx";
import { ListingEditor } from "@/pages/host/ListingEditor.jsx";
import { HostCalendar } from "@/pages/host/Calendar.jsx";
import { Reservations } from "@/pages/host/Reservations.jsx";
import { HostExperiences } from "@/pages/host/Experiences.jsx";
import { ExperienceEditor } from "@/pages/host/ExperienceEditor.jsx";
import { Earnings } from "@/pages/host/Earnings.jsx";

export function App() {
  return (
    <Routes>
      <Route element={<Shell />}>
        <Route index element={<Home tab="all" />} />
        <Route path="homes" element={<Home tab="homes" />} />
        <Route path="s/:where/homes" element={<Search />} />
        <Route path="s/homes" element={<Search />} />
        <Route path="rooms/:id" element={<Listing />} />
        <Route path="book/:id" element={<Book />} />
        <Route path="trips" element={<Trips />} />
        <Route path="wishlists" element={<Wishlists />} />
        <Route path="wishlists/:id" element={<Wishlist />} />
        <Route path="messages" element={<Messages />} />
        <Route path="messages/:id" element={<Messages />} />
        <Route path="experiences" element={<Activities kind="experience" />} />
        <Route path="experiences/:id" element={<Experience />} />
        <Route path="services" element={<Activities kind="service" />} />
        <Route path="services/:id" element={<Service />} />
        <Route path="account" element={<Account />} />
        <Route path="users/:id" element={<Profile />} />
        <Route path="become-a-host" element={<BecomeHost />} />
        <Route path="host" element={<HostLayout />}>
          <Route index element={<HostToday />} />
          <Route path="listings" element={<HostListings />} />
          <Route path="listings/new" element={<ListingEditor />} />
          <Route path="listings/:id" element={<ListingEditor />} />
          <Route path="calendar" element={<HostCalendar />} />
          <Route path="reservations" element={<Reservations />} />
          <Route path="experiences" element={<HostExperiences />} />
          <Route path="experiences/new" element={<ExperienceEditor />} />
          <Route path="experiences/:id" element={<ExperienceEditor />} />
          <Route path="earnings" element={<Earnings />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
