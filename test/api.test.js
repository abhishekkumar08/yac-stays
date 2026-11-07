import { test } from "node:test";
import assert from "node:assert/strict";
import { buildApp } from "../server/app.js";
import { addListing, addUser, NOW, tempDb } from "./helpers.js";

function setup() {
  const { db, dir } = tempDb();
  let now = NOW;
  const app = buildApp({ db, photosDir: dir, now: () => now });
  const host = addUser(db, "host@stays.test", { isHost: 1 });
  const goa = addListing(db, host, { title: "Sea flat", nightly: 300000 });
  const goaPool = addListing(db, host, { title: "Pool villa", nightly: 900000, room_type: "entire", bedrooms: 3, beds: 3 });
  const manali = addListing(db, host, { title: "Pine cabin", city: "Manali", area: "Old Manali", state: "Himachal Pradesh" });
  db.prepare("INSERT INTO listing_amenities VALUES (?, 'pool'), (?, 'wifi'), (?, 'wifi')").run(goaPool, goaPool, goa);
  db.prepare("INSERT INTO listing_photos (listing_id, file, position) VALUES (?, 'a.svg', 0)").run(goa);
  return { app, db, host, goa, goaPool, manali, setNow: (t) => (now = t) };
}

async function call(app, method, url, body, cookie) {
  const res = await app.inject({
    method, url, payload: body,
    headers: { ...(cookie ? { cookie } : {}), ...(body ? { "content-type": "application/json" } : {}) },
  });
  return { status: res.statusCode, body: res.body ? res.json() : null, cookie: res.headers["set-cookie"]?.split(";")[0] };
}

async function signup(app, email) {
  const r = await call(app, "POST", "/api/auth/signup", { email, name: email.split("@")[0], password: "stays-demo-1" });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  return r.cookie;
}

async function login(app, email) {
  return (await call(app, "POST", "/api/auth/login", { email, password: "stays-demo-1" })).cookie;
}

test("signup, login, me, logout", async () => {
  const { app } = setup();
  const c = await signup(app, "guest@stays.test");
  assert.equal((await call(app, "POST", "/api/auth/check-email", { email: "GUEST@stays.test" })).body.exists, true);
  assert.equal((await call(app, "POST", "/api/auth/signup", { email: "guest@stays.test", name: "x", password: "stays-demo-1" })).status, 409);
  assert.equal((await call(app, "POST", "/api/auth/signup", { email: "short@stays.test", name: "x", password: "123" })).status, 400);
  assert.equal((await call(app, "GET", "/api/me", null, c)).body.user.email, "guest@stays.test");
  assert.equal((await call(app, "POST", "/api/auth/login", { email: "guest@stays.test", password: "nope-nope" })).status, 401);
  await call(app, "POST", "/api/auth/logout", {}, c);
  assert.equal((await call(app, "GET", "/api/me", null, c)).body.user, null);
});

test("mutations need a JSON body (CSRF guard) and a session", async () => {
  const { app, goa } = setup();
  const res = await app.inject({ method: "POST", url: "/api/bookings", payload: "a=b", headers: { "content-type": "application/x-www-form-urlencoded" } });
  assert.equal(res.statusCode, 415);
  assert.equal((await call(app, "POST", "/api/bookings", { listingId: goa, checkIn: "2026-11-20", checkOut: "2026-11-23", guests: 2, paidWith: "mock_card" })).status, 401);
});

test("search filters by place, price, room, amenities, dates and paginates", async () => {
  const { app, goa, goaPool } = setup();
  const s = async (q) => (await call(app, "GET", `/api/search?${q}`)).body;
  assert.equal((await s("where=goa")).total, 2);
  assert.deepEqual((await s("where=Goa&maxPrice=5000")).items.map((i) => i.id), [goa]);
  assert.deepEqual((await s("where=Goa&amenities=pool")).items.map((i) => i.id), [goaPool]);
  assert.deepEqual((await s("where=Goa&bedrooms=2")).items.map((i) => i.id), [goaPool]);
  const dated = await s("where=Goa&checkin=2026-11-20&checkout=2026-11-23&guests=2");
  assert.equal(dated.items.find((i) => i.id === goa).price.total, 900000 + 50000 + Math.round(950000 * 0.14));
  const c = await signup(app, "guest@stays.test");
  await call(app, "POST", "/api/bookings", { listingId: goa, checkIn: "2026-11-21", checkOut: "2026-11-24", guests: 2, paidWith: "mock_card" }, c);
  assert.deepEqual((await s("where=Goa&checkin=2026-11-20&checkout=2026-11-23")).items.map((i) => i.id), [goaPool]);
  assert.equal((await s("where=nowhere")).total, 0);
  assert.equal((await s("checkin=bad&checkout=2026-11-23")).error, "invalid_dates");
});

