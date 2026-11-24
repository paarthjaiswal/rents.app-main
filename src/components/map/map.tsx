"use client";

import dynamic from "next/dynamic";
import type { ListingResult } from "@/types/listing";
import "mapbox-gl/dist/mapbox-gl.css";

const MapboxMap = dynamic(() => import("./mapbox"), { ssr: false });

export interface MapComponentProps {
    listings?: ListingResult[];
    flyTo?: { lng: number; lat: number } | null;
    onListingClick?: (listingId: string) => void;
    selectedListingId?: string | null;
    showViewToggle?: boolean;
    showLayerSelector?: boolean;
    isSidebarOpen?: boolean;
}

const MapComponent = ({
    listings = [],
    flyTo,
    onListingClick,
    selectedListingId,
    showViewToggle = false,
    showLayerSelector = true,
    isSidebarOpen = true,
}: MapComponentProps) => {
    return (
        <div className="w-full h-full">
            <MapboxMap
                listings={listings}
                flyTo={flyTo}
                onListingClick={onListingClick}
                selectedListingId={selectedListingId}
                showViewToggle={showViewToggle}
                showLayerSelector={showLayerSelector}
                isSidebarOpen={isSidebarOpen}
            />
        </div>
    );
};

export default MapComponent;
