"use client";

import { useState } from "react";
import { ForumReply } from "@/lib/types";
import VoteControls from "./VoteControls";
import ReplyForm from "./ReplyForm";

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

interface ReplyCardProps {
  reply: ForumReply;
  threadId: string;
  threadAuthorId?: string;
  currentUserId?: string;
  onReplyPosted?: () => void;
  depth?: number;
}

export default function ReplyCard({
  reply,
  threadId,
  threadAuthorId,
  currentUserId,
  onReplyPosted,
  depth = 0,
}: ReplyCardProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [solutionLoading, setSolutionLoading] = useState(false);

  const isThreadAuthor = currentUserId === threadAuthorId;

  async function handleMarkSolution() {
    if (!isThreadAuthor || solutionLoading) return;
    setSolutionLoading(true);
    try {
      const res = await fetch(`/api/forum/replies/${reply.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_solution: !reply.is_solution }),
      });
      if (res.ok) onReplyPosted?.();
    } catch (err) {
      console.error("Failed to toggle solution:", err);
    } finally {
      setSolutionLoading(false);
    }
  }

  return (
    <div className={depth > 0 ? "ml-8 border-l-2 border-[#3A2818]/30 pl-4" : ""}>
      <div
        className={`flex gap-3 p-4 rounded-xl transition-colors ${
          reply.is_solution
            ? "bg-green-900/10 border border-green-800/20"
            : "hover:bg-[#2A1810]/20"
        }`}
      >
        {/* Vote controls */}
        <div className="flex-shrink-0 pt-1">
          <VoteControls
            targetType="reply"
            targetId={reply.id}
            score={reply.vote_score}
            userVote={reply.user_vote}
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Author line */}
          <div className="flex items-center gap-2 mb-2">
            {reply.author?.avatar_url ? (
              <img
                src={reply.author.avatar_url}
                alt=""
                className="w-6 h-6 rounded-full border border-[#3A2818]"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-[#3A2818] flex items-center justify-center text-[#F0E6D3]/30 text-[10px]">
                🎧
              </div>
            )}
            <span className="font-[family-name:var(--font-display)] text-[#F0E6D3] text-xs uppercase tracking-wider">
              {reply.author?.display_name || "Unknown"}
            </span>
            <span className="font-[family-name:var(--font-mono)] text-[#F0E6D3]/20 text-[10px]">
              {timeAgo(reply.created_at)}
            </span>
            {reply.is_solution && (
              <span className="text-xs bg-green-900/30 text-green-400 px-2 py-0.5 rounded-full border border-green-800/30 font-[family-name:var(--font-mono)]">
                ✅ Solution
              </span>
            )}
          </div>

          {/* Body */}
          <div className="font-[family-name:var(--font-mono)] text-[#F0E6D3]/75 text-sm leading-relaxed whitespace-pre-wrap break-words">
            {reply.body}
          </div>

          {/* Action bar */}
          <div className="flex items-center gap-4 mt-3">
            {currentUserId && !reply.parent_id && (
              <button
                onClick={() => setShowReplyForm(!showReplyForm)}
                className="text-[#F0E6D3]/30 hover:text-[#D4A843] font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-wider transition-colors"
              >
                Reply
              </button>
            )}
            {isThreadAuthor && (
              <button
                onClick={handleMarkSolution}
                disabled={solutionLoading}
                className={`font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-wider transition-colors ${
                  reply.is_solution
                    ? "text-green-400 hover:text-green-300"
                    : "text-[#F0E6D3]/30 hover:text-green-400"
                }`}
              >
                {reply.is_solution ? "Unmark Solution" : "Mark as Solution"}
              </button>
            )}
          </div>

          {/* Inline reply form */}
          {showReplyForm && (
            <div className="mt-4">
              <ReplyForm
                threadId={threadId}
                parentId={reply.id}
                compact
                onSuccess={() => {
                  setShowReplyForm(false);
                  onReplyPosted?.();
                }}
                onCancel={() => setShowReplyForm(false)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Nested children */}
      {reply.children && reply.children.length > 0 && (
        <div className="mt-2 space-y-2">
          {reply.children.map((child) => (
            <ReplyCard
              key={child.id}
              reply={child}
              threadId={threadId}
              threadAuthorId={threadAuthorId}
              currentUserId={currentUserId}
              onReplyPosted={onReplyPosted}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
