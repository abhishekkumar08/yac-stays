export const RATES = { INR: 1, USD: 0.012, EUR: 0.011, GBP: 0.0095, AED: 0.044, SGD: 0.016 };
const KEY = "ys-currency";
const LOCALE_KEY = "ys-locale";

const read = (key, fallback) => {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
};

export const currentCurrency = () => (RATES[read(KEY, "INR")] ? read(KEY, "INR") : "INR");
export const currentLocale = () => read(LOCALE_KEY, "en-IN");

export function savePreferences({ currency, locale }) {
  try {
    if (currency) localStorage.setItem(KEY, currency);
    if (locale) localStorage.setItem(LOCALE_KEY, locale);
  } catch {
    return false;
  }
  return true;
}

export const toDisplay = (rupees) => Math.round(rupees * RATES[currentCurrency()]);
export const fromDisplay = (amount) => Math.round(amount / RATES[currentCurrency()]);
export const currencySymbol = () =>
  new Intl.NumberFormat(currentLocale(), { style: "currency", currency: currentCurrency(), maximumFractionDigits: 0 }).formatToParts(0).find((p) => p.type === "currency")?.value ?? currentCurrency();
