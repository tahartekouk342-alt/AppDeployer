import { useState, useEffect } from "react";
import { GitBranch, Github, Zap, RefreshCw, CheckCircle, Info, Loader2 } from "lucide-react";
import GithubConnect from "@/components/features/GithubConnect";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

interface GithubStats {
  connected: number;
  totalBuilds: number;
  liveRepos: number;
}

export default function GithubPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<GithubStats>({ connected: 0, totalBuilds: 0, liveRepos: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  const fetchStats = async () => {
    if (!user?.id) { setStatsLoading(false); return; }
    setStatsLoading(true);

    const { data } = await supabase
      .from("projects")
      .select("id, status")
      .not("github_repo", "is", null);

    const all = data || [];
    setStats({
      connected: all.length,
      totalBuilds: all.length,                             // each connected = at least 1 build
      liveRepos: all.filter((p: any) => p.status === "live").length,
    });
    setStatsLoading(false);
  };

  useEffect(() => {
    fetchStats();
  }, [user?.id]);

  const cicdSteps = [
    { step: "1", label: "Connect Repo",   desc: "Link your GitHub repository" },
    { step: "2", label: "Auto Detect",    desc: "We detect ZIP or APK output" },
    { step: "3", label: "Push to Deploy", desc: "Every push triggers a build" },
    { step: "4", label: "Live Instantly", desc: "Deployed in under 60 seconds" },
  ];

  return (
    <div className="min-h-screen pt-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        {/* Header */}
        <div className="text-center mb-10 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm font-medium mb-4">
            <Github className="w-4 h-4" />
            GitHub Integration
          </div>
          <h1 className="text-3xl font-extrabold mb-3">
            Auto-Deploy from <span className="gradient-text">GitHub</span>
          </h1>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Connect your repositories and trigger automatic builds and deployments on every push using GitHub Actions.
          </p>
        </div>

        {/* CI/CD Flow */}
        <div className="glass rounded-2xl border border-white/8 p-6 mb-8 animate-fade-in">
          <div className="flex items-center gap-2 mb-5">
            <Zap className="w-4 h-4 text-blue-400" />
            <span className="font-semibold text-sm">CI/CD Pipeline</span>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {cicdSteps.map((s, i) => (
              <div key={s.step} className="flex items-start gap-3">
                <div className="flex-shrink-0 flex flex-col items-center">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-500/20 text-blue-400 font-bold text-sm flex items-center justify-center">
                    {s.step}
                  </div>
                  {i < cicdSteps.length - 1 && (
                    <div className="hidden lg:block w-px h-full bg-gradient-to-b from-blue-500/30 to-transparent mt-2" />
                  )}
                </div>
                <div>
                  <div className="font-semibold text-sm">{s.label}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* GitHub Actions Info */}
        <div className="glass rounded-2xl border border-white/8 p-5 mb-8 animate-fade-in">
          <div className="flex items-start gap-3">
            <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium mb-1">Powered by GitHub Webhooks</p>
              <p className="text-xs text-muted-foreground">
                AppDeployer listens to GitHub push events via webhooks. When you push to{" "}
                <code className="font-mono text-purple-400 bg-purple-500/10 px-1 rounded">main</code>, we automatically
                update your project status and send you a notification.
              </p>
              <div className="mt-3 font-mono text-xs p-3 bg-black/30 rounded-lg border border-white/5 text-muted-foreground space-y-1">
                <div><span className="text-blue-400">Webhook URL:</span></div>
                <div className="pl-2 text-emerald-400 break-all">
                  {import.meta.env.VITE_SUPABASE_URL}/functions/v1/github-webhook
                </div>
                <div className="mt-2 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400">Add this to your repo Settings → Webhooks</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Connect Component */}
        <div className="animate-fade-in">
          <GithubConnect userId={user?.id} onRepoConnected={fetchStats} />
        </div>

        {/* Real Stats Row */}
        <div className="grid grid-cols-3 gap-4 mt-8 animate-fade-in">
          {statsLoading ? (
            <div className="col-span-3 flex items-center justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="glass rounded-xl border border-white/8 p-4 text-center">
                <GitBranch className="w-5 h-5 text-blue-400 mx-auto mb-2" />
                <div className="text-xl font-bold">{stats.connected}</div>
                <div className="text-xs text-muted-foreground mt-0.5">Repos Connected</div>
              </div>
              <div className="glass rounded-xl border border-white/8 p-4 text-center">
                <RefreshCw className="w-5 h-5 text-purple-400 mx-auto mb-2" />
                <div className="text-xl font-bold">{stats.totalBuilds}</div>
                <div className="text-xs text-muted-foreground mt-0.5">Total Builds</div>
              </div>
              <div className="glass rounded-xl border border-white/8 p-4 text-center">
                <CheckCircle className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
                <div className="text-xl font-bold">{stats.connected > 0 ? Math.round((stats.liveRepos / stats.connected) * 100) : 0}%</div>
                <div className="text-xs text-muted-foreground mt-0.5">Success Rate</div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
