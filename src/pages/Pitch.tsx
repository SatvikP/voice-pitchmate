import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import GlowingOrb from "@/components/GlowingOrb";
import PitchScore from "@/components/PitchScore";
import { Mic, MicOff, Check, RotateCcw, Home, Clock, LogOut } from "lucide-react";
import { textToSpeech, playAudio, backboardAction, roastPitch, getPitchHistory, savePitchSession, getUserAssistant, saveUserAssistant, type ScoreBreakdown } from "@/services/api";
import { SpeechmaticsRealtime } from "@/services/speechmatics";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Phase = "greeting" | "idle" | "listening" | "confirming" | "processing" | "speaking" | "greeting_speaking";

const PITCH_DURATION = 30;

const Pitch = () => {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("greeting");
  const [currentTranscript, setCurrentTranscript] = useState("");
  const [roastText, setRoastText] = useState("");
  const [pitchScore, setPitchScore] = useState<number | null>(null);
  const [scoreBreakdown, setScoreBreakdown] = useState<ScoreBreakdown | null>(null);
  const [timer, setTimer] = useState(PITCH_DURATION);
  const [showTimer, setShowTimer] = useState(false);
  const [pitchNumber, setPitchNumber] = useState(1);
  const sttRef = useRef<SpeechmaticsRealtime | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const userIdRef = useRef<string>("");
  const threadIdRef = useRef<string>("");

  useEffect(() => {
    const init = async () => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      userIdRef.current = user.id;
      const name = user.user_metadata?.full_name?.split(" ")[0] || "candidate";

      // Load existing pitch count
      const existingHistory = await getPitchHistory(user.id);
      setPitchNumber(existingHistory.length + 1);

      // Get or create Backboard assistant
      let assistantId = await getUserAssistant(user.id);
      let tId = "";

      if (!assistantId) {
        // New user: create assistant + thread
        try {
          const session = await backboardAction("init_session", {
            name: `InterviewRoast - ${name}`,
          });
          assistantId = session.assistant_id;
          tId = session.thread_id;
          await saveUserAssistant(user.id, assistantId);
        } catch (e) {
          console.error("Failed to init Backboard session:", e);
        }
      } else {
        // Returning user: create new thread with existing assistant
        try {
          const thread = await backboardAction("create_thread", { assistant_id: assistantId });
          tId = thread.thread_id || thread.id;
        } catch (e) {
          console.error("Failed to create thread:", e);
        }
      }

      threadIdRef.current = tId;

      // Greet user with voice
      const greeting = `Okay ${name}, you have 30 seconds. Tell me about yourself?`;
      setCurrentTranscript(greeting);
      setPhase("greeting_speaking");
      try {
        const audio = await textToSpeech(greeting);
        await playAudio(audio);
      } catch (e) {
        console.error("TTS greeting error:", e);
      }
      setCurrentTranscript("");
      setPhase("idle");
    };

    init();
    return () => {
      sttRef.current?.stop();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [navigate]);

  const startTimer = useCallback(() => {
    setTimer(PITCH_DURATION);
    setShowTimer(true);
    timerRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          sttRef.current?.stop();
          setPhase("confirming");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const startListening = useCallback(async () => {
    setPhase("listening");
    setCurrentTranscript("");
    setRoastText("");
    setPitchScore(null);
    setScoreBreakdown(null);

    const stt = new SpeechmaticsRealtime({
      onPartialTranscript: (text) => setCurrentTranscript(text),
      onFinalTranscript: (text) => setCurrentTranscript(text),
      onError: (err) => {
        console.error("STT error:", err);
        toast.error("Speech recognition error. Try again.");
        setPhase("idle");
        if (timerRef.current) clearInterval(timerRef.current);
        setShowTimer(false);
      },
    });

    sttRef.current = stt;
    try {
      await stt.start();
      startTimer();
    } catch (e) {
      console.error("Failed to start STT:", e);
      toast.error("Could not access microphone");
      setPhase("idle");
    }
  }, [startTimer]);

  const handleConfirm = useCallback(async () => {
    const transcript = currentTranscript || "(no response)";
    setPhase("processing");
    setShowTimer(false);

    try {
      const history = await getPitchHistory(userIdRef.current);
      const result = await roastPitch(transcript, history);
      setRoastText(result.roast);
      setPitchScore(result.score);
      setScoreBreakdown(result.breakdown);

      await savePitchSession(userIdRef.current, pitchNumber, transcript, result.roast, result.score);
      setPitchNumber((prev) => prev + 1);

      // Store in Backboard (fire-and-forget)
      if (threadIdRef.current) {
        backboardAction("send_message", {
          thread_id: threadIdRef.current,
          content: `CANDIDATE'S ANSWER #${pitchNumber} (Score: ${result.score}/100):\n${transcript}\n\nROAST FEEDBACK:\n${result.roast}`,
        }).catch((e) => console.error("Backboard save error:", e));
      }

      setPhase("speaking");
      try {
        const audio = await textToSpeech(result.roast);
        await playAudio(audio);
      } catch (e) {
        console.error("TTS roast error:", e);
      }
      setPhase("idle");
    } catch (e) {
      console.error("Roast error:", e);
      toast.error(e instanceof Error ? e.message : "Failed to roast your pitch");
      setPhase("idle");
    }
  }, [currentTranscript, pitchNumber]);

  const handleReRecord = useCallback(() => {
    setCurrentTranscript("");
    if (timerRef.current) clearInterval(timerRef.current);
    setShowTimer(false);
    startListening();
  }, [startListening]);

  const handleOrbClick = useCallback(() => {
    if (phase === "speaking" || phase === "processing" || phase === "confirming" || phase === "greeting" || phase === "greeting_speaking") return;
    if (phase === "listening") {
      sttRef.current?.stop();
      if (timerRef.current) clearInterval(timerRef.current);
      setShowTimer(false);
      setPhase("confirming");
      return;
    }
    startListening();
  }, [phase, startListening]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-background px-6 relative">
      {/* Top bar */}
      <div className="absolute top-6 right-6 flex items-center gap-2">
        <button
          onClick={() => navigate("/history")}
          className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Score history"
        >
          <Clock className="w-5 h-5" />
        </button>
        <button
          onClick={() => navigate("/")}
          className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Back to home"
        >
          <Home className="w-5 h-5" />
        </button>
        <button
          onClick={handleSignOut}
          className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Sign out"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      {/* Timer */}
      <AnimatePresence>
        {showTimer && (
          <motion.div
            className="absolute top-8 left-1/2 -translate-x-1/2"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <span className={`text-4xl font-serif font-bold ${timer <= 10 ? "text-destructive" : "text-foreground"}`}>
              {timer}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status text */}
      <AnimatePresence mode="wait">
        <motion.p
          key={phase + roastText.slice(0, 20)}
          className="text-lg md:text-xl text-foreground text-center max-w-sm mb-10 font-sans leading-relaxed"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.4 }}
        >
          {phase === "greeting" && "Setting up..."}
          {phase === "greeting_speaking" && "Welcome"}
          {phase === "idle" && !roastText && "Tap the orb when you're ready"}
          {phase === "idle" && roastText && "Ready for another round? Tap to pitch again."}
          {phase === "listening" && "Pitch it. Go."}
          {phase === "confirming" && "Did we get that right?"}
          {phase === "processing" && "Preparing your roast..."}
          {phase === "speaking" && "Here's your feedback..."}
        </motion.p>
      </AnimatePresence>

      {/* Orb */}
      <GlowingOrb
        size={200}
        onClick={handleOrbClick}
        isActive={phase === "speaking" || phase === "listening" || phase === "greeting_speaking"}
        isPulsing={phase === "idle"}
      />

      {/* Status indicator */}
      <AnimatePresence mode="wait">
        <motion.div
          key={phase}
          className="mt-10 flex items-center gap-2 text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {phase === "listening" ? (
            <>
              <Mic className="w-4 h-4 text-primary animate-pulse" />
              <span className="text-xs font-sans">Listening...</span>
            </>
          ) : phase === "greeting_speaking" || phase === "speaking" ? (
            <span className="text-xs font-sans">Speaking...</span>
          ) : phase === "processing" ? (
            <span className="text-xs font-sans">Thinking...</span>
          ) : phase === "confirming" ? (
            <span className="text-xs font-sans">Confirm your pitch</span>
          ) : (
            <>
              <MicOff className="w-4 h-4" />
              <span className="text-xs font-sans">Tap to speak</span>
            </>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Live transcript */}
      {currentTranscript && (
        <motion.p
          className="mt-4 text-sm text-muted-foreground italic text-center max-w-xs font-sans"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          "{currentTranscript}"
        </motion.p>
      )}

      {/* Score display */}
      {pitchScore !== null && phase === "idle" && (
        <div className="mt-6">
          <PitchScore score={pitchScore} breakdown={scoreBreakdown ?? undefined} />
        </div>
      )}

      {/* Roast display */}
      {roastText && phase === "idle" && (
        <motion.div
          className="mt-4 max-w-sm w-full p-4 rounded-xl bg-card border border-border"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-sm text-card-foreground font-sans leading-relaxed">{roastText}</p>
        </motion.div>
      )}

      {/* Confirm / Re-record buttons */}
      {phase === "confirming" && (
        <motion.div className="mt-6 flex gap-4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <button
            onClick={handleConfirm}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-sans hover:opacity-90 transition-opacity"
          >
            <Check className="w-4 h-4" />
            Confirm
          </button>
          <button
            onClick={handleReRecord}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted text-muted-foreground text-sm font-sans hover:bg-accent transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Re-record
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default Pitch;
