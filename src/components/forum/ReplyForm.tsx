"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";

interface ReplyFormProps {
  threadId: string;
  parentId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  compact?: boolean;
}

const MAX_BODY = 10000;

export default function ReplyForm({
  threadId,
  parentId,
  onSuccess,
  onCancel,
  compact = false,
}: ReplyFormProps) {
  const { user } = useAuth();
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim() || submitting) return;

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`/api/forum/threads/${threadId}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body: body.trim(),
          parent_id: parentId || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to post reply");
      }

      setBody("");
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  if (!user) {
    return (
      <div className="text-center py-6 border border-[#3A2818]/50 rounded-xl">
        <p className="text-[#F0E6D3]/40 font-[family-name:var(--font-mono)] text-sm">
          <a href="/login" className="text-[#D4A843] hover:text-[#E89B2E] transition-colors">
            Log in
          </a>{" "}
          to join the conversation.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && (
        <div className="text-red-400 text-sm font-[family-name:var(--font-mono)] bg-red-900/20 border border-red-900/30 rounded-lg px-4 py-2">
          {error}
        </div>
      )}

      <div className="relative">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={parentId ? "Write your reply..." : "Share your thoughts..."}
          maxLength={MAX_BODY}
          rows={compact ? 3 : 5}
          className="w-full bg-[#0F0A07] border border-[#3A2818] rounded-lg px-4 py-3 text-[#F0E6D3] font-[family-name:var(--font-mono)] text-sm placeholder:text-[#F0E6D3]/20 focus:border-[#D4A843] focus:outline-none resize-none transition-colors"
        />
        <div className="absolute bottom-3 right-3 text-[10px] text-[#F0E6D3]/20 font-[family-name:var(--font-mono)]">
          {body.length}/{MAX_BODY}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-[#F0E6D3]/20 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-wider">
          Markdown not supported · Line breaks preserved
        </p>
        <div className="flex items-center gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="text-[#F0E6D3]/40 hover:text-[#F0E6D3] font-[family-name:var(--font-mono)] text-sm px-4 py-2 transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={!body.trim() || submitting}
            className="btn-3d text-[#1A0F0A] font-[family-name:var(--font-display)] text-sm uppercase tracking-[0.1em] px-6 py-2 rounded-lg font-bold disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? "Posting..." : parentId ? "Reply" : "Post Reply"}
          </button>
        </div>
      </div>
    </form>
  );
}
