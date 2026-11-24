"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Logo from "@/components/logo";

type AccountType = "RENTER" | "LENDER";

const ROLE_MAP = {
  RENTER: "USER",
  LENDER: "OWNER",
} as const;

interface FormState {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  accountType: AccountType;
  agreedToTerms: boolean;
}

interface FormErrors {
  fullName?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
  agreedToTerms?: string;
  form?: string;
}

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRole = searchParams.get("role")?.toLowerCase() === "lender" ? "LENDER" : "RENTER";
  const callbackUrl = searchParams.get("callbackUrl");

  const [formData, setFormData] = useState<FormState>({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    accountType: initialRole,
    agreedToTerms: false,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = (): boolean => {
    const errs: FormErrors = {};

    if (!formData.fullName.trim()) {
      errs.fullName = "Full name is required";
    } else if (formData.fullName.trim().length < 2) {
      errs.fullName = "Name must be at least 2 characters";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      errs.email = "Email address is required";
    } else if (!emailRegex.test(formData.email.trim())) {
      errs.email = "Please enter a valid email address";
    }

    if (formData.phone.trim()) {
      const phoneRegex = /^[0-9+\s()-]{7,15}$/;
      if (!phoneRegex.test(formData.phone.trim())) {
        errs.phone = "Please enter a valid phone number";
      }
    }

    if (!formData.password) {
      errs.password = "Password is required";
    } else if (formData.password.length < 8) {
      errs.password = "Password must be at least 8 characters";
    }

    if (!formData.confirmPassword) {
      errs.confirmPassword = "Confirm password is required";
    } else if (formData.password !== formData.confirmPassword) {
      errs.confirmPassword = "Passwords do not match";
    }

    if (!formData.agreedToTerms) {
      errs.agreedToTerms = "You must agree to the Terms & Conditions";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.fullName.trim(),
          email: formData.email.trim(),
          password: formData.password,
          phone: formData.phone.trim() || undefined,
          role: ROLE_MAP[formData.accountType],
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrors({
          form: typeof data.error === "string" ? data.error : "Failed to create account. Please check your inputs.",
        });
        setIsSubmitting(false);
        return;
      }

      // Automatically sign in upon registration
      const loginRes = await signIn("credentials", {
        email: formData.email.trim(),
        password: formData.password,
        redirect: false,
      });

      if (loginRes?.error) {
        // Fallback to login screen if auto login had issues
        router.push("/login?registered=true");
      } else {
        if (callbackUrl) {
          router.push(callbackUrl);
        } else if (formData.accountType === "LENDER") {
          router.push("/list-property");
        } else {
          router.push("/search");
        }
        router.refresh();
      }
    } catch {
      setErrors({ form: "An unexpected error occurred. Please try again." });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Top Header Link */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="flex justify-center mb-4">
          <Link href="/" className="flex items-center gap-2 group">
            <Logo height={48} width={48} />
            <span className="text-2xl font-bold tracking-tight text-[#FAFAFA] group-hover:text-[#8B5CF6] transition-colors">
              rents<span className="text-[#8B5CF6]">.app</span>
            </span>
          </Link>
        </div>
        <h2 className="text-center text-2xl sm:text-3xl font-extrabold tracking-tight text-[#FAFAFA]">
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-[#A1A1AA]">
          Already have an account?{" "}
          <Link
            href={callbackUrl ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}` : "/login"}
            className="font-medium text-[#8B5CF6] hover:text-[#A78BFA] transition-colors"
          >
            Log in here
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg px-4">
        <div className="bg-[#18181B] py-8 px-5 sm:px-10 shadow-2xl rounded-2xl border border-[#27272A]">
          {/* Server Error Banner */}
          {errors.form && (
            <div
              role="alert"
              className="mb-6 p-4 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#EF4444] flex items-start gap-3 animate-in fade-in duration-200"
            >
              <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm">
                <p className="font-semibold">{errors.form}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            {/* Account Type Selection (Renter vs Lender) */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#A1A1AA] mb-3">
                Select Account Type <span className="text-[#EF4444]">*</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Renter Card */}
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, accountType: "RENTER" }));
                    setErrors(prev => ({ ...prev, form: undefined }));
                  }}
                  className={`relative p-4 rounded-xl text-left border cursor-pointer transition-all ${
                    formData.accountType === "RENTER"
                      ? "border-[#8B5CF6] bg-[#8B5CF6]/10 ring-2 ring-[#8B5CF6]/40 text-[#FAFAFA]"
                      : "border-[#27272A] bg-[#111827]/40 hover:bg-[#111827] hover:border-[#3F3F46] text-[#A1A1AA]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xl">🔍</span>
                    {formData.accountType === "RENTER" && (
                      <span className="w-5 h-5 rounded-full bg-[#8B5CF6] text-white flex items-center justify-center text-xs">
                        ✓
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-sm text-[#FAFAFA]">I&apos;m a Renter</h3>
                  <p className="text-xs text-[#A1A1AA] mt-1 leading-relaxed">
                    Find your next home. Browse PGs, flats, and rooms.
                  </p>
                </button>

                {/* Lender Card */}
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, accountType: "LENDER" }));
                    setErrors(prev => ({ ...prev, form: undefined }));
                  }}
                  className={`relative p-4 rounded-xl text-left border cursor-pointer transition-all ${
                    formData.accountType === "LENDER"
                      ? "border-[#8B5CF6] bg-[#8B5CF6]/10 ring-2 ring-[#8B5CF6]/40 text-[#FAFAFA]"
                      : "border-[#27272A] bg-[#111827]/40 hover:bg-[#111827] hover:border-[#3F3F46] text-[#A1A1AA]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xl">🏠</span>
                    {formData.accountType === "LENDER" && (
                      <span className="w-5 h-5 rounded-full bg-[#8B5CF6] text-white flex items-center justify-center text-xs">
                        ✓
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-sm text-[#FAFAFA]">I&apos;m a Lender</h3>
                  <p className="text-xs text-[#A1A1AA] mt-1 leading-relaxed">
                    List properties and connect with verified tenants.
                  </p>
                </button>
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label htmlFor="fullName" className="block text-xs font-semibold uppercase tracking-wider text-[#A1A1AA]">
                Full Name <span className="text-[#EF4444]">*</span>
              </label>
              <div className="mt-1.5">
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  value={formData.fullName}
                  onChange={e => {
                    setFormData(prev => ({ ...prev, fullName: e.target.value }));
                    if (errors.fullName) setErrors(prev => ({ ...prev, fullName: undefined }));
                  }}
                  placeholder="e.g. Rahul Sharma"
                  className={`w-full px-3.5 py-2.5 rounded-xl bg-[#09090B] border text-sm text-[#FAFAFA] placeholder-[#71717A] focus:outline-none focus:ring-2 transition-all ${
                    errors.fullName
                      ? "border-[#EF4444] focus:ring-[#EF4444]"
                      : "border-[#27272A] focus:border-[#8B5CF6] focus:ring-[#8B5CF6]/30"
                  }`}
                />
                {errors.fullName && <p className="mt-1.5 text-xs text-[#EF4444]">{errors.fullName}</p>}
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-[#A1A1AA]">
                Email Address <span className="text-[#EF4444]">*</span>
              </label>
              <div className="mt-1.5">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={e => {
                    setFormData(prev => ({ ...prev, email: e.target.value }));
                    if (errors.email) setErrors(prev => ({ ...prev, email: undefined }));
                  }}
                  placeholder="you@example.com"
                  className={`w-full px-3.5 py-2.5 rounded-xl bg-[#09090B] border text-sm text-[#FAFAFA] placeholder-[#71717A] focus:outline-none focus:ring-2 transition-all ${
                    errors.email
                      ? "border-[#EF4444] focus:ring-[#EF4444]"
                      : "border-[#27272A] focus:border-[#8B5CF6] focus:ring-[#8B5CF6]/30"
                  }`}
                />
                {errors.email && <p className="mt-1.5 text-xs text-[#EF4444]">{errors.email}</p>}
              </div>
            </div>

            {/* Phone Number (Optional) */}
            <div>
              <label htmlFor="phone" className="block text-xs font-semibold uppercase tracking-wider text-[#A1A1AA]">
                Phone Number <span className="text-xs font-normal text-[#71717A]">(Optional)</span>
              </label>
              <div className="mt-1.5">
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  value={formData.phone}
                  onChange={e => {
                    setFormData(prev => ({ ...prev, phone: e.target.value }));
                    if (errors.phone) setErrors(prev => ({ ...prev, phone: undefined }));
                  }}
                  placeholder="+91 98765 43210"
                  className={`w-full px-3.5 py-2.5 rounded-xl bg-[#09090B] border text-sm text-[#FAFAFA] placeholder-[#71717A] focus:outline-none focus:ring-2 transition-all ${
                    errors.phone
                      ? "border-[#EF4444] focus:ring-[#EF4444]"
                      : "border-[#27272A] focus:border-[#8B5CF6] focus:ring-[#8B5CF6]/30"
                  }`}
                />
                {errors.phone && <p className="mt-1.5 text-xs text-[#EF4444]">{errors.phone}</p>}
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-[#A1A1AA]">
                Password <span className="text-[#EF4444]">*</span>
              </label>
              <div className="mt-1.5 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={e => {
                    setFormData(prev => ({ ...prev, password: e.target.value }));
                    if (errors.password) setErrors(prev => ({ ...prev, password: undefined }));
                  }}
                  placeholder="Minimum 8 characters"
                  className={`w-full px-3.5 py-2.5 pr-10 rounded-xl bg-[#09090B] border text-sm text-[#FAFAFA] placeholder-[#71717A] focus:outline-none focus:ring-2 transition-all ${
                    errors.password
                      ? "border-[#EF4444] focus:ring-[#EF4444]"
                      : "border-[#27272A] focus:border-[#8B5CF6] focus:ring-[#8B5CF6]/30"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#71717A] hover:text-[#FAFAFA] transition-colors p-1"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && <p className="mt-1.5 text-xs text-[#EF4444]">{errors.password}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-xs font-semibold uppercase tracking-wider text-[#A1A1AA]">
                Confirm Password <span className="text-[#EF4444]">*</span>
              </label>
              <div className="mt-1.5 relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={formData.confirmPassword}
                  onChange={e => {
                    setFormData(prev => ({ ...prev, confirmPassword: e.target.value }));
                    if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: undefined }));
                  }}
                  placeholder="Re-type your password"
                  className={`w-full px-3.5 py-2.5 pr-10 rounded-xl bg-[#09090B] border text-sm text-[#FAFAFA] placeholder-[#71717A] focus:outline-none focus:ring-2 transition-all ${
                    errors.confirmPassword
                      ? "border-[#EF4444] focus:ring-[#EF4444]"
                      : "border-[#27272A] focus:border-[#8B5CF6] focus:ring-[#8B5CF6]/30"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#71717A] hover:text-[#FAFAFA] transition-colors p-1"
                  aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                >
                  {showConfirmPassword ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.confirmPassword && <p className="mt-1.5 text-xs text-[#EF4444]">{errors.confirmPassword}</p>}
            </div>

            {/* Terms & Conditions Checkbox */}
            <div>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.agreedToTerms}
                  onChange={e => {
                    setFormData(prev => ({ ...prev, agreedToTerms: e.target.checked }));
                    if (errors.agreedToTerms) setErrors(prev => ({ ...prev, agreedToTerms: undefined }));
                  }}
                  className="mt-0.5 h-4 w-4 rounded border-[#27272A] bg-[#09090B] accent-[#8B5CF6] focus:ring-[#8B5CF6]"
                />
                <span className="text-xs text-[#A1A1AA] leading-normal">
                  I agree to the <span className="text-[#8B5CF6] hover:underline">Terms of Service</span> and{" "}
                  <span className="text-[#8B5CF6] hover:underline">Privacy Policy</span>.
                </span>
              </label>
              {errors.agreedToTerms && <p className="mt-1.5 text-xs text-[#EF4444]">{errors.agreedToTerms}</p>}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-white bg-[#8B5CF6] hover:bg-[#7C3AED] focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/50 shadow-lg shadow-[#8B5CF6]/20 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          {/* Switch to Login Action Button */}
          <div className="mt-8 pt-6 border-t border-[#27272A] space-y-3">
            <div className="text-center">
              <span className="text-xs text-[#A1A1AA]">Already have an account?</span>
            </div>
            <Link
              href={callbackUrl ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}` : "/login"}
              className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold text-[#FAFAFA] bg-[#27272A] hover:bg-[#3F3F46] hover:text-white border border-[#3F3F46] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm group"
            >
              <span>Switch to Log In</span>
              <span className="text-[#8B5CF6] group-hover:translate-x-0.5 transition-transform">→</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] flex items-center justify-center">
          <div className="w-8 h-8 border-3 border-[#27272A] border-t-[#8B5CF6] rounded-full animate-spin" />
        </div>
      }
    >
      <SignupContent />
    </Suspense>
  );
}
