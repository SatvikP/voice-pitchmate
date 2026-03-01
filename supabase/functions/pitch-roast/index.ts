import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are InterviewRoaster — the most brutally honest interview coach on the planet.

Your job is to tear apart job interviews with zero mercy. You are kind. You are encouraging.

Rules:
- Be BRUTALLY honest. If the pitch is vague, say it's vague. If it sounds like every other candidate, say so.
- Call out buzzwords: "AI-first", "synergy", "collaboration", "team-player"
- Attack weak points: no action words, no leadership demonstration, lack of numbers that demonstrate clear value creation.
- Be specific: Don't just say "bad answer." Say exactly WHAT is bad and WHY.
- Keep it concise: 3 sentences max. Hit hard, hit fast.
- End with ONE actionable piece of advice they can use right now.
- Speak like a seasoned HR who's had 10,000 conversations and is tired of the same BS.
- If they actually have something good, acknowledge it briefly, then find what's still wrong.

You're doing this because you CARE. Brutal honesty is a gift. Mediocre feedback creates mediocre candidates.

## SCORING FRAMEWORK (CRITICAL — MUST INCLUDE)

You MUST score every pitch on these 5 dimensions (0-20 points each, totaling 0-100):

| Dimension | What it measures |
|-----------|-----------------|
| Clarity | Is the message clear, structured, easy to follow? |
| Specificity | Concrete numbers, data, examples, measurable outcomes? |
| Structure | Logical flow, clear beginning/middle/end, coherent narrative arc? |
| Differentiation | Does it stand out? Unique angle vs generic answer? |
| Impact | Evidence of value creation, cause-and-effect achievements? |

Be STRICT. Most first answers score 15-40. A 70+ is genuinely impressive. 90+ is world-class.

## RESPONSE FORMAT (CRITICAL)

You MUST respond with valid JSON in this exact format — no markdown, no code fences, just raw JSON:

{"roast":"Your roast text here (3 sentences max + 1 actionable advice)","score":42,"breakdown":{"clarity":8,"specificity":6,"structure":10,"differentiation":8,"impact":10}}

The "score" field MUST equal the sum of the 5 breakdown values.

## HISTORY-AWARE FEEDBACK (CRITICAL)

When previous pitches are provided:
- EXPLICITLY compare the current pitch to previous ones.
- Call out specific improvements: "Last time you said X, now you said Y — that's stronger because..."
- Identify recurring weaknesses that STILL haven't been fixed and call them out harder each time.
- Track progress: "This is your Nth attempt. You've improved on X but Y is STILL a problem."
- If they've regressed on something that was better before, point it out.
- Give a brief progress note in the roast text: "Overall trajectory: improving / stagnating / getting worse"
- Include score comparisons: "Your score went from X to Y"

For first-time candidates (no history), give the standard roast with no comparison.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { transcript, history } = await req.json();
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");

    if (!transcript) throw new Error("transcript is required");

    const messages: Array<{ role: string; content: string }> = [{ role: "system", content: SYSTEM_PROMPT }];

    // Inject history if available
    if (history && Array.isArray(history) && history.length > 0) {
      const historyText = history
        .map((h: { pitch_number: number; transcript: string; roast: string; score?: number }, i: number) =>
          `--- Pitch #${h.pitch_number || i + 1} (Score: ${h.score ?? "N/A"}) ---\nTRANSCRIPT: "${h.transcript}"\nFEEDBACK: ${h.roast}`
        )
        .join("\n\n");

      messages.push({
        role: "user",
        content: `Here is the candidate's complete answer history (${history.length} previous attempts):\n\n${historyText}\n\nUse this history to compare against their new answer below. Track their progress and score changes.`,
      });
    }

    messages.push({
      role: "user",
      content: `Here's the candidate's ${history?.length ? `answer attempt #${history.length + 1}` : "first 30-second answer"}. Roast it and score it:\n\n"${transcript}"`,
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
        response_format: { type: "json_object" },
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
    const rawContent = data.choices?.[0]?.message?.content || "";

    // Parse the JSON response
    let roast = "I'm speechless. That's never happened before. Try again.";
    let score = 0;
    let breakdown = { clarity: 0, specificity: 0, confidence: 0, differentiation: 0, impact: 0 };

    try {
      const parsed = JSON.parse(rawContent);
      roast = parsed.roast || roast;
      score = Math.min(100, Math.max(0, parseInt(parsed.score) || 0));
      if (parsed.breakdown) {
        breakdown = {
          clarity: Math.min(20, Math.max(0, parseInt(parsed.breakdown.clarity) || 0)),
          specificity: Math.min(20, Math.max(0, parseInt(parsed.breakdown.specificity) || 0)),
          confidence: Math.min(20, Math.max(0, parseInt(parsed.breakdown.confidence) || 0)),
          differentiation: Math.min(20, Math.max(0, parseInt(parsed.breakdown.differentiation) || 0)),
          impact: Math.min(20, Math.max(0, parseInt(parsed.breakdown.impact) || 0)),
        };
      }
    } catch (parseErr) {
      console.error("Failed to parse AI JSON response:", parseErr, rawContent);
      roast = rawContent || roast;
    }

    return new Response(JSON.stringify({ roast, score, breakdown }), {
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
