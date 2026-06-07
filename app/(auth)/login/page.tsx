"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { axiosInstance } from "@/lib/axiosInstance";
import { loginUser, saveAuth, getUser } from "@/lib/auth";

export default function LoginPage() {
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
          // Fetch invite details so we know which business to switch to
          const [inviteRes, acceptRes] = await Promise.all([
            axiosInstance.get<{
              businessName: string;
              role: string;
            }>(`/api/team/invite/${inviteToken}`),
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
          // If accept fails (already accepted, expired, etc.) continue to dashboard
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">
          Welcome back
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          Sign in to CashFlow Command
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              placeholder="you@example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-gray-500 transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              placeholder="••••••••"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-gray-500 transition"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 disabled:opacity-50 transition"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="text-sm text-gray-500 mt-6 text-center">
          Don&apos;t have an account?{" "}
          <Link
            href={inviteToken ? `/register?invite=${inviteToken}` : "/register"}
            className="text-gray-900 font-medium hover:underline"
          >
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