test("listing detail, availability and home rows", async () => {
  const { app, goa } = setup();
  const d = (await call(app, "GET", `/api/listings/${goa}`)).body;
  assert.equal(d.title, "Sea flat");
  assert.deepEqual(d.amenities, ["wifi"]);
  assert.equal(d.host.name, "host");
  assert.equal((await call(app, "GET", "/api/listings/9999")).status, 404);
  const a = (await call(app, "GET", `/api/listings/${goa}/availability`)).body;
  assert.equal(a.minNights, 2);
  assert.deepEqual(a.occupied, []);
  const home = (await call(app, "GET", "/api/home")).body;
  assert.deepEqual(home.rows.map((r) => r.city).sort(), ["Goa", "Manali"]);
});

test("book, conflict, trips, cancel with refund", async () => {
  const { app, goa } = setup();
  const g1 = await signup(app, "g1@stays.test");
  const g2 = await signup(app, "g2@stays.test");
  const body = { listingId: goa, checkIn: "2026-11-20", checkOut: "2026-11-23", guests: 2, paidWith: "mock_card", message: "Hi!" };
  const b = await call(app, "POST", "/api/bookings", body, g1);
  assert.equal(b.status, 200);
  assert.equal(b.body.status, "confirmed");
  assert.deepEqual((await call(app, "POST", "/api/bookings", body, g2)).body, { error: "unavailable" });
  assert.equal((await call(app, "POST", "/api/bookings", { ...body, paidWith: "real_card" }, g2)).status, 400);
  const trips = (await call(app, "GET", "/api/trips", null, g1)).body;
  assert.equal(trips.stays[0].listing.title, "Sea flat");
  assert.equal((await call(app, "GET", "/api/threads", null, g1)).body.length, 1);
  assert.equal((await call(app, "POST", `/api/bookings/${b.body.id}/cancel`, {}, g2)).status, 404);
  const c = await call(app, "POST", `/api/bookings/${b.body.id}/cancel`, {}, g1);
  assert.equal(c.body.refund, b.body.total);
});

test("host accepts a request; other users cannot touch host data", async () => {
  const { app, db, goa } = setup();
  db.prepare("UPDATE listings SET instant_book = 0 WHERE id = ?").run(goa);
  const hostC = await login(app, "host@stays.test");
  assert.equal(hostC, undefined);
  db.prepare("UPDATE users SET password_hash = ? WHERE email = 'host@stays.test'").run((await import("../server/auth.js")).hashPassword("stays-demo-1"));
  const h = await login(app, "host@stays.test");
  const g = await signup(app, "g@stays.test");
  const b = (await call(app, "POST", "/api/bookings", { listingId: goa, checkIn: "2026-11-20", checkOut: "2026-11-23", guests: 2, paidWith: "mock_upi", message: "Can we come?" }, g)).body;
  assert.equal(b.status, "pending");
  assert.equal((await call(app, "POST", `/api/host/bookings/${b.id}/respond`, { decision: "accept" }, g)).status, 403);
  const today = (await call(app, "GET", "/api/host/today", null, h)).body;
  assert.equal(today.requests.length, 1);
  assert.equal((await call(app, "POST", `/api/host/bookings/${b.id}/respond`, { decision: "accept" }, h)).body.status, "confirmed");
  assert.equal((await call(app, "PUT", `/api/host/listings/${goa}`, { title: "Mine now" }, g)).status, 403);
  await call(app, "POST", "/api/host/become", {}, g);
  assert.equal((await call(app, "PUT", `/api/host/listings/${goa}`, { title: "Mine now" }, g)).status, 404);
  assert.equal((await call(app, "PUT", `/api/host/listings/${goa}`, { title: "Renamed" }, h)).body.title, "Renamed");
  const blocked = await call(app, "POST", `/api/host/listings/${goa}/blocked`, { nights: ["2026-12-01"], blocked: true }, h);
  assert.equal(blocked.status, 200);
  assert.deepEqual((await call(app, "GET", `/api/listings/${goa}/availability`)).body.occupied.sort(), ["2026-11-20", "2026-11-21", "2026-11-22", "2026-12-01"]);
  const earn = (await call(app, "GET", "/api/host/earnings", null, h)).body;
  assert.equal(earn.months[0].month, "2026-11");
  assert.ok(earn.months[0].payout > 0);
});

