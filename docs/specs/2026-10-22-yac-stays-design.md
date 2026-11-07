# yac-stays — design

Status: approved in chat 2026-10-22 (all features in one release, plus Experiences).
Working name `yac-stays` until YAC HQ picks a brand (options: Nestly, Staywise, Haven, Roamly).

## Problem and user
A short-stay rental marketplace for YAC: guests find and book homes and local experiences; hosts list and
manage them. Structure follows the market-standard rental site, captured with REA (structure only, see
`docs/rea-teardown.md`). Brand, colours, copy and photos are our own. Everything runs locally.

## Goals
- Guest: home rows, search, list + map, listing page, wishlists, book (instant or request), mock pay, trips,
  cancel, reviews, messages.
- Host: become a host, create/edit listings and experiences, block dates, accept/decline requests, earnings.
- Experiences: browse by category, detail page with time slots, book seats in a slot.
- Never double-book; never oversell an experience slot.

## Non-goals
Real payments or card fields, real email/SMS, multi-currency (INR only), languages, Services tab (shown as
"coming soon"), photo upload to cloud (images are local files), deployment.

## Approach
Vite + React + Kasumi web app, Fastify JSON API, SQLite through Node 22's built-in `node:sqlite`, one repo.
Chosen over Postgres-in-Docker (no extra infra on a shared 24 GB Mac) and Next.js (SSR not needed locally).
Ports: web 3110, API 3111. Kasumi via `file:../kasumi` plus its `kasumi()` Vite plugin, like MoneyWise.

## Units
| Unit | Purpose |
|---|---|
| `server/domain/availability.js` | Pure functions: nights between dates, overlap test, day states for a calendar (available / no-valid-checkout / checkout-only / unavailable) given bookings, blocks and minimum nights. |
| `server/domain/pricing.js` | Pure: nightly × nights + cleaning fee + service fee (14% of subtotal), weekly discount (≥7 nights) → line items and total, integer paise. |
| `server/domain/cancellation.js` | Pure: refund amount for flexible / moderate / strict policy given booking and cancel time. |
| `server/db.js` | Opens SQLite (WAL), runs schema, exposes `tx(fn)` using `BEGIN IMMEDIATE` so booking writes are serialised. |
| `server/routes/*.js` | auth, listings/search, bookings, experiences, wishlists, reviews, messages, host. Thin: validate → domain → db. |
| `web/src/pages/*` | Home, Search, Listing, Book (checkout), Trips, Wishlists, Messages, Experiences search/detail, Host (dashboard, listing editor, calendar, requests, earnings), Auth. |
| `web/src/components/*` | Product pieces: ListingCard (photo carousel, heart, badge), SearchBar (Where/When/Who), FilterBar, MapView, BookingCard, ReviewSummary. |
| Kasumi additions | `RangeCalendar` (two-month selectable range with per-day disabled/checkout-only), `NumberStepper`. Product-neutral, committed in the kasumi repo separately. |

## Booking rules
- A stay holds nights [check_in, check_out). Conflicts: confirmed bookings, pending requests (until
  declined/expired after 24 h), host-blocked nights.
- Create booking = one `BEGIN IMMEDIATE` transaction: re-check overlap + min nights + guest capacity, then
  insert. Instant-book listings → `confirmed`; others → `pending` until host accepts.
- Status machine: pending → confirmed | declined | expired; confirmed → cancelled_by_guest |
  cancelled_by_host | completed (after checkout). Only `completed` stays can be reviewed, once per stay.
- Experience slot booking: same transaction pattern; seats booked ≤ slot capacity.
- Payment: a mock step (choose "card ending 4242" / "UPI mock"), no card fields; sets `paid_at`.

## Data (SQLite)
users (guest + host roles via `is_host`), sessions, listings, listing_photos, amenities, listing_amenities,
blocked_nights, bookings, experiences, experience_steps, experience_slots, experience_bookings,
wishlists + wishlist_items, reviews (overall + 6 sub-scores), threads + messages. Money in integer paise.

## Auth
Email + password (scrypt from `node:crypto`), httpOnly session cookie, SameSite=Lax, server-side sessions.
Every write route checks ownership (host edits only own listings; guest sees only own trips).

## Seed
~40 fake listings across 8 Indian cities, ~15 experiences, invented hosts/guests, reviews, some bookings so
calendars show blocked days. Images: generated locally (SVG/PNG gradients with room-type illustrations),
no real photos. Demo logins written to `README.md` (local-only test accounts).

## Testing
`node --test`: availability (overlaps at edges, min nights, checkout-only, no-valid-checkout), pricing,
cancellation refunds, booking transaction (two concurrent requests for the same nights → one wins), slot
capacity. API smoke test over a temp DB. One Playwright run of the main guest + host path at the end.

## Assumptions
- One currency (INR), dates are local calendar dates (no time zones).
- Map uses OpenStreetMap tiles via Leaflet, loaded in the browser (the only outside network call).
