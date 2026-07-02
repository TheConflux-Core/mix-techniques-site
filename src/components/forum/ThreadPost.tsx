"use client";

import { ForumThread } from "@/lib/types";
import VoteControls from "./VoteControls";

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "";
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

function memberSince(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

interface ThreadPostProps {
  thread: ForumThread;
  isOwner: boolean;
  onEdit?: () => void;
}

export default function ThreadPost({ thread, isOwner, onEdit }: ThreadPostProps) {
  return (
    <div className="card-float noise carbon-fiber-walnut rounded-2xl overflow-hidden">
      {/* Thread title bar */}
      <div className="px-6 py-4 border-b border-[#3A2818]/30 flex items-center gap-3">
        {thread.is_pinned && (
          <span title="Pinned" className="text-sm">
            📌
          </span>
        )}
        {thread.is_locked && (
          <span
            title="Locked"
            className="text-xs bg-[#3A2818]/40 text-[#F0E6D3]/40 px-2 py-0.5 rounded-full border border-[#3A2818]/50"
          >
            🔒 Locked
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
        <h1 className="font-[family-name:var(--font-display)] text-xl md:text-2xl text-[#F0E6D3] uppercase tracking-wider font-bold flex-1">
          {thread.title}
        </h1>
      </div>

      <div className="flex">
        {/* Vote controls */}
        <div className="flex-shrink-0 p-4 border-r border-[#3A2818]/20">
          <VoteControls
            targetType="thread"
            targetId={thread.id}
            score={thread.vote_score}
            userVote={thread.user_vote}
          />
        </div>

        {/* Content area */}
        <div className="flex-1 p-6">
          {/* Author card */}
          {thread.author && (
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-[#3A2818]/20">
              {thread.author.avatar_url ? (
                <img
                  src={thread.author.avatar_url}
                  alt=""
                  className="w-10 h-10 rounded-full border border-[#3A2818]"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#3A2818] flex items-center justify-center text-[#F0E6D3]/30 text-sm">
                  🎧
                </div>
              )}
              <div>
                <div className="font-[family-name:var(--font-display)] text-[#F0E6D3] text-sm uppercase tracking-wider">
                  {thread.author.display_name}
                </div>
                <div className="font-[family-name:var(--font-mono)] text-[#F0E6D3]/25 text-[10px]">
                  Member since {memberSince(thread.author.created_at)}
                </div>
              </div>
              <div className="ml-auto font-[family-name:var(--font-mono)] text-[#F0E6D3]/20 text-[10px]">
                Posted {timeAgo(thread.created_at)}
              </div>
            </div>
          )}

          {/* Thread body */}
          <div className="font-[family-name:var(--font-mono)] text-[#F0E6D3]/80 text-sm leading-relaxed whitespace-pre-wrap break-words">
            {thread.body}
          </div>

          {/* Bottom bar */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-[#3A2818]/20">
            <div className="font-[family-name:var(--font-mono)] text-[#F0E6D3]/20 text-[10px] flex items-center gap-3">
              <span>{thread.view_count} views</span>
              <span>·</span>
              <span>{thread.reply_count} replies</span>
            </div>
            {isOwner && onEdit && (
              <button
                onClick={onEdit}
                className="text-[#F0E6D3]/30 hover:text-[#D4A843] font-[family-name:var(--font-mono)] text-xs uppercase tracking-wider transition-colors"
              >
                Edit
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
