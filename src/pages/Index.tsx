import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import GlowingOrb from "@/components/GlowingOrb";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-background px-6 relative overflow-hidden">
      {/* Subtle background gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at 50% 40%, hsl(var(--orb-purple) / 0.06) 0%, transparent 60%)",
        }}
      />

      <motion.div
        className="flex flex-col items-center gap-8 z-10"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        {/* Hero text */}
        <motion.h1
          className="text-5xl md:text-7xl font-serif font-medium text-foreground text-center leading-tight"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          Craft your pitch
        </motion.h1>

        <motion.p
          className="text-muted-foreground text-center text-base md:text-lg max-w-xs font-sans"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          Get brutally honest AI feedback on your startup pitch
        </motion.p>

        {/* Orb */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="my-8"
        >
          <GlowingOrb size={220} onClick={() => navigate("/auth")} />
        </motion.div>

        <motion.p
          className="text-muted-foreground text-sm font-sans animate-pulse"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1 }}
        >
          Tap to begin
        </motion.p>
      </motion.div>
    </div>
  );
};

export default Index;
