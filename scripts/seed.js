import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { openDb, isoStamp } from "../server/db.js";
import { hashPassword } from "../server/auth.js";
import { nightPrices, occupiedFor } from "../server/bookings.js";
import { addDays, addMinutes, todayIso } from "../shared/dates.js";
import { quoteExperience, quoteStay } from "../shared/pricing.js";
import { stayPricing } from "../server/cards.js";
import { CITY_VIEW, PALETTES, renderActivity, renderScene, rng } from "./photos.js";

const dataDir = process.env.STAYS_DATA_DIR ? `${process.env.STAYS_DATA_DIR}/` : fileURLToPath(new URL("../data/", import.meta.url));
const dbPath = `${dataDir}stays.db`;
const photosDir = `${dataDir}photos`;

if (existsSync(dbPath) && !process.argv.includes("--reset")) {
  process.stderr.write(`${dbPath} already exists. Run "npm run seed -- --reset" to rebuild it from scratch.\n`);
  process.exit(1);
}
for (const f of [dbPath, `${dbPath}-wal`, `${dbPath}-shm`]) rmSync(f, { force: true });
mkdirSync(photosDir, { recursive: true });
for (const f of readdirSync(photosDir)) if (f.startsWith("s-")) rmSync(`${photosDir}/${f}`);

const db = openDb(dbPath);
const r = rng(20261022);
const pick = (arr) => arr[Math.floor(r() * arr.length)];
const between = (a, b) => a + Math.floor(r() * (b - a + 1));
const now = Date.now();
const today = todayIso(now);
const PASSWORD = hashPassword("stays-demo-1");
const RUN = now.toString(36);

const CITIES = [
  { city: "Goa", state: "Goa", lat: 15.55, lng: 73.76, areas: ["Candolim", "Anjuna", "Assagao", "Siolim", "Palolem"], vibe: "beach" },
  { city: "Manali", state: "Himachal Pradesh", lat: 32.24, lng: 77.19, areas: ["Old Manali", "Vashisht", "Naggar", "Prini"], vibe: "mountain" },
  { city: "Jaipur", state: "Rajasthan", lat: 26.91, lng: 75.79, areas: ["C-Scheme", "Amer", "Bani Park", "Civil Lines"], vibe: "heritage" },
  { city: "Udaipur", state: "Rajasthan", lat: 24.58, lng: 73.68, areas: ["Lal Ghat", "Ambrai", "Fateh Sagar", "Hanuman Ghat"], vibe: "lake" },
  { city: "Munnar", state: "Kerala", lat: 10.09, lng: 77.06, areas: ["Chithirapuram", "Pallivasal", "Devikulam"], vibe: "tea" },
  { city: "Pondicherry", state: "Puducherry", lat: 11.93, lng: 79.83, areas: ["White Town", "Auroville", "Serenity Beach"], vibe: "town" },
  { city: "Rishikesh", state: "Uttarakhand", lat: 30.09, lng: 78.27, areas: ["Tapovan", "Laxman Jhula", "Shivpuri"], vibe: "river" },
  { city: "Coorg", state: "Karnataka", lat: 12.42, lng: 75.74, areas: ["Madikeri", "Kushalnagar", "Virajpet"], vibe: "forest" },
];

