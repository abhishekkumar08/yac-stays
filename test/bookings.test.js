import { test } from "node:test";
import assert from "node:assert/strict";
import {
  AppError, bookSlot, cancelBooking, cancelBookingAsHost, cancelSlotBooking, createBooking, respondToBooking,
} from "../server/bookings.js";
import { addListing, addUser, NOW, tempDb } from "./helpers.js";

const HOUR = 3_600_000;

function setup(listingOver) {
  const { db } = tempDb();
  const host = addUser(db, "host@stays.test", { isHost: 1 });
  const guest = addUser(db, "guest@stays.test");
  const other = addUser(db, "other@stays.test");
  const listingId = addListing(db, host, listingOver);
  const book = (who, checkIn, checkOut, now = NOW, guests = 2) =>
    createBooking(db, { listingId, guestId: who, checkIn, checkOut, guests, paidWith: "mock_card" }, now);
  return { db, host, guest, other, listingId, book };
}

const rejects = (fn, status, code) =>
  assert.throws(fn, (e) => e instanceof AppError && e.status === status && e.code === code);

test("instant book is confirmed with a priced quote", () => {
  const { book, guest } = setup();
  const b = book(guest, "2026-11-20", "2026-11-23");
  assert.equal(b.status, "confirmed");
  assert.equal(b.subtotal, 1200000);
  assert.equal(b.total, 1425000);
  assert.equal(b.created_at, "2026-11-01 04:30:00");
});

test("request-to-book listing creates a pending booking that blocks the nights", () => {
  const { book, guest, other } = setup({ instant_book: 0 });
  assert.equal(book(guest, "2026-11-20", "2026-11-23").status, "pending");
  rejects(() => book(other, "2026-11-22", "2026-11-24"), 409, "unavailable");
});

test("overlapping booking is rejected, back-to-back is fine", () => {
  const { book, guest, other } = setup();
  book(guest, "2026-11-20", "2026-11-23");
  rejects(() => book(other, "2026-11-21", "2026-11-25"), 409, "unavailable");
  assert.equal(book(other, "2026-11-23", "2026-11-25").status, "confirmed");
  assert.equal(book(other, "2026-11-18", "2026-11-20").status, "confirmed");
});

test("host-blocked night is unavailable", () => {
  const { db, book, guest, listingId } = setup();
  db.prepare("INSERT INTO blocked_nights VALUES (?, '2026-11-21')").run(listingId);
  rejects(() => book(guest, "2026-11-20", "2026-11-23"), 409, "unavailable");
});

test("validation errors are 400", () => {
  const { book, guest, host } = setup();
  rejects(() => book(host, "2026-11-20", "2026-11-23"), 400, "own_listing");
  rejects(() => book(guest, "2026-11-20", "2026-11-21"), 400, "min_nights");
  rejects(() => book(guest, "2026-11-20", "2026-11-23", NOW, 9), 400, "max_guests");
  rejects(() => book(guest, "2026-10-20", "2026-10-23"), 400, "past");
});

test("unlisted or missing listing is 404", () => {
  const { db, guest, listingId, book } = setup();
  db.prepare("UPDATE listings SET status = 'unlisted' WHERE id = ?").run(listingId);
  rejects(() => book(guest, "2026-11-20", "2026-11-23"), 404, "not_found");
});

test("pending older than 24 hours stops blocking and cannot be accepted", () => {
  const { db, book, guest, other, host } = setup({ instant_book: 0 });
  const p = book(guest, "2026-11-20", "2026-11-23");
  const later = NOW + 25 * HOUR;
  assert.equal(book(other, "2026-11-20", "2026-11-23", later).status, "pending");
  rejects(() => respondToBooking(db, host, p.id, "accept", later), 409, "expired");
  assert.equal(db.prepare("SELECT status FROM bookings WHERE id = ?").get(p.id).status, "expired");
});

test("host accepts or declines; decline frees the nights", () => {
  const { db, book, guest, other, host } = setup({ instant_book: 0 });
  const p = book(guest, "2026-11-20", "2026-11-23");
  rejects(() => respondToBooking(db, other, p.id, "accept", NOW), 404, "not_found");
  assert.equal(respondToBooking(db, host, p.id, "decline", NOW).status, "declined");
  const q = book(other, "2026-11-20", "2026-11-23");
  assert.equal(respondToBooking(db, host, q.id, "accept", NOW).status, "confirmed");
  rejects(() => respondToBooking(db, host, q.id, "accept", NOW), 409, "not_pending");
});

