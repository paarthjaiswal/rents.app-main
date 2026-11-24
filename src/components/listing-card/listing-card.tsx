"use client";

import type { ListingResult } from "@/types/listing";

interface ListingCardProps {
    listing: ListingResult;
    isSelected?: boolean;
    onClick: (listing: ListingResult) => void;
}

const propertyTypeLabel: Record<string, string> = {
    PG: "PG",
    FLAT: "Flat",
    SHARED: "Shared Room",
};

export default function ListingCard({ listing, isSelected = false, onClick }: ListingCardProps) {
    return (
        <div
            onClick={() => onClick(listing)}
            className={`flex gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 group relative ${
                isSelected
                    ? "bg-[#8B5CF6]/15 border-2 border-[#8B5CF6] shadow-lg shadow-[#8B5CF6]/20 ring-1 ring-[#8B5CF6]/40"
                    : "bg-[#18181B] hover:bg-[#27272A]/70 border border-[#27272A] hover:border-[#8B5CF6]/40 shadow-sm hover:shadow-md"
            }`}
        >
            {isSelected && (
                <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1.5 bg-[#8B5CF6] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md animate-in fade-in zoom-in-95 duration-150">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    Selected
                </div>
            )}
            {listing.images?.[0] ? (
                <img
                    src={listing.images[0]}
                    alt={listing.title}
                    className={`w-20 h-20 rounded-lg object-cover shrink-0 border transition-colors ${
                        isSelected ? "border-[#8B5CF6]/60" : "border-[#27272A]"
                    }`}
                />
            ) : (
                <div className="w-20 h-20 rounded-lg bg-[#27272A] shrink-0 flex items-center justify-center text-[#71717A] text-xs border border-[#27272A]">
                    No image
                </div>
            )}
            <div className="flex flex-col justify-between min-w-0 flex-1 pr-14">
                <div>
                    <h4
                        className={`text-sm font-semibold transition-colors truncate ${
                            isSelected ? "text-[#A78BFA]" : "text-[#FAFAFA] group-hover:text-[#8B5CF6]"
                        }`}
                    >
                        {listing.title}
                    </h4>
                    <p className="text-xs text-[#A1A1AA] truncate mt-0.5">{listing.address}</p>
                </div>
                <div className="flex items-center justify-between mt-2">
                    <span className="text-sm font-bold text-[#A78BFA]">
                        ₹{listing.rent.toLocaleString("en-IN")}
                        <span className="text-xs font-normal text-[#A1A1AA]">/mo</span>
                    </span>
                    <span className="text-[11px] font-medium text-[#A1A1AA] bg-[#27272A] px-2 py-0.5 rounded-md">
                        {propertyTypeLabel[listing.propertyType] || listing.propertyType}
                    </span>
                </div>
            </div>
        </div>
    );
}
