import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateOrganizationRequest {
  name: string;
  type: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  password: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify admin authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error("Non autorisé - authentification requise");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      {
        global: {
          headers: { Authorization: authHeader }
        }
      }
    );

    // Check if user is superadmin
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error("Non autorisé");
    }

    const { data: superadminData, error: superadminError } = await supabaseClient
      .from('superadmin')
      .select('id, status')
      .eq('supabase_user_id', user.id)
      .eq('status', 'active')
      .single();

    if (superadminError || !superadminData) {
      throw new Error("Accès refusé - seuls les super administrateurs peuvent créer des organisations");
    }

    console.log("Superadmin verified, creating organization for:", email);

    const { name, type, email, phone, address, city, password }: CreateOrganizationRequest = await req.json();

    // Admin client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Create Auth user with auto-confirmed email
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        name,
        type: "organization"
      }
    });

    if (authError) {
      console.error("Auth creation error:", authError);
      throw authError;
    }

    console.log("Auth user created:", authData.user.id);

    // Hash password for organizations table
    const { data: hashedPassword, error: hashError } = await supabaseAdmin
      .rpc('hash_password', { plain_password: password });

    if (hashError) {
      console.error("Password hash error:", hashError);
      // Rollback: delete auth user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      throw hashError;
    }

    // Insert organization with linked supabase_user_id
    const { data: orgData, error: orgError } = await supabaseAdmin
      .from('organizations')
      .insert({
        name,
        type,
        email,
        phone,
        address,
        city,
        password_hash: hashedPassword,
        supabase_user_id: authData.user.id,
        status: 'approved', // Admin-created orgs are auto-approved
        is_active: true // Admin-created orgs are immediately active
      })
      .select()
      .single();

    if (orgError) {
      console.error("Organization insert error:", orgError);
      // Rollback: delete auth user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      throw orgError;
    }

    console.log("Organization created successfully:", orgData.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        organization: orgData,
        message: "Compte créé avec succès. En attente d'approbation."
      }), 
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error creating organization account:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Une erreur est survenue lors de la création du compte"
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
