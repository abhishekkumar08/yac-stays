import { test } from "node:test";
import assert from "node:assert/strict";
import { addDays, addMonths, eachNight, isIsoDate, nightsBetween } from "../shared/dates.js";

test("nightsBetween counts nights", () => assert.equal(nightsBetween("2026-11-20", "2026-11-23"), 3));
test("addDays crosses year end", () => assert.equal(addDays("2026-12-31", 1), "2027-01-01"));
test("eachNight lists nights, not the checkout day", () =>
  assert.deepEqual(eachNight("2026-11-20", "2026-11-22"), ["2026-11-20", "2026-11-21"]));
test("eachNight is empty for reversed range", () => assert.deepEqual(eachNight("2026-11-22", "2026-11-20"), []));
test("isIsoDate rejects impossible dates", () => {
  assert.equal(isIsoDate("2026-02-30"), false);
  assert.equal(isIsoDate("2026-2-3"), false);
  assert.equal(isIsoDate("2026-02-28"), true);
});
test("addMonths moves by calendar months across years", () => {
  assert.equal(addMonths("2026-11-15", 3), "2027-02-15");
});
