import { quoteStay } from "../shared/pricing.js";
import { nightsBetween } from "../shared/dates.js";

export const REVIEW_SCORES = ["cleanliness", "accuracy", "checkin", "communication", "location", "value"];

export const stayPricing = (row, prices) => ({
  nightly: row.nightly, cleaningFee: row.cleaning_fee, weeklyDiscountPct: row.weekly_discount_pct, monthlyDiscountPct: row.monthly_discount_pct, prices,
});

export const hostProfile = (db, id) => {
  const h = db.prepare("SELECT id, name, about, city, avatar_hue, created_at, languages, work FROM users WHERE id = ?").get(id);
  return { id: h.id, name: h.name, about: h.about, city: h.city, avatarHue: h.avatar_hue, joined: h.created_at, languages: JSON.parse(h.languages), work: h.work };
};

export const GUEST_FAVOURITE = { rating: 4.85, reviews: 5 };
export const SUPERHOST = { rating: 4.8, reviews: 5 };

export const LISTING_SELECT = `
  SELECT l.*, u.name AS host_name,
    r.rating, coalesce(r.n, 0) AS review_count,
    coalesce(hs.rating, 0) AS host_rating, coalesce(hs.n, 0) AS host_reviews,
    (SELECT json_group_array(file) FROM (SELECT file FROM listing_photos p WHERE p.listing_id = l.id ORDER BY position, id LIMIT 5)) AS photos
  FROM listings l
  JOIN users u ON u.id = l.host_id
  LEFT JOIN (SELECT item_id, avg(overall) AS rating, count(*) AS n FROM reviews WHERE kind = 'listing' GROUP BY item_id) r ON r.item_id = l.id
  LEFT JOIN (SELECT l2.host_id, avg(rv.overall) AS rating, count(*) AS n FROM reviews rv JOIN listings l2 ON l2.id = rv.item_id
             WHERE rv.kind = 'listing' GROUP BY l2.host_id) hs ON hs.host_id = l.host_id`;

const round2 = (n) => (n == null ? null : Math.round(n * 100) / 100);

export const isSuperhost = (rating, reviews) => reviews >= SUPERHOST.reviews && rating >= SUPERHOST.rating;

export function listingCard(row, { checkIn, checkOut, prices } = {}) {
  const nights = checkIn && checkOut ? nightsBetween(checkIn, checkOut) : 0;
  const price = nights > 0 ? quoteStay(stayPricing(row, prices), nights) : null;
  return {
    id: row.id,
    title: row.title,
    propertyType: row.property_type,
    roomType: row.room_type,
    city: row.city,
    area: row.area,
    state: row.state,
    lat: row.lat,
    lng: row.lng,
    maxGuests: row.max_guests,
    bedrooms: row.bedrooms,
    beds: row.beds,
    bathrooms: row.bathrooms,
    nightly: row.nightly,
    instantBook: !!row.instant_book,
    freeCancellation: row.cancellation_policy === "flexible",
    rating: round2(row.rating),
    reviewCount: row.review_count,
    guestFavourite: row.review_count >= GUEST_FAVOURITE.reviews && row.rating >= GUEST_FAVOURITE.rating,
    superhost: isSuperhost(row.host_rating, row.host_reviews),
    hostName: row.host_name,
    photos: JSON.parse(row.photos ?? "[]"),
    price: price && {
      nights, total: price.total, originalTotal: price.originalTotal, discountKind: price.discountKind,
      nightly: price.nightly, subtotal: price.subtotal, discount: price.discount, cleaningFee: price.cleaningFee, serviceFee: price.serviceFee,
    },
    window: checkIn && checkOut ? { checkIn, checkOut } : null,
    luxe: !!row.luxe,
  };
}

export const EXPERIENCE_SELECT = `
  SELECT e.*, u.name AS host_name, u.avatar_hue AS host_hue, r.rating, coalesce(r.n, 0) AS review_count,
    coalesce((SELECT min(o.price_per_guest) FROM experience_offerings o WHERE o.experience_id = e.id AND o.active = 1), e.price_per_guest) AS from_price,
    (SELECT json_group_array(file) FROM (SELECT file FROM experience_photos p WHERE p.experience_id = e.id ORDER BY position, id LIMIT 5)) AS photos
  FROM experiences e
  JOIN users u ON u.id = e.host_id
  LEFT JOIN (SELECT item_id, avg(overall) AS rating, count(*) AS n FROM reviews WHERE kind = 'experience' GROUP BY item_id) r ON r.item_id = e.id`;

export function experienceCard(row) {
  return {
    id: row.id,
    kind: row.kind,
    title: row.title,
    category: row.category,
    city: row.city,
    area: row.area,
    lat: row.lat,
    lng: row.lng,
    durationMin: row.duration_min,
    pricePerGuest: row.from_price,
    rating: round2(row.rating),
    reviewCount: row.review_count,
    hostName: row.host_name,
    hostHue: row.host_hue,
    photos: JSON.parse(row.photos ?? "[]"),
  };
}

const TAG_WORDS = ["beach", "clean", "location", "view", "pool", "quiet", "host", "wifi", "kitchen", "spacious", "cozy", "food"];

export function reviewTags(bodies) {
  const counts = TAG_WORDS.map((w) => [w, bodies.filter((b) => b.toLowerCase().includes(w)).length]);
  return counts.filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([w]) => w);
}
