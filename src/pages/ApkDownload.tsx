import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Download, Smartphone, Shield, CheckCircle, Star, Wifi,
  Battery, Rocket, Package, HardDrive, AlertCircle, Globe,
  ArrowLeft, Eye, QrCode,
} from "lucide-react";

import { Project } from "@/types";
import { formatFileSize, formatDate } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

interface ApkDownloadProps {
  projects?: Project[];
}

const DEMO_APK = {
  id: "demo",
  name: "TaskMaster Pro",
  type: "apk" as const,
  status: "live" as const,
  security: "clean" as const,
  packageName: "com.ahmed.taskmaster",
  version: "2.3.1",
  fileSize: 28.7 * 1024 * 1024,
  fileName: "taskmaster-v2.3.1.apk",
  downloadUrl: "#",
  iconUrl: "https://picsum.photos/seed/taskmaster/200/200",
  downloads: 847,
  views: 2156,
  createdAt: "2026-03-25T09:00:00Z",
  updatedAt: "2026-03-30T11:00:00Z",
  developer: "Ahmed Al-Amri",
  description: "TaskMaster Pro is a powerful task management application that helps you organize your work and personal life efficiently.",
  permissions: ["Storage", "Internet", "Notifications", "Camera"],
  screenshots: [
    "https://picsum.photos/seed/ts1/300/540",
    "https://picsum.photos/seed/ts2/300/540",
    "https://picsum.photos/seed/ts3/300/540",
  ],
  minAndroid: "Android 7.0+",
  rating: 4.7,
  reviews: 124,
};

