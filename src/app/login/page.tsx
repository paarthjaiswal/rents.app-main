"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Logo from "@/components/logo";

interface FormErrors {
  email?: string;
  password?: string;
  form?: string;
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/search";
  const registered = searchParams.get("registered");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = (): boolean => {
    const errs: FormErrors = {};

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      errs.email = "Email address is required";
    } else if (!emailRegex.test(email.trim())) {
      errs.email = "Please enter a valid email address";
    }

    if (!password) {
      errs.password = "Password is required";
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
      const res = await signIn("credentials", {
        email: email.trim(),
        password,
        redirect: false,
      });

      if (res?.error) {
        setErrors({ form: "Invalid email or password. Please try again." });
        setIsSubmitting(false);
        return;
      }

      router.push(callbackUrl);
      router.refresh();
    } catch {
      setErrors({ form: "An unexpected error occurred. Please try again." });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Brand Header */}
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
          Welcome back
        </h2>
        <p className="mt-2 text-center text-sm text-[#A1A1AA]">
          Log in to manage your rentals or saved listings.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-[#18181B] py-8 px-5 sm:px-10 shadow-2xl rounded-2xl border border-[#27272A]">
          {/* Registration Success Banner */}
          {registered && (
            <div
              role="status"
              className="mb-6 p-4 rounded-xl bg-[#22C55E]/10 border border-[#22C55E]/30 text-[#22C55E] flex items-start gap-3 animate-in fade-in duration-200"
            >
              <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div className="text-sm">
                <p className="font-semibold text-[#FAFAFA]">Account created!</p>
                <p className="mt-0.5 text-xs text-[#A1A1AA]">Please log in with your credentials.</p>
              </div>
            </div>
          )}

          {/* Form Error Banner */}
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
                  value={email}
                  onChange={e => {
                    setEmail(e.target.value);
                    if (errors.email || errors.form) {
                      setErrors(prev => ({ ...prev, email: undefined, form: undefined }));
                    }
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

            {/* Password */}
            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-[#A1A1AA]">
                  Password <span className="text-[#EF4444]">*</span>
                </label>
                <span
                  title="Contact support if you need password recovery"
                  className="text-xs text-[#71717A] select-none"
                >
                  Forgot password?
                </span>
              </div>
              <div className="mt-1.5 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={e => {
                    setPassword(e.target.value);
                    if (errors.password || errors.form) {
                      setErrors(prev => ({ ...prev, password: undefined, form: undefined }));
                    }
                  }}
                  placeholder="Enter your password"
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

            {/* Remember Me Checkbox */}
            <div className="flex items-center">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-[#27272A] bg-[#09090B] accent-[#8B5CF6] focus:ring-[#8B5CF6]"
                />
                <span className="text-xs text-[#A1A1AA]">Remember me for 30 days</span>
              </label>
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
                  <span>Signing In...</span>
                </>
              ) : (
                "Log In"
              )}
            </button>
          </form>

          {/* Switch to Sign Up Action Button */}
          <div className="mt-8 pt-6 border-t border-[#27272A] space-y-3">
            <div className="text-center">
              <span className="text-xs text-[#A1A1AA]">Don&apos;t have an account yet?</span>
            </div>
            <Link
              href={callbackUrl ? `/signup?callbackUrl=${encodeURIComponent(callbackUrl)}` : "/signup"}
              className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold text-[#FAFAFA] bg-[#27272A] hover:bg-[#3F3F46] hover:text-white border border-[#3F3F46] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm group"
            >
              <span>Switch to Sign Up</span>
              <span className="text-[#8B5CF6] group-hover:translate-x-0.5 transition-transform">→</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] flex items-center justify-center">
          <div className="w-8 h-8 border-3 border-[#27272A] border-t-[#8B5CF6] rounded-full animate-spin" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
