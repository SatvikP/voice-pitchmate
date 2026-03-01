import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BASE_URL = "https://app.backboard.io/api";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const BACKBOARD_API_KEY = Deno.env.get("BACKBOARD_API_KEY");
    if (!BACKBOARD_API_KEY) throw new Error("BACKBOARD_API_KEY is not configured");

    const headers = { "X-API-Key": BACKBOARD_API_KEY, "Content-Type": "application/json" };
    const { action, ...params } = await req.json();

    let result;

    switch (action) {
      case "create_assistant": {
        const res = await fetch(`${BASE_URL}/assistants`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            name: params.name || "PitchRoast Assistant",
            system_prompt: params.system_prompt || "You are a brutally honest pitch coach.",
          }),
        });
        if (!res.ok) {
          const t = await res.text();
          throw new Error(`Create assistant failed [${res.status}]: ${t}`);
        }
        result = await res.json();
        break;
      }

      case "create_thread": {
        if (!params.assistant_id) throw new Error("assistant_id required");
        const res = await fetch(`${BASE_URL}/assistants/${params.assistant_id}/threads`, {
          method: "POST",
          headers,
          body: JSON.stringify({}),
        });
        if (!res.ok) {
          const t = await res.text();
          throw new Error(`Create thread failed [${res.status}]: ${t}`);
        }
        result = await res.json();
        break;
      }

      case "send_message": {
        if (!params.thread_id) throw new Error("thread_id required");
        if (!params.content) throw new Error("content required");
        const formData = new FormData();
        formData.append("content", params.content);
        formData.append("stream", "false");
        formData.append("memory", params.memory || "Auto");

        const res = await fetch(`${BASE_URL}/threads/${params.thread_id}/messages`, {
          method: "POST",
          headers: { "X-API-Key": BACKBOARD_API_KEY },
          body: formData,
        });
        if (!res.ok) {
          const t = await res.text();
          throw new Error(`Send message failed [${res.status}]: ${t}`);
        }
        result = await res.json();
        break;
      }

      case "get_threads": {
        if (!params.assistant_id) throw new Error("assistant_id required");
        const res = await fetch(`${BASE_URL}/assistants/${params.assistant_id}/threads`, {
          headers: { "X-API-Key": BACKBOARD_API_KEY },
        });
        if (!res.ok) {
          const t = await res.text();
          throw new Error(`Get threads failed [${res.status}]: ${t}`);
        }
        result = await res.json();
        break;
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("backboard error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