const TYPES = {
  beach: ["Flat", "Villa", "Cottage", "Bungalow", "Guest suite"],
  mountain: ["Cabin", "Cottage", "Chalet", "Room", "Treehouse"],
  heritage: ["Haveli", "Flat", "Guest suite", "Villa", "Room"],
  lake: ["Haveli", "Flat", "Room", "Guest suite", "Villa"],
  tea: ["Cottage", "Farm stay", "Villa", "Treehouse", "Bungalow"],
  town: ["Heritage home", "Flat", "Guest suite", "Villa", "Room"],
  river: ["Cottage", "Room", "Flat", "Cabin", "Guest suite"],
  forest: ["Farm stay", "Cottage", "Villa", "Treehouse", "Bungalow"],
};
const ADJ = ["Sunlit", "Quiet", "Breezy", "Airy", "Cosy", "Leafy", "Bright", "Calm", "Rustic", "Modern"];
const HOOK = {
  beach: ["5 min to the beach", "sea-view balcony", "garden & plunge pool", "walk to cafés"],
  mountain: ["valley views", "wood stove", "apple orchard", "snow-peak balcony"],
  heritage: ["courtyard & jharokhas", "rooftop breakfast", "near the old city", "painted walls"],
  lake: ["lake-facing terrace", "sunset rooftop", "steps from the ghats", "boat jetty nearby"],
  tea: ["tea-garden views", "misty mornings", "plantation walks", "hammock deck"],
  town: ["French-quarter street", "bicycle included", "walk to the promenade", "leafy courtyard"],
  river: ["river views", "yoga deck", "walk to the bridge", "rafting nearby"],
  forest: ["coffee estate", "birdsong deck", "stream nearby", "bonfire nights"],
};
const AMENITY_POOL = ["wifi", "kitchen", "ac", "free_parking", "washer", "workspace", "tv", "breakfast", "coffee_maker", "first_aid", "smoke_alarm", "self_checkin", "balcony", "garden", "heating", "hot_water", "iron", "hair_dryer", "pets_allowed", "step_free_access", "hot_tub"];
const ROOM_LABEL = { exterior: "Exterior", living: "Living room", bedroom: "Bedroom 1", kitchen: "Full kitchen", bathroom: "Full bathroom", pool: "Pool", view: "Balcony" };
const VIBE_AMENITIES = { beach: ["pool", "beach_access", "bbq"], mountain: ["fireplace", "mountain_view", "heating"], heritage: ["rooftop", "breakfast"], lake: ["lake_view", "rooftop"], tea: ["mountain_view", "garden", "bbq"], town: ["bicycle", "garden"], river: ["mountain_view", "yoga_deck"], forest: ["garden", "bbq", "pool"] };

const FIRST = ["Asha", "Ravi", "Meera", "Kabir", "Tara", "Nikhil", "Isha", "Arjun", "Zoya", "Dev", "Leela", "Rohan", "Sana", "Vikram", "Anika", "Farhan", "Priya", "Neel", "Kavya", "Omar", "Ritu", "Sahil", "Mira", "Aditya", "Naina", "Kunal", "Pooja", "Yash", "Diya", "Imran", "Gauri", "Aarav"];
const LAST = ["Kulkarni", "Fernandes", "Menon", "Rathore", "Iyer", "Bose", "Chopra", "D'Souza", "Nair", "Sethi", "Pillai", "Mehta", "Rao", "Kapoor", "Sen", "Gill"];
const ABOUT = [
  "I grew up here and love showing guests the quiet corners locals go to.",
  "Architect by training, host by choice. I restored this place myself.",
  "Retired teacher. Ask me about the best breakfast spots nearby.",
  "We are a small family team; one of us is always a call away.",
  "Trekker, cook and part-time photographer. Happy to plan your days.",
];

let hue = 0;
const LANGUAGES = ["Hindi", "Marathi", "Konkani", "Tamil", "Malayalam", "Kannada", "Bengali", "French", "German"];
const WORK = ["Architect", "Chef", "Teacher", "Photographer", "Software engineer", "Yoga teacher", "Retired banker", "Interior designer"];
const user = (email, name, isHost, about = "", city = "") =>
  db.prepare("INSERT INTO users (email, name, password_hash, is_host, about, city, avatar_hue, created_at, languages, work) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id")
    .get(email, name, PASSWORD, isHost, about, city, (hue += 47) % 360, isoStamp(now - between(200, 2400) * 86_400_000),
      JSON.stringify(["English", ...LANGUAGES.filter(() => r() < 0.2)]), isHost ? pick(WORK) : "").id;

