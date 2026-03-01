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

// Pitch Roast AI
export async function roastPitch(transcript: string, conversationHistory: string = ""): Promise<string> {
  const res = await fetch(`${FUNCTIONS_URL}/pitch-roast`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ transcript, conversation_history: conversationHistory }),
  });
  if (!res.ok) {
    if (res.status === 429) throw new Error("Rate limited. Try again in a moment.");
    if (res.status === 402) throw new Error("Credits exhausted. Please add funds.");
    const err = await res.json().catch(() => ({ error: "Roast failed" }));
    throw new Error(err.error || "Pitch roast failed");
  }
  const data = await res.json();
  return data.roast;
}
