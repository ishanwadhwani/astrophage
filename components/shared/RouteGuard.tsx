"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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

  const [authorized] = useState<boolean>(getTokenFromStorage);

  useEffect(() => {
    if (!authorized) {
      router.replace("/login");
    }
  }, [authorized, router]);

  if (!authorized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}