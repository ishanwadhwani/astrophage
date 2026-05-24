"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type AuthStatus = "checking" | "authorized" | "unauthorized";

function getTokenFromStorage(): boolean {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem("token");
}

export default function RouteGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const [status] = useState<AuthStatus>(() => {
    if (typeof window === "undefined") return "checking";
    return getTokenFromStorage() ? "authorized" : "unauthorized";
  });

  useEffect(() => {
    if (status === "unauthorized") {
      router.replace("/login");
    }
  }, [status, router]);

  if (status !== "authorized") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
      </div>
    );
  }

  return <>{children}</>;
}