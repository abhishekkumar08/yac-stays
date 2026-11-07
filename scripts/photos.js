const W = 800;
const H = 640;

export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const PALETTES = [
  { wall: "#f3e9dc", wall2: "#e8d8c3", floor: "#b98b5e", accent: "#2f6f6a", soft: "#e9b384", deep: "#33413e", fabric: "#f7f3ee" },
  { wall: "#e6eef0", wall2: "#d3e1e4", floor: "#9c7653", accent: "#3a5a8c", soft: "#f2c14e", deep: "#2b3240", fabric: "#ffffff" },
  { wall: "#f4e4e1", wall2: "#ebcfc9", floor: "#8d6346", accent: "#a2483c", soft: "#88a87d", deep: "#3e2f2b", fabric: "#fbf6f2" },
  { wall: "#eef0e4", wall2: "#dfe3cd", floor: "#a88a62", accent: "#4f7a4a", soft: "#d98e5f", deep: "#2f3a2c", fabric: "#f9f8f1" },
  { wall: "#ece6f2", wall2: "#dcd2e8", floor: "#8a6f5c", accent: "#5b4b8a", soft: "#e8a87c", deep: "#2d2838", fabric: "#fbf9fd" },
  { wall: "#fbf1dc", wall2: "#f1e0b8", floor: "#c39a6b", accent: "#c0622f", soft: "#4f8f8b", deep: "#3b2f22", fabric: "#fffaf0" },
];

