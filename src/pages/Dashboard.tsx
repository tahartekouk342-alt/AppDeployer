import { useState } from "react";
import {
  LayoutDashboard, Rocket, Download, Eye, HardDrive,
  Globe, Smartphone, Search, Filter, Plus,
} from "lucide-react";
import { Project } from "@/types";
import StatsCard from "@/components/features/StatsCard";
import ProjectCard from "@/components/features/ProjectCard";
import ProjectModal from "@/components/features/ProjectModal";
import { cn } from "@/lib/utils";
import { useSettings } from "@/contexts/SettingsContext";
import { t } from "@/lib/i18n";

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

interface DashboardProps {
  user: { id: string; name: string; email: string; avatar?: string };
  projects: Project[];
  onDelete: (id: string) => void;
  onNavigateUpload: () => void;
  onUpdateDomain?: (id: string, domain: string) => Promise<void>;
  onProjectUpdate?: (id: string, updates: Partial<Project>) => Promise<void>;
}

type FilterType = "all" | "web" | "apk";

export default function Dashboard({ user, projects, onDelete, onNavigateUpload, onUpdateDomain, onProjectUpdate }: DashboardProps) {
  const { language } = useSettings();
  const T = (key: Parameters<typeof t>[1]) => t(language, key);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const filtered = projects.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || p.type === filter;
    return matchSearch && matchFilter;
  });

  const totalDownloads = projects.reduce((a, b) => a + b.downloads, 0);
  const totalViews = projects.reduce((a, b) => a + b.views, 0);
  const totalStorage = projects.reduce((a, b) => a + b.fileSize, 0);

  const filterButtons: { type: FilterType; label: string; icon: React.ElementType }[] = [
    { type: "all", label: T("allTypes"),    icon: LayoutDashboard },
    { type: "web", label: T("websites"),   icon: Globe },
    { type: "apk", label: T("androidApps"), icon: Smartphone },
  ];

  return (
    <div className="min-h-screen pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 animate-fade-in">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold mb-1">
              {language === "ar" ? "مرحباً، " : "Welcome back, "}
              <span className="gradient-text">{user.name.split(" ")[0]}</span>{" "}
              {language === "ar" ? "👋" : "👋"}
            </h1>
            <p className="text-muted-foreground text-sm">
              {language === "ar"
                ? `لديك ${projects.filter((p) => p.status === "live").length} نشر نشط`
                : `You have ${projects.filter((p) => p.status === "live").length} active deployments`}
            </p>
          </div>
          <button onClick={onNavigateUpload}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl text-sm font-semibold transition-all hover:shadow-lg hover:shadow-blue-500/25 w-full sm:w-auto justify-center">
            <Plus className="w-4 h-4" />{T("newDeploy")}
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
          <StatsCard label={T("totalProjects")}  value={projects.length}                  icon={Rocket}    color="blue" />
          <StatsCard label={T("totalDownloads")} value={totalDownloads.toLocaleString()}  icon={Download}  color="purple" />
          <StatsCard label={T("totalViews")}     value={totalViews.toLocaleString()}      icon={Eye}       color="green" />
          <StatsCard label={T("storageUsed")}    value={formatFileSize(totalStorage)}     icon={HardDrive} color="orange" />
        </div>

        {/* Projects Section */}
        <div className="animate-fade-in">
          <div className="flex flex-col gap-3 mb-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">{T("dashboardTitle")}</h2>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Filter className="w-3 h-3" />{filtered.length} {language === "ar" ? "مشاريع" : "projects"}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex rounded-xl overflow-hidden border border-white/8 p-0.5">
                {filterButtons.map((f) => (
                  <button key={f.type} onClick={() => setFilter(f.type)}
                    className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all",
                      filter === f.type ? "bg-blue-600 text-white" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                    )}>
                    <f.icon className="w-3 h-3" />
                    <span className="hidden sm:inline">{f.label}</span>
                  </button>
                ))}
              </div>
              <div className="relative flex-1 min-w-[160px] max-w-sm">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder={T("searchProjects")}
                  className="w-full bg-white/5 border border-white/10 rounded-xl ps-9 pe-3 py-2 text-xs focus:outline-none focus:border-blue-500/40 transition-all placeholder:text-muted-foreground" />
              </div>
            </div>
          </div>

          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filtered.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onDelete={onDelete}
                  onClick={setSelectedProject}
                  onUpdateDomain={onUpdateDomain}
                />
              ))}
            </div>
          ) : (
            <div className="glass rounded-2xl border border-white/5 p-12 sm:p-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
                <Rocket className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold mb-2">{T("noProjects")}</h3>
              <p className="text-sm text-muted-foreground mb-4">{T("noProjectsDesc")}</p>
              {!search && (
                <button onClick={onNavigateUpload}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-colors">
                  {T("deployNow")}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {selectedProject && (
        <ProjectModal
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
          onProjectUpdate={onProjectUpdate}
        />
      )}
    </div>
  );
}
