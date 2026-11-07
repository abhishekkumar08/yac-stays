# yac-stays — REA teardown of a public short-stay marketplace (structure only)

Captured 2026-10-22 with REA 6.7.0 (`inspect-web-page`, `capture-web-screenshot`) against logged-out
public pages in a throwaway Chrome (port 9233, scratchpad profile). No photos, listing text or data kept;
screenshots stay in the session scratchpad and are not copied into any repo.

## Home (/)
- Header: logo left; top tabs (All / Homes / Experiences / Services); "Become a host"; profile button; menu button.
- Big pill search bar: Where (destination) | When (dates) | Who (guests) | round search button.
- Body: horizontal carousels "Places to stay in <city> →" with prev/next arrows, 6 cards per row.
- Card: square-ish photo (rounded), badge top-left ("Guest favourite"), heart top-right; title "<Type> in <Area>";
  "₹X for 1 night · ★ 4.87".
- Floating toast "Prices include all fees". Footer: Support / Hosting / Company columns; language + currency.

## Search (/s/<place>/homes?checkin&checkout&adults)
- Compact search pill in header: "Homes in Goa | 20–23 Nov | 2 guests".
- Filter bar: Filters (modal), Price ▾, quick toggles (Pool, Guest favourite, Kitchen, Air conditioning,
  Free cancellation, Free parking, Wifi), Type of place ▾, Rooms and beds ▾.
- Results header "Over 1,000 homes" + "Prices include all fees". 2-col card grid left, map right (sticky).
- Card: photo carousel (dots + next photo), badge (Guest favourite / Superhost), heart (Add to wishlist),
  "<Type> in <Area>" + ★rating (count), listing name, "1 bedroom · 1 king bed · 1 bathroom",
  "₹total for N nights" (strike-through original when discounted), chip "Free cancellation".
- Map: price pill markers ("₹12,000"), zoom +/-, full-screen toggle; marker click opens card.
- Pagination: Previous / 1..N / Next, 20 per page.

## Listing (/rooms/<id>?check_in&check_out&adults)
- Title + Share + Save (heart). 5-photo grid (1 large + 4), "Show all photos" opens gallery.
- Left column sections in order: "<Entire rental unit> in <City>"; "3 guests · 1 bedroom · 1 bed · 1 bathroom";
  ★ rating · N reviews; Hosted by <name> (Superhost · N years hosting); Listing highlights; description
  (Show more); Where you'll sleep (room cards); What this place offers (amenities, "Show all N amenities");
  "N nights in <City>" two-month calendar with Clear dates; Reviews (overall + 6 sub-scores: cleanliness,
  accuracy, check-in, communication, location, value; "Guest reviews mention" tag chips; review cards;
  "Show all N reviews" modal); Where you'll be (map); Meet your host (Message host); Things to know
  (House rules, Safety & property, Cancellation policy — each with Show more).
- Right sticky booking card: price (strike-through + total for N nights), CHECK-IN | CHECKOUT, GUESTS ▾,
  Reserve button, (price breakdown below).
- Calendar day states (from accessibility labels):
  - Available ("There is a 2-night minimum stay requirement")
  - "Available, but has no eligible checkout date due to the N-night minimum" (gap too short before a block)
  - "This day is only available for checkout" (first day of a blocked range — checkout allowed on it)
  - Unavailable; Selected start / Selected / Selected end.
- Cancellation text pattern: "Free cancellation before <date>. Cancel before check-in on <date> for a partial refund."

## Not captured (need login)
Checkout/confirm-and-pay, trips, wishlists, host dashboard, messages. Design these from the known product
pattern, not from capture.

## Experiences (/s/<place>/experiences, /experiences/<id>)
- Search: carousels by category ("Local culture and history", "Get outside", "The best in local flavours"),
  cards with photo, title, "From ₹X per guest", rating.
- Detail: title, rating (count), Share, Save; photo strip "Photo 1 of N, opens gallery"; Listing highlights
  (Hosted by <name>. <tagline>; meeting place); right card "From ₹1,250 per guest" + upcoming slots as links
  ("Tomorrow, 23 October 4:30 pm to 6:30 pm"), "Show all dates".
- "What you'll do": ordered steps (title + one line each). Reviews (overall + cards, Show all ratings).
  "Where we'll meet" map. Meet your host / About me / Message <host>. Things to know: Guest requirements,
  Activity level, What to bring, Accessibility, Cancellation policy. "More experiences in <area>" carousel.

## Tool notes
- analyze-web-bundle OOM-crashed (exit 134) at 6 GB heap, same as the Netflix session at 4 GB. Skipped.
