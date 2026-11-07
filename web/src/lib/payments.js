import { PAYMENT_METHODS } from "@shared/pricing.js";
import { COPY } from "@/copy.js";

export const PAY_OPTIONS = PAYMENT_METHODS.map((value) => ({ value, label: COPY.CHECKOUT.PAY_LABELS[value] }));
