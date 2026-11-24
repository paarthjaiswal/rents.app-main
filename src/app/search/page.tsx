"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import Link from "next/link";
import MapComponent from "@/components/map/map";
import SearchSidebar, { type SearchFilters } from "@/components/search-sidebar/search-sidebar";
import ListingDetailPanel from "@/components/listing-detail/listing-detail";
import type { ListingResult } from "@/types/listing";

function SearchContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const listingIdParam = searchParams.get("listingId") || searchParams.get("selected");

    const [listings, setListings] = useState<ListingResult[]>([]);
    const [flyTo, setFlyTo] = useState<{ lng: number; lat: number } | null>(null);
    const [selectedListingId, setSelectedListingId] = useState<string | null>(listingIdParam);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [deepLinkError, setDeepLinkError] = useState<string | null>(null);

    const handledListingIdRef = useRef<string | null>(null);
    const preservedListingRef = useRef<ListingResult | null>(null);

    const filters: SearchFilters = {
        lat: Number(searchParams.get("lat")) || 0,
        lng: Number(searchParams.get("lng")) || 0,
        location: searchParams.get("location") || "",
        propertyType: searchParams.get("propertyType")?.split(",").filter(Boolean) || [],
        ownerType: searchParams.get("ownerType")?.split(",").filter(Boolean) || ["OWNER", "BROKER"],
        minRent: Number(searchParams.get("minRent")) || 5000,
        maxRent: Number(searchParams.get("maxRent")) || 50000,
    };

    // Shared select handler synchronizing state and browser URL history
    const handleSelectListing = useCallback((id: string | null) => {
        setSelectedListingId(id);
        const params = new URLSearchParams(window.location.search);
        if (id) {
            params.set("listingId", id);
        } else {
            params.delete("listingId");
            params.delete("selected");
        }
        const qs = params.toString();
        const newUrl = `${window.location.pathname}${qs ? `?${qs}` : ""}`;
        window.history.pushState(null, "", newUrl);
    }, []);

    // Listen to browser back/forward buttons
    useEffect(() => {
        const onPopState = () => {
            const params = new URLSearchParams(window.location.search);
            const id = params.get("listingId") || params.get("selected");
            setSelectedListingId(id);
        };
        window.addEventListener("popstate", onPopState);
        return () => window.removeEventListener("popstate", onPopState);
    }, []);

    // Fetch listings around given filters, preserving any selected property
    const fetchListings = useCallback(async (f: SearchFilters, preserve?: ListingResult) => {
        const params = new URLSearchParams();
        params.set("longitude", String(f.lng));
        params.set("latitude", String(f.lat));
        params.set("radius", "10000");

        if (f.propertyType.length === 1) params.set("propertyType", f.propertyType[0]);
        if (f.ownerType.length === 1) params.set("ownerType", f.ownerType[0]);
        params.set("minRent", String(f.minRent));
        params.set("maxRent", String(f.maxRent));

        try {
            const res = await fetch(`/api/listings/search?${params.toString()}`);
            const data = await res.json();
            const fetched: ListingResult[] = data.listings || [];

            const toPreserve = preserve || preservedListingRef.current;
            if (toPreserve) {
                const exists = fetched.some(l => l.id === toPreserve.id);
                setListings(exists ? fetched : [toPreserve, ...fetched]);
            } else {
                setListings(fetched);
            }
        } catch {
            const toPreserve = preserve || preservedListingRef.current;
            setListings(toPreserve ? [toPreserve] : []);
        }
    }, []);

    // Normal filter-based search fetch
    useEffect(() => {
        if (filters.lat && filters.lng) {
            setFlyTo({ lng: filters.lng, lat: filters.lat });
            fetchListings(filters);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams.toString()]);

    // Deep-link loader for ?listingId=... or ?selected=...
    useEffect(() => {
        if (!listingIdParam) return;
        if (handledListingIdRef.current === listingIdParam) return;

        handledListingIdRef.current = listingIdParam;
        setSelectedListingId(listingIdParam);
        setDeepLinkError(null);

        // Fetch exact listing details from API
        fetch(`/api/listings/${listingIdParam}`)
            .then(async (res) => {
                if (!res.ok) {
                    setDeepLinkError("The requested property could not be found or may have been unlisted.");
                    return;
                }
                const data = await res.json();
                if (!data || !data.id || data.error) {
                    setDeepLinkError("The requested property could not be found or may have been unlisted.");
                    return;
                }

                const selectedItem: ListingResult = {
                    id: data.id,
                    title: data.title,
                    rent: data.rent,
                    propertyType: data.propertyType,
                    address: data.address,
                    images: data.images || [],
                    longitude: Number(data.longitude),
                    latitude: Number(data.latitude),
                    ownerName: data.ownerName || "Owner",
                    ownerType: data.ownerType || "OWNER",
                };

                preservedListingRef.current = selectedItem;

                // Add to listings immediately so marker & card are available
                setListings(prev => {
                    const exists = prev.some(l => l.id === selectedItem.id);
                    return exists ? prev : [selectedItem, ...prev];
                });

                // Smoothly fly camera to exact property coordinates
                setFlyTo({ lng: selectedItem.longitude, lat: selectedItem.latitude });

                // If no existing search coordinates, fetch neighboring listings around this property
                if (!filters.lat || !filters.lng) {
                    fetchListings({
                        lat: selectedItem.latitude,
                        lng: selectedItem.longitude,
                        location: selectedItem.address || "",
                        propertyType: [],
                        ownerType: ["OWNER", "BROKER"],
                        minRent: 1000,
                        maxRent: 100000,
                    }, selectedItem);
                }
            })
            .catch((err) => {
                console.error("Deep link fetch error:", err);
                setDeepLinkError("Failed to load property details. Please try again.");
            });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [listingIdParam]);

    const handleFiltersChange = (newFilters: SearchFilters) => {
        const params = new URLSearchParams();
        params.set("lat", String(newFilters.lat));
        params.set("lng", String(newFilters.lng));
        params.set("location", newFilters.location);
        if (newFilters.propertyType.length) params.set("propertyType", newFilters.propertyType.join(","));
        if (newFilters.ownerType.length) params.set("ownerType", newFilters.ownerType.join(","));
        params.set("minRent", String(newFilters.minRent));
        params.set("maxRent", String(newFilters.maxRent));

        if (selectedListingId) {
            params.set("listingId", selectedListingId);
        }

        router.push(`/search?${params.toString()}`);
    };

    return (
        <div className="flex h-screen w-screen bg-[#09090B] text-[#FAFAFA] overflow-hidden relative">
            {/* Left Collapsible Search & Filter Sidebar */}
            <aside
                className={`h-full shrink-0 border-r border-[#27272A] bg-[#18181B] z-20 flex flex-col shadow-2xl transition-[width,transform,opacity] duration-300 ease-in-out ${
                    isSidebarOpen
                        ? "w-[340px] sm:w-[360px] translate-x-0 opacity-100"
                        : "w-0 -translate-x-full opacity-0 pointer-events-none border-none overflow-hidden"
                }`}
                aria-hidden={!isSidebarOpen}
            >
                <div className="w-[340px] sm:w-[360px] h-full flex flex-col">
                    <SearchSidebar
                        initialFilters={filters}
                        onFiltersChange={handleFiltersChange}
                        listings={listings}
                        onListingClick={(l) => handleSelectListing(l.id)}
                        selectedListingId={selectedListingId}
                        onCloseSidebar={() => setIsSidebarOpen(false)}
                    />
                </div>
            </aside>

            {/* Main Interactive Map View */}
            <main className="flex-1 relative overflow-hidden h-full">
                {/* Persistent Top Navigation Bar (Independent of Sidebar) */}
                <div className="absolute top-3.5 left-3.5 z-30 flex items-center gap-2 pointer-events-auto">
                    {/* Persistent Go to Home Button */}
                    <Link
                        href="/"
                        className="bg-[#18181B]/90 backdrop-blur-md border border-[#27272A] hover:border-[#3F3F46] rounded-xl px-3.5 py-2 text-xs font-semibold text-[#FAFAFA] hover:bg-[#27272A] transition-all shadow-xl flex items-center gap-2 cursor-pointer group"
                        title="Go to Home"
                    >
                        <svg
                            className="w-4 h-4 text-[#8B5CF6] group-hover:scale-110 transition-transform"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                            />
                        </svg>
                        <span className="hidden sm:inline">Go to Home</span>
                    </Link>

                    {/* Collapsible Sidebar Toggle Button */}
                    <button
                        type="button"
                        onClick={() => setIsSidebarOpen(prev => !prev)}
                        className={`bg-[#18181B]/90 backdrop-blur-md border rounded-xl px-3.5 py-2 text-xs font-semibold transition-all shadow-xl flex items-center gap-2 cursor-pointer ${
                            isSidebarOpen
                                ? "border-[#27272A] hover:border-[#3F3F46] text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#27272A]"
                                : "border-[#8B5CF6]/50 text-[#FAFAFA] hover:border-[#8B5CF6] hover:bg-[#27272A]"
                        }`}
                        aria-label={isSidebarOpen ? "Hide filters" : "Show filters"}
                        title={isSidebarOpen ? "Hide filters" : "Show filters"}
                    >
                        {isSidebarOpen ? (
                            <>
                                <svg
                                    className="w-4 h-4 text-[#A1A1AA]"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                >
                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                    <line x1="9" y1="3" x2="9" y2="21" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 10l-2 2 2 2" />
                                </svg>
                                <span className="hidden sm:inline">Hide Filters</span>
                            </>
                        ) : (
                            <>
                                <svg
                                    className="w-4 h-4 text-[#8B5CF6]"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                >
                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                    <line x1="9" y1="3" x2="9" y2="21" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 10l2 2-2 2" />
                                </svg>
                                <span>Show Filters</span>
                                {listings.length > 0 && (
                                    <span className="text-[10px] bg-[#8B5CF6]/20 text-[#A78BFA] px-1.5 py-0.5 rounded-full font-bold">
                                        {listings.length}
                                    </span>
                                )}
                            </>
                        )}
                    </button>
                </div>

                {/* Dismissible Error Toast if Deep Link Failed */}
                {deepLinkError && (
                    <div className="absolute top-4 left-1/2 -translate-y-1/2 z-50 bg-[#18181B]/95 backdrop-blur-md border border-[#EF4444]/40 text-[#EF4444] px-4 py-2.5 rounded-xl shadow-2xl text-xs flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                        <span>⚠️ {deepLinkError}</span>
                        <button
                            type="button"
                            onClick={() => setDeepLinkError(null)}
                            className="text-[#A1A1AA] hover:text-white font-bold text-sm cursor-pointer"
                        >
                            ✕
                        </button>
                    </div>
                )}

                {/* Mapbox Map Component */}
                <MapComponent
                    listings={listings}
                    flyTo={flyTo}
                    onListingClick={handleSelectListing}
                    selectedListingId={selectedListingId}
                    showViewToggle
                    isSidebarOpen={isSidebarOpen}
                />

                {/* Selected Property Details Panel */}
                <ListingDetailPanel
                    listingId={selectedListingId}
                    onClose={() => handleSelectListing(null)}
                />
            </main>
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense>
            <SearchContent />
        </Suspense>
    );
}
