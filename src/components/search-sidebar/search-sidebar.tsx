"use client";

import { useRef, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import * as Slider from "@radix-ui/react-slider";
import Link from "next/link";
import Logo from "@/components/logo";
import ListingCard from "@/components/listing-card/listing-card";
import type { ListingResult } from "@/types/listing";
import { MAPBOX_SEARCH_OPTIONS, MAPBOX_SEARCH_THEME, formatMapboxLocation } from "@/lib/mapbox-search";

import dynamic from "next/dynamic";
const SearchBox = dynamic(
    () => import("@mapbox/search-js-react").then(mod => mod.SearchBox),
    { ssr: false }
);

export interface SearchFilters {
    location: string;
    lat: number;
    lng: number;
    propertyType: string[];
    ownerType: string[];
    minRent: number;
    maxRent: number;
}

interface FormValues {
    location: string;
    coords: { lat: number; lng: number } | null;
    pg: boolean;
    flat: boolean;
    shared: boolean;
    ownerOwner: boolean;
    ownerBroker: boolean;
    budget: [number, number];
}

interface SearchSidebarProps {
    initialFilters: SearchFilters;
    onFiltersChange: (filters: SearchFilters) => void;
    listings?: ListingResult[];
    onListingClick?: (listing: ListingResult) => void;
    selectedListingId?: string | null;
}

export default function SearchSidebar({
    initialFilters,
    onFiltersChange,
    listings = [],
    onListingClick,
    selectedListingId,
}: SearchSidebarProps) {
    const listContainerRef = useRef<HTMLDivElement | null>(null);
    const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());

    // Scroll selected card smoothly into view inside the sidebar without page jumping
    useEffect(() => {
        if (!selectedListingId) return;

        const el = cardRefs.current.get(selectedListingId);
        const container = listContainerRef.current;
        if (!el || !container) return;

        const containerRect = container.getBoundingClientRect();
        const elRect = el.getBoundingClientRect();

        // Check if already comfortably visible
        const isAlreadyVisible =
            elRect.top >= containerRect.top + 20 &&
            elRect.bottom <= containerRect.bottom - 20;

        if (!isAlreadyVisible) {
            const prefersReducedMotion =
                typeof window !== "undefined" &&
                window.matchMedia("(prefers-reduced-motion: reduce)").matches;

            el.scrollIntoView({
                behavior: prefersReducedMotion ? "auto" : "smooth",
                block: "nearest",
            });
        }
    }, [selectedListingId]);

    const { register, handleSubmit, control, watch, setValue, getValues } = useForm<FormValues>({
        defaultValues: {
            location: initialFilters.location,
            coords: { lat: initialFilters.lat, lng: initialFilters.lng },
            pg: initialFilters.propertyType.includes("PG"),
            flat: initialFilters.propertyType.includes("FLAT"),
            shared: initialFilters.propertyType.includes("SHARED"),
            ownerOwner: initialFilters.ownerType.includes("OWNER"),
            ownerBroker: initialFilters.ownerType.includes("BROKER"),
            budget: [initialFilters.minRent, initialFilters.maxRent],
        },
    });

    const budgetValues = watch("budget");

    const onSubmit = (data: FormValues) => {
        if (!data.coords) return;

        const types: string[] = [];
        if (data.pg) types.push("PG");
        if (data.flat) types.push("FLAT");
        if (data.shared) types.push("SHARED");

        const owners: string[] = [];
        if (data.ownerOwner) owners.push("OWNER");
        if (data.ownerBroker) owners.push("BROKER");

        onFiltersChange({
            location: data.location,
            lat: data.coords.lat,
            lng: data.coords.lng,
            propertyType: types,
            ownerType: owners,
            minRent: data.budget[0],
            maxRent: data.budget[1],
        });
    };

    return (
        <div className="h-full flex flex-col bg-[#18181B] text-[#FAFAFA] border-r border-[#27272A] select-none">
            {/* Header */}
            <div className="px-4 py-3.5 border-b border-[#27272A] flex items-center justify-between bg-[#18181B]/80 backdrop-blur-sm">
                <Link href="/" className="flex items-center gap-2 group">
                    <Logo height={32} width={32} />
                    <span className="text-base font-bold tracking-tight text-[#FAFAFA] group-hover:text-[#8B5CF6] transition-colors">
                        rents<span className="text-[#8B5CF6]">.app</span>
                    </span>
                </Link>
                <Link
                    href="/"
                    className="text-xs font-medium text-[#A1A1AA] hover:text-[#FAFAFA] px-2.5 py-1 rounded-md hover:bg-[#27272A] transition-colors"
                >
                    ← Home
                </Link>
            </div>

            {/* Filter Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="shrink-0 overflow-y-auto p-4 space-y-5 border-b border-[#27272A]">
                <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-[#A1A1AA]">Location</h3>
                    <div className="mt-1.5">
                        <SearchBox
                            accessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN as string}
                            value={initialFilters.location}
                            placeholder="Search city, neighborhood, or landmark..."
                            theme={MAPBOX_SEARCH_THEME}
                            options={MAPBOX_SEARCH_OPTIONS}
                            onRetrieve={(result) => {
                                const feature = result.features[0];
                                if (!feature) return;
                                const formattedLocation = formatMapboxLocation(feature);
                                const coords = {
                                    lng: feature.geometry.coordinates[0],
                                    lat: feature.geometry.coordinates[1],
                                };
                                setValue("location", formattedLocation);
                                setValue("coords", coords);

                                // Immediately trigger filter update and map flyTo
                                const current = getValues();
                                const types: string[] = [];
                                if (current.pg) types.push("PG");
                                if (current.flat) types.push("FLAT");
                                if (current.shared) types.push("SHARED");

                                const owners: string[] = [];
                                if (current.ownerOwner) owners.push("OWNER");
                                if (current.ownerBroker) owners.push("BROKER");

                                onFiltersChange({
                                    location: formattedLocation,
                                    lat: coords.lat,
                                    lng: coords.lng,
                                    propertyType: types,
                                    ownerType: owners,
                                    minRent: current.budget[0],
                                    maxRent: current.budget[1],
                                });
                            }}
                        />
                    </div>
                </div>

                <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-[#A1A1AA]">Property Type</h3>
                    <div className="mt-2 flex flex-wrap gap-2.5">
                        <label className="flex items-center space-x-2 text-xs font-medium text-[#FAFAFA] cursor-pointer bg-[#111827] px-2.5 py-1.5 rounded-lg border border-[#27272A] hover:border-[#3F3F46]">
                            <input
                                type="checkbox"
                                {...register("pg")}
                                className="h-3.5 w-3.5 rounded border-[#27272A] bg-[#09090B] accent-[#8B5CF6] focus:ring-[#8B5CF6]"
                            />
                            <span>PG</span>
                        </label>
                        <label className="flex items-center space-x-2 text-xs font-medium text-[#FAFAFA] cursor-pointer bg-[#111827] px-2.5 py-1.5 rounded-lg border border-[#27272A] hover:border-[#3F3F46]">
                            <input
                                type="checkbox"
                                {...register("flat")}
                                className="h-3.5 w-3.5 rounded border-[#27272A] bg-[#09090B] accent-[#8B5CF6] focus:ring-[#8B5CF6]"
                            />
                            <span>Flat</span>
                        </label>
                        <label className="flex items-center space-x-2 text-xs font-medium text-[#FAFAFA] cursor-pointer bg-[#111827] px-2.5 py-1.5 rounded-lg border border-[#27272A] hover:border-[#3F3F46]">
                            <input
                                type="checkbox"
                                {...register("shared")}
                                className="h-3.5 w-3.5 rounded border-[#27272A] bg-[#09090B] accent-[#8B5CF6] focus:ring-[#8B5CF6]"
                            />
                            <span>Shared</span>
                        </label>
                    </div>
                </div>

                <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-[#A1A1AA]">Owner Type</h3>
                    <div className="mt-2 flex flex-wrap gap-2.5">
                        <label className="flex items-center space-x-2 text-xs font-medium text-[#FAFAFA] cursor-pointer bg-[#111827] px-2.5 py-1.5 rounded-lg border border-[#27272A] hover:border-[#3F3F46]">
                            <input
                                type="checkbox"
                                {...register("ownerOwner")}
                                className="h-3.5 w-3.5 rounded border-[#27272A] bg-[#09090B] accent-[#8B5CF6] focus:ring-[#8B5CF6]"
                            />
                            <span>Owner</span>
                        </label>
                        <label className="flex items-center space-x-2 text-xs font-medium text-[#FAFAFA] cursor-pointer bg-[#111827] px-2.5 py-1.5 rounded-lg border border-[#27272A] hover:border-[#3F3F46]">
                            <input
                                type="checkbox"
                                {...register("ownerBroker")}
                                className="h-3.5 w-3.5 rounded border-[#27272A] bg-[#09090B] accent-[#8B5CF6] focus:ring-[#8B5CF6]"
                            />
                            <span>Broker</span>
                        </label>
                    </div>
                </div>

                <div>
                    <div className="flex justify-between items-center">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#A1A1AA]">Budget Range</h3>
                        <span className="text-xs font-bold text-[#A78BFA]">
                            ₹{budgetValues[0].toLocaleString("en-IN")} - ₹{budgetValues[1].toLocaleString("en-IN")}
                        </span>
                    </div>
                    <div className="mt-3">
                        <Controller
                            name="budget"
                            control={control}
                            render={({ field }) => (
                                <Slider.Root
                                    className="relative flex items-center select-none touch-none w-full h-5"
                                    value={field.value}
                                    onValueChange={field.onChange}
                                    min={1000}
                                    max={100000}
                                    step={500}
                                >
                                    <Slider.Track className="bg-[#27272A] relative grow rounded-full h-[4px]">
                                        <Slider.Range className="absolute bg-[#8B5CF6] rounded-full h-full" />
                                    </Slider.Track>
                                    <Slider.Thumb className="block w-4 h-4 bg-[#FAFAFA] border-2 border-[#8B5CF6] shadow rounded-full focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] cursor-grab active:cursor-grabbing" />
                                    <Slider.Thumb className="block w-4 h-4 bg-[#FAFAFA] border-2 border-[#8B5CF6] shadow rounded-full focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] cursor-grab active:cursor-grabbing" />
                                </Slider.Root>
                            )}
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    className="w-full py-2.5 text-xs font-bold text-white bg-[#8B5CF6] hover:bg-[#7C3AED] rounded-xl shadow-md shadow-[#8B5CF6]/20 transition-all cursor-pointer"
                >
                    Apply Filters
                </button>
            </form>

            {/* Listings Section */}
            <div ref={listContainerRef} className="flex-1 overflow-y-auto">
                <div className="p-3.5 pb-2 flex items-center justify-between sticky top-0 bg-[#18181B] z-10 border-b border-[#27272A]/50">
                    <h3 className="text-xs font-semibold text-[#FAFAFA]">
                        {listings.length} {listings.length === 1 ? "Property" : "Properties"} Found
                    </h3>
                    <span className="text-[11px] text-[#A1A1AA]">Radius 10km</span>
                </div>
                {listings.length > 0 ? (
                    <div className="p-3 space-y-2.5">
                        {listings.map(listing => (
                            <div
                                key={listing.id}
                                ref={(el) => {
                                    if (el) {
                                        cardRefs.current.set(listing.id, el);
                                    } else {
                                        cardRefs.current.delete(listing.id);
                                    }
                                }}
                            >
                                <ListingCard
                                    listing={listing}
                                    isSelected={selectedListingId === listing.id}
                                    onClick={(l) => onListingClick?.(l)}
                                />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-6 text-center text-[#71717A] text-xs space-y-2">
                        <div className="text-2xl">🔍</div>
                        <p className="font-medium text-[#A1A1AA]">No properties found here</p>
                        <p>Try widening your rent range or searching another area.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