test("guest cancel applies the policy refund and frees the nights", () => {
  const { db, book, guest, other } = setup();
  const b = book(guest, "2026-11-20", "2026-11-23");
  rejects(() => cancelBooking(db, other, b.id, NOW), 404, "not_found");
  const c = cancelBooking(db, guest, b.id, Date.parse("2026-11-16T10:00:00"));
  assert.equal(c.status, "cancelled_by_guest");
  assert.equal(c.refund, 600000);
  assert.equal(book(other, "2026-11-20", "2026-11-23").status, "confirmed");
  rejects(() => cancelBooking(db, guest, b.id, NOW), 409, "not_cancellable");
});

test("host cancel refunds in full", () => {
  const { db, book, guest, host } = setup();
  const b = book(guest, "2026-11-20", "2026-11-23");
  const c = cancelBookingAsHost(db, host, b.id, NOW);
  assert.equal(c.status, "cancelled_by_host");
  assert.equal(c.refund, b.total);
});

function slotSetup(capacity = 6) {
  const { db } = tempDb();
  const host = addUser(db, "h@stays.test", { isHost: 1 });
  const guest = addUser(db, "g@stays.test");
  const expId = db
    .prepare(`INSERT INTO experiences (host_id, title, category, city, area, lat, lng, duration_min, price_per_guest, max_guests)
      VALUES (?, 'Kayak', 'outdoors', 'Goa', 'Nerul', 15.5, 73.7, 120, 125000, 6) RETURNING id`)
    .get(host).id;
  const slotId = db
    .prepare("INSERT INTO experience_slots (experience_id, starts_at, ends_at, capacity) VALUES (?, '2026-11-05T16:30', '2026-11-05T18:30', ?) RETURNING id")
    .get(expId, capacity).id;
  return { db, host, guest, slotId };
}

test("slot booking respects capacity", () => {
  const { db, guest, slotId } = slotSetup();
  const b = bookSlot(db, { slotId, guestId: guest, guests: 3, paidWith: "mock_upi" }, NOW);
  assert.equal(b.total, 375000 + 52500);
  rejects(() => bookSlot(db, { slotId, guestId: guest, guests: 4, paidWith: "mock_upi" }, NOW), 409, "sold_out");
  assert.equal(bookSlot(db, { slotId, guestId: guest, guests: 3, paidWith: "mock_upi" }, NOW).status, "confirmed");
});

test("slot booking rejects past slots and own experience; cancel frees seats", () => {
  const { db, host, guest, slotId } = slotSetup(2);
  rejects(() => bookSlot(db, { slotId, guestId: host, guests: 1, paidWith: "mock_upi" }, NOW), 400, "own_listing");
  rejects(() => bookSlot(db, { slotId, guestId: guest, guests: 1, paidWith: "mock_upi" }, Date.parse("2026-11-06T00:00:00")), 400, "past");
  const b = bookSlot(db, { slotId, guestId: guest, guests: 2, paidWith: "mock_upi" }, NOW);
  assert.equal(cancelSlotBooking(db, guest, b.id, NOW).refund, b.total);
  assert.equal(bookSlot(db, { slotId, guestId: guest, guests: 2, paidWith: "mock_upi" }, NOW).status, "confirmed");
});

test("night price overrides change the booked total", () => {
  const { db, book, guest, listingId } = setup();
  db.prepare("INSERT INTO night_prices (listing_id, night, price) VALUES (?, '2026-11-21', 900000)").run(listingId);
  const b = book(guest, "2026-11-20", "2026-11-23");
  assert.equal(b.subtotal, 400000 + 900000 + 400000);
});

test("service bookings charge the chosen offering", () => {
  const { db, guest, slotId } = slotSetup();
  const expId = db.prepare("SELECT experience_id FROM experience_slots WHERE id = ?").get(slotId).experience_id;
  const offering = db.prepare("INSERT INTO experience_offerings (experience_id, title, price_per_guest, duration_min) VALUES (?, 'Deluxe', 300000, 90) RETURNING id").get(expId).id;
  const b = bookSlot(db, { slotId, guestId: guest, guests: 2, paidWith: "mock_card", offeringId: offering }, NOW);
  assert.equal(b.subtotal, 600000);
  assert.equal(b.offering_id, offering);
  const other = addListinglessExperience(db);
  const foreign = db.prepare("INSERT INTO experience_offerings (experience_id, title, price_per_guest, duration_min) VALUES (?, 'X', 100000, 60) RETURNING id").get(other).id;
  rejects(() => bookSlot(db, { slotId, guestId: guest, guests: 1, paidWith: "mock_card", offeringId: foreign }, NOW), 400, "bad_offering");
});

function addListinglessExperience(db) {
  const host = db.prepare("SELECT id FROM users LIMIT 1").get().id;
  return db.prepare(`INSERT INTO experiences (host_id, title, category, city, area, lat, lng, duration_min, price_per_guest, max_guests, kind)
    VALUES (?, 'Chef', 'chef', 'Goa', 'Nerul', 15.5, 73.7, 120, 200000, 6, 'service') RETURNING id`).get(host).id;
}
