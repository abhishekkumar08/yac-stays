import { test } from "node:test";
import assert from "node:assert/strict";
import { createSession, hashPassword, userForToken, verifyPassword } from "../server/auth.js";
import { addUser, NOW, tempDb } from "./helpers.js";

test("password hash verifies and rejects wrong password", () => {
  const stored = hashPassword("stays-demo-1");
  assert.match(stored, /^scrypt\$/);
  assert.equal(verifyPassword("stays-demo-1", stored), true);
  assert.equal(verifyPassword("wrong", stored), false);
  assert.equal(verifyPassword("x", "garbage"), false);
});

test("session token finds its user until it expires", () => {
  const { db } = tempDb();
  const id = addUser(db, "a@stays.test");
  const token = createSession(db, id, NOW);
  assert.equal(userForToken(db, token, NOW).id, id);
  assert.equal(userForToken(db, token, NOW + 31 * 86_400_000), null);
  assert.equal(userForToken(db, "nope", NOW), null);
});

test("raw token is not stored", () => {
  const { db } = tempDb();
  const token = createSession(db, addUser(db, "b@stays.test"), NOW);
  assert.equal(db.prepare("SELECT count(*) c FROM sessions WHERE token_hash = ?").get(token).c, 0);
});
