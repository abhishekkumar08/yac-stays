import { test } from "node:test";
import assert from "node:assert/strict";
import { candidateWindows, firstFreeWindow } from "../shared/windows.js";
import { occupiedNights } from "../shared/availability.js";

const today = "2026-11-01";
const rules = { minNights: 2, maxGuests: 4 };

test("±N days tries the exact range first, then nearest shifts", () => {
  const w = candidateWindows({ checkIn: "2026-11-10", checkOut: "2026-11-12", flexDays: 2 }, today);
  assert.deepEqual(w.slice(0, 3), [
    { checkIn: "2026-11-10", checkOut: "2026-11-12" },
    { checkIn: "2026-11-09", checkOut: "2026-11-11" },
    { checkIn: "2026-11-11", checkOut: "2026-11-13" },
  ]);
  assert.equal(w.length, 5);
});
test("±N days never starts before today", () => {
  const w = candidateWindows({ checkIn: "2026-11-01", checkOut: "2026-11-03", flexDays: 3 }, today);
  assert.ok(w.every((x) => x.checkIn >= today));
});
test("weekend windows are Friday to Sunday inside the chosen months", () => {
  const w = candidateWindows({ flexKind: "weekend", flexMonths: ["2026-11"] }, today);
  assert.deepEqual(w[0], { checkIn: "2026-11-06", checkOut: "2026-11-08" });
  assert.ok(w.every((x) => new Date(`${x.checkIn}T00:00:00Z`).getUTCDay() === 5 && x.checkIn.startsWith("2026-11")));
});
test("week and month windows have 7 and 28 nights", () => {
  assert.deepEqual(candidateWindows({ flexKind: "week", flexMonths: ["2026-12"] }, today)[0], { checkIn: "2026-12-01", checkOut: "2026-12-08" });
  assert.deepEqual(candidateWindows({ flexKind: "month", flexMonths: ["2026-12"] }, today)[0], { checkIn: "2026-12-01", checkOut: "2026-12-29" });
});
test("firstFreeWindow skips windows that clash", () => {
  const occupied = occupiedNights([{ check_in: "2026-11-10", check_out: "2026-11-12" }]);
  const w = candidateWindows({ checkIn: "2026-11-10", checkOut: "2026-11-12", flexDays: 3 }, today);
  assert.deepEqual(firstFreeWindow(w, rules, occupied, today, 2), { checkIn: "2026-11-08", checkOut: "2026-11-10" });
  assert.equal(firstFreeWindow([{ checkIn: "2026-11-10", checkOut: "2026-11-12" }], rules, occupied, today, 2), null);
});
