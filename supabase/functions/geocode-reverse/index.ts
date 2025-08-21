import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const lat = url.searchParams.get('lat');
    const lon = url.searchParams.get('lon');

    if (!lat || !lon) {
      return new Response(
        JSON.stringify({ error: 'Missing latitude or longitude parameters' }), 
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Reverse geocoding for: ${lat}, ${lon}`);

    // Call Nominatim API from server side (no CORS issues)
    const nominatimResponse = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=16&addressdetails=1&accept-language=fr`,
      {
        headers: {
          'User-Agent': 'SenAlert-App/1.0'
        }
      }
    );

    if (!nominatimResponse.ok) {
      console.error(`Nominatim API error: ${nominatimResponse.status}`);
      return new Response(
        JSON.stringify({ 
          error: 'Geocoding service unavailable',
          fallback: `${parseFloat(lat).toFixed(4)}, ${parseFloat(lon).toFixed(4)}`
        }), 
        { 
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const data = await nominatimResponse.json();
    console.log('Nominatim response:', data);

    if (data && data.address) {
      const quartier = data.address.suburb || 
                     data.address.neighbourhood || 
                     data.address.quarter ||
                     data.address.city_district ||
                     data.address.village ||
                     data.address.town ||
                     data.address.city ||
                     "Zone inconnue";

      return new Response(
        JSON.stringify({ 
          location: quartier,
          full_address: data.display_name 
        }), 
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    } else {
      return new Response(
        JSON.stringify({ 
          location: `${parseFloat(lat).toFixed(4)}, ${parseFloat(lon).toFixed(4)}`,
          fallback: true
        }), 
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

  } catch (error) {
    console.error('Geocoding error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }), 
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});