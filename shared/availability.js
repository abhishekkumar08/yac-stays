import { addDays, eachNight, isIsoDate, nightsBetween } from "./dates.js";

export function occupiedNights(stays, blocked = []) {
  const set = new Set(blocked);
  for (const s of stays) for (const n of eachNight(s.check_in, s.check_out)) set.add(n);
  return set;
}

const freeRun = (from, nights, occupied) => eachNight(from, addDays(from, nights)).every((n) => !occupied.has(n));

export function stayError({ checkIn, checkOut, guests }, { minNights, maxGuests }, occupied, today) {
  if (!isIsoDate(checkIn) || !isIsoDate(checkOut) || checkOut <= checkIn) return "invalid_dates";
  if (checkIn < today) return "past";
  if (nightsBetween(checkIn, checkOut) < minNights) return "min_nights";
  if (!(Number.isInteger(guests) && guests >= 1 && guests <= maxGuests)) return "max_guests";
  if (!freeRun(checkIn, nightsBetween(checkIn, checkOut), occupied)) return "unavailable";
  return null;
}

export function dayState(date, occupied, minNights, today) {
  if (date < today) return "past";
  if (occupied.has(date)) {
    const prev = addDays(date, -1);
    return occupied.has(prev) || prev < today ? "unavailable" : "checkout_only";
  }
  return freeRun(date, minNights, occupied) ? "available" : "no_checkout";
}

export const canCheckOut = (checkIn, date, occupied, minNights) =>
  date > checkIn &&
  nightsBetween(checkIn, date) >= minNights &&
  freeRun(checkIn, nightsBetween(checkIn, date), occupied);