const demoHost = user("host@stays.test", "Asha (demo host)", 1, "Demo host account for trying the hosting side. Every listing here is fictional.", "Goa");
const demoGuest = user("guest@stays.test", "Ravi (demo guest)", 0, "Demo guest account.", "Bengaluru");
const hosts = [demoHost, ...Array.from({ length: 11 }, (_, i) => user(`host${i + 1}@stays.test`, `${FIRST[i + 2]} ${LAST[i]}`, 1, pick(ABOUT), CITIES[i % 8].city))];
const guests = [demoGuest, ...Array.from({ length: 19 }, (_, i) => user(`guest${i + 1}@stays.test`, `${FIRST[(i + 13) % FIRST.length]} ${LAST[(i + 5) % LAST.length]}`, 0, "", pick(["Mumbai", "Delhi", "Pune", "Chennai", "Hyderabad", "Kolkata", "Bengaluru"])))];

const REVIEW_LINES = [
  "Spotless and exactly like the photos. The location made every day easy.",
  "Our host was quick to reply and full of good tips. Lovely quiet place.",
  "Great view from the balcony, comfy beds, and the kitchen had everything.",
  "Clean, spacious and calm. The wifi was fast enough for calls.",
  "Perfect for a long weekend. Check-in was smooth and the host very kind.",
  "Beautiful little home, cozy at night, and close to good food.",
  "The pool and the garden were the highlight. Would come back.",
  "Walkable location, clean rooms, and a host who really cares.",
];
const EXP_REVIEW_LINES = [
  "Our guide was warm and knew every story. Highly recommend.",
  "Well paced, never rushed, and the group was small. Loved it.",
  "A highlight of our trip. Worth waking up early for.",
  "Fun, hands-on and good value. We left with great photos.",
];

const writePhoto = (name, svg) => writeFileSync(`${photosDir}/${name}`, svg);

const insert = (table, row) => {
  const cols = Object.keys(row);
  return db.prepare(`INSERT INTO ${table} (${cols.join(",")}) VALUES (${cols.map(() => "?").join(",")}) RETURNING id`).get(...Object.values(row)).id;
};

function addStay(listing, guestId, checkIn, nights, status, extra = {}) {
  const q = quoteStay(stayPricing(listing, nightPrices(db, listing, checkIn, addDays(checkIn, nights))), nights);
  return insert("bookings", {
    listing_id: listing.id, guest_id: guestId, check_in: checkIn, check_out: addDays(checkIn, nights), guests: between(1, listing.max_guests),
    nightly: q.nightly, subtotal: q.subtotal, discount: q.discount, cleaning_fee: q.cleaningFee, service_fee: q.serviceFee, total: q.total,
    status, paid_with: pick(["mock_card", "mock_upi"]), created_at: isoStamp(extra.createdAt ?? now - between(5, 60) * 86_400_000), message: extra.message ?? "",
  });
}

function addReview(kind, itemId, bookingId, authorId, createdAt, lines) {
  const s = () => (r() < 0.8 ? 5 : 4);
  const overall = s();
  insert("reviews", {
    kind, item_id: itemId, booking_id: bookingId, author_id: authorId, overall,
    ...(kind === "listing" ? { cleanliness: s(), accuracy: s(), checkin: s(), communication: s(), location: s(), value: s() } : {}),
    body: pick(lines), created_at: createdAt,
  });
}

