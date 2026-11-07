import { addDays, addMinutes, isIsoDate, localMinute, todayIso } from "../../shared/dates.js";
import { hostPayout } from "../../shared/pricing.js";
import { POLICIES } from "../../shared/cancellation.js";
import { AppError, cancelBookingAsHost, holdCutoff, respondToBooking, seatsTaken, SLOT_SELECT } from "../bookings.js";
import { body, idParam, int, requireHost, requireUser, text } from "../guards.js";
import { stayPhase } from "./bookings.js";
import { CATEGORIES, SERVICE_CATEGORIES } from "./experiences.js";
import { savePhoto } from "./photos.js";

const LISTING_FIELDS = {
  title: ["title", text(80, 3)],
  description: ["description", text(4000)],
  propertyType: ["property_type", text(40, 2)],
  roomType: ["room_type", { type: "string", enum: ["entire", "private", "shared"] }],
  city: ["city", text(60, 2)],
  area: ["area", text(60, 2)],
  state: ["state", text(60, 2)],
  lat: ["lat", { type: "number", minimum: -90, maximum: 90 }],
  lng: ["lng", { type: "number", minimum: -180, maximum: 180 }],
  maxGuests: ["max_guests", int(1, 30)],
  bedrooms: ["bedrooms", int(0, 30)],
  beds: ["beds", int(1, 50)],
  bathrooms: ["bathrooms", { type: "number", minimum: 0, maximum: 30 }],
  nightly: ["nightly", int(10000, 100000000)],
  cleaningFee: ["cleaning_fee", int(0, 10000000)],
  weeklyDiscountPct: ["weekly_discount_pct", int(0, 90)],
  monthlyDiscountPct: ["monthly_discount_pct", int(0, 90)],
  minNights: ["min_nights", int(1, 30)],
  instantBook: ["instant_book", { type: "boolean" }],
  cancellationPolicy: ["cancellation_policy", { type: "string", enum: POLICIES }],
  houseRules: ["house_rules", text(2000)],
  highlights: ["highlights", { type: "array", maxItems: 6, items: { type: "object" } }],
  sleeping: ["sleeping", { type: "array", maxItems: 12, items: { type: "object" } }],
  status: ["status", { type: "string", enum: ["listed", "unlisted"] }],
};
const EXPERIENCE_FIELDS = {
  kind: ["kind", { type: "string", enum: ["experience", "service"] }],
  providedAt: ["provided_at", text(120)],
  qualifications: ["qualifications", { type: "array", maxItems: 8, items: text(200, 1) }],
  title: ["title", text(80, 3)],
  description: ["description", text(4000)],
  category: ["category", { type: "string", enum: [...CATEGORIES, ...SERVICE_CATEGORIES] }],
  city: ["city", text(60, 2)],
  area: ["area", text(60, 2)],
  lat: ["lat", { type: "number", minimum: -90, maximum: 90 }],
  lng: ["lng", { type: "number", minimum: -180, maximum: 180 }],
  durationMin: ["duration_min", int(15, 1440)],
  pricePerGuest: ["price_per_guest", int(10000, 100000000)],
  maxGuests: ["max_guests", int(1, 100)],
  meetingPoint: ["meeting_point", text(200)],
  whatToBring: ["what_to_bring", text(1000)],
  activityLevel: ["activity_level", text(200)],
  guestRequirements: ["guest_requirements", text(1000)],
  status: ["status", { type: "string", enum: ["listed", "unlisted"] }],
};
const LISTING_REQUIRED = ["title", "propertyType", "roomType", "city", "area", "state", "lat", "lng", "maxGuests", "bedrooms", "beds", "bathrooms", "nightly"];
const EXPERIENCE_REQUIRED = ["title", "category", "city", "area", "lat", "lng", "durationMin", "pricePerGuest", "maxGuests"];
const amenities = { type: "array", maxItems: 60, items: text(40, 1) };
const steps = { type: "array", maxItems: 10, items: body({ title: text(80, 1), body: text(400) }, ["title"]) };
const offerings = {
  type: "array",
  maxItems: 8,
  items: body({ id: int(1), title: text(80, 1), description: text(400), pricePerGuest: int(10000, 100000000), durationMin: int(15, 1440) }, ["title", "pricePerGuest", "durationMin"]),
};

