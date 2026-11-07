import { isIsoDate, todayIso } from "../../shared/dates.js";
import { AppError, nightPrices, occupiedFor, stayRules } from "../bookings.js";
import { candidateWindows, firstFreeWindow } from "../../shared/windows.js";
import { hostProfile, isSuperhost, LISTING_SELECT, listingCard, REVIEW_SCORES, reviewTags } from "../cards.js";
import { body, idParam, requireUser, text } from "../guards.js";
import { isoStamp } from "../db.js";

export const PAGE_SIZE = 20;
const HOME_ROW = 8;

const num = (v) => (v === undefined || v === "" ? undefined : Number(v));
const list = (v) => (v ? String(v).split(",").filter(Boolean) : []);

const HISTOGRAM_BUCKETS = 30;

function histogram(values) {
  if (!values.length) return { min: 0, max: 0, buckets: [] };
  const min = Math.min(...values);
  const max = Math.max(...values);
  const size = Math.max(1, (max - min) / HISTOGRAM_BUCKETS);
  const buckets = Array(HISTOGRAM_BUCKETS).fill(0);
  for (const v of values) buckets[Math.min(HISTOGRAM_BUCKETS - 1, Math.floor((v - min) / size))] += 1;
  return { min, max, buckets };
}

export function searchListings(db, q, now) {
  const where = ["l.status = 'listed'"];
  const args = [];
  if (q.where) {
    where.push("(l.city LIKE ? OR l.area LIKE ? OR l.state LIKE ? OR l.title LIKE ?)");
    args.push(...Array(4).fill(`%${q.where}%`));
  }
  const guests = num(q.guests) ?? 1;
  where.push("l.max_guests >= ?");
  args.push(guests);
  for (const [key, sql] of [["bedrooms", "l.bedrooms >= ?"], ["beds", "l.beds >= ?"], ["bathrooms", "l.bathrooms >= ?"]]) {
    if (num(q[key]) > 0) {
      where.push(sql);
      args.push(num(q[key]));
    }
  }
  if (q.roomType) {
    where.push("l.room_type = ?");
    args.push(q.roomType);
  }
  if (q.instant === "1") where.push("l.instant_book = 1");
  if (q.freeCancel === "1") where.push("l.cancellation_policy = 'flexible'");
  if (q.luxe === "1") where.push("l.luxe = 1");
  for (const a of list(q.amenities)) {
    where.push("EXISTS (SELECT 1 FROM listing_amenities la WHERE la.listing_id = l.id AND la.amenity = ?)");
    args.push(a);
  }
  if (q.types) {
    const types = list(q.types);
    where.push(`l.property_type IN (${types.map(() => "?").join(",")})`);
    args.push(...types);
  }
  for (const lang of list(q.languages)) {
    where.push("EXISTS (SELECT 1 FROM json_each(u.languages) j WHERE j.value = ?)");
    args.push(lang);
  }
  const bbox = list(q.bbox).map(Number);
  if (bbox.length === 4 && bbox.every(Number.isFinite)) {
    where.push("l.lng BETWEEN ? AND ? AND l.lat BETWEEN ? AND ?");
    args.push(bbox[0], bbox[2], bbox[1], bbox[3]);
  }

  const today = todayIso(now);
  const flexMonths = list(q.flexMonths).filter((m) => /^\d{4}-\d{2}$/.test(m));
  const flexKind = ["weekend", "week", "month"].includes(q.flexKind) && flexMonths.length ? q.flexKind : null;
  const exact = q.checkin || q.checkout;
  if (!flexKind && exact && (!isIsoDate(q.checkin) || !isIsoDate(q.checkout) || q.checkout <= q.checkin)) return { error: "invalid_dates" };
  const flexDays = Math.min(14, Math.max(0, num(q.flex) || 0));
  const windows = flexKind || exact ? candidateWindows({ checkIn: q.checkin, checkOut: q.checkout, flexDays, flexKind, flexMonths }, today) : null;

  const rows = db.prepare(`${LISTING_SELECT} WHERE ${where.join(" AND ")} ORDER BY coalesce(r.rating, 0) * min(r.n, 20) DESC, l.id`).all(...args);
  // ponytail: per-listing availability scan in JS; move to SQL NOT EXISTS if listings grow past a few thousand.
  let cards = rows.flatMap((l) => {
    if (!windows) return [listingCard(l)];
    const w = firstFreeWindow(windows, stayRules(l), occupiedFor(db, l.id, now), today, guests);
    return w ? [{ ...listingCard(l, { ...w, prices: nightPrices(db, l, w.checkIn, w.checkOut) }), shifted: !flexKind && w.checkIn !== q.checkin }] : [];
  });
  if (q.favourite === "1") cards = cards.filter((c) => c.guestFavourite);
  const priceOf = (c) => c.price?.total ?? c.nightly;
  const prices = histogram(cards.map(priceOf));
  const min = num(q.minPrice) * 100;
  const max = num(q.maxPrice) * 100;
  if (min) cards = cards.filter((c) => priceOf(c) >= min);
  if (max) cards = cards.filter((c) => priceOf(c) <= max);
  cards.sort((a, b) => Number(a.shifted ?? false) - Number(b.shifted ?? false));
  const page = Math.max(1, num(q.page) || 1);
  return { total: cards.length, page, pageSize: PAGE_SIZE, prices, items: cards.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE) };
}

