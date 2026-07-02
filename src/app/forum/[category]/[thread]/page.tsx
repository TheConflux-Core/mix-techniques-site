"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { ForumThread, ForumReply, ForumCategory } from "@/lib/types";
import ThreadPost from "@/components/forum/ThreadPost";
import ReplyCard from "@/components/forum/ReplyCard";
import ReplyForm from "@/components/forum/ReplyForm";

function buildReplyTree(replies: ForumReply[]): ForumReply[] {
  const map = new Map<string, ForumReply>();
  const roots: ForumReply[] = [];

  // Index all replies
  for (const r of replies) {
    map.set(r.id, { ...r, children: [] });
  }

  // Build tree
  for (const r of replies) {
    const node = map.get(r.id)!;
    if (r.parent_id && map.has(r.parent_id)) {
      map.get(r.parent_id)!.children!.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

export default function ThreadPage() {
  const params = useParams();
  const { user } = useAuth();
  const categorySlug = params.category as string;
  const threadSlug = params.thread as string;

  const [thread, setThread] = useState<ForumThread | null>(null);
  const [replies, setReplies] = useState<ForumReply[]>([]);
  const [category, setCategory] = useState<ForumCategory | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyPage, setReplyPage] = useState(1);
  const [hasMoreReplies, setHasMoreReplies] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      // Fetch thread by category slug + thread slug (single API call)
      const threadRes = await fetch(
        `/api/forum/threads/by-slug?category=${encodeURIComponent(categorySlug)}&thread=${encodeURIComponent(threadSlug)}`
      );

      if (!threadRes.ok) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const found = await threadRes.json();
      setThread(found);
      if (found.category) setCategory(found.category);

      // Fetch replies
      const repliesRes = await fetch(
        `/api/forum/threads/${found.id}/replies?page=1&limit=50`
      );
      if (repliesRes.ok) {
        const repliesData = await repliesRes.json();
        const replyList = repliesData.data || repliesData;
        setReplies(Array.isArray(replyList) ? replyList : []);
        setHasMoreReplies(Array.isArray(replyList) ? replyList.length === 50 : false);
      }
    } catch (err) {
      console.error("Failed to fetch thread:", err);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [categorySlug, threadSlug]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleLoadMoreReplies() {
    if (!thread) return;
    const nextPage = replyPage + 1;
    try {
      const res = await fetch(
        `/api/forum/threads/${thread.id}/replies?page=${nextPage}&limit=50`
      );
      if (res.ok) {
        const data = await res.json();
        const newReplies = data.replies || data;
        setReplies((prev) => [...prev, ...newReplies]);
        setReplyPage(nextPage);
        setHasMoreReplies(newReplies.length === 50);
      }
    } catch {}
  }

  async function handleMarkSolved() {
    if (!thread || !user || user.id !== thread.author_id) return;
    try {
      const res = await fetch(`/api/forum/threads/${thread.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_solved: !thread.is_solved }),
      });
      if (res.ok) fetchData();
    } catch {}
  }

  if (loading) {
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
            Loading thread...
          </p>
        </div>
      </div>
    );
  }

  if (notFound || !thread) {
    return (
      <div className="min-h-screen carbon-fiber flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-6">🔇</div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl text-[#F0E6D3] uppercase tracking-wider mb-4">
            Thread Not Found
          </h1>
          <p className="text-[#F0E6D3]/40 font-[family-name:var(--font-mono)] text-sm mb-6">
            This thread doesn&apos;t exist or has been removed.
          </p>
          <Link
            href="/forum"
            className="btn-3d inline-block text-[#1A0F0A] font-[family-name:var(--font-display)] text-sm uppercase tracking-[0.15em] px-8 py-3 rounded-lg font-bold"
          >
            Back to Forum
          </Link>
        </div>
      </div>
    );
  }

  const replyTree = buildReplyTree(replies);
  const isOwner = user?.id === thread.author_id;

  return (
    <div className="min-h-screen carbon-fiber relative">
      <div className="fixed inset-0 warm-light-bg pointer-events-none opacity-50" />

      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-12 relative z-10">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <ol className="flex items-center gap-2 font-[family-name:var(--font-mono)] text-xs text-[#F0E6D3]/30 flex-wrap">
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
            <li>
              <Link
                href={`/forum/${categorySlug}`}
                className="hover:text-[#D4A843] transition-colors"
              >
                {category?.name || categorySlug}
              </Link>
            </li>
            <li>/</li>
            <li className="text-[#F0E6D3]/60 truncate max-w-[200px]">
              {thread.title}
            </li>
          </ol>
        </nav>

        {/* Thread post */}
        <ThreadPost thread={thread} isOwner={isOwner} />

        {/* Mark as solved toggle (owner only) */}
        {isOwner && (
          <div className="flex justify-end mt-3">
            <button
              onClick={handleMarkSolved}
              className={`font-[family-name:var(--font-mono)] text-xs uppercase tracking-wider px-4 py-2 rounded-lg border transition-colors ${
                thread.is_solved
                  ? "bg-green-900/20 text-green-400 border-green-800/30 hover:bg-green-900/30"
                  : "text-[#F0E6D3]/30 border-[#3A2818]/50 hover:text-green-400 hover:border-green-800/30"
              }`}
            >
              {thread.is_solved ? "✅ Solved — Unmark" : "Mark as Solved"}
            </button>
          </div>
        )}

        {/* Replies section */}
        <div className="mt-8">
          <h2 className="font-[family-name:var(--font-display)] text-lg text-[#F0E6D3] uppercase tracking-wider mb-4 heading-wave">
            {replies.length} {replies.length === 1 ? "Reply" : "Replies"}
          </h2>

          {replies.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-[#F0E6D3]/30 font-[family-name:var(--font-mono)] text-sm">
                No replies yet. Be the first to respond.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {replyTree.map((reply) => (
                <ReplyCard
                  key={reply.id}
                  reply={reply}
                  threadId={thread.id}
                  threadAuthorId={thread.author_id}
                  currentUserId={user?.id}
                  onReplyPosted={fetchData}
                />
              ))}
            </div>
          )}

          {hasMoreReplies && (
            <div className="text-center mt-6">
              <button
                onClick={handleLoadMoreReplies}
                className="font-[family-name:var(--font-mono)] text-sm text-[#D4A843] hover:text-[#E89B2E] uppercase tracking-wider transition-colors"
              >
                Load More Replies ↓
              </button>
            </div>
          )}
        </div>

        {/* Reply form */}
        {!thread.is_locked && (
          <div className="mt-8">
            <h2 className="font-[family-name:var(--font-display)] text-lg text-[#F0E6D3] uppercase tracking-wider mb-4 heading-wave">
              Leave a Reply
            </h2>
            <div className="card-float noise carbon-fiber-walnut rounded-2xl p-6">
              <ReplyForm threadId={thread.id} onSuccess={fetchData} />
            </div>
          </div>
        )}

        {thread.is_locked && (
          <div className="mt-8 text-center py-6 border border-[#3A2818]/30 rounded-xl">
            <p className="text-[#F0E6D3]/30 font-[family-name:var(--font-mono)] text-sm">
              🔒 This thread is locked. No new replies can be posted.
            </p>
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
