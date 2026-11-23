"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import type { ListingResult } from "@/types/listing";

const LS_VIEW_KEY = "rents-map-view";
export const STYLE_STORAGE_KEY = "rents-app-map-style";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

const SOURCE_ID = "listings-source";
const LAYER_ID = "listings-layer";

export type MapStyleKey = "dark" | "streets" | "satellite" | "outdoors";

export interface MapStyleOption {
    id: MapStyleKey;
    name: string;
    description: string;
    url: string;
    icon: string;
    accentColor: string;
}

export const MAP_STYLES: Record<MapStyleKey, MapStyleOption> = {
    dark: {
        id: "dark",
        name: "Dark",
        description: "Night mode, high contrast",
        url: "mapbox://styles/mapbox/dark-v11",
        icon: "🌙",
        accentColor: "#8B5CF6",
    },
    streets: {
        id: "streets",
        name: "Streets",
        description: "Roads and neighborhoods",
        url: "mapbox://styles/mapbox/streets-v12",
        icon: "🛣️",
        accentColor: "#3B82F6",
    },
    satellite: {
        id: "satellite",
        name: "Satellite",
        description: "Aerial imagery with labels",
        url: "mapbox://styles/mapbox/satellite-streets-v12",
        icon: "🛰️",
        accentColor: "#10B981",
    },
    outdoors: {
        id: "outdoors",
        name: "Outdoors",
        description: "Topography, parks & terrain",
        url: "mapbox://styles/mapbox/outdoors-v12",
        icon: "⛰️",
        accentColor: "#F59E0B",
    },
};

function toGeoJSON(items: ListingResult[]): GeoJSON.FeatureCollection {
    return {
        type: "FeatureCollection",
        features: items.map(l => ({
            type: "Feature",
            geometry: { type: "Point", coordinates: [l.longitude, l.latitude] },
            properties: {
                id: l.id,
                title: l.title,
                rent: l.rent,
                propertyType: l.propertyType,
                ownerName: l.ownerName,
            },
        })),
    };
}