const schemaFor = (fields, extra, required) => body({ ...Object.fromEntries(Object.entries(fields).map(([k, [, s]]) => [k, s])), ...extra }, required);

function toColumns(fields, input) {
  return Object.entries(fields)
    .filter(([k]) => input[k] !== undefined)
    .map(([k, [col]]) => {
      const v = input[k];
      return [col, typeof v === "boolean" ? Number(v) : Array.isArray(v) ? JSON.stringify(v) : v];
    });
}

function insertRow(db, table, cols) {
  return db.prepare(`INSERT INTO ${table} (${cols.map(([c]) => c).join(", ")}) VALUES (${cols.map(() => "?").join(", ")}) RETURNING *`).get(...cols.map(([, v]) => v));
}

function updateRow(db, table, id, cols) {
  if (!cols.length) return db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(id);
  return db.prepare(`UPDATE ${table} SET ${cols.map(([c]) => `${c} = ?`).join(", ")} WHERE id = ? RETURNING *`).get(...cols.map(([, v]) => v), id);
}

const PHOTO_TABLES = [
  { path: "listings", table: "listing_photos", fk: "listing_id" },
  { path: "experiences", table: "experience_photos", fk: "experience_id" },
];
const photoParams = { type: "object", properties: { id: int(1), photoId: int(1) }, required: ["id", "photoId"] };

