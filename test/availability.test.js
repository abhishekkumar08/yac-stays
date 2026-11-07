import { test } from "node:test";
import assert from "node:assert/strict";
import { canCheckOut, dayState, occupiedNights, stayError } from "../shared/availability.js";

const today = "2026-11-01";
const rules = { minNights: 2, maxGuests: 4 };
const occ = occupiedNights([{ check_in: "2026-11-10", check_out: "2026-11-13" }], ["2026-11-20"]);
const stay = (checkIn, checkOut, guests = 2) => stayError({ checkIn, checkOut, guests }, rules, occ, today);

test("occupiedNights holds booked nights and blocked nights, not checkout day", () => {
  assert.deepEqual([...occ].sort(), ["2026-11-10", "2026-11-11", "2026-11-12", "2026-11-20"]);
});
test("back-to-back stays are allowed on both sides", () => {
  assert.equal(stay("2026-11-08", "2026-11-10"), null);
  assert.equal(stay("2026-11-13", "2026-11-15"), null);
});
test("one overlapping night is unavailable", () => assert.equal(stay("2026-11-12", "2026-11-14"), "unavailable"));
test("blocked night is unavailable", () => assert.equal(stay("2026-11-19", "2026-11-21"), "unavailable"));
test("minimum nights enforced", () => assert.equal(stay("2026-11-05", "2026-11-06"), "min_nights"));
test("guests above max rejected", () => assert.equal(stay("2026-11-05", "2026-11-07", 5), "max_guests"));
test("zero guests rejected", () => assert.equal(stay("2026-11-05", "2026-11-07", 0), "max_guests"));
test("past check-in rejected", () => assert.equal(stay("2026-10-30", "2026-11-02"), "past"));
test("checkout before checkin rejected", () => assert.equal(stay("2026-11-07", "2026-11-05"), "invalid_dates"));
test("malformed dates rejected", () => assert.equal(stay("2026-11-7", "2026-11-09"), "invalid_dates"));

test("dayState: past, available, checkout-only, unavailable", () => {
  assert.equal(dayState("2026-10-31", occ, 2, today), "past");
  assert.equal(dayState("2026-11-05", occ, 2, today), "available");
  assert.equal(dayState("2026-11-10", occ, 2, today), "checkout_only");
  assert.equal(dayState("2026-11-11", occ, 2, today), "unavailable");
});
test("dayState: free day with too short a gap has no valid checkout", () => {
  assert.equal(dayState("2026-11-09", occ, 2, today), "no_checkout");
  assert.equal(dayState("2026-11-19", occ, 2, today), "no_checkout");
});
test("dayState: occupied today is unavailable, not checkout-only", () => {
  const o = occupiedNights([], ["2026-11-01"]);
  assert.equal(dayState("2026-11-01", o, 1, today), "unavailable");
});
test("canCheckOut respects min nights and occupied nights", () => {
  assert.equal(canCheckOut("2026-11-05", "2026-11-06", occ, 2), false);
  assert.equal(canCheckOut("2026-11-05", "2026-11-07", occ, 2), true);
  assert.equal(canCheckOut("2026-11-05", "2026-11-10", occ, 2), true);
  assert.equal(canCheckOut("2026-11-05", "2026-11-11", occ, 2), false);
});