const listings = [];
CITIES.forEach((c, ci) => {
  TYPES[c.vibe].forEach((type, ti) => {
    const area = c.areas[ti % c.areas.length];
    const hostId = ci < 6 && ti === 0 ? demoHost : hosts[1 + ((ci * 5 + ti) % 11)];
    const bedrooms = ["Room", "Guest suite"].includes(type) ? 1 : between(1, 4);
    const roomType = type === "Room" ? "private" : "entire";
    const amenities = [...new Set([...AMENITY_POOL.filter(() => r() < 0.55), ...VIBE_AMENITIES[c.vibe].filter(() => r() < 0.7), "wifi", "smoke_alarm"])];
    const l = {
      host_id: hostId,
      title: `${pick(ADJ)} ${type.toLowerCase()} | ${pick(HOOK[c.vibe])}`,
      description: `A ${type.toLowerCase()} in ${area}, ${c.city}, set up for slow mornings and easy days out. ${pick(["Natural light all day, linen on the beds and a well-stocked kitchen.", "Thick walls keep it cool; the terrace is where evenings happen.", "Big windows, a reading corner and a host who lives nearby."])} Everything here is fictional sample data for a local demo.`,
      property_type: type, room_type: roomType, city: c.city, area, state: c.state,
      lat: c.lat + (r() - 0.5) * 0.08, lng: c.lng + (r() - 0.5) * 0.08,
      max_guests: Math.min(16, bedrooms * 2 + between(0, 2)), bedrooms, beds: bedrooms + between(0, 2), bathrooms: Math.max(1, bedrooms - between(0, 1)),
      nightly: between(18, 140) * 10000, cleaning_fee: between(0, 12) * 10000, weekly_discount_pct: pick([0, 5, 10, 15]), monthly_discount_pct: pick([0, 20, 30]),
      min_nights: pick([1, 1, 2, 2, 3]), instant_book: r() < 0.6 ? 1 : 0, cancellation_policy: pick(["flexible", "moderate", "moderate", "strict"]),
      house_rules: "Check-in after 2 pm · Checkout before 11 am · No parties or events · Quiet hours 10 pm to 7 am",
      highlights: JSON.stringify([
        { title: "Self check-in", body: "Check yourself in with the lockbox." },
        { title: pick(["Great location", "Peace and quiet", "Room to spread out"]), body: pick(["Recent guests loved the location.", "Guests say it is calm at night.", "Plenty of space for families."]) },
        { title: "Free cancellation for 48 hours", body: "Get a full refund if you change your mind." },
      ]),
      sleeping: JSON.stringify(Array.from({ length: bedrooms }, (_, i) => ({ room: `Bedroom ${i + 1}`, beds: pick(["1 queen bed", "1 king bed", "2 single beds", "1 double bed"]) }))),
      created_at: isoStamp(now - between(60, 900) * 86_400_000),
    };
    l.luxe = l.nightly >= 1250000 ? 1 : 0;
    l.id = insert("listings", l);
    for (const a of amenities) db.prepare("INSERT OR IGNORE INTO listing_amenities VALUES (?, ?)").run(l.id, a);
    const rest = ["exterior", "living", "bedroom", pick(["kitchen", "bathroom"]), amenities.includes("pool") ? "pool" : "view"];
    const cover = rest[(ci + ti) % 3 === 0 ? 0 : (ci + ti) % 3 === 1 ? 1 : 4];
    const scenes = [cover, ...rest.filter((x) => x !== cover)];
    const palette = PALETTES[(ci + ti) % PALETTES.length];
    scenes.forEach((scene, i) => {
      const file = `s-l${l.id}-${i}-${RUN}.svg`;
      writePhoto(file, renderScene(scene, i % 2 ? PALETTES[(ci + ti + 2) % PALETTES.length] : palette, CITY_VIEW[c.city], l.id * 10 + i));
      insert("listing_photos", { listing_id: l.id, file, position: i, room: ROOM_LABEL[scene] });
    });
    listings.push(l);
  });
});

