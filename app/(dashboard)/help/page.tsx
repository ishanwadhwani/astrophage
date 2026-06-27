"use client";

import { useState, useEffect, useRef } from "react";
import {
  LayoutDashboard,
  TrendingUp,
  FileBarChart,
  Lightbulb,
  ArrowRight,
} from "lucide-react";

interface Term {
  term: string;
  plain: string;
  detail?: string;
}

const SECTIONS: {
  id: string;
  title: string;
  blurb: string;
  icon: typeof LayoutDashboard;
  terms: Term[];
}[] = [
  {
    id: "dashboard",
    title: "Dashboard",
    blurb: "The numbers you check at a glance, every day.",
    icon: LayoutDashboard,
    terms: [
      {
        term: "Total Receivables",
        plain: "Money your customers owe you that hasn't been paid yet.",
        detail:
          "This is the sum of every unpaid invoice. It's money you've earned but not yet received.",
      },
      {
        term: "Total Payables",
        plain: "Money you owe your vendors that you haven't paid yet.",
        detail:
          "The sum of every unpaid bill. Money you've committed to spend but haven't paid out.",
      },
      {
        term: "GST This Month",
        plain:
          "The GST you'll owe the government for this month's sales, after subtracting the GST you paid on purchases.",
        detail:
          "If it shows an amount, that's payable to the government. If it shows a credit, the government owes you (or you carry it to next month). See the GST example below.",
      },
      {
        term: "Overdue Receivables",
        plain: "Money customers owe you that is now past its due date.",
        detail: "These are the invoices to chase first — payment is late.",
      },
      {
        term: "Overdue Payables",
        plain: "Bills you owe that are now past their due date.",
        detail:
          "Pay these to avoid late fees or strained vendor relationships.",
      },
      {
        term: "Collected This Month",
        plain: "The actual cash you've received from customers this month.",
        detail:
          "Unlike receivables (money owed), this is money that has actually landed in your account.",
      },
    ],
  },
  {
    id: "cashflow",
    title: "Cashflow",
    blurb: "What's coming in and going out over the days ahead.",
    icon: TrendingUp,
    terms: [
      {
        term: "Expected Inflows",
        plain: "Money you expect to receive over the period shown.",
        detail:
          "Includes unpaid invoices due in this window, plus repeating income you've set up.",
      },
      {
        term: "Expected Outflows",
        plain: "Money you expect to pay out over the period shown.",
        detail:
          "Includes unpaid bills, salaries, repeating expenses, and any GST payment due in this window.",
      },
      {
        term: "Money In vs Out",
        plain: "Your expected inflows minus your expected outflows.",
        detail:
          "If it's positive, more is coming in than going out — a surplus. If negative, you may run short and should plan ahead.",
      },
      {
        term: "GST Due",
        plain:
          "An estimate of the GST payment coming up, shown on the date it's due (the 20th of next month).",
        detail:
          "This is a projection to help you set money aside. Your CA confirms the final filing.",
      },
    ],
  },
  {
    id: "reports",
    title: "Reports",
    blurb: "The deeper view, for when you sit down to understand the business.",
    icon: FileBarChart,
    terms: [
      {
        term: "Revenue (taxable)",
        plain: "Your sales before GST — the actual income you earned.",
        detail:
          "GST collected is not part of your revenue; it's tax you hold for the government. This figure excludes it.",
      },
      {
        term: "Gross Profit",
        plain: "Your taxable revenue minus your expenses.",
        detail:
          "Both sides exclude GST, so this is your real earning before tax — money that's actually yours.",
      },
      {
        term: "Profit Margin",
        plain: "What percent of your revenue is profit.",
        detail:
          "Gross profit divided by revenue. Higher means you keep more of every rupee earned.",
      },
      {
        term: "Output GST",
        plain: "The GST you collected from customers on your sales.",
      },
      {
        term: "Input GST",
        plain:
          "The GST you paid to vendors on your purchases — which you can claim back.",
      },
      {
        term: "Net GST Payable",
        plain:
          "Output GST minus input GST — what you actually owe the government.",
        detail: "See the worked example below for exactly how this works.",
      },
      {
        term: "HSN Summary",
        plain:
          "Your sales grouped by HSN/SAC code (the product/service codes used for GST filing).",
        detail: "Your CA needs this breakdown when filing your GST return.",
      },
    ],
  },
];

const CONCEPTS = [
  {
    title: "Owed vs received",
    subtitle: "Why some numbers count money you haven't been paid yet",
    body: 'Two different questions get two different numbers. "What am I owed?" counts an invoice the moment you raise it — even before the customer pays. "What have I received?" only counts money that has actually arrived.',
    exampleLabel: "Example",
    example: [
      { label: "You raise an invoice on 5 June for", value: "₹50,000" },
      { label: "The customer pays you on 2 July", value: "—" },
      {
        label: "In June, your receivables show",
        value: "₹50,000",
        note: "you're owed it",
      },
      {
        label: "In June, your collected shows",
        value: "₹0",
        note: "not paid yet",
      },
      {
        label: "In July, collected becomes",
        value: "₹50,000",
        note: "now paid",
      },
    ],
    footer:
      "This is also why GST can show up before a customer pays you — the tax is owed from the day you invoice, not the day you're paid.",
  },
  {
    title: "Net GST",
    subtitle: "How much you actually owe the government",
    body: "You collect GST on what you sell (output GST) and you pay GST on what you buy (input GST). You only owe the government the difference — the GST you already paid your vendors counts toward your bill.",
    exampleLabel: "Example",
    example: [
      {
        label: "You sell goods worth ₹1,00,000 + 18% GST",
        value: "₹18,000",
        note: "output GST collected",
      },
      {
        label: "You bought stock worth ₹60,000 + 18% GST",
        value: "₹10,800",
        note: "input GST paid",
      },
      {
        label: "GST you owe the government",
        value: "₹7,200",
        note: "18,000 − 10,800",
      },
    ],
    footer:
      "If you paid more GST than you collected, the difference becomes a credit you carry forward — the government effectively owes you.",
  },
];

