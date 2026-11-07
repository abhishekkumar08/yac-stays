import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { qs } from "@/lib/api.js";
import { useApi } from "@/lib/useApi.js";
import { stayError } from "@shared/availability.js";
import { eachNight, nightsBetween } from "@shared/dates.js";
import { quoteStay } from "@shared/pricing.js";

export const stayQuery = (stay) =>
  qs({ check_in: stay.checkIn, check_out: stay.checkOut, adults: stay.adults, children: stay.children || undefined, infants: stay.infants || undefined, pets: stay.pets || undefined });

export function useStayParams() {
  const [params, setParams] = useSearchParams();
  const get = (k) => params.get(k) || null;
  const state = {
    checkIn: get("check_in"),
    checkOut: get("check_out"),
    adults: Number(get("adults")) || 1,
    children: Number(get("children")) || 0,
    infants: Number(get("infants")) || 0,
    pets: Number(get("pets")) || 0,
  };
  const set = (next) => {
    setParams(new URLSearchParams(stayQuery({ ...state, ...next })), { replace: true });
  };
  return [state, set];
}

export function useStayQuote(listing, availability, stay) {
  return useMemo(() => {
    if (!listing || !availability) return { quote: null, error: null };
    const guests = stay.adults + stay.children;
    const error = stay.checkIn && stay.checkOut
      ? stayError({ checkIn: stay.checkIn, checkOut: stay.checkOut, guests }, { minNights: listing.minNights, maxGuests: listing.maxGuests }, availability.occupiedSet, availability.today)
      : "invalid_dates";
    const prices = error ? null : eachNight(stay.checkIn, stay.checkOut).map((n) => availability.prices?.[n] ?? listing.nightly);
    const quote = !error
      ? quoteStay({ nightly: listing.nightly, cleaningFee: listing.cleaningFee, weeklyDiscountPct: listing.weeklyDiscountPct, monthlyDiscountPct: listing.monthlyDiscountPct, prices }, nightsBetween(stay.checkIn, stay.checkOut))
      : null;
    return { quote, error };
  }, [listing, availability, stay.checkIn, stay.checkOut, stay.adults, stay.children]);
}

export function useListingStay(id) {
  const detail = useApi(`/api/listings/${id}`);
  const avail = useApi(`/api/listings/${id}/availability`);
  const availability = useMemo(() => avail.data && { ...avail.data, occupiedSet: new Set(avail.data.occupied) }, [avail.data]);
  const [stay, setStay] = useStayParams();
  const { quote, error } = useStayQuote(detail.data, availability, stay);
  return { detail, avail, listing: detail.data, availability, stay, setStay, quote, error };
}
