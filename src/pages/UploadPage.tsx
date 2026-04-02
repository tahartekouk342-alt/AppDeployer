import { Upload, FileArchive, Smartphone, Globe, Shield, Zap, Info } from "lucide-react";
import { Project } from "@/types";
import FileUploader from "@/components/features/FileUploader";
import { useNavigate } from "react-router-dom";

interface UploadPageProps {
  userId: string;
  onProjectAdded: (project: Omit<Project, "id">) => Promise<void>;
  onNotify?: (title: string, message: string, type: "success" | "error" | "warning" | "info") => Promise<void>;
}

export default function UploadPage({ userId, onProjectAdded, onNotify }: UploadPageProps) {
  const navigate = useNavigate();

  const handleProjectAdded = async (project: Omit<Project, "id">) => {
    await onProjectAdded(project);
    setTimeout(() => navigate("/dashboard"), 1000);
  };

  const infoCards = [
    {
      icon: FileArchive,
      color: "text-blue-400",
      bg: "bg-blue-500/10 border-blue-500/20",
      title: "ZIP → Website",
      steps: [
        "Upload your ZIP file",
        "Stored securely in cloud storage",
        "Preview link generated instantly",
      ],
    },
    {
      icon: Smartphone,
      color: "text-purple-400",
      bg: "bg-purple-500/10 border-purple-500/20",
      title: "APK → Download Page",
      steps: [
        "Upload your APK file",
        "Direct download link ready",
        "QR code generated automatically",
      ],
    },
  ];

  const features = [
    { icon: Shield, label: "Security Scanning", desc: "Every file scanned for threats before going live" },
    { icon: Zap, label: "Instant Deploy", desc: "Files go live in under 30 seconds" },
    { icon: Globe, label: "Global CDN", desc: "Content delivered from edge nodes worldwide" },
  ];

  return (
    <div className="min-h-screen pt-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="text-center mb-10 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium mb-4">
            <Upload className="w-3 h-3" />Deploy Instantly
          </div>
          <h1 className="text-3xl font-extrabold mb-3">
            Upload & <span className="gradient-text">Deploy</span>
          </h1>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Drop your ZIP or APK file below and we will handle the rest — security scanning, deployment, and link generation.
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 animate-fade-in">
            <FileUploader userId={userId} onProjectAdded={handleProjectAdded} onNotify={onNotify} />
          </div>

          <div className="lg:col-span-2 space-y-4 animate-fade-in">
            {infoCards.map((card) => (
              <div key={card.title} className={`glass rounded-2xl border p-5 ${card.bg}`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${card.bg}`}>
                    <card.icon className={`w-5 h-5 ${card.color}`} />
                  </div>
                  <h3 className="font-semibold text-sm">{card.title}</h3>
                </div>
                <ol className="space-y-2">
                  {card.steps.map((step, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                      <span className={`flex-shrink-0 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center ${card.color} bg-white/5`}>
                        {i + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            ))}

            <div className="glass rounded-2xl border border-white/8 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Info className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">What happens next</span>
              </div>
              <div className="space-y-3">
                {features.map((f) => (
                  <div key={f.label} className="flex items-start gap-3">
                    <f.icon className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-sm font-medium">{f.label}</div>
                      <div className="text-xs text-muted-foreground">{f.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