for (const l of listings) {
  if (r() < 0.5) {
    for (let d = 0; d < 90; d++) {
      const night = addDays(today, d);
      if ([5, 6].includes(new Date(`${night}T00:00:00Z`).getUTCDay())) db.prepare("INSERT INTO night_prices (listing_id, night, price) VALUES (?, ?, ?)").run(l.id, night, Math.round((l.nightly * 1.2) / 10000) * 10000);
    }
  }
  let cursor = addDays(today, -between(3, 10));
  for (let i = 0, n = between(3, 11); i < n; i++) {
    const nights = Math.max(l.min_nights, between(1, 5));
    const checkIn = addDays(cursor, -nights - between(2, 15));
    const guestId = pick(guests.slice(1));
    const id = addStay(l, guestId, checkIn, nights, "confirmed", { createdAt: Date.parse(addDays(checkIn, -20)) });
    addReview("listing", l.id, id, guestId, isoStamp(Date.parse(addDays(checkIn, nights + 1))), REVIEW_LINES);
    cursor = checkIn;
  }
  let ahead = addDays(today, between(2, 10));
  for (let i = 0, n = between(0, 3); i < n; i++) {
    const nights = Math.max(l.min_nights, between(2, 4));
    addStay(l, pick(guests.slice(1)), ahead, nights, "confirmed");
    ahead = addDays(ahead, nights + between(4, 14));
  }
  if (r() < 0.4) {
    const start = addDays(today, between(20, 50));
    const taken = occupiedFor(db, l.id, now);
    for (let d = 0; d < between(2, 5); d++) {
      if (!taken.has(addDays(start, d))) db.prepare("INSERT OR IGNORE INTO blocked_nights VALUES (?, ?)").run(l.id, addDays(start, d));
    }
  }
}

const demoListings = listings.filter((l) => l.host_id === demoHost);
const requestable = demoListings.slice(0, 2);
const REQUEST_MESSAGE = "Hi! We are two friends visiting for a few days. Could we check in a little early?";
requestable.forEach((l, i) => {
  db.prepare("UPDATE listings SET instant_book = 0 WHERE id = ?").run(l.id);
  const createdAt = now - (2 + i * 3) * 3_600_000;
  addStay(l, guests[3 + i], addDays(today, 75 + i * 7), Math.max(l.min_nights, 3), "pending", { createdAt, message: REQUEST_MESSAGE });
  const t = insert("threads", { guest_id: guests[3 + i], host_id: demoHost, kind: "listing", item_id: l.id });
  insert("messages", { thread_id: t, sender_id: guests[3 + i], body: REQUEST_MESSAGE, created_at: isoStamp(createdAt) });
});
const otherListings = listings.filter((l) => l.host_id !== demoHost);
const upcomingTrip = otherListings[3];
addStay(upcomingTrip, demoGuest, addDays(today, 85), Math.max(upcomingTrip.min_nights, 3), "confirmed");
addStay(otherListings[9], demoGuest, addDays(today, -6), Math.max(otherListings[9].min_nights, 2), "confirmed", { createdAt: now - 30 * 86_400_000 });

const EXPERIENCES = {
  Goa: [["Kayak the mangrove creeks at sunrise", "outdoors"], ["Cook a Goan fish curry lunch", "food"]],
  Manali: [["Forest trail walk with a naturalist", "outdoors"], ["Morning yoga above the valley", "wellness"]],
  Jaipur: [["Block-printing workshop in a family studio", "art"], ["Old-city bazaar and stepwell walk", "culture"]],
  Udaipur: [["Rooftop thali and spice tour", "food"], ["Miniature painting for beginners", "art"]],
  Munnar: [["Tea-estate walk and tasting", "food"], ["Misty-morning sunrise trek", "outdoors"]],
  Pondicherry: [["French-quarter heritage walk", "culture"], ["Hand-built pottery session", "art"]],
  Rishikesh: [["Riverside meditation and breathwork", "wellness"], ["Beginner white-water paddle", "outdoors"]],
  Coorg: [["Coffee estate walk, bean to cup", "food"], ["Birdwatching at dawn", "outdoors"]],
};
const STEPS = {
  outdoors: [["Meet your guide", "Quick safety briefing and gear check."], ["Head out", "A short drive or walk to the starting point."], ["The main stretch", "Take it at an easy pace with photo stops."], ["Rest and refuel", "Snacks and chai with a view."], ["Wrap up", "Back to the meeting point."]],
  food: [["Market stop", "Pick up fresh ingredients together."], ["Learn the basics", "Spices, techniques and stories behind the dish."], ["Cook", "Hands-on at your own station."], ["Sit down and eat", "Share the meal you made."]],
  art: [["Welcome", "Tea and a look around the studio."], ["Demo", "Watch the technique up close."], ["Make your own", "Guided practice, one step at a time."], ["Take it home", "Your piece is packed for travel."]],
  culture: [["Meet at the landmark", "An overview of the neighbourhood."], ["Walk the lanes", "Hidden courtyards and old facades."], ["Local stop", "A snack from a decades-old shop."], ["Stories and questions", "End at a quiet spot to talk."]],
  wellness: [["Arrive and settle", "Mats and cushions provided."], ["Warm up", "Gentle stretches for all levels."], ["Main practice", "Guided session with the view."], ["Close", "Herbal tea and a few minutes of quiet."]],
};
const TIMES = { outdoors: ["06:30", "16:00"], food: ["11:00"], art: ["10:30", "15:00"], culture: ["08:00", "17:00"], wellness: ["07:00"] };

