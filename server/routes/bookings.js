import { todayIso } from "../../shared/dates.js";
import { refundFor } from "../../shared/cancellation.js";
import { PAYMENT_METHODS } from "../../shared/pricing.js";
import { bookSlot, cancelBooking, cancelSlotBooking, createBooking } from "../bookings.js";
import { LISTING_SELECT, listingCard } from "../cards.js";
import { body, idParam, int, isoDate, requireUser, text } from "../guards.js";
import { postMessage } from "./messages.js";

const paidWith = { type: "string", enum: PAYMENT_METHODS };

export function stayPhase(b, today) {
  if (["declined", "expired", "cancelled_by_guest", "cancelled_by_host"].includes(b.status)) return "cancelled";
  if (b.status === "pending") return "requested";
  if (b.check_out <= today) return "past";
  if (b.check_in <= today) return "current";
  return "upcoming";
}

export default function bookingRoutes(app, { db, now }) {
  app.post("/api/bookings", {
    schema: { body: body({ listingId: int(1), checkIn: isoDate, checkOut: isoDate, guests: int(1, 50), paidWith, message: text(2000) }, ["listingId", "checkIn", "checkOut", "guests", "paidWith"]) },
  }, (req) => {
    const user = requireUser(req);
    const b = createBooking(db, { ...req.body, guestId: user.id }, now());
    if (req.body.message?.trim()) postMessage(db, { guestId: user.id, kind: "listing", itemId: b.listing_id, senderId: user.id, body: req.body.message.trim() });
    return b;
  });

  app.get("/api/trips", (req) => {
    const user = requireUser(req);
    const today = todayIso(now());
    const stays = db
      .prepare("SELECT b.*, l.cancellation_policy FROM bookings b JOIN listings l ON l.id = b.listing_id WHERE b.guest_id = ? ORDER BY b.check_in DESC")
      .all(user.id);
    const reviewed = new Set(db.prepare("SELECT booking_id FROM reviews WHERE kind = 'listing' AND author_id = ?").all(user.id).map((r) => r.booking_id));
    const listingStmt = db.prepare(`${LISTING_SELECT} WHERE l.id = ?`);
    const experiences = db
      .prepare(`SELECT eb.*, s.starts_at, s.ends_at, e.id AS experience_id, e.kind, e.title, e.city, e.area, o.title AS offering_title,
                  (SELECT file FROM experience_photos p WHERE p.experience_id = e.id ORDER BY position LIMIT 1) AS photo,
                  EXISTS (SELECT 1 FROM reviews r WHERE r.kind = 'experience' AND r.booking_id = eb.id) AS reviewed
                FROM experience_bookings eb JOIN experience_slots s ON s.id = eb.slot_id JOIN experiences e ON e.id = s.experience_id
                LEFT JOIN experience_offerings o ON o.id = eb.offering_id
                WHERE eb.guest_id = ? ORDER BY s.starts_at DESC`)
      .all(user.id);
    return {
      today,
      stays: stays.map((b) => {
        const phase = stayPhase(b, today);
        const cancellable = phase === "requested" || phase === "upcoming";
        const refundPreview = !cancellable ? null : b.status === "pending" ? b.total : refundFor(b.cancellation_policy, b, today).refund;
        return { ...b, phase, refundPreview, canReview: phase === "past" && b.status === "confirmed" && !reviewed.has(b.id), listing: listingCard(listingStmt.get(b.listing_id)) };
      }),
      experiences: experiences.map((e) => ({ ...e, reviewed: !!e.reviewed })),
    };
  });

  app.post("/api/bookings/:id/cancel", { schema: { params: idParam } }, (req) => cancelBooking(db, requireUser(req).id, req.params.id, now()));

  app.post("/api/experience-bookings", { schema: { body: body({ slotId: int(1), guests: int(1, 50), paidWith, offeringId: int(1) }, ["slotId", "guests", "paidWith"]) } }, (req) =>
    bookSlot(db, { ...req.body, guestId: requireUser(req).id }, now()));

  app.post("/api/experience-bookings/:id/cancel", { schema: { params: idParam } }, (req) => cancelSlotBooking(db, requireUser(req).id, req.params.id, now()));
}
