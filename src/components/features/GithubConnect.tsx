import { useState } from "react";
import {
  GitBranch,
  Github,
  CheckCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Plus,
  Loader2,
  Zap,
} from "lucide-react";
import { GithubRepo } from "@/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function GithubConnect() {
  const [repos, setRepos] = useState<GithubRepo[]>([]);
  const [connecting, setConnecting] = useState(false);
  const [repoInput, setRepoInput] = useState("");
  const [triggering, setTriggering] = useState<string | null>(null);

  const handleConnect = async () => {
    if (!repoInput.trim()) {
      toast.error("Please enter a repository URL");
      return;
    }
    setConnecting(true);
    await new Promise((r) => setTimeout(r, 2000));
    const parts = repoInput.replace("https://github.com/", "").split("/");
    const newRepo: GithubRepo = {
      id: "repo_" + Date.now(),
      name: parts[1] || repoInput,
      fullName: `${parts[0]}/${parts[1]}`,
      url: repoInput,
      branch: "main",
      connected: true,
      lastBuild: new Date().toISOString(),
      buildStatus: "success",
    };
    setRepos([...repos, newRepo]);
    setRepoInput("");
    setConnecting(false);
    toast.success("Repository connected successfully!");
  };

  const triggerBuild = async (repoId: string) => {
    setTriggering(repoId);
    setRepos((prev) =>
      prev.map((r) => (r.id === repoId ? { ...r, buildStatus: "building" } : r))
    );
    await new Promise((r) => setTimeout(r, 3000));
    setRepos((prev) =>
      prev.map((r) =>
        r.id === repoId
          ? { ...r, buildStatus: "success", lastBuild: new Date().toISOString() }
          : r
      )
    );
    setTriggering(null);
    toast.success("Build triggered and deployed!");
  };

  const buildStatusConfig = {
    success: { icon: CheckCircle, color: "text-emerald-400", label: "Success" },
    building: { icon: Clock, color: "text-blue-400", label: "Building" },
    failed: { icon: AlertCircle, color: "text-red-400", label: "Failed" },
  };

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
            <p className="text-xs text-muted-foreground">Auto-deploy on every push</p>
          </div>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={repoInput}
            onChange={(e) => setRepoInput(e.target.value)}
            placeholder="https://github.com/username/repo"
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500/40 transition-all font-mono placeholder:text-muted-foreground placeholder:font-sans"
            onKeyDown={(e) => e.key === "Enter" && handleConnect()}
          />
          <button
            onClick={handleConnect}
            disabled={connecting}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-all"
          >
            {connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Connect
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Zap className="w-3 h-3 text-blue-400" />
            Auto-build on push
          </div>
          <div className="flex items-center gap-1.5">
            <GitBranch className="w-3 h-3 text-purple-400" />
            Branch selection
          </div>
          <div className="flex items-center gap-1.5">
            <RefreshCw className="w-3 h-3 text-emerald-400" />
            GitHub Actions CI/CD
          </div>
        </div>
      </div>

      {/* Connected Repos */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">Connected Repositories</h3>
        {repos.map((repo) => {
          const buildStatus = repo.buildStatus
            ? buildStatusConfig[repo.buildStatus]
            : buildStatusConfig.success;
          const BuildIcon = buildStatus.icon;

          return (
            <div
              key={repo.id}
              className="glass rounded-xl border border-white/8 p-4 hover:border-white/12 transition-all duration-200 animate-fade-in"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                  <Github className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{repo.fullName}</span>
                    <a
                      href={repo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-muted-foreground font-mono">
                      <GitBranch className="w-3 h-3 inline mr-1" />
                      {repo.branch}
                    </span>
                    <span className={cn("flex items-center gap-1 text-xs font-medium", buildStatus.color)}>
                      <BuildIcon className={cn("w-3 h-3", repo.buildStatus === "building" && "animate-spin")} />
                      {buildStatus.label}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => triggerBuild(repo.id)}
                  disabled={triggering === repo.id || repo.buildStatus === "building"}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-50 text-xs font-medium transition-all"
                >
                  {triggering === repo.id ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3 h-3" />
                  )}
                  Redeploy
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