const VIEWS = {
  sea: (r) => `
    <rect width="800" height="352" fill="#9fd3e6"/><rect y="352" width="800" height="288" fill="#2f8fb3"/>
    <rect y="512" width="800" height="128" fill="#f0dcae"/>
    <circle cx="${560 + r() * 200}" cy="140" r="28" fill="#fff4c9"/>
    <path d="M0 400 Q 200 380 400 400 T 800 400 M 0 450 Q 200 430 400 450 T 800 450" stroke="#bfe6f2" stroke-width="3" fill="none"/>`,
  mountain: () => `
    <rect width="800" height="640" fill="#bcd9ef"/>
    <path d="M-40 480 L 176 180 L 360 448 L 544 115 L 840 480 Z" fill="#6f8aa6"/>
    <path d="M136 236 L 176 180 L 216 236 Z M 496 180 L 544 115 L 592 180 Z" fill="#ffffff"/>
    <rect y="460" width="800" height="180" fill="#4f7a4a"/>
    <path d="M40 520 l 32 -90 l 32 90 Z M 640 525 l 32 -100 l 32 100 Z M 700 530 l 26 -80 l 26 80 Z" fill="#2f5a36"/>`,
  desert: () => `
    <rect width="800" height="640" fill="#f6d7a8"/>
    <circle cx="624" cy="166" r="34" fill="#fbeed0"/>
    <path d="M0 448 Q 240 352 480 435 T 800 397 L 800 640 L 0 640 Z" fill="#e2a96b"/>
    <path d="M144 400 h 240 v -90 h -32 v -38 h -32 v 38 h -48 v -64 h -32 v 64 h -64 v -38 h -32 Z" fill="#c4705a"/>`,
  lake: () => `
    <rect width="800" height="352" fill="#f5c9a8"/><rect y="352" width="800" height="288" fill="#6fa3b8"/>
    <path d="M200 352 v -77 h 48 v -38 q 32 -38 64 0 v 38 h 48 v 77 Z" fill="#fff7ec"/>
    <path d="M200 365 h 208" stroke="#a7cbd8" stroke-width="4"/>
    <path d="M480 352 Q 640 243 800 294 L 800 352 Z" fill="#8a7a6a"/>`,
  tea: () => `
    <rect width="800" height="640" fill="#d8ecf2"/>
    <path d="M0 352 Q 200 224 440 320 T 800 269 L 800 640 L 0 640 Z" fill="#7fb069"/>
    <path d="M0 448 Q 240 333 520 422 T 800 384 L 800 640 L 0 640 Z" fill="#5c9450"/>
    <path d="M0 397 Q 240 288 480 371 M 0 486 Q 280 384 560 461" stroke="#9cc98a" stroke-width="4" fill="none"/>`,
  street: () => `
    <rect width="800" height="640" fill="#bfe0ef"/>
    <rect x="40" y="192" width="320" height="448" fill="#f2c94c"/><rect x="400" y="160" width="360" height="480" fill="#f6efe6"/>
    <rect x="96" y="269" width="80" height="90" fill="#6b8f71"/><rect x="224" y="269" width="80" height="90" fill="#6b8f71"/>
    <rect x="464" y="243" width="80" height="102" fill="#4d7ea8"/><rect x="608" y="243" width="80" height="102" fill="#4d7ea8"/>
    <path d="M360 192 q 48 -77 0 -128" stroke="#d65a8a" stroke-width="10" fill="none"/>`,
  river: () => `
    <rect width="800" height="640" fill="#cfe6f0"/>
    <path d="M-40 384 L 200 160 L 400 371 Z M 360 384 L 600 128 L 840 384 Z" fill="#7d9b7a"/>
    <rect y="384" width="800" height="256" fill="#8cc4cf"/>
    <path d="M240 640 Q 360 480 480 384" stroke="#bfe3ea" stroke-width="18" fill="none"/>`,
  forest: () => `
    <rect width="800" height="640" fill="#d9ead3"/>
    ${[64, 176, 288, 416, 528, 656].map((x, i) => `<path d="M${x} ${499 - (i % 2) * 38} l 56 -${218 + (i % 3) * 38} l 56 ${218 + (i % 3) * 38} Z" fill="${i % 2 ? "#2f6b3f" : "#3e8450"}"/>`).join("")}
    <rect y="486" width="800" height="154" fill="#5a8a4f"/>`,
};

export const CITY_VIEW = { Goa: "sea", Manali: "mountain", Jaipur: "desert", Udaipur: "lake", Munnar: "tea", Pondicherry: "street", Rishikesh: "river", Coorg: "forest" };

const svg = (body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice">${body}</svg>`;

function room(p, view, r, extra) {
  const wx = 470 + r() * 40;
  return `
    <defs><linearGradient id="w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.wall}"/><stop offset="1" stop-color="${p.wall2}"/></linearGradient>
    <linearGradient id="light" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>
    <rect width="${W}" height="${H}" fill="url(#w)"/>
    <svg x="${wx}" y="70" width="250" height="250" viewBox="0 0 800 640" preserveAspectRatio="xMidYMid slice">${VIEWS[view](r)}</svg>
    <rect x="${wx}" y="70" width="250" height="250" fill="none" stroke="${p.fabric}" stroke-width="14"/>
    <path d="M${wx + 125} 70 v 250 M ${wx} 195 h 250" stroke="${p.fabric}" stroke-width="7"/>
    <rect y="470" width="${W}" height="170" fill="${p.floor}"/>
    <path d="M0 470 h ${W}" stroke="${p.deep}" stroke-opacity=".15" stroke-width="6"/>
    ${Array.from({ length: 6 }, (_, i) => `<path d="M${i * 150 - 40} 640 L ${i * 150 + 40} 470" stroke="${p.deep}" stroke-opacity=".07" stroke-width="3"/>`).join("")}
    ${extra}
    <polygon points="${wx},320 ${wx + 250},320 ${wx + 330},640 ${wx - 140},640" fill="url(#light)"/>`;
}

const plant = (x, y, p, s = 1) => `
  <g transform="translate(${x} ${y}) scale(${s})">
    <path d="M0 0 C -40 -60 -10 -110 0 -140 C 10 -110 40 -60 0 0 Z" fill="${p.accent}" opacity=".85"/>
    <path d="M0 0 C -70 -30 -80 -80 -60 -100 C -40 -70 -20 -40 0 0 Z M 0 0 C 70 -30 80 -80 60 -100 C 40 -70 20 -40 0 0 Z" fill="${p.accent}"/>
    <path d="M-28 0 h 56 l -8 50 h -40 Z" fill="${p.soft}"/></g>`;

const art = (x, y, p, r) => `
  <rect x="${x}" y="${y}" width="120" height="150" fill="${p.fabric}" stroke="${p.deep}" stroke-width="6"/>
  <circle cx="${x + 60}" cy="${y + 60}" r="${26 + r() * 10}" fill="${p.soft}"/>
  <path d="M${x + 14} ${y + 136} Q ${x + 60} ${y + 80} ${x + 106} ${y + 136} Z" fill="${p.accent}"/>`;

const SCENES = {
  bedroom: (p, v, r) => room(p, v, r, `
    ${art(110, 120, p, r)}
    <rect x="70" y="330" width="380" height="80" rx="18" fill="${p.deep}"/>
    <rect x="60" y="400" width="400" height="120" rx="16" fill="${p.fabric}"/>
    <rect x="60" y="430" width="400" height="90" rx="14" fill="${p.accent}"/>
    <path d="M60 455 h 400" stroke="${p.fabric}" stroke-opacity=".5" stroke-width="5"/>
    <rect x="95" y="372" width="120" height="52" rx="22" fill="${p.wall}"/><rect x="235" y="372" width="120" height="52" rx="22" fill="${p.wall}"/>
    <rect x="480" y="420" width="70" height="80" rx="6" fill="${p.floor}" stroke="${p.deep}" stroke-opacity=".3" stroke-width="4"/>
    <path d="M505 420 v -60 M 490 360 h 30 l -8 -40 h -14 Z" stroke="${p.deep}" stroke-width="4" fill="${p.soft}"/>
    ${plant(700, 520, p, 0.9)}`),
  living: (p, v, r) => room(p, v, r, `
    ${art(80, 110, p, r)}${art(220, 140, p, r)}
    <rect x="60" y="360" width="400" height="110" rx="30" fill="${p.accent}"/>
    <rect x="40" y="400" width="440" height="100" rx="28" fill="${p.accent}"/>
    <rect x="80" y="400" width="170" height="60" rx="16" fill="${p.fabric}" opacity=".25"/><rect x="270" y="400" width="170" height="60" rx="16" fill="${p.fabric}" opacity=".25"/>
    <ellipse cx="380" cy="575" rx="260" ry="45" fill="${p.soft}" opacity=".7"/>
    <rect x="300" y="520" width="170" height="20" rx="8" fill="${p.deep}"/><rect x="315" y="540" width="10" height="35" fill="${p.deep}"/><rect x="445" y="540" width="10" height="35" fill="${p.deep}"/>
    <circle cx="370" cy="510" r="14" fill="${p.soft}"/>
    ${plant(690, 520, p)}`),
  kitchen: (p, v, r) => room(p, v, r, `
    <rect x="40" y="110" width="400" height="130" rx="6" fill="${p.fabric}" stroke="${p.deep}" stroke-opacity=".2" stroke-width="4"/>
    <path d="M140 110 v 130 M 240 110 v 130 M 340 110 v 130" stroke="${p.deep}" stroke-opacity=".2" stroke-width="4"/>
    <rect x="40" y="360" width="720" height="30" fill="${p.wall2}" stroke="${p.deep}" stroke-opacity=".25" stroke-width="4"/>
    <rect x="40" y="390" width="720" height="110" fill="${p.accent}"/>
    <path d="M160 390 v 110 M 280 390 v 110 M 400 390 v 110 M 520 390 v 110 M 640 390 v 110" stroke="${p.fabric}" stroke-opacity=".35" stroke-width="4"/>
    ${[200, 380, 560].map((x) => `<path d="M${x} 0 v 60" stroke="${p.deep}" stroke-width="3"/><path d="M${x - 34} 100 L ${x - 18} 60 h 36 L ${x + 34} 100 Z" fill="${p.soft}"/>`).join("")}
    <circle cx="110" cy="345" r="16" fill="${p.soft}"/><rect x="250" y="320" width="60" height="40" rx="6" fill="${p.deep}"/>
    ${[200, 360, 520].map((x) => `<rect x="${x - 30}" y="510" width="60" height="16" rx="8" fill="${p.soft}"/><path d="M${x - 20} 526 l -8 90 M ${x + 20} 526 l 8 90" stroke="${p.deep}" stroke-width="6"/>`).join("")}`),
  bathroom: (p, v, r) => room(p, v, r, `
    ${Array.from({ length: 8 }, (_, i) => `<path d="M${i * 60 + 40} 250 v 220" stroke="${p.deep}" stroke-opacity=".08" stroke-width="3"/>`).join("")}
    <path d="M40 250 h 420" stroke="${p.deep}" stroke-opacity=".12" stroke-width="3"/>
    <ellipse cx="190" cy="140" rx="70" ry="90" fill="${p.wall}" stroke="${p.soft}" stroke-width="12"/>
    <rect x="80" y="380" width="380" height="110" rx="55" fill="${p.fabric}" stroke="${p.deep}" stroke-opacity=".2" stroke-width="5"/>
    <rect x="96" y="392" width="348" height="40" rx="20" fill="#bfe3ea"/>
    <path d="M420 380 v -60 q 0 -20 -20 -20" stroke="${p.deep}" stroke-width="8" fill="none"/>
    <rect x="560" y="470" width="120" height="16" rx="8" fill="${p.accent}"/>
    ${plant(640, 470, p, 0.7)}`),
  exterior: (p, v, r) => `
    ${VIEWS[v](r)}
    <rect x="${180 + r() * 40}" y="250" width="440" height="300" fill="${p.wall}"/>
    <path d="M${150 + r() * 40} 260 L 400 120 L ${650 + r() * 20} 260 Z" fill="${p.accent}"/>
    <rect x="360" y="400" width="80" height="150" rx="40" fill="${p.deep}"/>
    <rect x="230" y="320" width="90" height="80" fill="#cfe6f0" stroke="${p.fabric}" stroke-width="8"/>
    <rect x="480" y="320" width="90" height="80" fill="#cfe6f0" stroke="${p.fabric}" stroke-width="8"/>
    <rect y="550" width="${W}" height="90" fill="#6a9a58"/>
    <path d="M360 640 L 380 550 h 40 L 440 640 Z" fill="${p.wall2}"/>
    ${plant(140, 560, p, 1.1)}${plant(680, 560, p, 1)}`,
  pool: (p, v, r) => `
    ${VIEWS[v](r)}
    <rect y="330" width="${W}" height="310" fill="${p.wall}"/>
    <rect x="120" y="380" width="560" height="200" rx="26" fill="#3fb0c9" stroke="${p.fabric}" stroke-width="16"/>
    ${[420, 460, 500, 540].map((y) => `<path d="M150 ${y} q 40 -10 80 0 t 80 0 t 80 0 t 80 0 t 80 0 t 80 0" stroke="#a5e3ef" stroke-width="4" fill="none" opacity=".8"/>`).join("")}
    <path d="M40 600 l 70 -40 h 50 l -70 40 Z M 640 600 l 70 -40 h 50 l -70 40 Z" fill="${p.soft}"/>
    <path d="M730 330 q -10 -120 10 -220" stroke="#7a5a3a" stroke-width="14" fill="none"/>
    <path d="M740 120 q -80 -10 -120 40 M 740 120 q 60 -40 90 10 M 740 120 q -40 -60 -100 -60 M 740 120 q 40 -70 80 -60" stroke="#3e8450" stroke-width="18" fill="none" stroke-linecap="round"/>`,
  view: (p, v, r) => `
    ${VIEWS[v](r)}
    <rect y="470" width="${W}" height="170" fill="${p.floor}"/>
    ${Array.from({ length: 21 }, (_, i) => `<rect x="${i * 40}" y="380" width="8" height="90" fill="${p.deep}"/>`).join("")}
    <rect y="370" width="${W}" height="14" fill="${p.deep}"/>
    <rect x="80" y="500" width="160" height="16" rx="8" fill="${p.deep}"/><rect x="100" y="516" width="8" height="70" fill="${p.deep}"/><rect x="212" y="516" width="8" height="70" fill="${p.deep}"/>
    <circle cx="140" cy="490" r="12" fill="${p.soft}"/><rect x="170" y="478" width="18" height="24" rx="4" fill="${p.fabric}"/>
    <rect x="300" y="470" width="150" height="110" rx="24" fill="${p.accent}"/>
    ${plant(680, 520, p, 0.9)}`,
};

export function renderScene(kind, palette, view, seed) {
  return svg(SCENES[kind](palette, view, rng(seed)));
}

const ACTIVITY = {
  outdoors: (p, v, r) => `${VIEWS[v === "desert" ? "lake" : v](r)}
    <path d="M220 470 q 180 40 360 0 l -30 24 q -150 26 -300 0 Z" fill="${p.soft}"/>
    <circle cx="400" cy="400" r="22" fill="${p.deep}"/><path d="M400 420 v 50" stroke="${p.deep}" stroke-width="18"/>
    <path d="M300 380 L 500 470" stroke="${p.deep}" stroke-width="8"/><path d="M290 372 l 24 -6 l 6 24 Z M 492 462 l 24 0 l -6 24 Z" fill="${p.accent}"/>`,
  food: (p) => `<rect width="${W}" height="${H}" fill="${p.wall}"/>
    <rect y="360" width="${W}" height="280" fill="${p.floor}"/>
    <ellipse cx="400" cy="440" rx="230" ry="90" fill="${p.fabric}"/><ellipse cx="400" cy="430" rx="170" ry="60" fill="${p.soft}"/>
    ${[330, 400, 470].map((x, i) => `<circle cx="${x}" cy="${420 + (i % 2) * 14}" r="${26 - i * 2}" fill="${i === 1 ? p.accent : "#e6b04a"}"/>`).join("")}
    <ellipse cx="660" cy="520" rx="70" ry="28" fill="${p.fabric}"/><ellipse cx="660" cy="512" rx="50" ry="16" fill="#c2552f"/>
    <path d="M120 300 v 200" stroke="${p.deep}" stroke-width="10"/><path d="M180 300 q 20 60 0 200" stroke="${p.deep}" stroke-width="10" fill="none"/>`,
  art: (p, v, r) => `<rect width="${W}" height="${H}" fill="${p.wall}"/>
    <rect y="470" width="${W}" height="170" fill="${p.floor}"/>
    <ellipse cx="400" cy="470" rx="160" ry="40" fill="${p.deep}"/>
    <path d="M320 470 q -10 -120 40 -150 h 80 q 50 30 40 150 Z" fill="#c4825a"/>
    <ellipse cx="400" cy="320" rx="40" ry="12" fill="#a4623a"/>
    ${art(560, 130, p, r)}
    <path d="M200 520 h 400" stroke="${p.soft}" stroke-width="10"/>`,
  culture: (p, v, r) => `${VIEWS[v](r)}
    <rect y="440" width="${W}" height="200" fill="${p.wall2}"/>
    ${[120, 320, 520].map((x) => `<path d="M${x} 440 v -200 a 80 80 0 0 1 160 0 v 200 h -30 v -190 a 50 50 0 0 0 -100 0 v 190 Z" fill="${p.wall}" stroke="${p.accent}" stroke-width="6"/>`).join("")}
    <circle cx="400" cy="560" r="20" fill="${p.deep}"/><path d="M400 580 v 50" stroke="${p.deep}" stroke-width="16"/>`,
  wellness: (p, v, r) => `${VIEWS[v](r)}
    <rect y="480" width="${W}" height="160" fill="${p.floor}"/>
    <rect x="200" y="520" width="400" height="40" rx="8" fill="${p.accent}"/>
    <circle cx="400" cy="400" r="26" fill="${p.deep}"/>
    <path d="M400 426 v 70 M 340 520 q 60 -40 120 0 M 400 450 l -70 -30 M 400 450 l 70 -30" stroke="${p.deep}" stroke-width="16" stroke-linecap="round" fill="none"/>`,
};

Object.assign(ACTIVITY, {
  camera: (p, v, r) => `${VIEWS[v](r)}
    <rect y="470" width="${W}" height="170" fill="${p.wall2}"/>
    <path d="M520 470 l 40 -150 l 40 150 M 560 320 v 150" stroke="${p.deep}" stroke-width="6" fill="none"/>
    <rect x="520" y="280" width="80" height="50" rx="8" fill="${p.deep}"/><circle cx="560" cy="305" r="16" fill="${p.soft}"/>
    <circle cx="260" cy="380" r="24" fill="${p.deep}"/><path d="M260 404 v 90 M 230 520 l 30 -26 l 30 26" stroke="${p.deep}" stroke-width="18" stroke-linecap="round" fill="none"/>
    <path d="M220 330 q 40 -40 80 0" stroke="${p.accent}" stroke-width="10" fill="none"/>`,
  salon: (p) => `<rect width="${W}" height="${H}" fill="${p.wall}"/>
    <rect y="470" width="${W}" height="170" fill="${p.floor}"/>
    <ellipse cx="400" cy="230" rx="150" ry="180" fill="${p.fabric}" stroke="${p.soft}" stroke-width="16"/>
    ${[250, 330, 470, 550].map((x) => `<circle cx="${x}" cy="60" r="10" fill="#fff4c9"/>`).join("")}
    <rect x="220" y="430" width="360" height="24" rx="10" fill="${p.deep}"/>
    ${[260, 300, 340].map((x, i) => `<rect x="${x}" y="${398 - i * 6}" width="18" height="${32 + i * 6}" rx="6" fill="${i === 1 ? p.accent : p.soft}"/>`).join("")}
    <path d="M480 430 q 20 -40 40 0" fill="${p.accent}"/>`,
  massage: (p, v, r) => `${VIEWS[v](r)}
    <rect y="460" width="${W}" height="180" fill="${p.floor}"/>
    <rect x="180" y="420" width="440" height="34" rx="16" fill="${p.fabric}"/>
    <path d="M220 454 v 90 M 580 454 v 90" stroke="${p.deep}" stroke-width="12"/>
    <rect x="200" y="404" width="400" height="22" rx="11" fill="${p.accent}"/>
    ${[640, 670, 700].map((x, i) => `<rect x="${x}" y="${500 - i * 22}" width="40" height="18" rx="9" fill="${p.soft}"/>`).join("")}
    <path d="M120 470 q -10 -60 20 -100" stroke="#3e8450" stroke-width="8" fill="none"/><circle cx="140" cy="366" r="16" fill="#e6b04a"/>`,
});

const SCENE_FOR = { photography: "camera", chef: "food", prepared_meals: "food", catering: "food", massage: "massage", spa: "massage", training: "wellness", makeup: "salon", hair: "salon", nails: "salon" };

export function renderActivity(category, palette, view, seed) {
  return svg(ACTIVITY[SCENE_FOR[category] ?? category](palette, view, rng(seed)));
}
