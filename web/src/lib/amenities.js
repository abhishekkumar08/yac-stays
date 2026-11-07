import { COPY } from "@/copy.js";
import {
  Accessibility, AirVent, Bath, Bike, Car, Coffee, Croissant, Cross, DoorOpen, Droplets, Flame, Flower2, KeyRound, Laptop, Leaf, Mountain, PawPrint,
  Shirt, Siren, Sun, ThermometerSun, Trees, Tv, Umbrella, UtensilsCrossed, Waves, Wifi, Wind,
} from "lucide-react";

const ICONS = {
  wifi: Wifi,
  kitchen: UtensilsCrossed,
  ac: AirVent,
  pool: Waves,
  free_parking: Car,
  washer: Shirt,
  workspace: Laptop,
  tv: Tv,
  breakfast: Croissant,
  coffee_maker: Coffee,
  first_aid: Cross,
  smoke_alarm: Siren,
  self_checkin: KeyRound,
  balcony: DoorOpen,
  garden: Flower2,
  heating: ThermometerSun,
  hot_water: Droplets,
  iron: Shirt,
  hair_dryer: Wind,
  beach_access: Umbrella,
  bbq: Flame,
  fireplace: Flame,
  mountain_view: Mountain,
  lake_view: Waves,
  rooftop: Sun,
  bicycle: Bike,
  yoga_deck: Leaf,
  forest: Trees,
  pets_allowed: PawPrint,
  step_free_access: Accessibility,
  hot_tub: Bath,
};

export const FILTER_AMENITIES = ["ac", "wifi", "tv", "washer", "hot_tub", "beach_access", "kitchen", "pool", "free_parking", "workspace", "breakfast", "fireplace", "mountain_view", "balcony", "garden", "bbq"];
export const QUICK_FILTERS = ["pool", "kitchen", "ac", "free_parking", "wifi"];

export const AMENITY_KEYS = Object.keys(ICONS);
export const amenity = (key) => ({ label: COPY.AMENITIES[key] ?? key.replace(/_/g, " "), icon: ICONS[key] ?? Sun });
