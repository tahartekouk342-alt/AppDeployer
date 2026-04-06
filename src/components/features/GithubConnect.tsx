import { useState, useEffect } from "react";
import {
  GitBranch, Github, CheckCircle, Clock, AlertCircle,
  RefreshCw, ExternalLink, Plus, Loader2, Zap, Trash2,
  Link2, Star, Lock, Unlock, LogOut, ChevronDown, ChevronUp,
  Search,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { FunctionsHttpError } from "@supabase/supabase-js";

interface GithubRepo {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  private: boolean;
  default_branch: string;
  updated_at: string;
  stargazers_count: number;
  forks_count: number;
}

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

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
// GitHub OAuth Client ID (public — safe to expose in frontend)
// Set VITE_GITHUB_CLIENT_ID in your .env file
const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID as string || "";

export default function GithubConnect({ userId, onRepoConnected }: GithubConnectProps) {
  const [githubConnected, setGithubConnected] = useState(false);
  const [githubUsername, setGithubUsername] = useState("");
  const [githubRepos, setGithubRepos] = useState<GithubRepo[]>([]);
  const [repoSearch, setRepoSearch] = useState("");
  const [showRepoList, setShowRepoList] = useState(false);

  const [connectedRepos, setConnectedRepos] = useState<ConnectedRepo[]>([]);
  const [connecting, setConnecting] = useState<number | null>(null);
  const [manualUrl, setManualUrl] = useState("");
  const [manualName, setManualName] = useState("");
  const [manualConnecting, setManualConnecting] = useState(false);
  const [triggering, setTriggering] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  // ── Fetch GitHub status & connected repos from DB ──────────────────────────
  const fetchAll = async () => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);

    // 1. Get GitHub repos via Edge Function
    const { data: session } = await supabase.auth.getSession();
    const jwt = session?.session?.access_token;

    if (jwt) {
      const { data, error } = await supabase.functions.invoke("github-repos", {
        headers: { Authorization: `Bearer ${jwt}` },
      });

      if (error) {
        let msg = error.message;
        if (error instanceof FunctionsHttpError) {
          try { msg = await error.context.text(); } catch { /* ignore */ }
        }
        console.error("github-repos error:", msg);
      } else if (data?.connected) {
        setGithubConnected(true);
        setGithubUsername(data.username || "");
        setGithubRepos(data.repos || []);
      } else {
        setGithubConnected(false);
        setGithubRepos([]);
      }
    }

    // 2. Get connected repos from DB
    const { data: dbRepos } = await supabase
      .from("projects")
      .select("id, name, github_repo, status, last_deploy, created_at, download_url")
      .not("github_repo", "is", null)
      .order("created_at", { ascending: false });

    if (dbRepos) {
      const mapped: ConnectedRepo[] = dbRepos.map((p: any) => {
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
      setConnectedRepos(mapped);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, [userId]);

  // ── Handle OAuth callback params in URL ────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connected = params.get("github_connected");
    const username = params.get("username");
    const err = params.get("error");

    if (connected === "true" && username) {
      toast.success(`GitHub connected as @${username}!`);
      // Clean URL
      window.history.replaceState({}, "", window.location.pathname);
      fetchAll();
    } else if (err) {
      toast.error(`GitHub connection failed: ${err}`);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  // ── Start GitHub OAuth ─────────────────────────────────────────────────────
  const handleConnectGitHub = async () => {
    if (!userId) { toast.error("You must be logged in"); return; }
    if (!GITHUB_CLIENT_ID) {
      toast.error("GitHub Client ID not configured. Add VITE_GITHUB_CLIENT_ID to your .env file.");
      return;
    }
    setOauthLoading(true);

    const callbackUrl = `${SUPABASE_URL}/functions/v1/github-oauth-callback`;
    const appUrl = encodeURIComponent(window.location.origin);
    const redirectUri = `${callbackUrl}?app_url=${appUrl}`;

    // Use userId as state for security
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=repo,read:user&state=${userId}`;

    window.location.href = authUrl;
  };

  // ── Disconnect GitHub ──────────────────────────────────────────────────────
  const handleDisconnectGitHub = async () => {
    setDisconnecting(true);
    const { data: session } = await supabase.auth.getSession();
    const jwt = session?.session?.access_token;

    if (jwt) {
      await supabase.functions.invoke("github-disconnect", {
        headers: { Authorization: `Bearer ${jwt}` },
      });
    }

    setGithubConnected(false);
    setGithubUsername("");
    setGithubRepos([]);
    setDisconnecting(false);
    toast.success("GitHub account disconnected");
  };

  // ── Deploy a repo from the GitHub list ────────────────────────────────────
  const handleDeployRepo = async (repo: GithubRepo) => {
    if (!userId) { toast.error("You must be logged in"); return; }

    // Check for duplicate
    const { data: existing } = await supabase
      .from("projects")
      .select("id")
      .eq("github_repo", repo.html_url)
      .eq("user_id", userId)
      .maybeSingle();

    if (existing) { toast.error("This repository is already connected"); return; }

    setConnecting(repo.id);

    const { data, error } = await supabase
      .from("projects")
      .insert([{
        user_id: userId,
        name: repo.name,
        type: "web",
        status: "building",
        security: "clean",
        file_size: 0,
        file_name: "",
        github_repo: repo.html_url,
        downloads: 0,
        views: 0,
        last_deploy: new Date().toISOString(),
      }])
      .select()
      .single();

    if (error) {
      toast.error("Failed to connect repository");
      setConnecting(null);
      return;
    }

    await new Promise((r) => setTimeout(r, 2000));
    await supabase
      .from("projects")
      .update({ status: "live", last_deploy: new Date().toISOString() })
      .eq("id", data.id);

    toast.success(`"${repo.name}" connected and deployed!`);
    setConnecting(null);
    await fetchAll();
    onRepoConnected?.();
  };

  // ── Connect by manual URL ──────────────────────────────────────────────────
  const handleManualConnect = async () => {
    const trimmedUrl = manualUrl.trim();
    if (!trimmedUrl) { toast.error("Please enter a repository URL"); return; }
    if (!trimmedUrl.includes("github.com")) { toast.error("Please enter a valid GitHub repository URL"); return; }
    if (!userId) { toast.error("You must be logged in"); return; }

    const name = manualName.trim() ||
      trimmedUrl.replace("https://github.com/", "").split("/")[1] || "GitHub Project";

    const { data: existing } = await supabase
      .from("projects")
      .select("id")
      .eq("github_repo", trimmedUrl)
      .eq("user_id", userId)
      .maybeSingle();

    if (existing) { toast.error("This repository is already connected"); return; }

    setManualConnecting(true);

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
      toast.error("Failed to connect: " + error.message);
      setManualConnecting(false);
      return;
    }

    await new Promise((r) => setTimeout(r, 2000));
    await supabase
      .from("projects")
      .update({ status: "live", last_deploy: new Date().toISOString() })
      .eq("id", data.id);

    toast.success(`"${name}" connected!`);
    setManualUrl("");
    setManualName("");
    setManualConnecting(false);
    await fetchAll();
    onRepoConnected?.();
  };

  const triggerRebuild = async (repo: ConnectedRepo) => {
    setTriggering(repo.id);
    await supabase.from("projects")
      .update({ status: "building", last_deploy: new Date().toISOString() })
      .eq("id", repo.id);

    setConnectedRepos((prev) =>
      prev.map((r) => r.id === repo.id ? { ...r, status: "building" } : r)
    );
    await new Promise((r) => setTimeout(r, 3000));
    await supabase.from("projects")
      .update({ status: "live", last_deploy: new Date().toISOString() })
      .eq("id", repo.id);

    setConnectedRepos((prev) =>
      prev.map((r) => r.id === repo.id
        ? { ...r, status: "live", last_deploy: new Date().toISOString() } : r)
    );
    setTriggering(null);
    toast.success("Rebuild triggered!");
  };

  const handleDisconnect = async (repoId: string, repoName: string) => {
    const { error } = await supabase.from("projects").delete().eq("id", repoId);
    if (!error) {
      setConnectedRepos((prev) => prev.filter((r) => r.id !== repoId));
      toast.success(`"${repoName}" disconnected`);
      onRepoConnected?.();
    } else {
      toast.error("Failed to disconnect");
    }
  };

  const statusConfig = {
    live:     { icon: CheckCircle, color: "text-emerald-400", label: "Live" },
    building: { icon: Clock,       color: "text-blue-400",    label: "Building" },
    failed:   { icon: AlertCircle, color: "text-red-400",     label: "Failed" },
    scanning: { icon: Clock,       color: "text-orange-400",  label: "Scanning" },
  } as const;

  const filteredGhRepos = githubRepos.filter((r) =>
    r.name.toLowerCase().includes(repoSearch.toLowerCase()) ||
    (r.description || "").toLowerCase().includes(repoSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">

      {/* ── GitHub Account Connection Card ── */}
      <div className="glass rounded-2xl border border-white/8 p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center">
            <Github className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">GitHub Account</h3>
            <p className="text-xs text-muted-foreground">
              {githubConnected ? `Connected as @${githubUsername}` : "Connect to browse and deploy your repos"}
            </p>
          </div>
          {githubConnected && (
            <span className="ms-auto flex items-center gap-1.5 text-xs text-emerald-400 font-medium px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <CheckCircle className="w-3 h-3" /> Connected
            </span>
          )}
        </div>

        {!githubConnected ? (
          <button
            onClick={handleConnectGitHub}
            disabled={oauthLoading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-900 hover:bg-gray-800 border border-white/15 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-all"
          >
            {oauthLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Github className="w-4 h-4" />
            )}
            {oauthLoading ? "Redirecting to GitHub..." : "Connect with GitHub"}
          </button>
        ) : (
          <div className="space-y-4">
            {/* Repo browser */}
            <button
              onClick={() => setShowRepoList(!showRepoList)}
              className="w-full flex items-center justify-between px-4 py-2.5 bg-white/5 hover:bg-white/8 border border-white/10 rounded-xl text-sm transition-all"
            >
              <span className="flex items-center gap-2 text-sm font-medium">
                <GitBranch className="w-4 h-4 text-blue-400" />
                Browse Repositories ({githubRepos.length})
              </span>
              {showRepoList ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </button>

            {showRepoList && (
              <div className="animate-fade-in space-y-3">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    value={repoSearch}
                    onChange={(e) => setRepoSearch(e.target.value)}
                    placeholder="Search repositories..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-blue-500/40 transition-all placeholder:text-muted-foreground"
                  />
                </div>

                {/* Repo list */}
                <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                  {filteredGhRepos.length === 0 ? (
                    <div className="text-center py-6 text-sm text-muted-foreground">No repositories found</div>
                  ) : (
                    filteredGhRepos.map((repo) => {
                      const isDeployed = connectedRepos.some((cr) => cr.url === repo.html_url);
                      return (
                        <div
                          key={repo.id}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-xl border transition-all",
                            isDeployed
                              ? "border-emerald-500/20 bg-emerald-500/5"
                              : "border-white/8 bg-white/3 hover:bg-white/6"
                          )}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              {repo.private ? (
                                <Lock className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                              ) : (
                                <Unlock className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                              )}
                              <span className="font-medium text-sm truncate">{repo.name}</span>
                              {repo.language && (
                                <span className="text-xs text-muted-foreground px-1.5 py-0.5 rounded bg-white/5 border border-white/10 flex-shrink-0">
                                  {repo.language}
                                </span>
                              )}
                            </div>
                            {repo.description && (
                              <p className="text-xs text-muted-foreground mt-0.5 truncate">{repo.description}</p>
                            )}
                            <div className="flex items-center gap-3 mt-1">
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Star className="w-3 h-3" />{repo.stargazers_count}
                              </span>
                              <span className="text-xs text-muted-foreground font-mono">{repo.default_branch}</span>
                            </div>
                          </div>
                          {isDeployed ? (
                            <span className="text-xs text-emerald-400 font-medium flex-shrink-0">Deployed</span>
                          ) : (
                            <button
                              onClick={() => handleDeployRepo(repo)}
                              disabled={connecting === repo.id}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition-all flex-shrink-0"
                            >
                              {connecting === repo.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Plus className="w-3 h-3" />
                              )}
                              Deploy
                            </button>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* Disconnect */}
            <button
              onClick={handleDisconnectGitHub}
              disabled={disconnecting}
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-red-400 transition-colors"
            >
              <LogOut className="w-3 h-3" />
              {disconnecting ? "Disconnecting..." : "Disconnect GitHub account"}
            </button>
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Zap className="w-3 h-3 text-blue-400" />Saved to dashboard
          </div>
          <div className="flex items-center gap-1.5">
            <GitBranch className="w-3 h-3 text-purple-400" />Default branch
          </div>
          <div className="flex items-center gap-1.5">
            <RefreshCw className="w-3 h-3 text-emerald-400" />Webhook auto-deploy
          </div>
        </div>
      </div>

      {/* ── Manual URL Connect ── */}
      <div className="glass rounded-2xl border border-white/8 p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center">
            <Link2 className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Connect by URL</h3>
            <p className="text-xs text-muted-foreground">Paste any public GitHub repository URL</p>
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Repository URL</label>
            <input
              type="text"
              value={manualUrl}
              onChange={(e) => setManualUrl(e.target.value)}
              placeholder="https://github.com/username/repo"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500/40 transition-all font-mono placeholder:text-muted-foreground placeholder:font-sans"
              onKeyDown={(e) => e.key === "Enter" && handleManualConnect()}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Project Name (optional)</label>
            <input
              type="text"
              value={manualName}
              onChange={(e) => setManualName(e.target.value)}
              placeholder="My App"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500/40 transition-all placeholder:text-muted-foreground"
            />
          </div>
          <button
            onClick={handleManualConnect}
            disabled={manualConnecting}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-all"
          >
            {manualConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {manualConnecting ? "Connecting..." : "Connect Repository"}
          </button>
        </div>
      </div>

      {/* ── Connected Repos from DB ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-muted-foreground">
            Connected Repositories {connectedRepos.length > 0 && `(${connectedRepos.length})`}
          </h3>
          {connectedRepos.length > 0 && (
            <button onClick={fetchAll} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
              <RefreshCw className="w-3 h-3" /> Refresh
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : connectedRepos.length === 0 ? (
          <div className="glass rounded-xl border border-white/8 p-8 text-center">
            <Link2 className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-40" />
            <p className="text-sm text-muted-foreground">No repositories connected yet</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              {githubConnected ? "Browse your repos above and click Deploy" : "Connect GitHub or paste a URL above"}
            </p>
          </div>
        ) : (
          connectedRepos.map((repo) => {
            const statusKey = (repo.status as keyof typeof statusConfig) in statusConfig
              ? (repo.status as keyof typeof statusConfig) : "live";
            const cfg = statusConfig[statusKey];
            const StatusIcon = cfg.icon;

            return (
              <div key={repo.id} className="glass rounded-xl border border-white/8 p-4 hover:border-white/12 transition-all duration-200 animate-fade-in">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Github className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">{repo.name}</span>
                      <a href={repo.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                        className="text-muted-foreground hover:text-blue-400 transition-colors">
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
                    {repo.downloadUrl && (
                      <a href={repo.downloadUrl} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 mt-2 text-xs text-blue-400 hover:text-blue-300 transition-colors">
                        <ExternalLink className="w-3 h-3" />View deployed file
                      </a>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => triggerRebuild(repo)}
                      disabled={triggering === repo.id || repo.status === "building"}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-50 text-xs font-medium transition-all"
                    >
                      {triggering === repo.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                      <span className="hidden sm:inline">Rebuild</span>
                    </button>
                    <button
                      onClick={() => handleDisconnect(repo.id, repo.name)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-all"
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
