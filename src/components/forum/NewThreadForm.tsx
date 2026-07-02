"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";

interface NewThreadFormProps {
  categoryId: string;
  onSuccess?: (thread: { slug: string; category_slug?: string }) => void;
  onCancel?: () => void;
}

const MAX_TITLE = 200;
const MAX_BODY = 10000;

export default function NewThreadForm({
  categoryId,
  onSuccess,
  onCancel,
}: NewThreadFormProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim() || submitting) return;

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
      onSuccess?.(thread);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-[#F0E6D3]/40 font-[family-name:var(--font-mono)] text-sm">
          <a
            href="/login"
            className="text-[#D4A843] hover:text-[#E89B2E] transition-colors"
          >
            Log in
          </a>{" "}
          to start a new thread.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="text-red-400 text-sm font-[family-name:var(--font-mono)] bg-red-900/20 border border-red-900/30 rounded-lg px-4 py-2">
          {error}
        </div>
      )}

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
          placeholder="Share the details..."
          maxLength={MAX_BODY}
          rows={8}
          className="w-full bg-[#0F0A07] border border-[#3A2818] rounded-lg px-4 py-3 text-[#F0E6D3] font-[family-name:var(--font-mono)] text-sm placeholder:text-[#F0E6D3]/20 focus:border-[#D4A843] focus:outline-none resize-none transition-colors"
        />
        <div className="text-right text-[10px] text-[#F0E6D3]/20 font-[family-name:var(--font-mono)] mt-1">
          {body.length}/{MAX_BODY}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-[#F0E6D3]/40 hover:text-[#F0E6D3] font-[family-name:var(--font-mono)] text-sm px-6 py-2 transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={!title.trim() || !body.trim() || submitting}
          className="btn-3d text-[#1A0F0A] font-[family-name:var(--font-display)] text-sm uppercase tracking-[0.1em] px-8 py-3 rounded-lg font-bold disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {submitting ? "Creating..." : "Create Thread"}
        </button>
      </div>
    </form>
  );
}
