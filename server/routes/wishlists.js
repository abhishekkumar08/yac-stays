import { AppError } from "../bookings.js";
import { EXPERIENCE_SELECT, experienceCard, LISTING_SELECT, listingCard } from "../cards.js";
import { body, idParam, int, requireUser, text } from "../guards.js";

const kind = { type: "string", enum: ["listing", "experience"] };
const item = body({ kind, id: int(1) });

export default function wishlistRoutes(app, { db }) {
  const own = (userId, id) => {
    const w = db.prepare("SELECT * FROM wishlists WHERE id = ? AND user_id = ?").get(id, userId);
    if (!w) throw new AppError(404, "not_found");
    return w;
  };
  const addItem = (wishlistId, it) => {
    const table = it.kind === "listing" ? "listings" : "experiences";
    if (!db.prepare(`SELECT 1 FROM ${table} WHERE id = ?`).get(it.id)) throw new AppError(404, "not_found");
    db.prepare("INSERT OR IGNORE INTO wishlist_items (wishlist_id, kind, item_id) VALUES (?, ?, ?)").run(wishlistId, it.kind, it.id);
  };

  app.get("/api/wishlists", (req) => {
    const user = requireUser(req);
    return db
      .prepare(`SELECT w.id, w.name, count(i.item_id) AS count,
                  (SELECT p.file FROM wishlist_items wi JOIN listing_photos p ON p.listing_id = wi.item_id AND wi.kind = 'listing'
                   WHERE wi.wishlist_id = w.id ORDER BY wi.created_at DESC, p.position LIMIT 1) AS cover
                FROM wishlists w LEFT JOIN wishlist_items i ON i.wishlist_id = w.id WHERE w.user_id = ? GROUP BY w.id ORDER BY w.id DESC`)
      .all(user.id);
  });

  app.get("/api/wishlists/recent", (req) => {
    const user = requireUser(req);
    return db
      .prepare(`${LISTING_SELECT} JOIN recently_viewed rv ON rv.listing_id = l.id AND rv.user_id = ? ORDER BY rv.viewed_at DESC LIMIT 24`)
      .all(user.id)
      .map((r) => listingCard(r));
  });

  app.get("/api/wishlists/saved", (req) => {
    const user = requireUser(req);
    const rows = db.prepare("SELECT DISTINCT i.kind, i.item_id FROM wishlist_items i JOIN wishlists w ON w.id = i.wishlist_id WHERE w.user_id = ?").all(user.id);
    return { listing: rows.filter((r) => r.kind === "listing").map((r) => r.item_id), experience: rows.filter((r) => r.kind === "experience").map((r) => r.item_id) };
  });

  app.get("/api/wishlists/:id", { schema: { params: idParam } }, (req) => {
    const w = own(requireUser(req).id, req.params.id);
    const items = db.prepare("SELECT kind, item_id FROM wishlist_items WHERE wishlist_id = ? ORDER BY created_at DESC").all(w.id);
    const listing = db.prepare(`${LISTING_SELECT} WHERE l.id = ?`);
    const experience = db.prepare(`${EXPERIENCE_SELECT} WHERE e.id = ?`);
    return {
      id: w.id,
      name: w.name,
      items: items
        .map((i) => {
          const row = (i.kind === "listing" ? listing : experience).get(i.item_id);
          return row && { kind: i.kind, ...(i.kind === "listing" ? listingCard(row) : experienceCard(row)) };
        })
        .filter(Boolean),
    };
  });

  app.post("/api/wishlists", { schema: { body: body({ name: text(50, 1), item }, ["name"]) } }, (req) => {
    const user = requireUser(req);
    const w = db.prepare("INSERT INTO wishlists (user_id, name) VALUES (?, ?) RETURNING id, name").get(user.id, req.body.name.trim());
    if (req.body.item) addItem(w.id, req.body.item);
    return w;
  });

  app.post("/api/wishlists/:id/items", { schema: { params: idParam, body: item } }, (req) => {
    const w = own(requireUser(req).id, req.params.id);
    addItem(w.id, req.body);
    return { ok: true };
  });

  app.delete("/api/wishlists/:id", { schema: { params: idParam } }, (req) => {
    const w = own(requireUser(req).id, req.params.id);
    db.prepare("DELETE FROM wishlists WHERE id = ?").run(w.id);
    return { ok: true };
  });

  app.delete("/api/saved/:kind/:id", { schema: { params: { type: "object", properties: { kind, id: int(1) }, required: ["kind", "id"] } } }, (req) => {
    const user = requireUser(req);
    db.prepare("DELETE FROM wishlist_items WHERE kind = ? AND item_id = ? AND wishlist_id IN (SELECT id FROM wishlists WHERE user_id = ?)").run(req.params.kind, req.params.id, user.id);
    return { ok: true };
  });
}
