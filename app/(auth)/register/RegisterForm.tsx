"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

import { registerUser, saveAuth, getUser } from "@/lib/auth";
import { axiosInstance } from "@/lib/axiosInstance";
import AuthSplit from "../_components/AuthSplit";

interface InvitePreview {
  businessName: string;
  role: string;
  email: string;
}

export default function RegisterForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    businessName: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [invitePreview, setInvitePreview] = useState<InvitePreview | null>(
    null,
  );

  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("invite");

  // When registering via invite, pre-fetch the invite so we know the business
  useEffect(() => {
    if (!inviteToken) return;
    axiosInstance
      .get<InvitePreview>(`/api/team/invite/${inviteToken}`)
      .then((res) => {
        setInvitePreview(res.data);
        // Pre-fill the email field if the invite has one
        if (res.data.email) {
          setForm((prev) => ({ ...prev, email: res.data.email }));
        }
      })
      .catch(() => {});
  }, [inviteToken]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Pass inviteToken to the backend so it skips creating a new business.
      // businessName is only needed when creating a standalone account.
      const payload = inviteToken
        ? { name: form.name, email: form.email, password: form.password, inviteToken }
        : { ...form };

      const data = await registerUser(payload);
      saveAuth(data);

      if (inviteToken) {
        try {
          const acceptRes = await axiosInstance.post<{ businessId: string }>(
            `/api/team/accept/${inviteToken}`,
          );

          const businessId = acceptRes.data?.businessId;
          if (businessId && invitePreview) {
            const currentUser = getUser();
            if (currentUser) {
              const invitedBusiness = {
                id: businessId,
                name: invitePreview.businessName,
                gstin: null as string | null,
                role: invitePreview.role,
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
          // If accept fails continue — user can retry from the invite link
        }
        router.push("/dashboard");
        return;
      }

      router.push("/onboarding");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Registration failed";
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
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          Create your account
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {invitePreview
            ? `Joining ${invitePreview.businessName} as ${invitePreview.role}`
            : "Get started with CashFlow Command"}
        </p>
      </div>

      {invitePreview && (
        <div className="mb-5 px-4 py-3 bg-primary/5 border border-primary/20 rounded-xl flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
          <p className="text-sm text-foreground">
            Invited to{" "}
            <span className="font-semibold">{invitePreview.businessName}</span>{" "}
            · {invitePreview.role} role
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={lbl}>Full name</label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            placeholder="Ishan Sharma"
            className={inp}
          />
        </div>

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

        {/* Only show businessName when NOT joining via invite */}
        {!inviteToken && (
          <div>
            <label className={lbl}>Business name</label>
            <input
              type="text"
              name="businessName"
              value={form.businessName}
              onChange={handleChange}
              required
              placeholder="My Business"
              className={inp}
            />
          </div>
        )}

        {error && (
          <div className="px-4 py-3 bg-destructive/5 border border-destructive/20 rounded-xl">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-all duration-150 active:scale-[0.98] flex items-center justify-center gap-2 mt-6!"
        >
          {loading && (
            <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
          )}
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="text-sm text-muted-foreground mt-6 text-center">
        Already have an account?{" "}
        <Link
          href={inviteToken ? `/login?invite=${inviteToken}` : "/login"}
          className="text-primary font-semibold hover:underline"
        >
          Sign in
        </Link>
      </p>
    </AuthSplit>
  );
}
