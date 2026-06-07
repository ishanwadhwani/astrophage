"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

import { axiosInstance } from "@/lib/axiosInstance";
import { getUser } from "@/lib/auth";

interface InviteDetails {
  businessName: string;
  role: string;
  email: string;
  expiresAt: string;
}

const ROLE_DESCRIPTIONS: Record<string, string> = {
  ADMIN: "Full access except managing team and deleting business",
  EDITOR: "Create and edit invoices, clients, vendors",
  ACCOUNTANT: "View reports, export data, file GST",
  VIEWER: "Read-only dashboard access",
};

export default function AcceptInvitePage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const user = getUser();

  const [invite, setInvite] = useState<InviteDetails | null>(null);
  const [status, setStatus] = useState<
    "loading" | "ready" | "accepting" | "success" | "error"
  >("loading");
  const [error, setError] = useState<string>(
    token ? "" : "No invite token found in URL",
  );

  useEffect(() => {
    if (!token) return;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const fetchInvite = async () => {
      try {
        const res = await axiosInstance.get<InviteDetails>(
          `/api/team/invite/${token}`,
          { signal: controller.signal },
        );
        setInvite(res.data);
        setStatus("ready");
      } catch (err: unknown) {
        const axiosError = err as {
          name?: string;
          code?: string;
          response?: {
            data?: {
              message?: unknown;
            };
          };
          message?: string;
        };

        if (
          axiosError.name === "AbortError" ||
          axiosError.code === "ERR_CANCELED"
        ) {
          setError("Request timed out. Check that the API server is running.");
        } else {
          setError(
            typeof axiosError.response?.data?.message === "string"
              ? axiosError.response.data.message
              : `Failed to load invite (${axiosError.message ?? "Unknown error"})`,
          );
        }
        setStatus("error");
      } finally {
        clearTimeout(timeout);
      }
    };

    void fetchInvite();

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [token]);

  const handleAccept = async () => {
    if (!user) {
      router.push(`/login?invite=${token}`);
      return;
    }

    setStatus("accepting");
    try {
      const res = await axiosInstance.post<{ businessId: string }>(
        `/api/team/accept/${token}`,
      );

      // Switch the active business to the one the user just joined
      if (invite && res.data?.businessId) {
        const currentUser = getUser();
        if (currentUser) {
          const invitedBusiness = {
            id: res.data.businessId,
            name: invite.businessName,
            gstin: null as string | null,
            role: invite.role,
          };
          const others = (currentUser.businesses ?? []).filter(
            (b) => b.id !== res.data.businessId,
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

      setStatus("success");
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1500);
    } catch (err: unknown) {
      let errorMessage = "Failed to accept invite";

      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (
        typeof err === "object" &&
        err !== null &&
        "response" in err
      ) {
        const response = (err as { response: { data?: { message?: unknown } } })
          .response;
        const data = response?.data;
        if (
          typeof data === "object" &&
          data !== null &&
          "message" in data &&
          typeof data.message === "string"
        ) {
          errorMessage = data.message;
        }
      }

      setError(errorMessage);
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="bg-card border border-border rounded-2xl p-8 max-w-md w-full">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-6">
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
          <span className="font-bold text-foreground">CashFlow Command</span>
        </div>

        {/* Loading */}
        {status === "loading" && (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        )}

        {/* Ready — show invite details */}
        {status === "ready" && invite && (
          <>
            <div className="mb-6">
              <h1 className="text-xl font-bold text-foreground mb-1">
                You&apos;ve been invited
              </h1>
              <p className="text-sm text-muted-foreground">
                You have been invited to join{" "}
                <span className="font-semibold text-foreground">
                  {invite.businessName}
                </span>
              </p>
            </div>

            <div className="bg-muted/60 rounded-xl p-4 mb-6 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Business</span>
                <span className="font-medium text-foreground">
                  {invite.businessName}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Role</span>
                <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-semibold">
                  {invite.role}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Access</span>
                <span className="text-xs text-muted-foreground text-right max-w-48">
                  {ROLE_DESCRIPTIONS[invite.role]}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Invite sent to</span>
                <span className="font-mono text-xs text-foreground">
                  {invite.email}
                </span>
              </div>
            </div>

            {/* If logged in → Accept button */}
            {user ? (
              <div className="space-y-3">
                {user.email !== invite.email && (
                  <div className="flex items-start gap-2 p-3 bg-status-pending/10 border border-status-pending-foreground/20 rounded-xl">
                    <span className="text-status-pending-foreground text-sm">
                      ⚠
                    </span>
                    <p className="text-xs text-status-pending-foreground">
                      You are logged in as <strong>{user.email}</strong> but
                      this invite was sent to <strong>{invite.email}</strong>.
                      Please log in with the correct account.
                    </p>
                  </div>
                )}
                <button
                  onClick={handleAccept}
                  disabled={user.email !== invite.email}
                  className="w-full py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 disabled:opacity-50 transition"
                >
                  Accept &amp; Join {invite.businessName}
                </button>
                <p className="text-xs text-center text-muted-foreground">
                  Signed in as {user.name} ({user.email})
                </p>
              </div>
            ) : (
              /* Not logged in → Register or Login */
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground text-center mb-4">
                  Create an account or sign in to accept this invitation
                </p>
                <Link
                  href={`/register?invite=${token}`}
                  className="flex items-center justify-center w-full py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition"
                >
                  Create account &amp; join
                </Link>
                <Link
                  href={`/login?invite=${token}`}
                  className="flex items-center justify-center w-full py-3 border border-border text-foreground font-medium rounded-xl hover:bg-muted transition"
                >
                  Sign in &amp; join
                </Link>
              </div>
            )}
          </>
        )}

        {/* Accepting */}
        {status === "accepting" && (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">
              Joining {invite?.businessName}...
            </p>
          </div>
        )}

        {/* Success */}
        {status === "success" && (
          <div className="text-center py-8">
            <div className="w-12 h-12 rounded-full bg-status-paid flex items-center justify-center mx-auto mb-4">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="hsl(var(--status-paid-foreground))"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20,6 9,17 4,12" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-foreground mb-1">
              Welcome to the team!
            </h2>
            <p className="text-sm text-muted-foreground">
              Redirecting to dashboard...
            </p>
          </div>
        )}

        {/* Error */}
        {status === "error" && (
          <div className="text-center py-8">
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="hsl(var(--destructive))"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-foreground mb-1">
              Invalid invite
            </h2>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Link
              href="/login"
              className="text-sm text-primary hover:underline"
            >
              Go to login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
