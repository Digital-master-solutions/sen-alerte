import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { create, verify } from "https://deno.land/x/djwt@v2.8/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AuthRequest {
  email: string;
  password: string;
  userType: 'admin' | 'organization';
}

interface JWTPayload {
  sub: string;
  name: string;
  email: string;
  userType: string;
  exp: number;
  iat: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, password, userType }: AuthRequest = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const jwtSecret = Deno.env.get('JWT_SECRET')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`Authentication attempt for ${userType}: ${email}`);

    let userData = null;
    let errorMessage = null;

    if (userType === 'admin') {
      // Authenticate superadmin
      const { data, error } = await supabase.rpc('authenticate_superadmin', {
        _username: email,
        _password_raw: password
      });

      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error('Invalid credentials');
      }
      
      const admin = data[0];
      
      // Check if there's an error message from the authentication function
      if (admin.error_message) {
        throw new Error(admin.error_message);
      }
      
      userData = admin;
      
      // Update last login
      await supabase.rpc('update_superadmin_last_login', {
        _username: email
      });
      
    } else if (userType === 'organization') {
      // Authenticate organization
      const { data, error } = await supabase.rpc('authenticate_organization', {
        org_email: email,
        plain_password: password
      });

      if (error) throw error;
      if (!data || data.length === 0) {
        // Vérifier si l'organisation existe pour déterminer le type d'erreur
        const { data: orgExists } = await supabase
          .from('organizations')
          .select('id, status, is_active')
          .eq('email', email)
          .single();

        if (!orgExists) {
          throw new Error('Email ou mot de passe incorrect');
        } else if (orgExists.status !== 'approved') {
          throw new Error('Votre compte n\'est pas encore approuvé. Veuillez contacter l\'administrateur.');
        } else if (!orgExists.is_active) {
          throw new Error('Votre compte a été désactivé. Veuillez contacter l\'administrateur.');
        } else {
          throw new Error('Email ou mot de passe incorrect');
        }
      }
      
      const org = data[0];
      
      // Check if there's an error message from the authentication function
      if (org.error_message) {
        throw new Error(org.error_message);
      }
      
      userData = org;
    }

    if (!userData) {
      throw new Error('Authentication failed');
    }

    // Generate JWT token
    const now = Math.floor(Date.now() / 1000);
    const payload: JWTPayload = {
      sub: userData.id,
      name: userData.name,
      email: userData.email,
      userType,
      iat: now,
      exp: now + (15 * 60) // 15 minutes
    };

    const jwt = await create({ alg: "HS256", typ: "JWT" }, payload, jwtSecret);

    // Generate refresh token
    const refreshTokenHash = crypto.randomUUID();
    const refreshTokenExpiry = new Date();
    refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7); // 7 days

    // Store refresh token in database
    const { error: refreshError } = await supabase
      .from('refresh_tokens')
      .insert({
        token_hash: refreshTokenHash,
        user_id: userData.id,
        user_type: userType,
        expires_at: refreshTokenExpiry.toISOString(),
        ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
        user_agent: req.headers.get('user-agent')
      });

    if (refreshError) {
      console.error('Error storing refresh token:', refreshError);
      throw new Error('Failed to create session');
    }

    // Create user session
    const sessionTokenHash = crypto.randomUUID();
    const sessionExpiry = new Date();
    sessionExpiry.setMinutes(sessionExpiry.getMinutes() + 15); // 15 minutes

    const { error: sessionError } = await supabase
      .from('user_sessions')
      .insert({
        session_token_hash: sessionTokenHash,
        user_id: userData.id,
        user_type: userType,
        expires_at: sessionExpiry.toISOString(),
        last_activity_at: new Date().toISOString(),
        ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
        user_agent: req.headers.get('user-agent'),
        device_info: {
          userAgent: req.headers.get('user-agent'),
          ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip')
        }
      });

    if (sessionError) {
      console.error('Error creating user session:', sessionError);
      throw new Error('Failed to create session');
    }

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: userData.id,
          name: userData.name,
          email: userData.email,
          userType,
          status: userData.status
        },
        token: jwt,
        refreshToken: refreshTokenHash,
        expiresIn: 15 * 60 // 15 minutes in seconds
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Authentication error:', error);
    
    let errorMessage = 'Authentication failed';
    let statusCode = 401;
    
    if (error.message.includes("n'est pas encore approuvé")) {
      errorMessage = "Votre compte n'est pas encore approuvé. Veuillez contacter l'administrateur.";
      statusCode = 403;
    } else if (error.message.includes("a été désactivé")) {
      errorMessage = "Votre compte a été désactivé. Veuillez contacter l'administrateur.";
      statusCode = 403;
    } else if (error.message.includes("Mot de passe incorrect")) {
      errorMessage = "Mot de passe incorrect";
      statusCode = 401;
    } else if (error.message.includes("Aucune organisation trouvée") || error.message.includes("Nom d'utilisateur incorrect")) {
      errorMessage = "Identifiants incorrects";
      statusCode = 401;
    } else if (error.message) {
      errorMessage = error.message;
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: statusCode,
      }
    );
  }
});