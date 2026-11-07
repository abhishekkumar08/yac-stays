import { stayError } from "./availability.js";
import { addDays, toDay } from "./dates.js";

const FLEX_NIGHTS = { weekend: 2, week: 7, month: 28 };
const FRIDAY = 5;

const weekday = (iso) => new Date(toDay(iso) * 86_400_000).getUTCDay();

function monthDays(month) {
  const days = [];
  for (let d = `${month}-01`; d.startsWith(month); d = addDays(d, 1)) days.push(d);
  return days;
}

export function candidateWindows({ checkIn, checkOut, flexDays = 0, flexKind, flexMonths = [] }, today) {
  if (flexKind) {
    const nights = FLEX_NIGHTS[flexKind];
    return flexMonths
      .flatMap(monthDays)
      .filter((d) => d >= today && (flexKind !== "weekend" || weekday(d) === FRIDAY))
      .map((d) => ({ checkIn: d, checkOut: addDays(d, nights) }));
  }
  const shifts = [0];
  for (let s = 1; s <= flexDays; s++) shifts.push(-s, s);
  return shifts
    .map((s) => ({ checkIn: addDays(checkIn, s), checkOut: addDays(checkOut, s) }))
    .filter((w) => w.checkIn >= today);
}

export function firstFreeWindow(windows, rules, occupied, today, guests) {
  return windows.find((w) => !stayError({ ...w, guests }, rules, occupied, today)) ?? null;
}
