"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { axiosInstance } from "@/lib/axiosInstance";
import { getUser } from "@/lib/auth";

export default function AcceptInvitePage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const user = getUser();

  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) return;

    if (!user) {
      router.push(`/login?redirect=/accept-invite/${token}`);
      return;
    }

    const accept = async () => {
      setStatus("loading");
      try {
        const res = await axiosInstance.post<{ businessId: string }>(
          `/api/team/accept/${token}`,
        );

        const currentUser = getUser();
        if (currentUser) {
          // Refetch businesses - simplest is to just reload after redirect
        }

        setStatus("success");
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 2000);
      } catch (err: unknown) {
        let errorMessage = "Failed to accept invite";

        if (err instanceof Error) {
          errorMessage = err.message;
        } else if (
          typeof err === "object" &&
          err !== null &&
          "response" in err &&
          typeof (err as { response: unknown }).response === "object" &&
          (err as { response: { data?: unknown } }).response !== null &&
          "data" in (err as { response: { data?: unknown } }).response
        ) {
          const response = (
            err as { response: { data?: { message?: unknown } } }
          ).response;
          const data = response.data;

          if (
            typeof data === "object" &&
            data !== null &&
            "message" in data &&
            typeof data.message === "string"
          ) {
            errorMessage = data.message;
          }
        }

        setStatus("error");
        setMessage(errorMessage);
      }
    };

    void accept();
  }, [token, user, router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="bg-card border border-border rounded-2xl p-8 max-w-md w-full text-center">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </div>

        {status === "idle" || status === "loading" ? (
          <>
            <h1 className="text-xl font-bold text-foreground">
              Accepting invitation...
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              Please wait while we add you to the team.
            </p>
            <div className="mt-6 flex justify-center">
              <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          </>
        ) : status === "success" ? (
          <>
            <h1 className="text-xl font-bold text-foreground">
              Welcome to the team!
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              You&apos;ve been added successfully. Redirecting to dashboard...
            </p>
            <div className="mt-4 w-8 h-8 rounded-full bg-status-paid flex items-center justify-center mx-auto">
              <svg
                width="16"
                height="16"
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
          </>
        ) : (
          <>
            <h1 className="text-xl font-bold text-foreground">Invite error</h1>
            <p className="text-sm text-muted-foreground mt-2">{message}</p>
            <button
              onClick={() => router.push("/dashboard")}
              className="mt-6 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-lg"
            >
              Go to dashboard
            </button>
          </>
        )}
      </div>
    </div>
  );
}
