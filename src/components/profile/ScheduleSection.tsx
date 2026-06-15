import { Submission } from "@/lib/types";

interface ScheduleSectionProps {
  submissions: Submission[];
}

export default function ScheduleSection({ submissions }: ScheduleSectionProps) {
  const scheduled = submissions.filter((s) => s.episode_id);

  if (scheduled.length === 0) return null;

  return (
    <div className="space-y-3">
      {scheduled.map((sub) => (
        <div
          key={sub.id}
          className="flex items-center gap-4 p-4 rounded-xl border border-[#3A2818]/40 bg-[#0F0A07]/40"
        >
          <span className="text-lg">📅</span>
          <div className="flex-1">
            <p className="font-[family-name:var(--font-display)] text-[#F0E6D3] tracking-wide">
              {sub.track_title || "Untitled Track"}
            </p>
            <p className="text-[#F0E6D3]/30 font-[family-name:var(--font-mono)] text-xs tracking-wider mt-1">
              Episode assigned · Status: {sub.status.replace("_", " ")}
            </p>
          </div>
          <span className="text-[#D4A843]/60 font-[family-name:var(--font-mono)] text-xs tracking-wider capitalize">
            {sub.status}
          </span>
        </div>
      ))}
    </div>
  );
}
