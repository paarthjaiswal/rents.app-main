"use client";

import { useEffect, useState } from "react";
import type { ListingDetail as ListingDetailType } from "@/types/listing-detail";

interface ListingDetailProps {
    listingId: string | null;
    onClose: () => void;
}

const propertyTypeLabel: Record<string, string> = {
    PG: "PG",
    FLAT: "Flat",
    SHARED: "Shared Room",
};

export default function ListingDetailPanel({ listingId, onClose }: ListingDetailProps) {
    const [detail, setDetail] = useState<ListingDetailType | null>(null);
    const [loading, setLoading] = useState(false);
    const [imageIndex, setImageIndex] = useState(0);

    useEffect(() => {
        if (!listingId) {
            setDetail(null);
            return;
        }

        setLoading(true);
        setImageIndex(0);

        fetch(`/api/listings/${listingId}`)
            .then(res => res.json())
            .then(data => setDetail(data))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [listingId]);

    const images = detail?.images || [];
    const isOpen = !!listingId;

    return (
        <div
            className={`absolute top-3 right-3 bottom-3 w-[92vw] sm:w-[500px] md:w-[560px] bg-[#18181B] border border-[#27272A] text-[#FAFAFA] rounded-2xl shadow-2xl z-40 flex flex-col transition-transform duration-300 ${
                isOpen ? "translate-x-0" : "translate-x-[calc(100%+24px)]"
            }`}
        >
            {loading ? (
                <div className="flex flex-col items-center justify-center flex-1 gap-3">
                    <div className="w-8 h-8 border-3 border-[#27272A] border-t-[#8B5CF6] rounded-full animate-spin" />
                    <span className="text-xs text-[#A1A1AA]">Loading property details...</span>
                </div>
            ) : detail ? (
                <>
                    {/* Image Header */}
                    <div className="relative shrink-0">
                        {images.length > 0 ? (
                            <>
                                <img
                                    src={images[imageIndex]}
                                    alt={detail.title}
                                    className="w-full h-64 object-cover rounded-t-2xl"
                                />
                                {images.length > 1 && (
                                    <>
                                        <button
                                            onClick={() => setImageIndex(i => (i - 1 + images.length) % images.length)}
                                            className="absolute left-2.5 top-1/2 -translate-y-1/2 bg-[#18181B]/80 hover:bg-[#27272A] text-white rounded-full w-8 h-8 flex items-center justify-center shadow-md text-sm border border-[#27272A] transition-colors"
                                        >
                                            ‹
                                        </button>
                                        <button
                                            onClick={() => setImageIndex(i => (i + 1) % images.length)}
                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-[#18181B]/80 hover:bg-[#27272A] text-white rounded-full w-8 h-8 flex items-center justify-center shadow-md text-sm border border-[#27272A] transition-colors"
                                        >
                                            ›
                                        </button>
                                        <div className="absolute bottom-2.5 right-2.5 bg-black/75 backdrop-blur-sm text-white text-xs px-2 py-0.5 rounded-full border border-white/10">
                                            {imageIndex + 1}/{images.length}
                                        </div>
                                    </>
                                )}
                            </>
                        ) : (
                            <div className="w-full h-40 bg-[#111827] rounded-t-2xl flex items-center justify-center text-[#71717A] text-sm border-b border-[#27272A]">
                                No photos available
                            </div>
                        )}

                        <button
                            onClick={onClose}
                            className="absolute top-3 right-3 bg-[#18181B]/80 hover:bg-[#27272A] rounded-xl w-9 h-9 flex items-center justify-center shadow-lg text-[#FAFAFA] text-lg font-semibold border border-[#27272A] z-10 cursor-pointer transition-colors"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Content Body */}
                    <div className="flex-1 overflow-y-auto p-5 space-y-5">
                        <div>
                            <div className="flex items-start justify-between gap-3">
                                <h2 className="text-lg font-bold text-[#FAFAFA] leading-snug">{detail.title}</h2>
                                <span className="shrink-0 text-xs font-semibold bg-[#8B5CF6]/15 text-[#A78BFA] border border-[#8B5CF6]/30 px-2.5 py-1 rounded-lg">
                                    {propertyTypeLabel[detail.propertyType] || detail.propertyType}
                                </span>
                            </div>
                            <p className="text-xs text-[#A1A1AA] mt-1.5 flex items-center gap-1">
                                <span>📍</span>
                                <span>{detail.address}</span>
                            </p>
                        </div>

                        <div className="flex items-baseline gap-1.5 p-3 rounded-xl bg-[#111827] border border-[#27272A]">
                            <span className="text-2xl font-extrabold text-[#A78BFA]">
                                ₹{detail.rent.toLocaleString("en-IN")}
                            </span>
                            <span className="text-sm font-normal text-[#A1A1AA]">/ month</span>
                        </div>

                        {detail.description && (
                            <div>
                                <h3 className="text-xs font-semibold text-[#A1A1AA] uppercase tracking-wider mb-1.5">Overview</h3>
                                <p className="text-sm text-[#D4D4D8] leading-relaxed bg-[#111827]/40 p-3.5 rounded-xl border border-[#27272A]/60">
                                    {detail.description}
                                </p>
                            </div>
                        )}

                        {detail.amenities && detail.amenities.length > 0 && (
                            <div>
                                <h3 className="text-xs font-semibold text-[#A1A1AA] uppercase tracking-wider mb-2">Amenities</h3>
                                <div className="flex flex-wrap gap-2">
                                    {detail.amenities.map(amenity => (
                                        <span
                                            key={amenity}
                                            className="px-2.5 py-1 text-xs font-medium rounded-lg bg-[#8B5CF6]/10 text-[#A78BFA] border border-[#8B5CF6]/20 flex items-center gap-1.5"
                                        >
                                            <span className="text-[#8B5CF6] text-[10px]">✦</span>
                                            {amenity}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Owner / Contact Card */}
                        <div className="p-4 bg-[#111827] border border-[#27272A] rounded-xl space-y-2.5">
                            <h3 className="text-xs font-semibold text-[#A1A1AA] uppercase tracking-wider">Property Owner</h3>
                            <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-[#8B5CF6]/20 text-[#8B5CF6] font-bold flex items-center justify-center text-xs">
                                        {detail.ownerName ? detail.ownerName.charAt(0) : "U"}
                                    </div>
                                    <span className="font-medium text-[#FAFAFA]">{detail.ownerName}</span>
                                </div>
                                <span className="text-xs bg-[#27272A] text-[#A1A1AA] px-2 py-0.5 rounded-md font-medium">
                                    {detail.ownerType}
                                </span>
                            </div>

                            {detail.ownerPhone && (
                                <a
                                    href={`tel:${detail.ownerPhone}`}
                                    className="mt-2 w-full py-2 px-3 rounded-lg bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm"
                                >
                                    <span>📞 Call Owner:</span>
                                    <span>{detail.ownerPhone}</span>
                                </a>
                            )}
                        </div>
                    </div>
                </>
            ) : isOpen ? (
                <div className="flex items-center justify-center flex-1 text-[#71717A] text-sm">
                    Listing details not found
                </div>
            ) : null}
        </div>
    );
}
