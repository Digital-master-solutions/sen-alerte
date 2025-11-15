import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { create } from "https://deno.land/x/djwt@v3.0.2/mod.ts";
import { z } from 'https://esm.sh/zod@3.22.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
const RefreshRequestSchema = z.object({
  refreshToken: z.string().uuid('Invalid refresh token format')
});

interface RefreshRequest {
  refreshToken: string;
}

interface JWTPayload {
  sub: string;
  name: string;
  email: string;
  userType: string;
  exp: number;
  iat: number;
  [key: string]: unknown;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse and validate input
    const requestBody = await req.json();
    const validationResult = RefreshRequestSchema.safeParse(requestBody);
    
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid refresh token format'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }
    
    const { refreshToken } = validationResult.data;

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const jwtSecret = Deno.env.get('JWT_SECRET')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Token refresh attempt');

    // Validate refresh token
    const { data: tokenData, error: tokenError } = await supabase
      .from('refresh_tokens')
      .select('*')
      .eq('token_hash', refreshToken)
      .eq('is_revoked', false)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (tokenError || !tokenData) {
      console.error('Invalid refresh token:', tokenError);
      throw new Error('Invalid or expired refresh token');
    }

    // Get user data based on user type
    let userData = null;

    if (tokenData.user_type === 'admin') {
      const { data, error } = await supabase
        .from('superadmin')
        .select('*')
        .eq('id', tokenData.user_id)
        .eq('status', 'active')
        .single();

      if (error || !data) {
        throw new Error('User not found or inactive');
      }
      userData = data;
    } else if (tokenData.user_type === 'organization') {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', tokenData.user_id)
        .eq('status', 'approved')
        .eq('is_active', true)
        .single();

      if (error || !data) {
        throw new Error('Organization not found or inactive');
      }
      userData = data;
    }

    if (!userData) {
      throw new Error('User data not found');
    }

    // Generate new JWT
    const now = Math.floor(Date.now() / 1000);
    const payload: JWTPayload = {
      sub: userData.id,
      name: userData.name,
      email: userData.email,
      userType: tokenData.user_type,
      iat: now,
      exp: now + (15 * 60) // 15 minutes
    };

    const jwt = await create({ alg: "HS256", typ: "JWT" }, payload, jwtSecret);

    // Generate new refresh token
    const newRefreshToken = crypto.randomUUID();
    const refreshExpiry = new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)); // 7 days

    // Revoke old refresh token
    await supabase
      .from('refresh_tokens')
      .update({ is_revoked: true })
      .eq('token_hash', refreshToken);

    // Store new refresh token
    const { error: newTokenError } = await supabase
      .from('refresh_tokens')
      .insert({
        user_id: userData.id,
        user_type: tokenData.user_type,
        token_hash: newRefreshToken,
        expires_at: refreshExpiry.toISOString(),
        user_agent: req.headers.get('user-agent'),
        ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip')
      });

    if (newTokenError) {
      console.error('Error storing new refresh token:', newTokenError);
      throw newTokenError;
    }

    // Update session last activity
    await supabase
      .from('user_sessions')
      .update({ 
        last_activity_at: new Date().toISOString(),
        refresh_token_id: newRefreshToken
      })
      .eq('user_id', userData.id)
      .eq('user_type', tokenData.user_type)
      .eq('is_active', true);

    console.log(`Token refreshed successfully for ${tokenData.user_type}: ${userData.name}`);

    return new Response(JSON.stringify({
      success: true,
      user: {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        type: tokenData.user_type,
        status: userData.status,
        created_at: userData.created_at
      },
      token: jwt,
      refreshToken: newRefreshToken,
      expiresIn: 900 // 15 minutes
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message || 'Token refresh failed' 
    }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});