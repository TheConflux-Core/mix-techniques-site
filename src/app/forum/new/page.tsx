"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { ForumCategory } from "@/lib/types";

const MAX_TITLE = 200;
const MAX_BODY = 10000;

export default function NewThreadPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [loadingCats, setLoadingCats] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch("/api/forum/categories");
        if (res.ok) {
          const data = await res.json();
          setCategories(data);
          if (data.length > 0) setCategoryId(data[0].id);
        }
      } catch {}
      setLoadingCats(false);
    }
    fetchCategories();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!categoryId || !title.trim() || !body.trim() || submitting) return;

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/forum/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category_id: categoryId,
          title: title.trim(),
          body: body.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create thread");
      }

      const thread = await res.json();
      // Find category slug
      const cat = categories.find((c) => c.id === categoryId);
      router.push(`/forum/${cat?.slug || "general"}/${thread.slug}`);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading || loadingCats) {
    return (
      <div className="min-h-screen carbon-fiber flex items-center justify-center">
        <div className="text-center">
          <div className="flex items-end justify-center gap-[2px] h-10 mb-4">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className="w-[2px] rounded-full origin-bottom"
                style={{
                  background: "linear-gradient(to top, #D4A843, #E89B2E)",
                  height: "60%",
                  animation: `waveform-breathe ${1.5 + (i % 5) * 0.3}s ease-in-out ${i * 0.08}s infinite`,
                  opacity: 0.4,
                }}
              />
            ))}
          </div>
          <p className="text-[#F0E6D3]/30 font-[family-name:var(--font-mono)] text-xs tracking-[0.2em] uppercase">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen carbon-fiber relative">
      <div className="fixed inset-0 warm-light-bg pointer-events-none opacity-50" />

      <div className="max-w-2xl mx-auto px-4 md:px-6 py-8 md:py-12 relative z-10">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <ol className="flex items-center gap-2 font-[family-name:var(--font-mono)] text-xs text-[#F0E6D3]/30">
            <li>
              <Link href="/" className="hover:text-[#D4A843] transition-colors">
                Home
              </Link>
            </li>
            <li>/</li>
            <li>
              <Link href="/forum" className="hover:text-[#D4A843] transition-colors">
                Forum
              </Link>
            </li>
            <li>/</li>
            <li className="text-[#F0E6D3]/60">New Thread</li>
          </ol>
        </nav>

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="heading-wave font-[family-name:var(--font-display)] text-3xl md:text-4xl text-[#F0E6D3] uppercase tracking-[0.15em] font-bold mb-4">
            Start a New Thread
          </h1>
          <p className="font-[family-name:var(--font-mono)] text-[#D4A843]/80 text-sm tracking-[0.25em] uppercase">
            Share your question, idea, or discussion
          </p>
        </div>

        {/* Form card */}
        <div className="card-float noise carbon-fiber-walnut rounded-2xl p-6 md:p-10 relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-[1px] bg-gradient-to-r from-transparent via-[#D4A843]/30 to-transparent" />

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="text-red-400 text-sm font-[family-name:var(--font-mono)] bg-red-900/20 border border-red-900/30 rounded-lg px-4 py-2">
                {error}
              </div>
            )}

            {/* Category selector */}
            <div>
              <label className="block text-[#F0E6D3]/50 font-[family-name:var(--font-mono)] text-xs uppercase tracking-wider mb-2">
                Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-[#0F0A07] border border-[#3A2818] rounded-lg px-4 py-3 text-[#F0E6D3] font-[family-name:var(--font-mono)] text-sm focus:border-[#D4A843] focus:outline-none transition-colors appearance-none cursor-pointer"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Title */}
            <div>
              <label className="block text-[#F0E6D3]/50 font-[family-name:var(--font-mono)] text-xs uppercase tracking-wider mb-2">
                Thread Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What's on your mind?"
                maxLength={MAX_TITLE}
                className="w-full bg-[#0F0A07] border border-[#3A2818] rounded-lg px-4 py-3 text-[#F0E6D3] font-[family-name:var(--font-mono)] text-sm placeholder:text-[#F0E6D3]/20 focus:border-[#D4A843] focus:outline-none transition-colors"
              />
              <div className="text-right text-[10px] text-[#F0E6D3]/20 font-[family-name:var(--font-mono)] mt-1">
                {title.length}/{MAX_TITLE}
              </div>
            </div>

            {/* Body */}
            <div>
              <label className="block text-[#F0E6D3]/50 font-[family-name:var(--font-mono)] text-xs uppercase tracking-wider mb-2">
                Body
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Share the details, context, and anything relevant..."
                maxLength={MAX_BODY}
                rows={10}
                className="w-full bg-[#0F0A07] border border-[#3A2818] rounded-lg px-4 py-3 text-[#F0E6D3] font-[family-name:var(--font-mono)] text-sm placeholder:text-[#F0E6D3]/20 focus:border-[#D4A843] focus:outline-none resize-none transition-colors"
              />
              <div className="text-right text-[10px] text-[#F0E6D3]/20 font-[family-name:var(--font-mono)] mt-1">
                {body.length}/{MAX_BODY}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              <Link
                href="/forum"
                className="text-[#F0E6D3]/40 hover:text-[#F0E6D3] font-[family-name:var(--font-mono)] text-sm transition-colors"
              >
                ← Back to Forum
              </Link>
              <button
                type="submit"
                disabled={!categoryId || !title.trim() || !body.trim() || submitting}
                className="btn-3d text-[#1A0F0A] font-[family-name:var(--font-display)] text-sm uppercase tracking-[0.1em] px-8 py-3 rounded-lg font-bold disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {submitting ? "Creating..." : "Create Thread"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-[#3A2818]/30 py-6 px-6 mt-12 relative z-10">
        <div className="max-w-6xl mx-auto text-center">
          <p className="font-[family-name:var(--font-mono)] text-[#F0E6D3]/15 text-xs tracking-wider">
            © {new Date().getFullYear()} Mix Techniques
          </p>
        </div>
      </footer>
    </div>
  );
}