test("host creates a listing with a photo", async () => {
  const { app } = setup();
  const g = await signup(app, "newhost@stays.test");
  await call(app, "POST", "/api/host/become", {}, g);
  const l = (await call(app, "POST", "/api/host/listings", {
    title: "New loft", description: "Bright", propertyType: "Loft", roomType: "entire", city: "Jaipur", area: "C-Scheme",
    state: "Rajasthan", lat: 26.9, lng: 75.8, maxGuests: 2, bedrooms: 1, beds: 1, bathrooms: 1, nightly: 250000,
    cleaningFee: 30000, weeklyDiscountPct: 5, minNights: 1, instantBook: true, cancellationPolicy: "flexible",
    houseRules: "No parties", amenities: ["wifi", "kitchen"],
  }, g)).body;
  assert.equal(l.title, "New loft");
  const png = "data:image/png;base64," + Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3]).toString("base64");
  assert.equal((await call(app, "POST", `/api/host/listings/${l.id}/photos`, { dataUrl: png }, g)).status, 200);
  const fake = "data:image/png;base64," + Buffer.from("<svg></svg>").toString("base64");
  assert.equal((await call(app, "POST", `/api/host/listings/${l.id}/photos`, { dataUrl: fake }, g)).status, 400);
  assert.equal((await call(app, "GET", "/photos/..%2Fsecret.db")).status, 404);
});

test("reviews only after checkout, only once, only by the guest", async () => {
  const { app, goa, setNow } = setup();
  const g = await signup(app, "g@stays.test");
  const b = (await call(app, "POST", "/api/bookings", { listingId: goa, checkIn: "2026-11-20", checkOut: "2026-11-23", guests: 2, paidWith: "mock_card" }, g)).body;
  const review = { kind: "listing", bookingId: b.id, overall: 5, cleanliness: 5, accuracy: 4, checkin: 5, communication: 5, location: 4, value: 5, body: "Lovely clean place near the beach" };
  assert.equal((await call(app, "POST", "/api/reviews", review, g)).body.error, "not_reviewable");
  setNow(Date.parse("2026-11-24T10:00:00"));
  const other = await signup(app, "o@stays.test");
  assert.equal((await call(app, "POST", "/api/reviews", review, other)).body.error, "not_reviewable");
  assert.equal((await call(app, "POST", "/api/reviews", review, g)).status, 200);
  assert.equal((await call(app, "POST", "/api/reviews", review, g)).status, 409);
  const d = (await call(app, "GET", `/api/listings/${goa}`)).body;
  assert.equal(d.reviewCount, 1);
  assert.equal(d.scores.accuracy, 4);
  assert.ok(d.tags.includes("beach"));
});

test("wishlists are private to their owner", async () => {
  const { app, goa } = setup();
  const a = await signup(app, "a@stays.test");
  const b = await signup(app, "b@stays.test");
  const w = (await call(app, "POST", "/api/wishlists", { name: "Goa trip", item: { kind: "listing", id: goa } }, a)).body;
  assert.deepEqual((await call(app, "GET", "/api/wishlists/saved", null, a)).body.listing, [goa]);
  assert.equal((await call(app, "GET", `/api/wishlists/${w.id}`, null, b)).status, 404);
  assert.equal((await call(app, "POST", `/api/wishlists/${w.id}/items`, { kind: "listing", id: goa }, b)).status, 404);
  assert.equal((await call(app, "GET", `/api/wishlists/${w.id}`, null, a)).body.items[0].id, goa);
  await call(app, "DELETE", `/api/saved/listing/${goa}`, null, a);
  assert.deepEqual((await call(app, "GET", "/api/wishlists/saved", null, a)).body.listing, []);
});