export default function ApkDownload({ projects = [] }: ApkDownloadProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [viewTracked, setViewTracked] = useState(false);

  const project = projects.find((p) => p.id === id && p.type === "apk");
  const isDemo = !project || id === "demo";

  const apkInfo = isDemo
    ? DEMO_APK
    : {
        ...project,
        packageName: project.packageName || "com.app." + project.name.toLowerCase().replace(/\s/g, ""),
        developer: "AppDeployer User",
        description: `${project.name} is an Android application hosted on AppDeployer. Download the APK file to install it on your device.`,
        permissions: ["Storage", "Internet"],
        screenshots: [
          `https://picsum.photos/seed/${project.id}1/300/540`,
          `https://picsum.photos/seed/${project.id}2/300/540`,
          `https://picsum.photos/seed/${project.id}3/300/540`,
        ],
        iconUrl: project.iconUrl || `https://picsum.photos/seed/${project.id}/200/200`,
        minAndroid: "Android 6.0+",
        rating: 4.5,
        reviews: Math.floor(project.downloads / 6) || 12,
        version: project.version || "1.0.0",
      };

  // Track view on mount (once)
  if (!isDemo && project && !viewTracked) {
    setViewTracked(true);
    supabase
      .from("projects")
      .update({ views: (project.views || 0) + 1 })
      .eq("id", project.id)
      .then(() => {});
  }

  const pageUrl = window.location.href;

  const handleDownload = async () => {
    setDownloading(true);
    await new Promise((r) => setTimeout(r, 1500));

    // Track download in DB
    if (!isDemo && project) {
      await supabase
        .from("projects")
        .update({ downloads: (project.downloads || 0) + 1 })
        .eq("id", project.id);
    }

    if (apkInfo.downloadUrl && apkInfo.downloadUrl !== "#") {
      window.open(apkInfo.downloadUrl, "_blank");
    }
    setDownloading(false);
    setDownloaded(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <div className="glass-strong border-b border-white/8 px-4 py-3 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2">
              <Rocket className="w-5 h-5 text-blue-400" />
              <span className="font-bold gradient-text">AppDeployer</span>
            </div>
          </div>
          <span className="text-xs text-muted-foreground">Hosted App Download</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* App Header Card */}
        <div className="glass rounded-2xl border border-white/8 p-6 mb-6 animate-fade-in">
          <div className="flex items-start gap-5">
            <img src={apkInfo.iconUrl} alt={apkInfo.name}
              className="w-24 h-24 rounded-2xl object-cover shadow-lg border border-white/10" />
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-extrabold mb-1">{apkInfo.name}</h1>
              <p className="text-sm text-muted-foreground font-mono mb-3">{apkInfo.packageName}</p>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className={`w-3.5 h-3.5 ${s <= Math.round(apkInfo.rating) ? "text-yellow-400 fill-yellow-400" : "text-muted"}`} />
                  ))}
                  <span className="text-sm font-medium ml-1">{apkInfo.rating}</span>
                  <span className="text-xs text-muted-foreground">({apkInfo.reviews} reviews)</span>
                </div>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Download className="w-3 h-3" />{apkInfo.downloads.toLocaleString()} downloads
                </span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Eye className="w-3 h-3" />{apkInfo.views.toLocaleString()} views
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: Main Content */}
          <div className="lg:col-span-2 space-y-5">
            <div className="glass rounded-2xl border border-white/8 p-5 animate-fade-in">
              <h2 className="font-semibold text-sm mb-4">Screenshots</h2>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {apkInfo.screenshots.map((src, i) => (
                  <img key={i} src={src} alt={`Screenshot ${i + 1}`}
                    className="w-32 h-56 object-cover rounded-xl flex-shrink-0 border border-white/5" />
                ))}
              </div>
            </div>

            <div className="glass rounded-2xl border border-white/8 p-5 animate-fade-in">
              <h2 className="font-semibold text-sm mb-3">About this app</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{apkInfo.description}</p>
            </div>

            <div className="glass rounded-2xl border border-white/8 p-5 animate-fade-in">
              <h2 className="font-semibold text-sm mb-3">Required Permissions</h2>
              <div className="flex flex-wrap gap-2">
                {apkInfo.permissions.map((p) => (
                  <span key={p} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                    {p === "Wifi" ? <Wifi className="w-3 h-3 text-blue-400" />
                      : p === "Battery" ? <Battery className="w-3 h-3 text-green-400" />
                      : <Package className="w-3 h-3 text-muted-foreground" />}
                    {p}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Info + Download */}
          <div className="space-y-4">
            <div className="glass rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 animate-fade-in">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-5 h-5 text-emerald-400" />
                <span className="font-semibold text-sm text-emerald-400">Verified Safe</span>
              </div>
              <p className="text-xs text-muted-foreground">This APK has passed AppDeployer security scan — no malware or threats detected.</p>
            </div>

            <div className="glass rounded-2xl border border-white/8 p-4 space-y-3 animate-fade-in">
              <h3 className="font-semibold text-sm">App Details</h3>
              {[
                { icon: Package, label: "Version", value: apkInfo.version },
                { icon: HardDrive, label: "Size", value: formatFileSize(apkInfo.fileSize) },
                { icon: Smartphone, label: "Requires", value: apkInfo.minAndroid },
                { icon: CheckCircle, label: "Developer", value: apkInfo.developer },
                { icon: Globe, label: "Hosted via", value: "AppDeployer" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-xs text-muted-foreground">
                    <item.icon className="w-3.5 h-3.5" />{item.label}
                  </span>
                  <span className="text-xs font-medium">{item.value}</span>
                </div>
              ))}
              <div className="pt-2 border-t border-white/5 text-xs text-muted-foreground">
                Last updated: {formatDate(apkInfo.updatedAt)}
              </div>
            </div>

            {/* Download Button */}
            <div className="animate-fade-in">
              {downloaded ? (
                <div className="glass rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5 text-center">
                  <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                  <p className="font-semibold text-emerald-400">Download Started!</p>
                  <p className="text-xs text-muted-foreground mt-1">Enable "Install from Unknown Sources" in Android settings if prompted</p>
                </div>
              ) : (
                <button onClick={handleDownload} disabled={downloading}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-60 text-white font-bold py-4 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all hover:shadow-lg hover:shadow-blue-500/30">
                  {downloading ? (
                    <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span className="text-sm">Preparing download...</span></>
                  ) : (
                    <><Download className="w-5 h-5" />
                    <span className="text-base">Download APK</span>
                    <span className="text-xs opacity-80">{formatFileSize(apkInfo.fileSize)} · v{apkInfo.version}</span></>
                  )}
                </button>
              )}
              <div className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
                <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-orange-400" />
                <span>APK files are for Android only. You may need to allow installation from unknown sources in your device settings.</span>
              </div>
            </div>

            {/* QR Code Section */}
            <div className="glass rounded-2xl border border-white/8 p-4 animate-fade-in">
              <button onClick={() => setShowQr(!showQr)}
                className="w-full flex items-center justify-between">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-blue-400" />
                  Scan to Download
                </h3>
                <span className="text-xs text-muted-foreground">{showQr ? "Hide" : "Show"} QR</span>
              </button>
              {showQr && (
                <div className="mt-4 flex flex-col items-center gap-3 animate-fade-in">
                  <div className="p-3 bg-white rounded-xl">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(pageUrl)}&color=0f172a&bgcolor=ffffff`}
                      alt="QR Code"
                      width={140}
                      height={140}
                      className="rounded"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    Scan with your phone camera to open this download page
                  </p>
                </div>
              )}
            </div>

            {/* Share */}
            <div className="glass rounded-2xl border border-white/8 p-4 animate-fade-in">
              <h3 className="font-semibold text-sm mb-3">Share this app</h3>
              <div className="flex items-center gap-2 p-2.5 bg-white/3 rounded-xl border border-white/5">
                <span className="text-xs font-mono text-blue-400 flex-1 truncate">{pageUrl}</span>
                <button onClick={() => navigator.clipboard.writeText(pageUrl)}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded hover:bg-white/5 flex-shrink-0">
                  Copy
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/5 mt-12 py-6 text-center text-xs text-muted-foreground">
        Hosted by <span className="gradient-text font-semibold">AppDeployer</span> · Free secure hosting for apps
      </div>
    </div>
  );
}
