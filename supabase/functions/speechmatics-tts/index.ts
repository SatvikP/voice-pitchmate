import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { text, voice } = await req.json();
    const SPEECHMATICS_API_KEY = Deno.env.get("SPEECHMATICS_API_KEY");
    if (!SPEECHMATICS_API_KEY) throw new Error("SPEECHMATICS_API_KEY is not configured");

    if (!text) throw new Error("text is required");

    const voiceId = voice || "sarah";
    const response = await fetch(`https://preview.tts.speechmatics.com/generate/${voiceId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SPEECHMATICS_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Speechmatics TTS error:", response.status, errorText);
      throw new Error(`TTS failed [${response.status}]: ${errorText}`);
    }

    const audioData = await response.arrayBuffer();

    return new Response(audioData, {
      headers: {
        ...corsHeaders,
        "Content-Type": "audio/wav",
        "Content-Length": String(audioData.byteLength),
      },
    });
  } catch (e) {
    console.error("tts error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
