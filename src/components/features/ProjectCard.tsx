import { useState } from "react";
import {
  Globe, Smartphone, Download, Eye, ExternalLink, Trash2,
  Copy, CheckCircle, Clock, AlertCircle, Shield, ShieldAlert,
  GitBranch, MoreVertical, Globe2,
} from "lucide-react";
import { Project } from "@/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ProjectCardProps {
  project: Project;
  onDelete: (id: string) => void;
  onClick: (project: Project) => void;
  onUpdateDomain?: (id: string, domain: string) => Promise<void>;
}

const statusConfig = {
  live: { label: "Live", icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  building: { label: "Building", icon: Clock, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
  failed: { label: "Failed", icon: AlertCircle, color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
  scanning: { label: "Scanning", icon: Shield, color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20" },
};

const securityConfig = {
  clean: { label: "Clean", icon: Shield, color: "text-emerald-400" },
  scanning: { label: "Scanning", icon: Shield, color: "text-orange-400" },
  threat: { label: "Threat", icon: ShieldAlert, color: "text-red-400" },
  unknown: { label: "Unknown", icon: Shield, color: "text-muted-foreground" },
};

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export default function ProjectCard({ project, onDelete, onClick, onUpdateDomain }: ProjectCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showDomain, setShowDomain] = useState(false);
  const [copied, setCopied] = useState(false);
  const [domain, setDomain] = useState(project.custom_domain || "");
  const [savingDomain, setSavingDomain] = useState(false);

  const status = statusConfig[project.status];
  const security = securityConfig[project.security];
  const StatusIcon = status.icon;
  const SecurityIcon = security.icon;

  const url = project.type === "web" ? project.previewUrl : project.downloadUrl;

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (url) {
      navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(false);
    onDelete(project.id);
    toast.success("Project deleted");
  };

  const handleSaveDomain = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setSavingDomain(true);
    if (onUpdateDomain) {
      await onUpdateDomain(project.id, domain.trim());
    }
    setSavingDomain(false);
    toast.success(domain.trim() ? "Custom domain saved!" : "Custom domain removed");
    setShowDomain(false);
  };

  return (
    <div
      onClick={() => onClick(project)}
      className="glass rounded-2xl border border-white/5 p-5 hover:border-white/12 hover:bg-white/4 transition-all duration-200 cursor-pointer group animate-fade-in"
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
          project.type === "web" ? "bg-blue-500/15 border border-blue-500/20" : "bg-purple-500/15 border border-purple-500/20"
        )}>
          {project.type === "web" ? (
            <Globe className="w-6 h-6 text-blue-400" />
          ) : (
            <Smartphone className="w-6 h-6 text-purple-400" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-semibold text-sm truncate">{project.name}</h3>
              <p className="text-xs text-muted-foreground mt-0.5 font-mono truncate">
                {project.custom_domain ? (
                  <span className="text-blue-400">{project.custom_domain}</span>
                ) : (
                  url || project.fileName
                )}
              </p>
            </div>
            <div className="relative flex-shrink-0">
              <button
                onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100"
              >
                <MoreVertical className="w-4 h-4 text-muted-foreground" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-full mt-1 w-44 glass-strong rounded-xl border border-white/10 shadow-xl overflow-hidden z-10 animate-scale-in">
                  <button onClick={handleCopy}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-white/5 transition-colors">
                    {copied ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
                    Copy Link
                  </button>
                  {url && (
                    <a href={url} target="_blank" rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-white/5 transition-colors">
                      <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                      Open URL
                    </a>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); setMenuOpen(false); setShowDomain(!showDomain); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-white/5 transition-colors">
                    <Globe2 className="w-3.5 h-3.5 text-blue-400" />
                    Custom Domain
                  </button>
                  <button onClick={handleDelete}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-red-500/10 text-red-400 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Tags */}
          <div className="flex items-center flex-wrap gap-2 mt-3">
            <span className={cn(
              "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border",
              status.bg, status.color
            )}>
              <StatusIcon className="w-3 h-3" />{status.label}
            </span>
            <span className={cn("flex items-center gap-1 text-xs", security.color)}>
              <SecurityIcon className="w-3 h-3" />{security.label}
            </span>
            {project.githubRepo && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <GitBranch className="w-3 h-3" />{project.githubRepo}
              </span>
            )}
            {project.version && (
              <span className="text-xs text-muted-foreground font-mono">v{project.version}</span>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 mt-3">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Eye className="w-3 h-3" />{project.views.toLocaleString()}
            </span>
            {project.type === "apk" && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Download className="w-3 h-3" />{project.downloads.toLocaleString()}
              </span>
            )}
            <span className="text-xs text-muted-foreground ml-auto">
              {formatFileSize(project.fileSize)} · {formatRelativeTime(project.updatedAt)}
            </span>
          </div>

          {/* Custom Domain Expander */}
          {showDomain && (
            <div
              className="mt-4 pt-4 border-t border-white/8 animate-fade-in"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2 mb-3">
                <Globe2 className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-medium">Custom Domain</span>
              </div>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="app.yourdomain.com"
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-blue-500/40 transition-all placeholder:text-muted-foreground placeholder:font-sans"
                />
                <button onClick={handleSaveDomain} disabled={savingDomain}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-all">
                  {savingDomain ? "Saving..." : "Save"}
                </button>
              </div>

              {/* DNS Instructions */}
              <div className="glass rounded-xl border border-blue-500/15 bg-blue-500/5 p-3">
                <p className="text-xs font-medium text-blue-400 mb-2">DNS Configuration (CNAME Record)</p>
                <div className="space-y-1.5 font-mono text-xs">
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground w-12">Type</span>
                    <span className="text-foreground">CNAME</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground w-12">Name</span>
                    <span className="text-foreground">{domain ? domain.split(".")[0] : "app"}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground w-12">Value</span>
                    <span className="text-blue-400">proxy.appdeployer.app</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground w-12">TTL</span>
                    <span className="text-foreground">3600</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2.5">
                  Add this CNAME record in your DNS provider (Cloudflare, GoDaddy, etc.). Changes may take up to 24 hours to propagate.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
