import { useState } from "react";
import {
  Users, UserPlus, Mail, Shield, Eye, Trash2, Loader2,
  CheckCircle, Clock, Crown, Rocket, MoreVertical, ChevronDown,
} from "lucide-react";
import { TeamMember, TeamRole } from "@/types";
import { useTeam } from "@/hooks/useTeam";
import { useNotifications } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useSettings } from "@/contexts/SettingsContext";
import { t } from "@/lib/i18n";

interface TeamPageProps {
  userId: string;
}

const roleConfig: Record<TeamRole, { label: string; icon: React.ElementType; color: string; bg: string; desc: string }> = {
  admin: { label: "Admin", icon: Crown, color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20", desc: "Full access to all projects and settings" },
  deployer: { label: "Deployer", icon: Rocket, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20", desc: "Can upload and manage deployments" },
  viewer: { label: "Viewer", icon: Eye, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", desc: "Read-only access to projects and analytics" },
};

function formatRelativeTime(dateStr?: string): string {
  if (!dateStr) return "Never";
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 2) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export default function TeamPage({ userId }: TeamPageProps) {
  const { language } = useSettings();
  const T = (key: Parameters<typeof t>[1]) => t(language, key);

  const { addNotification } = useNotifications(userId);
  const { members, loading, inviteMember, updateRole, removeMember } = useTeam(userId);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<TeamRole>("viewer");
  const [inviting, setInviting] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [roleDropdown, setRoleDropdown] = useState<string | null>(null);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { toast.error("Please enter an email address"); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) { toast.error("Please enter a valid email address"); return; }
    if (members.some((m) => m.user_email === email.trim())) {
      toast.error("This user is already in your team");
      return;
    }
    setInviting(true);

    const onNotify = async (title: string, message: string, type: "success" | "error" | "warning" | "info" | "team") => {
      await addNotification({ title, message, type: type as any });
    };

    try {
      await inviteMember(email.trim(), role, name.trim() || undefined, onNotify);
      toast.success(`Invitation sent to ${email}`);
      setEmail("");
      setName("");
      setRole("viewer");
    } catch (err: any) {
      toast.error(err.message || "Failed to send invitation");
    }
    setInviting(false);
  };

  const handleRoleChange = async (memberId: string, newRole: TeamRole) => {
    await updateRole(memberId, newRole);
    setRoleDropdown(null);
    toast.success("Role updated");
  };

  const handleRemove = async (member: TeamMember) => {
    setOpenMenu(null);
    await removeMember(member.id);
    toast.success(`${member.user_name} removed from team`);
  };

  const activeCount = members.filter((m) => m.status === "active").length;
  const pendingCount = members.filter((m) => m.status === "pending").length;

  return (
    <div className="min-h-screen pt-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8 animate-fade-in">
          <div>
            <h1 className="text-2xl font-bold mb-1">{T("teamTitle")}</h1>
            <p className="text-muted-foreground text-sm">{T("teamSubtitle")}</p>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <div className="glass rounded-xl border border-white/8 px-3 py-2 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-muted-foreground">{activeCount} {T("active").toLowerCase()}</span>
            </div>
            {pendingCount > 0 && (
              <div className="glass rounded-xl border border-white/8 px-3 py-2 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                <span className="text-muted-foreground">{pendingCount} {T("pending").toLowerCase()}</span>
              </div>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Invite Form */}
          <div className="animate-fade-in">
            <div className="glass rounded-2xl border border-white/8 p-5">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                  <UserPlus className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">{T("inviteMember")}</h3>
                  <p className="text-xs text-muted-foreground">{T("addCollaborator")}</p>
                </div>
              </div>

              <form onSubmit={handleInvite} className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                    <Mail className="w-3 h-3 inline me-1" />{T("emailAddress2")}
                  </label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="colleague@example.com"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500/40 transition-all placeholder:text-muted-foreground" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1.5">{T("nameOptional")}</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                    placeholder="Team member name"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500/40 transition-all placeholder:text-muted-foreground" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-2">{T("role")}</label>
                  <div className="space-y-2">
                    {(Object.keys(roleConfig) as TeamRole[]).map((r) => {
                      const cfg = roleConfig[r];
                      return (
                        <button key={r} type="button" onClick={() => setRole(r)}
                          className={cn(
                            "w-full flex items-start gap-3 p-3 rounded-xl border text-start transition-all",
                            role === r ? `${cfg.bg} ${cfg.color}` : "bg-white/3 border-white/8 text-muted-foreground hover:bg-white/5"
                          )}>
                          <cfg.icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="text-sm font-medium">{cfg.label}</div>
                            <div className="text-xs opacity-70 mt-0.5">{cfg.desc}</div>
                          </div>
                          {role === r && <CheckCircle className="w-4 h-4 ms-auto flex-shrink-0 mt-0.5" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <button type="submit" disabled={inviting}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all mt-2">
                  {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                  {inviting ? T("sending") : T("sendInvitation")}
                </button>
              </form>

              <div className="mt-5 pt-4 border-t border-white/5">
                <p className="text-xs text-muted-foreground mb-3 font-medium">{T("rolePermissions")}</p>
                <div className="space-y-2">
                  {(Object.entries(roleConfig) as [TeamRole, typeof roleConfig.admin][]).map(([r, cfg]) => (
                    <div key={r} className="flex items-center gap-2">
                      <span className={cn("flex items-center gap-1.5 text-xs font-medium w-20", cfg.color)}>
                        <cfg.icon className="w-3 h-3" />{cfg.label}
                      </span>
                      <span className="text-xs text-muted-foreground">{cfg.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Members List */}
          <div className="lg:col-span-2 space-y-3 animate-fade-in">
            <h3 className="text-sm font-medium text-muted-foreground mb-4">
              {T("teamMembers")} ({members.length})
            </h3>

            {loading ? (
              <div className="glass rounded-2xl border border-white/8 p-12 text-center">
                <Loader2 className="w-6 h-6 animate-spin text-blue-400 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Loading team members...</p>
              </div>
            ) : members.length === 0 ? (
              <div className="glass rounded-2xl border border-white/8 p-12 text-center">
                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
                  <Users className="w-7 h-7 text-muted-foreground" />
                </div>
                <h3 className="font-semibold mb-2">{T("noTeamMembers")}</h3>
                <p className="text-sm text-muted-foreground">{T("noTeamMembersDesc")}</p>
              </div>
            ) : (
              members.map((member) => {
                const cfg = roleConfig[member.role];
                return (
                  <div key={member.id}
                    className="glass rounded-xl border border-white/8 p-4 hover:border-white/12 transition-all duration-200 animate-fade-in">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                        {(member.user_name || member.user_email).charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm">
                            {member.user_name || member.user_email.split("@")[0]}
                          </span>
                          <span className={cn("flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium", cfg.bg, cfg.color)}>
                            <cfg.icon className="w-3 h-3" />{cfg.label}
                          </span>
                          <span className={cn(
                            "flex items-center gap-1 text-xs px-2 py-0.5 rounded-full",
                            member.status === "active" ? "bg-emerald-500/10 text-emerald-400" : "bg-yellow-500/10 text-yellow-400"
                          )}>
                            {member.status === "active"
                              ? <><CheckCircle className="w-3 h-3" /> {T("active")}</>
                              : <><Clock className="w-3 h-3" /> {T("pending")}</>}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-muted-foreground">{member.user_email}</span>
                          <span className="text-xs text-muted-foreground">
                            {T("lastActive")} {formatRelativeTime(member.last_activity || member.invited_at)}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 flex-shrink-0 relative">
                        <div className="relative">
                          <button onClick={() => setRoleDropdown(roleDropdown === member.id ? null : member.id)}
                            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5 rounded-lg hover:bg-white/5">
                            {T("changeRole")} <ChevronDown className="w-3 h-3" />
                          </button>
                          {roleDropdown === member.id && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setRoleDropdown(null)} />
                              <div className="absolute end-0 top-full mt-1 w-36 glass-strong rounded-xl border border-white/10 shadow-xl overflow-hidden z-20 animate-scale-in">
                                {(Object.keys(roleConfig) as TeamRole[]).map((r) => {
                                  const rcfg = roleConfig[r];
                                  return (
                                    <button key={r} onClick={() => handleRoleChange(member.id, r)}
                                      className={cn(
                                        "w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-white/5 transition-colors",
                                        member.role === r ? rcfg.color : "text-muted-foreground"
                                      )}>
                                      <rcfg.icon className="w-3.5 h-3.5" />
                                      {rcfg.label}
                                      {member.role === r && <CheckCircle className="w-3 h-3 ms-auto" />}
                                    </button>
                                  );
                                })}
                              </div>
                            </>
                          )}
                        </div>
                        <div className="relative">
                          <button onClick={() => setOpenMenu(openMenu === member.id ? null : member.id)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors text-muted-foreground">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          {openMenu === member.id && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setOpenMenu(null)} />
                              <div className="absolute end-0 top-full mt-1 w-36 glass-strong rounded-xl border border-white/10 shadow-xl overflow-hidden z-20 animate-scale-in">
                                <button onClick={() => handleRemove(member)}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 transition-colors">
                                  <Trash2 className="w-3.5 h-3.5" />{T("removeMember")}
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
