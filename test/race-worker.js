import { workerData, parentPort } from "node:worker_threads";
import { openDb } from "../server/db.js";
import { createBooking } from "../server/bookings.js";

const { path, listingId, guestId, gate, now } = workerData;
const db = openDb(path);
const flag = new Int32Array(gate);
Atomics.add(flag, 1, 1);
Atomics.wait(flag, 0, 0);
try {
  createBooking(db, { listingId, guestId, checkIn: "2026-11-20", checkOut: "2026-11-23", guests: 2, paidWith: "mock_card" }, now);
  parentPort.postMessage("ok");
} catch (e) {
  parentPort.postMessage(e.code ?? String(e));
} finally {
  db.close();
}
