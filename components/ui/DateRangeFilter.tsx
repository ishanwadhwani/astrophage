"use client";

import { useState, useEffect } from "react";
import { CalendarDays, X } from "lucide-react";

export interface DateRange {
  from: string;
  to: string;
}

const PRESETS = [
  { label: "This Month",   value: "this_month"   },
  { label: "Last Month",   value: "last_month"   },
  { label: "This Quarter", value: "this_quarter" },
  { label: "This FY",      value: "this_fy"      },
];

function resolvePreset(value: string): DateRange {
  const now   = new Date();
  const year  = now.getFullYear();
  const month = now.getMonth();
  const iso   = (d: Date) => d.toISOString().split("T")[0];
  switch (value) {
    case "this_month":
      return { from: iso(new Date(year, month, 1)),     to: iso(new Date(year, month + 1, 0)) };
    case "last_month":
      return { from: iso(new Date(year, month - 1, 1)), to: iso(new Date(year, month, 0)) };
    case "this_quarter": {
      const q = Math.floor(month / 3);
      return { from: iso(new Date(year, q * 3, 1)),     to: iso(new Date(year, q * 3 + 3, 0)) };
    }
    case "this_fy": {
      const fyStart = month >= 3 ? year : year - 1;
      return { from: iso(new Date(fyStart, 3, 1)),      to: iso(new Date(fyStart + 1, 2, 31)) };
    }
    default:
      return { from: "", to: "" };
  }
}

interface Props {
  value: DateRange;
  onChange: (v: DateRange) => void;
  showPresets?: boolean;
  compact?: boolean;
  className?: string;
}

export default function DateRangeFilter({
  value,
  onChange,
  showPresets = false,
  compact = true,
  className = "",
}: Props) {
  const [activePreset, setActivePreset] = useState<string>("");

  useEffect(() => {
    const match = PRESETS.find((p) => {
      const r = resolvePreset(p.value);
      return r.from === value.from && r.to === value.to;
    });
    setActivePreset(match?.value ?? "");
  }, [value.from, value.to]);

  const handlePreset = (preset: string) => {
    setActivePreset(preset);
    onChange(resolvePreset(preset));
  };

  const handleManual = (patch: Partial<DateRange>) => {
    setActivePreset("");
    onChange({ ...value, ...patch });
  };

  const hasValue = !!(value.from || value.to);

  return (
    <div className={`flex flex-col gap-2 ${className}`}>

      {/* Preset chips — non-compact: row above the inputs */}
      {showPresets && !compact && (
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p.value}
              onClick={() => handlePreset(p.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-150 ${
                activePreset === p.value
                  ? "bg-primary text-primary-foreground border-transparent shadow-sm shadow-primary/20"
                  : "bg-muted border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/80"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}

      {/* Always a single stable row — nothing conditionally added/removed at layout level */}
      <div className="flex flex-wrap items-center gap-2">

        {/* Preset chips inline (compact mode) */}
        {showPresets && compact && (
          <div className="flex items-center gap-1 bg-muted rounded-xl p-1 shrink-0">
            {PRESETS.map((p) => (
              <button
                key={p.value}
                onClick={() => handlePreset(p.value)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all duration-150 whitespace-nowrap ${
                  activePreset === p.value
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        )}

        {/* Date input pill — fixed width, no layout shift on clear */}
        <div className="flex items-center bg-card border border-input rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-primary/15 focus-within:border-primary transition-all shrink-0">
          <div className="flex items-center gap-2 px-3 py-2.5">
            <CalendarDays className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <input
              type="date"
              value={value.from}
              onChange={(e) => handleManual({ from: e.target.value })}
              className="bg-transparent text-sm text-foreground outline-none w-28 cursor-pointer date-themed"
            />
          </div>

          <div className="w-px h-5 bg-border shrink-0" />

          <div className="flex items-center gap-2 px-3 py-2.5">
            <input
              type="date"
              value={value.to}
              onChange={(e) => handleManual({ to: e.target.value })}
              className="bg-transparent text-sm text-foreground outline-none w-28 cursor-pointer date-themed"
            />
          </div>

          {/* Clear button — always rendered, invisible when empty to hold the width */}
          <div className="w-px h-5 bg-border shrink-0" />
          <button
            onClick={() => { setActivePreset(""); onChange({ from: "", to: "" }); }}
            title="Clear date filter"
            disabled={!hasValue}
            className={`px-2.5 py-2.5 transition-colors ${
              hasValue
                ? "text-muted-foreground hover:text-foreground hover:bg-muted/50 cursor-pointer"
                : "text-transparent cursor-default pointer-events-none"
            }`}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