function createTeardropImage(): ImageData {
    const size = 48;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;

    // Teardrop pin shape with violet theme
    const cx = size / 2;
    ctx.beginPath();
    ctx.moveTo(cx, size - 4);
    ctx.bezierCurveTo(cx - 4, size - 14, 4, size * 0.45, 4, size * 0.35);
    ctx.arc(cx, size * 0.35, cx - 4, Math.PI, 0, false);
    ctx.bezierCurveTo(size - 4, size * 0.45, cx + 4, size - 14, cx, size - 4);
    ctx.closePath();

    ctx.fillStyle = "#8B5CF6";
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Inner circle
    ctx.beginPath();
    ctx.arc(cx, size * 0.35, 6, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();

    return ctx.getImageData(0, 0, size, size);
}

interface MapboxMapProps {
    listings?: ListingResult[];
    flyTo?: { lng: number; lat: number } | null;
    onListingClick?: (listingId: string) => void;
    showViewToggle?: boolean;
    showLayerSelector?: boolean;
}

export default function MapboxMap({
    listings = [],
    flyTo,
    onListingClick,
    showViewToggle = false,
    showLayerSelector = true,
}: MapboxMapProps) {
    const mapContainer = useRef<HTMLDivElement | null>(null);
    const mapInstance = useRef<mapboxgl.Map | null>(null);
    const sourceReady = useRef(false);
    const listingsRef = useRef(listings);
    listingsRef.current = listings;

    const onListingClickRef = useRef(onListingClick);
    onListingClickRef.current = onListingClick;

    const [view, setView] = useState<"2D" | "3D">("3D");
    const viewRef = useRef(view);
    viewRef.current = view;

    const [currentStyle, setCurrentStyle] = useState<MapStyleKey>("dark");
    const [isLayerSelectorOpen, setIsLayerSelectorOpen] = useState(false);
    const [isStyleLoading, setIsStyleLoading] = useState(false);
    const layerSelectorRef = useRef<HTMLDivElement | null>(null);
    const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Setup or restore custom pin icon, GeoJSON source, and symbol layer
    const setupCustomLayers = useCallback((map: mapboxgl.Map) => {
        try {
            // Restore teardrop image if removed by style change
            if (!map.hasImage("teardrop-marker")) {
                const imageData = createTeardropImage();
                map.addImage("teardrop-marker", imageData, { pixelRatio: 2 });
            }

            // Restore source
            const data = toGeoJSON(listingsRef.current || []);
            if (!map.getSource(SOURCE_ID)) {
                map.addSource(SOURCE_ID, {
                    type: "geojson",
                    data,
                });
            } else {
                (map.getSource(SOURCE_ID) as mapboxgl.GeoJSONSource).setData(data);
            }

            // Restore layer
            if (!map.getLayer(LAYER_ID)) {
                map.addLayer({
                    id: LAYER_ID,
                    type: "symbol",
                    source: SOURCE_ID,
                    layout: {
                        "icon-image": "teardrop-marker",
                        "icon-size": 1,
                        "icon-anchor": "bottom",
                        "icon-allow-overlap": true,
                    },
                });
            }

            sourceReady.current = true;
        } catch (err) {
            console.warn("Could not setup map layers:", err);
        }
    }, []);

    // 1. Initial 2D/3D view preference restoration
    useEffect(() => {
        if (!showViewToggle) {
            setView("2D");
            return;
        }
        try {
            const saved = localStorage.getItem(LS_VIEW_KEY) as "2D" | "3D" | null;
            if (saved) setView(saved);
        } catch {
            // localStorage unavailable
        }
    }, [showViewToggle]);

    // 2. Initial Map Style preference restoration
    useEffect(() => {
        try {
            const saved = localStorage.getItem(STYLE_STORAGE_KEY) as MapStyleKey | null;
            if (saved && saved in MAP_STYLES) {
                setCurrentStyle(saved);
            }
        } catch {
            // localStorage unavailable
        }
    }, []);

    // 3. Initialize Mapbox Map Instance
    useEffect(() => {
        if (!mapContainer.current) return;

        // Check stored style or default to dark
        let initialUrl = MAP_STYLES.dark.url;
        try {
            const saved = localStorage.getItem(STYLE_STORAGE_KEY) as MapStyleKey | null;
            if (saved && saved in MAP_STYLES) {
                initialUrl = MAP_STYLES[saved].url;
            } else if (process.env.NEXT_PUBLIC_MAPBOX_STYLE) {
                initialUrl = process.env.NEXT_PUBLIC_MAPBOX_STYLE;
            }
        } catch {
            // ignore
        }

        const map = new mapboxgl.Map({
            container: mapContainer.current,
            style: initialUrl,
            center: [77.5, 20.5],
            zoom: 4,
            projection: "globe",
        });

        // Triggered every time ANY style loads (including after map.setStyle)
        map.on("style.load", () => {
            if (loadingTimeoutRef.current) {
                clearTimeout(loadingTimeoutRef.current);
                loadingTimeoutRef.current = null;
            }
            setIsStyleLoading(false);

            // Re-apply 3D globe projection
            try {
                map.setProjection("globe");
            } catch {
                // ignore
            }

            // Re-apply pitch
            const targetPitch = viewRef.current === "3D" ? 72 : 0;
            map.easeTo({ pitch: targetPitch, duration: 200 });

            // Restore custom pin markers & layers
            setupCustomLayers(map);
        });

        // Interactive Pin Click
        map.on("click", LAYER_ID, (e) => {
            if (!e.features?.[0]) return;
            const props = e.features[0].properties!;
            if (onListingClickRef.current && props.id) {
                onListingClickRef.current(props.id as string);
            }
        });

        // Hover cursor pointer
        map.on("mouseenter", LAYER_ID, () => {
            map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", LAYER_ID, () => {
            map.getCanvas().style.cursor = "";
        });

        mapInstance.current = map;

        return () => {
            if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
            map.remove();
        };
    }, [setupCustomLayers]);

    // 4. Update listings data dynamically
    useEffect(() => {
        const map = mapInstance.current;
        if (!map) return;

        if (sourceReady.current && map.getSource(SOURCE_ID)) {
            const source = map.getSource(SOURCE_ID) as mapboxgl.GeoJSONSource;
            source.setData(toGeoJSON(listings));
        }
    }, [listings]);

    // 5. Handle flyTo coordinates
    useEffect(() => {
        const map = mapInstance.current;
        if (!map || !flyTo) return;

        const apply = () => {
            map.flyTo({
                center: [flyTo.lng, flyTo.lat],
                zoom: 12,
                pitch: view === "3D" ? 72 : 0,
                duration: 1500,
            });
        };

        if (map.isStyleLoaded()) {
            apply();
        } else {
            map.once("load", apply);
        }
    }, [flyTo, view]);

    // 6. Handle 2D/3D view toggle
    useEffect(() => {
        const map = mapInstance.current;
        if (!map) return;
        if (showViewToggle) {
            try {
                localStorage.setItem(LS_VIEW_KEY, view);
            } catch {
                // ignore
            }
        }

        map.easeTo({
            pitch: view === "3D" ? 72 : 0,
            duration: 500,
        });
    }, [view, showViewToggle]);

    // 7. Click outside and Escape key handler for Layer Selector Popover
    useEffect(() => {
        if (!isLayerSelectorOpen) return;

        const handleClickOutside = (e: MouseEvent) => {
            if (layerSelectorRef.current && !layerSelectorRef.current.contains(e.target as Node)) {
                setIsLayerSelectorOpen(false);
            }
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setIsLayerSelectorOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [isLayerSelectorOpen]);

    // Switch map style dynamically preserving state
    const handleSwitchStyle = (styleKey: MapStyleKey) => {
        if (styleKey === currentStyle || isStyleLoading) return;

        const map = mapInstance.current;
        if (!map) return;

        setIsStyleLoading(true);
        setCurrentStyle(styleKey);

        try {
            localStorage.setItem(STYLE_STORAGE_KEY, styleKey);
        } catch {
            // ignore
        }

        // Safety timeout in case style load stalls
        if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = setTimeout(() => {
            setIsStyleLoading(false);
        }, 6000);

        try {
            map.setStyle(MAP_STYLES[styleKey].url);
        } catch (err) {
            console.error("Failed to set map style:", err);
            setIsStyleLoading(false);
        }
    };

    const toggleView = () => setView(v => (v === "3D" ? "2D" : "3D"));

    return (
        <div className="relative w-full h-full">
            <div ref={mapContainer} className="w-full h-full" />

            {/* Bottom-Right Floating Controls Bar */}
            <div className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 pointer-events-none select-none">
                {/* 1. Map Layer Selector */}
                {showLayerSelector && (
                    <div ref={layerSelectorRef} className="relative pointer-events-auto">
                        {/* Trigger Button */}
                        <button
                            onClick={() => setIsLayerSelectorOpen(prev => !prev)}
                            className={`bg-[#18181B]/90 backdrop-blur-md rounded-xl shadow-2xl px-3.5 py-2 text-xs font-semibold text-[#FAFAFA] hover:bg-[#27272A] hover:text-white transition-all cursor-pointer border flex items-center gap-2 ${
                                isLayerSelectorOpen
                                    ? "border-[#8B5CF6] text-white ring-2 ring-[#8B5CF6]/40"
                                    : "border-[#27272A] hover:border-[#3F3F46]"
                            }`}
                            aria-label="Map layers"
                            aria-expanded={isLayerSelectorOpen}
                            title="Select map style"
                        >
                            <svg
                                className="w-4 h-4 text-[#8B5CF6]"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                                />
                            </svg>
                            <span>Layers</span>
                            {isStyleLoading ? (
                                <span className="w-3 h-3 border-2 border-[#8B5CF6] border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <span className="text-[10px] text-[#A1A1AA] bg-[#27272A] px-1.5 py-0.5 rounded uppercase font-bold">
                                    {MAP_STYLES[currentStyle].name}
                                </span>
                            )}
                        </button>

                        {/* Floating Popover Menu */}
                        {isLayerSelectorOpen && (
                            <div className="absolute bottom-12 right-0 w-72 sm:w-80 p-3 rounded-2xl bg-[#18181B]/95 backdrop-blur-xl border border-[#27272A] shadow-2xl z-50 text-[#FAFAFA] animate-in fade-in slide-in-from-bottom-2 duration-150">
                                <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-[#27272A]">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-sm">🗺️</span>
                                        <h4 className="text-xs font-bold text-[#FAFAFA]">Map Styles</h4>
                                    </div>
                                    <button
                                        onClick={() => setIsLayerSelectorOpen(false)}
                                        className="p-1 rounded-md text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#27272A] transition-colors text-xs"
                                    >
                                        ✕
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    {(Object.keys(MAP_STYLES) as MapStyleKey[]).map((key) => {
                                        const opt = MAP_STYLES[key];
                                        const isSelected = currentStyle === key;
                                        return (
                                            <button
                                                key={opt.id}
                                                onClick={() => handleSwitchStyle(opt.id)}
                                                disabled={isStyleLoading}
                                                className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between relative group ${
                                                    isSelected
                                                        ? "border-[#8B5CF6] bg-[#8B5CF6]/15 ring-2 ring-[#8B5CF6]/40 text-[#FAFAFA]"
                                                        : "border-[#27272A] bg-[#111827]/60 hover:bg-[#111827] hover:border-[#3F3F46] text-[#A1A1AA]"
                                                }`}
                                            >
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <span className="text-base">{opt.icon}</span>
                                                    {isSelected && (
                                                        <span className="w-4 h-4 rounded-full bg-[#8B5CF6] text-white flex items-center justify-center text-[10px] font-bold">
                                                            ✓
                                                        </span>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-1">
                                                        <h5 className="text-xs font-bold text-[#FAFAFA]">{opt.name}</h5>
                                                        {key === "dark" && (
                                                            <span className="text-[9px] bg-[#8B5CF6]/25 text-[#A78BFA] px-1 rounded font-semibold">
                                                                Default
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-[10px] text-[#A1A1AA] mt-0.5 line-clamp-1">{opt.description}</p>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* 2. 2D / 3D View Toggle */}
                {showViewToggle && (
                    <button
                        onClick={toggleView}
                        className="bg-[#18181B]/90 backdrop-blur-md rounded-xl shadow-2xl px-3.5 py-2 text-xs font-semibold text-[#FAFAFA] hover:bg-[#27272A] hover:text-white transition-all cursor-pointer border border-[#27272A] hover:border-[#3F3F46] flex items-center gap-1.5 pointer-events-auto"
                    >
                        <span className="w-2 h-2 rounded-full bg-[#8B5CF6]" />
                        {view === "3D" ? "2D View" : "3D View"}
                    </button>
                )}
            </div>
        </div>
    );
}
