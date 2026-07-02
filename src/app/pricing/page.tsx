import type { Metadata } from "next";
import Link from "next/link";
import PricingClient from "./PricingClient";
import { TIERS } from "@/lib/billing";

export const metadata: Metadata = {
  title: "Pricing — Mix Techniques",
  description: "Choose your membership tier. Pro unlocks portfolio, audio uploads, and analytics.",
};

export default function PricingPage() {
  const tiers = Object.values(TIERS);

  return (
    <div className="min-h-screen carbon-fiber relative">
      <div className="fixed inset-0 warm-light-bg pointer-events-none" />

      <main className="max-w-5xl mx-auto px-6 py-16 md:py-24 relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="font-[family-name:var(--font-mono)] text-[#D4A843]/60 text-xs tracking-[0.4em] uppercase mb-4">
            Membership
          </p>
          <h1 className="font-[family-name:var(--font-display)] text-4xl md:text-5xl lg:text-6xl text-[#F0E6D3] uppercase tracking-[0.1em] font-bold mb-4 heading-wave">
            Pick Your Tier
          </h1>
          <p className="font-[family-name:var(--font-mono)] text-[#F0E6D3]/50 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            Free gets you in the door — profile, submissions, voting, forum, classifieds. Pro unlocks
            a real portfolio with up to 5 tracks, themes, and a contact form.
          </p>
        </div>

        <PricingClient tiers={tiers} />

        {/* FAQ / Notes */}
        <div className="mt-16 max-w-2xl mx-auto card-float noise carbon-fiber-walnut rounded-2xl p-8">
          <h2 className="font-[family-name:var(--font-display)] text-xl text-[#F0E6D3] uppercase tracking-wider mb-6">
            Notes
          </h2>
          <div className="space-y-4 font-[family-name:var(--font-mono)] text-[#F0E6D3]/60 text-sm leading-relaxed">
            <p>
              <strong className="text-[#F0E6D3]">Cancel anytime.</strong> Subscriptions are month-to-month. When you cancel,
              you keep access until the end of your current billing period.
            </p>
            <p>
              <strong className="text-[#F0E6D3]">Upgrade or downgrade</strong> any time from your{" "}
              <Link href="/dashboard/membership" className="text-[#D4A843] hover:text-[#E89B2E]">
                membership dashboard
              </Link>
              .
            </p>
            <p>
              <strong className="text-[#F0E6D3]">Questions?</strong>{" "}
              <a
                href="https://discord.gg/52wavtq9ep"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#D4A843] hover:text-[#E89B2E]"
              >
                Ask in Discord
              </a>{" "}
              or email <a href="mailto:hello@mixtechniques.com" className="text-[#D4A843] hover:text-[#E89B2E]">hello@mixtechniques.com</a>.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}