export type ProjectType = "web" | "apk";
export type ProjectStatus = "live" | "building" | "failed" | "scanning";
export type SecurityStatus = "clean" | "scanning" | "threat" | "unknown";
export type TeamRole = "admin" | "deployer" | "viewer";
export type TeamMemberStatus = "active" | "pending";

export interface Project {
  id: string;
  user_id?: string;
  name: string;
  type: ProjectType;
  status: ProjectStatus;
  security: SecurityStatus;
  createdAt: string;
  updatedAt: string;
  fileSize: number;
  fileName: string;
  file_path?: string;
  previewUrl?: string;
  downloadUrl?: string;
  version?: string;
  packageName?: string;
  iconUrl?: string;
  downloads: number;
  views: number;
  githubRepo?: string;
  lastDeploy?: string;
  custom_domain?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  avatar?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface GithubRepo {
  id: string;
  name: string;
  fullName: string;
  url: string;
  branch: string;
  connected: boolean;
  lastBuild?: string;
  buildStatus?: "success" | "building" | "failed";
}

export interface TeamMember {
  id: string;
  owner_id: string;
  user_email: string;
  user_name: string;
  role: TeamRole;
  status: TeamMemberStatus;
  last_activity?: string;
  invited_at: string;
  created_at: string;
}

export interface DeployLog {
  id: string;
  projectId: string;
  message: string;
  level: "info" | "success" | "error" | "warning";
  timestamp: string;
}

export interface DashboardStats {
  totalProjects: number;
  totalDownloads: number;
  totalViews: number;
  activeDeployments: number;
  storageUsed: number;
}
