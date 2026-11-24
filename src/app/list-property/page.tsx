"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import NavBar from "@/components/nav-bar/nav-bar";
import LocationPicker from "@/components/location-picker/location-picker";

type PropertyType = "PG" | "FLAT" | "SHARED";

interface ListingFormData {
  title: string;
  propertyType: PropertyType;
  rent: number | "";
  address: string;
  description: string;
  longitude: number;
  latitude: number;
  amenities: string[];
  images: string[];
}

const INITIAL_FORM: ListingFormData = {
  title: "",
  propertyType: "FLAT",
  rent: "",
  address: "",
  description: "",
  longitude: 81.3509, // Bhilai, Chhattisgarh default center
  latitude: 21.2121,
  amenities: ["WiFi", "Water Supply", "Power Backup"],
  images: [],
};

const POPULAR_AMENITIES = [
  "WiFi",
  "Air Conditioning",
  "Furnished",
  "Attached Washroom",
  "Power Backup",
  "CCTV",
  "Parking",
  "Geyser",
  "Washing Machine",
  "Meals / Food",
  "Refrigerator",
  "RO Drinking Water",
  "Balcony",
  "Elevator",
  "Security Guard",
  "Gym",
];

const SAMPLE_PHOTOS = [
  {
    name: "Cozy Studio",
    url: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Modern Flat",
    url: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Furnished Room",
    url: "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Spacious Living",
    url: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80",
  },
];

const STEPS = [
  { id: 1, title: "Basic Info", icon: "📝" },
  { id: 2, title: "Location", icon: "📍" },
  { id: 3, title: "Photos & Amenities", icon: "✨" },
  { id: 4, title: "Review & Publish", icon: "🚀" },
];