export function listingDetail(db, id) {
  const row = db.prepare(`${LISTING_SELECT} WHERE l.id = ? AND l.status = 'listed'`).get(id);
  if (!row) throw new AppError(404, "not_found");
  const reviews = db
    .prepare(`SELECT r.*, u.name AS author_name, u.avatar_hue, u.city AS author_city FROM reviews r JOIN users u ON u.id = r.author_id
              WHERE r.kind = 'listing' AND r.item_id = ? ORDER BY r.id DESC`)
    .all(id);
  const host = hostProfile(db, row.host_id);
  const avg = (k) => (reviews.length ? Math.round((reviews.reduce((s, r) => s + (r[k] ?? 0), 0) / reviews.length) * 10) / 10 : null);
  return {
    ...listingCard(row),
    description: row.description,
    houseRules: row.house_rules,
    highlights: JSON.parse(row.highlights),
    sleeping: JSON.parse(row.sleeping),
    cleaningFee: row.cleaning_fee,
    weeklyDiscountPct: row.weekly_discount_pct,
    monthlyDiscountPct: row.monthly_discount_pct,
    minNights: row.min_nights,
    cancellationPolicy: row.cancellation_policy,
    hostId: row.host_id,
    photos: db.prepare("SELECT file FROM listing_photos WHERE listing_id = ? ORDER BY position, id").all(id).map((p) => p.file),
    photoRooms: db.prepare("SELECT file, room FROM listing_photos WHERE listing_id = ? ORDER BY position, id").all(id),
    distribution: [5, 4, 3, 2, 1].map((stars) => reviews.filter((r) => r.overall === stars).length),
    amenities: db.prepare("SELECT amenity FROM listing_amenities WHERE listing_id = ? ORDER BY amenity").all(id).map((a) => a.amenity),
    scores: Object.fromEntries(REVIEW_SCORES.map((k) => [k, avg(k)])),
    tags: reviewTags(reviews.map((r) => r.body)),
    reviews: reviews.map((r) => ({ id: r.id, authorId: r.author_id, author: r.author_name, authorCity: r.author_city, avatarHue: r.avatar_hue, overall: r.overall, body: r.body, createdAt: r.created_at })),
    host: {
      ...host,
      superhost: isSuperhost(row.host_rating, row.host_reviews), reviewCount: row.host_reviews,
      rating: row.host_rating ? Math.round(row.host_rating * 100) / 100 : null,
      listings: db.prepare("SELECT count(*) n FROM listings WHERE host_id = ? AND status = 'listed'").get(host.id).n,
    },
    similar: db.prepare(`${LISTING_SELECT} WHERE l.city = ? AND l.id != ? AND l.status = 'listed' LIMIT 8`).all(row.city, id).map((r) => listingCard(r)),
  };
}

