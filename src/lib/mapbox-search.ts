import type { SearchBoxOptions, SearchBoxFeatureSuggestion, SearchBoxRetrieveResponse } from "@mapbox/search-js-core";
import type { Theme } from "@mapbox/search-js-web";

export type RetrievedSearchFeature = SearchBoxRetrieveResponse["features"][number] | SearchBoxFeatureSuggestion;

/**
 * Shared Mapbox SearchBox options configured for location-independent,
 * worldwide and nationwide search without IP or local proximity bias.
 */
export const MAPBOX_SEARCH_OPTIONS: Partial<SearchBoxOptions> = {
    language: "en",
    // Neutralizes automatic IP-based proximity detection by setting proximity
    // to Null Island (0, 0), preventing local shops/POIs in the user's city
    // (e.g., Nagpur) from overriding major metropolitan cities (e.g., Bengaluru, Mumbai, Delhi).
    proximity: "0,0",
    // Includes administrative regions, places, localities, neighborhoods, streets, addresses, and POIs
    types: "place,locality,neighborhood,district,region,street,address,poi",
    // Returns up to 8 comprehensive suggestions
    limit: 8,
};

/**
 * Shared dark theme styling for Mapbox Search Box and suggestions listbox.
 */
export const MAPBOX_SEARCH_THEME: Theme = {
    variables: {
        unit: "14px",
        colorText: "#FAFAFA",
        colorPrimary: "#8B5CF6",
        colorSecondary: "#A1A1AA",
        colorBackground: "#18181B",
        colorBackgroundHover: "#27272A",
        colorBackgroundActive: "#3F3F46",
        border: "1px solid #27272A",
        borderRadius: "12px",
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.6), 0 8px 10px -6px rgba(0, 0, 0, 0.6)",
    },
};

/**
 * Formats a retrieved Mapbox feature into a clear, unambiguous location string
 * showing primary name and geographic hierarchy (e.g. "Bengaluru, Karnataka, India").
 */
export function formatMapboxLocation(feature?: RetrievedSearchFeature | null): string {
    if (!feature || !feature.properties) return "";

    const props = feature.properties;

    // Prefer full_address if provided by the API
    if (props.full_address && typeof props.full_address === "string" && props.full_address.trim()) {
        return props.full_address.trim();
    }

    const name = (props.name_preferred || props.name || "").trim();
    const place = (props.place_formatted || "").trim();

    if (name && place) {
        if (place.toLowerCase().startsWith(name.toLowerCase())) {
            return place;
        }
        return `${name}, ${place}`;
    }

    return name || place || "";
}

