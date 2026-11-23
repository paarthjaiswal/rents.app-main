"use client";

import dynamic from "next/dynamic";
import type { ListingResult } from "@/types/listing";
import "mapbox-gl/dist/mapbox-gl.css";

const MapboxMap = dynamic(() => import("./mapbox"), { ssr: false });

export interface MapComponentProps {
    listings?: ListingResult[];
    flyTo?: { lng: number; lat: number } | null;
    onListingClick?: (listingId: string) => void;
    showViewToggle?: boolean;
    showLayerSelector?: boolean;
}

const MapComponent = ({
    listings = [],
    flyTo,
    onListingClick,
    showViewToggle = false,
    showLayerSelector = true,
}: MapComponentProps) => {
    return (
        <div className="w-full h-full">
            <MapboxMap
                listings={listings}
                flyTo={flyTo}
                onListingClick={onListingClick}
                showViewToggle={showViewToggle}
                showLayerSelector={showLayerSelector}
            />
        </div>
    );
};

export default MapComponent;
