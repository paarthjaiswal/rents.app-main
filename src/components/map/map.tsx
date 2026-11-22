"use client";

import dynamic from "next/dynamic";
import type { ListingResult } from "@/types/listing";
import "mapbox-gl/dist/mapbox-gl.css";

const MapboxMap = dynamic(() => import("./mapbox"), { ssr: false });

interface MapComponentProps {
    listings?: ListingResult[];
    flyTo?: { lng: number; lat: number } | null;
    onListingClick?: (listingId: string) => void;
    showViewToggle?: boolean;
}

const MapComponent = ({ listings = [], flyTo, onListingClick, showViewToggle = false }: MapComponentProps) => {
    return (
        <div className="w-full h-full">
            <MapboxMap
                listings={listings}
                flyTo={flyTo}
                onListingClick={onListingClick}
                showViewToggle={showViewToggle}
            />
        </div>
    );
}

export default MapComponent;
