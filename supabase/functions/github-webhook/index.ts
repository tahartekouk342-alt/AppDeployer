import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface GitHubPushPayload {
  repository?: {
    full_name?: string;
    name?: string;
  };
  pusher?: {
    name?: string;
  };
  head_commit?: {
    message?: string;
    id?: string;
  };
  ref?: string;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const payload: GitHubPushPayload = await req.json();

    const repoFullName = payload.repository?.full_name;
    const repoName = payload.repository?.name ?? "Unknown Repo";
    const pusher = payload.pusher?.name ?? "unknown";
    const commitMessage = payload.head_commit?.message ?? "New push";
    const branch = payload.ref?.replace("refs/heads/", "") ?? "main";

    console.log(`Webhook received for repo: ${repoFullName}, branch: ${branch}, pusher: ${pusher}`);

    if (!repoFullName) {
      return new Response(JSON.stringify({ error: "Missing repository info" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find all projects connected to this GitHub repo
    const { data: projects, error: fetchError } = await supabase
      .from("projects")
      .select("id, user_id, name, github_repo")
      .or(`github_repo.eq.${repoFullName},github_repo.ilike.%${repoName}%`);

    if (fetchError) {
      console.error("Failed to fetch projects:", fetchError.message);
      return new Response(JSON.stringify({ error: "Database error", detail: fetchError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!projects || projects.length === 0) {
      console.log(`No projects found for repo: ${repoFullName}`);
      return new Response(
        JSON.stringify({ message: "No projects linked to this repository", repo: repoFullName }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const notificationsToInsert: object[] = [];
    const projectIds: string[] = [];

    for (const project of projects) {
      projectIds.push(project.id);

      // Create "building" notification
      notificationsToInsert.push({
        user_id: project.user_id,
        title: `🔨 Build Started: ${project.name}`,
        message: `Push by ${pusher} on branch "${branch}": "${commitMessage.slice(0, 80)}" — build in progress.`,
        type: "info",
        read: false,
        project_id: project.id,
      });
    }

    // Update all matched projects to 'building'
    const { error: updateError } = await supabase
      .from("projects")
      .update({ status: "building", updated_at: new Date().toISOString() })
      .in("id", projectIds);

    if (updateError) {
      console.error("Failed to update project status:", updateError.message);
    }

    // Insert "building" notifications
    if (notificationsToInsert.length > 0) {
      const { error: notifError } = await supabase
        .from("notifications")
        .insert(notificationsToInsert);
      if (notifError) {
        console.error("Failed to insert notifications:", notifError.message);
      }
    }

    // Simulate build completion after 10 seconds (async, non-blocking)
    simulateBuildCompletion(supabase, projectIds, projects, pusher, branch);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Build triggered for ${projectIds.length} project(s)`,
        projects: projects.map((p) => ({ id: p.id, name: p.name })),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Webhook handler error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error", detail: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function simulateBuildCompletion(
  supabase: ReturnType<typeof createClient>,
  projectIds: string[],
  projects: Array<{ id: string; user_id: string; name: string }>,
  pusher: string,
  branch: string
) {
  // Wait 10 seconds to simulate a build process
  await new Promise((resolve) => setTimeout(resolve, 10000));

  // Mark projects as live
  await supabase
    .from("projects")
    .update({
      status: "live",
      last_deploy: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .in("id", projectIds);

  // Insert "build complete" notifications
  const completionNotifs = projects.map((project) => ({
    user_id: project.user_id,
    title: `✅ Build Complete: ${project.name}`,
    message: `Successfully deployed branch "${branch}" pushed by ${pusher}. Your app is now live!`,
    type: "success",
    read: false,
    project_id: project.id,
  }));

  await supabase.from("notifications").insert(completionNotifs);
  console.log(`Build simulation complete for ${projectIds.length} project(s)`);
}
