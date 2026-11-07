import { RangeCalendar } from "@kasumi/ui";
import { canCheckOut, dayState } from "@shared/availability.js";
import { COPY } from "@/copy.js";

const TO_KASUMI = { available: "available", no_checkout: "no_end", checkout_only: "end_only", unavailable: "disabled", past: "disabled" };

export function StayCalendar({ availability, start, end, onChange }) {
  const occupied = availability.occupiedSet;
  return (
    <RangeCalendar
      months={2}
      start={start}
      end={end}
      minDate={availability.today}
      onChange={onChange}
      getDayState={(d) => TO_KASUMI[dayState(d, occupied, availability.minNights, availability.today)]}
      isValidEnd={(s, d) => canCheckOut(s, d, occupied, availability.minNights)}
      stateLabels={COPY.LISTING.DAY_STATE(availability.minNights)}
    />
  );
}
