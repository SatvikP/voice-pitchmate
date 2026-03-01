import { supabase } from "@/integrations/supabase/client";

const FUNCTIONS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const headers = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${ANON_KEY}`,
});

// Speechmatics TTS
export async function textToSpeech(text: string, voice = "sarah"): Promise<ArrayBuffer> {
  const res = await fetch(`${FUNCTIONS_URL}/speechmatics-tts`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ text, voice }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "TTS failed" }));
    throw new Error(err.error || "TTS request failed");
  }
  return res.arrayBuffer();
}

export function playAudio(audioBuffer: ArrayBuffer): Promise<void> {
  return new Promise((resolve, reject) => {
    const blob = new Blob([audioBuffer], { type: "audio/wav" });
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.onended = () => {
      URL.revokeObjectURL(url);
      resolve();
    };
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Audio playback failed"));
    };
    audio.play().catch(reject);
  });
}

// Backboard.io
export async function backboardAction(action: string, params: Record<string, any> = {}) {
  const res = await fetch(`${FUNCTIONS_URL}/backboard`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ action, ...params }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Backboard request failed" }));
    throw new Error(err.error || "Backboard request failed");
  }
  return res.json();
}

// Pitch history types
export interface ScoreBreakdown {
  clarity: number;
  specificity: number;
  structure: number;
  differentiation: number;
  impact: number;
}

export interface PitchHistoryEntry {
  pitch_number: number;
  transcript: string;
  roast: string;
  score: number | null;
  created_at?: string | null;
}

// Get pitch history for a user
export async function getPitchHistory(userId: string): Promise<PitchHistoryEntry[]> {
  const { data, error } = await supabase
    .from("pitch_sessions")
    .select("pitch_number, transcript, roast, score, created_at")
    .eq("user_id", userId)
    .order("pitch_number", { ascending: true });

  if (error) {
    console.error("Failed to fetch pitch history:", error);
    return [];
  }
  return (data || []) as PitchHistoryEntry[];
}

// Save pitch session to database
export async function savePitchSession(
  userId: string,
  pitchNumber: number,
  transcript: string,
  roast: string,
  score: number | null = null
): Promise<void> {
  const { error } = await supabase.from("pitch_sessions").insert({
    user_id: userId,
    session_id: userId, // keep session_id populated for backwards compat
    pitch_number: pitchNumber,
    transcript,
    roast,
    score,
  });
  if (error) {
    console.error("Failed to save pitch session:", error);
  }
}

// User assistant management
export async function getUserAssistant(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("user_assistants")
    .select("assistant_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Failed to fetch user assistant:", error);
    return null;
  }
  return data?.assistant_id ?? null;
}

export async function saveUserAssistant(userId: string, assistantId: string): Promise<void> {
  const { error } = await supabase.from("user_assistants").insert({
    user_id: userId,
    assistant_id: assistantId,
  });
  if (error) {
    console.error("Failed to save user assistant:", error);
  }
}

// Pitch Roast AI (history-aware)
export async function roastPitch(
  transcript: string,
  history: PitchHistoryEntry[] = []
): Promise<{ roast: string; score: number; breakdown: ScoreBreakdown }> {
  const res = await fetch(`${FUNCTIONS_URL}/pitch-roast`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ transcript, history }),
  });
  if (!res.ok) {
    if (res.status === 429) throw new Error("Rate limited. Try again in a moment.");
    if (res.status === 402) throw new Error("Credits exhausted. Please add funds.");
    const err = await res.json().catch(() => ({ error: "Roast failed" }));
    throw new Error(err.error || "Pitch roast failed");
  }
  const data = await res.json();
  return {
    roast: data.roast,
    score: data.score ?? 0,
    breakdown: data.breakdown ?? { clarity: 0, specificity: 0, structure: 0, differentiation: 0, impact: 0 },
  };
}
