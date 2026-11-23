"use client";

import { useState } from "react";
import { Dialog } from "@headlessui/react";
import { useForm, Controller } from "react-hook-form";
import * as Slider from "@radix-ui/react-slider";

import { SearchModalType } from "@/types/search-modal-type";

import dynamic from "next/dynamic";
const SearchBox = dynamic(
    () => import("@mapbox/search-js-react").then(mod => mod.SearchBox),
    {
        ssr: false,
    }
);

interface SearchModalProps {
    onApplyFilters?: (data: SearchModalType) => void;
}

const SearchModal = ({ onApplyFilters }: SearchModalProps) => {
    const [isOpen, setIsOpen] = useState(false);

    const [displayText, setDisplayText] = useState("Discover best properties near you matching your checklist");
    const [applied, setApplied] = useState(false);

    const { register, handleSubmit, control, watch, reset, setValue } = useForm<SearchModalType>({
        defaultValues: {
            location: "",
            placeDetails: null,
            propertyType: {
                pg: true,
                flat: true,
                shared: true,
            },
            ownerType: {
                owner: true,
                broker: true,
            },
            budget: [5000, 50000],
        },
    });

    const budgetValues = watch("budget");

    const onSubmit = (data: SearchModalType) => {
        setApplied(true);
        const types = (Object.keys(data.propertyType) as Array<keyof typeof data.propertyType>)
            .filter((key) => data.propertyType[key])
            .join(", ");
        const owners = (Object.keys(data.ownerType) as Array<keyof typeof data.ownerType>)
            .filter((key) => data.ownerType[key])
            .join(", ");
        setDisplayText(
            `${types} in ${data.location}${owners ? ` · ${owners}` : ""} · ₹${data.budget[0]} - ₹${data.budget[1]}`
        );
        setIsOpen(false);
        onApplyFilters?.(data);
    };

    const handleClear = () => {
        reset();
    };

    const handleClick = () => {
        setIsOpen(!isOpen);
    };

    return (
        <>
            <Dialog
                open={isOpen}
                onClose={() => setIsOpen(false)}
                className="relative z-50"
            >
                <div
                    className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
                    aria-hidden="true"
                />
                <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
                    <Dialog.Panel className="w-full max-w-lg rounded-2xl bg-[#18181B] border border-[#27272A] p-6 shadow-2xl text-[#FAFAFA]">
                        <form onSubmit={handleSubmit(onSubmit)}>
                            <div className="flex items-center justify-between pb-4 border-b border-[#27272A]">
                                <Dialog.Title className="text-xl font-bold text-[#FAFAFA]">
                                    Filter Properties
                                </Dialog.Title>
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="p-1 rounded-lg text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#27272A] transition-colors"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="mt-6 space-y-6">
                                <div>
                                    <h3 className="text-sm font-semibold text-[#FAFAFA]">Location</h3>
                                    <div className="mt-2">
                                        <SearchBox
                                            accessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN as string}
                                            onRetrieve={(result) => {
                                                const selectedFeature = result.features[0];
                                                setValue("location", selectedFeature.properties.full_address);
                                                setValue("placeDetails", {
                                                    name: selectedFeature.properties.name,
                                                    address: selectedFeature.properties.full_address,
                                                    coords: {
                                                        lng: selectedFeature.geometry.coordinates[0],
                                                        lat: selectedFeature.geometry.coordinates[1],
                                                    }
                                                });
                                            }}
                                            options={{
                                                language: "en",
                                                country: "IN",
                                            }}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-sm font-semibold text-[#FAFAFA]">Property Type</h3>
                                    <div className="mt-2.5 flex flex-wrap gap-4">
                                        <label className="flex items-center space-x-2.5 cursor-pointer text-sm text-[#A1A1AA] hover:text-[#FAFAFA]">
                                            <input
                                                type="checkbox"
                                                {...register("propertyType.pg")}
                                                className="h-4 w-4 rounded border-[#27272A] bg-[#09090B] accent-[#8B5CF6] focus:ring-[#8B5CF6]"
                                            />
                                            <span>PG</span>
                                        </label>
                                        <label className="flex items-center space-x-2.5 cursor-pointer text-sm text-[#A1A1AA] hover:text-[#FAFAFA]">
                                            <input
                                                type="checkbox"
                                                {...register("propertyType.flat")}
                                                className="h-4 w-4 rounded border-[#27272A] bg-[#09090B] accent-[#8B5CF6] focus:ring-[#8B5CF6]"
                                            />
                                            <span>Flat</span>
                                        </label>
                                        <label className="flex items-center space-x-2.5 cursor-pointer text-sm text-[#A1A1AA] hover:text-[#FAFAFA]">
                                            <input
                                                type="checkbox"
                                                {...register("propertyType.shared")}
                                                className="h-4 w-4 rounded border-[#27272A] bg-[#09090B] accent-[#8B5CF6] focus:ring-[#8B5CF6]"
                                            />
                                            <span>Shared Room</span>
                                        </label>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-sm font-semibold text-[#FAFAFA]">Owner Type</h3>
                                    <div className="mt-2.5 flex flex-wrap gap-4">
                                        <label className="flex items-center space-x-2.5 cursor-pointer text-sm text-[#A1A1AA] hover:text-[#FAFAFA]">
                                            <input
                                                type="checkbox"
                                                {...register("ownerType.owner")}
                                                className="h-4 w-4 rounded border-[#27272A] bg-[#09090B] accent-[#8B5CF6] focus:ring-[#8B5CF6]"
                                            />
                                            <span>Owner</span>
                                        </label>
                                        <label className="flex items-center space-x-2.5 cursor-pointer text-sm text-[#A1A1AA] hover:text-[#FAFAFA]">
                                            <input
                                                type="checkbox"
                                                {...register("ownerType.broker")}
                                                className="h-4 w-4 rounded border-[#27272A] bg-[#09090B] accent-[#8B5CF6] focus:ring-[#8B5CF6]"
                                            />
                                            <span>Broker</span>
                                        </label>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-sm font-semibold text-[#FAFAFA]">Budget Range</h3>
                                        <span className="text-sm font-semibold text-[#A78BFA]">
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
                                                    <Slider.Thumb className="block w-5 h-5 bg-[#FAFAFA] border-2 border-[#8B5CF6] shadow-md rounded-full focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] cursor-grab active:cursor-grabbing" />
                                                    <Slider.Thumb className="block w-5 h-5 bg-[#FAFAFA] border-2 border-[#8B5CF6] shadow-md rounded-full focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] cursor-grab active:cursor-grabbing" />
                                                </Slider.Root>
                                            )}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 flex justify-end space-x-3 pt-4 border-t border-[#27272A]">
                                <button
                                    type="button"
                                    onClick={handleClear}
                                    className="px-4 py-2 text-sm font-medium text-[#A1A1AA] bg-[#27272A] rounded-xl hover:bg-[#3F3F46] hover:text-[#FAFAFA] transition-colors cursor-pointer"
                                >
                                    Clear all
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 text-sm font-semibold text-white bg-[#8B5CF6] hover:bg-[#7C3AED] rounded-xl shadow-lg shadow-[#8B5CF6]/20 transition-all cursor-pointer"
                                >
                                    Apply Filters
                                </button>
                            </div>
                        </form>
                    </Dialog.Panel>
                </div>
            </Dialog>

            <div
                onClick={handleClick}
                className={`search-modal mt-4 bg-[#18181B]/90 border border-[#27272A] hover:border-[#8B5CF6]/60 rounded-2xl shadow-2xl p-5 max-w-xl w-full pointer-events-auto cursor-pointer text-base sm:text-lg backdrop-blur-md transition-all duration-200 flex items-center gap-3 ${
                    applied ? "text-[#FAFAFA]" : "text-[#A1A1AA]"
                }`}
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-5 h-5 text-[#8B5CF6] shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                </svg>
                <span className="truncate">{displayText}</span>
            </div>
        </>
    );
};

export default SearchModal;
