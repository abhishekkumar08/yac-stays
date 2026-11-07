import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "ys_session";
const SESSION_DAYS = 30;
const KEY_LEN = 32;
const sha256 = (s) => createHash("sha256").update(s).digest("hex");

export function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  return `scrypt$${salt}$${scryptSync(password, salt, KEY_LEN).toString("hex")}`;
}

export function verifyPassword(password, stored) {
  const [scheme, salt, hash] = String(stored).split("$");
  if (scheme !== "scrypt" || !salt || !hash) return false;
  const expected = Buffer.from(hash, "hex");
  const actual = scryptSync(password, salt, KEY_LEN);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function createSession(db, userId, now = Date.now()) {
  const token = randomBytes(32).toString("base64url");
  db.prepare("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)").run(
    sha256(token),
    userId,
    now + SESSION_DAYS * 86_400_000,
  );
  return token;
}

export function userForToken(db, token, now = Date.now()) {
  if (!token) return null;
  return (
    db
      .prepare(
        `SELECT u.id, u.email, u.name, u.is_host, u.about, u.city, u.avatar_hue, u.created_at
         FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > ?`,
      )
      .get(sha256(token), now) ?? null
  );
}

export const deleteSession = (db, token) => db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(sha256(token));
