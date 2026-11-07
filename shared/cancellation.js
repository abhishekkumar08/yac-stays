import { addDays } from "./dates.js";

export const POLICIES = ["flexible", "moderate", "strict"];
const FULL_REFUND_DAYS = { flexible: 1, moderate: 5, strict: 14 };

export const freeCancelUntil = (policy, checkIn) => addDays(checkIn, -FULL_REFUND_DAYS[policy]);

export function refundFor(policy, booking, today) {
  if (today >= booking.check_in) return { refund: 0, kind: "none" };
  if (today < freeCancelUntil(policy, booking.check_in)) return { refund: booking.total, kind: "full" };
  if (policy === "strict") return { refund: 0, kind: "none" };
  return { refund: Math.round((booking.subtotal - booking.discount) / 2), kind: "partial" };
}
