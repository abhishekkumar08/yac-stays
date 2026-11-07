# yac stays (working name)

A short-stay rental marketplace for YAC: homes, experiences and services, with a hosting side. Local only:
no remote, nothing published. Every host, guest, listing and review in the seed data is fictional, and all
photos are generated illustrations.

The page structure follows the familiar rental-marketplace layout, captured with REA from public, logged-out
pages (structure only, see `docs/rea-teardown.md`). The brand, colours, copy and images are our own.

## Run it

```bash
npm install
npm run seed      # creates data/stays.db; add -- --reset to rebuild it (stop npm run dev first)
npm run dev       # API on http://127.0.0.1:3111, web on http://127.0.0.1:3110
```

Demo accounts (local test values, only exist in your local `data/stays.db`):

| Role  | Email              | Password       |
| ----- | ------------------ | -------------- |
| Guest | `guest@stays.test` | `stays-demo-1` |
| Host  | `host@stays.test`  | `stays-demo-1` |

## Checks

```bash
npm test          # node:test: availability, pricing, refunds, booking transactions, race test, API
npm run lint      # eslint, including Kasumi's design-system guard
npm run build     # production build of the web app
npm run test:e2e  # Playwright (Chromium, 1 worker): book a stay, book a service, host accepts a request; temp DB, ports 3120/3121
```

## What's in it

| Area | Features |
| --- | --- |
| Browse | All / Homes / Experiences / Services tabs; city rows; compact header on scroll; language and currency picker; phone bottom bar |
| Search | Where / When / Who; Dates, Months or Flexible (weekend, week, month) with ±1–14 days; full filters with live count; map with price pins; "Available for similar dates" |
| Stays | Photo tour by room, guest-favourite banner, two-month availability calendar, price breakdown, weekly and monthly discounts, custom night prices, request or Instant Book, mock pay, share and report |
| Experiences and services | Time slots with spots left; services have several offerings, qualifications, portfolio |
| Guests | Trips with cancel and refund, reviews, wishlists plus recently viewed, inbox with reservation panel, public profiles |
| Hosts | Step-by-step listing wizard, editors, night-price calendar, requests, reservations, earnings |

## How it fits together

| Folder        | What                                                                                     |
| ------------- | ---------------------------------------------------------------------------------------- |
| `shared/`     | Pure rules used by both sides: dates, availability, pricing, cancellation refunds         |
| `server/`     | Fastify API over SQLite (`node:sqlite`). Booking writes run in one `BEGIN IMMEDIATE` transaction |
| `web/`        | Vite + React on Kasumi (`file:../kasumi`); brand palette in `web/src/brand/theme.css`      |
| `scripts/`    | Seed data and the SVG illustration generator                                              |
| `docs/`       | Design spec and the REA structure teardown                                               |

No double bookings: every booking re-checks confirmed stays, pending requests (held for 24 hours) and
host-blocked nights inside a single serialised transaction. `test/race.test.js` fires two bookings for
the same nights from two threads and expects exactly one to win.

Payments are mock only (a demo card or demo UPI choice); no card details are collected.
