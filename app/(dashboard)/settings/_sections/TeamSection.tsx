"use client";

import { useEffect, useState } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { axiosInstance } from "@/lib/axiosInstance";
import { TeamMember, MemberRole } from "@/types/auth";
import PermissionGate from "@/components/ui/PermissionGate";
import { useBusiness } from "@/hooks/useBusiness";
import { LoadingState } from "@/components/ui/LoadingState";
import { useToast } from "@/components/ui/Toast";
import { Info, ArrowLeft, Lock } from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";

type InviteForm = { email: string; role: MemberRole };

const ROLE_OPTIONS: { value: MemberRole; label: string; desc: string }[] = [
  {
    value: "ADMIN",
    label: "Admin",
    desc: "Full access except managing team and deleting business",
  },
  {
    value: "EDITOR",
    label: "Editor",
    desc: "Create, edit invoices/clients/vendors and record payments",
  },
  {
    value: "ACCOUNTANT",
    label: "Accountant",
    desc: "View reports, export data, mark GST filed",
  },
  { value: "VIEWER", label: "Viewer", desc: "Read-only dashboard access" },
];

const inputBase =
  "w-full px-3 py-2.5 bg-background border rounded-lg text-sm text-foreground outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary transition-all placeholder:text-muted-foreground/60";
const inputNormal = `${inputBase} border-input`;
const labelBase =
  "block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5";

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="px-6 py-5 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

