"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

import { axiosInstance } from "@/lib/axiosInstance";
import { loginUser, saveAuth, getUser } from "@/lib/auth";
import AuthSplit from "../_components/AuthSplit";

export default function LoginForm() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("invite");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await loginUser(form);
      saveAuth(data);

      if (inviteToken) {
        try {
          const [inviteRes, acceptRes] = await Promise.all([
            axiosInstance.get<{ businessName: string; role: string }>(
              `/api/team/invite/${inviteToken}`,
            ),
            axiosInstance.post<{ businessId: string }>(
              `/api/team/accept/${inviteToken}`,
            ),
          ]);

          const inviteDetails = inviteRes.data;
          const { businessId } = acceptRes.data;

          if (businessId) {
            const currentUser = getUser();
            if (currentUser) {
              const invitedBusiness = {
                id: businessId,
                name: inviteDetails.businessName,
                gstin: null as string | null,
                role: inviteDetails.role,
              };
              const others = (currentUser.businesses ?? []).filter(
                (b) => b.id !== businessId,
              );
              localStorage.setItem(
                "user",
                JSON.stringify({
                  ...currentUser,
                  business: invitedBusiness,
                  businesses: [...others, invitedBusiness],
                }),
              );
            }
          }
        } catch {
          // accept failed (already accepted / expired) — continue to dashboard
        }
        window.location.href = "/dashboard";
        return;
      }

      router.push("/dashboard");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Login failed";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const inp =
    "w-full px-4 py-3 bg-background border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all duration-150";
  const lbl =
    "block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5";

  return (
    <AuthSplit>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          Welcome back
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Sign in to CashFlow Command
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className={lbl}>Email address</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
            placeholder="you@example.com"
            className={inp}
          />
        </div>

        <div>
          <label className={lbl}>Password</label>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            required
            placeholder="••••••••"
            className={inp}
          />
        </div>

        {error && (
          <div className="px-4 py-3 bg-destructive/5 border border-destructive/20 rounded-xl">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-all duration-150 active:scale-[0.98] flex items-center justify-center gap-2"
        >
          {loading && (
            <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
          )}
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="text-sm text-muted-foreground mt-6 text-center">
        Don&apos;t have an account?{" "}
        <Link
          href={inviteToken ? `/register?invite=${inviteToken}` : "/register"}
          className="text-primary font-semibold hover:underline"
        >
          Create one
        </Link>
      </p>
    </AuthSplit>
  );
}
