const box = "h-9 w-9 shrink-0 transition-transform duration-base group-hover:scale-110";

export function GlobeIcon() {
  return (
    <svg viewBox="0 0 48 48" className={box} aria-hidden="true">
      <ellipse cx="24" cy="44" rx="10" ry="2.5" fill="#000" opacity=".12" />
      <path d="M24 38v4M17 42h14" stroke="#8a6a3a" strokeWidth="3" strokeLinecap="round" />
      <circle cx="24" cy="21" r="15" fill="#3e9ad6" />
      <path d="M14 13c4 1 5 5 9 5s3 6 7 6 4 4 2 7c-3 1-6 0-7-3s-6-2-8-6 1-5-3-9z" fill="#5fb35a" />
      <path d="M31 9c2 2 5 3 6 6-2 1-4 0-5-2s-3-2-1-4z" fill="#5fb35a" />
      <circle cx="19" cy="15" r="6" fill="#fff" opacity=".25" />
      <path d="M9 21a15 15 0 0 0 30 0" fill="none" stroke="#c99a4b" strokeWidth="2.5" />
    </svg>
  );
}

export function HouseIcon() {
  return (
    <svg viewBox="0 0 48 48" className={box} aria-hidden="true">
      <ellipse cx="24" cy="43" rx="16" ry="3" fill="#000" opacity=".12" />
      <path d="M9 22 24 10l15 12v19H9z" fill="#f4ede1" />
      <path d="M24 10 39 22v19H24z" fill="#e4d7c2" />
      <path d="M6 23 24 8l18 15-3 2L24 13 9 25z" fill="#3f7f6e" />
      <rect x="19" y="29" width="9" height="12" rx="1.5" fill="#d1553f" />
      <rect x="30" y="25" width="6" height="6" rx="1" fill="#9fd3e6" />
      <path d="M31 12h4v6l-4-3z" fill="#8a6a3a" />
      <circle cx="38" cy="12" r="5" fill="#5fb35a" />
    </svg>
  );
}

export function BalloonIcon() {
  return (
    <svg viewBox="0 0 48 48" className={box} aria-hidden="true">
      <path d="M24 3c-9 0-15 7-15 15 0 7 7 13 12 16h6c5-3 12-9 12-16 0-8-6-15-15-15z" fill="#e2563f" />
      <path d="M24 3c-4 0-6 7-6 15 0 7 3 13 3 16h6c0-3 3-9 3-16 0-8-2-15-6-15z" fill="#f2b84b" />
      <path d="M21 34l1 4m5-4-1 4" stroke="#8a6a3a" strokeWidth="1.5" />
      <rect x="20" y="38" width="8" height="6" rx="1.5" fill="#a5763e" />
      <circle cx="17" cy="12" r="3" fill="#fff" opacity=".35" />
    </svg>
  );
}

export function BellIcon() {
  return (
    <svg viewBox="0 0 48 48" className={box} aria-hidden="true">
      <ellipse cx="24" cy="42" rx="17" ry="3" fill="#000" opacity=".12" />
      <rect x="6" y="35" width="36" height="5" rx="2" fill="#5b6470" />
      <path d="M10 35c0-9 6-16 14-16s14 7 14 16z" fill="#8e98a3" />
      <path d="M14 33c0-6 4-11 10-12" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" opacity=".5" fill="none" />
      <rect x="21" y="13" width="6" height="5" rx="2" fill="#5b6470" />
      <circle cx="24" cy="11" r="2.5" fill="#5b6470" />
    </svg>
  );
}
