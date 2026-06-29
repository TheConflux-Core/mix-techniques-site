import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Release Forms — Mix Techniques",
  description: "Broadcast and Likeness release forms for Mix Techniques contestants.",
};

export default function ReleasePage() {
  return (
    <div className="flex flex-col min-h-screen page-enter">
      <div className="fixed inset-0 carbon-fiber pointer-events-none" />
      <div className="fixed inset-0 warm-light-bg pointer-events-none opacity-30" />

      <main className="flex-1 px-6 py-16 md:py-24 relative z-10">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <p className="font-[family-name:var(--font-mono)] text-[#D4A843]/60 text-xs tracking-[0.4em] uppercase mb-4">
              Legal
            </p>
            <h1 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl text-[#F0E6D3] uppercase tracking-[0.15em] font-bold mb-4">
              Release Forms
            </h1>
            <p className="font-[family-name:var(--font-mono)] text-[#F0E6D3]/40 text-sm max-w-lg mx-auto leading-relaxed">
              Both releases are accepted as part of the submission process. By submitting your mix, you agree to both forms below.
            </p>
          </div>

          {/* Form A: Broadcast Release */}
          <div className="card-float noise carbon-fiber-walnut rounded-2xl p-6 md:p-10 relative overflow-hidden mb-8">
            <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: "linear-gradient(90deg, transparent, #D4A843, transparent)", opacity: 0.3 }} />

            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #D4A843 0%, #B8862D 100%)" }}>
                <span className="font-[family-name:var(--font-display)] text-[#1A0F0A] text-sm font-bold">A</span>
              </div>
              <div>
                <h2 className="font-[family-name:var(--font-display)] text-xl text-[#F0E6D3] uppercase tracking-[0.08em] font-bold">
                  Broadcast Release
                </h2>
                <p className="font-[family-name:var(--font-mono)] text-[#D4A843]/60 text-[10px] tracking-[0.2em] uppercase">
                  Audio + Likeness
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="font-[family-name:var(--font-display)] text-base text-[#F0E6D3] uppercase tracking-[0.05em] font-bold mb-2">1. Audio Rights</h3>
                <p className="font-[family-name:var(--font-mono)] text-[#F0E6D3]/50 text-sm leading-relaxed">
                  You grant Mix Techniques the perpetual, worldwide, royalty-free right to record, reproduce, broadcast, stream, publish, distribute, and display your musical performance, mix, vocal performance, and all audio content submitted in connection with the show — including any critique, playback, or review of your track. This includes the right to sync your audio with video.
                </p>
              </div>

              <div>
                <h3 className="font-[family-name:var(--font-display)] text-base text-[#F0E6D3] uppercase tracking-[0.05em] font-bold mb-2">2. Likeness Rights</h3>
                <p className="font-[family-name:var(--font-mono)] text-[#F0E6D3]/50 text-sm leading-relaxed">
                  You grant the right to use your name, photograph, video likeness, voice, biographical information, and social media handles in connection with the show — including episode broadcasts, promotional clips (YouTube Shorts, TikTok, Instagram Reels), the show website, social media accounts, and marketing materials.
                </p>
              </div>

              <div>
                <h3 className="font-[family-name:var(--font-display)] text-base text-[#F0E6D3] uppercase tracking-[0.05em] font-bold mb-2">3. Social Media &amp; Credit</h3>
                <p className="font-[family-name:var(--font-mono)] text-[#F0E6D3]/50 text-sm leading-relaxed">
                  You authorize us to tag your social media accounts when promotional clips are posted. You will receive on-screen credit as &ldquo;Contestant&rdquo; during your segment, including your name and location.
                </p>
              </div>

              <div>
                <h3 className="font-[family-name:var(--font-display)] text-base text-[#F0E6D3] uppercase tracking-[0.05em] font-bold mb-2">4. Ownership &amp; Compensation</h3>
                <p className="font-[family-name:var(--font-mono)] text-[#F0E6D3]/50 text-sm leading-relaxed">
                  <strong className="text-[#F0E6D3]/70">You retain 100% ownership of your original track.</strong> Mix Techniques does not claim copyright in your underlying musical work. Participation is voluntary and uncompensated unless otherwise agreed in writing.
                </p>
              </div>

              <div>
                <h3 className="font-[family-name:var(--font-display)] text-base text-[#F0E6D3] uppercase tracking-[0.05em] font-bold mb-2">5. Clips &amp; Promotional Use</h3>
                <p className="font-[family-name:var(--font-mono)] text-[#F0E6D3]/50 text-sm leading-relaxed">
                  Short-form highlight clips (up to 60 seconds) may be created and distributed indefinitely for promotional purposes. Clips will not exceed 60 seconds without written consent.
                </p>
              </div>

              <div>
                <h3 className="font-[family-name:var(--font-display)] text-base text-[#F0E6D3] uppercase tracking-[0.05em] font-bold mb-2">6. Term &amp; Scope</h3>
                <p className="font-[family-name:var(--font-mono)] text-[#F0E6D3]/50 text-sm leading-relaxed">
                  Worldwide. Perpetual. Broadcast, streaming, and clip rights survive cancellation of the show.
                </p>
              </div>
            </div>
          </div>

          {/* Form B: Likeness Release */}
          <div className="card-float noise carbon-fiber-walnut rounded-2xl p-6 md:p-10 relative overflow-hidden mb-8">
            <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: "linear-gradient(90deg, transparent, #D4A843, transparent)", opacity: 0.3 }} />

            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #D4A843 0%, #B8862D 100%)" }}>
                <span className="font-[family-name:var(--font-display)] text-[#1A0F0A] text-sm font-bold">B</span>
              </div>
              <div>
                <h2 className="font-[family-name:var(--font-display)] text-xl text-[#F0E6D3] uppercase tracking-[0.08em] font-bold">
                  Likeness Release
                </h2>
                <p className="font-[family-name:var(--font-mono)] text-[#D4A843]/60 text-[10px] tracking-[0.2em] uppercase">
                  Name / Bio / Handles
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="font-[family-name:var(--font-display)] text-base text-[#F0E6D3] uppercase tracking-[0.05em] font-bold mb-2">1. Name &amp; Bio Use</h3>
                <p className="font-[family-name:var(--font-mono)] text-[#F0E6D3]/50 text-sm leading-relaxed">
                  You authorize the use of your full legal name, stage name, city/state/country, genre classification, short bio, and links to your social media and streaming profiles.
                </p>
              </div>

              <div>
                <h3 className="font-[family-name:var(--font-display)] text-base text-[#F0E6D3] uppercase tracking-[0.05em] font-bold mb-2">2. Directory Listing</h3>
                <p className="font-[family-name:var(--font-mono)] text-[#F0E6D3]/50 text-sm leading-relaxed">
                  You authorize your name and track title to appear in a public episode directory on the show website, indefinitely.
                </p>
              </div>

              <div>
                <h3 className="font-[family-name:var(--font-display)] text-base text-[#F0E6D3] uppercase tracking-[0.05em] font-bold mb-2">3. Contact &amp; Opt-Out</h3>
                <p className="font-[family-name:var(--font-mono)] text-[#F0E6D3]/50 text-sm leading-relaxed">
                  Your email is used for episode status updates, score results, and one follow-up from Mixing School (you may unsubscribe). You may request removal of your likeness from promotional clips by contacting us.
                </p>
              </div>

              <div>
                <h3 className="font-[family-name:var(--font-display)] text-base text-[#F0E6D3] uppercase tracking-[0.05em] font-bold mb-2">4. Data Retention</h3>
                <p className="font-[family-name:var(--font-mono)] text-[#F0E6D3]/50 text-sm leading-relaxed">
                  Submission data retained for show archive, score tracking, and Mixing School funnel. Retained until you request deletion or 10 years, whichever comes first.
                </p>
              </div>
            </div>
          </div>

          {/* Important Notes */}
          <div className="card-float noise rounded-2xl p-6 md:p-8 carbon-fiber-walnut relative overflow-hidden mb-8">
            <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: "linear-gradient(90deg, transparent, #C4392A, transparent)", opacity: 0.3 }} />
            <h3 className="font-[family-name:var(--font-display)] text-lg text-[#F0E6D3] uppercase tracking-[0.08em] font-bold mb-4">Important Notes</h3>
            <div className="font-[family-name:var(--font-mono)] text-[#F0E6D3]/50 text-sm leading-relaxed space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-[#D4A843] mt-0.5">▸</span>
                <span><strong className="text-[#F0E6D3]/70">You own your music.</strong> These releases grant broadcast and promotional rights only. We do not claim ownership of your original work.</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-[#D4A843] mt-0.5">▸</span>
                <span><strong className="text-[#F0E6D3]/70">Parental consent required for minors.</strong> If you are under 18, a parent or guardian must co-sign.</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-[#D4A843] mt-0.5">▸</span>
                <span><strong className="text-[#F0E6D3]/70">These forms are drafts.</strong> They are pending review by qualified counsel before the first official episode. Terms may be updated.</span>
              </div>
            </div>
          </div>

          {/* Back link */}
          <div className="text-center">
            <Link href="/" className="font-[family-name:var(--font-mono)] text-xs text-[#D4A843]/50 tracking-[0.15em] uppercase hover:text-[#D4A843] transition-colors">
              ← Back to Home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
