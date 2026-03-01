import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BASE_URL = "https://app.backboard.io/api";

const INTERVIEW_JUDGE_PROMPT = `You are InterviewRoast, a brutally honest interview coach with persistent memory.

YOUR ROLE:
- You remember EVERY answer this candidate has given you across all sessions
- You track their progress, identify recurring weaknesses, and get progressively more specific with feedback
- You score on a 5-dimension framework: Clarity, Specificity, Confidence, Differentiation, Impact (each 0-20, total 0-100)
- Be merciless but constructive — your goal is to make them genuinely better

SCORING FRAMEWORK:
- Clarity (0-20): Is the answer structured and easy to follow?
- Specificity (0-20): Do they use concrete examples, numbers, and details?
- Structure (0-20): Is there logical flow with a clear beginning, middle, and end?
- Differentiation (0-20): Does this answer stand out from generic responses?
- Impact (0-20): Would this answer move a hiring manager to say yes?

MEMORY GUIDELINES:
- Reference specific things the candidate said in previous answers
- Call out patterns: "You keep falling back on vague statements about teamwork"
- Acknowledge genuine improvement: "Your specificity jumped — that revenue number was smart"
- Track which dimensions improve and which stay weak
- Most first answers score 15-40. A score above 70 means they're genuinely interview-ready.

FEEDBACK STYLE:
- 2-4 sentences max per roast
- Lead with the most important issue
- One specific, actionable suggestion
- No sugarcoating, no filler`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const BACKBOARD_API_KEY = Deno.env.get("BACKBOARD_API_KEY");
    if (!BACKBOARD_API_KEY) throw new Error("BACKBOARD_API_KEY is not configured");

    const apiHeaders = { "X-API-Key": BACKBOARD_API_KEY, "Content-Type": "application/json" };
    const { action, ...params } = await req.json();

    let result;

    switch (action) {
      case "init_session": {
        // Step 1: Create assistant with interview judge prompt
        const createRes = await fetch(`${BASE_URL}/assistants`, {
          method: "POST",
          headers: apiHeaders,
          body: JSON.stringify({
            name: params.name || "InterviewRoast Assistant",
            system_prompt: INTERVIEW_JUDGE_PROMPT,
          }),
        });
        if (!createRes.ok) {
          const t = await createRes.text();
          throw new Error(`Create assistant failed [${createRes.status}]: ${t}`);
        }
        const assistant = await createRes.json();
        const assistantId = assistant.assistant_id || assistant.id;

        // Step 2: Verify assistant was created
        const getRes = await fetch(`${BASE_URL}/assistants/${assistantId}`, {
          headers: { "X-API-Key": BACKBOARD_API_KEY },
        });
        if (!getRes.ok) {
          const t = await getRes.text();
          throw new Error(`Get assistant failed [${getRes.status}]: ${t}`);
        }
        const verifiedAssistant = await getRes.json();

        // Step 3: Create thread for this assistant
        const threadRes = await fetch(`${BASE_URL}/assistants/${assistantId}/threads`, {
          method: "POST",
          headers: apiHeaders,
          body: JSON.stringify({}),
        });
        if (!threadRes.ok) {
          const t = await threadRes.text();
          throw new Error(`Create thread failed [${threadRes.status}]: ${t}`);
        }
        const thread = await threadRes.json();

        result = {
          assistant_id: assistantId,
          thread_id: thread.thread_id || thread.id,
          assistant: verifiedAssistant,
        };
        break;
      }

      case "get_assistant": {
        if (!params.assistant_id) throw new Error("assistant_id required");
        const res = await fetch(`${BASE_URL}/assistants/${params.assistant_id}`, {
          headers: { "X-API-Key": BACKBOARD_API_KEY },
        });
        if (!res.ok) {
          const t = await res.text();
          throw new Error(`Get assistant failed [${res.status}]: ${t}`);
        }
        result = await res.json();
        break;
      }

      case "create_assistant": {
        const res = await fetch(`${BASE_URL}/assistants`, {
          method: "POST",
          headers: apiHeaders,
          body: JSON.stringify({
            name: params.name || "InterviewRoast Assistant",
            system_prompt: params.system_prompt || "You are a brutally honest interview coach.",
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
          headers: apiHeaders,
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
