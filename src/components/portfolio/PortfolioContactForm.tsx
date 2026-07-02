"use client";

import { useState } from "react";

interface PortfolioContactFormProps {
  username: string;
}

const PROJECT_TYPES = [
  "Mixing",
  "Mastering",
  "Production",
  "Recording",
  "Sound Design",
  "Other",
];

const BUDGET_RANGES = [
  "Under $500",
  "$500 - $1,000",
  "$1,000 - $5,000",
  "$5,000+",
  "Flexible",
];

export default function PortfolioContactForm({ username }: PortfolioContactFormProps) {
  const [form, setForm] = useState({
    sender_name: "",
    sender_email: "",
    project_type: "",
    budget_range: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    setErrorMsg("");

    try {
      const res = await fetch("/api/portfolio/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, ...form }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send message");
      }

      setStatus("sent");
      setForm({ sender_name: "", sender_email: "", project_type: "", budget_range: "", message: "" });
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  if (status === "sent") {
    return (
      <div className="text-center py-8">
        <div className="success-icon text-4xl mb-3">✓</div>
        <h3 className="font-[family-name:var(--font-display)] text-lg text-[#F0E6D3] mb-2">
          Message Sent
        </h3>
        <p className="text-[#F0E6D3]/40 font-[family-name:var(--font-mono)] text-sm">
          They&apos;ll get back to you soon.
        </p>
        <button
          onClick={() => setStatus("idle")}
          className="mt-4 text-[#D4A843] font-[family-name:var(--font-mono)] text-xs hover:underline"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block font-[family-name:var(--font-mono)] text-xs text-[#F0E6D3]/50 mb-1.5 uppercase tracking-wider">
            Your Name *
          </label>
          <input
            type="text"
            required
            value={form.sender_name}
            onChange={(e) => setForm({ ...form, sender_name: e.target.value })}
            className="w-full bg-[#0F0A07] border border-[#3A2818] rounded-lg px-4 py-2.5 text-[#F0E6D3] font-[family-name:var(--font-mono)] text-sm"
            placeholder="John Doe"
          />
        </div>
        <div>
          <label className="block font-[family-name:var(--font-mono)] text-xs text-[#F0E6D3]/50 mb-1.5 uppercase tracking-wider">
            Email *
          </label>
          <input
            type="email"
            required
            value={form.sender_email}
            onChange={(e) => setForm({ ...form, sender_email: e.target.value })}
            className="w-full bg-[#0F0A07] border border-[#3A2818] rounded-lg px-4 py-2.5 text-[#F0E6D3] font-[family-name:var(--font-mono)] text-sm"
            placeholder="john@example.com"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block font-[family-name:var(--font-mono)] text-xs text-[#F0E6D3]/50 mb-1.5 uppercase tracking-wider">
            Project Type
          </label>
          <select
            value={form.project_type}
            onChange={(e) => setForm({ ...form, project_type: e.target.value })}
            className="w-full bg-[#0F0A07] border border-[#3A2818] rounded-lg px-4 py-2.5 text-[#F0E6D3] font-[family-name:var(--font-mono)] text-sm"
          >
            <option value="">Select...</option>
            {PROJECT_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block font-[family-name:var(--font-mono)] text-xs text-[#F0E6D3]/50 mb-1.5 uppercase tracking-wider">
            Budget Range
          </label>
          <select
            value={form.budget_range}
            onChange={(e) => setForm({ ...form, budget_range: e.target.value })}
            className="w-full bg-[#0F0A07] border border-[#3A2818] rounded-lg px-4 py-2.5 text-[#F0E6D3] font-[family-name:var(--font-mono)] text-sm"
          >
            <option value="">Select...</option>
            {BUDGET_RANGES.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block font-[family-name:var(--font-mono)] text-xs text-[#F0E6D3]/50 mb-1.5 uppercase tracking-wider">
          Message *
        </label>
        <textarea
          required
          rows={4}
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          className="w-full bg-[#0F0A07] border border-[#3A2818] rounded-lg px-4 py-2.5 text-[#F0E6D3] font-[family-name:var(--font-mono)] text-sm resize-none"
          placeholder="Tell me about your project..."
        />
      </div>

      {status === "error" && (
        <p className="text-red-400 font-[family-name:var(--font-mono)] text-xs">{errorMsg}</p>
      )}

      <button
        type="submit"
        disabled={status === "sending"}
        className="btn-3d text-[#1A0F0A] font-[family-name:var(--font-display)] text-sm uppercase tracking-[0.15em] px-8 py-3 rounded-lg font-bold disabled:opacity-50"
      >
        {status === "sending" ? "Sending..." : "Send Message"}
      </button>
    </form>
  );
}
