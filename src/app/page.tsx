"use client";

import Logo from "@/components/logo";
import MapComponent from "@/components/map/map";
import NavBar from "@/components/nav-bar/nav-bar";
import SearchButton from "@/components/search-modal/search-button";
import SearchModal from "@/components/search-modal/search-modal";
import type { SearchModalType } from "@/types/search-modal-type";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  const handleApplyFilters = (data: SearchModalType) => {
    if (!data.placeDetails?.coords) return;

    const params = new URLSearchParams();
    params.set("lat", String(data.placeDetails.coords.lat));
    params.set("lng", String(data.placeDetails.coords.lng));
    params.set("location", data.location);

    const types: string[] = [];
    if (data.propertyType.pg) types.push("PG");
    if (data.propertyType.flat) types.push("FLAT");
    if (data.propertyType.shared) types.push("SHARED");
    if (types.length) params.set("propertyType", types.join(","));

    const owners: string[] = [];
    if (data.ownerType.owner) owners.push("OWNER");
    if (data.ownerType.broker) owners.push("BROKER");
    if (owners.length) params.set("ownerType", owners.join(","));

    params.set("minRent", String(data.budget[0]));
    params.set("maxRent", String(data.budget[1]));

    router.push(`/search?${params.toString()}`);
  };

  const handleGoToMap = () => {
    // Direct navigation to Bhilai, Chhattisgarh area
    const params = new URLSearchParams();
    params.set("lat", "21.1938");
    params.set("lng", "81.3509");
    params.set("location", "Bhilai, Chhattisgarh");
    params.set("propertyType", "PG,FLAT,SHARED");
    params.set("ownerType", "OWNER,BROKER");
    params.set("minRent", "5000");
    params.set("maxRent", "50000");

    router.push(`/search?${params.toString()}`);
  };

  return (
    <main className="relative min-h-screen bg-[#09090B] text-[#FAFAFA] overflow-hidden">
      {/* Top Navbar with Merged Sign Up / Log In */}
      <NavBar />

      <div className="relative h-screen w-screen">
        {/* Background Dark Mapbox Map */}
        <div className="absolute inset-0">
          <MapComponent />
        </div>

        {/* Ambient Dark Gradient Overlay */}
        <div className="absolute inset-0 bg-[#09090B]/60 bg-[radial-gradient(ellipse_at_center,_rgba(9,9,11,0.65)_0%,_rgba(9,9,11,0.88)_45%,_#09090B_100%)] pointer-events-none" />

        {/* Hero Content */}
        <div className="relative z-10 flex flex-col justify-center items-center h-full pointer-events-none pt-12 px-4">
          <div className="pointer-events-none mb-2 transform hover:scale-105 transition-transform duration-300">
            <Logo height={180} width={180} />
          </div>

          <div className="text-center mb-2 pointer-events-none max-w-lg">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#FAFAFA]">
              Find your next home with <span className="text-[#8B5CF6]">rents.app</span>
            </h1>
            <p className="mt-2 text-sm sm:text-base text-[#A1A1AA]">
              Discover verified flats, PGs, and shared rooms on an interactive map.
            </p>
          </div>

          <div className="flex flex-col items-center w-full max-w-xl">
            <SearchModal onApplyFilters={handleApplyFilters} />

            <div className="flex flex-wrap items-center justify-center gap-3 mt-4 pointer-events-auto">
              <SearchButton
                onClick={handleGoToMap}
                className="flex items-center gap-2.5 cursor-pointer text-sm sm:text-base font-semibold bg-[#8B5CF6] hover:bg-[#7C3AED] text-white rounded-xl py-3 px-6 shadow-xl shadow-[#8B5CF6]/20 hover:shadow-[#8B5CF6]/30 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span>Explore Map</span>
                
              </SearchButton>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
