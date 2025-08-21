import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sign } from "https://deno.land/x/djwt@v3.0.2/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
      
      userData = data[0];
      
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
        throw new Error('Invalid credentials or account not approved');
      }
      
      userData = data[0];
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

    const jwt = await sign(payload, jwtSecret, 'HS256');

    // Generate refresh token
    const refreshTokenHash = crypto.randomUUID();
    const refreshExpiry = new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)); // 7 days

    // Store refresh token
    const { error: tokenError } = await supabase
      .from('refresh_tokens')
      .insert({
        user_id: userData.id,
        user_type: userType,
        token_hash: refreshTokenHash,
        expires_at: refreshExpiry.toISOString(),
        user_agent: req.headers.get('user-agent'),
        ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip')
      });

    if (tokenError) {
      console.error('Error storing refresh token:', tokenError);
      throw tokenError;
    }

    // Create user session
    const sessionToken = crypto.randomUUID();
    const sessionExpiry = new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)); // 7 days

    const { error: sessionError } = await supabase
      .from('user_sessions')
      .insert({
        user_id: userData.id,
        user_type: userType,
        session_token_hash: sessionToken,
        expires_at: sessionExpiry.toISOString(),
        user_agent: req.headers.get('user-agent'),
        ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
        refresh_token_id: refreshTokenHash
      });

    if (sessionError) {
      console.error('Error creating session:', sessionError);
      throw sessionError;
    }

    console.log(`Authentication successful for ${userType}: ${userData.name}`);

    return new Response(JSON.stringify({
      success: true,
      user: {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        type: userType,
        status: userData.status,
        created_at: userData.created_at
      },
      token: jwt,
      refreshToken: refreshTokenHash,
      expiresIn: 900 // 15 minutes
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Auth login error:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message || 'Authentication failed' 
    }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});