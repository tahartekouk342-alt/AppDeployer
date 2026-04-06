import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Project } from "@/types";
import { useDeployHistory } from "@/hooks/useDeployHistory";

// Generate appdeployer.app subdomain slug from project name
function makeSlug(name: string, id?: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 30);
  return base || (id ? `project-${id.slice(0, 8)}` : "project");
}

function dbRowToProject(row: any): Project {
  const type: "web" | "apk" = row.type;

  // Reconstruct canonical display URL from stored data
  let previewUrl = row.preview_url;
  if (!previewUrl || previewUrl.includes("/download/PENDING")) {
    if (type === "apk") {
      previewUrl = undefined; // will be generated dynamically in card using project.id
    } else {
      previewUrl = `https://${makeSlug(row.name, row.id)}.appdeployer.app`;
    }
  }

  return {
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    type,
    status: row.status,
    security: row.security,
    createdAt: row.created_at,
    updatedAt: row.updated_at || row.created_at,
    fileSize: row.file_size || 0,
    fileName: row.file_name || "",
    file_path: row.file_path,
    previewUrl,
    downloadUrl: row.download_url,
    version: row.version,
    packageName: row.package_name,
    iconUrl: row.icon_url,
    downloads: row.downloads || 0,
    views: row.views || 0,
    githubRepo: row.github_repo,
    lastDeploy: row.last_deploy,
    custom_domain: row.custom_domain,
  };
}

export function useProjects(userId?: string) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const { addEntry } = useDeployHistory();

  const fetchProjects = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    console.log("fetchProjects: fetching for user", userId);
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    console.log("fetchProjects result:", { count: data?.length, error });
    if (!error && data) {
      setProjects(data.map(dbRowToProject));
    } else if (error) {
      console.error("fetchProjects error:", error);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const addProject = async (project: Omit<Project, "id">) => {
    if (!userId) {
      console.error("addProject: no userId — cannot insert");
      return;
    }

    // For web projects, set canonical preview URL
    const slug = makeSlug(project.name);
    const previewUrl = project.type === "web"
      ? `https://${slug}.appdeployer.app`
      : project.previewUrl;

    console.log("addProject: inserting project for user", userId, { name: project.name, type: project.type });

    const { data, error } = await supabase
      .from("projects")
      .insert([{
        user_id: userId,
        name: project.name,
        type: project.type,
        status: project.status,
        security: project.security,
        file_size: project.fileSize,
        file_name: project.fileName,
        file_path: project.file_path,
        preview_url: previewUrl,
        download_url: project.downloadUrl,
        version: project.version,
        package_name: project.packageName,
        icon_url: project.iconUrl,
        downloads: project.downloads || 0,
        views: project.views || 0,
        github_repo: project.githubRepo,
        last_deploy: new Date().toISOString(),
        custom_domain: project.custom_domain,
      }])
      .select()
      .single();

    console.log("addProject result:", { id: data?.id, error: error?.message });

    if (error) {
      console.error("addProject FAILED:", error);
      return;
    }

    if (data) {
      const newProject = dbRowToProject(data);

      // For APK: update preview_url with real project id
      if (project.type === "apk") {
        const apkPreviewUrl = `${window.location.origin}/download/${data.id}`;
        await supabase
          .from("projects")
          .update({ preview_url: apkPreviewUrl })
          .eq("id", data.id);
        newProject.previewUrl = apkPreviewUrl;
      }

      setProjects((prev) => [newProject, ...prev]);

      // Record deploy history
      if (project.file_path && project.fileName) {
        await addEntry({
          project_id: newProject.id,
          user_id: userId,
          file_name: project.fileName,
          file_path: project.file_path,
          file_size: project.fileSize,
          version: project.version,
          status: "success",
        });
      }
    }
  };

  const deleteProject = async (id: string) => {
    const project = projects.find((p) => p.id === id);
    if (project?.file_path) {
      await supabase.storage.from("project-files").remove([project.file_path]);
    }
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (!error) {
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } else {
      console.error("deleteProject error:", error);
    }
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.security !== undefined) dbUpdates.security = updates.security;
    if (updates.previewUrl !== undefined) dbUpdates.preview_url = updates.previewUrl;
    if (updates.downloadUrl !== undefined) dbUpdates.download_url = updates.downloadUrl;
    if (updates.custom_domain !== undefined) dbUpdates.custom_domain = updates.custom_domain;
    if (updates.views !== undefined) dbUpdates.views = updates.views;
    if (updates.downloads !== undefined) dbUpdates.downloads = updates.downloads;
    if (updates.fileName !== undefined) dbUpdates.file_name = updates.fileName;
    if (updates.file_path !== undefined) dbUpdates.file_path = updates.file_path;
    if (updates.fileSize !== undefined) dbUpdates.file_size = updates.fileSize;
    if (updates.version !== undefined) dbUpdates.version = updates.version;
    dbUpdates.updated_at = new Date().toISOString();

    const { error } = await supabase.from("projects").update(dbUpdates).eq("id", id);
    if (!error) {
      setProjects((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
      );
    } else {
      console.error("updateProject error:", error);
    }
  };

  return { projects, loading, addProject, deleteProject, updateProject, refetch: fetchProjects };
}
