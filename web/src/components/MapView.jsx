import { useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { Link } from "react-router-dom";
import { money, photoUrl } from "@/lib/format.js";

export const TILES = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
export const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const INDIA = [22.5, 79];

export const HOME_PIN = L.divIcon({ className: "", html: '<span class="ys-price-pin" data-active="true">⌂</span>', iconSize: [0, 0] });

const escapeHtml = (s) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const pinIcon = (label, active) =>
  L.divIcon({ className: "", html: `<span class="ys-price-pin" data-active="${active}">${escapeHtml(label)}</span>`, iconSize: [0, 0] });

function FitBounds({ points, fitKey }) {
  const map = useMap();
  const latest = useRef(points);
  latest.current = points;
  const ready = points.length > 0;
  useEffect(() => {
    const pts = latest.current;
    if (!pts.length) return;
    if (pts.length === 1) map.setView(pts[0], 13);
    else map.fitBounds(pts, { padding: [40, 40], maxZoom: 13 });
  }, [fitKey, map, ready]);
  return null;
}

function MoveWatcher({ onMove }) {
  useMapEvents({
    moveend: (e) => {
      const b = e.target.getBounds();
      onMove?.([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()].map((n) => n.toFixed(4)).join(","));
    },
  });
  return null;
}

const priceOf = (i) => money(i.price?.total ?? i.nightly);

export function MapView({ items, label, activeId, onMove, fitKey, hrefOf = (i) => `/rooms/${i.id}`, single = false, className = "" }) {
  const points = useMemo(() => items.map((i) => [i.lat, i.lng]), [items]);
  return (
    <div className={`overflow-hidden rounded-overlay ${className}`} role="region" aria-label={label}>
      <MapContainer center={points[0] ?? INDIA} zoom={single ? 13 : 5} scrollWheelZoom={!single} className="h-full w-full">
        <TileLayer url={TILES} attribution={ATTRIBUTION} />
        {!single && <FitBounds points={points} fitKey={fitKey} />}
        {onMove && <MoveWatcher onMove={onMove} />}
        {single
          ? points[0] && <Marker position={points[0]} icon={HOME_PIN} />
          : items.map((i) => (
              <Marker key={i.id} position={[i.lat, i.lng]} icon={pinIcon(priceOf(i), i.id === activeId)} zIndexOffset={i.id === activeId ? 1000 : 0}>
                <Popup closeButton={false} minWidth={220}>
                  <Link to={hrefOf(i)} className="block w-56 text-fg no-underline">
                    {i.photos?.[0] && <img src={photoUrl(i.photos[0])} alt="" className="mb-2 aspect-[4/3] w-full rounded-control object-cover" />}
                    <strong className="block text-label">{i.title}</strong>
                    <span className="text-body text-fg-muted">{priceOf(i)}</span>
                  </Link>
                </Popup>
              </Marker>
            ))}
      </MapContainer>
    </div>
  );
}
