import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { verify } from "https://deno.land/x/djwt@v3.0.2/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Authorization header required');
    }

    const token = authHeader.substring(7);
    const jwtSecret = Deno.env.get('JWT_SECRET')!;
    
    console.log('JWT validation attempt');

    // Verify JWT
    const payload = await verify(token, jwtSecret, 'HS256') as JWTPayload;

    if (!payload || !payload.sub) {
      throw new Error('Invalid token payload');
    }

    // Check if token is expired
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      throw new Error('Token expired');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user still exists and is active
    let userData = null;

    if (payload.userType === 'admin') {
      const { data, error } = await supabase
        .from('superadmin')
        .select('*')
        .eq('id', payload.sub)
        .eq('status', 'active')
        .single();

      if (error || !data) {
        throw new Error('User not found or inactive');
      }
      userData = data;
    } else if (payload.userType === 'organization') {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', payload.sub)
        .eq('status', 'approved')
        .eq('is_active', true)
        .single();

      if (error || !data) {
        throw new Error('Organization not found or inactive');
      }
      userData = data;
    }

    if (!userData) {
      throw new Error('User validation failed');
    }

    // Log security event
    await supabase.rpc('log_security_event', {
      _event_type: 'jwt_validation',
      _details: {
        user_id: payload.sub,
        user_type: payload.userType,
        ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
        user_agent: req.headers.get('user-agent')
      }
    });

    console.log(`JWT validation successful for ${payload.userType}: ${userData.name}`);

    return new Response(JSON.stringify({
      success: true,
      valid: true,
      user: {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        type: payload.userType,
        status: userData.status,
        created_at: userData.created_at
      },
      tokenInfo: {
        issuedAt: payload.iat,
        expiresAt: payload.exp,
        timeRemaining: payload.exp - now
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('JWT validation error:', error);
    return new Response(JSON.stringify({ 
      success: false,
      valid: false,
      error: error.message || 'Token validation failed' 
    }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});