function seedActivity({ c, ci, ei, hostId, kind, title, category, steps, offerings, providedAt, qualifications, times }) {
  const duration = pick([90, 120, 150, 180]);
  const e = {
    host_id: hostId, kind, title, category, provided_at: providedAt ?? "", qualifications: JSON.stringify(qualifications ?? []), city: c.city, area: c.areas[ei % c.areas.length],
    description: kind === "service"
      ? `${title}. Booked around your trip, with everything brought to you. Fictional sample listing for a local demo.`
      : `${title} with a local host who has done this for years. Small groups, unhurried pace, and plenty of time for questions. Fictional sample listing for a local demo.`,
    lat: c.lat + (r() - 0.5) * 0.06, lng: c.lng + (r() - 0.5) * 0.06, duration_min: duration, price_per_guest: between(8, 45) * 10000, max_guests: pick([6, 8, 10, 12]),
    meeting_point: `${c.areas[ei % c.areas.length]} main square, by the blue gate`,
    what_to_bring: pick(["Comfortable shoes, water bottle, sunscreen", "Clothes you do not mind getting messy", "An appetite and a light jacket"]),
    activity_level: pick(["Light: easy walking", "Moderate: some uphill walking", "Strenuous: expect to get wet"]),
    guest_requirements: "Ages 10 and up. Up to the listed number of guests per slot.",
    created_at: isoStamp(now - between(60, 600) * 86_400_000),
  };
  e.id = insert("experiences", e);
  (steps ?? []).forEach(([t, b], i) => insert("experience_steps", { experience_id: e.id, position: i, title: t, body: b }));
  const offeringIds = (offerings ?? []).map(([t, d, price, mins], i) => {
    const photo = `s-o${e.id}-${i}-${RUN}.svg`;
    writePhoto(photo, renderActivity(category, PALETTES[(ci + ei + i + 1) % PALETTES.length], CITY_VIEW[c.city], e.id * 100 + i));
    return insert("experience_offerings", { experience_id: e.id, title: t, description: d, price_per_guest: price, duration_min: mins, position: i, photo });
  });
  for (let i = 0; i < 4; i++) {
    const file = `s-e${e.id}-${i}-${RUN}.svg`;
    writePhoto(file, i === 0 || i === 2 ? renderActivity(category, PALETTES[(ci + ei + i) % PALETTES.length], CITY_VIEW[c.city], e.id * 10 + i) : renderScene(i === 1 ? "view" : "exterior", PALETTES[(ci + i) % PALETTES.length], CITY_VIEW[c.city], e.id * 10 + i));
    insert("experience_photos", { experience_id: e.id, file, position: i });
  }
  const slot = (date, time, cap) => {
    const start = `${date}T${time}`;
    return insert("experience_slots", { experience_id: e.id, starts_at: start, ends_at: addMinutes(start, duration), capacity: cap });
  };
  const bookSeats = (slotId, guestId, n, createdAt) => {
    const o = offeringIds.length ? pick(offeringIds) : null;
    const price = o ? offerings[offeringIds.indexOf(o)][2] : e.price_per_guest;
    const q = quoteExperience(price, n);
    return insert("experience_bookings", { slot_id: slotId, offering_id: o, guest_id: guestId, guests: n, subtotal: q.subtotal, service_fee: q.serviceFee, total: q.total, status: "confirmed", paid_with: "mock_upi", created_at: isoStamp(createdAt) });
  };
  for (let d = 1; d <= 30; d++) {
    if (r() < 0.3) continue;
    for (const t of times) {
      const id = slot(addDays(today, d), t, e.max_guests);
      if (r() < 0.4) bookSeats(id, pick(guests.slice(1)), between(1, Math.min(4, e.max_guests)), now - between(1, 20) * 86_400_000);
    }
  }
  for (let d = 1; d <= between(3, 8); d++) {
    const date = addDays(today, -d * between(3, 9));
    const id = slot(date, times[0], e.max_guests);
    const guestId = pick(guests.slice(1));
    const b = bookSeats(id, guestId, between(1, 3), Date.parse(addDays(date, -10)));
    addReview("experience", e.id, b, guestId, isoStamp(Date.parse(addDays(date, 1))), EXP_REVIEW_LINES);
  }
}

