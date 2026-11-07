import { test } from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { Worker } from "node:worker_threads";
import { addListing, addUser, NOW, tempDb } from "./helpers.js";

test("two simultaneous bookings for the same nights: exactly one wins", { timeout: 30_000 }, async () => {
  const { db, path } = tempDb();
  const host = addUser(db, "host@stays.test", { isHost: 1 });
  const listingId = addListing(db, host);
  const guests = [addUser(db, "a@stays.test"), addUser(db, "b@stays.test")];
  for (let round = 0; round < 5; round++) {
    db.prepare("DELETE FROM bookings").run();
    const gate = new SharedArrayBuffer(8);
    const flag = new Int32Array(gate);
    const workers = guests.map(
      (guestId) => new Worker(new URL("./race-worker.js", import.meta.url), { workerData: { path, listingId, guestId, gate, now: NOW } }),
    );
    while (Atomics.load(flag, 1) < workers.length) await new Promise((r) => setTimeout(r, 5));
    Atomics.store(flag, 0, 1);
    Atomics.notify(flag, 0);
    const results = await Promise.all(workers.map((w) => once(w, "message", { signal: AbortSignal.timeout(10_000) }).then(([m]) => m)));
    assert.deepEqual(results.sort(), ["ok", "unavailable"]);
    assert.equal(db.prepare("SELECT count(*) c FROM bookings").get().c, 1);
  }
});
