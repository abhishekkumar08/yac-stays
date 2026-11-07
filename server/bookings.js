import { occupiedNights, stayError } from "../shared/availability.js";
import { eachNight, localMinute, nightsBetween, todayIso } from "../shared/dates.js";
import { quoteExperience, quoteStay } from "../shared/pricing.js";
import { stayPricing } from "./cards.js";
import { refundFor } from "../shared/cancellation.js";
import { isoStamp, tx } from "./db.js";

const PENDING_HOLD_HOURS = 24;

export class AppError extends Error {
  constructor(status, code) {
    super(code);
    this.status = status;
    this.code = code;
  }
}

export const holdCutoff = (now) => isoStamp(now - PENDING_HOLD_HOURS * 3_600_000);

function blockingStays(db, listingId, now, exceptId) {
  return db
    .prepare(
      `SELECT check_in, check_out FROM bookings WHERE listing_id = ? AND id != ? AND check_out > ?
       AND (status = 'confirmed' OR (status = 'pending' AND created_at > ?))`,
    )
    .all(listingId, exceptId, todayIso(now), holdCutoff(now));
}

export function occupiedFor(db, listingId, now, exceptId = 0) {
  const blocked = db.prepare("SELECT night FROM blocked_nights WHERE listing_id = ?").all(listingId).map((r) => r.night);
  return occupiedNights(blockingStays(db, listingId, now, exceptId), blocked);
}

export function nightPrices(db, listing, checkIn, checkOut) {
  const custom = new Map(
    db.prepare("SELECT night, price FROM night_prices WHERE listing_id = ? AND night >= ? AND night < ?").all(listing.id, checkIn, checkOut).map((r) => [r.night, r.price]),
  );
  return eachNight(checkIn, checkOut).map((n) => custom.get(n) ?? listing.nightly);
}

export const stayRules = (l) => ({ minNights: l.min_nights, maxGuests: l.max_guests });
const ERROR_STATUS = { unavailable: 409 };

export function createBooking(db, input, now = Date.now()) {
  return tx(db, () => {
    const l = db.prepare("SELECT * FROM listings WHERE id = ? AND status = 'listed'").get(input.listingId);
    if (!l) throw new AppError(404, "not_found");
    if (l.host_id === input.guestId) throw new AppError(400, "own_listing");
    const err = stayError(input, stayRules(l), occupiedFor(db, l.id, now), todayIso(now));
    if (err) throw new AppError(ERROR_STATUS[err] ?? 400, err);
    const q = quoteStay(stayPricing(l, nightPrices(db, l, input.checkIn, input.checkOut)), nightsBetween(input.checkIn, input.checkOut));
    return db
      .prepare(
        `INSERT INTO bookings (listing_id, guest_id, check_in, check_out, guests, nightly, subtotal, discount,
           cleaning_fee, service_fee, total, status, paid_with, message, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`,
      )
      .get(
        l.id, input.guestId, input.checkIn, input.checkOut, input.guests, q.nightly, q.subtotal, q.discount,
        q.cleaningFee, q.serviceFee, q.total, l.instant_book ? "confirmed" : "pending", input.paidWith,
        input.message ?? "", isoStamp(now),
      );
  });
}

const setStatus = (db, id, status, refund = 0) =>
  db.prepare("UPDATE bookings SET status = ?, refund = ? WHERE id = ? RETURNING *").get(status, refund, id);

const hostBooking = (db, hostId, bookingId) =>
  db
    .prepare(
      `SELECT b.*, l.min_nights, l.max_guests FROM bookings b JOIN listings l ON l.id = b.listing_id
       WHERE b.id = ? AND l.host_id = ?`,
    )
    .get(bookingId, hostId);

export function respondToBooking(db, hostId, bookingId, decision, now = Date.now()) {
  const result = tx(db, () => {
    const b = hostBooking(db, hostId, bookingId);
    if (!b) throw new AppError(404, "not_found");
    if (b.status !== "pending") throw new AppError(409, "not_pending");
    if (b.created_at <= holdCutoff(now)) return { expired: setStatus(db, b.id, "expired") };
    if (decision === "decline") return setStatus(db, b.id, "declined");
    const err = stayError(
      { checkIn: b.check_in, checkOut: b.check_out, guests: b.guests },
      stayRules(b),
      occupiedFor(db, b.listing_id, now, b.id),
      todayIso(now),
    );
    if (err) throw new AppError(409, err);
    return setStatus(db, b.id, "confirmed");
  });
  if (result.expired) throw new AppError(409, "expired");
  return result;
}