export default function hostRoutes(app, { db, now, photosDir }) {
  const own = (table) => (hostId, id) => {
    const row = db.prepare(`SELECT * FROM ${table} WHERE id = ? AND host_id = ?`).get(id, hostId);
    if (!row) throw new AppError(404, "not_found");
    return row;
  };
  const ownListing = own("listings");
  const ownExperience = own("experiences");
  const owners = { listings: ownListing, experiences: ownExperience };
  const listingOut = (l) => ({
    ...l,
    highlights: JSON.parse(l.highlights),
    sleeping: JSON.parse(l.sleeping),
    amenities: db.prepare("SELECT amenity FROM listing_amenities WHERE listing_id = ? ORDER BY amenity").all(l.id).map((a) => a.amenity),
    photos: db.prepare("SELECT id, file FROM listing_photos WHERE listing_id = ? ORDER BY position, id").all(l.id),
  });
  const setAmenities = (id, list) => {
    if (!list) return;
    db.prepare("DELETE FROM listing_amenities WHERE listing_id = ?").run(id);
    const add = db.prepare("INSERT OR IGNORE INTO listing_amenities (listing_id, amenity) VALUES (?, ?)");
    for (const a of list) add.run(id, a);
  };
  const setSteps = (id, list) => {
    if (!list) return;
    db.prepare("DELETE FROM experience_steps WHERE experience_id = ?").run(id);
    const add = db.prepare("INSERT INTO experience_steps (experience_id, position, title, body) VALUES (?, ?, ?, ?)");
    list.forEach((s, i) => add.run(id, i, s.title, s.body ?? ""));
  };
  const setOfferings = (id, list) => {
    if (!list) return;
    const keep = new Set(list.map((o) => o.id).filter(Boolean));
    for (const old of db.prepare("SELECT id FROM experience_offerings WHERE experience_id = ?").all(id)) {
      if (keep.has(old.id)) continue;
      const booked = db.prepare("SELECT 1 FROM experience_bookings WHERE offering_id = ?").get(old.id);
      if (booked) db.prepare("UPDATE experience_offerings SET active = 0 WHERE id = ?").run(old.id);
      else db.prepare("DELETE FROM experience_offerings WHERE id = ?").run(old.id);
    }
    const update = db.prepare("UPDATE experience_offerings SET title = ?, description = ?, price_per_guest = ?, duration_min = ?, position = ?, active = 1 WHERE id = ? AND experience_id = ?");
    const add = db.prepare("INSERT INTO experience_offerings (experience_id, title, description, price_per_guest, duration_min, position) VALUES (?, ?, ?, ?, ?, ?)");
    list.forEach((o, i) => (o.id ? update.run(o.title, o.description ?? "", o.pricePerGuest, o.durationMin, i, o.id, id) : add.run(id, o.title, o.description ?? "", o.pricePerGuest, o.durationMin, i)));
  };
  const experienceOut = (e) => ({
    ...e,
    qualifications: JSON.parse(e.qualifications),
    offerings: db.prepare("SELECT id, title, description, price_per_guest, duration_min FROM experience_offerings WHERE experience_id = ? AND active = 1 ORDER BY position, id").all(e.id),
    steps: db.prepare("SELECT title, body FROM experience_steps WHERE experience_id = ? ORDER BY position").all(e.id),
    photos: db.prepare("SELECT id, file FROM experience_photos WHERE experience_id = ? ORDER BY position, id").all(e.id),
    slots: db.prepare(`${SLOT_SELECT} WHERE s.experience_id = ? AND s.starts_at > ? ORDER BY s.starts_at`).all(e.id, localMinute(now())),
  });
  const bookingRows = (hostId, extra = "", args = []) =>
    db.prepare(`SELECT b.*, l.title AS listing_title, u.name AS guest_name, u.avatar_hue AS guest_hue
                FROM bookings b JOIN listings l ON l.id = b.listing_id JOIN users u ON u.id = b.guest_id
                WHERE l.host_id = ? ${extra} ORDER BY b.check_in`).all(hostId, ...args);

  app.post("/api/host/become", (req) => {
    const user = requireUser(req);
    db.prepare("UPDATE users SET is_host = 1 WHERE id = ?").run(user.id);
    return { ok: true };
  });

  app.get("/api/host/today", (req) => {
    const host = requireHost(req);
    const today = todayIso(now());
    return {
      today,
      requests: bookingRows(host.id, "AND b.status = 'pending' AND b.created_at > ?", [holdCutoff(now())]),
      checkingOut: bookingRows(host.id, "AND b.status = 'confirmed' AND b.check_out = ?", [today]),
      current: bookingRows(host.id, "AND b.status = 'confirmed' AND b.check_in <= ? AND b.check_out > ?", [today, today]),
      upcoming: bookingRows(host.id, "AND b.status = 'confirmed' AND b.check_in >= ? AND b.check_in <= ?", [today, addDays(today, 30)]),
      listings: db.prepare("SELECT count(*) n FROM listings WHERE host_id = ?").get(host.id).n,
      experiences: db.prepare("SELECT count(*) n FROM experiences WHERE host_id = ?").get(host.id).n,
    };
  });

  app.get("/api/host/reservations", (req) => {
    const host = requireHost(req);
    const today = todayIso(now());
    return bookingRows(host.id).map((b) => ({ ...b, phase: stayPhase(b, today) })).reverse();
  });

  app.post("/api/host/bookings/:id/respond", { schema: { params: idParam, body: body({ decision: { type: "string", enum: ["accept", "decline"] } }) } }, (req) =>
    respondToBooking(db, requireHost(req).id, req.params.id, req.body.decision, now()));

  app.post("/api/host/bookings/:id/cancel", { schema: { params: idParam } }, (req) => cancelBookingAsHost(db, requireHost(req).id, req.params.id, now()));

  app.get("/api/host/listings", (req) => {
    const host = requireHost(req);
    return db.prepare(`SELECT l.id, l.title, l.city, l.area, l.status, l.nightly, l.instant_book, l.created_at,
                         (SELECT file FROM listing_photos p WHERE p.listing_id = l.id ORDER BY position, id LIMIT 1) AS cover,
                         (SELECT count(*) FROM bookings b WHERE b.listing_id = l.id AND b.status = 'confirmed' AND b.check_out > ?) AS upcoming
                       FROM listings l WHERE l.host_id = ? ORDER BY l.id DESC`).all(todayIso(now()), host.id);
  });

  app.post("/api/host/listings", { schema: { body: schemaFor(LISTING_FIELDS, { amenities }, LISTING_REQUIRED) } }, (req) => {
    const host = requireHost(req);
    const l = insertRow(db, "listings", [["host_id", host.id], ...toColumns(LISTING_FIELDS, req.body)]);
    setAmenities(l.id, req.body.amenities);
    return listingOut(l);
  });

  app.get("/api/host/listings/:id", { schema: { params: idParam } }, (req) => listingOut(ownListing(requireHost(req).id, req.params.id)));

  app.put("/api/host/listings/:id", { schema: { params: idParam, body: schemaFor(LISTING_FIELDS, { amenities }, []) } }, (req) => {
    const l = ownListing(requireHost(req).id, req.params.id);
    const updated = updateRow(db, "listings", l.id, toColumns(LISTING_FIELDS, req.body));
    setAmenities(l.id, req.body.amenities);
    return listingOut(updated);
  });

  app.get("/api/host/listings/:id/calendar", { schema: { params: idParam } }, (req) => {
    const l = ownListing(requireHost(req).id, req.params.id);
    return {
      listing: { id: l.id, title: l.title, nightly: l.nightly, minNights: l.min_nights },
      today: todayIso(now()),
      blocked: db.prepare("SELECT night FROM blocked_nights WHERE listing_id = ? ORDER BY night").all(l.id).map((r) => r.night),
      prices: Object.fromEntries(db.prepare("SELECT night, price FROM night_prices WHERE listing_id = ?").all(l.id).map((r) => [r.night, r.price])),
      bookings: db.prepare(`SELECT b.id, b.check_in, b.check_out, b.status, u.name AS guest_name FROM bookings b JOIN users u ON u.id = b.guest_id
                            WHERE b.listing_id = ? AND b.status IN ('pending', 'confirmed') ORDER BY b.check_in`).all(l.id),
    };
  });

  app.post("/api/host/listings/:id/blocked", { schema: { params: idParam, body: body({ nights: { type: "array", minItems: 1, maxItems: 400, items: text(10, 10) }, blocked: { type: "boolean" } }) } }, (req) => {
    const l = ownListing(requireHost(req).id, req.params.id);
    if (!req.body.nights.every(isIsoDate)) throw new AppError(400, "invalid_dates");
    const stmt = req.body.blocked
      ? db.prepare("INSERT OR IGNORE INTO blocked_nights (listing_id, night) VALUES (?, ?)")
      : db.prepare("DELETE FROM blocked_nights WHERE listing_id = ? AND night = ?");
    for (const n of req.body.nights) stmt.run(l.id, n);
    return { ok: true };
  });

  app.post("/api/host/listings/:id/prices", {
    schema: { params: idParam, body: body({ nights: { type: "array", minItems: 1, maxItems: 400, items: text(10, 10) }, price: { type: ["integer", "null"], minimum: 10000, maximum: 100000000 } }) },
  }, (req) => {
    const l = ownListing(requireHost(req).id, req.params.id);
    if (!req.body.nights.every(isIsoDate)) throw new AppError(400, "invalid_dates");
    const stmt = req.body.price
      ? db.prepare("INSERT INTO night_prices (listing_id, night, price) VALUES (?, ?, ?) ON CONFLICT (listing_id, night) DO UPDATE SET price = excluded.price")
      : db.prepare("DELETE FROM night_prices WHERE listing_id = ? AND night = ?");
    for (const n of req.body.nights) (req.body.price ? stmt.run(l.id, n, req.body.price) : stmt.run(l.id, n));
    return { ok: true };
  });

  app.get("/api/host/experiences", (req) => {
    const host = requireHost(req);
    return db.prepare(`SELECT e.id, e.kind, e.title, e.city, e.category, e.status, e.price_per_guest,
                         (SELECT file FROM experience_photos p WHERE p.experience_id = e.id ORDER BY position LIMIT 1) AS cover,
                         (SELECT count(*) FROM experience_slots s WHERE s.experience_id = e.id AND s.starts_at > ?) AS upcoming_slots
                       FROM experiences e WHERE e.host_id = ? ORDER BY e.id DESC`).all(localMinute(now()), host.id);
  });

  app.post("/api/host/experiences", { schema: { body: schemaFor(EXPERIENCE_FIELDS, { steps, offerings }, EXPERIENCE_REQUIRED) } }, (req) => {
    const host = requireHost(req);
    const e = insertRow(db, "experiences", [["host_id", host.id], ...toColumns(EXPERIENCE_FIELDS, req.body)]);
    setSteps(e.id, req.body.steps);
    setOfferings(e.id, req.body.offerings);
    return experienceOut(e);
  });

  app.get("/api/host/experiences/:id", { schema: { params: idParam } }, (req) => experienceOut(ownExperience(requireHost(req).id, req.params.id)));

  app.put("/api/host/experiences/:id", { schema: { params: idParam, body: schemaFor(EXPERIENCE_FIELDS, { steps, offerings }, []) } }, (req) => {
    const e = ownExperience(requireHost(req).id, req.params.id);
    const updated = updateRow(db, "experiences", e.id, toColumns(EXPERIENCE_FIELDS, req.body));
    setSteps(e.id, req.body.steps);
    setOfferings(e.id, req.body.offerings);
    return experienceOut(updated);
  });

  for (const { path, table, fk } of PHOTO_TABLES) {
    const owner = owners[path];
    app.post(`/api/host/${path}/:id/photos`, { schema: { params: idParam, body: body({ dataUrl: text(9_000_000, 1) }) } }, async (req) => {
      const item = owner(requireHost(req).id, req.params.id);
      const file = await savePhoto(photosDir, req.body.dataUrl);
      const position = db.prepare(`SELECT coalesce(max(position), -1) + 1 p FROM ${table} WHERE ${fk} = ?`).get(item.id).p;
      return db.prepare(`INSERT INTO ${table} (${fk}, file, position) VALUES (?, ?, ?) RETURNING id, file`).get(item.id, file, position);
    });

    app.delete(`/api/host/${path}/:id/photos/:photoId`, { schema: { params: photoParams } }, (req) => {
      const item = owner(requireHost(req).id, req.params.id);
      db.prepare(`DELETE FROM ${table} WHERE id = ? AND ${fk} = ?`).run(req.params.photoId, item.id);
      return { ok: true };
    });

    app.post(`/api/host/${path}/:id/photos/:photoId/cover`, { schema: { params: photoParams } }, (req) => {
      const item = owner(requireHost(req).id, req.params.id);
      db.prepare(`UPDATE ${table} SET position = position + 1 WHERE ${fk} = ?`).run(item.id);
      db.prepare(`UPDATE ${table} SET position = 0 WHERE id = ? AND ${fk} = ?`).run(req.params.photoId, item.id);
      return { ok: true };
    });
  }

  const minute = { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}$" };
  app.post("/api/host/experiences/:id/slots", { schema: { params: idParam, body: body({ startsAt: minute, capacity: int(1, 100) }) } }, (req) => {
    const e = ownExperience(requireHost(req).id, req.params.id);
    if (req.body.startsAt <= localMinute(now())) throw new AppError(400, "past");
    return db
      .prepare("INSERT INTO experience_slots (experience_id, starts_at, ends_at, capacity) VALUES (?, ?, ?, ?) RETURNING *")
      .get(e.id, req.body.startsAt, addMinutes(req.body.startsAt, e.duration_min), req.body.capacity);
  });

  app.delete("/api/host/slots/:id", { schema: { params: idParam } }, (req) => {
    const host = requireHost(req);
    const s = db.prepare("SELECT s.id FROM experience_slots s JOIN experiences e ON e.id = s.experience_id WHERE s.id = ? AND e.host_id = ?").get(req.params.id, host.id);
    if (!s) throw new AppError(404, "not_found");
    if (seatsTaken(db, s.id) > 0) throw new AppError(409, "slot_has_bookings");
    db.prepare("DELETE FROM experience_slots WHERE id = ?").run(s.id);
    return { ok: true };
  });

  app.get("/api/host/earnings", (req) => {
    const host = requireHost(req);
    const stays = db.prepare(`SELECT substr(b.check_in, 1, 7) AS month, b.subtotal, b.service_fee, b.total
                              FROM bookings b JOIN listings l ON l.id = b.listing_id WHERE l.host_id = ? AND b.status = 'confirmed'`).all(host.id);
    const exps = db.prepare(`SELECT substr(s.starts_at, 1, 7) AS month, eb.subtotal, eb.service_fee, eb.total
                             FROM experience_bookings eb JOIN experience_slots s ON s.id = eb.slot_id JOIN experiences e ON e.id = s.experience_id
                             WHERE e.host_id = ? AND eb.status = 'confirmed'`).all(host.id);
    const months = new Map();
    const add = (month, payout, kind) => {
      const m = months.get(month) ?? { month, payout: 0, stays: 0, experiences: 0 };
      m.payout += payout;
      m[kind] += 1;
      months.set(month, m);
    };
    for (const b of stays) add(b.month, hostPayout({ total: b.total, serviceFee: b.service_fee, subtotal: b.subtotal }), "stays");
    for (const b of exps) add(b.month, hostPayout({ total: b.total, serviceFee: b.service_fee, subtotal: b.subtotal }), "experiences");
    const list = [...months.values()].sort((a, b) => a.month.localeCompare(b.month));
    return { months: list, total: list.reduce((s, m) => s + m.payout, 0) };
  });
}
