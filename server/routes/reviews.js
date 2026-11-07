import { localMinute, todayIso } from "../../shared/dates.js";
import { AppError } from "../bookings.js";
import { body, int, requireUser, text } from "../guards.js";
import { REVIEW_SCORES as SUB_SCORES } from "../cards.js";

const score = int(1, 5);

export default function reviewRoutes(app, { db, now }) {
  app.post("/api/reviews", {
    schema: {
      body: body(
        { kind: { type: "string", enum: ["listing", "experience"] }, bookingId: int(1), overall: score, body: text(2000, 10), ...Object.fromEntries(SUB_SCORES.map((k) => [k, score])) },
        ["kind", "bookingId", "overall", "body"],
      ),
    },
  }, (req) => {
    const user = requireUser(req);
    const r = req.body;
    const itemId = r.kind === "listing"
      ? db.prepare("SELECT listing_id AS id FROM bookings WHERE id = ? AND guest_id = ? AND status = 'confirmed' AND check_out <= ?").get(r.bookingId, user.id, todayIso(now()))?.id
      : db.prepare(`SELECT s.experience_id AS id FROM experience_bookings eb JOIN experience_slots s ON s.id = eb.slot_id
                    WHERE eb.id = ? AND eb.guest_id = ? AND eb.status = 'confirmed' AND s.ends_at <= ?`).get(r.bookingId, user.id, localMinute(now()))?.id;
    if (!itemId) throw new AppError(400, "not_reviewable");
    const subs = SUB_SCORES.map((k) => (r.kind === "listing" ? r[k] ?? r.overall : null));
    const created = db
      .prepare(`INSERT INTO reviews (kind, item_id, booking_id, author_id, overall, ${SUB_SCORES.join(", ")}, body)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT (kind, booking_id) DO NOTHING RETURNING *`)
      .get(r.kind, itemId, r.bookingId, user.id, r.overall, ...subs, r.body.trim());
    if (!created) throw new AppError(409, "already_reviewed");
    return created;
  });
}
