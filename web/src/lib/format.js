import { freeCancelUntil } from "@shared/cancellation.js";
import { addDays } from "@shared/dates.js";
import { COPY } from "@/copy.js";
import { currentCurrency, currentLocale, RATES } from "@/lib/currency.js";

const CURRENCY = currentCurrency();
const moneyFormat = new Intl.NumberFormat(currentLocale(), { style: "currency", currency: CURRENCY, maximumFractionDigits: 0 });
const short = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", timeZone: "UTC" });
const day = new Intl.DateTimeFormat("en-IN", { day: "numeric", timeZone: "UTC" });
const long = new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const monthYear = new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric", timeZone: "UTC" });
const time = new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit", timeZone: "UTC" });
const slotDay = new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });

const asUtc = (iso) => new Date(`${iso.slice(0, 10)}T00:00:00Z`);

export const money = (paise) => moneyFormat.format(Math.round((paise / 100) * RATES[CURRENCY]));
export const shortDate = (iso) => short.format(asUtc(iso));
export const longDate = (iso) => long.format(asUtc(iso));
export const monthLabel = (ym) => monthYear.format(asUtc(`${ym}-01`));

export function dateRange(from, to) {
  if (!from || !to) return "";
  if (from.slice(0, 7) === to.slice(0, 7)) return `${day.format(asUtc(from))}–${short.format(asUtc(to))}`;
  return `${short.format(asUtc(from))} – ${short.format(asUtc(to))}`;
}

export function slotLabel(startsAt, endsAt, today) {
  const d = startsAt.slice(0, 10);
  const name = d === today ? COPY.DAYS.TODAY : d === addDays(today, 1) ? COPY.DAYS.TOMORROW : slotDay.format(asUtc(d));
  const t = (s) => time.format(new Date(`${s}:00Z`)).toLowerCase();
  return { day: name, time: `${t(startsAt)} – ${t(endsAt)}` };
}

export const fieldDate = (iso) => (iso ? asUtc(iso).toLocaleDateString("en-IN", { timeZone: "UTC" }) : COPY.SEARCH.ADD_DATES);

export function cancellationText(policy, checkIn) {
  if (!checkIn) return COPY.CANCEL_POLICY.SUMMARY[policy];
  const dated = policy === "strict" ? COPY.CANCEL_POLICY.DATED.strict : COPY.CANCEL_POLICY.DATED.flexible;
  return dated(shortDate(freeCancelUntil(policy, checkIn)));
}

export const yearsSince = (stamp) => Math.max(0, Math.floor((Date.now() - Date.parse(stamp.replace(" ", "T"))) / (365.25 * 86_400_000)));
export const photoUrl = (file) => `/photos/${file}`;
export const rating = (r) => (r == null ? null : r.toFixed(Math.round(r * 100) % 10 === 0 ? 1 : 2));
