"use client";

import Link from "next/link";
import { ForumThread } from "@/lib/types";

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "never";
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

interface ThreadListItemProps {
  thread: ForumThread;
  categorySlug: string;
}

export default function ThreadListItem({
  thread,
  categorySlug,
}: ThreadListItemProps) {
  return (
    <Link
      href={`/forum/${categorySlug}/${thread.slug}`}
      className="group flex items-center gap-4 p-4 rounded-xl transition-all hover:bg-[#2A1810]/30 hover:shadow-[0_0_20px_rgba(212,168,67,0.05)] border border-transparent hover:border-[#3A2818]/50"
    >
      {/* Vote score */}
      <div className="flex-shrink-0 w-12 text-center">
        <div
          className={`font-[family-name:var(--font-mono)] text-sm font-bold ${
            thread.vote_score > 0
              ? "text-[#D4A843]"
              : thread.vote_score < 0
              ? "text-[#E89B2E]"
              : "text-[#F0E6D3]/30"
          }`}
        >
          {thread.vote_score}
        </div>
        <div className="text-[10px] text-[#F0E6D3]/20 uppercase tracking-wider">
          votes
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          {thread.is_pinned && (
            <span title="Pinned" className="text-sm">
              📌
            </span>
          )}
          {thread.is_solved && (
            <span
              title="Solved"
              className="text-xs bg-green-900/30 text-green-400 px-2 py-0.5 rounded-full border border-green-800/30"
            >
              ✅ Solved
            </span>
          )}
          <h3 className="font-[family-name:var(--font-display)] text-[#F0E6D3] group-hover:text-[#D4A843] transition-colors truncate text-base">
            {thread.title}
          </h3>
        </div>

        <div className="flex items-center gap-3 font-[family-name:var(--font-mono)] text-xs text-[#F0E6D3]/30">
          {thread.author && (
            <span className="flex items-center gap-1.5">
              {thread.author.avatar_url ? (
                <img
                  src={thread.author.avatar_url}
                  alt=""
                  className="w-4 h-4 rounded-full"
                />
              ) : (
                <div className="w-4 h-4 rounded-full bg-[#3A2818]" />
              )}
              <span className="text-[#F0E6D3]/50">
                {thread.author.display_name}
              </span>
            </span>
          )}
          <span>·</span>
          <span>{timeAgo(thread.created_at)}</span>
        </div>
      </div>

      {/* Right stats */}
      <div className="flex-shrink-0 flex items-center gap-5 font-[family-name:var(--font-mono)] text-xs text-[#F0E6D3]/30">
        <div className="text-center">
          <div className="text-[#F0E6D3]/50">{thread.reply_count}</div>
          <div className="text-[10px] uppercase tracking-wider">replies</div>
        </div>
        <div className="text-center">
          <div className="text-[#F0E6D3]/50">{thread.view_count}</div>
          <div className="text-[10px] uppercase tracking-wider">views</div>
        </div>
        <div className="text-center min-w-[60px]">
          <div className="text-[#F0E6D3]/40">{timeAgo(thread.last_reply_at)}</div>
          <div className="text-[10px] uppercase tracking-wider">last reply</div>
        </div>
      </div>
    </Link>
  );
}