CITIES.forEach((c, ci) => {
  EXPERIENCES[c.city].forEach(([title, category], ei) => {
    seedActivity({ c, ci, ei, hostId: ci < 2 && ei === 0 ? demoHost : hosts[1 + ((ci * 2 + ei) % 11)], kind: "experience", title, category, steps: STEPS[category], times: TIMES[category] });
  });
});

const SERVICES = {
  Goa: [["Private Goan chef dinner by Rhea", "chef"], ["Sunset beach photo session", "photography"]],
  Manali: [["Mountain portrait session", "photography"], ["Deep-tissue massage after a trek", "massage"]],
  Jaipur: [["Bridal and party make-up by Noor", "makeup"], ["Rajasthani thali, cooked at your stay", "prepared_meals"]],
  Udaipur: [["Lakeside couple shoot", "photography"], ["Ayurvedic spa ritual", "spa"]],
  Munnar: [["Morning strength training in the hills", "training"], ["Kerala sadya catering", "catering"]],
  Pondicherry: [["French-quarter street portraits", "photography"], ["Hair styling at your villa", "hair"]],
  Rishikesh: [["Private yoga and mobility coaching", "training"], ["Sound-bath and massage", "massage"]],
  Coorg: [["Coorgi pork curry chef table", "chef"], ["Gel nails and spa pedicure", "nails"]],
};
const OFFERINGS = {
  photography: [["Quick portraits", "30 edited photos, one location", 450000, 60], ["Golden-hour session", "60 edited photos, two locations", 850000, 120], ["Photo session and reel", "Photos plus a short vertical video", 1150000, 180]],
  chef: [["Family-style feast", "Four sharing dishes and dessert", 220000, 150], ["Tasting menu", "Seven small courses", 380000, 180]],
  prepared_meals: [["Lunch thali", "Delivered hot to your stay", 90000, 60], ["Dinner for the week", "Seven dinners, reheat and eat", 520000, 60]],
  catering: [["Banana-leaf sadya", "Twenty dishes, served by our team", 160000, 180]],
  massage: [["60-minute massage", "Swedish or deep tissue", 350000, 60], ["90-minute massage", "With hot oil", 480000, 90]],
  spa: [["Abhyanga ritual", "Warm-oil massage and steam", 420000, 90], ["Couples ritual", "Side-by-side treatment", 780000, 120]],
  training: [["Single session", "Strength or mobility, all levels", 150000, 60], ["Five-session pack", "Plan built around your trip", 650000, 60]],
  makeup: [["Party look", "Make-up and lashes", 300000, 90], ["Bridal look", "Trial plus wedding day", 1500000, 180]],
  hair: [["Blow-dry and style", "Waves, curls or sleek", 180000, 60], ["Event updo", "Braids or bun with accessories", 320000, 90]],
  nails: [["Gel manicure", "Shape, cuticle care and gel colour", 150000, 60], ["Spa pedicure", "Soak, scrub and polish", 180000, 75]],
};
const QUALIFICATIONS = ["10+ years of experience", "Trained at a recognised institute", "Featured in local press", "Works with boutique stays across the region"];
CITIES.forEach((c, ci) => {
  SERVICES[c.city].forEach(([title, category], ei) => {
    seedActivity({
      c, ci, ei, hostId: ci < 2 && ei === 1 ? demoHost : hosts[1 + ((ci * 2 + ei + 5) % 11)], kind: "service", title, category, offerings: OFFERINGS[category],
      providedAt: category === "photography" ? "Provided at a location of your choice" : "Provided at your stay", qualifications: QUALIFICATIONS.filter(() => r() < 0.7),
      times: ["10:00", "16:00"],
    });
  });
});

