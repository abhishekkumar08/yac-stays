const SERVICE_FEE_RATE = 0.14;
const HOST_FEE_RATE = 0.03;
const WEEKLY_NIGHTS = 7;
const MONTHLY_NIGHTS = 28;

export const PAYMENT_METHODS = ["mock_card", "mock_upi"];

const serviceFee = (base) => Math.round(base * SERVICE_FEE_RATE);

function discountFor(nights, { weeklyDiscountPct = 0, monthlyDiscountPct = 0 }) {
  if (nights >= MONTHLY_NIGHTS && monthlyDiscountPct) return { pct: monthlyDiscountPct, kind: "monthly" };
  if (nights >= WEEKLY_NIGHTS && weeklyDiscountPct) return { pct: weeklyDiscountPct, kind: "weekly" };
  return { pct: 0, kind: null };
}

export function quoteStay(pricing, nights) {
  const { nightly, cleaningFee, prices } = pricing;
  const subtotal = prices ? prices.reduce((sum, p) => sum + p, 0) : nightly * nights;
  const { pct, kind } = discountFor(nights, pricing);
  const discount = Math.round((subtotal * pct) / 100);
  const base = subtotal - discount + cleaningFee;
  const total = base + serviceFee(base);
  const originalTotal = discount ? subtotal + cleaningFee + serviceFee(subtotal + cleaningFee) : total;
  return {
    nights, nightly: Math.round(subtotal / nights), subtotal, discount, discountKind: kind, cleaningFee,
    serviceFee: serviceFee(base), total, originalTotal,
  };
}

export function quoteExperience(pricePerGuest, guests) {
  const subtotal = pricePerGuest * guests;
  return { guests, subtotal, serviceFee: serviceFee(subtotal), total: subtotal + serviceFee(subtotal) };
}

export const hostPayout = (q) => q.total - q.serviceFee - Math.round(q.subtotal * HOST_FEE_RATE);
