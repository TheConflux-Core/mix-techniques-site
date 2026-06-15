"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [shakingFields, setShakingFields] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const updateForm = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
      setShakingFields((prev) => {
        const next = new Set(prev);
        next.delete(field);
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    const newShaking = new Set<string>();

    if (!form.email.trim()) {
      newErrors.email = "Email is required";
      newShaking.add("email");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Invalid email address";
      newShaking.add("email");
    }
    if (!form.password) {
      newErrors.password = "Password is required";
      newShaking.add("password");
    }

    setErrors(newErrors);
    setShakingFields(newShaking);
    setTimeout(() => setShakingFields(new Set()), 500);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });

      if (error) throw error;
      router.push("/");
    } catch (err: any) {
      setServerError(err.message || "Invalid email or password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInputClasses = (field: string) =>
    `w-full bg-[#0F0A07] border text-[#F0E6D3] font-[family-name:var(--font-mono)] text-sm rounded-lg px-4 py-3 placeholder:text-[#F0E6D3]/20 transition-all duration-300 ${
      shakingFields.has(field)
        ? "error-shake border-[#C4392A]"
        : "border-[#3A2818] hover:border-[#3A2818]/80"
    }`;

  return (
    <div className="flex flex-col min-h-screen page-enter">
      <div className="fixed inset-0 carbon-fiber pointer-events-none" />
      <div className="fixed inset-0 warm-light-bg pointer-events-none opacity-50" />

      <main className="flex-1 flex items-start justify-center px-4 py-12 md:py-16 relative z-10">
        <div className="w-full max-w-lg">
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="heading-wave font-[family-name:var(--font-display)] text-3xl md:text-4xl text-[#F0E6D3] uppercase tracking-[0.15em] font-bold mb-4">
              Sign In
            </h1>
            <p className="font-[family-name:var(--font-mono)] text-[#D4A843]/80 text-sm tracking-[0.25em] uppercase tagline-glow">
              Welcome back
            </p>
          </div>

          {/* Form Card */}
          <div className="card-float noise carbon-fiber-walnut rounded-2xl p-6 md:p-10 relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-[1px] bg-gradient-to-r from-transparent via-[#D4A843]/30 to-transparent" />

            <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
              {serverError && (
                <div className="bg-[#C4392A]/10 border border-[#C4392A]/30 text-[#C4392A] px-4 py-3 rounded-lg font-[family-name:var(--font-mono)] text-sm error-shake">
                  {serverError}
                </div>
              )}

              {/* Email */}
              <div>
                <label className="block text-xs text-[#F0E6D3]/50 font-[family-name:var(--font-mono)] mb-2 uppercase tracking-[0.15em]">
                  Email <span className="text-[#D4A843]">*</span>
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => updateForm("email", e.target.value)}
                  className={getInputClasses("email")}
                  placeholder="you@example.com"
                />
                {errors.email && (
                  <p className="text-[#C4392A] text-xs mt-1.5 font-[family-name:var(--font-mono)]">
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs text-[#F0E6D3]/50 font-[family-name:var(--font-mono)] mb-2 uppercase tracking-[0.15em]">
                  Password <span className="text-[#D4A843]">*</span>
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => updateForm("password", e.target.value)}
                  className={getInputClasses("password")}
                  placeholder="Your password"
                />
                {errors.password && (
                  <p className="text-[#C4392A] text-xs mt-1.5 font-[family-name:var(--font-mono)]">
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-3d w-full text-[#1A0F0A] font-[family-name:var(--font-display)] text-lg uppercase tracking-[0.2em] py-5 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none mt-2"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-3">
                    <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Signing In...
                  </span>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>

            {/* Links */}
            <div className="mt-8 text-center space-y-3">
              <p className="font-[family-name:var(--font-mono)] text-[#F0E6D3]/40 text-sm">
                Don&apos;t have an account?{" "}
                <Link
                  href="/register"
                  className="text-[#D4A843] hover:text-[#E89B2E] transition-colors link-shimmer"
                >
                  Create one
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
