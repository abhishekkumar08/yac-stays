import { qs } from "@/lib/api.js";

export const FILTER_KEYS = ["minPrice", "maxPrice", "roomType", "bedrooms", "beds", "bathrooms", "amenities", "instant", "freeCancel", "favourite", "luxe", "types", "languages"];
const DATE_KEYS = ["checkin", "checkout", "flex", "flexKind", "flexMonths"];

export function searchApiUrl(where, q) {
  const guests = (Number(q.adults) || 0) + (Number(q.children) || 0);
  const pick = (keys) => Object.fromEntries(keys.map((k) => [k, q[k]]));
  return `/api/search${qs({ where, guests: guests || undefined, ...pick(DATE_KEYS), ...pick(FILTER_KEYS), bbox: q.bbox, page: q.page })}`;
}

export const listParam = (v) => (v ? String(v).split(",").filter(Boolean) : []);

export function toggleInList(filters, key, value) {
  const set = new Set(listParam(filters[key]));
  if (set.has(value)) set.delete(value);
  else set.add(value);
  return { ...filters, [key]: [...set].join(",") };
}