const goaExp = db.prepare("SELECT s.id FROM experience_slots s JOIN experiences e ON e.id = s.experience_id WHERE e.host_id != ? AND s.starts_at > ? ORDER BY s.starts_at LIMIT 1 OFFSET 5").get(demoHost, `${today}T23:59`);
if (goaExp) {
  const e = db.prepare("SELECT e.price_per_guest FROM experiences e JOIN experience_slots s ON s.experience_id = e.id WHERE s.id = ?").get(goaExp.id);
  const q = quoteExperience(e.price_per_guest, 2);
  insert("experience_bookings", { slot_id: goaExp.id, guest_id: demoGuest, guests: 2, subtotal: q.subtotal, service_fee: q.serviceFee, total: q.total, status: "confirmed", paid_with: "mock_card", created_at: isoStamp(now - 86_400_000) });
}

const wish = insert("wishlists", { user_id: demoGuest, name: "Hill getaways" });
for (const l of listings.filter((x) => ["Manali", "Munnar", "Coorg"].includes(x.city)).slice(0, 4)) db.prepare("INSERT INTO wishlist_items (wishlist_id, kind, item_id) VALUES (?, 'listing', ?)").run(wish, l.id);

const thread = insert("threads", { guest_id: demoGuest, host_id: upcomingTrip.host_id, kind: "listing", item_id: upcomingTrip.id });
insert("messages", { thread_id: thread, sender_id: demoGuest, body: "Hi! Is there parking for one car?", created_at: isoStamp(now - 2 * 86_400_000) });
insert("messages", { thread_id: thread, sender_id: upcomingTrip.host_id, body: "Yes, there is a covered spot right by the gate. See you soon!", created_at: isoStamp(now - 86_400_000) });

const overlaps = db.prepare(`SELECT a.id, b.id AS other FROM bookings a JOIN bookings b ON a.listing_id = b.listing_id AND a.id < b.id
  WHERE a.status IN ('pending', 'confirmed') AND b.status IN ('pending', 'confirmed') AND a.check_in < b.check_out AND b.check_in < a.check_out`).all();
const blockedClash = db.prepare(`SELECT b.id FROM bookings b JOIN blocked_nights n ON n.listing_id = b.listing_id
  WHERE b.status IN ('pending', 'confirmed') AND n.night >= b.check_in AND n.night < b.check_out`).all();
if (overlaps.length || blockedClash.length) {
  process.stderr.write(`Seed produced clashing stays: ${JSON.stringify({ overlaps, blockedClash })}\n`);
  process.exit(1);
}

const count = (t) => db.prepare(`SELECT count(*) n FROM ${t}`).get().n;
process.stdout.write(
  `Seeded ${count("listings")} listings, ${count("experiences")} experiences, ${count("users")} users, ${count("bookings")} stays, ${count("reviews")} reviews into ${dbPath}\n`,
);
db.close();