test("message threads are visible only to participants", async () => {
  const { app, goa } = setup();
  const g = await signup(app, "g@stays.test");
  const o = await signup(app, "o@stays.test");
  const t = (await call(app, "POST", "/api/threads", { kind: "listing", itemId: goa, body: "Is parking free?" }, g)).body;
  assert.equal((await call(app, "GET", `/api/threads/${t.id}`, null, o)).status, 404);
  assert.equal((await call(app, "POST", `/api/threads/${t.id}/messages`, { body: "hi" }, o)).status, 404);
  assert.equal((await call(app, "GET", `/api/threads/${t.id}`, null, g)).body.messages.length, 1);
});

test("experience slots sell out", async () => {
  const { app, db, host } = setup();
  const e = db.prepare(`INSERT INTO experiences (host_id, title, category, city, area, lat, lng, duration_min, price_per_guest, max_guests)
    VALUES (?, 'Kayak', 'outdoors', 'Goa', 'Nerul', 15.5, 73.7, 120, 125000, 4) RETURNING id`).get(host).id;
  const slot = db.prepare("INSERT INTO experience_slots (experience_id, starts_at, ends_at, capacity) VALUES (?, '2026-11-05T16:30', '2026-11-05T18:30', 4) RETURNING id").get(e).id;
  const g = await signup(app, "g@stays.test");
  const detail = (await call(app, "GET", `/api/experiences/${e}`)).body;
  assert.equal(detail.slots[0].seatsLeft, 4);
  assert.equal((await call(app, "POST", "/api/experience-bookings", { slotId: slot, guests: 3, paidWith: "mock_card" }, g)).status, 200);
  assert.deepEqual((await call(app, "POST", "/api/experience-bookings", { slotId: slot, guests: 2, paidWith: "mock_card" }, g)).body, { error: "sold_out" });
  assert.equal((await call(app, "GET", "/api/trips", null, g)).body.experiences.length, 1);
  assert.equal((await call(app, "GET", "/api/experiences?where=goa")).body.items.length, 1);
});

test("flexible search finds shifted or weekend windows", async () => {
  const { app, db, goa } = setup();
  db.prepare("INSERT INTO blocked_nights VALUES (?, '2026-11-20'), (?, '2026-11-21'), (?, '2026-11-22')").run(goa, goa, goa);
  const s = async (q) => (await call(app, "GET", `/api/search?where=Goa&${q}`)).body;
  assert.equal((await s("checkin=2026-11-20&checkout=2026-11-22")).items.some((i) => i.id === goa), false);
  const flex = (await s("checkin=2026-11-20&checkout=2026-11-22&flex=3")).items.find((i) => i.id === goa);
  assert.deepEqual(flex.window, { checkIn: "2026-11-18", checkOut: "2026-11-20" });
  assert.equal(flex.shifted, true);
  const weekend = (await s("flexKind=weekend&flexMonths=2026-11")).items.find((i) => i.id === goa);
  assert.equal(new Date(`${weekend.window.checkIn}T00:00:00Z`).getUTCDay(), 5);
  assert.equal(weekend.price.nights, 2);
  const res = await s("checkin=2026-11-24&checkout=2026-11-26");
  assert.ok(res.prices.buckets.length > 0);
});

test("services are listed separately and expose offerings", async () => {
  const { app, db, host } = setup();
  const svc = db.prepare(`INSERT INTO experiences (host_id, kind, title, category, city, area, lat, lng, duration_min, price_per_guest, max_guests)
    VALUES (?, 'service', 'Private chef dinner', 'chef', 'Goa', 'Assagao', 15.6, 73.8, 120, 250000, 8) RETURNING id`).get(host).id;
  db.prepare("INSERT INTO experience_offerings (experience_id, title, price_per_guest, duration_min) VALUES (?, 'Goan feast', 180000, 120), (?, 'Tasting menu', 320000, 150)").run(svc, svc);
  const list = (await call(app, "GET", "/api/experiences?kind=service")).body;
  assert.deepEqual(list.items.map((i) => i.id), [svc]);
  assert.equal(list.items[0].pricePerGuest, 180000);
  assert.equal((await call(app, "GET", "/api/experiences")).body.items.length, 0);
  const d = (await call(app, "GET", `/api/experiences/${svc}`)).body;
  assert.deepEqual(d.offerings.map((o) => o.title), ["Goan feast", "Tasting menu"]);
});

