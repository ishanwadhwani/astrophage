"use client";

import { useEffect, useState } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { axiosInstance } from "@/lib/axiosInstance";
import { TeamMember, MemberRole } from "@/types/auth";
import PermissionGate from "@/components/ui/PermissionGate";
import { useBusiness } from "@/hooks/useBusiness";
import { LoadingState } from "@/components/ui/LoadingState";

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

function Toast({
  message,
  type,
}: {
  message: string;
  type: "success" | "error";
}) {
  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all ${type === "success" ? "bg-status-paid text-status-paid-foreground" : "bg-destructive/10 text-destructive border border-destructive/20"}`}
    >
      <span>{type === "success" ? "✓" : "⚠"}</span>
      {message}
    </div>
  );
}

export default function TeamSection() {
  const { businessId } = useBusiness();
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

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
        showToast("Failed to load team data", "error");
      } finally {
        setLoading(false);
      }
    };
    void fetchTeam();
  }, [businessId]);

  const onInvite = async (values: InviteForm) => {
    try {
      await axiosInstance.post(`/api/team/${businessId}/invite`, values);
      showToast("Invite sent", "success");
      reset();
      const teamData = await axiosInstance.get(`/api/team/${businessId}`);
      setTeam(teamData.data);
    } catch (err: unknown) {
      let msg = "Failed to send invite";
      if (typeof err === "object" && err !== null && "response" in err) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const e = err as any;
        msg = e?.response?.data?.message ?? msg;
      }
      showToast(msg, "error");
    }
  };

  const handleRemoveMember = async (userId: string, name: string | null) => {
    const ok = window.confirm(`Remove ${name ?? "this member"} from the team?`);
    if (!ok) return;
    try {
      await axiosInstance.delete(`/api/team/${businessId}/members/${userId}`);
      setTeam((prev) => prev.filter((m) => m.id !== userId));
      showToast("Member removed", "success");
    } catch {
      showToast("Failed to remove member", "error");
    }
  };

  if (loading) return <LoadingState page="settings" />;

  return (
    <PermissionGate permission="team:manage">
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
                <span
                  className={`px-2 py-1 rounded-full text-xs font-semibold ${member.type === "invite" ? "bg-status-pending text-status-pending-foreground" : member.role === "OWNER" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}
                >
                  {member.type === "invite"
                    ? `Invited · ${member.role}`
                    : member.role}
                </span>
                {member.role !== "OWNER" && member.type === "member" && (
                  <button
                    onClick={() => handleRemoveMember(member.id, member.name)}
                    className="text-xs text-destructive hover:text-destructive/70 transition"
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
          <p className="text-xs text-muted-foreground bg-muted/60 px-3 py-2 rounded-lg">
            ℹ {ROLE_OPTIONS.find((r) => r.value === selectedRole)?.desc}
          </p>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary/90 disabled:opacity-50 transition"
          >
            {isSubmitting ? "Sending..." : "Send Invite"}
          </button>
        </form>
        {toast && <Toast message={toast.message} type={toast.type} />}
      </SectionCard>
    </PermissionGate>
  );
}
