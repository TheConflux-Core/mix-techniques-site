import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — Mix Techniques",
  description: "Privacy Policy for Mix Techniques.",
};

export default function PrivacyPage() {
  return (
    <div className="flex flex-col min-h-screen page-enter">
      <div className="fixed inset-0 carbon-fiber pointer-events-none" />
      <div className="fixed inset-0 warm-light-bg pointer-events-none opacity-30" />

      <main className="flex-1 px-6 py-16 md:py-24 relative z-10">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <p className="font-[family-name:var(--font-mono)] text-[#D4A843]/60 text-xs tracking-[0.4em] uppercase mb-4">Legal</p>
            <h1 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl text-[#F0E6D3] uppercase tracking-[0.15em] font-bold mb-4">Privacy Policy</h1>
            <p className="font-[family-name:var(--font-mono)] text-[#F0E6D3]/30 text-xs tracking-wider">Last updated: June 2026</p>
          </div>

          <div className="card-float noise carbon-fiber-walnut rounded-2xl p-6 md:p-10 relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-[1px] bg-gradient-to-r from-transparent via-[#D4A843]/30 to-transparent" />

            <div className="space-y-8">
              <section>
                <h2 className="font-[family-name:var(--font-display)] text-xl text-[#F0E6D3] uppercase tracking-[0.08em] font-bold mb-3">1. Information We Collect</h2>
                <div className="font-[family-name:var(--font-mono)] text-[#F0E6D3]/50 text-sm leading-relaxed space-y-3">
                  <p><strong className="text-[#F0E6D3]/70">Account Information:</strong> When you register, we collect your email address, display name, and optional profile information (avatar, social links).</p>
                  <p><strong className="text-[#F0E6D3]/70">Submission Data:</strong> When you submit a mix, we collect your name, email, location, genre, bio, social media handles, and the audio file you upload.</p>
                  <p><strong className="text-[#F0E6D3]/70">Voting Data:</strong> When you vote during live episodes, we record your scores and timestamps.</p>
                  <p><strong className="text-[#F0E6D3]/70">Usage Data:</strong> We collect standard web analytics (page views, device type, browser) via privacy-respecting analytics tools.</p>
                </div>
              </section>

              <section>
                <h2 className="font-[family-name:var(--font-display)] text-xl text-[#F0E6D3] uppercase tracking-[0.08em] font-bold mb-3">2. How We Use Your Information</h2>
                <div className="font-[family-name:var(--font-mono)] text-[#F0E6D3]/50 text-sm leading-relaxed space-y-3">
                  <ul className="list-none space-y-2 ml-4">
                    <li className="flex items-start gap-3"><span className="text-[#D4A843] mt-1">▸</span><span>To operate the show: process submissions, manage episodes, calculate scores.</span></li>
                    <li className="flex items-start gap-3"><span className="text-[#D4A843] mt-1">▸</span><span>To broadcast your content: as described in the Broadcast Release you accept during submission.</span></li>
                    <li className="flex items-start gap-3"><span className="text-[#D4A843] mt-1">▸</span><span>To communicate: episode status updates, score results, and one follow-up from Mixing School (you may unsubscribe).</span></li>
                    <li className="flex items-start gap-3"><span className="text-[#D4A843] mt-1">▸</span><span>To improve the platform: aggregated analytics help us understand what&apos;s working.</span></li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="font-[family-name:var(--font-display)] text-xl text-[#F0E6D3] uppercase tracking-[0.08em] font-bold mb-3">3. Data Storage &amp; Security</h2>
                <p className="font-[family-name:var(--font-mono)] text-[#F0E6D3]/50 text-sm leading-relaxed">
                  Your data is stored on Supabase (PostgreSQL) infrastructure with encryption at rest and in transit. Audio files are stored in Supabase Storage. We implement standard security measures but cannot guarantee absolute security. No system is 100% secure.
                </p>
              </section>

              <section>
                <h2 className="font-[family-name:var(--font-display)] text-xl text-[#F0E6D3] uppercase tracking-[0.08em] font-bold mb-3">4. Data Sharing</h2>
                <div className="font-[family-name:var(--font-mono)] text-[#F0E6D3]/50 text-sm leading-relaxed space-y-3">
                  <p>We do not sell your personal data. We share data only in these cases:</p>
                  <ul className="list-none space-y-2 ml-4">
                    <li className="flex items-start gap-3"><span className="text-[#D4A843] mt-1">▸</span><span><strong className="text-[#F0E6D3]/70">Public content:</strong> Your name, location, genre, bio, and social handles are displayed publicly as part of the show (per the Likeness Release).</span></li>
                    <li className="flex items-start gap-3"><span className="text-[#D4A843] mt-1">▸</span><span><strong className="text-[#F0E6D3]/70">Episode distribution:</strong> Your audio and likeness are distributed on YouTube, Twitch, Spotify, Apple Podcasts, and other platforms as described in the Broadcast Release.</span></li>
                    <li className="flex items-start gap-3"><span className="text-[#D4A843] mt-1">▸</span><span><strong className="text-[#F0E6D3]/70">Legal requirements:</strong> We may disclose data if required by law or to protect our rights.</span></li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="font-[family-name:var(--font-display)] text-xl text-[#F0E6D3] uppercase tracking-[0.08em] font-bold mb-3">5. Cookies</h2>
                <p className="font-[family-name:var(--font-mono)] text-[#F0E6D3]/50 text-sm leading-relaxed">
                  We use essential cookies for authentication (Supabase Auth). We do not use third-party advertising cookies. Analytics are handled by privacy-respecting tools that do not track individual users across sites.
                </p>
              </section>

              <section>
                <h2 className="font-[family-name:var(--font-display)] text-xl text-[#F0E6D3] uppercase tracking-[0.08em] font-bold mb-3">6. Your Rights</h2>
                <div className="font-[family-name:var(--font-mono)] text-[#F0E6D3]/50 text-sm leading-relaxed space-y-3">
                  <ul className="list-none space-y-2 ml-4">
                    <li className="flex items-start gap-3"><span className="text-[#D4A843] mt-1">▸</span><span><strong className="text-[#F0E6D3]/70">Access:</strong> Request a copy of the data we hold about you.</span></li>
                    <li className="flex items-start gap-3"><span className="text-[#D4A843] mt-1">▸</span><span><strong className="text-[#F0E6D3]/70">Deletion:</strong> Request deletion of your account and personal data. Note: broadcast episodes containing your segment may remain published as described in the Broadcast Release.</span></li>
                    <li className="flex items-start gap-3"><span className="text-[#D4A843] mt-1">▸</span><span><strong className="text-[#F0E6D3]/70">Opt-out:</strong> Unsubscribe from emails at any time. Request removal from promotional clips.</span></li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="font-[family-name:var(--font-display)] text-xl text-[#F0E6D3] uppercase tracking-[0.08em] font-bold mb-3">7. GDPR (EU Users)</h2>
                <p className="font-[family-name:var(--font-mono)] text-[#F0E6D3]/50 text-sm leading-relaxed">
                  If you are in the European Union, you have additional rights under GDPR including the right to data portability, the right to restrict processing, and the right to lodge a complaint with a supervisory authority. Our legal basis for processing is your consent (accepted during submission) and legitimate interest (operating the show).
                </p>
              </section>

              <section>
                <h2 className="font-[family-name:var(--font-display)] text-xl text-[#F0E6D3] uppercase tracking-[0.08em] font-bold mb-3">8. Data Retention</h2>
                <p className="font-[family-name:var(--font-mono)] text-[#F0E6D3]/50 text-sm leading-relaxed">
                  Submission data is retained for show archive, score tracking, and Mixing School funnel purposes. Retained until you request deletion or 10 years, whichever comes first. Account data is retained until you delete your account.
                </p>
              </section>

              <section>
                <h2 className="font-[family-name:var(--font-display)] text-xl text-[#F0E6D3] uppercase tracking-[0.08em] font-bold mb-3">9. Children</h2>
                <p className="font-[family-name:var(--font-mono)] text-[#F0E6D3]/50 text-sm leading-relaxed">
                  Mix Techniques is not directed at children under 13. We do not knowingly collect data from children under 13. Contestants under 18 require parental consent as part of the submission process.
                </p>
              </section>

              <section>
                <h2 className="font-[family-name:var(--font-display)] text-xl text-[#F0E6D3] uppercase tracking-[0.08em] font-bold mb-3">10. Contact</h2>
                <p className="font-[family-name:var(--font-mono)] text-[#F0E6D3]/50 text-sm leading-relaxed">
                  Privacy questions? Contact us at{" "}
                  <a href="mailto:privacy@mixtechniques.com" className="text-[#D4A843] hover:text-[#E89B2E] transition-colors">privacy@mixtechniques.com</a>
                </p>
              </section>
            </div>
          </div>

          <div className="text-center mt-8">
            <Link href="/" className="font-[family-name:var(--font-mono)] text-xs text-[#D4A843]/50 tracking-[0.15em] uppercase hover:text-[#D4A843] transition-colors">← Back to Home</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
