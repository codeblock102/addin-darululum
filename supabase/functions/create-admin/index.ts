import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";
import { corsHeaders } from "../_shared/cors.ts";

const supabaseUrl = Deno.env.get("API_URL");
const serviceRoleKey = Deno.env.get("SERVICE_KEY");

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing environment variables: API_URL or SERVICE_KEY");
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email, password, name, madrassah_id } = await req.json();

    if (!email || !password || !name || !madrassah_id) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(supabaseUrl!, serviceRoleKey!);

    // Step 1: Create the user account
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role: 'admin' },
    });

    if (authError || !authData.user) {
      console.error("Error creating user:", authError);
      return new Response(JSON.stringify({ error: authError?.message || 'Failed to create user account' }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 2: Create the profile
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert({
        id: authData.user.id,
        name,
        role: 'admin',
        madrassah_id,
      });

    if (profileError) {
      console.error("Error creating profile:", profileError);
      // Clean up the created user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return new Response(JSON.stringify({ error: `Failed to create profile: ${profileError.message}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ user: authData.user }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Unhandled error:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}); 