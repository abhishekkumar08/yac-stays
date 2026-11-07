const DAY = 86_400_000;

export const toDay = (iso) => Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)) / DAY;
const fromDay = (n) => new Date(n * DAY).toISOString().slice(0, 10);
export const addDays = (iso, n) => fromDay(toDay(iso) + n);
export const nightsBetween = (checkIn, checkOut) => toDay(checkOut) - toDay(checkIn);
export const eachNight = (checkIn, checkOut) =>
  Array.from({ length: Math.max(0, nightsBetween(checkIn, checkOut)) }, (_, i) => addDays(checkIn, i));
export const isIsoDate = (s) => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && fromDay(toDay(s)) === s;

const pad = (n) => String(n).padStart(2, "0");
export const todayIso = (now = Date.now()) => {
  const d = new Date(now);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
export const localMinute = (now = Date.now()) =>
  new Date(now - new Date(now).getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
export const addMinutes = (minuteIso, n) => new Date(Date.parse(`${minuteIso}:00Z`) + n * 60_000).toISOString().slice(0, 16);
export const addMonths = (iso, n) => {
  const d = new Date(toDay(iso) * 86_400_000);
  d.setUTCMonth(d.getUTCMonth() + n);
  return d.toISOString().slice(0, 10);
};
