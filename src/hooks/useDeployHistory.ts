import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export interface DeployHistoryEntry {
  id: string;
  project_id: string;
  user_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  version?: string;
  status: "success" | "failed" | "building";
  deployed_at: string;
}

export function useDeployHistory() {
  const [history, setHistory] = useState<DeployHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchHistory = useCallback(async (projectId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("deploy_history")
      .select("*")
      .eq("project_id", projectId)
      .order("deployed_at", { ascending: false })
      .limit(10);
    if (!error && data) setHistory(data as DeployHistoryEntry[]);
    setLoading(false);
  }, []);

  const addEntry = async (entry: Omit<DeployHistoryEntry, "id" | "deployed_at">) => {
    const { data, error } = await supabase
      .from("deploy_history")
      .insert([{ ...entry, deployed_at: new Date().toISOString() }])
      .select()
      .single();
    if (!error && data) {
      setHistory((prev) => [data as DeployHistoryEntry, ...prev].slice(0, 10));
    }
  };

  return { history, loading, fetchHistory, addEntry };
}