export default function listingRoutes(app, { db, now }) {
  app.get("/api/home", () => {
    const cities = db.prepare("SELECT city, count(*) n FROM listings WHERE status = 'listed' GROUP BY city ORDER BY n DESC, city").all();
    return {
      rows: cities.map(({ city }) => ({
        city,
        items: db.prepare(`${LISTING_SELECT} WHERE l.city = ? AND l.status = 'listed' ORDER BY coalesce(r.rating, 0) DESC, l.id LIMIT ?`).all(city, HOME_ROW).map((r) => listingCard(r)),
      })),
    };
  });

  app.get("/api/search", (req) => searchListings(db, req.query, now()));

  app.get("/api/places", () => ({
    places: db.prepare("SELECT city, state, count(*) n FROM listings WHERE status = 'listed' GROUP BY city, state ORDER BY n DESC").all(),
  }));

  app.get("/api/listings/:id", { schema: { params: idParam } }, (req) => {
    const detail = listingDetail(db, req.params.id);
    if (req.user) {
      db.prepare(`INSERT INTO recently_viewed (user_id, listing_id, viewed_at) VALUES (?, ?, ?)
                  ON CONFLICT (user_id, listing_id) DO UPDATE SET viewed_at = excluded.viewed_at`).run(req.user.id, detail.id, isoStamp(now()));
    }
    return detail;
  });

  app.post("/api/listings/:id/report", { schema: { params: idParam, body: body({ reason: text(80, 1), details: text(1000) }, ["reason"]) } }, (req) => {
    const user = requireUser(req);
    const l = db.prepare("SELECT id FROM listings WHERE id = ?").get(req.params.id);
    if (!l) throw new AppError(404, "not_found");
    db.prepare("INSERT INTO reports (listing_id, reporter_id, reason) VALUES (?, ?, ?) ON CONFLICT (listing_id, reporter_id) DO NOTHING")
      .run(l.id, user.id, [req.body.reason, req.body.details].filter(Boolean).join(": "));
    return { ok: true };
  });

  app.get("/api/users/:id", { schema: { params: idParam } }, (req) => {
    const u = db.prepare("SELECT id, is_host FROM users WHERE id = ?").get(req.params.id);
    if (!u) throw new AppError(404, "not_found");
    const listings = db.prepare(`${LISTING_SELECT} WHERE l.host_id = ? AND l.status = 'listed' ORDER BY l.id`).all(u.id).map((r) => listingCard(r));
    const reviews = db
      .prepare(`SELECT r.id, r.overall, r.body, r.created_at AS createdAt, a.id AS authorId, a.name AS author, a.city AS authorCity, a.avatar_hue AS avatarHue
                FROM reviews r JOIN listings l ON r.kind = 'listing' AND l.id = r.item_id JOIN users a ON a.id = r.author_id
                WHERE l.host_id = ? ORDER BY r.id DESC LIMIT 12`)
      .all(u.id);
    const stats = db.prepare("SELECT count(*) n, avg(r.overall) rating FROM reviews r JOIN listings l ON r.kind = 'listing' AND l.id = r.item_id WHERE l.host_id = ?").get(u.id);
    return {
      ...hostProfile(db, u.id), isHost: !!u.is_host, listings, reviews, reviewCount: stats.n,
      rating: stats.rating ? Math.round(stats.rating * 100) / 100 : null, superhost: isSuperhost(stats.rating ?? 0, stats.n),
    };
  });

  app.get("/api/listings/:id/availability", { schema: { params: idParam } }, (req) => {
    const l = db.prepare("SELECT id, min_nights, max_guests FROM listings WHERE id = ? AND status = 'listed'").get(req.params.id);
    if (!l) throw new AppError(404, "not_found");
    const today = todayIso(now());
    const prices = Object.fromEntries(db.prepare("SELECT night, price FROM night_prices WHERE listing_id = ? AND night >= ?").all(l.id, today).map((r) => [r.night, r.price]));
    return { occupied: [...occupiedFor(db, l.id, now())], minNights: l.min_nights, maxGuests: l.max_guests, today, prices };
  });
}
