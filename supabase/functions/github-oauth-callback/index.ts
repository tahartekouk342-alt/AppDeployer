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
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state"); // contains the Supabase user ID
    const error = url.searchParams.get("error");

    const appUrl = url.searchParams.get("app_url") || "https://appdeployer.vercel.app";

    if (error) {
      return Response.redirect(`${appUrl}/github?error=${encodeURIComponent(error)}`);
    }

    if (!code || !state) {
      return Response.redirect(`${appUrl}/github?error=missing_code`);
    }

    const clientId = Deno.env.get("GITHUB_CLIENT_ID");
    const clientSecret = Deno.env.get("GITHUB_CLIENT_SECRET");

    // Exchange code for access token
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    });

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      console.error("Token exchange failed:", tokenData);
      return Response.redirect(`${appUrl}/github?error=token_exchange_failed`);
    }

    // Get GitHub user info
    const ghUserRes = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github+json",
      },
    });
    const ghUser = await ghUserRes.json();
    const githubUsername = ghUser.login;

    // Store token in user_profiles using service role
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { error: updateError } = await supabaseAdmin
      .from("user_profiles")
      .update({
        github_token: accessToken,
        github_username: githubUsername,
      })
      .eq("id", state);

    if (updateError) {
      console.error("Failed to save token:", updateError);
      return Response.redirect(`${appUrl}/github?error=save_failed`);
    }

    // Redirect back to the app with success
    return Response.redirect(`${appUrl}/github?github_connected=true&username=${encodeURIComponent(githubUsername)}`);
  } catch (err) {
    console.error("Callback error:", err);
    return Response.redirect(`/github?error=unexpected`);
  }
});
