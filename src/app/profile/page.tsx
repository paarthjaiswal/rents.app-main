"use client";

import { useEffect, useState, Suspense } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import NavBar from "@/components/nav-bar/nav-bar";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: "USER" | "OWNER" | "BROKER";
  createdAt: string;
}

interface UserListing {
  id: string;
  title: string;
  description: string;
  rent: number;
  propertyType: "PG" | "FLAT" | "SHARED";
  address: string;
  amenities: string[];
  images: string[];
  createdAt: string;
  longitude: number;
  latitude: number;
}

type TabType = "profile" | "role" | "security" | "listings";

function ProfileContent() {
  const { status, update } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as TabType) || "profile";

  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [listingCount, setListingCount] = useState<number>(0);
  const [listings, setListings] = useState<UserListing[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingListings, setLoadingListings] = useState(false);

  // Edit Profile Form State
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Change Password Form State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [savingPassword, setSavingPassword] = useState(false);

  // Role Switch State & Confirmation Modals
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [roleSwitchTarget, setRoleSwitchTarget] = useState<"USER" | "OWNER" | null>(null);
  const [roleError, setRoleError] = useState<string | null>(null);
  const [switchingRole, setSwitchingRole] = useState(false);

  // Listing Delete State
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Fetch Profile Data
  const loadProfile = async () => {
    try {
      const res = await fetch("/api/user/profile");
      if (res.ok) {
        const data = await res.json();
        setProfile(data.user);
        setListingCount(data.listingCount || 0);
        setName(data.user.name);
        setPhone(data.user.phone || "");
      }
    } catch (err) {
      console.error("Load profile error:", err);
    } finally {
      setLoadingProfile(false);
    }
  };

  // Fetch Listings Data
  const loadListings = async () => {
    setLoadingListings(true);
    try {
      const res = await fetch("/api/listings/mine");
      if (res.ok) {
        const data = await res.json();
        setListings(data.listings || []);
      }
    } catch (err) {
      console.error("Load listings error:", err);
    } finally {
      setLoadingListings(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      loadProfile();
    }
  }, [status]);

  useEffect(() => {
    if (status === "authenticated" && (activeTab === "listings" || activeTab === "role")) {
      loadListings();
    }
  }, [status, activeTab]);

  // Auth gate
  if (status === "loading" || (status === "authenticated" && loadingProfile)) {
    return (
      <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] flex flex-col">
        <NavBar />
        <div className="flex-1 flex flex-col items-center justify-center gap-3 pt-16">
          <div className="w-8 h-8 border-3 border-[#27272A] border-t-[#8B5CF6] rounded-full animate-spin" />
          <p className="text-xs text-[#A1A1AA]">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] flex flex-col">
        <NavBar />
        <div className="flex-1 flex items-center justify-center p-4 pt-20">
          <div className="max-w-md w-full bg-[#18181B] border border-[#27272A] rounded-2xl p-8 text-center shadow-2xl space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-[#8B5CF6]/15 text-[#8B5CF6] flex items-center justify-center text-3xl mx-auto border border-[#8B5CF6]/20">
              👤
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#FAFAFA]">Sign In to View Profile</h2>
              <p className="text-sm text-[#A1A1AA] mt-2">
                Manage your account settings, property listings, and role preferences.
              </p>
            </div>
            <Link
              href="/login?callbackUrl=/profile"
              className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-white bg-[#8B5CF6] hover:bg-[#7C3AED] transition-colors shadow-lg shadow-[#8B5CF6]/20 block"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // --- Handlers ---
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMessage(null);

    if (!name.trim()) {
      setProfileMessage({ type: "error", text: "Name cannot be empty" });
      return;
    }

    setSavingProfile(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim() || null }),
      });

      const data = await res.json();
      if (res.ok) {
        setProfile(data.user);
        await update({ name: data.user.name });
        setProfileMessage({ type: "success", text: "Profile details updated successfully!" });
      } else {
        setProfileMessage({ type: "error", text: data.error || "Failed to update profile." });
      }
    } catch {
      setProfileMessage({ type: "error", text: "Network error occurred." });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!currentPassword) {
      setPasswordError("Please enter your current password");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters long");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    setSavingPassword(true);
    try {
      const res = await fetch("/api/user/change-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (res.ok) {
        setPasswordSuccess("Password updated successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setPasswordError(data.error || "Failed to update password.");
      }
    } catch {
      setPasswordError("Network error occurred.");
    } finally {
      setSavingPassword(false);
    }
  };

  const handleOpenRoleModal = (target: "USER" | "OWNER") => {
    setRoleError(null);
    setRoleSwitchTarget(target);

    // If switching from OWNER to USER and active listings exist, immediately display error
    if (profile?.role === "OWNER" && target === "USER" && listingCount > 0) {
      setRoleError(
        `You currently have ${listingCount} active property ${
          listingCount === 1 ? "listing" : "listings"
        }. Please delete or unlist your properties before switching to a Renter account.`
      );
    }

    setRoleModalOpen(true);
  };

  const handleConfirmRoleSwitch = async () => {
    if (!roleSwitchTarget) return;

    setSwitchingRole(true);
    setRoleError(null);

    try {
      const res = await fetch("/api/user/switch-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetRole: roleSwitchTarget }),
      });

      const data = await res.json();
      if (res.ok) {
        await update({ role: roleSwitchTarget });
        setProfile((prev) => (prev ? { ...prev, role: roleSwitchTarget } : null));
        setRoleModalOpen(false);
        router.refresh();
      } else {
        setRoleError(data.error || "Failed to switch role.");
      }
    } catch {
      setRoleError("Network error occurred.");
    } finally {
      setSwitchingRole(false);
    }
  };

  const handleDeleteListing = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this listing?")) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/listings/${id}`, { method: "DELETE" });
      if (res.ok) {
        setListings((prev) => prev.filter((l) => l.id !== id));
        setListingCount((prev) => Math.max(0, prev - 1));
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete listing.");
      }
    } catch {
      alert("Network error while deleting listing.");
    } finally {
      setDeletingId(null);
    }
  };

  const isLenderOrBroker = profile?.role === "OWNER" || profile?.role === "BROKER";

  return (
    <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] flex flex-col">
      <NavBar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        {/* User Hero Banner */}
        <div className="bg-[#18181B] border border-[#27272A] rounded-2xl p-6 sm:p-8 mb-8 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#8B5CF6] to-[#7C3AED] text-white flex items-center justify-center text-2xl font-bold shadow-lg shadow-[#8B5CF6]/25">
              {profile?.name ? profile.name.charAt(0).toUpperCase() : "U"}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-extrabold text-[#FAFAFA]">{profile?.name}</h1>
                <span
                  className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                    profile?.role === "OWNER"
                      ? "bg-[#8B5CF6]/15 text-[#A78BFA] border-[#8B5CF6]/30"
                      : profile?.role === "BROKER"
                      ? "bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/30"
                      : "bg-[#27272A] text-[#A1A1AA] border-[#3F3F46]"
                  }`}
                >
                  {profile?.role === "OWNER" ? "Lender" : profile?.role === "BROKER" ? "Broker" : "Renter"}
                </span>
              </div>
              <p className="text-xs text-[#A1A1AA] mt-1">{profile?.email}</p>
              <p className="text-[11px] text-[#71717A] mt-0.5">
                Member since {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" }) : "—"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {isLenderOrBroker && (
              <Link
                href="/list-property"
                className="flex-1 sm:flex-none py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-[#8B5CF6] hover:bg-[#7C3AED] transition-colors shadow-lg shadow-[#8B5CF6]/20 flex items-center justify-center gap-1.5"
              >
                <span>+ List Property</span>
              </Link>
            )}
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="py-2.5 px-4 rounded-xl text-xs font-semibold text-[#EF4444] bg-[#EF4444]/10 hover:bg-[#EF4444]/20 border border-[#EF4444]/25 transition-colors cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Dashboard Tabs & Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Sidebar Tabs */}
          <div className="md:col-span-1 space-y-1.5">
            {[
              { id: "profile", label: "Personal Information", icon: "👤" },
              { id: "role", label: "Account Type & Role", icon: "🛡️" },
              { id: "security", label: "Security & Password", icon: "🔒" },
              {
                id: "listings",
                label: `My Listings ${listingCount > 0 ? `(${listingCount})` : ""}`,
                icon: "🏠",
              },
            ].map((tab) => {
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`w-full text-left px-3.5 py-3 rounded-xl text-xs font-semibold transition-all flex items-center gap-2.5 cursor-pointer ${
                    isSelected
                      ? "bg-[#8B5CF6] text-white shadow-md shadow-[#8B5CF6]/25"
                      : "text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#18181B] border border-transparent"
                  }`}
                >
                  <span className="text-base">{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Main Content Area */}
          <div className="md:col-span-3">
            {/* TAB 1: PERSONAL INFORMATION */}
            {activeTab === "profile" && (
              <div className="bg-[#18181B] border border-[#27272A] rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
                <div className="border-b border-[#27272A] pb-4">
                  <h2 className="text-lg font-bold text-[#FAFAFA]">Personal Information</h2>
                  <p className="text-xs text-[#A1A1AA] mt-1">
                    Manage your public profile details and contact information.
                  </p>
                </div>

                {profileMessage && (
                  <div
                    className={`p-4 rounded-xl text-xs border flex items-center gap-2.5 ${
                      profileMessage.type === "success"
                        ? "bg-[#22C55E]/10 border-[#22C55E]/30 text-[#22C55E]"
                        : "bg-[#EF4444]/10 border-[#EF4444]/30 text-[#EF4444]"
                    }`}
                  >
                    <span>{profileMessage.type === "success" ? "✓" : "⚠️"}</span>
                    <span>{profileMessage.text}</span>
                  </div>
                )}

                <form onSubmit={handleSaveProfile} className="space-y-5">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#A1A1AA] mb-1.5">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#09090B] border border-[#27272A] text-sm text-[#FAFAFA] focus:outline-none focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/30 transition-all"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[#A1A1AA]">
                        Email Address
                      </label>
                      <span className="text-[10px] text-[#22C55E] bg-[#22C55E]/10 px-2 py-0.5 rounded-full border border-[#22C55E]/20">
                        Verified
                      </span>
                    </div>
                    <input
                      type="email"
                      disabled
                      value={profile?.email || ""}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#09090B]/50 border border-[#27272A] text-sm text-[#71717A] cursor-not-allowed select-none"
                    />
                    <p className="mt-1 text-[11px] text-[#71717A]">Email cannot be changed.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#A1A1AA] mb-1.5">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#09090B] border border-[#27272A] text-sm text-[#FAFAFA] placeholder-[#71717A] focus:outline-none focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/30 transition-all"
                    />
                    <p className="mt-1 text-[11px] text-[#71717A]">
                      Shown to interested tenants on your property listing cards.
                    </p>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={savingProfile}
                      className="py-2.5 px-6 rounded-xl text-xs font-semibold text-white bg-[#8B5CF6] hover:bg-[#7C3AED] transition-colors shadow-lg shadow-[#8B5CF6]/20 disabled:opacity-60 cursor-pointer"
                    >
                      {savingProfile ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB 2: ROLE MANAGEMENT & ACCOUNT SWITCHING */}
            {activeTab === "role" && (
              <div className="bg-[#18181B] border border-[#27272A] rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
                <div className="border-b border-[#27272A] pb-4">
                  <h2 className="text-lg font-bold text-[#FAFAFA]">Account Type & Role</h2>
                  <p className="text-xs text-[#A1A1AA] mt-1">
                    Control how you interact with rents.app as a Renter or Property Lender.
                  </p>
                </div>

                {/* Current Role Card */}
                <div className="p-5 rounded-2xl bg-[#111827] border border-[#27272A] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[#FAFAFA]">Current Role:</span>
                      <span className="text-xs font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-[#8B5CF6]/20 text-[#A78BFA] border border-[#8B5CF6]/30">
                        {profile?.role === "OWNER" ? "Lender" : profile?.role === "BROKER" ? "Broker" : "Renter"}
                      </span>
                    </div>
                    <p className="text-xs text-[#A1A1AA]">
                      {profile?.role === "OWNER"
                        ? "You have full access to create, publish, and manage rental listings."
                        : profile?.role === "BROKER"
                        ? "You are a verified real estate broker managing commercial/residential inventory."
                        : "You can browse listings, view contact numbers, and search rentals across the map."}
                    </p>
                  </div>

                  {/* Switch Role CTA */}
                  {profile?.role === "USER" && (
                    <button
                      type="button"
                      onClick={() => handleOpenRoleModal("OWNER")}
                      className="py-2.5 px-5 rounded-xl text-xs font-semibold text-white bg-[#8B5CF6] hover:bg-[#7C3AED] transition-colors shadow-md shadow-[#8B5CF6]/25 shrink-0 cursor-pointer"
                    >
                      Switch to Lender Account →
                    </button>
                  )}

                  {profile?.role === "OWNER" && (
                    <button
                      type="button"
                      onClick={() => handleOpenRoleModal("USER")}
                      className="py-2.5 px-5 rounded-xl text-xs font-semibold text-[#FAFAFA] bg-[#27272A] hover:bg-[#3F3F46] border border-[#3F3F46] transition-colors shrink-0 cursor-pointer"
                    >
                      Switch to Renter Account
                    </button>
                  )}
                </div>

                {/* Role Comparison Table */}
                <div className="pt-2">
                  <h3 className="text-xs font-semibold text-[#A1A1AA] uppercase tracking-wider mb-3">
                    Role Capabilities Breakdown
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div
                      className={`p-4 rounded-xl border ${
                        profile?.role === "USER" ? "border-[#8B5CF6]/50 bg-[#8B5CF6]/5" : "border-[#27272A] bg-[#09090B]"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-sm text-[#FAFAFA]">🔍 Renter Account</h4>
                        {profile?.role === "USER" && (
                          <span className="text-[10px] bg-[#8B5CF6] text-white px-2 py-0.5 rounded-full font-bold">
                            Active
                          </span>
                        )}
                      </div>
                      <ul className="text-xs text-[#A1A1AA] space-y-1.5">
                        <li>✓ Search worldwide & nationwide locations</li>
                        <li>✓ Filter by rent range, PG, flat, or shared</li>
                        <li>✓ View photos and contact details</li>
                        <li>✕ Cannot publish property listings</li>
                      </ul>
                    </div>

                    <div
                      className={`p-4 rounded-xl border ${
                        profile?.role === "OWNER" ? "border-[#8B5CF6]/50 bg-[#8B5CF6]/5" : "border-[#27272A] bg-[#09090B]"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-sm text-[#FAFAFA]">🏠 Lender Account</h4>
                        {profile?.role === "OWNER" && (
                          <span className="text-[10px] bg-[#8B5CF6] text-white px-2 py-0.5 rounded-full font-bold">
                            Active
                          </span>
                        )}
                      </div>
                      <ul className="text-xs text-[#A1A1AA] space-y-1.5">
                        <li>✓ Everything in Renter account</li>
                        <li>✓ Multi-step property listing form</li>
                        <li>✓ Interactive Mapbox location pin</li>
                        <li>✓ Photo uploads & amenity tagging</li>
                        <li>✓ My Listings management dashboard</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: ACCOUNT SECURITY & PASSWORD */}
            {activeTab === "security" && (
              <div className="bg-[#18181B] border border-[#27272A] rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
                <div className="border-b border-[#27272A] pb-4">
                  <h2 className="text-lg font-bold text-[#FAFAFA]">Account Security</h2>
                  <p className="text-xs text-[#A1A1AA] mt-1">
                    Update your password to keep your account safe.
                  </p>
                </div>

                {passwordError && (
                  <div className="p-4 rounded-xl text-xs bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#EF4444] flex items-center gap-2">
                    <span>⚠️</span>
                    <span>{passwordError}</span>
                  </div>
                )}

                {passwordSuccess && (
                  <div className="p-4 rounded-xl text-xs bg-[#22C55E]/10 border border-[#22C55E]/30 text-[#22C55E] flex items-center gap-2">
                    <span>✓</span>
                    <span>{passwordSuccess}</span>
                  </div>
                )}

                <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#A1A1AA] mb-1.5">
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter your current password"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#09090B] border border-[#27272A] text-sm text-[#FAFAFA] placeholder-[#71717A] focus:outline-none focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/30 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#A1A1AA] mb-1.5">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#09090B] border border-[#27272A] text-sm text-[#FAFAFA] placeholder-[#71717A] focus:outline-none focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/30 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#A1A1AA] mb-1.5">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-type new password"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#09090B] border border-[#27272A] text-sm text-[#FAFAFA] placeholder-[#71717A] focus:outline-none focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/30 transition-all"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={savingPassword}
                      className="py-2.5 px-6 rounded-xl text-xs font-semibold text-white bg-[#8B5CF6] hover:bg-[#7C3AED] transition-colors shadow-lg shadow-[#8B5CF6]/20 disabled:opacity-60 cursor-pointer"
                    >
                      {savingPassword ? "Updating..." : "Update Password"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB 4: MY LISTINGS DASHBOARD */}
            {activeTab === "listings" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#18181B] border border-[#27272A] rounded-2xl p-6">
                  <div>
                    <h2 className="text-lg font-bold text-[#FAFAFA]">My Property Listings</h2>
                    <p className="text-xs text-[#A1A1AA] mt-1">
                      Manage all rental properties published under your account.
                    </p>
                  </div>
                  {isLenderOrBroker && (
                    <Link
                      href="/list-property"
                      className="py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-[#8B5CF6] hover:bg-[#7C3AED] transition-colors shadow-md shadow-[#8B5CF6]/25 shrink-0 flex items-center justify-center gap-1.5"
                    >
                      <span>+ Add New Listing</span>
                    </Link>
                  )}
                </div>

                {loadingListings ? (
                  <div className="bg-[#18181B] border border-[#27272A] rounded-2xl p-12 text-center">
                    <div className="w-7 h-7 border-3 border-[#27272A] border-t-[#8B5CF6] rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-xs text-[#A1A1AA]">Loading your listings...</p>
                  </div>
                ) : listings.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4">
                    {listings.map((item) => (
                      <div
                        key={item.id}
                        className="bg-[#18181B] border border-[#27272A] hover:border-[#3F3F46] rounded-2xl p-4 sm:p-5 transition-all shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5"
                      >
                        <div className="flex items-start sm:items-center gap-4">
                          {item.images?.[0] ? (
                            <img
                              src={item.images[0]}
                              alt={item.title}
                              className="w-24 h-20 rounded-xl object-cover shrink-0 bg-[#09090B] border border-[#27272A]"
                            />
                          ) : (
                            <div className="w-24 h-20 rounded-xl bg-[#111827] flex items-center justify-center text-xs text-[#71717A] border border-[#27272A] shrink-0">
                              No photo
                            </div>
                          )}

                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-sm text-[#FAFAFA]">{item.title}</h3>
                              <span className="text-[10px] font-semibold bg-[#8B5CF6]/15 text-[#A78BFA] px-2 py-0.5 rounded border border-[#8B5CF6]/25">
                                {item.propertyType}
                              </span>
                            </div>
                            <p className="text-xs text-[#A1A1AA] flex items-center gap-1">
                              <span>📍</span>
                              <span className="truncate max-w-xs">{item.address}</span>
                            </p>
                            <p className="text-xs font-bold text-[#A78BFA]">
                              ₹{item.rent.toLocaleString("en-IN")}{" "}
                              <span className="text-[11px] font-normal text-[#71717A]">/ month</span>
                            </p>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-[#27272A]">
                          <Link
                            href={`/search?selected=${item.id}`}
                            className="flex-1 sm:flex-none py-2 px-3.5 rounded-xl text-xs font-semibold bg-[#27272A] hover:bg-[#3F3F46] text-[#FAFAFA] border border-[#3F3F46] transition-colors text-center"
                          >
                            View on Map
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDeleteListing(item.id)}
                            disabled={deletingId === item.id}
                            className="flex-1 sm:flex-none py-2 px-3.5 rounded-xl text-xs font-semibold text-[#EF4444] bg-[#EF4444]/10 hover:bg-[#EF4444]/20 border border-[#EF4444]/25 transition-colors cursor-pointer disabled:opacity-50 text-center"
                          >
                            {deletingId === item.id ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-[#18181B] border border-[#27272A] rounded-2xl p-10 text-center space-y-4">
                    <div className="w-14 h-14 rounded-2xl bg-[#27272A] flex items-center justify-center text-2xl mx-auto">
                      🏠
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-[#FAFAFA]">No active listings found</h3>
                      <p className="text-xs text-[#A1A1AA] mt-1 max-w-sm mx-auto">
                        {isLenderOrBroker
                          ? "You haven't listed any properties yet. Create your first listing to connect with tenants!"
                          : "Switch your account to Lender to start publishing rental properties."}
                      </p>
                    </div>

                    {isLenderOrBroker ? (
                      <Link
                        href="/list-property"
                        className="inline-block py-2.5 px-6 rounded-xl text-xs font-semibold text-white bg-[#8B5CF6] hover:bg-[#7C3AED] transition-colors shadow-md shadow-[#8B5CF6]/25"
                      >
                        + Create Your First Listing
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setActiveTab("role")}
                        className="py-2.5 px-6 rounded-xl text-xs font-semibold text-white bg-[#8B5CF6] hover:bg-[#7C3AED] transition-colors shadow-md shadow-[#8B5CF6]/25 cursor-pointer"
                      >
                        Switch to Lender Account
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Role Switch Confirmation Modal */}
      {roleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-[#18181B] border border-[#27272A] rounded-2xl max-w-md w-full p-6 sm:p-7 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">🛡️</span>
                <h3 className="font-bold text-base text-[#FAFAFA]">Confirm Account Switch</h3>
              </div>
              <button
                type="button"
                onClick={() => setRoleModalOpen(false)}
                className="text-[#71717A] hover:text-[#FAFAFA] text-sm p-1"
              >
                ✕
              </button>
            </div>

            {roleError ? (
              <div className="p-4 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#EF4444] text-xs space-y-2">
                <p className="font-semibold">Cannot Switch Role</p>
                <p className="leading-relaxed">{roleError}</p>
              </div>
            ) : (
              <div className="text-xs text-[#A1A1AA] space-y-3 leading-relaxed">
                <p>
                  You are about to switch your account type from{" "}
                  <strong className="text-[#FAFAFA]">{profile?.role === "OWNER" ? "Lender" : "Renter"}</strong> to{" "}
                  <strong className="text-[#8B5CF6]">{roleSwitchTarget === "OWNER" ? "Lender" : "Renter"}</strong>.
                </p>
                {roleSwitchTarget === "OWNER" ? (
                  <p className="bg-[#111827] p-3 rounded-xl border border-[#27272A] text-[#FAFAFA]">
                    ✓ You will be able to create listings, set map pins, upload photos, and connect with tenants.
                  </p>
                ) : (
                  <p className="bg-[#111827] p-3 rounded-xl border border-[#27272A] text-[#FAFAFA]">
                    ℹ️ You will explore as a Renter. If you ever want to list properties again, you can switch back at any time.
                  </p>
                )}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRoleModalOpen(false)}
                disabled={switchingRole}
                className="py-2.5 px-4 rounded-xl text-xs font-semibold text-[#FAFAFA] bg-[#27272A] hover:bg-[#3F3F46] border border-[#3F3F46] transition-colors cursor-pointer"
              >
                Cancel
              </button>

              {!roleError && (
                <button
                  type="button"
                  onClick={handleConfirmRoleSwitch}
                  disabled={switchingRole}
                  className="py-2.5 px-5 rounded-xl text-xs font-semibold text-white bg-[#8B5CF6] hover:bg-[#7C3AED] shadow-md shadow-[#8B5CF6]/25 transition-colors cursor-pointer disabled:opacity-60 flex items-center gap-1.5"
                >
                  {switchingRole ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Switching...</span>
                    </>
                  ) : (
                    "Confirm Switch"
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] flex items-center justify-center">
          <div className="w-8 h-8 border-3 border-[#27272A] border-t-[#8B5CF6] rounded-full animate-spin" />
        </div>
      }
    >
      <ProfileContent />
    </Suspense>
  );
}
