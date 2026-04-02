import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { TeamMember, TeamRole } from "@/types";

export function useTeam(ownerId?: string) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMembers = useCallback(async () => {
    if (!ownerId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("team_members")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) {
      setMembers(data as TeamMember[]);
    }
    setLoading(false);
  }, [ownerId]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const inviteMember = async (
    email: string,
    role: TeamRole,
    name?: string,
    onNotify?: (title: string, message: string, type: "success" | "error" | "warning" | "info" | "team") => Promise<void>
  ) => {
    if (!ownerId) return;
    const { data, error } = await supabase
      .from("team_members")
      .insert([
        {
          owner_id: ownerId,
          user_email: email,
          user_name: name || email.split("@")[0],
          role,
          status: "pending",
          invited_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (!error && data) {
      setMembers((prev) => [data as TeamMember, ...prev]);

      // Create notification for team owner
      if (onNotify) {
        const roleLabelMap: Record<TeamRole, string> = {
          admin: "Admin",
          deployer: "Deployer",
          viewer: "Viewer",
        };
        await onNotify(
          `Team invitation sent`,
          `${name || email.split("@")[0]} (${email}) was invited as ${roleLabelMap[role]}. Waiting for them to join.`,
          "team"
        );
      }
    }
    if (error) throw error;
  };

  const updateRole = async (memberId: string, role: TeamRole) => {
    const { error } = await supabase
      .from("team_members")
      .update({ role })
      .eq("id", memberId);
    if (!error) {
      setMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, role } : m))
      );
    }
  };

  const removeMember = async (memberId: string) => {
    const { error } = await supabase
      .from("team_members")
      .delete()
      .eq("id", memberId);
    if (!error) {
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
    }
  };

  return { members, loading, inviteMember, updateRole, removeMember, refetch: fetchMembers };
}
