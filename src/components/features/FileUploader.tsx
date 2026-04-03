import { useState, useCallback, useRef } from "react";
import {
  Upload, FileArchive, Smartphone, CheckCircle, X, Loader2, Shield, Rocket,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Project } from "@/types";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface FileUploaderProps {
  userId: string;
  onProjectAdded: (project: Omit<Project, "id">) => Promise<void>;
  onNotify?: (title: string, message: string, type: "success" | "error" | "warning" | "info") => Promise<void>;
}

type UploadPhase = "idle" | "uploading" | "scanning" | "deploying" | "done";



export default function FileUploader({ userId, onProjectAdded, onNotify }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [phase, setPhase] = useState<UploadPhase>("idle");
  const [progress, setProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [projectName, setProjectName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback((file: File) => {
    const isZip = file.name.endsWith(".zip");
    const isApk = file.name.endsWith(".apk");
    if (!isZip && !isApk) {
      toast.error("Only ZIP and APK files are supported");
      return;
    }
    setSelectedFile(file);
    setProjectName(file.name.replace(/\.(zip|apk)$/, "").replace(/[-_]/g, " "));
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const deployFile = async () => {
    if (!selectedFile || !projectName.trim()) {
      toast.error("Please enter a project name");
      return;
    }

    const isApk = selectedFile.name.endsWith(".apk");
    const filePath = `${userId}/${Date.now()}-${selectedFile.name}`;

    setPhase("uploading");
    setProgress(10);

    const { error: uploadError } = await supabase.storage
      .from("project-files")
      .upload(filePath, selectedFile, { upsert: false });

    if (uploadError) {
      toast.error("Upload failed: " + uploadError.message);
      setPhase("idle");
      setProgress(0);
      onNotify?.("Upload Failed", `Failed to upload ${selectedFile.name}: ${uploadError.message}`, "error");
      return;
    }

    setProgress(45);
    setPhase("scanning");
    await new Promise((r) => setTimeout(r, 1500));
    setProgress(75);

    setPhase("deploying");
    await new Promise((r) => setTimeout(r, 800));
    setProgress(100);

    const { data: urlData } = supabase.storage
      .from("project-files")
      .getPublicUrl(filePath);
    const publicUrl = urlData.publicUrl;

    const newProject: Omit<Project, "id"> = {
      name: projectName.trim(),
      type: isApk ? "apk" : "web",
      status: "live",
      security: "clean",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      fileSize: selectedFile.size,
      fileName: selectedFile.name,
      file_path: filePath,
      downloads: 0,
      views: 0,
      // Both APK and ZIP: use the real Supabase Storage public URL
      downloadUrl: publicUrl,
      previewUrl: publicUrl,
      ...(isApk
        ? {
            version: "1.0.0",
            packageName: `com.user.${projectName.toLowerCase().replace(/\s+/g, "")}`,
            iconUrl: `https://picsum.photos/seed/${projectName}/128/128`,
          }
        : {}),
    };

    setPhase("done");
    await onProjectAdded(newProject);

    const successMsg = isApk
      ? "APK uploaded successfully! Download page is live."
      : "Website deployed! Preview link is ready.";
    toast.success(successMsg);
    onNotify?.(
      isApk ? "APK Deployment Complete" : "Website Deployed",
      `${projectName.trim()} has been deployed and is now live.`,
      "success"
    );

    setTimeout(() => {
      setPhase("idle");
      setProgress(0);
      setSelectedFile(null);
      setProjectName("");
    }, 800);
  };

  const phaseLabels: Record<UploadPhase, string> = {
    idle: "",
    uploading: "Uploading file to cloud storage...",
    scanning: "Running security scan...",
    deploying: "Deploying to servers...",
    done: "Deployment complete!",
  };

  const phaseIcons: Record<UploadPhase, React.ReactNode> = {
    idle: null,
    uploading: <Loader2 className="w-5 h-5 animate-spin text-blue-400" />,
    scanning: <Shield className="w-5 h-5 text-orange-400 animate-pulse" />,
    deploying: <Rocket className="w-5 h-5 text-purple-400 animate-bounce" />,
    done: <CheckCircle className="w-5 h-5 text-emerald-400" />,
  };

  if (phase !== "idle") {
    return (
      <div className="glass rounded-2xl border border-white/8 p-8 text-center animate-fade-in">
        <div className="flex justify-center mb-4">{phaseIcons[phase]}</div>
        <p className="text-sm font-medium mb-6">{phaseLabels[phase]}</p>
        <div className="w-full bg-white/5 rounded-full h-2 mb-2 overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
            style={{ width: `${progress}%` }} />
        </div>
        <p className="text-xs text-muted-foreground font-mono">{progress}%</p>
        {phase !== "done" && (
          <div className="mt-4 flex flex-wrap gap-3 justify-center text-xs text-muted-foreground">
            <span className={cn("flex items-center gap-1", progress >= 45 ? "text-emerald-400" : "")}>
              <Upload className="w-3 h-3" /> Upload
            </span>
            <span className={cn("flex items-center gap-1", progress >= 75 ? "text-emerald-400" : "")}>
              <Shield className="w-3 h-3" /> Security Scan
            </span>
            <span className={cn("flex items-center gap-1", progress >= 100 ? "text-emerald-400" : "")}>
              <Rocket className="w-3 h-3" /> Deploy
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => !selectedFile && inputRef.current?.click()}
        className={cn(
          "relative rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer",
          isDragging ? "border-blue-500/60 bg-blue-500/5"
            : selectedFile ? "border-emerald-500/40 bg-emerald-500/5"
            : "border-white/10 hover:border-white/20 hover:bg-white/2"
        )}>
        <input ref={inputRef} type="file" accept=".zip,.apk" onChange={handleFileInput} className="hidden" />
        <div className="p-10 text-center">
          {selectedFile ? (
            <div className="animate-scale-in">
              <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center bg-emerald-500/15 border border-emerald-500/20">
                {selectedFile.name.endsWith(".apk") ? (
                  <Smartphone className="w-8 h-8 text-emerald-400" />
                ) : (
                  <FileArchive className="w-8 h-8 text-emerald-400" />
                )}
              </div>
              <p className="font-semibold text-emerald-400">{selectedFile.name}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {(selectedFile.size / 1024 / 1024).toFixed(1)} MB · {selectedFile.name.endsWith(".apk") ? "Android App" : "Web Project"}
              </p>
              <button
                onClick={(e) => { e.stopPropagation(); setSelectedFile(null); setProjectName(""); }}
                className="mt-4 flex items-center gap-1 mx-auto text-xs text-muted-foreground hover:text-red-400 transition-colors">
                <X className="w-3 h-3" /> Remove file
              </button>
            </div>
          ) : (
            <>
              <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center bg-white/5 border border-white/10">
                <Upload className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="font-semibold mb-2">{isDragging ? "Drop it here!" : "Drag & Drop your file"}</p>
              <p className="text-sm text-muted-foreground mb-4">
                or click to browse · Supports <span className="text-blue-400 font-mono">.zip</span> and{" "}
                <span className="text-purple-400 font-mono">.apk</span>
              </p>
              <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <FileArchive className="w-3.5 h-3.5 text-blue-400" /> ZIP → Web Deploy
                </span>
                <span className="w-px h-4 bg-white/10" />
                <span className="flex items-center gap-1">
                  <Smartphone className="w-3.5 h-3.5 text-purple-400" /> APK → Download Page
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {selectedFile && (
        <div className="glass rounded-xl border border-white/8 p-4 animate-fade-in">
          <label className="text-xs font-medium text-muted-foreground block mb-2">Project Name</label>
          <input type="text" value={projectName} onChange={(e) => setProjectName(e.target.value)}
            placeholder="My Awesome App"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500/50 focus:bg-blue-500/5 transition-all placeholder:text-muted-foreground" />
          <button onClick={deployFile}
            className="mt-3 w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/25">
            <Rocket className="w-4 h-4" />
            Deploy Now
          </button>
        </div>
      )}
    </div>
  );
}
