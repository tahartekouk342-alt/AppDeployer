import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: "success" | "error" | "info" | "warning" | "team";
  read: boolean;
  project_id?: string;
  created_at: string;
}

export function useNotifications(userId?: string) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(30);
    if (!error && data) setNotifications(data as Notification[]);
    setLoading(false);
  }, [userId]);

  // Poll every 15 seconds
  useEffect(() => {
    fetch();
    const interval = setInterval(fetch, 15000);
    return () => clearInterval(interval);
  }, [fetch]);

  const markRead = async (id: string) => {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllRead = async () => {
    if (!userId) return;
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", userId)
      .eq("read", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const addNotification = async (
    notif: Omit<Notification, "id" | "user_id" | "created_at" | "read">
  ) => {
    if (!userId) return;
    const { data, error } = await supabase
      .from("notifications")
      .insert([{ ...notif, user_id: userId, read: false }])
      .select()
      .single();
    if (!error && data) {
      setNotifications((prev) => [data as Notification, ...prev]);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return { notifications, loading, unreadCount, markRead, markAllRead, addNotification, refetch: fetch };
}
