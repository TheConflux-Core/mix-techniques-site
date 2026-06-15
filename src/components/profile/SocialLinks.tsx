interface SocialLinksProps {
  links: {
    instagram?: string;
    twitter?: string;
    tiktok?: string;
    youtube?: string;
    soundcloud?: string;
  };
}

const PLATFORM_CONFIG: Record<string, { label: string; icon: string; baseUrl: string }> = {
  instagram: { label: "Instagram", icon: "📷", baseUrl: "https://instagram.com/" },
  twitter: { label: "Twitter/X", icon: "𝕏", baseUrl: "https://x.com/" },
  tiktok: { label: "TikTok", icon: "♪", baseUrl: "https://tiktok.com/@" },
  youtube: { label: "YouTube", icon: "▶", baseUrl: "https://youtube.com/" },
  soundcloud: { label: "SoundCloud", icon: "☁", baseUrl: "https://soundcloud.com/" },
};

export default function SocialLinks({ links }: SocialLinksProps) {
  const activeLinks = Object.entries(links).filter(
    ([, value]) => value && value.trim() !== ""
  );

  if (activeLinks.length === 0) return null;

  const getHref = (platform: string, value: string) => {
    if (value.startsWith("http")) return value;
    return PLATFORM_CONFIG[platform]?.baseUrl + value;
  };

  return (
    <div className="flex flex-wrap gap-3">
      {activeLinks.map(([platform, value]) => {
        const config = PLATFORM_CONFIG[platform];
        if (!config) return null;
        return (
          <a
            key={platform}
            href={getHref(platform, value!)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#3A2818]/60 bg-[#0F0A07]/50 text-[#F0E6D3]/50 hover:text-[#D4A843] hover:border-[#D4A843]/30 transition-all duration-300 font-[family-name:var(--font-mono)] text-xs tracking-wider"
          >
            <span className="text-sm">{config.icon}</span>
            <span>{config.label}</span>
          </a>
        );
      })}
    </div>
  );
}
