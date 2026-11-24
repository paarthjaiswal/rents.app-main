"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

interface LocationPickerProps {
  longitude: number;
  latitude: number;
  address: string;
  onChange: (coords: { longitude: number; latitude: number; address?: string }) => void;
}

export default function LocationPicker({
  longitude,
  latitude,
  address,
  onChange,
}: LocationPickerProps) {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Array<{ id: string; place_name: string; center: [number, number] }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

  // Reverse geocoding helper
  const reverseGeocode = useCallback(
    async (lng: number, lat: number) => {
      if (!token) return;
      setIsReverseGeocoding(true);
      try {
        const res = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${token}&types=address,poi,neighborhood,locality,place`
        );
        const data = await res.json();
        if (data?.features?.[0]?.place_name) {
          const suggestedAddress = data.features[0].place_name;
          onChange({ longitude: lng, latitude: lat, address: suggestedAddress });
        }
      } catch (err) {
        console.error("Reverse geocode error:", err);
      } finally {
        setIsReverseGeocoding(false);
      }
    },
    [token, onChange]
  );

  // Initialize Mapbox map
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    mapboxgl.accessToken = token;

    const initialLng = longitude || 81.35; // Default Bhilai / central India if 0
    const initialLat = latitude || 21.21;

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [initialLng, initialLat],
      zoom: initialLng && latitude ? 14 : 11,
    });

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");

    // Create custom pin element
    const el = document.createElement("div");
    el.className = "cursor-grab active:cursor-grabbing";
    el.innerHTML = `
      <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; bottom: 0; width: 14px; height: 14px; background: rgba(139, 92, 246, 0.4); border-radius: 50%; filter: blur(2px);"></div>
        <svg width="34" height="42" viewBox="0 0 34 42" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 4px 6px rgba(0,0,0,0.4));">
          <path d="M17 0C7.61 0 0 7.61 0 17C0 29.75 17 42 17 42C17 42 34 29.75 34 17C34 7.61 26.39 0 17 0Z" fill="#8B5CF6" stroke="#FFFFFF" stroke-width="2"/>
          <circle cx="17" cy="17" r="6" fill="#FFFFFF"/>
        </svg>
      </div>
    `;

    const marker = new mapboxgl.Marker({
      element: el,
      draggable: true,
      anchor: "bottom",
    })
      .setLngLat([initialLng, initialLat])
      .addTo(map);

    // Drag marker handler
    marker.on("dragend", () => {
      const lngLat = marker.getLngLat();
      onChange({ longitude: Number(lngLat.lng.toFixed(6)), latitude: Number(lngLat.lat.toFixed(6)) });
      reverseGeocode(lngLat.lng, lngLat.lat);
    });

    // Click map to reposition marker
    map.on("click", (e) => {
      const { lng, lat } = e.lngLat;
      marker.setLngLat([lng, lat]);
      onChange({ longitude: Number(lng.toFixed(6)), latitude: Number(lat.toFixed(6)) });
      reverseGeocode(lng, lat);
    });

    mapRef.current = map;
    markerRef.current = marker;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [token, longitude, latitude, onChange, reverseGeocode]);

  // Search places using Mapbox Geocoding API
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim() || query.length < 2 || !token) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          query
        )}.json?access_token=${token}&types=place,locality,neighborhood,address,poi&limit=5`
      );
      const data = await res.json();
      if (data?.features) {
        setSuggestions(
          data.features.map((f: { id: string; place_name: string; center: [number, number] }) => ({
            id: f.id,
            place_name: f.place_name,
            center: f.center,
          }))
        );
        setShowDropdown(true);
      }
    } catch (err) {
      console.error("Geocoding search error:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSuggestion = (suggestion: { place_name: string; center: [number, number] }) => {
    const [lng, lat] = suggestion.center;
    setSearchQuery(suggestion.place_name);
    setShowDropdown(false);

    if (mapRef.current && markerRef.current) {
      mapRef.current.flyTo({ center: [lng, lat], zoom: 15, duration: 1200 });
      markerRef.current.setLngLat([lng, lat]);
    }

    onChange({
      longitude: Number(lng.toFixed(6)),
      latitude: Number(lat.toFixed(6)),
      address: suggestion.place_name,
    });
  };

  return (
    <div className="space-y-3">
      {/* Search Autocomplete Box */}
      <div className="relative">
        <label className="block text-xs font-semibold uppercase tracking-wider text-[#A1A1AA] mb-1.5">
          Find Location or Landmark
        </label>
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => {
              if (suggestions.length > 0) setShowDropdown(true);
            }}
            placeholder="Search neighborhood, city, or landmark (e.g. Bhilai, Sector 6, Raipur)"
            className="w-full px-3.5 py-2.5 pl-10 rounded-xl bg-[#09090B] border border-[#27272A] text-sm text-[#FAFAFA] placeholder-[#71717A] focus:outline-none focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/30 transition-all"
          />
          <svg
            className="w-4 h-4 text-[#71717A] absolute left-3.5 top-1/2 -translate-y-1/2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {isSearching && (
            <div className="w-4 h-4 border-2 border-[#8B5CF6] border-t-transparent rounded-full animate-spin absolute right-3.5 top-1/2 -translate-y-1/2" />
          )}
        </div>

        {/* Suggestions Popover */}
        {showDropdown && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#18181B] border border-[#27272A] rounded-xl shadow-2xl z-50 overflow-hidden divide-y divide-[#27272A]/60">
            {suggestions.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectSuggestion(item)}
                className="w-full text-left px-4 py-2.5 text-xs text-[#FAFAFA] hover:bg-[#27272A] hover:text-white transition-colors flex items-center gap-2.5"
              >
                <span className="text-[#8B5CF6] shrink-0">📍</span>
                <span className="truncate">{item.place_name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map Container */}
      <div className="relative w-full h-80 rounded-xl overflow-hidden border border-[#27272A] shadow-inner bg-[#09090B]">
        <div ref={mapContainer} className="w-full h-full" />

        {/* Live Coordinate Badge Overlay */}
        <div className="absolute bottom-3 left-3 bg-[#18181B]/90 backdrop-blur-md border border-[#27272A] rounded-lg px-3 py-1.5 text-[11px] text-[#A1A1AA] flex items-center gap-2 shadow-lg select-none">
          <span className="w-2 h-2 rounded-full bg-[#8B5CF6] animate-pulse" />
          <span>
            Lat: <strong className="text-[#FAFAFA]">{latitude ? latitude.toFixed(5) : "—"}</strong>
          </span>
          <span className="text-[#3F3F46]">|</span>
          <span>
            Lng: <strong className="text-[#FAFAFA]">{longitude ? longitude.toFixed(5) : "—"}</strong>
          </span>
          {isReverseGeocoding && (
            <span className="text-[10px] text-[#8B5CF6] flex items-center gap-1">
              <span className="w-2.5 h-2.5 border-2 border-[#8B5CF6] border-t-transparent rounded-full animate-spin" />
              Resolving address...
            </span>
          )}
        </div>

        {/* Instruction Badge */}
        <div className="absolute top-3 left-3 bg-[#18181B]/90 backdrop-blur-md border border-[#27272A] rounded-lg px-2.5 py-1 text-[11px] text-[#FAFAFA] shadow-md flex items-center gap-1.5 select-none">
          <span>👆</span>
          <span>Click anywhere or drag marker to set exact location</span>
        </div>
      </div>

      {/* Display Current Address */}
      {address && (
        <div className="p-3 bg-[#111827]/70 rounded-xl border border-[#27272A] flex items-start gap-2.5 text-xs">
          <span className="text-[#8B5CF6] shrink-0 mt-0.5">📌</span>
          <div>
            <span className="font-semibold text-[#FAFAFA]">Selected Location:</span>
            <p className="text-[#A1A1AA] mt-0.5 leading-relaxed">{address}</p>
          </div>
        </div>
      )}
    </div>
  );
}
