"use client";

import { useEffect, useState } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { axiosInstance } from "@/lib/axiosInstance";
import { TeamMember, MemberRole } from "@/types/auth";
import PermissionGate from "@/components/ui/PermissionGate";
import { useBusiness } from "@/hooks/useBusiness";
import { LoadingState } from "@/components/ui/LoadingState";
import { useToast } from "@/components/ui/Toast";
import { Tooltip } from "@/components/ui/Tooltip";
import {
  Users, UserPlus, Trash2, Info, ArrowLeft,
  Lock, Loader2, Check, Mail, Clock,
} from "lucide-react";
import { emailRules } from "@/lib/validators";

type InviteForm = { email: string; role: MemberRole };

const ROLE_OPTIONS: { value: MemberRole; label: string; desc: string }[] = [
  { value: "ADMIN",      label: "Admin",      desc: "Full access except managing team and deleting the business" },
  { value: "EDITOR",     label: "Editor",     desc: "Create, edit invoices/clients/vendors and record payments" },
  { value: "ACCOUNTANT", label: "Accountant", desc: "View reports, export data, mark GST filed" },
  { value: "VIEWER",     label: "Viewer",     desc: "Read-only dashboard access" },
];

const ROLE_STYLE: Record<string, { bg: string; text: string; border: string }> = {
  OWNER:      { bg: "bg-primary/10",  text: "text-primary",            border: "border-primary/20"  },
  ADMIN:      { bg: "bg-chart-3/10",  text: "text-chart-3",            border: "border-chart-3/20"  },
  EDITOR:     { bg: "bg-chart-1/10",  text: "text-chart-1",            border: "border-chart-1/20"  },
  ACCOUNTANT: { bg: "bg-chart-4/10",  text: "text-chart-4",            border: "border-chart-4/20"  },
  VIEWER:     { bg: "bg-muted",       text: "text-muted-foreground",   border: "border-border"      },
};

const AVATAR_COLORS = [
  { bg: "bg-chart-1/15", text: "text-chart-1" },
  { bg: "bg-chart-3/15", text: "text-chart-3" },
  { bg: "bg-chart-2/15", text: "text-chart-2" },
  { bg: "bg-chart-4/15", text: "text-chart-4" },
  { bg: "bg-primary/15", text: "text-primary"  },
];

const inp = "w-full px-3.5 py-2.5 bg-background border border-input rounded-xl text-sm text-foreground outline-none transition-all duration-150 placeholder:text-muted-foreground/50 focus:border-primary focus:ring-2 focus:ring-primary/10";
const lbl = "block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5";

const AccessDenied = () => (
  <div className="flex flex-col items-center justify-center text-center p-10 border border-border bg-card rounded-2xl shadow-sm">
    <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mb-4">
      <Lock className="w-5 h-5 text-muted-foreground" />
    </div>
    <h3 className="text-sm font-bold text-foreground mb-1.5">View-Only Access</h3>
    <p className="text-xs text-muted-foreground max-w-64 mb-5 leading-relaxed">
      Your role doesn&apos;t allow managing team members. Contact your organisation owner for access.
    </p>
    <button
      onClick={() => window.history.length > 1 ? window.history.back() : (window.location.href = "/dashboard")}
      className="flex items-center justify-center gap-2 w-full h-10 px-4 bg-background border border-border text-sm font-semibold rounded-xl hover:bg-muted transition-all active:scale-[0.98]"
    >
      <ArrowLeft className="w-3.5 h-3.5" />Go back
    </button>
  </div>
);

