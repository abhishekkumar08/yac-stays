import { localMinute } from "../../shared/dates.js";
import { AppError, SLOT_SELECT } from "../bookings.js";
import { EXPERIENCE_SELECT, experienceCard, hostProfile } from "../cards.js";
import { idParam } from "../guards.js";

export const CATEGORIES = ["culture", "outdoors", "food", "wellness", "art"];
export const SERVICE_CATEGORIES = ["photography", "chef", "prepared_meals", "massage", "spa", "training", "makeup", "hair", "nails", "catering"];
const KINDS = ["experience", "service"];

export default function experienceRoutes(app, { db, now }) {
  app.get("/api/experiences", (req) => {
    const kind = KINDS.includes(req.query.kind) ? req.query.kind : "experience";
    const where = ["e.status = 'listed'", "e.kind = ?"];
    const args = [kind];
    if (req.query.where) {
      where.push("(e.city LIKE ? OR e.area LIKE ? OR e.title LIKE ?)");
      args.push(...Array(3).fill(`%${req.query.where}%`));
    }
    if (req.query.category) {
      where.push("e.category = ?");
      args.push(req.query.category);
    }
    const items = db.prepare(`${EXPERIENCE_SELECT} WHERE ${where.join(" AND ")} ORDER BY coalesce(r.rating, 0) DESC, e.id`).all(...args).map(experienceCard);
    const cities = [...new Set(items.map((i) => i.city))];
    return {
      items,
      categories: (kind === "service" ? SERVICE_CATEGORIES : CATEGORIES).map((c) => ({ category: c, items: items.filter((i) => i.category === c) })).filter((c) => c.items.length),
      cities: cities.map((city) => ({ city, items: items.filter((i) => i.city === city) })),
    };
  });

  app.get("/api/experiences/:id", { schema: { params: idParam } }, (req) => {
    const row = db.prepare(`${EXPERIENCE_SELECT} WHERE e.id = ? AND e.status = 'listed'`).get(req.params.id);
    if (!row) throw new AppError(404, "not_found");
    const slots = db.prepare(`${SLOT_SELECT} WHERE s.experience_id = ? AND s.starts_at > ? ORDER BY s.starts_at LIMIT 60`).all(row.id, localMinute(now()));
    return {
      ...experienceCard(row),
      description: row.description,
      maxGuests: row.max_guests,
      meetingPoint: row.meeting_point,
      whatToBring: row.what_to_bring,
      activityLevel: row.activity_level,
      guestRequirements: row.guest_requirements,
      hostId: row.host_id,
      photos: db.prepare("SELECT file FROM experience_photos WHERE experience_id = ? ORDER BY position, id").all(row.id).map((p) => p.file),
      steps: db.prepare("SELECT title, body FROM experience_steps WHERE experience_id = ? ORDER BY position").all(row.id),
      offerings: db.prepare("SELECT id, title, description, price_per_guest AS pricePerGuest, duration_min AS durationMin, photo FROM experience_offerings WHERE experience_id = ? AND active = 1 ORDER BY position, id").all(row.id),
      providedAt: row.provided_at,
      qualifications: JSON.parse(row.qualifications),
      slots: slots.map((s) => ({ id: s.id, startsAt: s.starts_at, endsAt: s.ends_at, capacity: s.capacity, seatsLeft: s.capacity - s.seats_taken })),
      reviews: db.prepare(`SELECT r.id, r.overall, r.body, r.created_at AS createdAt, u.name AS author, u.city AS authorCity, u.avatar_hue AS avatarHue
                           FROM reviews r JOIN users u ON u.id = r.author_id WHERE r.kind = 'experience' AND r.item_id = ? ORDER BY r.id DESC`).all(row.id),
      host: hostProfile(db, row.host_id),
      more: db.prepare(`${EXPERIENCE_SELECT} WHERE e.city = ? AND e.id != ? AND e.status = 'listed' LIMIT 8`).all(row.city, row.id).map(experienceCard),
    };
  });
}
