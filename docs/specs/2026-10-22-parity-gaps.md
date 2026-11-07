# yac-stays — parity pass

Asked 2026-10-22: finish the open items and make the app look and work like the reference marketplace.
Boundary (company rule): layout and behaviour match; name, logo, coral brand colour and real photos stay ours.

New captures (REA + browser, structure only): Services home and detail, search filters panel, date-picker
modes, result-card extras. See `docs/rea-teardown.md` for the earlier pages.

## Gaps, in build order

1. **Services** — tab; rows "Services in <city>"; search segment "Type of service"; detail: left hero card
   (cover, host avatar, title, blurb, ★ rating · reviews · "<Category> in <city>", "Provided at your home",
   share, heart, sticky "From ₹X / guest · Show dates"), right offering cards (photo, title, blurb, ₹/guest ·
   duration), "You can message <host> to customise", reviews, My qualifications, My portfolio, I'll come to
   you, Things to know. Booking: choose offering → date/time slot → guests → mock pay.
   Data: `experiences.kind` ('experience' | 'service'), `experience_offerings`, `experience_bookings.offering_id`.
2. **Header** — All / Homes / Experiences / Services tabs with our own illustrated icons; home "All" mixes
   rows; compact pill on scroll; globe → language and currency dialog; phone bottom bar.
3. **Date picker** — Dates | Months | Flexible. Dates has "Exact dates, ±1, ±2, ±3, ±7, ±14 days". Months:
   1–12 months from a start date. Flexible: Weekend | Week | Month in chosen months. Search returns each
   listing's best matching window; cards show that window ("12–14 Dec") when it differs.
4. **Filters panel** — Recommended (free cancellation, kitchen, free parking, pool), Type of place, Price
   range (trip total, histogram + two-thumb slider), Rooms and beds steppers, Amenities chips + Show more,
   Booking options (Instant Book, Self check-in, Free cancellation, Allows pets), Standout stays (Guest
   favourite, Luxe), Property type tiles, Accessibility features, Host language; footer Clear all / Show N.
5. **Result cards** — "Show price breakdown" popover; discount labels (weekly stay); inline price-range card.
6. **Listing page** — sticky section nav with price + Reserve after the photos scroll away; photo tour by
   room; share and report dialogs; guest-favourite banner; reviews dialog with rating distribution, search,
   sort; Things to know "Show more" dialogs; "Prices include all fees" box above the booking card.
7. **Become a host** — step wizard with progress bar and Back / Next: structure, privacy type, location, basics,
   amenities, photos, title, description, booking setting, price, discounts, review and publish.
8. **Host calendar** — month grid with each night's price; select nights → side panel to set price or block.
   Data: `night_prices (listing_id, night, price)`; quotes sum per-night prices.
9. **Inbox, profiles, wishlists** — inbox filters (All, Unread, Travelling, Hosting) and reservation panel;
   `/users/:id` profile pages; "Recently viewed" wishlist.
10. **Review and verify** — gstack review, unit + API + e2e tests.
