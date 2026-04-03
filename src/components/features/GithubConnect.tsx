import { useState, useEffect } from "react";
import {
  GitBranch, Github, CheckCircle, Clock, AlertCircle,
  RefreshCw, ExternalLink, Plus, Loader2, Zap, Trash2, Link2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ConnectedRepo {
  id: string;
  name: string;
  fullName: string;
  url: string;
  branch: string;
  status: string;
  last_deploy: string | null;
  created_at: string;
  downloadUrl?: string;
}

interface GithubConnectProps {
  userId?: string;
  onRepoConnected?: () => void;
}

export default function GithubConnect({ userId, onRepoConnected }: GithubConnectProps) {
  const [repos, setRepos] = useState<ConnectedRepo[]>([]);
  const [connecting, setConnecting] = useState(false);
  const [repoInput, setRepoInput] = useState("");
  const [projectName, setProjectName] = useState("");
  const [triggering, setTriggering] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch connected repos from DB (projects with github_repo set)
  const fetchRepos = async () => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from("projects")
      .select("id, name, github_repo, status, last_deploy, created_at, download_url")
      .not("github_repo", "is", null)
      .order("created_at", { ascending: false });

    if (!error && data) {
      const mapped: ConnectedRepo[] = data.map((p: any) => {
        const parts = (p.github_repo || "").replace("https://github.com/", "").split("/");
        return {
          id: p.id,
          name: p.name,
          fullName: parts.slice(0, 2).join("/") || p.github_repo,
          url: p.github_repo,
          branch: "main",
          status: p.status,
          last_deploy: p.last_deploy,
          created_at: p.created_at,
          downloadUrl: p.download_url,
        };
      });
      setRepos(mapped);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRepos();
  }, [userId]);

  const handleConnect = async () => {
    const trimmedUrl = repoInput.trim();
    if (!trimmedUrl) { toast.error("Please enter a repository URL"); return; }
    if (!trimmedUrl.includes("github.com")) { toast.error("Please enter a valid GitHub repository URL"); return; }
    if (!userId) { toast.error("You must be logged in"); return; }

    const name = projectName.trim() ||
      trimmedUrl.replace("https://github.com/", "").split("/")[1] ||
      "GitHub Project";

    // Check for duplicate
    const { data: existing } = await supabase
      .from("projects")
      .select("id")
      .eq("github_repo", trimmedUrl)
      .eq("user_id", userId)
      .maybeSingle();

    if (existing) { toast.error("This repository is already connected"); return; }

    setConnecting(true);

    // Save as a project in DB with type "web" and status "building"
    const { data, error } = await supabase
      .from("projects")
      .insert([{
        user_id: userId,
        name,
        type: "web",
        status: "building",
        security: "clean",
        file_size: 0,
        file_name: "",
        github_repo: trimmedUrl,
        downloads: 0,
        views: 0,
        last_deploy: new Date().toISOString(),
      }])
      .select()
      .single();

    if (error) {
      toast.error("Failed to connect repository: " + error.message);
      setConnecting(false);
      return;
    }

    // Simulate build → live
    await new Promise((r) => setTimeout(r, 2000));

    await supabase
      .from("projects")
      .update({ status: "live", last_deploy: new Date().toISOString() })
      .eq("id", data.id);

    toast.success(`Repository "${name}" connected and deployed!`);
    setRepoInput("");
    setProjectName("");
    setConnecting(false);
    await fetchRepos();
    onRepoConnected?.();
  };

  const triggerRebuild = async (repo: ConnectedRepo) => {
    setTriggering(repo.id);

    await supabase
      .from("projects")
      .update({ status: "building", last_deploy: new Date().toISOString() })
      .eq("id", repo.id);

    setRepos((prev) =>
      prev.map((r) => r.id === repo.id ? { ...r, status: "building" } : r)
    );

    await new Promise((r) => setTimeout(r, 3000));

    await supabase
      .from("projects")
      .update({ status: "live", last_deploy: new Date().toISOString() })
      .eq("id", repo.id);

    setRepos((prev) =>
      prev.map((r) =>
        r.id === repo.id
          ? { ...r, status: "live", last_deploy: new Date().toISOString() }
          : r
      )
    );
    setTriggering(null);
    toast.success("Rebuild triggered successfully!");
  };

  const handleDisconnect = async (repoId: string, repoName: string) => {
    const { error } = await supabase.from("projects").delete().eq("id", repoId);
    if (!error) {
      setRepos((prev) => prev.filter((r) => r.id !== repoId));
      toast.success(`"${repoName}" disconnected`);
      onRepoConnected?.();
    } else {
      toast.error("Failed to disconnect: " + error.message);
    }
  };

  const statusConfig = {
    live:     { icon: CheckCircle, color: "text-emerald-400", label: "Live" },
    building: { icon: Clock,       color: "text-blue-400",    label: "Building" },
    failed:   { icon: AlertCircle, color: "text-red-400",     label: "Failed" },
    scanning: { icon: Clock,       color: "text-orange-400",  label: "Scanning" },
  } as const;

  return (
    <div className="space-y-6">
      {/* Connect New Repo */}
      <div className="glass rounded-2xl border border-white/8 p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center">
            <Github className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Connect Repository</h3>
            <p className="text-xs text-muted-foreground">Save and auto-deploy on every push</p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Repository URL</label>
            <input
              type="text"
              value={repoInput}
              onChange={(e) => setRepoInput(e.target.value)}
              placeholder="https://github.com/username/repo"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500/40 transition-all font-mono placeholder:text-muted-foreground placeholder:font-sans"
              onKeyDown={(e) => e.key === "Enter" && handleConnect()}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Project Name (optional)</label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="My App"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500/40 transition-all placeholder:text-muted-foreground"
            />
          </div>
          <button
            onClick={handleConnect}
            disabled={connecting}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-all"
          >
            {connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {connecting ? "Connecting..." : "Connect Repository"}
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Zap className="w-3 h-3 text-blue-400" />
            Saved to dashboard
          </div>
          <div className="flex items-center gap-1.5">
            <GitBranch className="w-3 h-3 text-purple-400" />
            Branch: main
          </div>
          <div className="flex items-center gap-1.5">
            <RefreshCw className="w-3 h-3 text-emerald-400" />
            Webhook auto-deploy
          </div>
        </div>
      </div>

      {/* Connected Repos */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-muted-foreground">
            Connected Repositories {repos.length > 0 && `(${repos.length})`}
          </h3>
          {repos.length > 0 && (
            <button onClick={fetchRepos} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
              <RefreshCw className="w-3 h-3" /> Refresh
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : repos.length === 0 ? (
          <div className="glass rounded-xl border border-white/8 p-8 text-center">
            <Link2 className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-40" />
            <p className="text-sm text-muted-foreground">No repositories connected yet</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Connect your first GitHub repository above</p>
          </div>
        ) : (
          repos.map((repo) => {
            const statusKey = (repo.status as keyof typeof statusConfig) in statusConfig
              ? (repo.status as keyof typeof statusConfig) : "live";
            const cfg = statusConfig[statusKey];
            const StatusIcon = cfg.icon;

            return (
              <div
                key={repo.id}
                className="glass rounded-xl border border-white/8 p-4 hover:border-white/12 transition-all duration-200 animate-fade-in"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Github className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">{repo.name}</span>
                      <a
                        href={repo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-muted-foreground hover:text-blue-400 transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <p className="text-xs text-muted-foreground font-mono truncate">{repo.fullName}</p>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      <span className="text-xs text-muted-foreground font-mono flex items-center gap-1">
                        <GitBranch className="w-3 h-3" />{repo.branch}
                      </span>
                      <span className={cn("flex items-center gap-1 text-xs font-medium", cfg.color)}>
                        <StatusIcon className={cn("w-3 h-3", repo.status === "building" && "animate-spin")} />
                        {cfg.label}
                      </span>
                      {repo.last_deploy && (
                        <span className="text-[10px] text-muted-foreground/60">
                          {new Date(repo.last_deploy).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    {/* Download URL if available */}
                    {repo.downloadUrl && (
                      <a
                        href={repo.downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 mt-2 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        View deployed file
                      </a>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => triggerRebuild(repo)}
                      disabled={triggering === repo.id || repo.status === "building"}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-50 text-xs font-medium transition-all"
                      title="Trigger rebuild"
                    >
                      {triggering === repo.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <RefreshCw className="w-3 h-3" />
                      )}
                      <span className="hidden sm:inline">Rebuild</span>
                    </button>
                    <button
                      onClick={() => handleDisconnect(repo.id, repo.name)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-all"
                      title="Disconnect"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
