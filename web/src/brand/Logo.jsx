import { COPY } from "@/copy.js";

export function LogoMark({ className = "h-8 w-8" }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="8" className="fill-accent" />
      <path d="M8 17 16 9l8 8v7H8z" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinejoin="round" className="text-fg-on-accent" />
      <circle cx="16" cy="19" r="2.4" fill="#f2b84b" />
    </svg>
  );
}

export function Logo({ className = "" }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <LogoMark />
      <span className="hidden text-title tracking-tight text-accent-fg sm:inline">{COPY.BRAND}</span>
    </span>
  );
}
