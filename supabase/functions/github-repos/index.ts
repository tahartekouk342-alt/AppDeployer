import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get user from JWT
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get GitHub token from user_profiles using service role
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("user_profiles")
      .select("github_token, github_username")
      .eq("id", user.id)
      .single();

    if (profileError || !profile?.github_token) {
      return new Response(JSON.stringify({ error: "GitHub not connected", connected: false }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch repos from GitHub API
    const reposRes = await fetch("https://api.github.com/user/repos?per_page=100&sort=updated&type=all", {
      headers: {
        Authorization: `Bearer ${profile.github_token}`,
        Accept: "application/vnd.github+json",
      },
    });

    if (!reposRes.ok) {
      // Token might be expired
      if (reposRes.status === 401) {
        // Clear the invalid token
        await supabaseAdmin
          .from("user_profiles")
          .update({ github_token: null, github_username: null })
          .eq("id", user.id);

        return new Response(JSON.stringify({ error: "Token expired", connected: false }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`GitHub API error: ${reposRes.status}`);
    }

    const repos = await reposRes.json();

    const simplified = repos.map((r: any) => ({
      id: r.id,
      name: r.name,
      full_name: r.full_name,
      html_url: r.html_url,
      description: r.description,
      language: r.language,
      private: r.private,
      default_branch: r.default_branch,
      updated_at: r.updated_at,
      stargazers_count: r.stargazers_count,
      forks_count: r.forks_count,
    }));

    return new Response(
      JSON.stringify({
        connected: true,
        username: profile.github_username,
        repos: simplified,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("github-repos error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
