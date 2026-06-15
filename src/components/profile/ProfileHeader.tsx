import SocialLinks from "./SocialLinks";

interface ProfileHeaderProps {
  profile: {
    display_name: string;
    avatar_url: string | null;
    bio: string | null;
    location: string | null;
    genre: string | null;
    website: string | null;
    social_links: {
      instagram?: string;
      twitter?: string;
      tiktok?: string;
      youtube?: string;
      soundcloud?: string;
    };
  };
  isOwner: boolean;
}

const GENRE_LABELS: Record<string, string> = {
  songwriter: "Songwriter",
  producer: "Producer",
  mix_engineer: "Mix Engineer",
  multi: "Multi-Discipline",
};

export default function ProfileHeader({ profile, isOwner }: ProfileHeaderProps) {
  const initial = profile.display_name?.charAt(0)?.toUpperCase() || "?";

  return (
    <div className="flex flex-col md:flex-row items-start gap-6">
      {/* Avatar */}
      <div className="relative group">
        {profile.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt={profile.display_name}
            className="w-[120px] h-[120px] rounded-full object-cover border-2 border-[#3A2818] transition-all duration-300 group-hover:border-[#D4A843]/40 group-hover:shadow-[0_0_20px_rgba(212,168,67,0.15)]"
          />
        ) : (
          <div className="w-[120px] h-[120px] rounded-full border-2 border-[#3A2818] flex items-center justify-center text-4xl font-bold font-[family-name:var(--font-display)] transition-all duration-300 group-hover:border-[#D4A843]/40 group-hover:shadow-[0_0_20px_rgba(212,168,67,0.15)]"
            style={{
              background: "linear-gradient(135deg, #D4A843 0%, #B8862D 50%, #E89B2E 100%)",
              color: "#1A0F0A",
            }}
          >
            {initial}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-4 mb-2">
          <h1 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl text-[#F0E6D3] uppercase tracking-wider font-bold heading-wave">
            {profile.display_name}
          </h1>
          {isOwner && (
            <a
              href={`/${profile.display_name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}/edit`}
              className="text-xs font-[family-name:var(--font-mono)] text-[#D4A843]/60 hover:text-[#D4A843] border border-[#3A2818]/60 px-3 py-1.5 rounded-lg hover:border-[#D4A843]/30 transition-all tracking-wider"
            >
              Edit Profile
            </a>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[#F0E6D3]/40 font-[family-name:var(--font-mono)] text-xs tracking-wider mb-4">
          <span>@{profile.display_name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}</span>
          {profile.location && (
            <>
              <span className="text-[#3A2818]">·</span>
              <span>{profile.location}</span>
            </>
          )}
          {profile.genre && (
            <>
              <span className="text-[#3A2818]">·</span>
              <span className="text-[#D4A843]/70">{GENRE_LABELS[profile.genre] || profile.genre}</span>
            </>
          )}
        </div>

        {profile.bio && (
          <p className="text-[#F0E6D3]/60 font-[family-name:var(--font-mono)] text-sm leading-relaxed mb-4 max-w-xl">
            &ldquo;{profile.bio}&rdquo;
          </p>
        )}

        {profile.website && (
          <a
            href={profile.website.startsWith("http") ? profile.website : `https://${profile.website}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[#D4A843]/70 hover:text-[#D4A843] font-[family-name:var(--font-mono)] text-xs tracking-wider transition-colors mb-4"
          >
            🔗 {profile.website}
          </a>
        )}

        <SocialLinks links={profile.social_links || {}} />
      </div>
    </div>
  );
}
