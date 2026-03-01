import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import GlowingOrb from "@/components/GlowingOrb";
import { Mic, MicOff, Check, RotateCcw, Home } from "lucide-react";
import { textToSpeech, playAudio, backboardAction, roastPitch } from "@/services/api";
import { SpeechmaticsRealtime } from "@/services/speechmatics";
import { toast } from "sonner";

type Phase = "greeting" | "idle" | "listening" | "confirming" | "processing" | "speaking";

const PITCH_DURATION = 30;

const Pitch = () => {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("greeting");
  const [currentTranscript, setCurrentTranscript] = useState("");
  const [roastText, setRoastText] = useState("");
  const [userName, setUserName] = useState("");
  const [timer, setTimer] = useState(PITCH_DURATION);
  const [showTimer, setShowTimer] = useState(false);
  const sttRef = useRef<SpeechmaticsRealtime | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const assistantIdRef = useRef<string>("");
  const threadIdRef = useRef<string>("");

  useEffect(() => {
    const init = async () => {
      const name = "founder";
      setUserName(name);

      // Initialize or restore Backboard assistant
      let aId = localStorage.getItem("pitchroast_assistant_id") || "";
      let tId = localStorage.getItem("pitchroast_thread_id") || "";

      if (!aId) {
        try {
          const assistant = await backboardAction("create_assistant", {
            name: `PitchRoast - ${name}`,
            system_prompt: `You are PitchRoast, a brutally honest interview coach. You remember every pitch this founder has given you. Track their progress, identify recurring weaknesses, and get progressively more specific with your feedback. Be merciless but constructive.`,
          });
          aId = assistant.assistant_id;
          localStorage.setItem("pitchroast_assistant_id", aId);
        } catch (e) {
          console.error("Failed to create assistant:", e);
        }
      }

      if (!tId && aId) {
        try {
          const thread = await backboardAction("create_thread", { assistant_id: aId });
          tId = thread.thread_id;
          localStorage.setItem("pitchroast_thread_id", tId);
        } catch (e) {
          console.error("Failed to create thread:", e);
        }
      }

      assistantIdRef.current = aId;
      threadIdRef.current = tId;

      // Greet user with voice
      const greeting = `Okay ${name}, you have 30 seconds. Tell me about yourself?`;
      setPhase("speaking");
      try {
        const audio = await textToSpeech(greeting);
        await playAudio(audio);
      } catch (e) {
        console.error("TTS greeting error:", e);
      }
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
          // Time's up — stop listening
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
      // Get AI roast
      const roast = await roastPitch(transcript);
      setRoastText(roast);

      // Store in Backboard for persistent memory
      if (threadIdRef.current) {
        try {
          await backboardAction("send_message", {
            thread_id: threadIdRef.current,
            content: `FOUNDER'S PITCH:\n${transcript}\n\nROAST FEEDBACK:\n${roast}`,
          });
        } catch (e) {
          console.error("Backboard save error:", e);
        }
      }

      // Speak the roast
      setPhase("speaking");
      try {
        const audio = await textToSpeech(roast);
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
  }, [currentTranscript]);

  const handleReRecord = useCallback(() => {
    setCurrentTranscript("");
    if (timerRef.current) clearInterval(timerRef.current);
    setShowTimer(false);
    startListening();
  }, [startListening]);

  const handleOrbClick = useCallback(() => {
    if (phase === "speaking" || phase === "processing" || phase === "confirming" || phase === "greeting") return;
    if (phase === "listening") {
      sttRef.current?.stop();
      if (timerRef.current) clearInterval(timerRef.current);
      setShowTimer(false);
      setPhase("confirming");
      return;
    }
    startListening();
  }, [phase, startListening]);

  const handleBack = () => {
    navigate("/");
  };

  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-background px-6 relative">
      {/* Back button */}
      <button
        onClick={handleBack}
        className="absolute top-6 right-6 p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        aria-label="Back to home"
      >
        <Home className="w-5 h-5" />
      </button>

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
          {phase === "idle" && !roastText && "Tap the orb to pitch"}
          {phase === "idle" && roastText && "Ready for another round? Tap to pitch again."}
          {phase === "listening" && "Pitch it. Go."}
          {phase === "confirming" && "Did we get that right?"}
          {phase === "processing" && "Preparing your roast..."}
          {phase === "speaking" && "Listening to your roast..."}
        </motion.p>
      </AnimatePresence>

      {/* Orb */}
      <GlowingOrb
        size={200}
        onClick={handleOrbClick}
        isActive={phase === "speaking" || phase === "listening"}
        isPulsing={phase === "idle"}
      />

      {/* Status indicator */}
      <motion.div
        className="mt-10 flex items-center gap-2 text-muted-foreground"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        {phase === "listening" ? (
          <>
            <Mic className="w-4 h-4 text-primary animate-pulse" />
            <span className="text-xs font-sans">Listening...</span>
          </>
        ) : phase === "speaking" ? (
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

      {/* Roast display */}
      {roastText && phase === "idle" && (
        <motion.div
          className="mt-6 max-w-sm w-full p-4 rounded-xl bg-card border border-border"
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
