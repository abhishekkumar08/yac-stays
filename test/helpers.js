import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after } from "node:test";
import { openDb } from "../server/db.js";

export const NOW = Date.parse("2026-11-01T10:00:00");

export function tempDb() {
  const dir = mkdtempSync(join(tmpdir(), "yac-stays-"));
  const path = join(dir, "test.db");
  const db = openDb(path);
  after(() => {
    db.close();
    rmSync(dir, { recursive: true, force: true });
  });
  return { db, path, dir };
}

export function addUser(db, email, { isHost = 0 } = {}) {
  return db
    .prepare("INSERT INTO users (email, name, password_hash, is_host) VALUES (?, ?, 'x', ?) RETURNING id")
    .get(email, email.split("@")[0], isHost).id;
}

export function addListing(db, hostId, over = {}) {
  const l = {
    host_id: hostId, title: "Test flat", description: "", property_type: "Flat", room_type: "entire",
    city: "Goa", area: "Candolim", state: "Goa", lat: 15.5, lng: 73.76, max_guests: 4, bedrooms: 1, beds: 1,
    bathrooms: 1, nightly: 400000, cleaning_fee: 50000, weekly_discount_pct: 10, min_nights: 2, instant_book: 1,
    cancellation_policy: "moderate", status: "listed", ...over,
  };
  const cols = Object.keys(l);
  return db
    .prepare(`INSERT INTO listings (${cols.join(",")}) VALUES (${cols.map(() => "?").join(",")}) RETURNING id`)
    .get(...Object.values(l)).id;
}
