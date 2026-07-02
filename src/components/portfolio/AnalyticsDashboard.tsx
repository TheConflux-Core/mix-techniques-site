"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface AnalyticsData {
  viewsWeek: number;
  viewsMonth: number;
  totalPlays: number;
  topTracks: { id: string; title: string; play_count: number; download_count: number }[];
  referrers: { source: string; count: number }[];
  viewsByDay: Record<string, number>;
}

export default function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const supabase = createClient();

  useEffect(() => {
    async function fetchAnalytics() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch("/api/portfolio/analytics");
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error);
        }
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load analytics");
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-[#F0E6D3]/30 font-[family-name:var(--font-mono)] text-xs">Loading analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-400 font-[family-name:var(--font-mono)] text-sm">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  // Prepare daily chart data (last 14 days)
  const last14: { date: string; count: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    last14.push({ date: key, count: data.viewsByDay[key] || 0 });
  }
  const maxViews = Math.max(...last14.map((d) => d.count), 1);

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Views (7d)", value: data.viewsWeek, icon: "👁️" },
          { label: "Views (30d)", value: data.viewsMonth, icon: "📊" },
          { label: "Plays (30d)", value: data.totalPlays, icon: "▶️" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-[#1A0F0A]/80 border border-[#3A2818]/40 rounded-xl p-4 text-center"
          >
            <div className="text-xl mb-1">{stat.icon}</div>
            <div className="font-[family-name:var(--font-display)] text-2xl text-[#D4A843]">
              {stat.value}
            </div>
            <div className="font-[family-name:var(--font-mono)] text-[10px] text-[#F0E6D3]/40 uppercase tracking-wider">
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Views chart */}
      <div>
        <h4 className="font-[family-name:var(--font-mono)] text-xs text-[#F0E6D3]/50 uppercase tracking-wider mb-3">
          Views — Last 14 Days
        </h4>
        <div className="flex items-end gap-1 h-24">
          {last14.map((day) => (
            <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full rounded-t-sm bg-gradient-to-t from-[#D4A843] to-[#E89B2E] transition-all duration-300"
                style={{ height: `${(day.count / maxViews) * 100}%`, minHeight: day.count > 0 ? 4 : 0 }}
              />
              <span className="font-[family-name:var(--font-mono)] text-[8px] text-[#F0E6D3]/20">
                {day.date.slice(8)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Top tracks */}
      {data.topTracks.length > 0 && (
        <div>
          <h4 className="font-[family-name:var(--font-mono)] text-xs text-[#F0E6D3]/50 uppercase tracking-wider mb-3">
            Top Tracks
          </h4>
          <div className="space-y-2">
            {data.topTracks.map((track, i) => (
              <div
                key={track.id}
                className="flex items-center gap-3 bg-[#1A0F0A]/60 border border-[#3A2818]/30 rounded-lg px-4 py-2"
              >
                <span className="font-[family-name:var(--font-mono)] text-xs text-[#D4A843] w-5">
                  {i + 1}.
                </span>
                <span className="flex-1 font-[family-name:var(--font-mono)] text-sm text-[#F0E6D3]/70 truncate">
                  {track.title}
                </span>
                <span className="font-[family-name:var(--font-mono)] text-xs text-[#F0E6D3]/40">
                  ▶ {track.play_count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Referrers */}
      {data.referrers.length > 0 && (
        <div>
          <h4 className="font-[family-name:var(--font-mono)] text-xs text-[#F0E6D3]/50 uppercase tracking-wider mb-3">
            Top Referrers
          </h4>
          <div className="space-y-2">
            {data.referrers.map((ref) => (
              <div
                key={ref.source}
                className="flex items-center justify-between bg-[#1A0F0A]/60 border border-[#3A2818]/30 rounded-lg px-4 py-2"
              >
                <span className="font-[family-name:var(--font-mono)] text-sm text-[#F0E6D3]/70 truncate">
                  {ref.source}
                </span>
                <span className="font-[family-name:var(--font-mono)] text-xs text-[#D4A843]">
                  {ref.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
