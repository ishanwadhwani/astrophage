import { MemberRole } from "@/types/auth";
import { getCurrentBusiness } from "./auth";

export type Permission =
  | "invoice:create"
  | "invoice:edit"
  | "invoice:delete"
  | "invoice:payment"
  | "client:create"
  | "client:edit"
  | "client:delete"
  | "vendor:create"
  | "vendor:edit"
  | "vendor:delete"
  | "bill:create"
  | "bill:edit"
  | "bill:delete"
  | "bill:payment"
  | "report:view"
  | "report:export"
  | "report:gst_file"
  | "settings:edit"
  | "team:manage"
  | "business:delete";

const ALL: Permission[] = [
  "invoice:create",
  "invoice:edit",
  "invoice:delete",
  "invoice:payment",
  "client:create",
  "client:edit",
  "client:delete",
  "vendor:create",
  "vendor:edit",
  "vendor:delete",
  "bill:create",
  "bill:edit",
  "bill:delete",
  "bill:payment",
  "report:view",
  "report:export",
  "report:gst_file",
  "settings:edit",
  "team:manage",
  "business:delete",
];

export const ROLE_PERMISSIONS: Record<MemberRole, Permission[]> = {
  OWNER: ALL,
  ADMIN: ALL.filter((p) => p !== "team:manage" && p !== "business:delete"),
  EDITOR: [
    "invoice:create",
    "invoice:edit",
    "invoice:payment",
    "client:create",
    "client:edit",
    "vendor:create",
    "vendor:edit",
    "bill:create",
    "bill:edit",
    "bill:payment",
    "report:view",
    "report:export",
  ],
  ACCOUNTANT: ["report:view", "report:export", "report:gst_file"],
  VIEWER: ["report:view"],
};

export const can = (permission: Permission): boolean => {
  const business = getCurrentBusiness();
  if (!business) return false;
  const role = (business as { role?: MemberRole }).role ?? "OWNER";
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
};
