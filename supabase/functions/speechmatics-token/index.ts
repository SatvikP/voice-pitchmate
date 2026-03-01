import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SPEECHMATICS_API_KEY = Deno.env.get("SPEECHMATICS_API_KEY");
    if (!SPEECHMATICS_API_KEY) throw new Error("SPEECHMATICS_API_KEY is not configured");

    const response = await fetch("https://mp.speechmatics.com/v1/api_keys?type=rt", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SPEECHMATICS_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ttl: 60 }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Speechmatics token error:", response.status, errorText);
      throw new Error(`Token generation failed [${response.status}]: ${errorText}`);
    }

    const data = await response.json();

    return new Response(JSON.stringify({ jwt: data.key_value }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("speechmatics-token error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
