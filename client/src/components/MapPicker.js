import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const DEFAULT_CENTER = [40.7128, -74.006];
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

function LocationMarker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });
  return position ? <Marker position={position} /> : null;
}

function FlyToLocation({ target }) {
  const map = useMap();
  useEffect(() => {
    if (target) {
      map.flyTo(target, 16, { duration: 1.2 });
    }
  }, [map, target]);
  return null;
}

function InitialGeolocation({ hasPosition }) {
  const map = useMap();
  const attempted = useRef(false);

  useEffect(() => {
    if (attempted.current || hasPosition) return;
    attempted.current = true;

    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        map.flyTo([pos.coords.latitude, pos.coords.longitude], 15, { duration: 1 });
      },
      () => {}
    );
  }, [map, hasPosition]);

  return null;
}

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function SearchBar({ onSelect }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);
  const debouncedQuery = useDebounce(query, 350);

  useEffect(() => {
    if (debouncedQuery.length < 3) {
      setResults([]);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetch(`${NOMINATIM_URL}?q=${encodeURIComponent(debouncedQuery)}&format=json&limit=5`, {
      headers: { 'Accept-Language': 'en' },
    })
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) {
          setResults(data);
          setOpen(data.length > 0);
        }
      })
      .catch(() => {
        if (!cancelled) setResults([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [debouncedQuery]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = useCallback((item) => {
    setQuery(item.display_name.split(',').slice(0, 2).join(','));
    setOpen(false);
    onSelect([parseFloat(item.lat), parseFloat(item.lon)]);
  }, [onSelect]);

  return (
    <div ref={wrapperRef} className="relative mb-2">
      <input
        type="text"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => results.length > 0 && setOpen(true)}
        placeholder="search for a location..."
        className="w-full bg-[#111] border border-[#222] rounded px-2.5 py-1.5 text-[11px] text-white/80 focus:outline-none focus:border-white/30 placeholder-white/20"
      />
      {loading && (
        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] text-white/20">
          ...
        </span>
      )}
      {open && results.length > 0 && (
        <ul className="absolute z-[1000] left-0 right-0 mt-1 bg-[#111] border border-[#222] rounded max-h-40 overflow-y-auto">
          {results.map((item) => (
            <li
              key={item.place_id}
              onClick={() => handleSelect(item)}
              className="px-2.5 py-1.5 text-[10px] text-white/60 hover:bg-white/[0.06] hover:text-white/90 cursor-pointer border-b border-[#1a1a1a] last:border-b-0 transition-colors"
            >
              {item.display_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function MapPicker({ latitude, longitude, onChange }) {
  const [position, setPosition] = useState(
    latitude && longitude ? [latitude, longitude] : null
  );
  const [flyTarget, setFlyTarget] = useState(null);

  const handleSetPosition = (pos) => {
    setPosition(pos);
    onChange({ latitude: pos[0], longitude: pos[1] });
  };

  const handleSearchSelect = useCallback((coords) => {
    setFlyTarget(coords);
    handleSetPosition(coords);
  }, []);

  const center = position || DEFAULT_CENTER;

  return (
    <div>
      <SearchBar onSelect={handleSearchSelect} />
      <div className="h-80 rounded border border-[#222] overflow-hidden">
        <MapContainer center={center} zoom={15} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker position={position} setPosition={handleSetPosition} />
          <FlyToLocation target={flyTarget} />
          <InitialGeolocation hasPosition={!!position} />
        </MapContainer>
      </div>
      <p className="text-[9px] text-white/20 mt-1.5">search or click map to set location</p>
      {position && (
        <p className="text-[10px] text-white/40 mt-0.5 font-mono">
          {position[0].toFixed(6)}, {position[1].toFixed(6)}
        </p>
      )}
    </div>
  );
}
