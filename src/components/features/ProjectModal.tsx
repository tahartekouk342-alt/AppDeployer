import { useEffect, useState } from "react";
import {
  X, Globe, Smartphone, Download, Eye, Copy, ExternalLink,
  Shield, GitBranch, Calendar, HardDrive, Package, CheckCircle,
  History, RotateCcw, Loader2, CheckCircle2, XCircle, Clock,
} from "lucide-react";
import { Project } from "@/types";
import { formatFileSize, formatDate, formatRelativeTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useDeployHistory } from "@/hooks/useDeployHistory";
import { supabase } from "@/lib/supabase";

interface ProjectModalProps {
  project: Project;
  onClose: () => void;
  onProjectUpdate?: (id: string, updates: Partial<Project>) => Promise<void>;
}

const historyStatusConfig = {
  success: { icon: CheckCircle2, color: "text-emerald-400", label: "Success" },
  failed: { icon: XCircle, color: "text-red-400", label: "Failed" },
  building: { icon: Clock, color: "text-blue-400", label: "Building" },
};

export default function ProjectModal({ project, onClose, onProjectUpdate }: ProjectModalProps) {
  const url = project.type === "web" ? project.previewUrl : project.downloadUrl;
  const [tab, setTab] = useState<"details" | "history">("details");
  const [restoring, setRestoring] = useState<string | null>(null);
  const { history, loading: histLoading, fetchHistory } = useDeployHistory();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  useEffect(() => {
    if (tab === "history") fetchHistory(project.id);
  }, [tab, project.id, fetchHistory]);

  const copyLink = () => {
    if (url) {
      navigator.clipboard.writeText(url);
      toast.success("Link copied!");
    }
  };

  const handleRestore = async (entry: ReturnType<typeof useDeployHistory>["history"][number]) => {
    setRestoring(entry.id);
    // Get public URL from storage path
    const { data: urlData } = supabase.storage
      .from("project-files")
      .getPublicUrl(entry.file_path);
    const publicUrl = urlData.publicUrl;

    const updates: Partial<Project> = {
      fileName: entry.file_name,
      file_path: entry.file_path,
      fileSize: entry.file_size,
      version: entry.version,
      ...(project.type === "apk" ? { downloadUrl: publicUrl } : { previewUrl: publicUrl }),
    };

    if (onProjectUpdate) {
      await onProjectUpdate(project.id, updates);
    }
    setRestoring(null);
    toast.success(`Restored to version from ${formatDate(entry.deployed_at)}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg glass-strong rounded-2xl border border-white/12 shadow-2xl animate-scale-in overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-white/8">
          <div className="flex items-center gap-4">
            <div className={cn(
              "w-14 h-14 rounded-2xl flex items-center justify-center",
              project.type === "web" ? "bg-blue-500/15 border border-blue-500/20" : "bg-purple-500/15 border border-purple-500/20"
            )}>
              {project.type === "web" ? <Globe className="w-7 h-7 text-blue-400" /> : <Smartphone className="w-7 h-7 text-purple-400" />}
            </div>
            <div>
              <h2 className="font-bold text-lg">{project.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="flex items-center gap-1 text-xs text-emerald-400">
                  <CheckCircle className="w-3 h-3" /> Live
                </span>
                <span className="text-xs text-muted-foreground">·</span>
                <span className="flex items-center gap-1 text-xs text-emerald-400">
                  <Shield className="w-3 h-3" /> Secure
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-2 mx-4 mt-4 bg-white/3 rounded-xl border border-white/8">
          {(["details", "history"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all capitalize",
                tab === t ? "bg-blue-600 text-white" : "text-muted-foreground hover:text-foreground"
              )}>
              {t === "history" ? <History className="w-3.5 h-3.5" /> : <Package className="w-3.5 h-3.5" />}
              {t === "details" ? "Details" : "Deploy History"}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto flex-1">
          {tab === "details" && (
            <>
              {/* URL Section */}
              {url && (
                <div className="p-4 mx-4 mt-4 bg-white/3 rounded-xl border border-white/8">
                  <div className="text-xs text-muted-foreground mb-2 font-medium">
                    {project.type === "web" ? "Preview URL" : "Download URL"}
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="flex-1 font-mono text-sm text-blue-400 truncate">{url}</p>
                    <button onClick={copyLink}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors">
                      <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                    <a href={url} target="_blank" rel="noopener noreferrer"
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors">
                      <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                    </a>
                  </div>
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 p-4 mx-4 mt-3 bg-white/3 rounded-xl border border-white/8">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <Eye className="w-3.5 h-3.5 text-blue-400" />
                    <span className="font-bold text-lg">{project.views.toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Views</p>
                </div>
                <div className="text-center border-x border-white/8">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <Download className="w-3.5 h-3.5 text-purple-400" />
                    <span className="font-bold text-lg">{project.downloads.toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Downloads</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="font-bold text-lg">{formatFileSize(project.fileSize).split(" ")[0]}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{formatFileSize(project.fileSize).split(" ")[1]}</p>
                </div>
              </div>

              {/* Details */}
              <div className="p-4 space-y-2">
                {project.version && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Package className="w-3.5 h-3.5" /> Version
                    </span>
                    <span className="font-mono text-xs">{project.version}</span>
                  </div>
                )}
                {project.packageName && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Smartphone className="w-3.5 h-3.5" /> Package
                    </span>
                    <span className="font-mono text-xs">{project.packageName}</span>
                  </div>
                )}
                {project.githubRepo && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <GitBranch className="w-3.5 h-3.5" /> Repository
                    </span>
                    <span className="font-mono text-xs">{project.githubRepo}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5" /> Created
                  </span>
                  <span className="text-xs">{formatDate(project.createdAt)}</span>
                </div>
              </div>
            </>
          )}

          {tab === "history" && (
            <div className="p-4 space-y-2 mt-2">
              {histLoading ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
                  <p className="text-xs text-muted-foreground">Loading deploy history...</p>
                </div>
              ) : history.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <History className="w-8 h-8 text-muted-foreground opacity-40" />
                  <p className="text-sm font-medium">No deploy history yet</p>
                  <p className="text-xs text-muted-foreground">History is tracked from your next upload</p>
                </div>
              ) : (
                history.map((entry, i) => {
                  const cfg = historyStatusConfig[entry.status];
                  const Icon = cfg.icon;
                  const isLatest = i === 0;
                  return (
                    <div key={entry.id}
                      className={cn(
                        "glass rounded-xl border p-3 flex items-start gap-3 transition-all",
                        isLatest ? "border-blue-500/20 bg-blue-500/5" : "border-white/8"
                      )}>
                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                        entry.status === "success" ? "bg-emerald-500/10" : entry.status === "failed" ? "bg-red-500/10" : "bg-blue-500/10")}>
                        <Icon className={cn("w-4 h-4", cfg.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-semibold truncate">{entry.file_name}</p>
                              {isLatest && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-medium flex-shrink-0">
                                  Current
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-0.5">
                              <span className={cn("text-[10px] font-medium", cfg.color)}>{cfg.label}</span>
                              <span className="text-[10px] text-muted-foreground">{formatFileSize(entry.file_size)}</span>
                              {entry.version && (
                                <span className="text-[10px] text-muted-foreground font-mono">v{entry.version}</span>
                              )}
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              {formatRelativeTime(entry.deployed_at)} · {formatDate(entry.deployed_at)}
                            </p>
                          </div>
                          {!isLatest && entry.status === "success" && (
                            <button
                              onClick={() => handleRestore(entry)}
                              disabled={restoring === entry.id}
                              className="flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-lg border border-white/10 hover:border-blue-500/30 hover:bg-blue-500/10 hover:text-blue-400 text-muted-foreground transition-all flex-shrink-0 disabled:opacity-50"
                            >
                              {restoring === entry.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <RotateCcw className="w-3 h-3" />
                              )}
                              Restore
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Action Button */}
        {tab === "details" && url && (
          <div className="p-4 border-t border-white/8">
            <a href={url} target="_blank" rel="noopener noreferrer"
              className="block w-full text-center bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold py-2.5 rounded-xl text-sm transition-all hover:shadow-lg hover:shadow-blue-500/25">
              {project.type === "web" ? "Open Preview" : "Download APK"}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
