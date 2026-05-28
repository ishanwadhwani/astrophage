import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="flex items-center justify-center gap-2 mb-12">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="22,12 18,12 15,21 9,3 6,12 2,12" />
            </svg>
          </div>
          <span className="text-base font-bold text-foreground">
            CashFlow Command
          </span>
        </div>

        <div className="mb-8">
          <p className="text-8xl font-black text-primary/10 leading-none select-none mb-2">
            404
          </p>
          <h1 className="text-2xl font-bold text-foreground mb-3">
            Page not found
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            The page you are looking for does not exist, was moved, or you may
            not have permission to view it.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="px-5 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary/90 transition-all shadow-sm shadow-primary/20"
          >
            Go to dashboard
          </Link>
          <Link
            href="/invoices"
            className="px-5 py-2.5 border border-border text-sm font-medium rounded-lg text-muted-foreground hover:bg-muted transition-all"
          >
            View invoices
          </Link>
        </div>
      </div>
    </div>
  );
}
