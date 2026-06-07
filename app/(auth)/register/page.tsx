"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { registerUser, saveAuth, getUser } from "@/lib/auth";
import { axiosInstance } from "@/lib/axiosInstance";

interface InvitePreview {
  businessName: string;
  role: string;
  email: string;
}

export default function RegisterPage() {
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
      const errorMessage = err instanceof Error ? err.message : "Registration failed";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">
          Create your account
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          {invitePreview
            ? `You're joining ${invitePreview.businessName} as ${invitePreview.role}`
            : "Get started with CashFlow Command"}
        </p>

        {invitePreview && (
          <div className="mb-4 px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
            Invited to <strong>{invitePreview.businessName}</strong> ·{" "}
            {invitePreview.role} role
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full name
            </label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              placeholder="Ishan Sharma"
              className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg text-sm outline-none focus:border-gray-500 transition"
            />
          </div>

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
              className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg text-sm outline-none focus:border-gray-500 transition"
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
              className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg text-sm outline-none focus:border-gray-500 transition"
            />
          </div>

          {/* Only show businessName when NOT joining via invite */}
          {!inviteToken && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Business name
              </label>
              <input
                type="text"
                name="businessName"
                value={form.businessName}
                onChange={handleChange}
                required
                placeholder="My Business"
                className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg text-sm outline-none focus:border-gray-500 transition"
              />
            </div>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 disabled:opacity-50 transition"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="text-sm text-gray-500 mt-6 text-center">
          Already have an account?{" "}
          <Link
            href={inviteToken ? `/login?invite=${inviteToken}` : "/login"}
            className="text-gray-900 font-medium hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
