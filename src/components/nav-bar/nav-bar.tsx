"use client";

import Link from "next/link";
import { useState } from "react";
import Logo from "../logo";

export const NavBar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#09090B]/85 backdrop-blur-md border-b border-[#27272A] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group">
              <Logo height={42} width={42} />
              <span className="text-xl font-bold tracking-tight text-[#FAFAFA] group-hover:text-[#8B5CF6] transition-colors">
                rents<span className="text-[#8B5CF6]">.app</span>
              </span>
            </Link>
          </div>

          {/* Desktop Navigation Links & CTAs */}
          <nav className="hidden md:flex items-center gap-3">
            <Link
              href="/signup?role=lender"
              className="text-sm font-medium text-[#A1A1AA] hover:text-[#FAFAFA] border border-[#27272A] hover:border-[#3F3F46] bg-[#18181B] px-3.5 py-1.5 rounded-lg transition-all hover:bg-[#27272A] flex items-center gap-1.5"
            >
              <span>List Your Property</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-[#8B5CF6]/20 text-[#8B5CF6]">
                Lender
              </span>
            </Link>

            <div className="h-5 w-px bg-[#27272A] mx-1" />

            {/* Merged Sign Up / Log In Button (Opens Sign Up by default) */}
            <Link
              href="/signup"
              className="text-sm font-semibold text-white bg-[#8B5CF6] hover:bg-[#7C3AED] px-4 py-2 rounded-xl shadow-lg shadow-[#8B5CF6]/20 hover:shadow-[#8B5CF6]/30 transition-all flex items-center gap-2 transform hover:-translate-y-0.5 active:translate-y-0"
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
          </nav>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <Link
              href="/signup"
              className="text-xs font-semibold text-white bg-[#8B5CF6] px-3 py-1.5 rounded-lg shadow-sm"
            >
              Sign Up / Log In
            </Link>
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
          <div className="md:hidden py-4 border-t border-[#27272A] bg-[#09090B] space-y-2.5 px-2 animate-in fade-in slide-in-from-top-2 duration-150">
            <Link
              href="/signup?role=lender"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#18181B]"
            >
              🏠 List Your Property (Lender)
            </Link>
            <div className="pt-2 border-t border-[#27272A]">
              <Link
                href="/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-xl bg-[#8B5CF6] text-sm font-semibold text-white hover:bg-[#7C3AED] block shadow-md shadow-[#8B5CF6]/20"
              >
                Sign Up / Log In
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default NavBar;
