import { useEffect } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { ATTRIBUTION, HOME_PIN, TILES } from "@/components/MapView.jsx";

function ClickToPlace({ onPick }) {
  useMapEvents({ click: (e) => onPick({ lat: Number(e.latlng.lat.toFixed(5)), lng: Number(e.latlng.lng.toFixed(5)) }) });
  return null;
}

function Recenter({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], Math.max(map.getZoom(), 12));
  }, [lat, lng, map]);
  return null;
}

export function LocationPicker({ lat, lng, onPick, label }) {
  return (
    <div className="h-80 overflow-hidden rounded-overlay" role="region" aria-label={label}>
      <MapContainer center={[lat, lng]} zoom={12} className="h-full w-full">
        <TileLayer url={TILES} attribution={ATTRIBUTION} />
        <Recenter lat={lat} lng={lng} />
        <ClickToPlace onPick={onPick} />
        <Marker position={[lat, lng]} icon={HOME_PIN} />
      </MapContainer>
    </div>
  );
}