test("host sets custom night prices that guests pay", async () => {
  const { app, db, goa } = setup();
  db.prepare("UPDATE users SET password_hash = ? WHERE email = 'host@stays.test'").run((await import("../server/auth.js")).hashPassword("stays-demo-1"));
  const h = await login(app, "host@stays.test");
  assert.equal((await call(app, "POST", `/api/host/listings/${goa}/prices`, { nights: ["2026-11-21"], price: 1000000 }, h)).status, 200);
  assert.equal((await call(app, "GET", `/api/listings/${goa}/availability`)).body.prices["2026-11-21"], 1000000);
  const g = await signup(app, "g@stays.test");
  const b = (await call(app, "POST", "/api/bookings", { listingId: goa, checkIn: "2026-11-20", checkOut: "2026-11-23", guests: 2, paidWith: "mock_card" }, g)).body;
  assert.equal(b.subtotal, 300000 + 1000000 + 300000);
  await call(app, "POST", `/api/host/listings/${goa}/prices`, { nights: ["2026-11-21"], price: null }, h);
  assert.deepEqual((await call(app, "GET", `/api/listings/${goa}/availability`)).body.prices, {});
});

test("recently viewed, public profile and reports", async () => {
  const { app, goa, host } = setup();
  const g = await signup(app, "g@stays.test");
  await call(app, "GET", `/api/listings/${goa}`, null, g);
  assert.deepEqual((await call(app, "GET", "/api/wishlists/recent", null, g)).body.map((l) => l.id), [goa]);
  const p = (await call(app, "GET", `/api/users/${host}`)).body;
  assert.equal(p.isHost, true);
  assert.equal(p.listings.length, 3);
  assert.equal((await call(app, "POST", `/api/listings/${goa}/report`, { reason: "Inaccurate" }, g)).status, 200);
});

test("editing a service keeps offerings that have bookings, without duplicating them", async () => {
  const { app, db } = setup();
  const h = await signup(app, "svc-host@stays.test");
  await call(app, "POST", "/api/host/become", {}, h);
  const base = { kind: "service", title: "Chef table", category: "chef", city: "Goa", area: "Assagao", lat: 15.6, lng: 73.8, durationMin: 120, pricePerGuest: 200000, maxGuests: 6 };
  const created = (await call(app, "POST", "/api/host/experiences", { ...base, offerings: [{ title: "Feast", pricePerGuest: 200000, durationMin: 120 }, { title: "Tasting", pricePerGuest: 300000, durationMin: 150 }] }, h)).body;
  const [feast, tasting] = created.offerings;
  const slot = db.prepare("INSERT INTO experience_slots (experience_id, starts_at, ends_at, capacity) VALUES (?, '2026-11-05T19:00', '2026-11-05T21:00', 6) RETURNING id").get(created.id).id;
  const g = await signup(app, "diner@stays.test");
  assert.equal((await call(app, "POST", "/api/experience-bookings", { slotId: slot, guests: 2, paidWith: "mock_card", offeringId: feast.id }, g)).status, 200);
  const edited = (await call(app, "PUT", `/api/host/experiences/${created.id}`, { offerings: [{ id: feast.id, title: "Big feast", pricePerGuest: 210000, durationMin: 120 }] }, h)).body;
  assert.deepEqual(edited.offerings.map((o) => [o.id, o.title]), [[feast.id, "Big feast"]]);
  await call(app, "PUT", `/api/host/experiences/${created.id}`, { offerings: [{ title: "Brunch", pricePerGuest: 150000, durationMin: 90 }] }, h);
  const pub = (await call(app, "GET", `/api/experiences/${created.id}`)).body;
  assert.deepEqual(pub.offerings.map((o) => o.title), ["Brunch"]);
  assert.equal(db.prepare("SELECT count(*) n FROM experience_offerings WHERE title = ?").get(tasting.title).n, 0);
  assert.equal(db.prepare("SELECT active FROM experience_offerings WHERE id = ?").get(feast.id).active, 0);
});

test("reporting a listing needs a signed-in user and counts once per user", async () => {
  const { app, db, goa } = setup();
  assert.equal((await call(app, "POST", `/api/listings/${goa}/report`, { reason: "Scam" })).status, 401);
  const g = await signup(app, "r@stays.test");
  await call(app, "POST", `/api/listings/${goa}/report`, { reason: "Scam" }, g);
  await call(app, "POST", `/api/listings/${goa}/report`, { reason: "Scam again" }, g);
  assert.equal(db.prepare("SELECT count(*) n FROM reports").get().n, 1);
});