export default function ListPropertyPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<ListingFormData>(INITIAL_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [customAmenity, setCustomAmenity] = useState("");
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSwitchingRole, setIsSwitchingRole] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [createdListingId, setCreatedListingId] = useState<string | null>(null);

  // 1. Loading state
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] flex flex-col">
        <NavBar />
        <div className="flex-1 flex flex-col items-center justify-center gap-3 pt-16">
          <div className="w-9 h-9 border-3 border-[#27272A] border-t-[#8B5CF6] rounded-full animate-spin" />
          <p className="text-sm text-[#A1A1AA]">Verifying your account permissions...</p>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated state
  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] flex flex-col">
        <NavBar />
        <div className="flex-1 flex items-center justify-center p-4 pt-20">
          <div className="max-w-md w-full bg-[#18181B] border border-[#27272A] rounded-2xl p-8 text-center shadow-2xl space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-[#8B5CF6]/15 text-[#8B5CF6] flex items-center justify-center text-3xl mx-auto border border-[#8B5CF6]/20">
              🔑
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#FAFAFA]">Sign In Required</h2>
              <p className="text-sm text-[#A1A1AA] mt-2">
                You need to sign in as a Lender or Broker to list properties on rents.app.
              </p>
            </div>
            <div className="pt-2 flex flex-col gap-2.5">
              <Link
                href="/login?callbackUrl=/list-property"
                className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-white bg-[#8B5CF6] hover:bg-[#7C3AED] transition-colors shadow-lg shadow-[#8B5CF6]/20 block"
              >
                Sign In to Continue
              </Link>
              <Link
                href="/signup?role=lender&callbackUrl=/list-property"
                className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold text-[#FAFAFA] bg-[#27272A] hover:bg-[#3F3F46] border border-[#3F3F46] transition-colors block"
              >
                Create Lender Account
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. Authenticated as Renter (USER) - Restricted Screen with 1-click Role Switch
  const userRole = session?.user?.role || "USER";
  if (userRole === "USER") {
    const handleSwitchToLender = async () => {
      setIsSwitchingRole(true);
      try {
        const res = await fetch("/api/user/switch-role", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targetRole: "OWNER" }),
        });

        if (res.ok) {
          await update({ role: "OWNER" });
          router.refresh();
        } else {
          const data = await res.json();
          alert(data.error || "Failed to switch role. Please try via Profile settings.");
        }
      } catch (err) {
        console.error("Role switch error:", err);
      } finally {
        setIsSwitchingRole(false);
      }
    };

    return (
      <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] flex flex-col">
        <NavBar />
        <div className="flex-1 flex items-center justify-center p-4 pt-20">
          <div className="max-w-md w-full bg-[#18181B] border border-[#27272A] rounded-2xl p-8 text-center shadow-2xl space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-[#F59E0B]/15 text-[#F59E0B] flex items-center justify-center text-3xl mx-auto border border-[#F59E0B]/30">
              🛡️
            </div>
            <div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#27272A] text-[#A1A1AA] uppercase tracking-wider">
                Current Role: Renter
              </span>
              <h2 className="text-xl font-bold text-[#FAFAFA] mt-3">Lender Access Required</h2>
              <p className="text-sm text-[#A1A1AA] mt-2 leading-relaxed">
                Your account is currently set to <strong>Renter</strong>. Only <strong>Lenders</strong> and{" "}
                <strong>Brokers</strong> can publish rental listings on rents.app.
              </p>
            </div>

            <div className="bg-[#111827] border border-[#27272A] rounded-xl p-4 text-left text-xs text-[#A1A1AA] space-y-1.5">
              <p className="text-[#FAFAFA] font-medium">Switching to Lender unlocks:</p>
              <p>✓ Unlimited property listings with Mapbox location pins</p>
              <p>✓ Instant connection with prospective tenants</p>
              <p>✓ Profile management and listing dashboard</p>
            </div>

            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                onClick={handleSwitchToLender}
                disabled={isSwitchingRole}
                className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-white bg-[#8B5CF6] hover:bg-[#7C3AED] focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/50 shadow-lg shadow-[#8B5CF6]/20 transition-all cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {isSwitchingRole ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Switching to Lender...</span>
                  </>
                ) : (
                  <>
                    <span>Switch to Lender Account</span>
                    <span>→</span>
                  </>
                )}
              </button>

              <Link
                href="/search"
                className="w-full py-2.5 px-4 rounded-xl text-xs font-medium text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#27272A] transition-colors block text-center"
              >
                Back to Explore Rentals
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- Step Validation ---
  const validateStep = (step: number): boolean => {
    const errs: Record<string, string> = {};

    if (step === 1) {
      if (!formData.title.trim() || formData.title.trim().length < 3) {
        errs.title = "Title must be at least 3 characters";
      }
      if (!formData.rent || Number(formData.rent) <= 0) {
        errs.rent = "Please enter a valid monthly rent amount";
      }
      if (!formData.address.trim() || formData.address.trim().length < 5) {
        errs.address = "Please provide a complete address (at least 5 characters)";
      }
      if (!formData.description.trim() || formData.description.trim().length < 10) {
        errs.description = "Please describe the property (at least 10 characters)";
      }
    }

    if (step === 2) {
      if (!formData.longitude || !formData.latitude) {
        errs.location = "Please set a valid location pin on the map";
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // --- Amenities Handler ---
  const toggleAmenity = (item: string) => {
    setFormData((prev) => {
      const exists = prev.amenities.includes(item);
      return {
        ...prev,
        amenities: exists ? prev.amenities.filter((a) => a !== item) : [...prev.amenities, item],
      };
    });
  };

  const addCustomAmenity = () => {
    const trimmed = customAmenity.trim();
    if (!trimmed) return;
    if (!formData.amenities.includes(trimmed)) {
      setFormData((prev) => ({ ...prev, amenities: [...prev.amenities, trimmed] }));
    }
    setCustomAmenity("");
  };

  // --- Photo Upload Handler ---
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setErrors((prev) => ({ ...prev, images: "" }));

    const uploadFormData = new FormData();
    Array.from(files).forEach((file) => {
      uploadFormData.append("files", file);
    });

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: uploadFormData,
      });

      const data = await res.json();
      if (res.ok && data.urls) {
        setFormData((prev) => ({
          ...prev,
          images: [...prev.images, ...data.urls].slice(0, 10),
        }));
      } else {
        setErrors((prev) => ({ ...prev, images: data.error || "Failed to upload file(s)" }));
      }
    } catch {
      setErrors((prev) => ({ ...prev, images: "Network error during upload" }));
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  // Add Image URL
  const handleAddImageUrl = () => {
    const url = imageUrlInput.trim();
    if (!url) return;
    if (!url.startsWith("http://") && !url.startsWith("https://") && !url.startsWith("/")) {
      setErrors((prev) => ({ ...prev, images: "Image URL must start with http://, https://, or /" }));
      return;
    }
    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, url].slice(0, 10),
    }));
    setImageUrlInput("");
    setErrors((prev) => ({ ...prev, images: "" }));
  };

  const removeImage = (indexToRemove: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== indexToRemove),
    }));
  };

  const setCoverImage = (indexToCover: number) => {
    setFormData((prev) => {
      const imageToPromote = prev.images[indexToCover];
      const rest = prev.images.filter((_, i) => i !== indexToCover);
      return {
        ...prev,
        images: [imageToPromote, ...rest],
      };
    });
  };

  // --- Form Submission ---
  const handlePublish = async () => {
    if (!validateStep(1) || !validateStep(2)) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        rent: Number(formData.rent),
        propertyType: formData.propertyType,
        address: formData.address.trim(),
        longitude: formData.longitude,
        latitude: formData.latitude,
        amenities: formData.amenities,
        images: formData.images,
      };

      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrors({ submit: data.error || "Failed to create listing. Please try again." });
        setIsSubmitting(false);
        return;
      }

      setSubmitSuccess(true);
      setCreatedListingId(data.id);
    } catch {
      setErrors({ submit: "An unexpected error occurred while creating listing." });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] flex flex-col">
      <NavBar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        {/* Header Title */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs text-[#8B5CF6] font-semibold uppercase tracking-wider mb-1">
            <span>🏠</span>
            <span>Lender Dashboard</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#FAFAFA]">
            List Your Rental Property
          </h1>
          <p className="text-sm text-[#A1A1AA] mt-1">
            Publish your PG, flat, or shared room to thousands of verified renters on rents.app.
          </p>
        </div>

        {/* Success Modal / Banner */}
        {submitSuccess ? (
          <div className="bg-[#18181B] border border-[#22C55E]/40 rounded-2xl p-8 sm:p-10 shadow-2xl text-center space-y-6 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-[#22C55E]/15 text-[#22C55E] flex items-center justify-center text-3xl mx-auto border border-[#22C55E]/30">
              ✓
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#FAFAFA]">Listing Published Successfully!</h2>
              <p className="text-sm text-[#A1A1AA] mt-2 max-w-md mx-auto">
                Your property is now live on the interactive map and search catalog for renters to discover.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link
                href="/profile?tab=listings"
                className="w-full sm:w-auto py-2.5 px-6 rounded-xl text-sm font-semibold text-white bg-[#8B5CF6] hover:bg-[#7C3AED] transition-colors shadow-lg shadow-[#8B5CF6]/20"
              >
                View in My Listings
              </Link>
              <Link
                href={`/search?selected=${createdListingId}`}
                className="w-full sm:w-auto py-2.5 px-6 rounded-xl text-sm font-semibold text-[#FAFAFA] bg-[#27272A] hover:bg-[#3F3F46] border border-[#3F3F46] transition-colors"
              >
                View on Map
              </Link>
              <button
                type="button"
                onClick={() => {
                  setFormData(INITIAL_FORM);
                  setCurrentStep(1);
                  setSubmitSuccess(false);
                }}
                className="w-full sm:w-auto py-2.5 px-6 rounded-xl text-sm font-medium text-[#A1A1AA] hover:text-[#FAFAFA] transition-colors"
              >
                + List Another Property
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Multi-step Progress Bar */}
            <div className="bg-[#18181B] border border-[#27272A] rounded-2xl p-4 sm:p-5 shadow-lg">
              <div className="grid grid-cols-4 gap-2 sm:gap-4">
                {STEPS.map((step) => {
                  const isActive = currentStep === step.id;
                  const isDone = currentStep > step.id;

                  return (
                    <button
                      key={step.id}
                      type="button"
                      onClick={() => {
                        if (step.id < currentStep) {
                          setCurrentStep(step.id);
                        } else if (step.id > currentStep) {
                          if (validateStep(currentStep)) setCurrentStep(step.id);
                        }
                      }}
                      className="flex flex-col sm:flex-row items-center sm:items-start gap-2 text-center sm:text-left transition-all cursor-pointer group"
                    >
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 transition-all ${
                          isActive
                            ? "bg-[#8B5CF6] text-white ring-4 ring-[#8B5CF6]/20 shadow-md shadow-[#8B5CF6]/30"
                            : isDone
                            ? "bg-[#22C55E] text-white"
                            : "bg-[#27272A] text-[#71717A] group-hover:bg-[#3F3F46] group-hover:text-[#FAFAFA]"
                        }`}
                      >
                        {isDone ? "✓" : step.id}
                      </div>
                      <div className="hidden sm:block">
                        <span
                          className={`text-xs font-bold block leading-tight ${
                            isActive ? "text-[#FAFAFA]" : isDone ? "text-[#A1A1AA]" : "text-[#71717A]"
                          }`}
                        >
                          {step.title}
                        </span>
                        <span className="text-[10px] text-[#71717A]">Step {step.id}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Form Step Body */}
            <div className="bg-[#18181B] border border-[#27272A] rounded-2xl p-6 sm:p-8 shadow-xl">
              {/* STEP 1: BASIC INFORMATION */}
              {currentStep === 1 && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="border-b border-[#27272A] pb-4">
                    <h2 className="text-lg font-bold text-[#FAFAFA] flex items-center gap-2">
                      <span>📝</span>
                      <span>Basic Property Information</span>
                    </h2>
                    <p className="text-xs text-[#A1A1AA] mt-1">
                      Provide essential details about your rental property to attract suitable tenants.
                    </p>
                  </div>

                  {/* Title */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#A1A1AA] mb-1.5">
                      Property Title <span className="text-[#EF4444]">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g. Spacious 2BHK Flat near Nehru Nagar Square"
                      className={`w-full px-3.5 py-2.5 rounded-xl bg-[#09090B] border text-sm text-[#FAFAFA] placeholder-[#71717A] focus:outline-none focus:ring-2 transition-all ${
                        errors.title
                          ? "border-[#EF4444] focus:ring-[#EF4444]"
                          : "border-[#27272A] focus:border-[#8B5CF6] focus:ring-[#8B5CF6]/30"
                      }`}
                    />
                    {errors.title && <p className="mt-1.5 text-xs text-[#EF4444]">{errors.title}</p>}
                  </div>

                  {/* Property Type Radio Cards */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#A1A1AA] mb-2.5">
                      Property Type <span className="text-[#EF4444]">*</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        { id: "FLAT", title: "Flat / Apartment", desc: "Independent 1BHK, 2BHK, 3BHK, or studio flat", icon: "🏢" },
                        { id: "PG", title: "PG / Hostel", desc: "Paying guest accommodation with food and amenities", icon: "🛏️" },
                        { id: "SHARED", title: "Shared Room", desc: "Single bed or shared room with roommates", icon: "👥" },
                      ].map((item) => {
                        const isSelected = formData.propertyType === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setFormData((prev) => ({ ...prev, propertyType: item.id as PropertyType }))}
                            className={`p-4 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
                              isSelected
                                ? "border-[#8B5CF6] bg-[#8B5CF6]/10 ring-2 ring-[#8B5CF6]/40 text-[#FAFAFA]"
                                : "border-[#27272A] bg-[#111827]/40 hover:bg-[#111827] hover:border-[#3F3F46] text-[#A1A1AA]"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-2xl">{item.icon}</span>
                              {isSelected && (
                                <span className="w-5 h-5 rounded-full bg-[#8B5CF6] text-white flex items-center justify-center text-xs">
                                  ✓
                                </span>
                              )}
                            </div>
                            <div>
                              <h4 className="font-bold text-sm text-[#FAFAFA]">{item.title}</h4>
                              <p className="text-xs text-[#A1A1AA] mt-1">{item.desc}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Monthly Rent */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#A1A1AA] mb-1.5">
                      Monthly Rent (₹ INR) <span className="text-[#EF4444]">*</span>
                    </label>
                    <div className="relative max-w-sm">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#8B5CF6]">
                        ₹
                      </span>
                      <input
                        type="number"
                        min="1"
                        value={formData.rent}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            rent: e.target.value === "" ? "" : Number(e.target.value),
                          }))
                        }
                        placeholder="12000"
                        className={`w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-[#09090B] border text-sm text-[#FAFAFA] placeholder-[#71717A] focus:outline-none focus:ring-2 transition-all ${
                          errors.rent
                            ? "border-[#EF4444] focus:ring-[#EF4444]"
                            : "border-[#27272A] focus:border-[#8B5CF6] focus:ring-[#8B5CF6]/30"
                        }`}
                      />
                    </div>
                    {errors.rent && <p className="mt-1.5 text-xs text-[#EF4444]">{errors.rent}</p>}
                    {formData.rent && typeof formData.rent === "number" && (
                      <p className="mt-1 text-xs text-[#A1A1AA]">
                        Preview: <strong className="text-[#8B5CF6]">₹{formData.rent.toLocaleString("en-IN")}</strong> / month
                      </p>
                    )}
                  </div>

                  {/* Complete Address */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#A1A1AA] mb-1.5">
                      Property Address <span className="text-[#EF4444]">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                      placeholder="e.g. Flat 302, Green Valley Apartments, Junwani Road, Bhilai, Chhattisgarh"
                      className={`w-full px-3.5 py-2.5 rounded-xl bg-[#09090B] border text-sm text-[#FAFAFA] placeholder-[#71717A] focus:outline-none focus:ring-2 transition-all ${
                        errors.address
                          ? "border-[#EF4444] focus:ring-[#EF4444]"
                          : "border-[#27272A] focus:border-[#8B5CF6] focus:ring-[#8B5CF6]/30"
                      }`}
                    />
                    {errors.address && <p className="mt-1.5 text-xs text-[#EF4444]">{errors.address}</p>}
                  </div>

                  {/* Description */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[#A1A1AA]">
                        Description <span className="text-[#EF4444]">*</span>
                      </label>
                      <span className="text-xs text-[#71717A]">{formData.description.length} / 2000 chars</span>
                    </div>
                    <textarea
                      rows={4}
                      value={formData.description}
                      onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe the rooms, nearby landmarks, rules, furnishing, availability date, etc."
                      className={`w-full px-3.5 py-2.5 rounded-xl bg-[#09090B] border text-sm text-[#FAFAFA] placeholder-[#71717A] focus:outline-none focus:ring-2 transition-all leading-relaxed ${
                        errors.description
                          ? "border-[#EF4444] focus:ring-[#EF4444]"
                          : "border-[#27272A] focus:border-[#8B5CF6] focus:ring-[#8B5CF6]/30"
                      }`}
                    />
                    {errors.description && <p className="mt-1.5 text-xs text-[#EF4444]">{errors.description}</p>}
                  </div>
                </div>
              )}

              {/* STEP 2: PROPERTY LOCATION */}
              {currentStep === 2 && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="border-b border-[#27272A] pb-4">
                    <h2 className="text-lg font-bold text-[#FAFAFA] flex items-center gap-2">
                      <span>📍</span>
                      <span>Pin Exact Map Location</span>
                    </h2>
                    <p className="text-xs text-[#A1A1AA] mt-1">
                      Pinpoint your property accurately so tenants can find it on the map and calculate distances.
                    </p>
                  </div>

                  <LocationPicker
                    longitude={formData.longitude}
                    latitude={formData.latitude}
                    address={formData.address}
                    onChange={({ longitude, latitude, address }) => {
                      setFormData((prev) => ({
                        ...prev,
                        longitude,
                        latitude,
                        ...(address ? { address } : {}),
                      }));
                    }}
                  />

                  {errors.location && <p className="text-xs text-[#EF4444]">{errors.location}</p>}
                </div>
              )}

              {/* STEP 3: PHOTOS & AMENITIES */}
              {currentStep === 3 && (
                <div className="space-y-8 animate-in fade-in duration-200">
                  <div className="border-b border-[#27272A] pb-4">
                    <h2 className="text-lg font-bold text-[#FAFAFA] flex items-center gap-2">
                      <span>✨</span>
                      <span>Photos & Amenities</span>
                    </h2>
                    <p className="text-xs text-[#A1A1AA] mt-1">
                      Upload high-quality photos and select amenities to make your listing stand out.
                    </p>
                  </div>

                  {/* Photo Upload Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[#A1A1AA]">
                        Property Photos ({formData.images.length}/10)
                      </label>
                      <span className="text-xs text-[#71717A]">First photo will be the main cover</span>
                    </div>

                    {/* Drag & Drop File Upload */}
                    <div className="relative border-2 border-dashed border-[#27272A] hover:border-[#8B5CF6]/60 rounded-2xl p-6 text-center bg-[#09090B] transition-colors group">
                      <input
                        type="file"
                        multiple
                        accept="image/jpeg,image/png,image/webp,image/avif"
                        onChange={handleFileUpload}
                        disabled={isUploading || formData.images.length >= 10}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                      />
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="w-12 h-12 rounded-xl bg-[#8B5CF6]/15 text-[#8B5CF6] flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                          📸
                        </div>
                        <div className="text-xs">
                          {isUploading ? (
                            <span className="text-[#8B5CF6] font-semibold flex items-center gap-2">
                              <span className="w-3.5 h-3.5 border-2 border-[#8B5CF6] border-t-transparent rounded-full animate-spin" />
                              Uploading photos...
                            </span>
                          ) : (
                            <>
                              <span className="font-semibold text-[#FAFAFA]">Click to upload</span> or drag and drop
                              photos
                            </>
                          )}
                        </div>
                        <p className="text-[11px] text-[#71717A]">PNG, JPG, WEBP, or AVIF (up to 10MB each)</p>
                      </div>
                    </div>

                    {/* Add by Image URL & Sample Presets */}
                    <div className="flex flex-col sm:flex-row gap-2.5">
                      <div className="flex-1 flex gap-2">
                        <input
                          type="text"
                          value={imageUrlInput}
                          onChange={(e) => setImageUrlInput(e.target.value)}
                          placeholder="Or paste external image URL (https://...)"
                          className="flex-1 px-3.5 py-2 rounded-xl bg-[#09090B] border border-[#27272A] text-xs text-[#FAFAFA] placeholder-[#71717A] focus:outline-none focus:border-[#8B5CF6]"
                        />
                        <button
                          type="button"
                          onClick={handleAddImageUrl}
                          disabled={!imageUrlInput.trim() || formData.images.length >= 10}
                          className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#27272A] hover:bg-[#3F3F46] text-[#FAFAFA] transition-colors disabled:opacity-50"
                        >
                          Add URL
                        </button>
                      </div>

                      {/* Sample photos quick-add buttons */}
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                        <span className="text-[10px] uppercase font-semibold text-[#71717A] shrink-0">Sample:</span>
                        {SAMPLE_PHOTOS.map((sample) => (
                          <button
                            key={sample.name}
                            type="button"
                            onClick={() => {
                              if (!formData.images.includes(sample.url) && formData.images.length < 10) {
                                setFormData((prev) => ({ ...prev, images: [...prev.images, sample.url] }));
                              }
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-[#111827] hover:bg-[#27272A] border border-[#27272A] text-[11px] text-[#A1A1AA] hover:text-[#FAFAFA] shrink-0 transition-colors"
                          >
                            + {sample.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    {errors.images && <p className="text-xs text-[#EF4444]">{errors.images}</p>}

                    {/* Photo Thumbnails Strip */}
                    {formData.images.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                        {formData.images.map((img, idx) => (
                          <div
                            key={img + idx}
                            className="relative group rounded-xl overflow-hidden border border-[#27272A] bg-[#09090B] aspect-video"
                          >
                            <img src={img} alt={`Property photo ${idx + 1}`} className="w-full h-full object-cover" />
                            {/* Overlay Controls */}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              {idx !== 0 && (
                                <button
                                  type="button"
                                  onClick={() => setCoverImage(idx)}
                                  className="px-2 py-1 rounded bg-[#8B5CF6] text-white text-[10px] font-semibold hover:bg-[#7C3AED]"
                                >
                                  Make Cover
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => removeImage(idx)}
                                className="w-7 h-7 rounded-full bg-[#EF4444] text-white text-xs flex items-center justify-center hover:bg-[#DC2626]"
                                aria-label="Remove image"
                              >
                                ✕
                              </button>
                            </div>
                            {/* Cover Badge */}
                            {idx === 0 && (
                              <div className="absolute bottom-1.5 left-1.5 bg-[#8B5CF6] text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow">
                                Cover Photo
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Amenities Section */}
                  <div className="space-y-4 pt-4 border-t border-[#27272A]">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[#A1A1AA]">
                        Amenities & Facilities ({formData.amenities.length} selected)
                      </label>
                    </div>

                    {/* Popular Amenities Chips */}
                    <div className="flex flex-wrap gap-2">
                      {POPULAR_AMENITIES.map((amenity) => {
                        const isSelected = formData.amenities.includes(amenity);
                        return (
                          <button
                            key={amenity}
                            type="button"
                            onClick={() => toggleAmenity(amenity)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer flex items-center gap-1.5 ${
                              isSelected
                                ? "border-[#8B5CF6] bg-[#8B5CF6]/15 text-[#A78BFA] shadow-sm shadow-[#8B5CF6]/20"
                                : "border-[#27272A] bg-[#111827]/40 text-[#A1A1AA] hover:bg-[#111827] hover:border-[#3F3F46]"
                            }`}
                          >
                            <span>{isSelected ? "✓" : "+"}</span>
                            <span>{amenity}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Custom Amenity Input */}
                    <div className="flex gap-2 max-w-sm pt-2">
                      <input
                        type="text"
                        value={customAmenity}
                        onChange={(e) => setCustomAmenity(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addCustomAmenity();
                          }
                        }}
                        placeholder="Add custom amenity (e.g. Swimming Pool)"
                        className="flex-1 px-3.5 py-2 rounded-xl bg-[#09090B] border border-[#27272A] text-xs text-[#FAFAFA] placeholder-[#71717A] focus:outline-none focus:border-[#8B5CF6]"
                      />
                      <button
                        type="button"
                        onClick={addCustomAmenity}
                        disabled={!customAmenity.trim()}
                        className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#27272A] hover:bg-[#3F3F46] text-[#FAFAFA] transition-colors disabled:opacity-50"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: REVIEW & PUBLISH */}
              {currentStep === 4 && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="border-b border-[#27272A] pb-4">
                    <h2 className="text-lg font-bold text-[#FAFAFA] flex items-center gap-2">
                      <span>🚀</span>
                      <span>Review & Publish</span>
                    </h2>
                    <p className="text-xs text-[#A1A1AA] mt-1">
                      Check your property details before publishing live to renters.
                    </p>
                  </div>

                  {/* Summary Card */}
                  <div className="bg-[#111827] border border-[#27272A] rounded-2xl overflow-hidden shadow-lg">
                    {/* Cover Photo */}
                    {formData.images.length > 0 ? (
                      <div className="relative h-48 w-full bg-[#09090B]">
                        <img
                          src={formData.images[0]}
                          alt={formData.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-3 left-3 bg-[#8B5CF6] text-white text-xs font-bold px-2.5 py-1 rounded-lg shadow">
                          {formData.propertyType}
                        </div>
                        <div className="absolute bottom-3 right-3 bg-black/75 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full border border-white/10">
                          {formData.images.length} photos
                        </div>
                      </div>
                    ) : (
                      <div className="h-28 bg-[#18181B] flex items-center justify-center text-[#71717A] text-xs border-b border-[#27272A]">
                        No cover photo uploaded
                      </div>
                    )}

                    {/* Details in card */}
                    <div className="p-5 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <h3 className="text-lg font-bold text-[#FAFAFA]">{formData.title}</h3>
                        <div className="text-xl font-extrabold text-[#A78BFA]">
                          ₹{Number(formData.rent).toLocaleString("en-IN")}{" "}
                          <span className="text-xs font-normal text-[#A1A1AA]">/ month</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-[#A1A1AA]">
                        <span>📍</span>
                        <span>{formData.address}</span>
                      </div>

                      {/* Coordinates */}
                      <div className="text-[11px] text-[#71717A] font-mono bg-[#09090B] px-3 py-1.5 rounded-lg border border-[#27272A] inline-block">
                        GPS: {formData.latitude.toFixed(5)}, {formData.longitude.toFixed(5)}
                      </div>

                      {/* Description */}
                      <div>
                        <h4 className="text-xs font-semibold text-[#A1A1AA] uppercase tracking-wider mb-1">
                          Overview
                        </h4>
                        <p className="text-xs text-[#D4D4D8] leading-relaxed bg-[#09090B]/60 p-3 rounded-xl border border-[#27272A]/50">
                          {formData.description}
                        </p>
                      </div>

                      {/* Amenities */}
                      {formData.amenities.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold text-[#A1A1AA] uppercase tracking-wider mb-2">
                            Included Amenities
                          </h4>
                          <div className="flex flex-wrap gap-1.5">
                            {formData.amenities.map((item) => (
                              <span
                                key={item}
                                className="px-2 py-0.5 rounded-md bg-[#8B5CF6]/10 text-[#A78BFA] border border-[#8B5CF6]/20 text-[11px]"
                              >
                                {item}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {errors.submit && (
                    <div className="p-4 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#EF4444] text-xs">
                      {errors.submit}
                    </div>
                  )}
                </div>
              )}

              {/* Form Navigation Action Buttons */}
              <div className="mt-8 pt-6 border-t border-[#27272A] flex items-center justify-between gap-4">
                {currentStep > 1 ? (
                  <button
                    type="button"
                    onClick={handlePrevious}
                    disabled={isSubmitting}
                    className="py-2.5 px-5 rounded-xl text-xs font-semibold text-[#FAFAFA] bg-[#27272A] hover:bg-[#3F3F46] border border-[#3F3F46] transition-colors cursor-pointer disabled:opacity-50"
                  >
                    ← Previous Step
                  </button>
                ) : (
                  <div />
                )}

                {currentStep < 4 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="py-2.5 px-6 rounded-xl text-xs font-semibold text-white bg-[#8B5CF6] hover:bg-[#7C3AED] shadow-lg shadow-[#8B5CF6]/20 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Continue to {STEPS[currentStep].title}</span>
                    <span>→</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handlePublish}
                    disabled={isSubmitting}
                    className="py-3 px-8 rounded-xl text-sm font-semibold text-white bg-[#8B5CF6] hover:bg-[#7C3AED] shadow-lg shadow-[#8B5CF6]/20 transition-all cursor-pointer disabled:opacity-60 flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Publishing Listing...</span>
                      </>
                    ) : (
                      <>
                        <span>Publish Listing Now</span>
                        <span>🚀</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
