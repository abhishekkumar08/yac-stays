import { AppError } from "../bookings.js";
import { body, idParam, int, requireUser, text } from "../guards.js";

const ITEM_TABLE = { listing: "listings", experience: "experiences" };

export function postMessage(db, { guestId, kind, itemId, senderId, body: msg }) {
  const item = db.prepare(`SELECT host_id FROM ${ITEM_TABLE[kind]} WHERE id = ?`).get(itemId);
  if (!item) throw new AppError(404, "not_found");
  if (item.host_id === guestId) throw new AppError(400, "own_listing");
  const thread = db
    .prepare(`INSERT INTO threads (guest_id, host_id, kind, item_id) VALUES (?, ?, ?, ?)
              ON CONFLICT (guest_id, host_id, kind, item_id) DO UPDATE SET kind = excluded.kind RETURNING *`)
    .get(guestId, item.host_id, kind, itemId);
  db.prepare("INSERT INTO messages (thread_id, sender_id, body) VALUES (?, ?, ?)").run(thread.id, senderId, msg);
  return thread;
}

export default function messageRoutes(app, { db }) {
  const participant = (userId, id) => {
    const t = db.prepare("SELECT * FROM threads WHERE id = ? AND (guest_id = ? OR host_id = ?)").get(id, userId, userId);
    if (!t) throw new AppError(404, "not_found");
    return t;
  };

  app.get("/api/threads", (req) => {
    const user = requireUser(req);
    return db
      .prepare(`SELECT t.id, t.kind, t.item_id AS itemId,
                  CASE WHEN t.guest_id = ?1 THEN h.name ELSE g.name END AS otherName,
                  CASE WHEN t.guest_id = ?1 THEN h.avatar_hue ELSE g.avatar_hue END AS otherHue,
                  CASE WHEN t.guest_id = ?1 THEN 'guest' ELSE 'host' END AS role,
                  coalesce(l.title, e.title) AS itemTitle,
                  m.body AS lastBody, m.created_at AS lastAt,
                  (SELECT count(*) FROM messages x WHERE x.thread_id = t.id AND x.sender_id != ?1 AND x.read_at IS NULL) AS unread
                FROM threads t
                JOIN users g ON g.id = t.guest_id JOIN users h ON h.id = t.host_id
                LEFT JOIN listings l ON t.kind = 'listing' AND l.id = t.item_id
                LEFT JOIN experiences e ON t.kind = 'experience' AND e.id = t.item_id
                JOIN messages m ON m.id = (SELECT max(id) FROM messages WHERE thread_id = t.id)
                WHERE t.guest_id = ?1 OR t.host_id = ?1 ORDER BY m.id DESC`)
      .all(user.id);
  });

  app.post("/api/threads", { schema: { body: body({ kind: { type: "string", enum: ["listing", "experience"] }, itemId: int(1), body: text(2000, 1) }) } }, (req) => {
    const user = requireUser(req);
    return postMessage(db, { guestId: user.id, kind: req.body.kind, itemId: req.body.itemId, senderId: user.id, body: req.body.body.trim() });
  });

  app.get("/api/threads/:id", { schema: { params: idParam } }, (req) => {
    const user = requireUser(req);
    const t = participant(user.id, req.params.id);
    db.prepare("UPDATE messages SET read_at = CURRENT_TIMESTAMP WHERE thread_id = ? AND sender_id != ? AND read_at IS NULL").run(t.id, user.id);
    const other = db.prepare("SELECT id, name, avatar_hue AS avatarHue FROM users WHERE id = ?").get(t.guest_id === user.id ? t.host_id : t.guest_id);
    const item = db.prepare(`SELECT id, title, city FROM ${ITEM_TABLE[t.kind]} WHERE id = ?`).get(t.item_id);
    const booking = t.kind === "listing"
      ? db.prepare("SELECT id, check_in, check_out, guests, total, status FROM bookings WHERE listing_id = ? AND guest_id = ? ORDER BY id DESC LIMIT 1").get(t.item_id, t.guest_id) ?? null
      : null;
    const photo = db.prepare(`SELECT file FROM ${t.kind === "listing" ? "listing_photos WHERE listing_id" : "experience_photos WHERE experience_id"} = ? ORDER BY position LIMIT 1`).get(t.item_id)?.file ?? null;
    return {
      id: t.id, kind: t.kind, role: t.guest_id === user.id ? "guest" : "host", other, item, booking, photo,
      messages: db.prepare("SELECT id, sender_id AS senderId, body, created_at AS createdAt FROM messages WHERE thread_id = ? ORDER BY id").all(t.id),
    };
  });

  app.post("/api/threads/:id/messages", { schema: { params: idParam, body: body({ body: text(2000, 1) }) } }, (req) => {
    const user = requireUser(req);
    const t = participant(user.id, req.params.id);
    return db.prepare("INSERT INTO messages (thread_id, sender_id, body) VALUES (?, ?, ?) RETURNING *").get(t.id, user.id, req.body.body.trim());
  });
}
