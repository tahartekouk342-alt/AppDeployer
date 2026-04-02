import { GitBranch, Github, Zap, RefreshCw, CheckCircle, Info } from "lucide-react";
import GithubConnect from "@/components/features/GithubConnect";

export default function GithubPage() {
  const cicdSteps = [
    { step: "1", label: "Connect Repo", desc: "Link your GitHub repository" },
    { step: "2", label: "Auto Detect", desc: "We detect ZIP or APK output" },
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
              <p className="text-sm font-medium mb-1">Powered by GitHub Actions</p>
              <p className="text-xs text-muted-foreground">
                AppDeployer automatically adds a <code className="font-mono text-blue-400 bg-blue-500/10 px-1 rounded">.github/workflows/deploy.yml</code> file to your repository.
                This workflow builds your project and sends the artifact to AppDeployer on every push to the <code className="font-mono text-purple-400 bg-purple-500/10 px-1 rounded">main</code> branch.
              </p>
              <div className="mt-3 font-mono text-xs p-3 bg-black/30 rounded-lg border border-white/5 text-muted-foreground space-y-1">
                <div><span className="text-blue-400">on:</span> push</div>
                <div className="pl-2"><span className="text-purple-400">branches:</span> [main]</div>
                <div><span className="text-blue-400">jobs:</span></div>
                <div className="pl-2"><span className="text-emerald-400">build-and-deploy</span>:</div>
                <div className="pl-4">runs-on: ubuntu-latest</div>
                <div className="pl-4 text-muted-foreground/60">... build steps ...</div>
                <div className="pl-4 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400">deploy to AppDeployer</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Connect Component */}
        <div className="animate-fade-in">
          <GithubConnect />
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 mt-8 animate-fade-in">
          {[
            { icon: GitBranch, label: "Repos Connected", value: "3" },
            { icon: RefreshCw, label: "Total Builds", value: "47" },
            { icon: CheckCircle, label: "Success Rate", value: "95.7%" },
          ].map((stat) => (
            <div key={stat.label} className="glass rounded-xl border border-white/8 p-4 text-center">
              <stat.icon className="w-5 h-5 text-blue-400 mx-auto mb-2" />
              <div className="text-xl font-bold">{stat.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
