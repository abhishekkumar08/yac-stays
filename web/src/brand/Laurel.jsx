export function Laurel({ flip = false, className = "h-12 w-6" }) {
  return (
    <svg viewBox="0 0 20 44" className={className} style={flip ? { transform: "scaleX(-1)" } : undefined} aria-hidden="true">
      <path d="M15 42C7 36 4 26 6 14 7 9 9 5 12 2" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      {[[11, 6, -30], [8, 12, -20], [6, 19, -10], [6, 26, 0], [8, 33, 15], [11, 38, 30]].map(([x, y, r]) => (
        <ellipse key={y} cx={x - 3} cy={y} rx="4.2" ry="2" transform={`rotate(${r - 40} ${x - 3} ${y})`} fill="currentColor" />
      ))}
    </svg>
  );
}