export default function TeamSection() {
  const { businessId } = useBusiness();
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  const { success, error, confirm } = useToast();

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<InviteForm>({
    defaultValues: { email: "", role: "VIEWER" },
  });

  const selectedRole = useWatch({ control, name: "role" });

  useEffect(() => {
    if (!businessId) return;
    const fetchTeam = async () => {
      try {
        const teamData = await axiosInstance.get(`/api/team/${businessId}`);
        setTeam(teamData.data);
      } catch {
        error("Failed to load team data", "error");
      } finally {
        setLoading(false);
      }
    };
    void fetchTeam();
  }, [businessId]);

  const onInvite = async (values: InviteForm) => {
    try {
      await axiosInstance.post(`/api/team/${businessId}/invite`, values);
      success("Invite sent", "success");
      reset();
      const teamData = await axiosInstance.get(`/api/team/${businessId}`);
      setTeam(teamData.data);
    } catch {
      // let msg = "Failed to send invite";
      // if (typeof err === "object" && err !== null && "response" in err) {
      //   // eslint-disable-next-line @typescript-eslint/no-explicit-any
      //   const e = err as any;
      //   msg = e?.response?.data?.message ?? msg;
      // }
      error("Failed to sent the invite", "error");
    }
  };

  const handleRemoveMember = async (userId: string, name: string | null) => {
    const confirmed = await confirm({
      title: "Remove Team Member?",
      message: `Remove ${name ?? "this member"} from the team?`,
      confirmText: "Delete Member",
      cancelText: "Keep Member",
      danger: true,
    });

    if (!confirmed) return;

    try {
      await axiosInstance.delete(`/api/team/${businessId}/members/${userId}`);
      setTeam((prev) => prev.filter((m) => m.id !== userId));
      success("Member removed", "success");
    } catch {
      error("Failed to remove member", "error");
    }
  };

  const handleRoleChange = async (userId: string, newRole: MemberRole) => {
    try {
      await axiosInstance.put(`/api/team/${businessId}/members/${userId}`, {
        role: newRole,
      });
      setTeam((prev) =>
        prev.map((m) => (m.id === userId ? { ...m, role: newRole } : m)),
      );
      success("Role updated", "success");
    } catch {
      error("Failed to update role", "error");
    }
  };

  const activeRoleDesc =
    ROLE_OPTIONS.find((r) => r.value === selectedRole)?.desc ||
    "No role selected";

  if (loading) return <LoadingState page="settings" />;

  return (
    <PermissionGate
      permission="team:manage"
      fallback={
        <div className="flex flex-col items-center justify-center text-center p-8 border border-border bg-card rounded-2xl max-w-sm mx-auto my-6 shadow-sm animate-in fade-in zoom-in-95 duration-200">
          <div className="w-12 h-12 rounded-xl bg-primary text-primary-foreground border border-border/40 flex items-center justify-center mb-4">
            <Lock className="w-5 h-5" strokeWidth={2.5} />
          </div>

          <h3 className="text-sm font-bold text-primary mb-1.5">
            View-Only Access
          </h3>
          <p className="text-xs text-muted-foreground max-w-65 mb-5 leading-normal">
            Your current role doesn&apos;t have permission to modify these
            parameters. Please contact your organization owner for full editing
            access.
          </p>

          <button
            onClick={() =>
              window.history.length > 1
                ? window.history.back()
                : (window.location.href = "/dashboard")
            }
            className="inline-flex items-center justify-center gap-2 h-10 px-4 w-full bg-background border border-border text-primary text-xs font-semibold rounded-xl hover:bg-muted shadow-sm transition-all active:scale-[0.98]"
          >
            <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2.5} />
            Go back
          </button>
        </div>
      }
    >
      <SectionCard
        title="Team Members"
        description="Invite people to collaborate on this business with defined access roles."
      >
        <div className="space-y-2 mb-6">
          {team.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between gap-3 p-3 bg-muted/40 rounded-xl"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold shrink-0">
                  {member.name?.charAt(0)?.toUpperCase() ??
                    member.email.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {member.name ?? (
                      <span className="text-muted-foreground italic">
                        Pending
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {member.email}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* <span
                  className={`px-2 py-1 rounded-full text-xs font-semibold ${member.type === "invite" ? "bg-status-pending text-status-pending-foreground" : member.role === "OWNER" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}
                >
                  {member.type === "invite"
                    ? `Invited · ${member.role}`
                    : member.role}
                </span> */}
                {member.type === "member" && member.role !== "OWNER" ? (
                  <select
                    value={member.role}
                    onChange={(e) =>
                      handleRoleChange(member.id, e.target.value as MemberRole)
                    }
                    className="px-2 py-1 bg-muted border border-input rounded-lg text-xs font-semibold text-foreground outline-none focus:border-primary"
                  >
                    {["ADMIN", "EDITOR", "ACCOUNTANT", "VIEWER"].map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="px-2 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary">
                    {member.role}
                  </span>
                )}
                {member.role !== "OWNER" && member.type === "member" && (
                  <button
                    onClick={() => handleRemoveMember(member.id, member.name)}
                    className="px-2 py-1 border border-destructive hover:border-destructive/70 rounded-lg text-xs font-semibold text-destructive hover:text-destructive/70 transition"
                  >
                    Remove
                  </button>
                )}
                {member.type === "invite" && (
                  <button
                    onClick={async () => {
                      await axiosInstance.delete(
                        `/api/team/${businessId}/invites/${member.id}`,
                      );
                      setTeam((prev) => prev.filter((m) => m.id !== member.id));
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground transition"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        <form
          onSubmit={handleSubmit(onInvite)}
          noValidate
          className="space-y-3"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className={labelBase}>Email address</label>
              <input
                type="email"
                placeholder="colleague@example.com"
                {...register("email", { required: true })}
                className={inputNormal}
              />
            </div>
            <div>
              <label className={labelBase}>Role</label>
              <Controller
                name="role"
                control={control}
                render={({ field }) => (
                  <select {...field} className={inputNormal}>
                    {ROLE_OPTIONS.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                )}
              />
            </div>
          </div>
          {/* <p className="text-xs text-muted-foreground bg-muted/60 px-3 py-2 rounded-lg">
            ℹ {ROLE_OPTIONS.find((r) => r.value === selectedRole)?.desc}
          </p> */}
          <div className="flex items-center justify-between">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary/90 disabled:opacity-50 transition"
            >
              {isSubmitting ? "Sending..." : "Send Invite"}
            </button>
            <Tooltip content={activeRoleDesc} side="left" variant="info">
              <Info className="h-3.5 w-3.5 mt-0.75 text-primary mr-1" />
              <span className="text-xs font-medium text-primary cursor-help underline decoration-dotted">
                What does this role do?
              </span>
            </Tooltip>
          </div>
        </form>
      </SectionCard>
    </PermissionGate>
  );
}
