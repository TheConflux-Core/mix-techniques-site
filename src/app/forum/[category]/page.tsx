"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { ForumCategory, ForumThread } from "@/lib/types";
import ThreadList from "@/components/forum/ThreadList";
import NewThreadForm from "@/components/forum/NewThreadForm";

type SortMode = "active" | "newest" | "unanswered";

export default function CategoryPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const categorySlug = params.category as string;

  const [category, setCategory] = useState<ForumCategory | null>(null);
  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SortMode>("active");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [showNewThread, setShowNewThread] = useState(false);

  const fetchThreads = useCallback(
    async (pageNum: number, sortMode: SortMode, append = false) => {
      try {
        const res = await fetch(
          `/api/forum/threads?category=${categorySlug}&page=${pageNum}&limit=20&sort=${sortMode}`
        );
        if (res.ok) {
          const json = await res.json();
          const threadList = json.data || json.threads || json;
          const threadsArray = Array.isArray(threadList) ? threadList : [];
          if (append) {
            setThreads((prev) => [...prev, ...threadsArray]);
          } else {
            setThreads(threadsArray);
          }
          setHasMore(json.hasMore ?? threadsArray.length === 20);
        }
      } catch (err) {
        console.error("Failed to fetch threads:", err);
      } finally {
        setLoading(false);
      }
    },
    [categorySlug]
  );

  useEffect(() => {
    async function init() {
      setLoading(true);
      // Fetch category info
      try {
        const catRes = await fetch("/api/forum/categories");
        if (catRes.ok) {
          const cats = await catRes.json();
          const match = cats.find((c: ForumCategory) => c.slug === categorySlug);
          if (match) setCategory(match);
        }
      } catch {}
      fetchThreads(1, sort);
    }
    init();
  }, [categorySlug, sort, fetchThreads]);

  function handleSortChange(mode: SortMode) {
    setSort(mode);
    setPage(1);
    setLoading(true);
  }

  function handleLoadMore() {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchThreads(nextPage, sort, true);
  }

  function handleThreadCreated(thread: { slug: string }) {
    setShowNewThread(false);
    // Navigate to the new thread
    router.push(`/forum/${categorySlug}/${thread.slug}`);
  }

  return (
    <div className="min-h-screen carbon-fiber relative">
      <div className="fixed inset-0 warm-light-bg pointer-events-none opacity-50" />

      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-12 relative z-10">
        {/* Breadcrumb */}
        <nav className="mb-6">
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
            <li className="text-[#F0E6D3]/60">
              {category?.name || categorySlug}
            </li>
          </ol>
        </nav>

        {/* Category header */}
        <div className="card-float noise carbon-fiber-walnut rounded-2xl p-6 md:p-8 mb-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                {category?.icon && (
                  <span className="text-2xl">{category.icon}</span>
                )}
                <h1 className="font-[family-name:var(--font-display)] text-2xl md:text-3xl text-[#F0E6D3] uppercase tracking-wider font-bold heading-wave">
                  {category?.name || "Category"}
                </h1>
              </div>
              {category?.description && (
                <p className="font-[family-name:var(--font-mono)] text-[#F0E6D3]/40 text-sm">
                  {category.description}
                </p>
              )}
              {category && (
                <div className="flex items-center gap-4 mt-3 font-[family-name:var(--font-mono)] text-xs text-[#F0E6D3]/25">
                  <span>
                    <span className="text-[#D4A843]">{category.thread_count}</span>{" "}
                    threads
                  </span>
                  <span>
                    <span className="text-[#D4A843]">{category.post_count}</span>{" "}
                    posts
                  </span>
                </div>
              )}
            </div>

            {user && (
              <button
                onClick={() => setShowNewThread(!showNewThread)}
                className="btn-3d text-[#1A0F0A] font-[family-name:var(--font-display)] text-sm uppercase tracking-[0.1em] px-6 py-2.5 rounded-lg font-bold flex-shrink-0"
              >
                {showNewThread ? "Cancel" : "New Thread"}
              </button>
            )}
          </div>

          {/* Inline new thread form */}
          {showNewThread && category && (
            <div className="mt-6 pt-6 border-t border-[#3A2818]/30">
              <NewThreadForm
                categoryId={category.id}
                onSuccess={handleThreadCreated}
                onCancel={() => setShowNewThread(false)}
              />
            </div>
          )}
        </div>

        {/* Sort tabs */}
        <div className="flex items-center gap-1 mb-4">
          {(["active", "newest", "unanswered"] as SortMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => handleSortChange(mode)}
              className={`font-[family-name:var(--font-mono)] text-xs uppercase tracking-wider px-4 py-2 rounded-lg transition-colors ${
                sort === mode
                  ? "bg-[#D4A843]/10 text-[#D4A843] border border-[#D4A843]/20"
                  : "text-[#F0E6D3]/30 hover:text-[#F0E6D3]/50"
              }`}
            >
              {mode === "active" ? "Most Active" : mode === "newest" ? "Newest" : "Unanswered"}
            </button>
          ))}
        </div>

        {/* Thread list */}
        <div className="card-float noise carbon-fiber-walnut rounded-2xl overflow-hidden">
          <ThreadList
            threads={threads}
            categorySlug={categorySlug}
            loading={loading}
          />
        </div>

        {/* Load more */}
        {hasMore && !loading && (
          <div className="text-center mt-6">
            <button
              onClick={handleLoadMore}
              className="font-[family-name:var(--font-mono)] text-sm text-[#D4A843] hover:text-[#E89B2E] uppercase tracking-wider transition-colors"
            >
              Load More Threads ↓
            </button>
          </div>
        )}
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
