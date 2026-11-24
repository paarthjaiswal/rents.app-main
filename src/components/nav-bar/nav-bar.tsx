"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import Logo from "../logo";

export const NavBar = () => {
  const { data: session, status } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const isAuthenticated = status === "authenticated" && !!session?.user;
  const user = session?.user;
  const isLenderOrBroker = user?.role === "OWNER" || user?.role === "BROKER";

  // List Your Property Destination:
  // - Lender/Broker -> /list-property
  // - Renter -> /list-property (shows role switch prompt) or /profile?tab=role
  // - Guest -> /login?callbackUrl=/list-property
  const listPropertyHref = !isAuthenticated
    ? "/login?callbackUrl=/list-property"
    : "/list-property";

  // Click outside to close user dropdown
  useEffect(() => {
    if (!userDropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [userDropdownOpen]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#09090B]/85 backdrop-blur-md border-b border-[#27272A] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group">
              <Logo height={40} width={40} />
              <span className="text-xl font-bold tracking-tight text-[#FAFAFA] group-hover:text-[#8B5CF6] transition-colors">
                rents<span className="text-[#8B5CF6]">.app</span>
              </span>
            </Link>
          </div>

          {/* Desktop Navigation Links & CTAs */}
          <nav className="hidden md:flex items-center gap-3">
            <Link
              href={listPropertyHref}
              className="text-xs font-semibold text-[#A1A1AA] hover:text-[#FAFAFA] border border-[#27272A] hover:border-[#3F3F46] bg-[#18181B] px-3.5 py-2 rounded-xl transition-all hover:bg-[#27272A] flex items-center gap-2"
            >
              <span>List Your Property</span>
              <span
                className={`text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded ${
                  isLenderOrBroker
                    ? "bg-[#8B5CF6]/20 text-[#8B5CF6]"
                    : "bg-[#27272A] text-[#A1A1AA]"
                }`}
              >
                {isLenderOrBroker ? "Lender" : "Host"}
              </span>
            </Link>

            <div className="h-5 w-px bg-[#27272A] mx-1" />

            {/* Authenticated User Menu or Guest Sign In */}
            {isAuthenticated ? (
              <div ref={dropdownRef} className="relative">
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2.5 p-1.5 pr-3 rounded-xl bg-[#18181B] border border-[#27272A] hover:border-[#3F3F46] text-[#FAFAFA] transition-colors cursor-pointer"
                  aria-expanded={userDropdownOpen}
                >
                  <div className="w-8 h-8 rounded-lg bg-[#8B5CF6] text-white flex items-center justify-center font-bold text-xs shadow-md shadow-[#8B5CF6]/20">
                    {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                  </div>
                  <div className="text-left text-xs leading-none">
                    <p className="font-semibold text-[#FAFAFA] truncate max-w-[110px]">{user?.name}</p>
                    <p className="text-[10px] text-[#A1A1AA] mt-0.5">
                      {user?.role === "OWNER" ? "Lender" : user?.role === "BROKER" ? "Broker" : "Renter"}
                    </p>
                  </div>
                  <svg
                    className={`w-3.5 h-3.5 text-[#71717A] transition-transform ${
                      userDropdownOpen ? "rotate-180" : ""
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#18181B] border border-[#27272A] shadow-2xl py-2 z-50 text-xs animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-4 py-2.5 border-b border-[#27272A]">
                      <p className="font-bold text-[#FAFAFA] truncate">{user?.name}</p>
                      <p className="text-[11px] text-[#71717A] truncate">{user?.email}</p>
                      <div className="mt-1.5">
                        <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#8B5CF6]/20 text-[#A78BFA] border border-[#8B5CF6]/30">
                          {user?.role === "OWNER" ? "Lender" : user?.role === "BROKER" ? "Broker" : "Renter"}
                        </span>
                      </div>
                    </div>

                    <div className="py-1">
                      <Link
                        href="/profile"
                        onClick={() => setUserDropdownOpen(false)}
                        className="w-full text-left px-4 py-2 text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#27272A] transition-colors flex items-center gap-2"
                      >
                        <span>👤</span>
                        <span>My Profile</span>
                      </Link>

                      <Link
                        href="/profile?tab=listings"
                        onClick={() => setUserDropdownOpen(false)}
                        className="w-full text-left px-4 py-2 text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#27272A] transition-colors flex items-center gap-2"
                      >
                        <span>🏠</span>
                        <span>My Listings</span>
                      </Link>

                      <Link
                        href="/list-property"
                        onClick={() => setUserDropdownOpen(false)}
                        className="w-full text-left px-4 py-2 text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#27272A] transition-colors flex items-center gap-2"
                      >
                        <span>✨</span>
                        <span>List Your Property</span>
                      </Link>

                      <Link
                        href="/profile?tab=role"
                        onClick={() => setUserDropdownOpen(false)}
                        className="w-full text-left px-4 py-2 text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#27272A] transition-colors flex items-center gap-2"
                      >
                        <span>🛡️</span>
                        <span>Switch Account Role</span>
                      </Link>
                    </div>

                    <div className="pt-1 border-t border-[#27272A]">
                      <button
                        type="button"
                        onClick={() => {
                          setUserDropdownOpen(false);
                          signOut({ callbackUrl: "/" });
                        }}
                        className="w-full text-left px-4 py-2 text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors flex items-center gap-2 cursor-pointer"
                      >
                        <span>🚪</span>
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/signup"
                className="text-xs font-semibold text-white bg-[#8B5CF6] hover:bg-[#7C3AED] px-4 py-2 rounded-xl shadow-lg shadow-[#8B5CF6]/20 hover:shadow-[#8B5CF6]/30 transition-all flex items-center gap-2 transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                <span>Sign Up / Log In</span>
              </Link>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            {!isAuthenticated ? (
              <Link
                href="/signup"
                className="text-xs font-semibold text-white bg-[#8B5CF6] px-3 py-1.5 rounded-lg shadow-sm"
              >
                Sign Up
              </Link>
            ) : (
              <Link
                href="/profile"
                className="w-8 h-8 rounded-lg bg-[#8B5CF6] text-white flex items-center justify-center font-bold text-xs"
              >
                {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
              </Link>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-[#18181B] border border-[#27272A] text-[#A1A1AA] hover:text-white focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-[#27272A] bg-[#09090B] space-y-2 px-2 animate-in fade-in slide-in-from-top-2 duration-150">
            {isAuthenticated && (
              <div className="px-3 py-2 bg-[#18181B] rounded-xl border border-[#27272A] mb-3">
                <p className="text-xs font-bold text-[#FAFAFA]">{user?.name}</p>
                <p className="text-[11px] text-[#71717A]">{user?.email}</p>
                <span className="mt-1 inline-block text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#8B5CF6]/20 text-[#A78BFA]">
                  {user?.role === "OWNER" ? "Lender" : user?.role === "BROKER" ? "Broker" : "Renter"}
                </span>
              </div>
            )}

            <Link
              href={listPropertyHref}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-xs font-medium text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#18181B]"
            >
              🏠 List Your Property
            </Link>

            {isAuthenticated ? (
              <>
                <Link
                  href="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg text-xs font-medium text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#18181B]"
                >
                  👤 My Profile
                </Link>
                <Link
                  href="/profile?tab=listings"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg text-xs font-medium text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#18181B]"
                >
                  📋 My Listings
                </Link>
                <div className="pt-2 border-t border-[#27272A]">
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      signOut({ callbackUrl: "/" });
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-[#EF4444] hover:bg-[#EF4444]/10 cursor-pointer"
                  >
                    🚪 Sign Out
                  </button>
                </div>
              </>
            ) : (
              <div className="pt-2 border-t border-[#27272A]">
                <Link
                  href="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 rounded-xl bg-[#8B5CF6] text-xs font-semibold text-white hover:bg-[#7C3AED] block shadow-md shadow-[#8B5CF6]/20"
                >
                  Sign Up / Log In
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default NavBar;
