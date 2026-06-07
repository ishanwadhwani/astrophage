"use client";

import { useSyncExternalStore } from "react";
import { redirect } from "next/navigation";

import { can, Permission } from "@/lib/permissions";

const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

interface Props {
  permission: Permission;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  disabled?: boolean;  
}

// if (!can("invoice:create")) redirect("/invoices");

export default function PermissionGate({
  permission,
  children,
  fallback = null,
  disabled = false,
}: Props) {

  // false on server + first client render, true after hydration
  const mounted = useSyncExternalStore(
    emptySubscribe,
    getClientSnapshot,
    getServerSnapshot
  );

  if (!mounted) return null;

  const allowed = can(permission);

  if (!allowed && disabled) {
    return (
      <span
        className="opacity-40 cursor-not-allowed pointer-events-none"
        title="You don't have permission for this action"
      >
        {children}
      </span>
    );
  }

  return allowed ? <>{children}</> : <>{fallback}</>;
}
