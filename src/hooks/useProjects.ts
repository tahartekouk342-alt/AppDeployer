import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Project } from "@/types";
import { useDeployHistory } from "@/hooks/useDeployHistory";

function dbRowToProject(row: any): Project {
  return {
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    type: row.type,
    status: row.status,
    security: row.security,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    fileSize: row.file_size || 0,
    fileName: row.file_name || "",
    file_path: row.file_path,
    previewUrl: row.preview_url,
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
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) {
      setProjects(data.map(dbRowToProject));
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const addProject = async (project: Omit<Project, "id">) => {
    if (!userId) return;
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
        preview_url: project.previewUrl,
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

    if (!error && data) {
      const newProject = dbRowToProject(data);
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
    await supabase.from("projects").delete().eq("id", id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
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
    }
  };

  return { projects, loading, addProject, deleteProject, updateProject, refetch: fetchProjects };
}
