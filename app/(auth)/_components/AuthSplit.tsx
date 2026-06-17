import { Cable } from "lucide-react";

function GemShape({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 125"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Outer pentagon outline */}
      <path d="M14,44 L36,10 L64,10 L86,44 L50,116 Z" strokeWidth="1.5" />
      {/* Girdle (widest horizontal line) */}
      <line x1="14" y1="44" x2="86" y2="44" strokeWidth="1.2" />
      {/* Table (top flat facet) */}
      <line x1="36" y1="10" x2="64" y2="10" strokeWidth="1.2" />
      {/* Crown center facets */}
      <line x1="36" y1="10" x2="50" y2="44" strokeWidth="0.9" />
      <line x1="64" y1="10" x2="50" y2="44" strokeWidth="0.9" />
      {/* Crown shoulder to table */}
      <line x1="14" y1="44" x2="36" y2="26" strokeWidth="0.6" />
      <line x1="86" y1="44" x2="64" y2="26" strokeWidth="0.6" />
      {/* Pavilion main facets */}
      <line x1="30" y1="44" x2="50" y2="116" strokeWidth="0.8" />
      <line x1="70" y1="44" x2="50" y2="116" strokeWidth="0.8" />
      {/* Pavilion inner facets */}
      <line x1="42" y1="44" x2="50" y2="116" strokeWidth="0.45" />
      <line x1="58" y1="44" x2="50" y2="116" strokeWidth="0.45" />
    </svg>
  );
}

const FEATURES = [
  "GST-ready invoice management",
  "Vendor bill tracking & payments",
  "Real-time P&L and cashflow",
  "Multi-business with role access",
];

interface Props {
  children: React.ReactNode;
}

export default function AuthSplit({ children }: Props) {
  return (
    <div className="min-h-screen flex bg-background">
      {/* ── Left panel ───────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[460px] xl:w-[500px] bg-primary relative flex-col justify-between p-12 overflow-hidden shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center ring-1 ring-white/20">
            <Cable className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold text-white tracking-tight">
            CashFlow Command
          </span>
        </div>

        {/* Main copy */}
        <div className="relative z-10 space-y-6">
          <div>
            <h2 className="text-4xl font-black text-white leading-[1.15] tracking-tight">
              Financial clarity,<br />always.
            </h2>
            <p className="text-white/55 text-[15px] leading-relaxed mt-4 max-w-[280px]">
              Everything you need to run a healthy business — invoicing,
              expenses, and real-time insight in one place.
            </p>
          </div>
          <ul className="space-y-3">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-white/40 shrink-0" />
                <span className="text-sm text-white/65">{f}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer */}
        <p className="text-[11px] text-white/25 relative z-10 tracking-wide">
          © 2026 CashFlow Command · All rights reserved.
        </p>

        {/* Gem decorations */}
        <GemShape className="absolute -top-10 -right-8 w-64 h-64 text-white/[0.11]" />
        <GemShape className="absolute top-[38%] right-10 w-32 h-32 text-white/[0.18]" />
        <GemShape className="absolute -bottom-20 -left-14 w-80 h-80 text-white/[0.07]" />
      </div>

      {/* ── Right panel ──────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 overflow-y-auto min-h-screen">
        {/* Mobile-only logo */}
        <div className="flex items-center gap-2.5 mb-10 lg:hidden">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-sm shadow-primary/30">
            <Cable className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="text-base font-bold text-foreground tracking-tight">
            CashFlow Command
          </span>
        </div>

        <div className="w-full max-w-[400px]">{children}</div>
      </div>
    </div>
  );
}