export default function UnderstandingNumbersPage() {
  const [active, setActive] = useState("dashboard");
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort(
            (a, b) => a.boundingClientRect.top - b.boundingClientRect.top,
          )[0];
        if (visible?.target.id) setActive(visible.target.id);
      },
      { rootMargin: "-20% 0px -70% 0px", threshold: 0 },
    );
    Object.values(sectionRefs.current).forEach(
      (el) => el && observer.observe(el),
    );
    return () => observer.disconnect();
  }, []);

  const jump = (id: string) => {
    sectionRefs.current[id]?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const navItems = [
    ...SECTIONS.map((s) => ({ id: s.id, title: s.title, icon: s.icon })),
    { id: "concepts", title: "Key concepts", icon: Lightbulb },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Understanding Your Numbers
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Every figure in the app, explained in plain language — what each
          number means and why it matters for your business.
        </p>
      </div>

      <div className="lg:grid lg:grid-cols-[200px_1fr] lg:gap-12">
        {/* Sticky side nav */}
        <nav className="hidden lg:block">
          <div className="sticky top-12 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = active === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => jump(item.id)}
                  className={`group flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.title}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Content */}
        <main className="space-y-16">
          {SECTIONS.map((section) => {
            const Icon = section.icon;
            return (
              <section
                key={section.id}
                id={section.id}
                ref={(el) => {
                  sectionRefs.current[section.id] = el;
                }}
                className="scroll-mt-12"
              >
                <div className="flex items-center gap-3 mb-1.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                    <Icon className="h-4.5 w-4.5 text-primary" />
                  </div>
                  <h2 className="text-xl font-bold text-foreground">
                    {section.title}
                  </h2>
                </div>
                <p className="text-sm text-muted-foreground mb-6 ml-12">
                  {section.blurb}
                </p>

                <div className="space-y-3">
                  {section.terms.map((t) => (
                    <div
                      key={t.term}
                      className="rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/30"
                    >
                      <h3 className="text-sm font-bold text-foreground mb-1.5">
                        {t.term}
                      </h3>
                      <p className="text-sm text-foreground/80 leading-relaxed">
                        {t.plain}
                      </p>
                      {t.detail && (
                        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                          {t.detail}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            );
          })}

          {/* Key concepts */}
          <section
            id="concepts"
            ref={(el) => {
              sectionRefs.current["concepts"] = el;
            }}
            className="scroll-mt-12"
          >
            <div className="flex items-center gap-3 mb-1.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/15">
                <Lightbulb className="h-4.5 w-4.5 text-accent" />
              </div>
              <h2 className="text-xl font-bold text-foreground">
                Key concepts
              </h2>
            </div>
            <p className="text-sm text-muted-foreground mb-6 ml-12">
              Two ideas that explain most of the confusing numbers. Worth two
              minutes.
            </p>

            <div className="space-y-5">
              {CONCEPTS.map((c) => (
                <div
                  key={c.title}
                  className="overflow-hidden rounded-2xl border border-border bg-card"
                >
                  <div className="p-6">
                    <h3 className="text-base font-bold text-foreground">
                      {c.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {c.subtitle}
                    </p>
                    <p className="mt-3 text-sm text-foreground/80 leading-relaxed max-w-2xl">
                      {c.body}
                    </p>
                  </div>

                  {/* Worked example */}
                  <div className="border-t border-border bg-muted/40 p-6">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                      {c.exampleLabel}
                    </p>
                    <div className="space-y-2">
                      {c.example.map((row, i) => (
                        <div
                          key={i}
                          className="flex items-baseline justify-between gap-4 text-sm"
                        >
                          <span className="text-foreground/80">
                            {row.label}
                          </span>
                          <span className="flex items-baseline gap-2 shrink-0">
                            {row.note && (
                              <span className="text-xs text-muted-foreground">
                                {row.note}
                              </span>
                            )}
                            <span className="font-semibold text-foreground tabular-nums">
                              {row.value}
                            </span>
                          </span>
                        </div>
                      ))}
                    </div>
                    <p className="mt-4 pt-4 border-t border-border text-sm text-muted-foreground leading-relaxed">
                      {c.footer}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Footer note */}
          <div className="rounded-2xl border border-border bg-muted/40 p-6 flex items-start gap-3">
            <ArrowRight className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-foreground">
                Still unsure about a number?
              </p>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                Hover the small{" "}
                <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-border text-[10px] font-bold text-muted-foreground">
                  ?
                </span>{" "}
                next to any figure in the app for a quick reminder. For anything
                about your actual GST filing or taxes, your CA is the right
                person to confirm.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
