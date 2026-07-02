"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";

interface ContactModalProps {
  listingId: string;
  listingTitle: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ContactModal({
  listingId,
  listingTitle,
  onClose,
  onSuccess,
}: ContactModalProps) {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim() || submitting) return;

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`/api/classifieds/${listingId}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: message.trim() }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to send message");
      }

      setSent(true);
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  if (!user) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="bg-[#1A0F0A] border border-[#3A2818] rounded-2xl p-6 max-w-md w-full">
          <p className="text-[#F0E6D3]/40 font-[family-name:var(--font-mono)] text-sm text-center">
            <a href="/login" className="text-[#D4A843] hover:text-[#E89B2E] transition-colors">
              Log in
            </a>{" "}
            to contact this listing.
          </p>
          <button
            onClick={onClose}
            className="mt-4 w-full text-[#F0E6D3]/40 hover:text-[#F0E6D3] font-[family-name:var(--font-mono)] text-sm py-2 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1A0F0A] border border-[#3A2818] rounded-2xl p-6 max-w-lg w-full relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#F0E6D3]/30 hover:text-[#F0E6D3] transition-colors cursor-pointer text-xl"
        >
          ×
        </button>

        {sent ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">✉️</div>
            <h3 className="font-[family-name:var(--font-display)] text-[#D4A843] text-lg uppercase tracking-wider mb-2">
              Message Sent
            </h3>
            <p className="font-[family-name:var(--font-mono)] text-[#F0E6D3]/40 text-sm mb-6">
              Your message has been delivered to the listing author.
            </p>
            <button
              onClick={onClose}
              className="btn-3d text-[#1A0F0A] font-[family-name:var(--font-display)] text-sm uppercase tracking-[0.1em] px-8 py-3 rounded-lg font-bold cursor-pointer"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <h3 className="font-[family-name:var(--font-display)] text-[#F0E6D3] text-lg uppercase tracking-wider mb-1 pr-8">
              Contact
            </h3>
            <p className="font-[family-name:var(--font-mono)] text-[#F0E6D3]/40 text-xs mb-4 truncate">
              Re: {listingTitle}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="text-red-400 text-sm font-[family-name:var(--font-mono)] bg-red-900/20 border border-red-900/30 rounded-lg px-4 py-2">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-[#F0E6D3]/50 font-[family-name:var(--font-mono)] text-xs uppercase tracking-wider mb-2">
                  Message
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Introduce yourself and describe your project..."
                  maxLength={5000}
                  rows={6}
                  className="w-full bg-[#0F0A07] border border-[#3A2818] rounded-lg px-4 py-3 text-[#F0E6D3] font-[family-name:var(--font-mono)] text-sm placeholder:text-[#F0E6D3]/20 focus:border-[#D4A843] focus:outline-none resize-none transition-colors"
                />
                <div className="text-right text-[10px] text-[#F0E6D3]/20 font-[family-name:var(--font-mono)] mt-1">
                  {message.length}/5000
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="text-[#F0E6D3]/40 hover:text-[#F0E6D3] font-[family-name:var(--font-mono)] text-sm px-6 py-2 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!message.trim() || submitting}
                  className="btn-3d text-[#1A0F0A] font-[family-name:var(--font-display)] text-sm uppercase tracking-[0.1em] px-8 py-3 rounded-lg font-bold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  {submitting ? "Sending..." : "Send Message"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
