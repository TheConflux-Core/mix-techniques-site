import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service — Mix Techniques",
  description: "Terms of Service for Mix Techniques, a live-streamed music talent show.",
};

export default function TermsPage() {
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
              Terms of Service
            </h1>
            <p className="font-[family-name:var(--font-mono)] text-[#F0E6D3]/30 text-xs tracking-wider">
              Last updated: June 2026
            </p>
          </div>

          {/* Content */}
          <div className="card-float noise carbon-fiber-walnut rounded-2xl p-6 md:p-10 relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-[1px] bg-gradient-to-r from-transparent via-[#D4A843]/30 to-transparent" />

            <div className="prose-legal space-y-8">
              <section>
                <h2 className="font-[family-name:var(--font-display)] text-xl text-[#F0E6D3] uppercase tracking-[0.08em] font-bold mb-3">
                  1. Acceptance of Terms
                </h2>
                <p className="font-[family-name:var(--font-mono)] text-[#F0E6D3]/50 text-sm leading-relaxed">
                  By accessing or using the Mix Techniques website, submitting content, voting, or participating in any capacity, you agree to be bound by these Terms of Service. If you do not agree, do not use the site or participate in the show.
                </p>
              </section>

              <section>
                <h2 className="font-[family-name:var(--font-display)] text-xl text-[#F0E6D3] uppercase tracking-[0.08em] font-bold mb-3">
                  2. The Show
                </h2>
                <p className="font-[family-name:var(--font-mono)] text-[#F0E6D3]/50 text-sm leading-relaxed">
                  Mix Techniques is a live-streamed music production talent show. Contestants submit original musical works for real-time critique and scoring during live broadcasts. Episodes are recorded and distributed as video and audio content across multiple platforms including but not limited to YouTube, Twitch, Spotify, and Apple Podcasts.
                </p>
              </section>

              <section>
                <h2 className="font-[family-name:var(--font-display)] text-xl text-[#F0E6D3] uppercase tracking-[0.08em] font-bold mb-3">
                  3. Submissions
                </h2>
                <div className="font-[family-name:var(--font-mono)] text-[#F0E6D3]/50 text-sm leading-relaxed space-y-3">
                  <p>By submitting content to Mix Techniques, you represent and warrant that:</p>
                  <ul className="list-none space-y-2 ml-4">
                    <li className="flex items-start gap-3">
                      <span className="text-[#D4A843] mt-1">▸</span>
                      <span>You are 18 years of age or older, or have parental consent.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-[#D4A843] mt-1">▸</span>
                      <span>You own or have the necessary rights to the submitted audio content.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-[#D4A843] mt-1">▸</span>
                      <span>Your submission does not infringe on any third party&apos;s intellectual property rights.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-[#D4A843] mt-1">▸</span>
                      <span>You have accepted the Broadcast Release and Likeness Release as part of the submission process.</span>
                    </li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="font-[family-name:var(--font-display)] text-xl text-[#F0E6D3] uppercase tracking-[0.08em] font-bold mb-3">
                  4. Intellectual Property
                </h2>
                <div className="font-[family-name:var(--font-mono)] text-[#F0E6D3]/50 text-sm leading-relaxed space-y-3">
                  <p>
                    <strong className="text-[#F0E6D3]/70">Your music stays yours.</strong> You retain full ownership of your original musical compositions and recordings. By submitting, you grant Mix Techniques a license to broadcast, stream, and create promotional clips from your submitted content as described in the Broadcast Release.
                  </p>
                  <p>
                    All Mix Techniques branding, logos, graphics, overlays, and original content are the property of Mix Techniques and may not be used without permission.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="font-[family-name:var(--font-display)] text-xl text-[#F0E6D3] uppercase tracking-[0.08em] font-bold mb-3">
                  5. Voting &amp; Scoring
                </h2>
                <p className="font-[family-name:var(--font-mono)] text-[#F0E6D3]/50 text-sm leading-relaxed">
                  Viewer votes are collected during live episodes and factor into the final combined score. We reserve the right to invalidate votes that appear to be automated, fraudulent, or manipulated. The host&apos;s score carries 60% weight; viewer scores carry 40%. All scoring decisions are final.
                </p>
              </section>

              <section>
                <h2 className="font-[family-name:var(--font-display)] text-xl text-[#F0E6D3] uppercase tracking-[0.08em] font-bold mb-3">
                  6. User Conduct
                </h2>
                <div className="font-[family-name:var(--font-mono)] text-[#F0E6D3]/50 text-sm leading-relaxed space-y-3">
                  <p>You agree not to:</p>
                  <ul className="list-none space-y-2 ml-4">
                    <li className="flex items-start gap-3">
                      <span className="text-[#C4392A] mt-1">✕</span>
                      <span>Submit content you do not have the rights to.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-[#C4392A] mt-1">✕</span>
                      <span>Manipulate the voting system through bots, scripts, or coordinated fraud.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-[#C4392A] mt-1">✕</span>
                      <span>Harass, threaten, or abuse other community members, contestants, or hosts.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-[#C4392A] mt-1">✕</span>
                      <span>Impersonate another person or artist.</span>
                    </li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="font-[family-name:var(--font-display)] text-xl text-[#F0E6D3] uppercase tracking-[0.08em] font-bold mb-3">
                  7. DMCA &amp; Copyright
                </h2>
                <p className="font-[family-name:var(--font-mono)] text-[#F0E6D3]/50 text-sm leading-relaxed">
                  If you believe content on Mix Techniques infringes your copyright, contact us at the email below with a DMCA takedown notice including: identification of the copyrighted work, identification of the infringing material, your contact information, and a statement of good faith belief. We respond to valid DMCA requests promptly.
                </p>
              </section>

              <section>
                <h2 className="font-[family-name:var(--font-display)] text-xl text-[#F0E6D3] uppercase tracking-[0.08em] font-bold mb-3">
                  8. Limitation of Liability
                </h2>
                <p className="font-[family-name:var(--font-mono)] text-[#F0E6D3]/50 text-sm leading-relaxed">
                  Mix Techniques is provided &ldquo;as is&rdquo; without warranties of any kind. We are not liable for any indirect, incidental, or consequential damages arising from your participation in the show, use of the website, or reliance on any content. Our total liability shall not exceed the amount you paid to use the service (which is $0 for free participants).
                </p>
              </section>

              <section>
                <h2 className="font-[family-name:var(--font-display)] text-xl text-[#F0E6D3] uppercase tracking-[0.08em] font-bold mb-3">
                  9. Changes to Terms
                </h2>
                <p className="font-[family-name:var(--font-mono)] text-[#F0E6D3]/50 text-sm leading-relaxed">
                  We may update these terms from time to time. Material changes will be communicated via the website or email. Continued use of the site after changes constitutes acceptance of the updated terms.
                </p>
              </section>

              <section>
                <h2 className="font-[family-name:var(--font-display)] text-xl text-[#F0E6D3] uppercase tracking-[0.08em] font-bold mb-3">
                  10. Contact
                </h2>
                <p className="font-[family-name:var(--font-mono)] text-[#F0E6D3]/50 text-sm leading-relaxed">
                  Questions about these terms? Contact us at{" "}
                  <a href="mailto:legal@mixtechniques.com" className="text-[#D4A843] hover:text-[#E89B2E] transition-colors">
                    legal@mixtechniques.com
                  </a>
                </p>
              </section>
            </div>
          </div>

          {/* Back link */}
          <div className="text-center mt-8">
            <Link href="/" className="font-[family-name:var(--font-mono)] text-xs text-[#D4A843]/50 tracking-[0.15em] uppercase hover:text-[#D4A843] transition-colors">
              ← Back to Home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
