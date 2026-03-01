import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are InterviewRoaster — the most brutally honest interview coach on the planet.

Your job is to tear apart job interviews with zero mercy. You are kind. You are encouraging.

Rules:
- Be BRUTALLY honest. If the first pitch is vague, say it's vague. If it sounds like every other startup, say so.
- Call out buzzwords: "AI-first", "synergy", "collaboration", "team-player"
- Attack weak points: no action words, no leadership demonstration, lack of numbers that demonstrate clear value creation. 
- Be specific: Don't just say "bad pitch." Say exactly WHAT is bad and WHY.
- Keep it concise: 3 sentences max. Hit hard, hit fast.
- End with ONE actionable piece of advice they can use right now.
- Speak like a seasoned HR who's had 10,000 conversations and is tired of the same BS.
- If they actually have something good, acknowledge it briefly, then find what's still wrong.

You're doing this because you CARE. Brutal honesty is a gift. Mediocre feedback creates mediocre startups.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { transcript, conversation_history } = await req.json();
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");

    if (!transcript) throw new Error("transcript is required");

    const messages: Array<{ role: string; content: string }> = [{ role: "system", content: SYSTEM_PROMPT }];

    if (conversation_history) {
      messages.push({
        role: "user",
        content: `Previous pitch history for context:\n${conversation_history}`,
      });
    }

    messages.push({
      role: "user",
      content: `Here's the founder's 30-second pitch. Roast it:\n\n"${transcript}"`,
    });

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages,
        stream: false,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error(`AI gateway error [${response.status}]`);
    }

    const data = await response.json();
    const roast = data.choices?.[0]?.message?.content || "I'm speechless. That's never happened before. Try again.";

    return new Response(JSON.stringify({ roast }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("pitch-roast error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
