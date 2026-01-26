import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface UpdateUserRequest {
  user_id: string;
  full_name: string;
  email: string;
  phone?: string;
  role: "admin" | "supervisor" | "cobrador";
  password?: string; // Optional - only update if provided
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify the requesting user is authenticated and is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization header required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create client with anon key to verify the requesting user
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get the requesting user
    const { data: { user: requestingUser }, error: authError } = await anonClient.auth.getUser();
    if (authError || !requestingUser) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if requesting user is an admin
    const { data: roleData, error: roleError } = await anonClient
      .from("user_roles")
      .select("role")
      .eq("user_id", requestingUser.id)
      .maybeSingle();

    if (roleError) {
      console.error("Role check error:", roleError);
      return new Response(
        JSON.stringify({ error: "Failed to verify permissions" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!roleData || roleData.role !== "admin") {
      return new Response(
        JSON.stringify({ error: "Only administrators can update users" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const body: UpdateUserRequest = await req.json();
    const { user_id, full_name, email, phone, role, password } = body;

    // Validate required fields
    if (!user_id || !full_name || !email || !role) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: user_id, full_name, email, role" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate role
    if (!["admin", "supervisor", "cobrador"].includes(role)) {
      return new Response(
        JSON.stringify({ error: "Invalid role. Must be admin, supervisor, or cobrador" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate password length if provided
    if (password && password.length < 6) {
      return new Response(
        JSON.stringify({ error: "Password must be at least 6 characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create admin client with service role key
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Get current user data to compare email
    const { data: currentProfile, error: profileFetchError } = await adminClient
      .from("users_profile")
      .select("email")
      .eq("user_id", user_id)
      .maybeSingle();

    if (profileFetchError) {
      console.error("Profile fetch error:", profileFetchError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch user profile" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!currentProfile) {
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Prepare auth update data
    const authUpdateData: { email?: string; password?: string } = {};
    
    // Only update email in auth if it changed
    if (email !== currentProfile.email) {
      authUpdateData.email = email;
    }
    
    // Only update password if provided
    if (password) {
      authUpdateData.password = password;
    }

    // Update auth.users if there are changes
    if (Object.keys(authUpdateData).length > 0) {
      const { error: authUpdateError } = await adminClient.auth.admin.updateUserById(
        user_id,
        authUpdateData
      );

      if (authUpdateError) {
        console.error("Auth update error:", authUpdateError);
        return new Response(
          JSON.stringify({ error: authUpdateError.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      console.log("Auth user updated:", user_id);
    }

    // Update users_profile
    const { error: profileUpdateError } = await adminClient
      .from("users_profile")
      .update({ 
        full_name, 
        email, 
        phone: phone || null,
        updated_at: new Date().toISOString()
      })
      .eq("user_id", user_id);

    if (profileUpdateError) {
      console.error("Profile update error:", profileUpdateError);
      return new Response(
        JSON.stringify({ error: "Failed to update user profile" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    console.log("Profile updated:", user_id);

    // Update user_roles
    const { error: roleUpdateError } = await adminClient
      .from("user_roles")
      .update({ role })
      .eq("user_id", user_id);

    if (roleUpdateError) {
      console.error("Role update error:", roleUpdateError);
      return new Response(
        JSON.stringify({ error: "Failed to update user role" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    console.log("Role updated:", role);

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: { 
          user_id,
          email,
          full_name,
          role,
          phone
        } 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
