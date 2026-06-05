"use client";

import { can, Permission } from "@/lib/permissions";

interface Props {
  permission: Permission;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  disabled?: boolean;  
}

export default function PermissionGate({
  permission,
  children,
  fallback = null,
  disabled = false,
}: Props) {
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
