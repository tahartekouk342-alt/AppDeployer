import { useState, useEffect } from "react";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { AuthUser, User } from "@/types";

function mapSupabaseUser(user: SupabaseUser): AuthUser {
  return {
    id: user.id,
    email: user.email!,
    username:
      user.user_metadata?.username ||
      user.user_metadata?.full_name ||
      user.email!.split("@")[0],
    avatar: user.user_metadata?.avatar_url,
  };
}

function authUserToUser(authUser: AuthUser): User {
  return {
    id: authUser.id,
    name: authUser.username,
    email: authUser.email,
    avatar: authUser.avatar,
  };
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted && session?.user) {
        const authUser = mapSupabaseUser(session.user);
        setUser(authUserToUser(authUser));
      }
      if (mounted) setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      // Handle Google OAuth callback and regular sign-in
      if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session?.user) {
        const authUser = mapSupabaseUser(session.user);
        setUser(authUserToUser(authUser));
        setLoading(false);
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setLoading(false);
      } else if (event === "TOKEN_REFRESHED" && session?.user) {
        const authUser = mapSupabaseUser(session.user);
        setUser(authUserToUser(authUser));
      } else if (event === "INITIAL_SESSION" && !session) {
        // No active session — ensure loading is cleared
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const sendOtp = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    if (error) throw error;
  };

  const verifyOtpAndSetPassword = async (
    email: string,
    token: string,
    password: string,
    name: string
  ) => {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "email",
    });
    if (error) throw error;

    const { data: updateData, error: updateError } = await supabase.auth.updateUser({
      password,
      data: { username: name || email.split("@")[0] },
    });
    if (updateError) throw updateError;
    return updateData.user!;
  };

  const signInWithPassword = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data.user;
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    const supabaseUser = await signInWithPassword(email, password);
    if (supabaseUser) {
      const authUser = mapSupabaseUser(supabaseUser);
      setUser(authUserToUser(authUser));
      return true;
    }
    return false;
  };

  const register = async (
    name: string,
    email: string,
    password: string
  ): Promise<boolean> => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username: name } },
    });
    if (error) throw error;
    if (data.user) {
      const authUser = mapSupabaseUser(data.user);
      setUser(authUserToUser(authUser));
      return true;
    }
    return false;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return { user, loading, login, register, logout, sendOtp, verifyOtpAndSetPassword };
}
