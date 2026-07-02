"use client";

import { ForumThread } from "@/lib/types";
import ThreadListItem from "./ThreadListItem";

interface ThreadListProps {
  threads: ForumThread[];
  categorySlug: string;
  loading: boolean;
}

export default function ThreadList({
  threads,
  categorySlug,
  loading,
}: ThreadListProps) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
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
          Loading threads...
        </p>
      </div>
    );
  }

  if (threads.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-4xl mb-4">🔇</div>
        <p className="font-[family-name:var(--font-display)] text-[#F0E6D3]/50 text-lg uppercase tracking-wider">
          No threads yet
        </p>
        <p className="font-[family-name:var(--font-mono)] text-[#F0E6D3]/25 text-sm mt-2">
          Be the first to start a conversation.
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-[#3A2818]/30">
      {threads.map((thread) => (
        <ThreadListItem
          key={thread.id}
          thread={thread}
          categorySlug={categorySlug}
        />
      ))}
    </div>
  );
}