export function cancelBooking(db, guestId, bookingId, now = Date.now()) {
  return tx(db, () => {
    const b = db
      .prepare(
        `SELECT b.*, l.cancellation_policy FROM bookings b JOIN listings l ON l.id = b.listing_id
         WHERE b.id = ? AND b.guest_id = ?`,
      )
      .get(bookingId, guestId);
    if (!b) throw new AppError(404, "not_found");
    const today = todayIso(now);
    if (!["pending", "confirmed"].includes(b.status) || b.check_in <= today) throw new AppError(409, "not_cancellable");
    const refund = b.status === "pending" ? b.total : refundFor(b.cancellation_policy, b, today).refund;
    return setStatus(db, b.id, "cancelled_by_guest", refund);
  });
}

export function cancelBookingAsHost(db, hostId, bookingId, now = Date.now()) {
  return tx(db, () => {
    const b = hostBooking(db, hostId, bookingId);
    if (!b) throw new AppError(404, "not_found");
    if (b.status !== "confirmed" || b.check_in <= todayIso(now)) throw new AppError(409, "not_cancellable");
    return setStatus(db, b.id, "cancelled_by_host", b.total);
  });
}


export function seatsTaken(db, slotId) {
  return db.prepare("SELECT coalesce(sum(guests), 0) n FROM experience_bookings WHERE slot_id = ? AND status = 'confirmed'").get(slotId).n;
}

export const SLOT_SELECT = `SELECT s.*, coalesce(t.n, 0) AS seats_taken FROM experience_slots s
  LEFT JOIN (SELECT slot_id, sum(guests) AS n FROM experience_bookings WHERE status = 'confirmed' GROUP BY slot_id) t ON t.slot_id = s.id`;

export function bookSlot(db, { slotId, guestId, guests, paidWith, offeringId }, now = Date.now()) {
  return tx(db, () => {
    const s = db
      .prepare(
        `SELECT s.*, e.host_id, e.price_per_guest FROM experience_slots s JOIN experiences e ON e.id = s.experience_id
         WHERE s.id = ? AND e.status = 'listed'`,
      )
      .get(slotId);
    if (!s) throw new AppError(404, "not_found");
    if (s.host_id === guestId) throw new AppError(400, "own_listing");
    if (s.starts_at <= localMinute(now)) throw new AppError(400, "past");
    if (!(Number.isInteger(guests) && guests >= 1)) throw new AppError(400, "max_guests");
    if (seatsTaken(db, s.id) + guests > s.capacity) throw new AppError(409, "sold_out");
    const offering = offeringId ? db.prepare("SELECT * FROM experience_offerings WHERE id = ? AND experience_id = ? AND active = 1").get(offeringId, s.experience_id) : null;
    if (offeringId && !offering) throw new AppError(400, "bad_offering");
    const q = quoteExperience(offering?.price_per_guest ?? s.price_per_guest, guests);
    return db
      .prepare(
        `INSERT INTO experience_bookings (slot_id, offering_id, guest_id, guests, subtotal, service_fee, total, status, paid_with, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'confirmed', ?, ?) RETURNING *`,
      )
      .get(s.id, offering?.id ?? null, guestId, guests, q.subtotal, q.serviceFee, q.total, paidWith, isoStamp(now));
  });
}

export function cancelSlotBooking(db, guestId, bookingId, now = Date.now()) {
  return tx(db, () => {
    const b = db
      .prepare(
        `SELECT eb.*, s.starts_at FROM experience_bookings eb JOIN experience_slots s ON s.id = eb.slot_id
         WHERE eb.id = ? AND eb.guest_id = ?`,
      )
      .get(bookingId, guestId);
    if (!b) throw new AppError(404, "not_found");
    if (b.status !== "confirmed" || b.starts_at <= localMinute(now)) throw new AppError(409, "not_cancellable");
    return db.prepare("UPDATE experience_bookings SET status = 'cancelled', refund = total WHERE id = ? RETURNING *").get(b.id);
  });
}
