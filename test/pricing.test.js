import { test } from "node:test";
import assert from "node:assert/strict";
import { hostPayout, quoteExperience, quoteStay } from "../shared/pricing.js";
import { freeCancelUntil, refundFor } from "../shared/cancellation.js";

const listing = { nightly: 400000, cleaningFee: 50000, weeklyDiscountPct: 10 };

test("quoteStay for 3 nights has no discount", () => {
  const q = quoteStay(listing, 3);
  assert.equal(q.subtotal, 1200000);
  assert.equal(q.discount, 0);
  assert.equal(q.serviceFee, Math.round(1250000 * 0.14));
  assert.equal(q.total, 1250000 + 175000);
  assert.equal(q.originalTotal, q.total);
});
test("quoteStay for 7 nights applies weekly discount", () => {
  const q = quoteStay(listing, 7);
  assert.equal(q.discount, 280000);
  assert.equal(q.total, 2570000 + Math.round(2570000 * 0.14));
  assert.ok(q.originalTotal > q.total);
});
test("quoteExperience multiplies by guests and adds fee", () => {
  assert.deepEqual(quoteExperience(125000, 2), { guests: 2, subtotal: 250000, serviceFee: 35000, total: 285000 });
});
test("hostPayout removes guest fee and 3% host fee", () => {
  const q = quoteStay(listing, 3);
  assert.equal(hostPayout(q), q.total - q.serviceFee - 36000);
});

const b = { check_in: "2026-11-20", total: 1425000, subtotal: 1200000, discount: 0 };
test("freeCancelUntil per policy", () => {
  assert.equal(freeCancelUntil("flexible", "2026-11-20"), "2026-11-19");
  assert.equal(freeCancelUntil("moderate", "2026-11-20"), "2026-11-15");
  assert.equal(freeCancelUntil("strict", "2026-11-20"), "2026-11-06");
});
test("full refund before the free-cancel date", () =>
  assert.deepEqual(refundFor("moderate", b, "2026-11-14"), { refund: 1425000, kind: "full" }));
test("partial refund on and after the free-cancel date for moderate", () =>
  assert.deepEqual(refundFor("moderate", b, "2026-11-15"), { refund: 600000, kind: "partial" }));
test("strict gives nothing after its date", () =>
  assert.deepEqual(refundFor("strict", b, "2026-11-10"), { refund: 0, kind: "none" }));
test("nothing back from check-in day on", () =>
  assert.deepEqual(refundFor("flexible", b, "2026-11-20"), { refund: 0, kind: "none" }));

test("quoteStay sums per-night prices and reports their average", () => {
  const q = quoteStay({ ...listing, prices: [400000, 500000, 600000] }, 3);
  assert.equal(q.subtotal, 1500000);
  assert.equal(q.nightly, 500000);
});
test("monthly discount replaces weekly from 28 nights", () => {
  const q = quoteStay({ ...listing, monthlyDiscountPct: 25 }, 28);
  assert.equal(q.discount, Math.round(400000 * 28 * 0.25));
  assert.equal(q.discountKind, "monthly");
  assert.equal(quoteStay(listing, 7).discountKind, "weekly");
  assert.equal(quoteStay(listing, 3).discountKind, null);
});
