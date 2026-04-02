import { useState, useMemo } from "react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import {
  TrendingUp, Download, Eye, Globe, Smartphone, Calendar,
  ArrowUpRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Project } from "@/types";

interface AnalyticsProps {
  projects: Project[];
}

const CHART_COLORS = ["#3b82f6", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"];

// Build chart data from real project timestamps
function buildDailyData(projects: Project[]) {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const buckets: Record<string, { views: number; downloads: number }> = {};
  days.forEach((d) => (buckets[d] = { views: 0, downloads: 0 }));

  projects.forEach((p) => {
    const day = days[new Date(p.createdAt).getDay()];
    buckets[day].views += p.views;
    buckets[day].downloads += p.downloads;
  });

  return days.map((day) => ({ day, ...buckets[day] }));
}

function buildMonthlyData(projects: Project[]) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const buckets: Record<string, { views: number; downloads: number }> = {};
  months.forEach((m) => (buckets[m] = { views: 0, downloads: 0 }));

  projects.forEach((p) => {
    const month = months[new Date(p.createdAt).getMonth()];
    buckets[month].views += p.views;
    buckets[month].downloads += p.downloads;
  });

  // Show last 7 months
  const now = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setMonth(now.getMonth() - (6 - i));
    const month = months[d.getMonth()];
    return { month, ...buckets[month] };
  });
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-strong rounded-xl border border-white/12 px-3 py-2 text-xs">
        <p className="font-medium mb-1 text-muted-foreground">{label}</p>
        {payload.map((entry: any) => (
          <p key={entry.name} style={{ color: entry.color }} className="font-semibold">
            {entry.name}: {entry.value.toLocaleString()}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Analytics({ projects }: AnalyticsProps) {
  const [period, setPeriod] = useState<"week" | "month">("week");

  const dailyData = useMemo(() => buildDailyData(projects), [projects]);
  const monthlyData = useMemo(() => buildMonthlyData(projects), [projects]);
  const chartData = period === "week" ? dailyData : monthlyData;
  const xKey = period === "week" ? "day" : "month";

  const totalViews = projects.reduce((a, b) => a + b.views, 0);
  const totalDownloads = projects.reduce((a, b) => a + b.downloads, 0);
  const webProjects = projects.filter((p) => p.type === "web");
  const apkProjects = projects.filter((p) => p.type === "apk");

  const pieData = [
    { name: "Websites", value: webProjects.reduce((a, b) => a + b.views, 0) || 0 },
    { name: "Android APKs", value: apkProjects.reduce((a, b) => a + b.views + b.downloads, 0) || 0 },
  ].filter((d) => d.value > 0);

  const topProjects = [...projects]
    .sort((a, b) => (b.views + b.downloads) - (a.views + a.downloads))
    .slice(0, 5);

  const kpiCards = [
    { label: "Total Views", value: totalViews.toLocaleString(), change: "live", positive: true, icon: Eye, colorClass: "text-blue-400 bg-blue-500/10" },
    { label: "Total Downloads", value: totalDownloads.toLocaleString(), change: "live", positive: true, icon: Download, colorClass: "text-purple-400 bg-purple-500/10" },
    { label: "Web Projects", value: webProjects.length, change: `${webProjects.length} active`, positive: true, icon: Globe, colorClass: "text-cyan-400 bg-cyan-500/10" },
    { label: "APK Projects", value: apkProjects.length, change: `${apkProjects.length} active`, positive: true, icon: Smartphone, colorClass: "text-orange-400 bg-orange-500/10" },
  ];

  return (
    <div className="min-h-screen pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-8 animate-fade-in">
          <div>
            <h1 className="text-2xl font-bold mb-1">Analytics</h1>
            <p className="text-muted-foreground text-sm">Real-time deployment performance</p>
          </div>
          <div className="flex items-center gap-2 p-1 glass rounded-xl border border-white/8">
            {(["week", "month"] as const).map((p) => (
              <button key={p} onClick={() => setPeriod(p)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize",
                  period === p ? "bg-blue-600 text-white" : "text-muted-foreground hover:text-foreground"
                )}>
                <Calendar className="w-3 h-3" />
                This {p}
              </button>
            ))}
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {kpiCards.map((card, i) => (
            <div key={card.label}
              className="glass rounded-2xl border border-white/5 p-5 hover:bg-white/4 transition-all duration-200 animate-fade-in"
              style={{ animationDelay: `${i * 0.05}s` }}>
              <div className="flex items-center justify-between mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.colorClass}`}>
                  <card.icon className="w-5 h-5" />
                </div>
                <span className="flex items-center gap-0.5 text-xs font-medium px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400">
                  <ArrowUpRight className="w-3 h-3" />
                  {card.change}
                </span>
              </div>
              <div className="text-2xl font-bold mb-1">{card.value}</div>
              <div className="text-sm text-muted-foreground">{card.label}</div>
            </div>
          ))}
        </div>

        {projects.length === 0 ? (
          <div className="glass rounded-2xl border border-white/5 p-16 text-center">
            <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
            <h3 className="font-semibold text-lg mb-2">No data yet</h3>
            <p className="text-sm text-muted-foreground">Deploy your first project to start seeing analytics</p>
          </div>
        ) : (
          <>
            {/* Charts Row */}
            <div className="grid lg:grid-cols-3 gap-6 mb-8">
              <div className="lg:col-span-2 glass rounded-2xl border border-white/5 p-5 animate-fade-in">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-400" />
                    <span className="font-semibold text-sm">Views & Downloads</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" />Views</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-500" />Downloads</span>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey={xKey} tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="views" stroke="#3b82f6" strokeWidth={2} dot={false} name="Views" />
                    <Line type="monotone" dataKey="downloads" stroke="#8b5cf6" strokeWidth={2} dot={false} name="Downloads" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="glass rounded-2xl border border-white/5 p-5 animate-fade-in">
                <div className="flex items-center gap-2 mb-5">
                  <Globe className="w-4 h-4 text-blue-400" />
                  <span className="font-semibold text-sm">Traffic by Type</span>
                </div>
                {pieData.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={150}>
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
                          {pieData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index]} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-2 mt-3">
                      {pieData.map((item, i) => (
                        <div key={item.name} className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ background: CHART_COLORS[i] }} />
                            <span className="text-muted-foreground">{item.name}</span>
                          </span>
                          <span className="font-medium">{item.value.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">No traffic data yet</div>
                )}
              </div>
            </div>

            {/* Bar Chart + Top Projects */}
            <div className="grid lg:grid-cols-5 gap-6">
              <div className="lg:col-span-3 glass rounded-2xl border border-white/5 p-5 animate-fade-in">
                <div className="flex items-center gap-2 mb-5">
                  <Download className="w-4 h-4 text-purple-400" />
                  <span className="font-semibold text-sm">Downloads by Period</span>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={chartData} barSize={20}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey={xKey} tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="downloads" fill="url(#barGradient)" radius={[4, 4, 0, 0]} name="Downloads" />
                    <defs>
                      <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8b5cf6" />
                        <stop offset="100%" stopColor="#3b82f6" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="lg:col-span-2 glass rounded-2xl border border-white/5 p-5 animate-fade-in">
                <div className="flex items-center gap-2 mb-5">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span className="font-semibold text-sm">Top Projects</span>
                </div>
                <div className="space-y-3">
                  {topProjects.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No projects yet</p>
                  ) : (
                    topProjects.map((p, i) => {
                      const total = p.views + p.downloads;
                      const maxTotal = (topProjects[0]?.views || 1) + (topProjects[0]?.downloads || 1);
                      const pct = maxTotal > 0 ? Math.round((total / maxTotal) * 100) : 0;
                      return (
                        <div key={p.id}>
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono text-muted-foreground w-4">{i + 1}.</span>
                              {p.type === "web" ? <Globe className="w-3.5 h-3.5 text-blue-400" /> : <Smartphone className="w-3.5 h-3.5 text-purple-400" />}
                              <span className="text-xs font-medium truncate max-w-[100px]">{p.name}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">{total.toLocaleString()}</span>
                          </div>
                          <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                              style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
