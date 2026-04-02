import { useState, useEffect } from "react";
import {
  X, Users, Globe, Smartphone, HardDrive, BarChart2,
  Shield, Trash2, Loader2, Search, Eye, Download,
  ShieldAlert, Crown, RefreshCw,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface AdminUser {
  id: string;
  email: string;
  username: string;
  display_name: string;
  is_admin: boolean;
  projectCount: number;
  storageUsed: number;
}

interface AdminProject {
  id: string;
  name: string;
  type: string;
  status: string;
  file_size: number;
  downloads: number;
  views: number;
  user_email: string;
  created_at: string;
}

interface SystemStats {
  totalUsers: number;
  totalProjects: number;
  totalStorageBytes: number;
  totalDownloads: number;
  totalViews: number;
  webProjects: number;
  apkProjects: number;
}

function formatBytes(bytes: number): string {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

interface AdminPanelProps {
  onClose: () => void;
}

export default function AdminPanel({ onClose }: AdminPanelProps) {
  const [tab, setTab] = useState<"stats" | "users" | "projects">("stats");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [projects, setProjects] = useState<AdminProject[]>([]);
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    setLoading(true);

    // Fetch all projects
    const { data: projectsData } = await supabase
      .from("projects")
      .select("id, name, type, status, file_size, downloads, views, user_id, created_at")
      .order("created_at", { ascending: false });

    // Fetch all user profiles
    const { data: profilesData } = await supabase
      .from("user_profiles")
      .select("id, email, username, display_name, is_admin");

    const allProjects = projectsData || [];
    const allProfiles = profilesData || [];

    // Build per-user stats
    const userMap: Record<string, AdminUser> = {};
    allProfiles.forEach((p) => {
      userMap[p.id] = {
        id: p.id,
        email: p.email,
        username: p.username || p.email?.split("@")[0] || "—",
        display_name: p.display_name || "",
        is_admin: p.is_admin || false,
        projectCount: 0,
        storageUsed: 0,
      };
    });

    // Map projects to users for email display
    const userEmailMap: Record<string, string> = {};
    allProfiles.forEach((p) => { userEmailMap[p.id] = p.email; });

    allProjects.forEach((proj: any) => {
      if (userMap[proj.user_id]) {
        userMap[proj.user_id].projectCount += 1;
        userMap[proj.user_id].storageUsed += proj.file_size || 0;
      }
    });

    const computedStats: SystemStats = {
      totalUsers: allProfiles.length,
      totalProjects: allProjects.length,
      totalStorageBytes: allProjects.reduce((a: number, b: any) => a + (b.file_size || 0), 0),
      totalDownloads: allProjects.reduce((a: number, b: any) => a + (b.downloads || 0), 0),
      totalViews: allProjects.reduce((a: number, b: any) => a + (b.views || 0), 0),
      webProjects: allProjects.filter((p: any) => p.type === "web").length,
      apkProjects: allProjects.filter((p: any) => p.type === "apk").length,
    };

    const enrichedProjects: AdminProject[] = allProjects.map((p: any) => ({
      ...p,
      user_email: userEmailMap[p.user_id] || "Unknown",
    }));

    setStats(computedStats);
    setUsers(Object.values(userMap));
    setProjects(enrichedProjects);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    // Close on Escape
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
    toast.success("Data refreshed");
  };

  const handleToggleAdmin = async (userId: string, current: boolean) => {
    const { error } = await supabase
      .from("user_profiles")
      .update({ is_admin: !current })
      .eq("id", userId);
    if (!error) {
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, is_admin: !current } : u));
      toast.success(!current ? "Admin granted" : "Admin revoked");
    }
  };

  const filteredUsers = users.filter((u) =>
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.username.toLowerCase().includes(search.toLowerCase())
  );
  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.user_email.toLowerCase().includes(search.toLowerCase())
  );

  const statCards = stats ? [
    { label: "Total Users",     value: stats.totalUsers,                    icon: Users,     color: "text-blue-400",   bg: "bg-blue-500/10" },
    { label: "Total Projects",  value: stats.totalProjects,                 icon: Globe,     color: "text-purple-400", bg: "bg-purple-500/10" },
    { label: "Total Storage",   value: formatBytes(stats.totalStorageBytes), icon: HardDrive, color: "text-orange-400", bg: "bg-orange-500/10" },
    { label: "Total Downloads", value: stats.totalDownloads.toLocaleString(), icon: Download,  color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { label: "Total Views",     value: stats.totalViews.toLocaleString(),   icon: Eye,       color: "text-cyan-400",   bg: "bg-cyan-500/10" },
    { label: "Web Projects",    value: stats.webProjects,                   icon: Globe,     color: "text-blue-400",   bg: "bg-blue-500/10" },
    { label: "APK Projects",    value: stats.apkProjects,                   icon: Smartphone, color: "text-pink-400",   bg: "bg-pink-500/10" },
    { label: "Security Level",  value: "Active",                            icon: Shield,    color: "text-emerald-400", bg: "bg-emerald-500/10" },
  ] : [];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />
      <div
        className="relative w-full max-w-5xl glass-strong rounded-2xl border border-red-500/30 shadow-2xl shadow-red-500/10 animate-scale-in overflow-hidden flex flex-col"
        style={{ maxHeight: "90vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8 bg-gradient-to-r from-red-950/30 to-transparent flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h2 className="font-bold text-base flex items-center gap-2">
                Admin Control Panel
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/20 font-mono">RESTRICTED</span>
              </h2>
              <p className="text-xs text-muted-foreground">System-wide management — handle with care</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleRefresh} disabled={refreshing}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors text-muted-foreground disabled:opacity-50">
              <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
            </button>
            <button onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-3 border-b border-white/8 flex-shrink-0">
          {([
            { id: "stats",    label: "System Stats",  icon: BarChart2 },
            { id: "users",    label: `Users (${users.length})`,    icon: Users },
            { id: "projects", label: `Projects (${projects.length})`, icon: Globe },
          ] as const).map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all",
                tab === t.id ? "bg-red-500/20 text-red-400 border border-red-500/20" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              )}>
              <t.icon className="w-4 h-4" />{t.label}
            </button>
          ))}
        </div>

        {/* Search (for users/projects tabs) */}
        {tab !== "stats" && (
          <div className="px-4 py-3 border-b border-white/5 flex-shrink-0">
            <div className="relative">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={tab === "users" ? "Search users..." : "Search projects..."}
                className="w-full bg-white/5 border border-white/10 rounded-xl ps-9 pe-3 py-2 text-xs focus:outline-none focus:border-red-500/40 transition-all placeholder:text-muted-foreground"
              />
            </div>
          </div>
        )}

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-red-400" />
              <p className="text-sm text-muted-foreground">Loading system data...</p>
            </div>
          ) : (
            <>
              {/* Stats Tab */}
              {tab === "stats" && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {statCards.map((card) => (
                    <div key={card.label} className="glass rounded-2xl border border-white/5 p-4 hover:border-white/10 transition-all">
                      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mb-3", card.bg)}>
                        <card.icon className={cn("w-4 h-4", card.color)} />
                      </div>
                      <div className="text-xl font-bold mb-0.5">{card.value}</div>
                      <div className="text-xs text-muted-foreground">{card.label}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Users Tab */}
              {tab === "users" && (
                <div className="space-y-2">
                  {filteredUsers.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground text-sm">No users found</div>
                  ) : (
                    filteredUsers.map((u) => (
                      <div key={u.id} className="glass rounded-xl border border-white/5 p-4 flex items-center gap-4 hover:border-white/10 transition-all">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                          {(u.display_name || u.username || u.email).charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm">{u.display_name || u.username}</span>
                            {u.is_admin && (
                              <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/20 font-medium">
                                <Crown className="w-2.5 h-2.5" /> Admin
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">{u.email}</div>
                          <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                            <span>{u.projectCount} projects</span>
                            <span>{formatBytes(u.storageUsed)} storage</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleToggleAdmin(u.id, u.is_admin)}
                          className={cn(
                            "text-xs px-3 py-1.5 rounded-lg border font-medium transition-all flex-shrink-0",
                            u.is_admin
                              ? "border-red-500/30 text-red-400 hover:bg-red-500/10"
                              : "border-white/10 text-muted-foreground hover:text-foreground hover:border-white/20"
                          )}>
                          {u.is_admin ? "Revoke Admin" : "Grant Admin"}
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Projects Tab */}
              {tab === "projects" && (
                <div className="space-y-2">
                  {filteredProjects.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground text-sm">No projects found</div>
                  ) : (
                    filteredProjects.map((p) => (
                      <div key={p.id} className="glass rounded-xl border border-white/5 p-4 flex items-center gap-4 hover:border-white/10 transition-all">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                          p.type === "web" ? "bg-blue-500/10 border border-blue-500/20" : "bg-purple-500/10 border border-purple-500/20"
                        )}>
                          {p.type === "web"
                            ? <Globe className="w-5 h-5 text-blue-400" />
                            : <Smartphone className="w-5 h-5 text-purple-400" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm truncate">{p.name}</span>
                            <span className={cn(
                              "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                              p.status === "live" ? "bg-emerald-500/15 text-emerald-400" :
                              p.status === "building" ? "bg-blue-500/15 text-blue-400" :
                              "bg-red-500/15 text-red-400"
                            )}>{p.status}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">{p.user_email}</div>
                          <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                            <span className="flex items-center gap-1"><Eye className="w-2.5 h-2.5" />{p.views}</span>
                            <span className="flex items-center gap-1"><Download className="w-2.5 h-2.5" />{p.downloads}</span>
                            <span>{formatBytes(p.file_size)}</span>
                          </div>
                        </div>
                        <div className="text-[10px] text-muted-foreground flex-shrink-0">
                          {new Date(p.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-white/8 bg-red-950/10 flex-shrink-0">
          <p className="text-[10px] text-red-400/60 text-center font-mono">
            ⚠ ADMIN ACCESS — Accessed via secret sequence · All actions are logged
          </p>
        </div>
      </div>
    </div>
  );
}