export default function TeamSection() {
  const { businessId } = useBusiness();
  const { success, error, confirm } = useToast();
  const [team,           setTeam]           = useState<TeamMember[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [mounted,        setMounted]        = useState(false);
  const [changingRoleId, setChangingRoleId] = useState<string | null>(null);

  const { register, control, handleSubmit, reset, formState: { isSubmitting, errors } } =
    useForm<InviteForm>({ defaultValues: { email: "", role: "VIEWER" } });

  const selectedRole = useWatch({ control, name: "role" });
  const activeRoleDesc = ROLE_OPTIONS.find((r) => r.value === selectedRole)?.desc ?? "";

  useEffect(() => {
    if (!businessId) return;
    axiosInstance.get(`/api/team/${businessId}`)
      .then((res) => setTeam(res.data))
      .catch(() => error("Failed to load team data", "error"))
      .finally(() => { setLoading(false); setTimeout(() => setMounted(true), 60); });
  }, [businessId]);

  const onInvite = async (values: InviteForm) => {
    try {
      await axiosInstance.post(`/api/team/${businessId}/invite`, values);
      success("Invite sent", "success");
      reset();
      const res = await axiosInstance.get(`/api/team/${businessId}`);
      setTeam(res.data);
    } catch {
      error("Failed to send the invite", "error");
    }
  };

  const handleRemoveMember = async (userId: string, name: string | null) => {
    const confirmed = await confirm({
      title: "Remove Team Member?",
      message: `Remove ${name ?? "this member"} from the team?`,
      confirmText: "Remove",
      cancelText: "Keep",
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
    setChangingRoleId(userId);
    try {
      await axiosInstance.put(`/api/team/${businessId}/members/${userId}`, { role: newRole });
      setTeam((prev) => prev.map((m) => (m.id === userId ? { ...m, role: newRole } : m)));
      success("Role updated", "success");
    } catch {
      error("Failed to update role", "error");
    } finally {
      setChangingRoleId(null);
    }
  };

  if (loading) return <LoadingState page="settings" />;

  return (
    <PermissionGate permission="team:manage" fallback={<AccessDenied />}>
      <div className="space-y-4">

        {/* ── Team members card ─────────────────────────────────────────── */}
        <div
          className={`bg-card border border-border rounded-2xl overflow-hidden transition-all duration-500 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}
        >
          <div className="px-6 py-5 border-b border-border flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-sm font-bold text-foreground">Team Members</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {team.length} member{team.length !== 1 ? "s" : ""} with access to this business
              </p>
            </div>
          </div>

          <div className="divide-y divide-border/60">
            {team.length === 0 && (
              <div className="px-6 py-10 flex flex-col items-center gap-2 text-center">
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                  <Users className="w-5 h-5 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">No team members yet</p>
              </div>
            )}
            {team.map((member, idx) => {
              const avatarColor = AVATAR_COLORS[
                (member.name ?? member.email).charCodeAt(0) % AVATAR_COLORS.length
              ];
              const initial = (member.name ?? member.email).charAt(0).toUpperCase();
              const roleStyle = ROLE_STYLE[member.role] ?? ROLE_STYLE.VIEWER;
              const isPending = member.type === "invite";

              return (
                <div
                  key={member.id}
                  className={`flex items-center gap-4 px-6 py-4 transition-all duration-300 hover:bg-muted/30 ${mounted ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2"}`}
                  style={{ transitionDelay: mounted ? `${idx * 40}ms` : "0ms" }}
                >
                  {/* Avatar */}
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${avatarColor.bg} ${avatarColor.text}`}>
                    {initial}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {member.name ?? <span className="text-muted-foreground font-normal italic">No name set</span>}
                      </p>
                      {isPending && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-status-pending text-status-pending-foreground border border-status-pending-foreground/20 shrink-0">
                          <Clock className="w-2.5 h-2.5" />Pending
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Mail className="w-3 h-3 shrink-0" />
                      <span className="truncate">{member.email}</span>
                    </p>
                  </div>

                  {/* Role + actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {member.role === "OWNER" || isPending ? (
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border ${roleStyle.bg} ${roleStyle.text} ${roleStyle.border}`}>
                        {isPending ? `Invited · ${member.role}` : member.role}
                      </span>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <select
                          value={member.role}
                          onChange={(e) => handleRoleChange(member.id, e.target.value as MemberRole)}
                          disabled={changingRoleId === member.id}
                          className="px-2.5 py-1.5 bg-muted border border-input rounded-lg text-xs font-semibold text-foreground outline-none focus:border-primary transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {["ADMIN","EDITOR","ACCOUNTANT","VIEWER"].map((r) => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                        {changingRoleId === member.id && (
                          <Loader2 className="w-3.5 h-3.5 text-primary animate-spin shrink-0" />
                        )}
                      </div>
                    )}

                    {member.role !== "OWNER" && !isPending && (
                      <button
                        onClick={() => handleRemoveMember(member.id, member.name)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/8 transition-all"
                        title="Remove member"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {isPending && (
                      <button
                        onClick={async () => {
                          await axiosInstance.delete(`/api/team/${businessId}/invites/${member.id}`);
                          setTeam((prev) => prev.filter((m) => m.id !== member.id));
                        }}
                        className="text-xs text-muted-foreground hover:text-destructive transition-colors px-2 py-1 rounded-lg hover:bg-destructive/8"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Invite card ───────────────────────────────────────────────── */}
        <div
          className={`bg-card border border-border rounded-2xl overflow-hidden transition-all duration-500 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}
          style={{ transitionDelay: "160ms" }}
        >
          <div className="px-6 py-5 border-b border-border flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <UserPlus className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">Invite Member</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Send an invite link to add someone to this business.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onInvite)} noValidate className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className={lbl}>Email address</label>
                <input
                  type="email" placeholder="colleague@example.com"
                  {...register("email", { required: "Email is required", ...emailRules })}
                  className={errors.email ? `${inp} border-destructive bg-destructive/5` : inp}
                />
                {errors.email && <p className="text-xs text-destructive mt-1.5">{errors.email.message}</p>}
              </div>
              <div>
                <label className={lbl}>Role</label>
                <Controller
                  name="role" control={control}
                  render={({ field }) => (
                    <select {...field} className={inp}>
                      {ROLE_OPTIONS.map((r) => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                  )}
                />
              </div>
            </div>

            {/* Role description pill */}
            {activeRoleDesc && (
              <div className="flex items-center gap-2 px-3 py-2.5 bg-muted/60 rounded-xl">
                <Info className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <p className="text-xs text-muted-foreground">{activeRoleDesc}</p>
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <Tooltip content="Roles define what team members can see and do" side="right" variant="info">
                <span className="flex items-center gap-1.5 text-xs font-medium text-primary cursor-help">
                  <Info className="w-3.5 h-3.5" />
                  Role permissions
                </span>
              </Tooltip>

              <button
                type="submit" disabled={isSubmitting}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-all active:scale-[0.98] shadow-sm shadow-primary/20"
              >
                {isSubmitting
                  ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Sending…</>
                  : <><Check className="w-3.5 h-3.5" />Send Invite</>}
              </button>
            </div>
          </form>
        </div>

      </div>
    </PermissionGate>
  );
}
